/**
 * Hook para autoplay de videos estilo Instagram/TikTok
 * Usa Intersection Observer para detectar visibilidad y reproducir/pausar automáticamente
 *
 * Referencia: instagram-video-feed.md
 * Patrón: Next.js 15 + React 19 optimizado
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseVideoAutoplayOptions {
  /**
   * Porcentaje de visibilidad necesario para autoplay (0.0 - 1.0)
   * @default 0.7 (70% visible)
   */
  threshold?: number;

  /**
   * Margen adicional para detectar visibilidad antes de entrar en viewport
   * Útil para pre-cargar videos
   * @default '0px'
   */
  rootMargin?: string;

  /**
   * Activar/desactivar autoplay
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback cuando el video empieza a reproducirse
   */
  onPlay?: () => void;

  /**
   * Callback cuando el video se pausa
   */
  onPause?: () => void;

  /**
   * Callback cuando el video termina
   */
  onEnded?: () => void;

  /**
   * Callback cuando hay un error
   */
  onError?: (error: Error) => void;
}

export interface UseVideoAutoplayReturn {
  /**
   * Ref para asignar al elemento <video>
   */
  videoRef: React.RefObject<HTMLVideoElement>;

  /**
   * Estado de reproducción actual
   */
  isPlaying: boolean;

  /**
   * Si el video está visible en viewport
   */
  isInView: boolean;

  /**
   * Si el video está cargado y listo
   */
  isReady: boolean;

  /**
   * Controles manuales
   */
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  mute: () => void;
  unmute: () => void;
  isMuted: boolean;
}

/**
 * Hook principal para autoplay de videos
 *
 * @example
 * ```tsx
 * function VideoCard({ src }) {
 *   const { videoRef, isPlaying, isInView, toggle } = useVideoAutoplay({
 *     threshold: 0.7,
 *     onPlay: () => console.log('Video playing'),
 *     onPause: () => console.log('Video paused')
 *   });
 *
 *   return (
 *     <div>
 *       <video ref={videoRef} src={src} />
 *       {!isPlaying && <PlayButton onClick={toggle} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useVideoAutoplay({
  threshold = 0.7,
  rootMargin = '0px',
  enabled = true,
  onPlay,
  onPause,
  onEnded,
  onError
}: UseVideoAutoplayOptions = {}): UseVideoAutoplayReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Por defecto muted para autoplay

  // ✅ Play manual con error handling
  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      await video.play();
      setIsPlaying(true);
      onPlay?.();
    } catch (error) {
      console.warn('Video autoplay blocked or failed:', error);

      // Si falla el autoplay, intentar con mute
      if (!video.muted) {
        video.muted = true;
        setIsMuted(true);
        try {
          await video.play();
          setIsPlaying(true);
          onPlay?.();
        } catch (retryError) {
          const err = retryError instanceof Error
            ? retryError
            : new Error('Failed to play video');
          onError?.(err);
        }
      } else {
        const err = error instanceof Error
          ? error
          : new Error('Failed to play video');
        onError?.(err);
      }
    }
  }, [onPlay, onError]);

  // ✅ Pause manual
  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  // ✅ Toggle play/pause
  const toggle = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  // ✅ Mute controls
  const mute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      setIsMuted(true);
    }
  }, []);

  const unmute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      setIsMuted(false);
    }
  }, []);

  // ✅ Intersection Observer para autoplay
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);

        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          // Video visible >= threshold, reproducir
          play();
        } else {
          // Video no visible o < threshold, pausar
          pause();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
      pause(); // Pausar al desmontar
    };
  }, [threshold, rootMargin, enabled, play, pause]);

  // ✅ Event listeners para estados del video
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setIsReady(true);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = (event: Event) => {
      const error = new Error(`Video error: ${videoElement.error?.message || 'Unknown error'}`);
      console.error('Video error:', error);
      onError?.(error);
    };

    const handleVolumeChange = () => {
      setIsMuted(videoElement.muted);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('volumechange', handleVolumeChange);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [onPlay, onPause, onEnded, onError]);

  return {
    videoRef,
    isPlaying,
    isInView,
    isReady,
    play,
    pause,
    toggle,
    mute,
    unmute,
    isMuted
  };
}

/**
 * Hook simplificado para casos básicos
 *
 * @example
 * ```tsx
 * function SimpleVideoCard({ src }) {
 *   const { videoRef, isPlaying } = useSimpleVideoAutoplay();
 *
 *   return (
 *     <video
 *       ref={videoRef}
 *       src={src}
 *       className={isPlaying ? 'playing' : 'paused'}
 *     />
 *   );
 * }
 * ```
 */
export function useSimpleVideoAutoplay(threshold = 0.7) {
  return useVideoAutoplay({ threshold });
}
