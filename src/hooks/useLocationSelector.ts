'use client';

import { useState, useCallback } from 'react';
import type { CircuitLocation } from '@/types/location';

interface UseLocationSelectorOptions {
  /** Ubicación inicial */
  initialLocation?: CircuitLocation | null;
  
  /** Callback cuando cambia la ubicación */
  onLocationChange?: (location: CircuitLocation | null) => void;
  
  /** Validación personalizada */
  validate?: (location: CircuitLocation | null) => string | null;
}

interface UseLocationSelectorReturn {
  /** Ubicación seleccionada actualmente */
  selectedLocation: CircuitLocation | null;
  
  /** Seleccionar una ubicación */
  selectLocation: (location: CircuitLocation) => void;
  
  /** Remover la ubicación actual */
  removeLocation: () => void;
  
  /** Limpiar la selección */
  clearLocation: () => void;
  
  /** Si hay una ubicación seleccionada */
  hasLocation: boolean;
  
  /** Error de validación */
  error: string | null;
  
  /** Validar la ubicación actual */
  validateLocation: () => boolean;
  
  /** Limpiar error */
  clearError: () => void;
}

/**
 * Hook personalizado para manejar la selección de ubicaciones
 * en formularios de creación de packages y circuits
 */
export function useLocationSelector({
  initialLocation = null,
  onLocationChange,
  validate
}: UseLocationSelectorOptions = {}): UseLocationSelectorReturn {
  const [selectedLocation, setSelectedLocation] = useState<CircuitLocation | null>(initialLocation);
  const [error, setError] = useState<string | null>(null);

  // Seleccionar ubicación
  const selectLocation = useCallback((location: CircuitLocation) => {
    setSelectedLocation(location);
    setError(null); // Limpiar error al seleccionar
    onLocationChange?.(location);
  }, [onLocationChange]);

  // Remover ubicación
  const removeLocation = useCallback(() => {
    setSelectedLocation(null);
    setError(null);
    onLocationChange?.(null);
  }, [onLocationChange]);

  // Limpiar ubicación (alias de removeLocation)
  const clearLocation = useCallback(() => {
    removeLocation();
  }, [removeLocation]);

  // Validar ubicación
  const validateLocation = useCallback(() => {
    if (validate) {
      const validationError = validate(selectedLocation);
      setError(validationError);
      return validationError === null;
    }
    
    // Validación básica: verificar que existe una ubicación
    if (!selectedLocation) {
      setError('La ubicación es requerida');
      return false;
    }
    
    // Validar que tiene coordenadas válidas
    if (!selectedLocation.coordinates || selectedLocation.coordinates.length !== 2) {
      setError('Las coordenadas de la ubicación no son válidas');
      return false;
    }
    
    const [lng, lat] = selectedLocation.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      setError('Las coordenadas están fuera del rango válido');
      return false;
    }
    
    // Validar que tiene un nombre de lugar
    if (!selectedLocation.place?.trim()) {
      setError('El nombre del lugar es requerido');
      return false;
    }
    
    setError(null);
    return true;
  }, [selectedLocation, validate]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    selectedLocation,
    selectLocation,
    removeLocation,
    clearLocation,
    hasLocation: selectedLocation !== null,
    error,
    validateLocation,
    clearError
  };
}