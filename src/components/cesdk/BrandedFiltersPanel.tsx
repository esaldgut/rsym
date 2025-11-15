'use client';

/**
 * BrandedFiltersPanel - YAAN Branded Filters and Adjustments Panel
 *
 * Provides image/video filter and adjustment controls for CE.SDK with YAAN branding.
 * Includes basic adjustments (brightness, contrast, saturation) and custom YAAN filter presets.
 *
 * Features:
 * - Basic Adjustments (brightness, contrast, saturation, exposure, temperature)
 * - YAAN Branded Filter Presets (Vibrant, Dreamy, Sunset, etc.)
 * - Real-time preview with CE.SDK
 * - Pink-to-purple gradient UI matching YAAN theme
 * - Reset functionality
 *
 * @example
 * ```tsx
 * <BrandedFiltersPanel
 *   cesdkInstance={cesdk}
 *   selectedBlockId={blockId}
 *   onAdjustmentChange={(adjustments) => console.log(adjustments)}
 * />
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface FilterAdjustments {
  brightness: number;     // -1.0 to 1.0
  contrast: number;       // -1.0 to 1.0
  saturation: number;     // -1.0 to 1.0
  exposure: number;       // -10.0 to 10.0
  temperature: number;    // -1.0 to 1.0
  highlights: number;     // -1.0 to 1.0
  shadows: number;        // -1.0 to 1.0
  clarity: number;        // 0.0 to 1.0
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  adjustments: Partial<FilterAdjustments>;
}

export interface BrandedFiltersPanelProps {
  /** CE.SDK instance */
  cesdkInstance: any;

  /** Currently selected block ID to apply filters to */
  selectedBlockId?: string | null;

  /** Callback when adjustments change */
  onAdjustmentChange?: (adjustments: FilterAdjustments) => void;

  /** Custom className */
  className?: string;
}

// ============================================================================
// YAAN FILTER PRESETS
// ============================================================================

export const YaanFilterPresets: FilterPreset[] = [
  {
    id: 'vibrant',
    name: 'Vibrante',
    description: 'Colores vivos y saturados perfectos para aventuras',
    icon: '🌈',
    adjustments: {
      brightness: 0.1,
      contrast: 0.15,
      saturation: 0.3,
      clarity: 0.2,
    },
  },
  {
    id: 'dreamy',
    name: 'Soñador',
    description: 'Suave y etéreo para momentos mágicos',
    icon: '✨',
    adjustments: {
      brightness: 0.15,
      contrast: -0.1,
      saturation: -0.1,
      exposure: 0.5,
      temperature: 0.1,
    },
  },
  {
    id: 'sunset',
    name: 'Atardecer',
    description: 'Tonos cálidos y dorados',
    icon: '🌅',
    adjustments: {
      brightness: 0.05,
      contrast: 0.1,
      saturation: 0.2,
      temperature: 0.4,
      highlights: 0.1,
    },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Clásico y nostálgico',
    icon: '📷',
    adjustments: {
      brightness: -0.05,
      contrast: 0.15,
      saturation: -0.2,
      temperature: 0.15,
      clarity: -0.1,
    },
  },
  {
    id: 'dramatic',
    name: 'Dramático',
    description: 'Alto contraste para impacto visual',
    icon: '⚡',
    adjustments: {
      brightness: 0.0,
      contrast: 0.4,
      saturation: 0.1,
      highlights: -0.2,
      shadows: 0.2,
      clarity: 0.3,
    },
  },
  {
    id: 'fresh',
    name: 'Fresco',
    description: 'Limpio y brillante',
    icon: '🌿',
    adjustments: {
      brightness: 0.2,
      contrast: 0.1,
      saturation: 0.15,
      exposure: 0.3,
      temperature: -0.1,
    },
  },
];

// ============================================================================
// DEFAULT ADJUSTMENTS
// ============================================================================

const DEFAULT_ADJUSTMENTS: FilterAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  highlights: 0,
  shadows: 0,
  clarity: 0,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function BrandedFiltersPanel({
  cesdkInstance,
  selectedBlockId,
  onAdjustmentChange,
  className = '',
}: BrandedFiltersPanelProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [adjustments, setAdjustments] = useState<FilterAdjustments>(DEFAULT_ADJUSTMENTS);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [effectBlockId, setEffectBlockId] = useState<string | null>(null);

  // ============================================================================
  // EFFECT APPLICATION
  // ============================================================================

  /**
   * Apply adjustments to the selected block
   */
  const applyAdjustments = useCallback(
    (newAdjustments: FilterAdjustments) => {
      if (!cesdkInstance || !selectedBlockId) {
        console.warn('[BrandedFiltersPanel] No CE.SDK instance or selected block');
        return;
      }

      try {
        const engine = cesdkInstance.engine;

        // Create or get effect block
        let effectId = effectBlockId;

        if (!effectId || !engine.block.isValid(effectId)) {
          // Create new adjustments effect
          effectId = engine.block.createEffect('adjustments');
          engine.block.appendChild(selectedBlockId, effectId);
          setEffectBlockId(effectId);
          console.log('[BrandedFiltersPanel] ✅ Created adjustments effect:', effectId);
        }

        // Apply each adjustment
        if (newAdjustments.brightness !== 0) {
          engine.block.setFloat(effectId, 'effect/adjustments/brightness', newAdjustments.brightness);
        }
        if (newAdjustments.contrast !== 0) {
          engine.block.setFloat(effectId, 'effect/adjustments/contrast', newAdjustments.contrast);
        }
        if (newAdjustments.saturation !== 0) {
          engine.block.setFloat(effectId, 'effect/adjustments/saturation', newAdjustments.saturation);
        }
        if (newAdjustments.exposure !== 0) {
          engine.block.setFloat(effectId, 'effect/adjustments/exposure', newAdjustments.exposure);
        }
        if (newAdjustments.temperature !== 0) {
          engine.block.setFloat(effectId, 'effect/adjustments/temperature', newAdjustments.temperature);
        }
        if (newAdjustments.highlights !== 0) {
          engine.block.setFloat(effectId, 'effect/adjustments/highlights', newAdjustments.highlights);
        }
        if (newAdjustments.shadows !== 0) {
          engine.block.setFloat(effectId, 'effect/adjustments/shadows', newAdjustments.shadows);
        }
        if (newAdjustments.clarity !== 0) {
          engine.block.setFloat(effectId, 'effect/adjustments/clarity', newAdjustments.clarity);
        }

        console.log('[BrandedFiltersPanel] 🎨 Ajustes aplicados:', newAdjustments);
      } catch (error) {
        console.error('[BrandedFiltersPanel] ❌ Error aplicando ajustes:', error);
      }
    },
    [cesdkInstance, selectedBlockId, effectBlockId]
  );

  /**
   * Update single adjustment
   */
  const handleAdjustmentChange = (key: keyof FilterAdjustments, value: number) => {
    const newAdjustments = {
      ...adjustments,
      [key]: value,
    };

    setAdjustments(newAdjustments);
    applyAdjustments(newAdjustments);

    if (onAdjustmentChange) {
      onAdjustmentChange(newAdjustments);
    }

    // Clear active preset if manual adjustment
    if (activePreset) {
      setActivePreset(null);
    }
  };

  /**
   * Apply filter preset
   */
  const handleApplyPreset = (preset: FilterPreset) => {
    const newAdjustments = {
      ...DEFAULT_ADJUSTMENTS,
      ...preset.adjustments,
    };

    setAdjustments(newAdjustments);
    applyAdjustments(newAdjustments);
    setActivePreset(preset.id);

    if (onAdjustmentChange) {
      onAdjustmentChange(newAdjustments);
    }

    console.log('[BrandedFiltersPanel] 🎨 Preset aplicado:', preset.name);
  };

  /**
   * Reset all adjustments
   */
  const handleReset = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    applyAdjustments(DEFAULT_ADJUSTMENTS);
    setActivePreset(null);

    // Remove effect block if exists
    if (effectBlockId && cesdkInstance) {
      try {
        const engine = cesdkInstance.engine;
        if (engine.block.isValid(effectBlockId)) {
          engine.block.destroy(effectBlockId);
          console.log('[BrandedFiltersPanel] 🧹 Efecto eliminado');
        }
      } catch (error) {
        console.error('[BrandedFiltersPanel] Error eliminando efecto:', error);
      }
    }

    setEffectBlockId(null);

    if (onAdjustmentChange) {
      onAdjustmentChange(DEFAULT_ADJUSTMENTS);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render adjustment slider
   */
  const renderSlider = (
    label: string,
    key: keyof FilterAdjustments,
    min: number,
    max: number,
    step: number = 0.01
  ) => {
    const value = adjustments[key];
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
            {value.toFixed(2)}
          </span>
        </div>

        <div className="relative">
          {/* Track background */}
          <div className="absolute inset-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />

          {/* Progress fill with YAAN gradient */}
          <div
            className="absolute h-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />

          {/* Slider input */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => handleAdjustmentChange(key, parseFloat(e.target.value))}
            className="relative w-full h-2 bg-transparent appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-white
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:border-2
                       [&::-webkit-slider-thumb]:border-pink-500
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-4
                       [&::-moz-range-thumb]:h-4
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-white
                       [&::-moz-range-thumb]:shadow-lg
                       [&::-moz-range-thumb]:border-2
                       [&::-moz-range-thumb]:border-pink-500
                       [&::-moz-range-thumb]:cursor-pointer"
          />
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!selectedBlockId) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-pink-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Selecciona una imagen o video para aplicar filtros
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Filtros y Ajustes YAAN
        </h3>
        <button
          onClick={handleReset}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Resetear
        </button>
      </div>

      {/* YAAN Filter Presets */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Filtros YAAN
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {YaanFilterPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={`
                p-4 rounded-xl border-2 transition-all duration-300 text-left
                ${
                  activePreset === preset.id
                    ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md'
                }
              `}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{preset.icon}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {preset.name}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Adjustments */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Ajustes Manuales
        </h4>

        <div className="space-y-4">
          {renderSlider('Brillo', 'brightness', -1, 1)}
          {renderSlider('Contraste', 'contrast', -1, 1)}
          {renderSlider('Saturación', 'saturation', -1, 1)}
          {renderSlider('Exposición', 'exposure', -10, 10, 0.1)}
          {renderSlider('Temperatura', 'temperature', -1, 1)}
          {renderSlider('Luces', 'highlights', -1, 1)}
          {renderSlider('Sombras', 'shadows', -1, 1)}
          {renderSlider('Claridad', 'clarity', 0, 1)}
        </div>
      </div>

      {/* Current Preset Indicator */}
      {activePreset && (
        <div className="p-3 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-lg border-2 border-pink-300 dark:border-pink-700">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-pink-600 dark:text-pink-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-pink-800 dark:text-pink-200">
              Filtro aplicado:{' '}
              {YaanFilterPresets.find((p) => p.id === activePreset)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BrandedFiltersPanel;
