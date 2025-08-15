'use client';

import React, { useState } from 'react';
import { ServiceSchedule } from '@/lib/auth/user-attributes';

interface ServiceScheduleSelectorProps {
  schedule: ServiceSchedule[];
  onChange: (schedule: ServiceSchedule[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 'mo', label: 'Lunes', short: 'Lun' },
  { value: 'tu', label: 'Martes', short: 'Mar' },
  { value: 'we', label: 'Miércoles', short: 'Mié' },
  { value: 'th', label: 'Jueves', short: 'Jue' },
  { value: 'fr', label: 'Viernes', short: 'Vie' },
  { value: 'sa', label: 'Sábado', short: 'Sáb' },
  { value: 'su', label: 'Domingo', short: 'Dom' },
] as const;

// Generar opciones de hora cada 30 minutos
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push(time);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function ServiceScheduleSelector({ schedule, onChange }: ServiceScheduleSelectorProps) {
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    new Set(schedule.map(s => s.day))
  );

  const toggleDay = (day: string) => {
    const newSelectedDays = new Set(selectedDays);
    if (newSelectedDays.has(day)) {
      newSelectedDays.delete(day);
      // Remover del schedule
      onChange(schedule.filter(s => s.day !== day));
    } else {
      newSelectedDays.add(day);
      // Agregar al schedule con horario por defecto
      onChange([
        ...schedule,
        {
          day: day as ServiceSchedule['day'],
          sd: '09:00',
          ed: '18:00'
        }
      ]);
    }
    setSelectedDays(newSelectedDays);
  };

  const updateDaySchedule = (
    day: string,
    field: 'sd' | 'ed',
    value: string
  ) => {
    onChange(
      schedule.map(s =>
        s.day === day ? { ...s, [field]: value } : s
      )
    );
  };

  const applyToAll = () => {
    // Encontrar el primer día con horario configurado
    const firstSchedule = schedule[0];
    if (firstSchedule) {
      onChange(
        schedule.map(s => ({
          ...s,
          sd: firstSchedule.sd,
          ed: firstSchedule.ed
        }))
      );
    }
  };

  const setBusinessHours = () => {
    // Establecer horario de oficina estándar (9am - 6pm) de lunes a viernes
    const businessDays = ['mo', 'tu', 'we', 'th', 'fr'];
    const newSchedule: ServiceSchedule[] = businessDays.map(day => ({
      day: day as ServiceSchedule['day'],
      sd: '09:00',
      ed: '18:00'
    }));
    onChange(newSchedule);
    setSelectedDays(new Set(businessDays));
  };

  const setFullWeek = () => {
    // Establecer todos los días con horario estándar
    const allDays = DAYS_OF_WEEK.map(d => d.value);
    const newSchedule: ServiceSchedule[] = allDays.map(day => ({
      day: day as ServiceSchedule['day'],
      sd: '09:00',
      ed: '18:00'
    }));
    onChange(newSchedule);
    setSelectedDays(new Set(allDays));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Horarios de Servicio
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={setBusinessHours}
            className="text-xs text-pink-600 hover:text-pink-700 font-medium"
          >
            Lun-Vie
          </button>
          <button
            type="button"
            onClick={setFullWeek}
            className="text-xs text-pink-600 hover:text-pink-700 font-medium"
          >
            Toda la semana
          </button>
          {schedule.length > 1 && (
            <button
              type="button"
              onClick={applyToAll}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Aplicar a todos
            </button>
          )}
        </div>
      </div>

      {/* Selector de días */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map(day => (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            className={`
              py-2 px-1 text-xs font-medium rounded-lg transition-all
              ${selectedDays.has(day.value)
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            <span className="hidden sm:inline">{day.label}</span>
            <span className="sm:hidden">{day.short}</span>
          </button>
        ))}
      </div>

      {/* Configuración de horarios por día */}
      {schedule.length > 0 ? (
        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
          {schedule
            .sort((a, b) => {
              const dayOrder = DAYS_OF_WEEK.map(d => d.value);
              return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
            })
            .map(daySchedule => {
              const dayInfo = DAYS_OF_WEEK.find(d => d.value === daySchedule.day);
              return (
                <div key={daySchedule.day} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 w-24">
                    {dayInfo?.label}
                  </span>
                  <div className="flex items-center space-x-2 flex-1">
                    <select
                      value={daySchedule.sd}
                      onChange={(e) => updateDaySchedule(daySchedule.day, 'sd', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      {TIME_OPTIONS.map(time => (
                        <option key={`${daySchedule.day}-sd-${time}`} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-500">a</span>
                    <select
                      value={daySchedule.ed}
                      onChange={(e) => updateDaySchedule(daySchedule.day, 'ed', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      {TIME_OPTIONS.map(time => (
                        <option key={`${daySchedule.day}-ed-${time}`} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-500">
            Selecciona los días de servicio
          </p>
        </div>
      )}

      {/* Resumen de horas totales */}
      {schedule.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Resumen:</span> {schedule.length} días configurados
            {schedule.length === 7 && ' (servicio todos los días)'}
            {schedule.length === 5 && 
              schedule.every(s => ['mo', 'tu', 'we', 'th', 'fr'].includes(s.day)) &&
              ' (horario de oficina)'
            }
          </p>
        </div>
      )}
    </div>
  );
}