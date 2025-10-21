'use client';

import { useState, useRef } from 'react';
import { S3GalleryImage } from '@/components/ui/S3GalleryImage';

interface ProductGalleryHeaderProps {
  images: (string | undefined)[];
  videos?: (string | undefined)[];
  alt?: string;
  onOpenFullscreen?: () => void;
}

export function ProductGalleryHeader({
  images,
  videos = [],
  alt = 'Product image',
  onOpenFullscreen
}: ProductGalleryHeaderProps) {
  // Filter out undefined values and combine images and videos
  const validImages = images.filter((img): img is string => !!img);
  const validVideos = videos.filter((vid): vid is string => !!vid);

  const mediaItems = [
    ...validImages.map(img => ({ type: 'image' as const, url: img })),
    ...validVideos.map(vid => ({ type: 'video' as const, url: vid }))
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
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

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

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
              className="transition-transform duration-300 group-hover:scale-105"
            />

            {/* Hint overlay - appears on hover for images */}
            {showHint && onOpenFullscreen && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
                  <div className="flex items-center gap-3 text-gray-900">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110"
              aria-label="Imagen anterior"
            >
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110"
              aria-label="Imagen siguiente"
            >
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Media type badge for videos */}
        {currentMedia.type === 'video' && (
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            Video
          </div>
        )}
      </div>
    </div>
  );
}
