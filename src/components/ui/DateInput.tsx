'use client';

import { useState, useEffect } from 'react';
import { cognitoDateToHTML, htmlDateToCognito, formatDateForDisplay } from '@/utils/date-format-helpers';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  min?: string;
  max?: string;
}

/**
 * Componente de entrada de fecha que muestra DD/MM/YYYY
 * pero internamente maneja YYYY-MM-DD para compatibilidad con HTML5
 */
export function DateInput({
  value,
  onChange,
  label,
  placeholder = 'DD/MM/AAAA',
  required = false,
  error,
  className = '',
  min,
  max
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showNativeInput, setShowNativeInput] = useState(false);

  useEffect(() => {
    // Si el valor está en formato YYYY-MM-DD, convertirlo para mostrar
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      setDisplayValue(`${day}/${month}/${year}`);
    } else if (value) {
      setDisplayValue(value);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);

    // Auto-formatear mientras el usuario escribe
    let formatted = input.replace(/\D/g, ''); // Solo números

    if (formatted.length >= 2) {
      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    }
    if (formatted.length >= 5) {
      formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
    }

    if (formatted !== input) {
      setDisplayValue(formatted);
    }

    // Validar si es una fecha completa DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(formatted)) {
      const [day, month, year] = formatted.split('/');
      const htmlDate = `${year}-${month}-${day}`;
      onChange(htmlDate);
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const htmlDate = e.target.value;
    onChange(htmlDate);
    setShowNativeInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir solo números, backspace, delete, tab, y /
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'];
    const isNumber = /^\d$/.test(e.key);
    const isSlash = e.key === '/';

    if (!isNumber && !isSlash && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const baseInputClasses = 'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300';
  const errorClasses = error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {!showNativeInput ? (
          <>
            <input
              type="text"
              value={displayValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsEditing(true)}
              onBlur={() => setIsEditing(false)}
              placeholder={placeholder}
              maxLength={10}
              className={`${baseInputClasses} ${errorClasses}`}
              required={required}
            />

            {/* Botón para mostrar selector nativo */}
            <button
              type="button"
              onClick={() => setShowNativeInput(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Abrir calendario"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Mostrar fecha formateada cuando no está editando */}
            {!isEditing && displayValue && (
              <div className="text-xs text-gray-500 mt-1">
                {formatDateForDisplay(displayValue)}
              </div>
            )}
          </>
        ) : (
          <input
            type="date"
            value={value}
            onChange={handleNativeChange}
            onBlur={() => setShowNativeInput(false)}
            className={`${baseInputClasses} ${errorClasses}`}
            required={required}
            min={min}
            max={max}
            autoFocus
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}