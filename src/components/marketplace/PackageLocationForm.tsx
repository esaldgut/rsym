'use client';

import { LocationSelector } from '@/components/location/LocationSelector';
import { useLocationSelector } from '@/hooks/useLocationSelector';
import type { CircuitLocation } from '@/types/location';

interface PackageLocationFormProps {
  /** Ubicación inicial del package */
  initialLocation?: CircuitLocation | null;
  
  /** Callback cuando cambia la ubicación */
  onLocationChange: (location: CircuitLocation | null) => void;
  
  /** Si el campo es requerido */
  required?: boolean;
  
  /** Si está deshabilitado */
  disabled?: boolean;
  
  /** Mensaje de error externo */
  externalError?: string;
}

/**
 * Componente específico para seleccionar ubicación al crear packages
 * Incluye validaciones específicas para packages turísticos
 */
export function PackageLocationForm({
  initialLocation,
  onLocationChange,
  required = true,
  disabled = false,
  externalError
}: PackageLocationFormProps) {
  // Validación específica para packages
  const validatePackageLocation = (location: CircuitLocation | null): string | null => {
    if (required && !location) {
      return 'Selecciona la ubicación principal del package turístico';
    }
    
    if (location) {
      // Validar que tiene información básica
      if (!location.place?.trim()) {
        return 'El nombre del lugar es requerido';
      }
      
      // Validar coordenadas
      if (!location.coordinates || location.coordinates.length !== 2) {
        return 'Las coordenadas de la ubicación no son válidas';
      }
      
      const [lng, lat] = location.coordinates;
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return 'Las coordenadas están fuera del rango válido';
      }
    }
    
    return null;
  };

  const {
    selectedLocation,
    selectLocation,
    removeLocation,
    error,
    clearError
  } = useLocationSelector({
    initialLocation,
    onLocationChange,
    validate: validatePackageLocation
  });

  return (
    <div className="space-y-4">
      <LocationSelector
        selectedLocation={selectedLocation}
        onLocationSelect={selectLocation}
        onLocationRemove={removeLocation}
        placeholder="Buscar destino principal del package..."
        countries={['MEX', 'USA', 'CAN', 'GTM', 'BLZ']} // América del Norte y Centroamérica
        maxResults={8}
        required={required}
        disabled={disabled}
        showCoordinates={false}
        label="Ubicación del Package"
        helpText="Selecciona el destino principal donde se realizará tu package turístico. Esta ubicación será visible para los clientes."
        error={externalError || error}
      />
      
      {/* Información adicional para packages */}
      {selectedLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-blue-800">
                Ubicación del Package Confirmada
              </h4>
              <div className="mt-2 text-sm text-blue-700">
                <p>• Esta será la ubicación principal mostrada en el marketplace</p>
                <p>• Los clientes podrán ver esta ubicación antes de reservar</p>
                <p>• Asegúrate de que sea fácilmente accesible para los turistas</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}