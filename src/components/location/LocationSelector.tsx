'use client';

import { useState, useCallback } from 'react';
import { LocationSearch } from '@/components/location/LocationSearch';
import type { CircuitLocation } from '@/types/location';

interface LocationSelectorProps {
  /** Ubicación seleccionada actualmente */
  selectedLocation?: CircuitLocation | null;
  
  /** Callback cuando se selecciona una ubicación */
  onLocationSelect: (location: CircuitLocation) => void;
  
  /** Callback cuando se remueve la ubicación */
  onLocationRemove?: () => void;
  
  /** Texto del placeholder para la búsqueda */
  placeholder?: string;
  
  /** Países permitidos en la búsqueda */
  countries?: string[];
  
  /** Número máximo de resultados */
  maxResults?: number;
  
  /** Clases CSS adicionales */
  className?: string;
  
  /** Si es requerido */
  required?: boolean;
  
  /** Si está deshabilitado */
  disabled?: boolean;
  
  /** Mostrar coordenadas en los resultados */
  showCoordinates?: boolean;
  
  /** Etiqueta del campo */
  label?: string;
  
  /** Texto de ayuda */
  helpText?: string;
  
  /** Mensaje de error */
  error?: string;
}

export function LocationSelector({
  selectedLocation,
  onLocationSelect,
  onLocationRemove,
  placeholder = 'Buscar ubicación para tu producto...',
  countries = ['USA', 'CAN', 'GBR', 'DEU', 'FRA', 'ITA', 'ESP', 'JPN', 'CHN', 'IND', 'BRA', 'MEX', 'AUS', 'NLD', 'BEL', 'CHE', 'SWE', 'NOR', 'DNK', 'FIN', 'AUT', 'GRC', 'PRT', 'IRL', 'POL', 'RUS', 'TUR', 'SAU', 'ARE', 'ZAF', 'EGY', 'NGA', 'KEN', 'ETH', 'GHA', 'MAR', 'DZA', 'TUN', 'ARG', 'CHL', 'COL', 'PER', 'VEN', 'ECU', 'NZL', 'SGP', 'MYS', 'IDN', 'THA', 'VNM', 'PHL', 'KOR', 'HKG', 'TWN', 'ISR', 'ARE', 'QAT', 'KWT', 'OMN', 'PAK', 'BGD', 'LKA', 'UKR', 'ROU', 'HUN', 'CZE', 'SVK', 'BGR', 'HRV', 'SRB', 'SVN', 'LTU', 'LVA', 'EST', 'ISL', 'LUX', 'CYP', 'MLT', 'JOR', 'LBN', 'IRQ', 'IRN', 'KAZ', 'UZB', 'AZE', 'GEO', 'ARM', 'TZA', 'UGA', 'MOZ', 'ZMB', 'MWI', 'AGO', 'CMR', 'SEN', 'CIV', 'GIN', 'NGA', 'ZAF', 'KEN'],
  maxResults = 20,
  className = '',
  required = false,
  disabled = false,
  showCoordinates = false,
  label,
  helpText,
  error
}: LocationSelectorProps) {
  const [isSearchVisible, setIsSearchVisible] = useState(!selectedLocation);

  // Manejar selección de ubicación
  const handleLocationSelect = useCallback((location: CircuitLocation) => {
    onLocationSelect(location);
    setIsSearchVisible(false);
  }, [onLocationSelect]);

  // Manejar remoción de ubicación
  const handleLocationRemove = useCallback(() => {
    onLocationRemove?.();
    setIsSearchVisible(true);
  }, [onLocationRemove]);

  // Cambiar a modo de búsqueda
  const handleEditLocation = useCallback(() => {
    setIsSearchVisible(true);
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Ubicación seleccionada */}
      {selectedLocation && !isSearchVisible ? (
        <div className={`border rounded-xl p-4 bg-white ${error ? 'border-red-300' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Icono de ubicación */}
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Información de la ubicación */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  {selectedLocation.place}
                </h4>
                
                {selectedLocation.placeSub && (
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {selectedLocation.placeSub}
                  </p>
                )}
                
                {selectedLocation.complementaryDescription && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {selectedLocation.complementaryDescription}
                  </p>
                )}
                
                {showCoordinates && (
                  <p className="text-xs text-gray-400 mt-2 font-mono">
                    {selectedLocation.coordinates[1].toFixed(6)}, {selectedLocation.coordinates[0].toFixed(6)}
                  </p>
                )}
                
                <div className="flex items-center mt-3 space-x-3">
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Ubicación confirmada
                  </span>
                </div>
              </div>
            </div>
            
            {/* Acciones */}
            {!disabled && (
              <div className="flex space-x-2 ml-4">
                <button
                  type="button"
                  onClick={handleEditLocation}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editar ubicación"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                {onLocationRemove && (
                  <button
                    type="button"
                    onClick={handleLocationRemove}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover ubicación"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Componente de búsqueda */
        <div className="space-y-2">
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            placeholder={placeholder}
            countries={countries}
            maxResults={maxResults}
            showCoordinates={showCoordinates}
            autoFocus={isSearchVisible && !!selectedLocation}
            defaultValue=""
            className={error ? 'border-red-300' : ''}
          />
          
          {selectedLocation && isSearchVisible && (
            <button
              type="button"
              onClick={() => setIsSearchVisible(false)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancelar y mantener ubicación actual
            </button>
          )}
        </div>
      )}

      {/* Texto de ayuda */}
      {helpText && !error && (
        <p className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      {/* Mensaje de error */}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
