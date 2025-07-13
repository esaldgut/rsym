import { useMemo } from 'react';
import type { CircuitLocation } from '../../types/graphql';

interface LocationDescriptionProps {
  locationString: string;
  className?: string;
}

const normalizeLocationString = (str: string): string => {
  if (!str?.trim()) return '[]';

  try {
    // Paso 1: Convertir formato no estándar a JSON-like
    let jsonLike = str
      .replace(/(\w+)=/g, '"$1":') // Reemplaza key= por "key":
      .replace(/([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*[:,\]}])/g, '"$1"') // Comillas en keys
      .replace(/:\s*([^"\s{}\[\],]+)(?=\s*[,}\]])/g, (_, val) => {
        // Manejar números (enteros y decimales)
        if (/^-?\d*\.?\d+$/.test(val)) return `:${val}`;
        return `:"${val}"`;
      });

    // Paso 2: Manejar arrays específicamente
    jsonLike = jsonLike.replace(/\[([^\]]+)\]/g, (_, content) => {
      const items = content.split(',').map(item => {
        const trimmed = item.trim();
        return /^-?\d*\.?\d+$/.test(trimmed) ? trimmed : `"${trimmed}"`;
      });
      return `[${items.join(',')}]`;
    });

    return jsonLike;
  } catch {
    return '[]';
  }
};

export const LocationDescription = ({ 
  locationString,
  className = 'text-gray-500 text-sm'
}: LocationDescriptionProps) => {
  const descriptions = useMemo(() => {
    try {
      if (!locationString?.trim()) return 'Sin ubicación';
      
      const normalized = normalizeLocationString(locationString);
      const parsed = JSON.parse(normalized) as CircuitLocation[];
      
      if (!Array.isArray(parsed)) return 'Sin ubicación';

      const locationsText = parsed
        .map(loc => loc.complementaryDescription || loc.place || '')
        .filter(Boolean)
        .map(text => text.length > 20 ? `${text.slice(0, 20)}...` : text)
        .join(', ');

      return locationsText || 'Sin ubicación';
    } catch (error) {
      console.error('Error parsing location:', {
        error,
        original: locationString,
        normalized: normalizeLocationString(locationString)
      });
      return 'Sin ubicación';
    }
  }, [locationString]);

  return <span className={className}>{descriptions}</span>;
};
