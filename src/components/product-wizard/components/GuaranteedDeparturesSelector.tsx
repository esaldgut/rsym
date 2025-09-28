'use client';

import { useState, useCallback } from 'react';
import { LocationMultiSelector } from '@/components/location/LocationMultiSelector';
import { DateRangeInput } from '@/components/ui/DateRangeInput';
import type { GuaranteedDeparturesInput, LocationInput, RegularDepartureInput, SpecificDepartureInput, DateRangeInput as DateRangeType } from '@/lib/graphql/types';

interface GuaranteedDeparturesSelectorProps {
  departures: GuaranteedDeparturesInput;
  onChange: (departures: GuaranteedDeparturesInput) => void;
  error?: string;
}

type WeekDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

const WEEK_DAYS: { value: WeekDay; label: string; short: string }[] = [
  { value: 'MONDAY', label: 'Lunes', short: 'L' },
  { value: 'TUESDAY', label: 'Martes', short: 'M' },
  { value: 'WEDNESDAY', label: 'Miércoles', short: 'X' },
  { value: 'THURSDAY', label: 'Jueves', short: 'J' },
  { value: 'FRIDAY', label: 'Viernes', short: 'V' },
  { value: 'SATURDAY', label: 'Sábado', short: 'S' },
  { value: 'SUNDAY', label: 'Domingo', short: 'D' }
];

export function GuaranteedDeparturesSelector({
  departures,
  onChange,
  error
}: GuaranteedDeparturesSelectorProps) {
  const [activeTab, setActiveTab] = useState<'regular' | 'specific'>('regular');

  // Extraer datos de la nueva estructura
  const regularDepartures = departures.regular_departures || [];
  const specificDepartures = departures.specific_departures || [];

  // Agregar nueva salida regular
  const addRegularDeparture = useCallback(() => {
    const newRegular: RegularDepartureInput = {
      origin: { place: '', placeSub: '', coordinates: undefined },
      days: []
    };
    onChange({
      ...departures,
      regular_departures: [...regularDepartures, newRegular]
    });
  }, [departures, regularDepartures, onChange]);

  // Actualizar salida regular específica
  const updateRegularDeparture = useCallback((index: number, updates: Partial<RegularDepartureInput>) => {
    const newRegulars = [...regularDepartures];
    newRegulars[index] = { ...newRegulars[index], ...updates };
    onChange({
      ...departures,
      regular_departures: newRegulars
    });
  }, [departures, regularDepartures, onChange]);

  // Remover salida regular
  const removeRegularDeparture = useCallback((index: number) => {
    const newRegulars = regularDepartures.filter((_, i) => i !== index);
    onChange({
      ...departures,
      regular_departures: newRegulars
    });
  }, [departures, regularDepartures, onChange]);

  // Agregar nueva salida específica
  const addSpecificDeparture = useCallback(() => {
    const newSpecific: SpecificDepartureInput = {
      origin: { place: '', placeSub: '', coordinates: undefined },
      date_ranges: []
    };
    onChange({
      ...departures,
      specific_departures: [...specificDepartures, newSpecific]
    });
  }, [departures, specificDepartures, onChange]);

  // Actualizar salida específica
  const updateSpecificDeparture = useCallback((index: number, updates: Partial<SpecificDepartureInput>) => {
    const newSpecifics = [...specificDepartures];
    newSpecifics[index] = { ...newSpecifics[index], ...updates };
    onChange({
      ...departures,
      specific_departures: newSpecifics
    });
  }, [departures, specificDepartures, onChange]);

  // Remover salida específica
  const removeSpecificDeparture = useCallback((index: number) => {
    const newSpecifics = specificDepartures.filter((_, i) => i !== index);
    onChange({
      ...departures,
      specific_departures: newSpecifics
    });
  }, [departures, specificDepartures, onChange]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Salidas Garantizadas</h3>
        <p className="text-sm text-gray-600">
          Configura desde qué ciudades y cuándo salen tus tours. Cada ciudad tiene sus propios días y horarios independientes.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('regular')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'regular'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>🔄</span>
            Salidas Regulares ({regularDepartures.length})
          </button>
          <button
            onClick={() => setActiveTab('specific')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'specific'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>📅</span>
            Fechas Específicas ({specificDepartures.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'regular' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Salidas Regulares</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                Define salidas que se repiten semanalmente. Cada ciudad tiene sus propios días de salida.
              </p>
            </div>

            {/* Estado vacío */}
            {regularDepartures.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin salidas regulares configuradas</h3>
                <p className="text-gray-500 mb-6">
                  Agrega ciudades de salida con sus días específicos de operación.
                </p>
                <button
                  type="button"
                  onClick={addRegularDeparture}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Primera Ciudad de Salida
                </button>
              </div>
            )}

            {/* Lista de salidas regulares */}
            <div className="space-y-4">
              {regularDepartures.map((departure, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Ciudad de Salida {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeRegularDeparture(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar ciudad de salida"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Ciudad de origen */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad de Salida
                    </label>
                    {departure.origin.place ? (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900 break-words">{departure.origin.place}</p>
                            {departure.origin.placeSub && (
                              <p className="text-sm text-gray-600 break-words">{departure.origin.placeSub}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateRegularDeparture(index, { origin: { place: '', placeSub: '', coordinates: undefined } })}
                          className="text-gray-400 hover:text-gray-600"
                          title="Cambiar ciudad"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <LocationMultiSelector
                        selectedLocations={[]}
                        onChange={(locations: LocationInput[]) => {
                          if (locations.length > 0) {
                            updateRegularDeparture(index, { origin: locations[0] });
                          }
                        }}
                        allowMultiple={false}
                        minSelections={1}
                        maxSelections={1}
                        label=""
                        helpText="Selecciona la ciudad desde donde salen estos tours"
                        context="departure"
                      />
                    )}
                  </div>

                  {/* Días de la semana para esta ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Días de Salida para {departure.origin.place || 'esta ciudad'}
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {WEEK_DAYS.map((day) => {
                        const isSelected = departure.days.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              const newDays = isSelected
                                ? departure.days.filter(d => d !== day.value)
                                : [...departure.days, day.value];
                              updateRegularDeparture(index, { days: newDays });
                            }}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                              isSelected
                                ? 'bg-purple-100 border-purple-500 text-purple-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-center">
                              <div className={`font-bold text-sm ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                                {day.short}
                              </div>
                              <div className={`text-xs mt-1 ${isSelected ? 'text-purple-600' : 'text-gray-500'}`}>
                                {day.label}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Selecciona los días específicos para esta ciudad
                    </p>
                  </div>

                  {/* Preview de esta salida regular */}
                  {departure.origin.place && departure.days.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h5 className="font-medium text-green-800 mb-1">Vista Previa</h5>
                      <div className="text-sm text-green-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{departure.origin.place}</span>
                        <span className="text-green-600">
                          → {departure.days.map(d => WEEK_DAYS.find(wd => wd.value === d)?.short).join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Botón para agregar otra salida regular */}
              {regularDepartures.length > 0 && (
                <button
                  type="button"
                  onClick={addRegularDeparture}
                  className="w-full border-2 border-dashed border-purple-300 rounded-xl p-6 text-purple-600 hover:text-purple-700 hover:border-purple-400 transition-colors flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Otra Ciudad de Salida
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'specific' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Fechas Específicas</span>
              </div>
              <p className="text-amber-700 text-sm mt-1">
                Define salidas en rangos de fechas específicos. Ideal para temporadas, eventos o períodos limitados. Cada ciudad puede tener rangos independientes.
              </p>
            </div>

            {/* Estado vacío */}
            {specificDepartures.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin fechas específicas configuradas</h3>
                <p className="text-gray-500 mb-6">
                  Agrega ciudades con rangos de fechas para tours especiales, temporadas limitadas o eventos únicos.
                </p>
                <button
                  type="button"
                  onClick={addSpecificDeparture}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Primera Ciudad con Rangos de Fechas
                </button>
              </div>
            )}

            {/* Lista de salidas específicas */}
            <div className="space-y-4">
              {specificDepartures.map((departure, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Salida Específica {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeSpecificDeparture(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar salida específica"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Ciudad de origen */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad de Salida
                    </label>
                    {departure.origin.place ? (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900 break-words">{departure.origin.place}</p>
                            {departure.origin.placeSub && (
                              <p className="text-sm text-gray-600 break-words">{departure.origin.placeSub}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateSpecificDeparture(index, { origin: { place: '', placeSub: '', coordinates: undefined } })}
                          className="text-gray-400 hover:text-gray-600"
                          title="Cambiar ciudad"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <LocationMultiSelector
                        selectedLocations={[]}
                        onChange={(locations: LocationInput[]) => {
                          if (locations.length > 0) {
                            updateSpecificDeparture(index, { origin: locations[0] });
                          }
                        }}
                        allowMultiple={false}
                        minSelections={1}
                        maxSelections={1}
                        label=""
                        helpText="Selecciona la ciudad para los rangos de fechas específicos"
                        context="departure"
                      />
                    )}
                  </div>

                  {/* Rangos de fechas específicas para esta ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rangos de Fechas desde {departure.origin.place || 'esta ciudad'}
                    </label>
                    <div className="space-y-4">
                      {departure.date_ranges.map((dateRange, rangeIndex) => (
                        <div key={rangeIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-700">
                              Rango {rangeIndex + 1}
                            </h5>
                            <button
                              type="button"
                              onClick={() => {
                                const newRanges = departure.date_ranges.filter((_, i) => i !== rangeIndex);
                                updateSpecificDeparture(index, { date_ranges: newRanges });
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar rango"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <DateRangeInput
                            value={dateRange}
                            onChange={(newRange) => {
                              const newRanges = [...departure.date_ranges];
                              newRanges[rangeIndex] = newRange;
                              updateSpecificDeparture(index, { date_ranges: newRanges });
                            }}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const newRange: DateRangeType = {
                            start_datetime: '',
                            end_datetime: ''
                          };
                          const newRanges = [...departure.date_ranges, newRange];
                          updateSpecificDeparture(index, { date_ranges: newRanges });
                        }}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Agregar rango de fechas
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Botón para agregar otra salida específica */}
              {specificDepartures.length > 0 && (
                <button
                  type="button"
                  onClick={addSpecificDeparture}
                  className="w-full border-2 border-dashed border-purple-300 rounded-xl p-6 text-purple-600 hover:text-purple-700 hover:border-purple-400 transition-colors flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Otra Ciudad con Rangos de Fechas
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}