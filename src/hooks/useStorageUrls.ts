// src/hooks/useStorageUrls.ts
import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';

interface StorageUrlCache {
  [key: string]: string;
}

export function useStorageUrl(path: string | undefined | null): {
  url: string | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }

    let cancelled = false;

    const getSignedUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Verificar si es una URL completa (ya procesada)
        if (path.startsWith('http://') || path.startsWith('https://')) {
          setUrl(path);
          return;
        }

        // Generar URL firmada con Amplify Storage
        const result = await getUrl({
          path: path,
          options: {
            validateObjectExistence: false, // Evita verificación adicional
            expiresIn: 3600, // URL válida por 1 hora
          }
        });

        if (!cancelled) {
          setUrl(result.url.toString());
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error generando URL de Storage:', err);
          setError(err instanceof Error ? err : new Error('Error desconocido'));
          setUrl(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    getSignedUrl();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { url, isLoading, error };
}

// Hook para múltiples URLs con caché
export function useStorageUrls(paths: (string | undefined | null)[]): {
  urls: (string | null)[];
  isLoading: boolean;
  errors: (Error | null)[];
} {
  const [urlCache, setUrlCache] = useState<StorageUrlCache>({});
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<(Error | null)[]>([]);

  useEffect(() => {
    if (!paths || paths.length === 0) {
      setUrls([]);
      return;
    }

    let cancelled = false;

    const getSignedUrls = async () => {
      setIsLoading(true);
      const newUrls: (string | null)[] = [];
      const newErrors: (Error | null)[] = [];

      for (const path of paths) {
        if (!path) {
          newUrls.push(null);
          newErrors.push(null);
          continue;
        }

        // Verificar caché primero
        if (urlCache[path]) {
          newUrls.push(urlCache[path]);
          newErrors.push(null);
          continue;
        }

        // Si es URL completa, usarla directamente
        if (path.startsWith('http://') || path.startsWith('https://')) {
          newUrls.push(path);
          newErrors.push(null);
          setUrlCache(prev => ({ ...prev, [path]: path }));
          continue;
        }

        try {
          const result = await getUrl({
            path: path,
            options: {
              validateObjectExistence: false,
              expiresIn: 3600,
            }
          });

          const urlString = result.url.toString();
          newUrls.push(urlString);
          newErrors.push(null);
          
          // Actualizar caché
          setUrlCache(prev => ({ ...prev, [path]: urlString }));
        } catch (err) {
          console.error(`Error generando URL para ${path}:`, err);
          newUrls.push(null);
          newErrors.push(err instanceof Error ? err : new Error('Error desconocido'));
        }
      }

      if (!cancelled) {
        setUrls(newUrls);
        setErrors(newErrors);
        setIsLoading(false);
      }
    };

    getSignedUrls();

    return () => {
      cancelled = true;
    };
  }, [paths.join(',')]); // Dependencia basada en los paths

  return { urls, isLoading, errors };
}

// Componente helper para imágenes con Amplify Storage
export function StorageImage({ 
  path, 
  alt = '', 
  className = '',
  fallbackSrc = '/placeholder-image.png'
}: {
  path: string | undefined | null;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
}) {
  const { url, isLoading, error } = useStorageUrl(path);

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse`}>
        <div className="flex items-center justify-center h-full">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    );
  }

  if (error || !url) {
    return (
      <img 
        src={fallbackSrc} 
        alt={alt}
        className={className}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = fallbackSrc;
        }}
      />
    );
  }

  return (
    <img 
      src={url} 
      alt={alt}
      className={className}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = fallbackSrc;
      }}
    />
  );
}
