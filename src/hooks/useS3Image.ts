'use client';

import { useState, useEffect } from 'react';
import { getSignedImageUrl } from '@/utils/storage-helpers';

interface UseS3ImageOptions {
  signedUrl?: string | null;
  path?: string | null;
  src?: string | null;
  accessLevel?: 'guest' | 'private' | 'protected';
}

interface UseS3ImageReturn {
  imageUrl: string | null;
  isLoading: boolean;
  error: boolean;
  retryLoad: () => void;
}

/**
 * Hook para cargar imágenes desde S3 con manejo de paths públicos y protegidos
 * Extrae la lógica compartida de ProfileImage para reutilización en galerías
 */
export function useS3Image({
  signedUrl,
  path,
  src,
  accessLevel = 'protected'
}: UseS3ImageOptions): UseS3ImageReturn {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setError(false);

      // PRIORIDAD 1: URL pre-firmada del servidor (patrón óptimo)
      if (signedUrl) {
        console.log('🖼️ [useS3Image] Usando URL pre-firmada del servidor');
        setImageUrl(signedUrl);
        setIsLoading(false);
        return;
      }

      // PRIORIDAD 2: Path de S3
      if (path) {
        // CASO A: Path público → construir URL directa (NO requiere credenciales)
        if (path.startsWith('public/')) {
          console.log('🖼️ [useS3Image] Path público detectado, construyendo URL directa:', path);

          // Importar configuración dinámicamente para construir URL pública
          try {
            const config = await import('../../amplify/outputs.json');
            const publicUrl = `https://${config.default.storage.bucket_name}.s3.${config.default.storage.aws_region}.amazonaws.com/${path}`;
            console.log('✅ [useS3Image] URL pública construida:', publicUrl);
            setImageUrl(publicUrl);
            setIsLoading(false);
          } catch (err) {
            console.error('❌ [useS3Image] Error construyendo URL pública:', err);
            setError(true);
            setIsLoading(false);
          }
          return;
        }

        // CASO B: Path protegido/privado → obtener URL firmada client-side (requiere credenciales)
        console.log('🖼️ [useS3Image] Generando URL firmada client-side para path:', path);
        try {
          const clientSignedUrl = await getSignedImageUrl(path, {
            accessLevel,
            expiresIn: 7200 // 2 horas para evitar expiraciones frecuentes
          });

          if (clientSignedUrl) {
            setImageUrl(clientSignedUrl);
          } else {
            setError(true);
          }
        } catch (err) {
          console.error('❌ [useS3Image] Error cargando imagen desde S3:', err);
          setError(true);
        }
      }
      // PRIORIDAD 3: URL directa (src)
      else if (src) {
        console.log('🖼️ [useS3Image] Usando URL directa (src)');
        setImageUrl(src);
      }
      // Sin imagen disponible
      else {
        setError(true);
      }

      setIsLoading(false);
    };

    loadImage();
  }, [signedUrl, path, src, accessLevel, retryCount]);

  const retryLoad = () => {
    setRetryCount(prev => prev + 1);
  };

  return {
    imageUrl,
    isLoading,
    error,
    retryLoad
  };
}
