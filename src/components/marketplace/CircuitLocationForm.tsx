'use client';

import { useState } from 'react';
import { LocationSelector } from '@/components/location/LocationSelector';
import { useLocationSelector } from '@/hooks/useLocationSelector';
import type { CircuitLocation } from '@/types/location';

interface CircuitLocationFormProps {
  /** Ubicaciones iniciales del circuit */
  initialLocations?: CircuitLocation[];
  
  /** Callback cuando cambian las ubicaciones */
  onLocationsChange: (locations: CircuitLocation[]) => void;
  
  /** Número mínimo de ubicaciones requeridas */
  minLocations?: number;
  
  /** Número máximo de ubicaciones permitidas */
  maxLocations?: number;
  
  /** Si está deshabilitado */
  disabled?: boolean;
  
  /** Mensajes de error externos */
  externalErrors?: string[];
}

/**
 * Componente específico para seleccionar múltiples ubicaciones al crear circuits
 * Permite agregar múltiples paradas en un recorrido turístico
 */
export function CircuitLocationForm({
  initialLocations = [],
  onLocationsChange,
  minLocations = 2,
  maxLocations = 10,
  disabled = false,
  externalErrors = []
}: CircuitLocationFormProps) {
  const [locations, setLocations] = useState<CircuitLocation[]>(initialLocations);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Validar circuit locations
  const validateCircuitLocations = (locs: CircuitLocation[]): string | null => {
    if (locs.length < minLocations) {
      return `Un circuit debe tener al menos ${minLocations} ubicaciones`;
    }
    
    if (locs.length > maxLocations) {
      return `Un circuit no puede tener más de ${maxLocations} ubicaciones`;
    }
    
    // Validar que no hay ubicaciones duplicadas
    const uniquePlaces = new Set(locs.map(loc => loc.place.toLowerCase().trim()));
    if (uniquePlaces.size !== locs.length) {
      return 'No puedes agregar ubicaciones duplicadas al circuit';
    }
    
    return null;
  };

  // Agregar nueva ubicación
  const handleAddLocation = (location: CircuitLocation) => {
    const newLocations = [...locations, location];
    const error = validateCircuitLocations(newLocations);
    
    if (error) {
      setGlobalError(error);
      return;
    }
    
    setLocations(newLocations);
    setGlobalError(null);
    onLocationsChange(newLocations);
  };

  // Editar ubicación existente
  const handleEditLocation = (index: number, location: CircuitLocation) => {
    const newLocations = [...locations];
    newLocations[index] = location;
    
    const error = validateCircuitLocations(newLocations);
    if (error) {
      setGlobalError(error);
      return;
    }
    
    setLocations(newLocations);
    setGlobalError(null);
    setCurrentEditIndex(null);
    onLocationsChange(newLocations);
  };

  // Remover ubicación
  const handleRemoveLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index);
    setLocations(newLocations);
    setGlobalError(null);
    onLocationsChange(newLocations);
  };

  // Reordenar ubicaciones
  const handleMoveLocation = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= locations.length) return;
    
    const newLocations = [...locations];
    const [movedItem] = newLocations.splice(fromIndex, 1);
    newLocations.splice(toIndex, 0, movedItem);
    
    setLocations(newLocations);
    onLocationsChange(newLocations);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Ubicaciones del Circuit
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Agrega las paradas de tu recorrido turístico en orden. Mínimo {minLocations}, máximo {maxLocations} ubicaciones.
        </p>
      </div>

      {/* Lista de ubicaciones existentes */}
      {locations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Paradas del Circuit ({locations.length})
          </h4>
          
          {locations.map((location, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Número de parada */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Información de la ubicación */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">
                      {location.place}
                    </h5>
                    {location.placeSub && (
                      <p className="text-sm text-gray-600 truncate">
                        {location.placeSub}
                      </p>
                    )}
                    {location.complementaryDescription && (
                      <p className="text-xs text-gray-500 truncate">
                        {location.complementaryDescription}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Acciones */}
                {!disabled && (
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Mover arriba */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveLocation(index, index - 1)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                        title="Mover arriba"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Mover abajo */}
                    {index < locations.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveLocation(index, index + 1)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                        title="Mover abajo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Editar */}
                    <button
                      type="button"
                      onClick={() => setCurrentEditIndex(index)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Editar ubicación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    {/* Eliminar */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(index)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar ubicación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agregar nueva ubicación */}
      {locations.length < maxLocations && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            {locations.length === 0 ? 'Primera parada' : `Agregar parada ${locations.length + 1}`}
          </h4>
          
          <LocationSelector
            onLocationSelect={handleAddLocation}
            placeholder={`Buscar parada ${locations.length + 1} del circuit...`}
            countries={['MEX', 'USA', 'CAN', 'GTM', 'BLZ']}
            maxResults={6}
            disabled={disabled}
            showCoordinates={false}
            helpText={locations.length === 0 
              ? "Agrega la primera parada de tu circuit turístico" 
              : "Agrega la siguiente parada del recorrido"
            }
          />
        </div>
      )}

      {/* Modal de edición */}
      {currentEditIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Editar Parada {currentEditIndex + 1}
            </h3>
            
            <LocationSelector
              selectedLocation={locations[currentEditIndex]}
              onLocationSelect={(location) => handleEditLocation(currentEditIndex, location)}
              placeholder="Buscar nueva ubicación..."
              countries={['MEX', 'USA', 'CAN', 'GTM', 'BLZ']}
              maxResults={6}
              showCoordinates={false}
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentEditIndex(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Errores */}
      {(globalError || externalErrors.length > 0) && (
        <div className="space-y-2">
          {globalError && (
            <p className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {globalError}
            </p>
          )}
          
          {externalErrors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Información de estado */}
      {locations.length > 0 && (
        <div className={`border rounded-lg p-4 ${
          locations.length >= minLocations 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className={`w-5 h-5 mt-0.5 ${
                locations.length >= minLocations ? 'text-green-400' : 'text-yellow-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${
                locations.length >= minLocations ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {locations.length >= minLocations 
                  ? 'Circuit válido' 
                  : `Faltan ${minLocations - locations.length} ubicaciones`
                }
              </h4>
              <div className={`mt-1 text-sm ${
                locations.length >= minLocations ? 'text-green-700' : 'text-yellow-700'
              }`}>
                <p>
                  {locations.length >= minLocations 
                    ? 'Tu circuit tiene suficientes paradas para ser publicado'
                    : `Agrega al menos ${minLocations - locations.length} ubicaciones más para completar el circuit`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}