'use client';

/**
 * Effect Stack Manager - FASE C.3 (2025-11-18)
 *
 * Manages multiple effects stacked on a single CE.SDK block with drag & drop reordering.
 *
 * Features:
 * - Visualize all effects applied to a block
 * - Drag & drop to reorder effects (changes visual result)
 * - Toggle effects on/off without removing them
 * - Remove effects from stack
 * - Apply preset effect combinations
 * - Real-time preview of changes
 *
 * Effect Stack Order:
 * - Effects are applied from bottom to top of the stack
 * - Example: [Adjustments, Blur, Duotone, Pixelize]
 *   1. Adjustments applied first (bottom)
 *   2. Blur applied second
 *   3. Duotone applied third
 *   4. Pixelize applied last (top)
 *
 * Architecture:
 * - Uses CE.SDK's block.getEffects(), block.insertEffect(), block.removeEffect()
 * - Drag & drop with native HTML5 API (no external library)
 * - Memory-safe: Destroys effects when removed
 *
 * References:
 * - docs/CESDK_NEXTJS_LLMS_FULL.txt (Effect Stacking section, lines 14404-14790)
 * - IMG.LY Best Practices: Effect Management
 *
 * @example
 * ```tsx
 * <EffectStackManager
 *   cesdkInstance={cesdkInstance}
 *   selectedBlockId={selectedBlockId}
 *   onEffectChange={() => console.log('Effect stack changed')}
 * />
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import type CreativeEditorSDK from '@cesdk/cesdk-js';

// ============================================================================
// TYPES
// ============================================================================

export interface EffectStackManagerProps {
  /** CE.SDK instance (required) */
  cesdkInstance: CreativeEditorSDK | null;

  /** Currently selected block ID (required) */
  selectedBlockId: number | null;

  /** Callback when effect stack changes */
  onEffectChange?: () => void;

  /** Optional CSS class */
  className?: string;
}

export interface EffectStackItem {
  id: number;          // Effect block ID
  type: string;        // Effect type (e.g., 'adjustments', 'blur', 'duotone_filter')
  name: string;        // Human-readable name
  enabled: boolean;    // Is effect currently enabled?
  index: number;       // Position in stack (0 = bottom, highest = top)
}

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  effects: Array<{
    type: string;
    params: Record<string, number>;
  }>;
}

// ============================================================================
// EFFECT PRESETS (FASE C.3)
// ============================================================================

/**
 * Predefined effect combinations for one-click application
 */
const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Classic vintage look with warmth and vignette',
    icon: '📷',
    effects: [
      {
        type: 'adjustments',
        params: {
          'effect/adjustments/brightness': 0.1,
          'effect/adjustments/contrast': 0.15,
          'effect/adjustments/saturation': -0.2,
          'effect/adjustments/temperature': 0.15
        }
      },
      {
        type: 'vignette',
        params: {
          'effect/vignette/intensity': 0.6,
          'effect/vignette/offset': 0.3
        }
      }
    ]
  },
  {
    id: 'hdr',
    name: 'HDR',
    description: 'High dynamic range with enhanced details',
    icon: '✨',
    effects: [
      {
        type: 'adjustments',
        params: {
          'effect/adjustments/brightness': 0.05,
          'effect/adjustments/contrast': 0.25,
          'effect/adjustments/saturation': 0.2,
          'effect/adjustments/clarity': 0.4
        }
      }
    ]
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    description: 'Soft dreamy aesthetic with blur and brightness',
    icon: '☁️',
    effects: [
      {
        type: 'adjustments',
        params: {
          'effect/adjustments/brightness': 0.15,
          'effect/adjustments/exposure': 0.3
        }
      },
      {
        type: 'extrude_blur',
        params: {
          'effect/extrude_blur/amount': 0.2
        }
      }
    ]
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'High contrast dramatic look',
    icon: '🎭',
    effects: [
      {
        type: 'adjustments',
        params: {
          'effect/adjustments/contrast': 0.35,
          'effect/adjustments/saturation': -0.3,
          'effect/adjustments/shadows': -0.2,
          'effect/adjustments/highlights': 0.15
        }
      }
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get human-readable name for effect type
 */
function getEffectName(type: string): string {
  const names: Record<string, string> = {
    'adjustments': 'Ajustes',
    'extrude_blur': 'Desenfoque',
    'pixelize': 'Pixelado',
    'vignette': 'Viñeta',
    'duotone_filter': 'Duotono',
    'lut_filter': 'Filtro LUT',
    'recolor': 'Recolorear',
    'cross_cut': 'Cross Cut',
    'liquid': 'Líquido',
    'dot_pattern': 'Patrón de Puntos',
    'half_tone': 'Semitono',
    'linocut': 'Linograbado',
    'outliner': 'Contorno',
    'posterize': 'Posterizar',
    'radial_pixel': 'Pixel Radial',
    'shifter': 'Desplazador',
    'tvglitch': 'Glitch TV'
  };

  return names[type] || type;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EffectStackManager({
  cesdkInstance,
  selectedBlockId,
  onEffectChange,
  className = ''
}: EffectStackManagerProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [effectStack, setEffectStack] = useState<EffectStackItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load effect stack when block changes
   */
  useEffect(() => {
    if (!cesdkInstance || !selectedBlockId) {
      setEffectStack([]);
      return;
    }

    loadEffectStack();
  }, [cesdkInstance, selectedBlockId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Load current effect stack from CE.SDK
   */
  const loadEffectStack = useCallback(() => {
    if (!cesdkInstance || !selectedBlockId) return;

    try {
      const engine = cesdkInstance.engine;

      // Check if block supports effects
      if (!engine.block.supportsEffects(selectedBlockId)) {
        console.log('[EffectStackManager] Block does not support effects');
        setEffectStack([]);
        return;
      }

      // Get all effects applied to the block
      const effectIds = engine.block.getEffects(selectedBlockId);

      console.log(`[EffectStackManager] 📚 Found ${effectIds.length} effects on block`);

      // Build effect stack items
      const stack: EffectStackItem[] = effectIds.map((effectId, index) => {
        const type = engine.block.getType(effectId);
        const enabled = engine.block.isEffectEnabled(effectId);

        return {
          id: effectId,
          type,
          name: getEffectName(type),
          enabled,
          index
        };
      });

      setEffectStack(stack);

    } catch (error) {
      console.error('[EffectStackManager] Error loading effect stack:', error);
      setEffectStack([]);
    }
  }, [cesdkInstance, selectedBlockId]);

  /**
   * Toggle effect on/off
   */
  const handleToggleEffect = useCallback((effectId: number, currentlyEnabled: boolean) => {
    if (!cesdkInstance) return;

    try {
      const engine = cesdkInstance.engine;

      // Toggle effect
      engine.block.setEffectEnabled(effectId, !currentlyEnabled);

      console.log(`[EffectStackManager] ${!currentlyEnabled ? '✅ Enabled' : '⏸️ Disabled'} effect ${effectId}`);

      // Reload stack to update UI
      loadEffectStack();

      // Notify parent
      onEffectChange?.();

    } catch (error) {
      console.error('[EffectStackManager] Error toggling effect:', error);
    }
  }, [cesdkInstance, loadEffectStack, onEffectChange]);

  /**
   * Remove effect from stack
   */
  const handleRemoveEffect = useCallback((effectItem: EffectStackItem) => {
    if (!cesdkInstance || !selectedBlockId) return;

    try {
      const engine = cesdkInstance.engine;

      // Remove effect at index
      engine.block.removeEffect(selectedBlockId, effectItem.index);

      console.log(`[EffectStackManager] 🗑️ Removed effect at index ${effectItem.index}`);

      // Destroy effect to free memory (CRITICAL for memory management)
      engine.block.destroy(effectItem.id);

      console.log(`[EffectStackManager] 🧹 Destroyed effect ${effectItem.id}`);

      // Reload stack
      loadEffectStack();

      // Notify parent
      onEffectChange?.();

    } catch (error) {
      console.error('[EffectStackManager] Error removing effect:', error);
    }
  }, [cesdkInstance, selectedBlockId, loadEffectStack, onEffectChange]);

  /**
   * Drag start handler
   */
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
    console.log(`[EffectStackManager] 🎯 Drag started: index ${index}`);
  }, []);

  /**
   * Drag over handler (allow drop)
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
  }, []);

  /**
   * Drop handler - Reorder effects
   */
  const handleDrop = useCallback((targetIndex: number) => {
    if (!cesdkInstance || !selectedBlockId || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    try {
      const engine = cesdkInstance.engine;

      console.log(`[EffectStackManager] 🔄 Reordering: ${draggedIndex} → ${targetIndex}`);

      // Get the effect being moved
      const movedEffect = effectStack[draggedIndex];

      // Remove effect from old position
      engine.block.removeEffect(selectedBlockId, draggedIndex);

      // Insert effect at new position
      engine.block.insertEffect(selectedBlockId, movedEffect.id, targetIndex);

      console.log(`[EffectStackManager] ✅ Effect reordered successfully`);

      // Reload stack
      loadEffectStack();

      // Notify parent
      onEffectChange?.();

    } catch (error) {
      console.error('[EffectStackManager] Error reordering effects:', error);
    } finally {
      setDraggedIndex(null);
    }
  }, [cesdkInstance, selectedBlockId, draggedIndex, effectStack, loadEffectStack, onEffectChange]);

  /**
   * Apply effect preset
   */
  const handleApplyPreset = useCallback(async (preset: EffectPreset) => {
    if (!cesdkInstance || !selectedBlockId || isApplyingPreset) return;

    setIsApplyingPreset(true);

    try {
      const engine = cesdkInstance.engine;

      console.log(`[EffectStackManager] 🎨 Applying preset: ${preset.name}`);

      // Remove all existing effects
      const existingEffects = engine.block.getEffects(selectedBlockId);
      for (let i = existingEffects.length - 1; i >= 0; i--) {
        const effectId = existingEffects[i];
        engine.block.removeEffect(selectedBlockId, i);
        engine.block.destroy(effectId);
      }

      console.log(`[EffectStackManager] 🧹 Cleared ${existingEffects.length} existing effects`);

      // Apply preset effects
      for (const effectConfig of preset.effects) {
        const effect = engine.block.createEffect(effectConfig.type);
        engine.block.appendEffect(selectedBlockId, effect);

        // Set effect parameters
        for (const [param, value] of Object.entries(effectConfig.params)) {
          engine.block.setFloat(effect, param, value);
        }

        console.log(`[EffectStackManager] ✅ Applied ${effectConfig.type}`);
      }

      console.log(`[EffectStackManager] 🎉 Preset "${preset.name}" applied successfully`);

      // Show notification
      cesdkInstance.ui.showNotification({
        type: 'success',
        message: `Preset "${preset.name}" aplicado`,
        duration: 'short'
      });

      // Reload stack
      loadEffectStack();

      // Notify parent
      onEffectChange?.();

    } catch (error) {
      console.error('[EffectStackManager] Error applying preset:', error);

      cesdkInstance?.ui.showNotification({
        type: 'error',
        message: 'Error al aplicar preset',
        duration: 'short'
      });
    } finally {
      setIsApplyingPreset(false);
    }
  }, [cesdkInstance, selectedBlockId, isApplyingPreset, loadEffectStack, onEffectChange]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!cesdkInstance || !selectedBlockId) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Effect Presets */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-2">Presets Rápidos</h3>
        <div className="grid grid-cols-2 gap-2">
          {EFFECT_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              disabled={isApplyingPreset}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">{preset.icon}</span>
              <span className="text-xs font-medium text-white">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Effect Stack */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-2">
          Efectos Aplicados ({effectStack.length})
        </h3>

        {effectStack.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-6">
            No hay efectos aplicados.
            <br />
            Usa los presets o el panel de filtros.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {effectStack.map((effect, index) => (
              <div
                key={effect.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`
                  flex items-center gap-2 p-2 rounded-lg
                  bg-gray-700 border-2
                  ${draggedIndex === index ? 'border-pink-500 opacity-50' : 'border-transparent'}
                  ${effect.enabled ? '' : 'opacity-60'}
                  cursor-move
                  hover:bg-gray-600 transition-colors
                `}
              >
                {/* Drag Handle */}
                <div className="text-gray-400 text-xs">☰</div>

                {/* Effect Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">
                    {effect.name}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Posición {index + 1} de {effectStack.length}
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => handleToggleEffect(effect.id, effect.enabled)}
                  className={`
                    px-2 py-1 rounded text-[10px] font-medium
                    ${effect.enabled
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }
                    transition-colors
                  `}
                  title={effect.enabled ? 'Deshabilitar' : 'Habilitar'}
                >
                  {effect.enabled ? 'ON' : 'OFF'}
                </button>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveEffect(effect)}
                  className="p-1 rounded hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
                  title="Eliminar efecto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {effectStack.length > 1 && (
          <div className="mt-2 text-[10px] text-gray-400 text-center">
            💡 Arrastra los efectos para cambiar el orden de aplicación
          </div>
        )}
      </div>
    </div>
  );
}
