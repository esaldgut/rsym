'use client';

/**
 * useVideoTranscode - React Hook for Video Transcoding
 *
 * Client-side hook for transcoding videos via the /api/transcode-video endpoint.
 * Handles API communication, progress tracking, and error states.
 *
 * Features:
 * - Async transcoding with loading states
 * - Format selection (webm, mkv)
 * - Quality presets (low, medium, high)
 * - Error handling with user-friendly messages
 * - Capabilities checking
 *
 * @example
 * ```tsx
 * const { transcode, isTranscoding, error } = useVideoTranscode();
 *
 * const handleExport = async (videoBlob: Blob) => {
 *   const result = await transcode(videoBlob, 'video.mp4', { format: 'webm', quality: 'high' });
 *   if (result) {
 *     // Download or use transcoded video
 *     const url = URL.createObjectURL(result);
 *   }
 * };
 * ```
 */

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type TranscodeFormat = 'webm' | 'mkv';
export type TranscodeQuality = 'low' | 'medium' | 'high';

export interface TranscodeOptions {
  /** Output format */
  format: TranscodeFormat;

  /** Quality preset */
  quality: TranscodeQuality;
}

export interface TranscodeResult {
  /** Transcoded video blob */
  blob: Blob;

  /** Output filename */
  filename: string;

  /** MIME type */
  mimeType: string;

  /** Transcoding duration in seconds */
  duration?: number;
}

export interface UseVideoTranscodeReturn {
  /**
   * Transcode a video blob to the specified format
   * @param blob - Input video blob
   * @param filename - Original filename (for extension detection)
   * @param options - Transcoding options (format, quality)
   * @returns Transcoded video result or null if failed
   */
  transcode: (
    blob: Blob,
    filename: string,
    options: TranscodeOptions
  ) => Promise<TranscodeResult | null>;

  /** Whether transcoding is in progress */
  isTranscoding: boolean;

  /** Error message if transcoding failed */
  error: string | null;

  /** Clear current error */
  clearError: () => void;

  /** Check if server supports transcoding */
  checkCapabilities: () => Promise<{
    available: boolean;
    formats: string[];
    maxFileSize: number;
    error?: string;
  }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_ENDPOINT = '/api/transcode-video';

const MIME_TYPES: Record<TranscodeFormat, string> = {
  webm: 'video/webm',
  mkv: 'video/x-matroska'
};

const EXTENSIONS: Record<TranscodeFormat, string> = {
  webm: 'webm',
  mkv: 'mkv'
};

// ============================================================================
// HOOK
// ============================================================================

export function useVideoTranscode(): UseVideoTranscodeReturn {
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // CLEAR ERROR
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // CHECK CAPABILITIES
  // ============================================================================

  const checkCapabilities = useCallback(async () => {
    try {
      // For now, return static capabilities
      // In the future, this could call a dedicated endpoint
      return {
        available: true,
        formats: ['webm', 'mkv'],
        maxFileSize: 500 * 1024 * 1024 // 500MB
      };
    } catch (err) {
      console.error('[useVideoTranscode] Error checking capabilities:', err);
      return {
        available: false,
        formats: [],
        maxFileSize: 0,
        error: 'Error al verificar capacidades del servidor'
      };
    }
  }, []);

  // ============================================================================
  // TRANSCODE
  // ============================================================================

  const transcode = useCallback(async (
    blob: Blob,
    filename: string,
    options: TranscodeOptions
  ): Promise<TranscodeResult | null> => {
    console.log('[useVideoTranscode] 🎬 Starting transcoding:', {
      filename,
      size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      format: options.format,
      quality: options.quality
    });

    setIsTranscoding(true);
    setError(null);

    try {
      // ========================================================================
      // STEP 1: Validate input
      // ========================================================================

      const maxSize = 500 * 1024 * 1024; // 500MB
      if (blob.size > maxSize) {
        const errorMsg = `El archivo es demasiado grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB`;
        setError(errorMsg);
        console.error('[useVideoTranscode] ❌ File too large:', blob.size);
        return null;
      }

      // ========================================================================
      // STEP 2: Build FormData
      // ========================================================================

      const formData = new FormData();
      formData.append('video', blob, filename);
      formData.append('format', options.format);
      formData.append('quality', options.quality);

      // ========================================================================
      // STEP 3: Send to API
      // ========================================================================

      console.log('[useVideoTranscode] 📤 Sending to API...');

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      // ========================================================================
      // STEP 4: Handle errors
      // ========================================================================

      if (!response.ok) {
        let errorMessage = 'Error al transcodificar el video';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response wasn't JSON, use status text
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }

        console.error('[useVideoTranscode] ❌ API error:', errorMessage);
        setError(errorMessage);
        return null;
      }

      // ========================================================================
      // STEP 5: Process response
      // ========================================================================

      const outputBlob = await response.blob();

      // Get duration from header (if provided)
      const durationHeader = response.headers.get('X-Transcode-Duration');
      const duration = durationHeader ? parseFloat(durationHeader) : undefined;

      // Generate output filename
      const baseName = filename.replace(/\.[^.]+$/, '');
      const outputFilename = `${baseName}.${EXTENSIONS[options.format]}`;

      console.log('[useVideoTranscode] ✅ Transcoding complete:', {
        outputSize: `${(outputBlob.size / 1024 / 1024).toFixed(2)} MB`,
        duration: duration ? `${duration.toFixed(2)}s` : 'N/A'
      });

      return {
        blob: outputBlob,
        filename: outputFilename,
        mimeType: MIME_TYPES[options.format],
        duration
      };

    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Error desconocido al transcodificar';

      console.error('[useVideoTranscode] ❌ Error:', errorMessage);
      setError(errorMessage);
      return null;

    } finally {
      setIsTranscoding(false);
    }
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    transcode,
    isTranscoding,
    error,
    clearError,
    checkCapabilities
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Download a transcoded video blob
 * @param result - Transcode result
 */
export function downloadTranscodedVideo(result: TranscodeResult): void {
  const url = URL.createObjectURL(result.blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup URL after short delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Get human-readable format name
 */
export function getFormatDisplayName(format: TranscodeFormat): string {
  const displayNames: Record<TranscodeFormat, string> = {
    webm: 'WebM (VP9)',
    mkv: 'MKV (H.264)'
  };
  return displayNames[format];
}

/**
 * Get quality description
 */
export function getQualityDescription(quality: TranscodeQuality): string {
  const descriptions: Record<TranscodeQuality, string> = {
    low: 'Baja (archivo pequeño)',
    medium: 'Media (equilibrado)',
    high: 'Alta (mejor calidad)'
  };
  return descriptions[quality];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useVideoTranscode;
