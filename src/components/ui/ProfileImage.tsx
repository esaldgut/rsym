'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getSignedImageUrl } from '@/utils/storage-helpers';

interface ProfileImageProps {
  path?: string | null; // Path en S3 (prioridad)
  src?: string | null;  // URL directa (fallback)
  alt: string;
  fallbackText: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  accessLevel?: 'guest' | 'private' | 'protected';
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-16 h-16 text-lg',
  lg: 'w-32 h-32 text-4xl',
  xl: 'w-40 h-40 text-5xl'
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
        const signedUrl = await getSignedImageUrl(path, {
          accessLevel,
          expiresIn: 3600 // 1 hora
        });
        
        if (signedUrl) {
          setImageUrl(signedUrl);
        } else {
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
        onError={() => setImageError(true)}
        unoptimized // URLs firmadas necesitan unoptimized
      />
    </div>
  );
}