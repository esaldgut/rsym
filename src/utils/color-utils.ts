/**
 * Color Utilities for CE.SDK Integration
 *
 * Provides color conversion and manipulation functions for use with
 * CE.SDK's color system. CE.SDK uses normalized RGBA values (0.0-1.0)
 * while browser APIs typically use hex strings or 0-255 RGB values.
 *
 * @example
 * ```typescript
 * import { hexToRgba, rgbaToHex, applyColorToSelectedBlock } from '@/utils/color-utils';
 *
 * // Convert hex to CE.SDK format
 * const color = hexToRgba('#ff5500');
 * // Returns: { r: 1.0, g: 0.33, b: 0.0, a: 1.0 }
 *
 * // Apply to selected block
 * await applyColorToSelectedBlock(engine, color);
 * ```
 */

import type CreativeEditorSDK from '@cesdk/cesdk-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * CE.SDK Color format (normalized 0.0-1.0 values)
 */
export interface RGBAColor {
  r: number; // 0.0 - 1.0
  g: number; // 0.0 - 1.0
  b: number; // 0.0 - 1.0
  a: number; // 0.0 - 1.0
}

/**
 * Standard RGB color format (0-255 values)
 */
export interface RGB255Color {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
  a?: number; // 0.0 - 1.0 (alpha is always normalized)
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert hex color string to CE.SDK RGBA format
 *
 * @param hex - Hex color string (e.g., "#ff5500", "ff5500", "#f50")
 * @param alpha - Optional alpha value (0.0-1.0), defaults to 1.0
 * @returns CE.SDK color object
 *
 * @example
 * hexToRgba('#ff5500'); // { r: 1.0, g: 0.33, b: 0.0, a: 1.0 }
 * hexToRgba('#f50');    // { r: 1.0, g: 0.33, b: 0.0, a: 1.0 } (shorthand)
 * hexToRgba('#ff550080'); // { r: 1.0, g: 0.33, b: 0.0, a: 0.5 } (with alpha)
 */
export function hexToRgba(hex: string, alpha?: number): RGBAColor {
  // Remove # if present
  let cleanHex = hex.replace(/^#/, '');

  // Handle shorthand (e.g., "f50" -> "ff5500")
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map(char => char + char)
      .join('');
  }

  // Handle 8-character hex with alpha (e.g., "ff550080")
  let parsedAlpha = alpha ?? 1.0;
  if (cleanHex.length === 8) {
    const alphaHex = cleanHex.slice(6, 8);
    parsedAlpha = parseInt(alphaHex, 16) / 255;
    cleanHex = cleanHex.slice(0, 6);
  }

  // Parse RGB values
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);

  if (!result) {
    console.warn('[color-utils] Invalid hex color:', hex);
    return { r: 0, g: 0, b: 0, a: 1.0 };
  }

  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: parsedAlpha
  };
}

/**
 * Convert CE.SDK RGBA color to hex string
 *
 * @param rgba - CE.SDK color object
 * @param includeAlpha - Whether to include alpha in output (default: false)
 * @returns Hex color string with # prefix
 *
 * @example
 * rgbaToHex({ r: 1.0, g: 0.33, b: 0.0, a: 1.0 }); // "#ff5500"
 * rgbaToHex({ r: 1.0, g: 0.33, b: 0.0, a: 0.5 }, true); // "#ff550080"
 */
export function rgbaToHex(rgba: RGBAColor, includeAlpha = false): string {
  const toHex = (value: number): string => {
    const clamped = Math.max(0, Math.min(1, value));
    const int = Math.round(clamped * 255);
    return int.toString(16).padStart(2, '0');
  };

  let hex = `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;

  if (includeAlpha) {
    hex += toHex(rgba.a);
  }

  return hex.toUpperCase();
}

/**
 * Convert 0-255 RGB values to CE.SDK normalized format
 *
 * @param rgb - RGB color with 0-255 values
 * @returns CE.SDK color object
 */
export function rgb255ToRgba(rgb: RGB255Color): RGBAColor {
  return {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255,
    a: rgb.a ?? 1.0
  };
}

/**
 * Convert CE.SDK normalized RGBA to 0-255 RGB values
 *
 * @param rgba - CE.SDK color object
 * @returns RGB color with 0-255 values
 */
export function rgbaToRgb255(rgba: RGBAColor): RGB255Color {
  return {
    r: Math.round(rgba.r * 255),
    g: Math.round(rgba.g * 255),
    b: Math.round(rgba.b * 255),
    a: rgba.a
  };
}

// ============================================================================
// CE.SDK INTEGRATION
// ============================================================================

/**
 * Apply color to the currently selected block in CE.SDK
 *
 * @param cesdk - CreativeEditorSDK instance
 * @param color - CE.SDK color object to apply
 * @returns true if color was applied successfully
 *
 * @example
 * const color = hexToRgba('#ff5500');
 * const success = await applyColorToSelectedBlock(cesdkInstance, color);
 */
export async function applyColorToSelectedBlock(
  cesdk: CreativeEditorSDK,
  color: RGBAColor
): Promise<boolean> {
  try {
    const engine = cesdk.engine;

    // Get selected blocks
    const selectedBlocks = engine.block.findAllSelected();

    if (selectedBlocks.length === 0) {
      console.warn('[color-utils] No blocks selected');
      return false;
    }

    console.log(`[color-utils] Applying color to ${selectedBlocks.length} selected block(s):`, rgbaToHex(color));

    // Apply color to each selected block
    for (const blockId of selectedBlocks) {
      // Try to apply to fill color first
      try {
        // Check if block has a fill
        const fill = engine.block.getFill(blockId);

        if (fill) {
          // Check if it's a solid color fill
          const fillType = engine.block.getString(fill, 'fill/type');

          if (fillType === '//ly.img.ubq/fill/color') {
            engine.block.setColor(fill, 'fill/color/value', color);
            console.log(`[color-utils] Applied color to fill of block ${blockId}`);
            continue;
          }
        }
      } catch {
        // Block might not have a fill, try other approaches
      }

      // Try to apply as stroke color
      try {
        if (engine.block.hasStroke(blockId)) {
          engine.block.setStrokeColor(blockId, color);
          console.log(`[color-utils] Applied color to stroke of block ${blockId}`);
          continue;
        }
      } catch {
        // Block might not support stroke
      }

      // Try to create a solid color fill
      try {
        const colorFill = engine.block.createFill('//ly.img.ubq/fill/color');
        engine.block.setColor(colorFill, 'fill/color/value', color);
        engine.block.setFill(blockId, colorFill);
        console.log(`[color-utils] Created and applied color fill to block ${blockId}`);
      } catch (err) {
        console.warn(`[color-utils] Could not apply color to block ${blockId}:`, err);
      }
    }

    return true;

  } catch (error) {
    console.error('[color-utils] Error applying color:', error);
    return false;
  }
}

/**
 * Get the color of the currently selected block
 *
 * @param cesdk - CreativeEditorSDK instance
 * @returns Current color of selected block, or null if none
 */
export function getSelectedBlockColor(cesdk: CreativeEditorSDK): RGBAColor | null {
  try {
    const engine = cesdk.engine;
    const selectedBlocks = engine.block.findAllSelected();

    if (selectedBlocks.length === 0) {
      return null;
    }

    const blockId = selectedBlocks[0];

    // Try to get fill color
    try {
      const fill = engine.block.getFill(blockId);
      if (fill) {
        const color = engine.block.getColor(fill, 'fill/color/value');
        return color as RGBAColor;
      }
    } catch {
      // No fill color
    }

    // Try to get stroke color
    try {
      if (engine.block.hasStroke(blockId)) {
        const color = engine.block.getStrokeColor(blockId);
        return color as RGBAColor;
      }
    } catch {
      // No stroke color
    }

    return null;

  } catch (error) {
    console.error('[color-utils] Error getting selected block color:', error);
    return null;
  }
}

// ============================================================================
// COLOR MANIPULATION
// ============================================================================

/**
 * Lighten a color by a percentage
 *
 * @param color - CE.SDK color object
 * @param amount - Amount to lighten (0.0-1.0)
 * @returns Lightened color
 */
export function lightenColor(color: RGBAColor, amount: number): RGBAColor {
  return {
    r: Math.min(1, color.r + (1 - color.r) * amount),
    g: Math.min(1, color.g + (1 - color.g) * amount),
    b: Math.min(1, color.b + (1 - color.b) * amount),
    a: color.a
  };
}

/**
 * Darken a color by a percentage
 *
 * @param color - CE.SDK color object
 * @param amount - Amount to darken (0.0-1.0)
 * @returns Darkened color
 */
export function darkenColor(color: RGBAColor, amount: number): RGBAColor {
  return {
    r: Math.max(0, color.r * (1 - amount)),
    g: Math.max(0, color.g * (1 - amount)),
    b: Math.max(0, color.b * (1 - amount)),
    a: color.a
  };
}

/**
 * Check if a color is light (for determining text color contrast)
 *
 * @param color - CE.SDK color object
 * @returns true if color is considered light
 */
export function isLightColor(color: RGBAColor): boolean {
  // Calculate relative luminance
  const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
  return luminance > 0.5;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  hexToRgba,
  rgbaToHex,
  rgb255ToRgba,
  rgbaToRgb255,
  applyColorToSelectedBlock,
  getSelectedBlockColor,
  lightenColor,
  darkenColor,
  isLightColor
};
