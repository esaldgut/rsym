// src/components/StorageImage.tsx
import { useState } from 'react';
import { useStorageUrl } from '../hooks/useStorageUrls';

export function StorageImage({ 
  path, 
  alt = '', 
  className = '',
  fallbackSrc = '/placeholder-image.svg',
  size = 'default'
}: {
  path: string | undefined | null;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
  size?: 'small' | 'default';
}) {
  const { url, isLoading } = useStorageUrl(path);
  const [hasError, setHasError] = useState(false);

  // Seleccionar placeholder basado en el tamaño
  const defaultPlaceholder = size === 'small' ? '/placeholder-small.svg' : '/placeholder-image.svg';
  const placeholder = fallbackSrc || defaultPlaceholder;

  if (isLoading) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center`}>
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    );
  }

  if (hasError || !url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img 
        src={placeholder}
        alt={alt || 'Imagen no disponible'}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={url}
      alt={alt}
      className={`${className} object-cover`}
      onError={() => {
        setHasError(true);
      }}
      onLoad={() => {
        setHasError(false);
      }}
    />
  );
}
