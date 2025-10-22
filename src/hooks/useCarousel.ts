'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCarouselOptions {
  totalItems: number;
  initialIndex?: number;
  interval?: number;        // Milisegundos entre cambios (default: 5000)
  autoPlay?: boolean;       // Iniciar auto-play (default: true)
  onIndexChange?: (index: number) => void;
}

interface UseCarouselReturn {
  currentIndex: number;
  isPlaying: boolean;
  goToNext: () => void;
  goToPrevious: () => void;
  goToIndex: (index: number) => void;
  togglePlayPause: () => void;
  pauseAutoPlay: () => void;
  resumeAutoPlay: () => void;
}

/**
 * Hook para manejar carrusel automático con auto-play
 * Útil para galerías de productos con imágenes y videos
 */
export function useCarousel({
  totalItems,
  initialIndex = 0,
  interval = 5000,
  autoPlay = true,
  onIndexChange
}: UseCarouselOptions): UseCarouselReturn {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para ir al siguiente item
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = prev === totalItems - 1 ? 0 : prev + 1;
      onIndexChange?.(nextIndex);
      return nextIndex;
    });
  }, [totalItems, onIndexChange]);

  // Función para ir al item anterior
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => {
      const prevIndex = prev === 0 ? totalItems - 1 : prev - 1;
      onIndexChange?.(prevIndex);
      return prevIndex;
    });
  }, [totalItems, onIndexChange]);

  // Función para ir a un índice específico
  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < totalItems) {
      setCurrentIndex(index);
      onIndexChange?.(index);
      // Pausar auto-play cuando usuario navega manualmente
      setIsPlaying(false);
    }
  }, [totalItems, onIndexChange]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Pausar auto-play
  const pauseAutoPlay = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Reanudar auto-play
  const resumeAutoPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // Effect para manejar auto-play
  useEffect(() => {
    // Limpiar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Iniciar nuevo intervalo si está en modo play
    if (isPlaying && totalItems > 1) {
      intervalRef.current = setInterval(() => {
        goToNext();
      }, interval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, totalItems, interval, goToNext]);

  // Reset cuando cambia totalItems
  useEffect(() => {
    if (currentIndex >= totalItems) {
      setCurrentIndex(0);
    }
  }, [totalItems, currentIndex]);

  return {
    currentIndex,
    isPlaying,
    goToNext,
    goToPrevious,
    goToIndex,
    togglePlayPause,
    pauseAutoPlay,
    resumeAutoPlay
  };
}
