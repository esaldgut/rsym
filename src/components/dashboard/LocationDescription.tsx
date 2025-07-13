import { useMemo } from 'react';
import type { CircuitLocation } from '../../types/graphql';

interface LocationDescriptionProps {
  locationString: string | CircuitLocation[];
  className?: string;
}

export const LocationDescription = ({ 
  locationString,
  className = 'text-gray-500 text-sm'
}: LocationDescriptionProps) => {
  const descriptions = useMemo(() => {
    try {
      // Si ya es un array, lo usamos directamente
      if (Array.isArray(locationString)) {
        return processLocations(locationString);
      }
      
      // Si es string, intentamos parsear
      const parsed = JSON.parse(locationString);
      return Array.isArray(parsed) ? processLocations(parsed) : 'Formato inválido';
    } catch {
      return 'Sin descripción';
    }
  }, [locationString]);

  return <span className={className}>{descriptions}</span>;
};

// Función helper para procesar locations
const processLocations = (locations: CircuitLocation[]): string => {
  return locations
    .map(loc => loc.complementaryDescription?.slice(0, 20))
    .filter(Boolean)
    .join(', ') || 'Sin descripción';
};
