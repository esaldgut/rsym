// src/components/StorageImage.tsx
import { useStorageUrl } from '../hooks/useStorageUrls';

export function StorageImage({ 
  path, 
  alt = '', 
  className = '',
  fallbackSrc = '/placeholder-image.svg'
}: {
  path: string | undefined | null;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
}) {
  const { url, isLoading } = useStorageUrl(path);

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse`} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={url || fallbackSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = fallbackSrc;
      }}
    />
  );
}
