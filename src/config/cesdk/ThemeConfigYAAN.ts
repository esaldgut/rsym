/**
 * ThemeConfigYAAN - YAAN Brand Theme Configuration for CE.SDK
 *
 * Customizes CE.SDK (Creative Editor SDK) with YAAN's visual identity.
 * Applies pink-500 to purple-600 gradient colors across the editor UI.
 *
 * Color Palette:
 * - Primary Pink: rgb(236, 72, 153) - #EC4899 (pink-500)
 * - Secondary Purple: rgb(147, 51, 234) - #9333EA (purple-600)
 * - Accent Pink (lighter): rgb(244, 114, 182) - #F472B6 (pink-400)
 * - Accent Purple (lighter): rgb(168, 85, 247) - #A855F7 (purple-500)
 *
 * Usage:
 * ```typescript
 * import { getYaanThemeConfig } from '@/config/cesdk/ThemeConfigYAAN';
 *
 * const config = {
 *   ...baseConfig,
 *   ...getYaanThemeConfig()
 * };
 * ```
 */

// ============================================================================
// COLOR DEFINITIONS
// ============================================================================

/**
 * YAAN Brand Colors in CE.SDK Color Format
 * CE.SDK uses normalized RGB values (0.0 - 1.0) instead of 0-255
 */
export const YaanColors = {
  // Primary Brand Colors
  pink500: { r: 0.925, g: 0.282, b: 0.6, a: 1.0 },      // rgb(236, 72, 153)
  purple600: { r: 0.576, g: 0.2, b: 0.918, a: 1.0 },    // rgb(147, 51, 234)

  // Accent Colors
  pink400: { r: 0.957, g: 0.447, b: 0.714, a: 1.0 },    // rgb(244, 114, 182)
  purple500: { r: 0.659, g: 0.333, b: 0.969, a: 1.0 },  // rgb(168, 85, 247)

  // Transparent Variants (for overlays)
  pink500_70: { r: 0.925, g: 0.282, b: 0.6, a: 0.7 },
  purple600_70: { r: 0.576, g: 0.2, b: 0.918, a: 0.7 },
  pink500_39: { r: 0.925, g: 0.282, b: 0.6, a: 0.39 },  // Overlay dimming
  pink500_10: { r: 0.925, g: 0.282, b: 0.6, a: 0.1 },   // Subtle backgrounds

  // Neutral Colors
  white: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
  black: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
  transparent: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },

  // Grays (for borders and backgrounds)
  gray200: { r: 0.898, g: 0.898, b: 0.898, a: 1.0 },    // rgb(229, 229, 229)
  gray700: { r: 0.259, g: 0.259, b: 0.259, a: 1.0 },    // rgb(66, 66, 66)
} as const;

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

/**
 * Page Configuration with YAAN Branding
 */
export const YaanPageConfig = {
  /**
   * Page frame colors
   * Inner border is transparent, outer uses subtle pink
   */
  innerBorderColor: YaanColors.transparent,
  outerBorderColor: YaanColors.pink500_10,

  /**
   * Margin colors for bleed areas
   * Uses subtle pink to indicate print margins
   */
  marginFillColor: YaanColors.pink500_10,
  marginFrameColor: YaanColors.pink500,

  /**
   * Page title styling
   * White text with YAAN pink for visibility
   */
  title: {
    color: YaanColors.white,
    show: true,
    showOnSinglePage: true,
    showPageTitleTemplate: true,
  },
} as const;

/**
 * Viewport/Canvas Configuration with YAAN Branding
 */
export const YaanCanvasConfig = {
  /**
   * Selection and highlight colors
   * Primary highlight uses YAAN pink-500
   */
  highlightColor: YaanColors.pink500,

  /**
   * Placeholder highlight uses secondary purple
   * Differentiates placeholder elements from regular content
   */
  placeholderHighlightColor: YaanColors.purple600,

  /**
   * Handle colors for selection controls
   * White handles with pink outlines
   */
  handleFillColor: YaanColors.white,

  /**
   * Crop mode overlay
   * Dimmed background with pink tint
   */
  cropOverlayColor: YaanColors.pink500_39,

  /**
   * Rotation guides
   * Uses vibrant pink for visibility
   */
  rotationSnappingGuideColor: YaanColors.pink500,

  /**
   * Clear color (background)
   * Transparent by default, can be customized
   */
  clearColor: YaanColors.transparent,

  /**
   * State colors
   */
  errorStateColor: { r: 1.0, g: 0.4, b: 0.4, a: 0.7 },  // Soft red
  progressColor: YaanColors.pink500_70,

  /**
   * Grid and guide colors
   */
  ruleOfThirdsLineColor: { r: 0.75, g: 0.75, b: 0.75, a: 0.75 },
  borderOutlineColor: YaanColors.black,
} as const;

// ============================================================================
// COMPLETE THEME CONFIGURATION
// ============================================================================

/**
 * Returns complete CE.SDK configuration object with YAAN branding
 *
 * @returns Configuration object to merge with CE.SDK config
 *
 * @example
 * ```typescript
 * const config = {
 *   license: 'YOUR_LICENSE_KEY',
 *   baseURL: 'https://cdn.img.ly/...',
 *   ...getYaanThemeConfig()
 * };
 *
 * CreativeEditorSDK.create(container, config).then(cesdk => {
 *   // Editor initialized with YAAN theme
 * });
 * ```
 */
export function getYaanThemeConfig() {
  return {
    ui: {
      /**
       * Page configuration
       * Colors for page frames, margins, and titles
       */
      elements: {
        view: {
          // Canvas/viewport settings
          ...YaanCanvasConfig,
        },
        pages: {
          // Page-specific settings
          ...YaanPageConfig,
        },
      },
    },
  } as const;
}

/**
 * Apply YAAN theme to an already-initialized CE.SDK instance
 *
 * @param cesdk - Initialized CreativeEditorSDK instance
 *
 * @example
 * ```typescript
 * CreativeEditorSDK.create(container, config).then(cesdk => {
 *   applyYaanTheme(cesdk);
 * });
 * ```
 */
export async function applyYaanTheme(cesdk: any) {
  try {
    console.log('[ThemeConfigYAAN] 🎨 Aplicando tema YAAN...');

    // Set base theme to dark (matches YAAN UI)
    cesdk.ui.setTheme('dark');

    // Apply canvas colors via engine settings
    const engine = cesdk.engine;

    // Selection/highlight colors
    if (engine.editor?.setSettingColor) {
      engine.editor.setSettingColor('highlightColor', YaanColors.pink500);
      engine.editor.setSettingColor('placeholderHighlightColor', YaanColors.purple600);
      engine.editor.setSettingColor('handleFillColor', YaanColors.white);
      engine.editor.setSettingColor('cropOverlayColor', YaanColors.pink500_39);
      engine.editor.setSettingColor('rotationSnappingGuideColor', YaanColors.pink500);
      engine.editor.setSettingColor('progressColor', YaanColors.pink500_70);
    }

    // Page colors
    if (engine.editor?.setSettingColor) {
      engine.editor.setSettingColor('page/innerBorderColor', YaanColors.transparent);
      engine.editor.setSettingColor('page/outerBorderColor', YaanColors.pink500_10);
      engine.editor.setSettingColor('page/marginFillColor', YaanColors.pink500_10);
      engine.editor.setSettingColor('page/marginFrameColor', YaanColors.pink500);
      engine.editor.setSettingColor('page/title/color', YaanColors.white);
    }

    console.log('[ThemeConfigYAAN] ✅ Tema YAAN aplicado exitosamente');
  } catch (error) {
    console.error('[ThemeConfigYAAN] ⚠️ Error aplicando tema:', error);
    // Non-critical - continue with default theme
  }
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Convert hex color to CE.SDK color format
 *
 * @param hex - Hex color string (e.g., "#EC4899")
 * @param alpha - Opacity (0.0 - 1.0)
 * @returns CE.SDK color object
 */
export function hexToColor(hex: string, alpha = 1.0) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: alpha,
  };
}

/**
 * Convert RGB color to CE.SDK color format
 *
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @param a - Alpha (0.0-1.0)
 * @returns CE.SDK color object
 */
export function rgbToColor(r: number, g: number, b: number, a = 1.0) {
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
    a,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  YaanColors,
  YaanPageConfig,
  YaanCanvasConfig,
  getYaanThemeConfig,
  applyYaanTheme,
  hexToColor,
  rgbToColor,
};
