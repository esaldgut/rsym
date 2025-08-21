'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getSignedImageUrl } from '@/utils/storage-helpers';

interface ProfileImageProps {
  path?: string | null; // Path en S3 (prioridad)
  src?: string | null;  // URL directa (fallback)
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

      // Si hay un path de S3, obtener URL firmada
      if (path) {
        try {
          const signedUrl = await getSignedImageUrl(path, {
            accessLevel,
            expiresIn: 7200 // 2 horas para evitar expiraciones frecuentes
          });
          
          if (signedUrl) {
            setImageUrl(signedUrl);
          } else {
            setImageError(true);
          }
        } catch (error) {
          console.error('Error cargando imagen desde S3:', error);
          setImageError(true);
        }
      } 
      // Si no hay path pero hay src, usar src directamente
      else if (src) {
        setImageUrl(src);
      } 
      // Si no hay ninguno, marcar error
      else {
        setImageError(true);
      }

      setIsLoading(false);
    };

    loadImage();
  }, [path, src, accessLevel]);

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
          console.warn('Error cargando imagen, intentando regenerar URL...');
          setImageError(true);
          
          // Intentar regenerar la URL firmada una vez
          if (path) {
            try {
              const newUrl = await getSignedImageUrl(path, {
                accessLevel,
                expiresIn: 7200
              });
              if (newUrl && newUrl !== imageUrl) {
                setImageUrl(newUrl);
                setImageError(false);
              }
            } catch (error) {
              console.error('No se pudo regenerar la URL de imagen:', error);
            }
          }
        }}
        unoptimized // URLs firmadas necesitan unoptimized
      />
    </div>
  );
}