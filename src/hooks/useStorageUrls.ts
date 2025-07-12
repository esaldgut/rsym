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

      try {
        if (path.startsWith('http://') || path.startsWith('https://')) {
          setUrl(path);
          return;
        }

        const result = await getUrl({
          path: path,
          options: {
            validateObjectExistence: false,
            expiresIn: 3600,
          }
        });

        if (!cancelled) {
          setUrl(result.url.toString());
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error generando URL:', err);
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
