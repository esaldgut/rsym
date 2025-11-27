'use client';

/**
 * EyeDropperButton - Native Eye Dropper Color Picker for CE.SDK
 *
 * Provides a button to sample colors from anywhere on the screen using
 * the native EyeDropper API. Applies sampled color to selected CE.SDK blocks.
 *
 * Browser Support:
 * - Chrome 95+: Full support
 * - Edge 95+: Full support
 * - Safari 15.1+: Full support
 * - Firefox 116+: Support (recent)
 *
 * @example
 * ```tsx
 * <EyeDropperButton
 *   cesdkInstance={cesdkInstance}
 *   onColorPicked={(color) => console.log('Color:', color)}
 * />
 * ```
 */

import { useState } from 'react';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { useEyeDropper } from '@/hooks/useEyeDropper';
import {
  hexToRgba,
  applyColorToSelectedBlock,
  type RGBAColor
} from '@/utils/color-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface EyeDropperButtonProps {
  /** CE.SDK instance (required) */
  cesdkInstance: CreativeEditorSDK | null;

  /** Called when color is successfully picked and applied */
  onColorPicked?: (color: RGBAColor, hexColor: string) => void;

  /** Optional CSS class for the button */
  className?: string;

  /** Show tooltip (default: true) */
  showTooltip?: boolean;

  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EyeDropperButton({
  cesdkInstance,
  onColorPicked,
  className = '',
  showTooltip = true,
  size = 'md'
}: EyeDropperButtonProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [lastPickedColor, setLastPickedColor] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // ============================================================================
  // HOOKS
  // ============================================================================

  const {
    pickColor,
    isSupported,
    isPicking,
    error,
    clearError
  } = useEyeDropper({
    onColorPicked: async (hexColor) => {
      console.log('[EyeDropperButton] 🎨 Color seleccionado:', hexColor);

      setLastPickedColor(hexColor);

      // Convert to CE.SDK format
      const rgbaColor = hexToRgba(hexColor);

      // Apply to selected block if CE.SDK is available
      if (cesdkInstance) {
        const applied = await applyColorToSelectedBlock(cesdkInstance, rgbaColor);

        if (applied) {
          // Show success feedback
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);

          // Show CE.SDK notification
          cesdkInstance.ui.showNotification({
            type: 'success',
            message: `Color aplicado: ${hexColor.toUpperCase()}`,
            duration: 'short'
          });
        } else {
          // No block selected - show warning
          cesdkInstance.ui.showNotification({
            type: 'warning',
            message: 'Selecciona un elemento para aplicar el color',
            duration: 'medium'
          });
        }
      }

      // Callback
      onColorPicked?.(rgbaColor, hexColor);
    },
    onCancel: () => {
      console.log('[EyeDropperButton] ❌ Color pick cancelado');
    },
    onError: (err) => {
      console.error('[EyeDropperButton] ⚠️ Error:', err.message);

      // Show error in CE.SDK if available
      if (cesdkInstance) {
        cesdkInstance.ui.showNotification({
          type: 'error',
          message: err.message,
          duration: 'medium'
        });
      }
    }
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleClick = async () => {
    // Clear any previous error
    clearError();

    // Start color picking
    await pickColor();
  };

  // ============================================================================
  // SIZE VARIANTS
  // ============================================================================

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Don't render if browser doesn't support EyeDropper
  if (!isSupported) {
    return (
      <div className="relative group">
        <button
          disabled
          title="Eye Dropper no disponible en este navegador"
          className={`
            ${sizeClasses[size]} rounded-lg
            flex items-center justify-center
            bg-gray-700 text-gray-500 cursor-not-allowed opacity-50
            ${className}
          `}
        >
          <EyeDropperIcon className={`${iconSizes[size]} opacity-50`} />
        </button>

        {showTooltip && (
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            Eye Dropper no disponible
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        disabled={isPicking}
        title={showTooltip ? undefined : 'Eye Dropper - Seleccionar color'}
        className={`
          ${sizeClasses[size]} rounded-lg
          flex items-center justify-center
          transition-all duration-200
          ${isPicking
            ? 'bg-gradient-to-r from-pink-600 to-purple-700 animate-pulse cursor-crosshair'
            : showSuccess
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
          }
          shadow-lg hover:shadow-xl text-white
          ${className}
        `}
        style={lastPickedColor && !isPicking ? {
          boxShadow: `0 0 0 3px ${lastPickedColor}40, 0 10px 15px -3px rgba(0, 0, 0, 0.1)`
        } : undefined}
      >
        {isPicking ? (
          <CrosshairIcon className={iconSizes[size]} />
        ) : showSuccess ? (
          <CheckIcon className={iconSizes[size]} />
        ) : (
          <EyeDropperIcon className={iconSizes[size]} />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          {isPicking
            ? 'Haz clic en cualquier color...'
            : error
              ? error
              : 'Eye Dropper - Seleccionar color'
          }
        </span>
      )}

      {/* Last picked color indicator */}
      {lastPickedColor && !isPicking && (
        <div
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: lastPickedColor }}
          title={`Último color: ${lastPickedColor.toUpperCase()}`}
        />
      )}
    </div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function EyeDropperIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
      {/* Droplet shape to distinguish from edit/pencil */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l-2 2"
      />
    </svg>
  );
}

function CrosshairIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="8" strokeWidth={2} />
      <line x1="12" y1="2" x2="12" y2="6" strokeWidth={2} />
      <line x1="12" y1="18" x2="12" y2="22" strokeWidth={2} />
      <line x1="2" y1="12" x2="6" y2="12" strokeWidth={2} />
      <line x1="18" y1="12" x2="22" y2="12" strokeWidth={2} />
    </svg>
  );
}

function CheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default EyeDropperButton;
