'use client';

import Image from 'next/image';
import { useS3Image } from '@/hooks/useS3Image';

interface S3GalleryImageProps {
  path?: string | null;
  signedUrl?: string | null;
  src?: string | null;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
  accessLevel?: 'guest' | 'private' | 'protected';
}

/**
 * Componente optimizado para mostrar imágenes de S3 en galerías de productos
 * A diferencia de ProfileImage, este componente:
 * - Ocupa todo el espacio disponible del contenedor (w-full h-full)
 * - No tiene tamaños fijos
 * - Soporta object-fit cover/contain
 * - Diseñado para modales y galerías que necesitan imágenes grandes
 */
export function S3GalleryImage({
  path,
  signedUrl,
  src,
  alt,
  className = '',
  objectFit = 'cover',
  accessLevel = 'protected'
}: S3GalleryImageProps) {
  const { imageUrl, isLoading, error } = useS3Image({
    signedUrl,
    path,
    src,
    accessLevel
  });

  // Loading state
  if (isLoading) {
    return (
      <div className={`w-full h-full bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <span className="text-white text-sm">Cargando...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !imageUrl) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">No se pudo cargar la imagen</p>
        </div>
      </div>
    );
  }

  // Success state - renderizar imagen
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className={objectFit === 'cover' ? 'object-cover' : 'object-contain'}
        unoptimized // URLs firmadas de S3 necesitan unoptimized
        onError={() => {
          console.error('❌ [S3GalleryImage] Error al cargar imagen:', imageUrl);
        }}
      />
    </div>
  );
}
