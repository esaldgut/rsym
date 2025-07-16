import { useMemo } from 'react';

interface LocationDescriptionProps {
  locations: string[]; // Ahora recibe directamente el arreglo de strings
  className?: string;
  maxLength?: number; // Opcional: longitud máxima por item
  maxItems?: number; // Opcional: máximo de items a mostrar
}

export const LocationDescription = ({ 
  locations = [],
  className = 'text-gray-500 text-sm',
  maxLength = 20,
  maxItems = 3
}: LocationDescriptionProps) => {
  const description = useMemo(() => {
    if (!locations || !Array.isArray(locations)) {
      return 'Sin ubicación';
    }

    // Filtrar y formatear las ubicaciones
    const validLocations = locations
      .filter(location => location?.trim()) // Filtra strings vacíos
      .slice(0, maxItems) // Limita la cantidad de items
      .map(location => 
        location.length > maxLength 
          ? `${location.slice(0, maxLength)}...` 
          : location
      );

    if (validLocations.length === 0) {
      return 'Sin ubicación';
    }

    return validLocations.join(', ');
  }, [locations, maxLength, maxItems]);

  return <span className={className}>{description}</span>;
};
