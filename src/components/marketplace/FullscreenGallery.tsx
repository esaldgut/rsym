'use client';

import { useState, useEffect, useCallback } from 'react';
import { S3GalleryImage } from '@/components/ui/S3GalleryImage';

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

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

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

  const goToPrevious = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, mediaItems.length]);

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, mediaItems.length]);

  const goToIndex = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
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
                className={`max-w-full max-h-full transition-all duration-300 ${
                  isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              />
            </div>
          ) : (
            <video
              key={currentMedia.url}
              src={currentMedia.url}
              controls
              autoPlay
              className={`max-w-full max-h-full object-contain transition-all duration-300 ${
                isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
              playsInline
            >
              Tu navegador no soporta el elemento de video.
            </video>
          )}

          {/* Navigation arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                disabled={isAnimating}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Imagen anterior"
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={goToNext}
                disabled={isAnimating}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Imagen siguiente"
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Media info */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/60 backdrop-blur-md text-white rounded-full">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">
                {currentIndex + 1} / {mediaItems.length}
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
        </div>
      </div>
    </div>
  );
}
