'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProfileImage } from '@/components/ui/ProfileImage';

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
        className="absolute top-6 right-6 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group"
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

      {/* Main content area */}
      <div className="flex h-full">
        {/* Main media display */}
        <div className="flex-1 relative flex items-center justify-center p-8 md:p-16">
          {currentMedia.type === 'image' ? (
            <div className="relative max-w-full max-h-full">
              <ProfileImage
                path={currentMedia.url}
                alt={`${alt} ${currentIndex + 1}`}
                fallbackText=""
                size="lg"
                className={`max-w-full max-h-full object-contain transition-all duration-300 ${
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

        {/* Sidebar with thumbnails (desktop only) */}
        {mediaItems.length > 1 && (
          <div className="hidden md:block w-72 bg-black/40 backdrop-blur-xl border-l border-white/10 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">
                Galería multimedia
              </h3>
              <div className="space-y-3">
                {mediaItems.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    disabled={isAnimating}
                    className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      index === currentIndex
                        ? 'border-pink-500 scale-105 shadow-lg shadow-pink-500/20'
                        : 'border-white/20 hover:border-white/50 hover:scale-105'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={`Ir a ${media.type === 'image' ? 'imagen' : 'video'} ${index + 1}`}
                  >
                    {media.type === 'image' ? (
                      <ProfileImage
                        path={media.url}
                        alt={`Thumbnail ${index + 1}`}
                        fallbackText=""
                        size="md"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        <span className="text-xs text-white/70">Video {index + 1}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile thumbnail strip (bottom) */}
      {mediaItems.length > 1 && (
        <div className="md:hidden absolute bottom-20 left-0 right-0 px-4">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {mediaItems.map((media, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                disabled={isAnimating}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all snap-center ${
                  index === currentIndex
                    ? 'border-pink-500 scale-110 shadow-lg'
                    : 'border-white/30 hover:border-white/60'
                } disabled:opacity-50`}
                aria-label={`Ir a ${media.type === 'image' ? 'imagen' : 'video'} ${index + 1}`}
              >
                {media.type === 'image' ? (
                  <ProfileImage
                    path={media.url}
                    alt={`Thumbnail ${index + 1}`}
                    fallbackText=""
                    size="sm"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
