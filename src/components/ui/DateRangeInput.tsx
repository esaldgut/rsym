'use client';

import { useState } from 'react';
import { DateInput } from './DateInput';
import type { DateRangeInput as DateRangeType } from '@/lib/graphql/types';

interface DateRangeInputProps {
  value: DateRangeType;
  onChange: (value: DateRangeType) => void;
  label?: string;
  error?: string;
  className?: string;
  min?: string;
}

export function DateRangeInput({
  value,
  onChange,
  label,
  error,
  className = '',
  min
}: DateRangeInputProps) {
  const [isSingleDate, setIsSingleDate] = useState(
    value.start_datetime === value.end_datetime && value.start_datetime !== ''
  );

  const handleStartDateChange = (newStartDate: string) => {
    const newValue = {
      start_datetime: newStartDate,
      end_datetime: isSingleDate ? newStartDate : value.end_datetime
    };
    onChange(newValue);
  };

  const handleEndDateChange = (newEndDate: string) => {
    onChange({
      ...value,
      end_datetime: newEndDate
    });
  };

  const handleSingleDateToggle = (checked: boolean) => {
    setIsSingleDate(checked);
    if (checked && value.start_datetime) {
      // Si se activa fecha única, igualar end_datetime a start_datetime
      onChange({
        ...value,
        end_datetime: value.start_datetime
      });
    }
  };

  const formatDateRange = () => {
    if (!value.start_datetime) return '';

    if (isSingleDate || value.start_datetime === value.end_datetime) {
      const date = new Date(value.start_datetime);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } else if (value.end_datetime) {
      const startDate = new Date(value.start_datetime);
      const endDate = new Date(value.end_datetime);
      return `${startDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      })} - ${endDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })}`;
    }
    return '';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Toggle para fecha única */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="single-date-toggle"
          checked={isSingleDate}
          onChange={(e) => handleSingleDateToggle(e.target.checked)}
          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
        <label htmlFor="single-date-toggle" className="text-sm text-gray-700">
          Fecha única (mismo día)
        </label>
      </div>

      {/* Inputs de fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateInput
          value={value.start_datetime}
          onChange={handleStartDateChange}
          label="Fecha de inicio"
          min={min}
          className="w-full"
        />

        {!isSingleDate && (
          <DateInput
            value={value.end_datetime}
            onChange={handleEndDateChange}
            label="Fecha de fin"
            min={value.start_datetime || min}
            className="w-full"
          />
        )}
      </div>

      {/* Vista previa del rango */}
      {value.start_datetime && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-sm">
              {isSingleDate ? 'Fecha única:' : 'Rango de fechas:'}
            </span>
            <span className="font-semibold">
              {formatDateRange()}
            </span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}