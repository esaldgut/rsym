'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getSignedImageUrl } from '@/utils/storage-helpers';

interface ProfileImageProps {
  signedUrl?: string | null; // URL pre-firmada del servidor (PRIORIDAD MÁXIMA)
  path?: string | null; // Path en S3 (fallback para retrocompatibilidad)
  src?: string | null;  // URL directa (fallback adicional)
  alt: string;
  fallbackText: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  accessLevel?: 'guest' | 'private' | 'protected';
}

const sizeClasses = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-12 h-12 text-sm',
  md: 'w-20 h-20 text-lg',
  lg: 'w-36 h-36 text-4xl',
  xl: 'w-48 h-48 text-5xl',
  '2xl': 'w-60 h-60 text-6xl'
};

export function ProfileImage({
  signedUrl,
  path,
  src,
  alt,
  fallbackText,
  size = 'lg',
  className = '',
  accessLevel = 'protected'
}: ProfileImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setImageError(false);

      // PRIORIDAD 1: URL pre-firmada del servidor (patrón óptimo)
      if (signedUrl) {
        console.log('🖼️ [ProfileImage] Usando URL pre-firmada del servidor');
        setImageUrl(signedUrl);
        setIsLoading(false);
        return;
      }

      // PRIORIDAD 2: Path de S3, obtener URL firmada client-side (fallback)
      if (path) {
        console.log('🖼️ [ProfileImage] Generando URL firmada client-side para path:', path);
        try {
          const clientSignedUrl = await getSignedImageUrl(path, {
            accessLevel,
            expiresIn: 7200 // 2 horas para evitar expiraciones frecuentes
          });

          if (clientSignedUrl) {
            setImageUrl(clientSignedUrl);
          } else {
            setImageError(true);
          }
        } catch (error) {
          console.error('❌ [ProfileImage] Error cargando imagen desde S3:', error);
          setImageError(true);
        }
      }
      // PRIORIDAD 3: URL directa (src)
      else if (src) {
        console.log('🖼️ [ProfileImage] Usando URL directa (src)');
        setImageUrl(src);
      }
      // Sin imagen disponible
      else {
        setImageError(true);
      }

      setIsLoading(false);
    };

    loadImage();
  }, [signedUrl, path, src, accessLevel]);

  // Mostrar fallback mientras carga o si hay error
  if (isLoading || imageError || !imageUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold ${className}`}>
        {isLoading ? (
          <div className="animate-pulse">...</div>
        ) : (
          fallbackText
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="rounded-full object-cover border-4 border-gray-100"
        onError={async () => {
          console.warn('⚠️ [ProfileImage] Error cargando imagen desde URL');
          setImageError(true);

          // Solo intentar regenerar si tenemos un path (no hay signedUrl del servidor)
          // Si tenemos signedUrl del servidor, el error es de la URL misma, no de credenciales
          if (!signedUrl && path) {
            console.log('🔄 [ProfileImage] Intentando regenerar URL firmada...');
            try {
              const newUrl = await getSignedImageUrl(path, {
                accessLevel,
                expiresIn: 7200
              });
              if (newUrl && newUrl !== imageUrl) {
                setImageUrl(newUrl);
                setImageError(false);
                console.log('✅ [ProfileImage] URL regenerada exitosamente');
              }
            } catch (error) {
              console.error('❌ [ProfileImage] No se pudo regenerar la URL:', error);
            }
          }
        }}
        unoptimized // URLs firmadas necesitan unoptimized
      />
    </div>
  );
}