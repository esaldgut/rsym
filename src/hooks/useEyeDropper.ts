'use client';

/**
 * useEyeDropper - Hook for native EyeDropper API integration
 *
 * Provides a cross-browser color picker using the native EyeDropper API.
 * Falls back gracefully with user-friendly messages on unsupported browsers.
 *
 * Browser Support:
 * - Chrome 95+: Full support
 * - Edge 95+: Full support
 * - Safari 15.1+: Full support
 * - Firefox 116+: Support (recent)
 *
 * @example
 * ```tsx
 * const { pickColor, isSupported, isPicking, error } = useEyeDropper();
 *
 * const handlePick = async () => {
 *   const hexColor = await pickColor();
 *   if (hexColor) {
 *     console.log('Selected color:', hexColor);
 *   }
 * };
 * ```
 */

import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * EyeDropper API type definitions
 * Note: Not all browsers have these types, so we define them here
 */
interface EyeDropperResult {
  sRGBHex: string; // e.g., "#ff5500"
}

interface EyeDropperAPI {
  open: (options?: { signal?: AbortSignal }) => Promise<EyeDropperResult>;
}

declare global {
  interface Window {
    EyeDropper?: new () => EyeDropperAPI;
  }
}

export interface UseEyeDropperOptions {
  /** Called when color is successfully picked */
  onColorPicked?: (hexColor: string) => void;
  /** Called when picking is cancelled */
  onCancel?: () => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
}

export interface UseEyeDropperReturn {
  /** Function to initiate color picking */
  pickColor: () => Promise<string | null>;
  /** Whether the EyeDropper API is supported in this browser */
  isSupported: boolean;
  /** Whether a color pick operation is currently in progress */
  isPicking: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
}

// ============================================================================
// BROWSER SUPPORT CHECK
// ============================================================================

/**
 * Check if the EyeDropper API is available in this browser
 */
function checkEyeDropperSupport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'EyeDropper' in window;
}

/**
 * Get user-friendly browser support message
 */
function getBrowserSupportMessage(): string {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('firefox')) {
    const versionMatch = userAgent.match(/firefox\/(\d+)/);
    const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
    if (version < 116) {
      return `Firefox ${version} no soporta Eye Dropper. Actualiza a Firefox 116 o superior.`;
    }
  }

  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'Safari en versiones anteriores a 15.1 no soporta Eye Dropper.';
  }

  return 'Tu navegador no soporta la herramienta Eye Dropper. Prueba con Chrome, Edge, o Safari.';
}

// ============================================================================
// HOOK
// ============================================================================

export function useEyeDropper(options: UseEyeDropperOptions = {}): UseEyeDropperReturn {
  const { onColorPicked, onCancel, onError } = options;

  // State
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isPicking, setIsPicking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check support on mount
  useEffect(() => {
    setIsSupported(checkEyeDropperSupport());
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Pick color
  const pickColor = useCallback(async (): Promise<string | null> => {
    // Check support
    if (!checkEyeDropperSupport()) {
      const message = getBrowserSupportMessage();
      setError(message);
      onError?.(new Error(message));
      console.warn('[useEyeDropper] Browser not supported:', message);
      return null;
    }

    // Check if already picking
    if (isPicking) {
      console.warn('[useEyeDropper] Already picking color, ignoring duplicate request');
      return null;
    }

    console.log('[useEyeDropper] Starting color pick...');
    setIsPicking(true);
    setError(null);

    try {
      // Create EyeDropper instance
      const eyeDropper = new window.EyeDropper!();

      // Create abort controller for potential cancellation
      const controller = new AbortController();

      // Open the eye dropper
      const result = await eyeDropper.open({ signal: controller.signal });

      console.log('[useEyeDropper] Color picked:', result.sRGBHex);

      // Call success callback
      onColorPicked?.(result.sRGBHex);

      return result.sRGBHex;

    } catch (err) {
      // Handle user cancellation (Escape key)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[useEyeDropper] Color pick cancelled by user');
        onCancel?.();
        return null;
      }

      // Handle other errors
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al seleccionar color';
      console.error('[useEyeDropper] Error picking color:', errorMessage);
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      return null;

    } finally {
      setIsPicking(false);
    }
  }, [isPicking, onColorPicked, onCancel, onError]);

  return {
    pickColor,
    isSupported,
    isPicking,
    error,
    clearError
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useEyeDropper;
