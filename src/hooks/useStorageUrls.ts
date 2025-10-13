// src/hooks/useStorageUrls.ts
import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';

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

      console.log('[useStorageUrl] 📦 Procesando path:', path);

      try {
        // Si es una URL completa, retornarla directamente
        if (path.startsWith('http://') || path.startsWith('https://')) {
          console.log('[useStorageUrl] ✅ URL pública detectada, usando directamente');
          setUrl(path);
          return;
        }

        console.log('[useStorageUrl] 🔐 Path de Storage, obteniendo URL firmada...');

        const result = await getUrl({
          path: path,
          options: {
            validateObjectExistence: false,
            expiresIn: 3600,
          }
        });

        if (!cancelled) {
          console.log('[useStorageUrl] ✅ URL firmada obtenida:', result.url.toString().substring(0, 100) + '...');
          setUrl(result.url.toString());
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[useStorageUrl] ❌ Error generando URL:', err);
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
