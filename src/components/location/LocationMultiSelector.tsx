'use client';

import { useState, useCallback, useEffect } from 'react';
import { LocationSearch } from '@/components/location/LocationSearch';
import type { CircuitLocation, LocationInput, PointInput } from '@/types/location';

interface LocationMultiSelectorProps {
  /** Ubicaciones seleccionadas */
  selectedLocations: LocationInput[];
  
  /** Callback cuando cambian las ubicaciones */
  onChange: (locations: LocationInput[]) => void;
  
  /** Si permite múltiples selecciones */
  allowMultiple?: boolean;
  
  /** Número mínimo de selecciones */
  minSelections?: number;
  
  /** Número máximo de selecciones */
  maxSelections?: number;
  
  /** Etiqueta del campo */
  label?: string;
  
  /** Mensaje de error */
  error?: string;
  
  /** Texto de ayuda */
  helpText?: string;
  
  /** Clases CSS adicionales */
  className?: string;
}

function convertCircuitLocationToLocationInput(circuitLocation: CircuitLocation): LocationInput {
  // Convertir de formato AWS SDK [lng, lat] a formato GraphQL {longitude, latitude}
  const coordinates: PointInput | undefined = circuitLocation.coordinates ? {
    longitude: circuitLocation.coordinates[0],
    latitude: circuitLocation.coordinates[1]
  } : undefined;

  return {
    place: circuitLocation.place,
    placeSub: circuitLocation.placeSub,
    complementary_description: circuitLocation.complementaryDescription,
    coordinates
  };
}

export function LocationMultiSelector({
  selectedLocations,
  onChange,
  allowMultiple = true,
  minSelections = 1,
  maxSelections = 30,
  label,
  error,
  helpText,
  className = ''
}: LocationMultiSelectorProps) {
  const [isSearchVisible, setIsSearchVisible] = useState(selectedLocations.length === 0);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);

  // Actualizar visibilidad de búsqueda cuando cambian las ubicaciones
  useEffect(() => {
    if (selectedLocations.length === 0) {
      setIsSearchVisible(true);
      setCurrentEditIndex(null);
    }
  }, [selectedLocations]);

  // Manejar nueva selección de ubicación
  const handleLocationSelect = useCallback((circuitLocation: CircuitLocation) => {
    const newLocationInput = convertCircuitLocationToLocationInput(circuitLocation);
    
    if (currentEditIndex !== null) {
      // Editando ubicación existente
      const updatedLocations = [...selectedLocations];
      updatedLocations[currentEditIndex] = newLocationInput;
      onChange(updatedLocations);
      setCurrentEditIndex(null);
      setIsSearchVisible(false);
    } else {
      // Agregando nueva ubicación
      if (allowMultiple && selectedLocations.length < maxSelections) {
        onChange([...selectedLocations, newLocationInput]);
      } else if (!allowMultiple) {
        onChange([newLocationInput]);
      }
      
      // Ocultar búsqueda si alcanzamos el máximo o no es múltiple
      if (!allowMultiple || selectedLocations.length + 1 >= maxSelections) {
        setIsSearchVisible(false);
      }
    }
  }, [selectedLocations, onChange, allowMultiple, maxSelections, currentEditIndex]);

  // Remover ubicación
  const handleRemoveLocation = useCallback((index: number) => {
    const updatedLocations = selectedLocations.filter((_, i) => i !== index);
    onChange(updatedLocations);
    
    // Mostrar búsqueda si quedamos por debajo del mínimo
    if (updatedLocations.length < minSelections) {
      setIsSearchVisible(true);
    }
  }, [selectedLocations, onChange, minSelections]);

  // Editar ubicación existente
  const handleEditLocation = useCallback((index: number) => {
    setCurrentEditIndex(index);
    setIsSearchVisible(true);
  }, []);

  // Cancelar edición
  const handleCancelEdit = useCallback(() => {
    setCurrentEditIndex(null);
    setIsSearchVisible(selectedLocations.length === 0);
  }, [selectedLocations.length]);

  // Agregar nueva ubicación (cuando ya hay ubicaciones)
  const handleAddNew = useCallback(() => {
    setCurrentEditIndex(null);
    setIsSearchVisible(true);
  }, []);

  const canAddMore = allowMultiple && selectedLocations.length < maxSelections;
  const needsMore = selectedLocations.length < minSelections;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          <span className="text-red-500 ml-1">*</span>
        </label>
      )}

      {/* Ubicaciones seleccionadas */}
      {selectedLocations.length > 0 && !isSearchVisible && (
        <div className="space-y-3">
          {selectedLocations.map((location, index) => (
            <div 
              key={index}
              className={`border rounded-xl p-4 bg-white ${error ? 'border-red-300' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Número de destino (para circuitos) */}
                  {allowMultiple && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                  )}
                  
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
                      {location.place}
                    </h4>
                    
                    {location.placeSub && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {location.placeSub}
                      </p>
                    )}
                    
                    {location.complementary_description && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {location.complementary_description}
                      </p>
                    )}
                    
                    {/* Coordenadas confirmadas */}
                    {location.coordinates && (
                      <div className="flex items-center mt-3 space-x-3">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Coordenadas confirmadas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Acciones */}
                <div className="flex space-x-2 ml-4">
                  <button
                    type="button"
                    onClick={() => handleEditLocation(index)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar ubicación"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  {(allowMultiple || selectedLocations.length > minSelections) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover ubicación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Botón para agregar más ubicaciones */}
          {canAddMore && (
            <button
              type="button"
              onClick={handleAddNew}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar {allowMultiple ? `destino ${selectedLocations.length + 1}` : 'ubicación'}
            </button>
          )}
        </div>
      )}

      {/* Componente de búsqueda */}
      {isSearchVisible && (
        <div className="space-y-3">
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            placeholder={currentEditIndex !== null 
              ? `Editar ${allowMultiple ? `destino ${currentEditIndex + 1}` : 'ubicación'}...`
              : `Buscar ${allowMultiple ? `destino ${selectedLocations.length + 1}` : 'ubicación'}...`
            }
            countries={['MEX', 'USA', 'CAN', 'GBR', 'DEU', 'FRA', 'ITA', 'ESP', 'JPN', 'CHN', 'BRA', 'ARG', 'COL', 'PER', 'CHL']}
            maxResults={20}
            autoFocus={true}
            defaultValue=""
            className={error ? 'border-red-300' : ''}
          />
          
          {/* Botones de acción durante la búsqueda */}
          {selectedLocations.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {currentEditIndex !== null ? 'Cancelar edición' : 'Cancelar'}
              </button>
              
              {!needsMore && selectedLocations.length >= minSelections && (
                <button
                  type="button"
                  onClick={() => setIsSearchVisible(false)}
                  className="text-sm text-purple-600 hover:text-purple-700 underline font-medium"
                >
                  Finalizar selección
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contador de ubicaciones */}
      {allowMultiple && (
        <div className="flex justify-between text-sm text-gray-500">
          <span>
            {selectedLocations.length} de {maxSelections} destinos seleccionados
          </span>
          {minSelections > selectedLocations.length && (
            <span className="text-orange-600 font-medium">
              Faltan {minSelections - selectedLocations.length} destinos mínimos
            </span>
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