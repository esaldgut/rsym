'use client';

import { useState, useEffect, useCallback } from 'react';
import { S3GalleryImage } from '@/components/ui/S3GalleryImage';
import { useCarousel } from '@/hooks/useCarousel';
import { CarouselDots } from '@/components/ui/CarouselDots';

interface FullscreenGalleryProps {
  images: (string | undefined)[];
  videos?: (string | undefined)[];
  alt?: string;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenGallery({
  images,
  videos = [],
  alt = 'Product image',
  initialIndex = 0,
  isOpen,
  onClose
}: FullscreenGalleryProps) {
  // Filter out undefined values and combine images and videos
  const validImages = images.filter((img): img is string => !!img);
  const validVideos = videos.filter((vid): vid is string => !!vid);

  const mediaItems = [
    ...validImages.map(img => ({ type: 'image' as const, url: img })),
    ...validVideos.map(vid => ({ type: 'video' as const, url: vid }))
  ];

  // Carousel auto-play
  const {
    currentIndex,
    isPlaying,
    goToNext: carouselGoToNext,
    goToPrevious: carouselGoToPrevious,
    goToIndex: carouselGoToIndex,
    togglePlayPause,
    pauseAutoPlay,
    resumeAutoPlay
  } = useCarousel({
    totalItems: mediaItems.length,
    initialIndex,
    interval: 5000,
    autoPlay: true
  });

  const [isManualNavigation, setIsManualNavigation] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const currentMedia = mediaItems[currentIndex];

  // Reset manual navigation flag when auto-play advances
  useEffect(() => {
    if (isPlaying) {
      setIsManualNavigation(false);
    }
  }, [currentIndex, isPlaying]);

  // Wrap carousel navigation with animation and pause auto-play
  const goToPrevious = useCallback(() => {
    setIsManualNavigation(true);
    pauseAutoPlay();  // Pause when user navigates manually
    carouselGoToPrevious();
  }, [pauseAutoPlay, carouselGoToPrevious]);

  const goToNext = useCallback(() => {
    setIsManualNavigation(true);
    pauseAutoPlay();  // Pause when user navigates manually
    carouselGoToNext();
  }, [pauseAutoPlay, carouselGoToNext]);

  const goToIndex = (index: number) => {
    setIsManualNavigation(true);
    carouselGoToIndex(index);  // This already pauses auto-play in the hook
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  if (!isOpen || mediaItems.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black animate-fadeIn">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-24 right-6 z-[60] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group"
        aria-label="Cerrar galería"
      >
        <svg
          className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main content area - Full width */}
      <div className="flex h-full w-full">
        {/* Main media display */}
        <div className="w-full relative flex items-center justify-center px-4 py-20 sm:px-8 sm:py-24 md:px-16 md:py-24">
          {currentMedia.type === 'image' ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <S3GalleryImage
                path={currentMedia.url}
                alt={`${alt} ${currentIndex + 1}`}
                objectFit="contain"
                className={`max-w-full max-h-full ${
                  isManualNavigation ? '' : 'transition-all duration-150'
                }`}
              />
            </div>
          ) : (
            <video
              key={currentMedia.url}
              src={currentMedia.url}
              controls
              autoPlay
              className={`max-w-full max-h-full object-contain ${
                isManualNavigation ? '' : 'transition-all duration-150'
              }`}
              playsInline
              onPlay={() => {
                // Pausar auto-play del carrusel cuando video empieza
                pauseAutoPlay();
              }}
              onEnded={() => {
                // Cuando video termina, avanzar al siguiente y reanudar auto-play
                resumeAutoPlay();
                carouselGoToNext();
              }}
              onPause={(e) => {
                // Si usuario pausa video manualmente, no hacer nada
                // (el auto-play ya está pausado desde onPlay)
              }}
            >
              Tu navegador no soporta el elemento de video.
            </video>
          )}

          {/* Navigation arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Imagen anterior"
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={goToNext}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Imagen siguiente"
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Carousel controls - dots and play/pause */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full">
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
                dotSize="md"
                variant="light"
              />

              {/* Counter */}
              <div className="flex items-center gap-3 text-sm text-white">
                <span className="font-medium">
                  {currentIndex + 1}/{mediaItems.length}
                </span>
                {currentMedia.type === 'video' && (
                  <>
                    <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <span>Video</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
