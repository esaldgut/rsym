'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { getSignedImageUrl } from '@/utils/storage-helpers';

interface MediaPlayerProps {
  src: string;
  type: 'image' | 'video';
  alt: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  onDoubleClick?: () => void;
}

export function MediaPlayer({
  src,
  type,
  alt,
  className = '',
  autoPlay = false,
  muted = true,
  loop = true,
  controls = true,
  onDoubleClick
}: MediaPlayerProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Cargar URL firmada si es necesario
  useEffect(() => {
    const loadMedia = async () => {
      setIsLoading(true);
      setError(false);

      try {
        // Si es una URL completa, usarla directamente
        if (src.startsWith('http://') || src.startsWith('https://')) {
          setMediaUrl(src);
        } else {
          // Si es un path de S3, obtener URL firmada
          const signedUrl = await getSignedImageUrl(src, {
            accessLevel: 'protected',
            expiresIn: 7200
          });
          
          if (signedUrl) {
            setMediaUrl(signedUrl);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error('Error cargando media:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();
  }, [src]);

  // Configurar autoplay para videos en viewport
  useEffect(() => {
    if (type !== 'video' || !autoPlay || !videoRef.current) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(console.error);
          } else {
            videoRef.current.pause();
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.5
    });

    observerRef.current.observe(videoRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [type, autoPlay, mediaUrl]);

  // Manejar doble click para like
  const handleDoubleClick = useCallback(() => {
    if (onDoubleClick) {
      onDoubleClick();
      
      // Mostrar animación de corazón
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  }, [onDoubleClick]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Error state
  if (error || !mediaUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-sm">Error al cargar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" onDoubleClick={handleDoubleClick}>
      {type === 'image' ? (
        <div className={`relative ${className}`}>
          <Image
            src={mediaUrl}
            alt={alt}
            width={800}
            height={800}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={mediaUrl}
          className={className}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline
        />
      )}

      {/* Animación de corazón para double tap */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-ping">
            <svg className="w-24 h-24 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}