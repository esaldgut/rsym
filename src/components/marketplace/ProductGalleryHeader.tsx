'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { S3GalleryImage } from '@/components/ui/S3GalleryImage';
import { useCarousel } from '@/hooks/useCarousel';
import { CarouselDots } from '@/components/ui/CarouselDots';

/**
 * Handle interface for ProductGalleryHeader
 * Allows parent components to control carousel playback imperatively
 */
export interface ProductGalleryHeaderHandle {
  pause: () => void;
  resume: () => void;
}

interface ProductGalleryHeaderProps {
  images: (string | undefined)[];
  videos?: (string | undefined)[];
  alt?: string;
  onOpenFullscreen?: () => void;
}

export const ProductGalleryHeader = forwardRef<ProductGalleryHeaderHandle, ProductGalleryHeaderProps>(
  function ProductGalleryHeader(
    {
      images,
      videos = [],
      alt = 'Product image',
      onOpenFullscreen
    },
    ref
  ) {
  // Filter out undefined values and combine images and videos
  const validImages = images.filter((img): img is string => !!img);
  const validVideos = (videos || []).filter((vid): vid is string => !!vid);

  const mediaItems = [
    ...validImages.map(img => ({ type: 'image' as const, url: img })),
    ...validVideos.map(vid => ({ type: 'video' as const, url: vid }))
  ];

  // Carousel auto-play
  const {
    currentIndex,
    isPlaying,
    goToNext,
    goToPrevious,
    goToIndex,
    togglePlayPause,
    pauseAutoPlay,
    resumeAutoPlay
  } = useCarousel({
    totalItems: mediaItems.length,
    interval: 5000,  // 5 segundos entre cambios
    autoPlay: true
  });

  // Expose carousel control methods to parent via ref
  useImperativeHandle(ref, () => ({
    pause: () => {
      console.log('[ProductGalleryHeader] 🎬 Pausando carrusel desde parent');
      pauseAutoPlay();
    },
    resume: () => {
      console.log('[ProductGalleryHeader] ▶️ Reanudando carrusel desde parent');
      resumeAutoPlay();
    }
  }), [pauseAutoPlay, resumeAutoPlay]);

  const [showHint, setShowHint] = useState(false);
  const [isManualNavigation, setIsManualNavigation] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // No media available
  if (mediaItems.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No hay imágenes disponibles</p>
        </div>
      </div>
    );
  }

  const currentMedia = mediaItems[currentIndex];

  // Reset manual navigation flag when auto-play advances
  useEffect(() => {
    if (isPlaying) {
      setIsManualNavigation(false);
    }
  }, [currentIndex, isPlaying]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(distance) > threshold) {
      // Pausar auto-play cuando usuario navega manualmente
      setIsManualNavigation(true);
      pauseAutoPlay();
      if (distance > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Handle click to open fullscreen (only for images)
  const handleMediaClick = () => {
    if (currentMedia.type === 'image' && onOpenFullscreen) {
      onOpenFullscreen();
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 group">
      {/* Main media display */}
      <div
        className="relative w-full h-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setShowHint(true)}
        onMouseLeave={() => setShowHint(false)}
      >
        {currentMedia.type === 'image' ? (
          <div
            className="relative w-full h-full cursor-pointer"
            onClick={handleMediaClick}
          >
            <S3GalleryImage
              path={currentMedia.url}
              alt={`${alt} ${currentIndex + 1}`}
              objectFit="cover"
              className={`group-hover:scale-105 ${
                isManualNavigation ? '' : 'transition-transform duration-150'
              }`}
            />

            {/* Hint overlay - appears on hover for images */}
            {showHint && onOpenFullscreen && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2.5 text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span className="text-sm font-medium">Click para pantalla completa</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <video
            src={currentMedia.url}
            controls
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            onPlay={() => {
              // Pausar auto-play del carrusel cuando video empieza
              pauseAutoPlay();
            }}
            onEnded={() => {
              // Cuando video termina, avanzar al siguiente y reanudar auto-play
              resumeAutoPlay();
              goToNext();
            }}
            onPause={(e) => {
              // Si usuario pausa video manualmente, no hacer nada
              // (el auto-play ya está pausado desde onPlay)
            }}
          >
            Tu navegador no soporta el elemento de video.
          </video>
        )}

        {/* Navigation arrows - only show if more than 1 item */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsManualNavigation(true);
                pauseAutoPlay();  // Pausar cuando usuario navega manualmente
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/15 hover:bg-white/30 rounded-full flex items-center justify-center shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 backdrop-blur-sm"
              aria-label="Imagen anterior"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsManualNavigation(true);
                pauseAutoPlay();  // Pausar cuando usuario navega manualmente
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/15 hover:bg-white/30 rounded-full flex items-center justify-center shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 backdrop-blur-sm"
              aria-label="Imagen siguiente"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Carousel controls - dots and play/pause */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {/* Play/Pause button */}
            <button
              onClick={togglePlayPause}
              className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label={isPlaying ? 'Pausar carrusel' : 'Reproducir carrusel'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Dots navigation */}
            <CarouselDots
              total={mediaItems.length}
              current={currentIndex}
              onDotClick={goToIndex}
              dotSize="sm"
              variant="light"
            />

            {/* Counter */}
            <span className="text-white text-xs font-medium">
              {currentIndex + 1}/{mediaItems.length}
            </span>
          </div>
        )}

        {/* Media type badge for videos */}
        {currentMedia.type === 'video' && (
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-medium rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            Video
          </div>
        )}
      </div>
    </div>
  );
});
