'use client';

/**
 * AssetLibraryYAAN - YAAN Branded Asset Library
 *
 * Provides curated collection of stickers, icons, and typography for CE.SDK
 * with YAAN travel and tourism branding.
 *
 * Features:
 * - Travel-themed stickers (planes, cameras, landmarks, etc.)
 * - YAAN branded icons and shapes
 * - Custom typography collection
 * - Upload custom assets from URLs
 * - Grid layout with search/filter
 * - Pink-to-purple gradient UI
 *
 * @example
 * ```tsx
 * <AssetLibraryYAAN
 *   cesdkInstance={cesdk}
 *   onAssetAdd={(assetId) => console.log('Added:', assetId)}
 * />
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

// ============================================================================
// TYPES
// ============================================================================

export interface YaanAsset {
  id: string;
  name: string;
  category: YaanAssetCategory;
  type: 'sticker' | 'icon' | 'shape' | 'text';
  thumbnailUrl: string;
  assetUrl: string;
  keywords: string[];
}

export type YaanAssetCategory =
  | 'travel'
  | 'adventure'
  | 'landmarks'
  | 'transportation'
  | 'nature'
  | 'food'
  | 'activities'
  | 'decorative';

export interface YaanFont {
  id: string;
  name: string;
  family: string;
  weight: string;
  style: 'normal' | 'italic';
  url: string;
  preview: string;
}

export interface AssetLibraryYAANProps {
  /** CE.SDK instance */
  cesdkInstance: any;

  /** Callback when asset is added to canvas */
  onAssetAdd?: (assetId: string) => void;

  /** Custom className */
  className?: string;
}

// ============================================================================
// YAAN CURATED ASSETS
// ============================================================================

/**
 * Curated collection of travel-themed stickers and icons
 * In production, these would come from YAAN's S3 bucket
 */
export const YaanCuratedAssets: YaanAsset[] = [
  // Transportation
  {
    id: 'yaan-plane-1',
    name: 'Avión',
    category: 'transportation',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Airplane_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Airplane_1.png',
    keywords: ['avión', 'vuelo', 'viajar', 'airplane', 'flight'],
  },
  {
    id: 'yaan-camera-1',
    name: 'Cámara',
    category: 'activities',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Camera_2.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Camera_2.png',
    keywords: ['cámara', 'foto', 'fotografía', 'camera', 'photography'],
  },
  {
    id: 'yaan-palm-tree-1',
    name: 'Palmera',
    category: 'nature',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Palmtree_2.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Palmtree_2.png',
    keywords: ['palmera', 'playa', 'tropical', 'palm', 'beach'],
  },
  {
    id: 'yaan-sun-1',
    name: 'Sol',
    category: 'nature',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Sun_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Sun_1.png',
    keywords: ['sol', 'verano', 'sun', 'summer'],
  },
  {
    id: 'yaan-compass-1',
    name: 'Brújula',
    category: 'travel',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Compass_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Compass_1.png',
    keywords: ['brújula', 'navegación', 'dirección', 'compass', 'navigation'],
  },
  {
    id: 'yaan-mountain-1',
    name: 'Montaña',
    category: 'nature',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Mountain_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Mountain_1.png',
    keywords: ['montaña', 'aventura', 'escalada', 'mountain', 'hiking'],
  },
  {
    id: 'yaan-backpack-1',
    name: 'Mochila',
    category: 'travel',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Backpack_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Backpack_1.png',
    keywords: ['mochila', 'viajar', 'backpack', 'travel'],
  },
  {
    id: 'yaan-suitcase-1',
    name: 'Maleta',
    category: 'travel',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Suitcase_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Suitcase_1.png',
    keywords: ['maleta', 'viaje', 'equipaje', 'suitcase', 'luggage'],
  },
  {
    id: 'yaan-world-1',
    name: 'Globo Terráqueo',
    category: 'travel',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Globe_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Globe_1.png',
    keywords: ['mundo', 'globo', 'viaje', 'world', 'globe'],
  },
  {
    id: 'yaan-heart-1',
    name: 'Corazón',
    category: 'decorative',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Heart_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Heart_1.png',
    keywords: ['corazón', 'amor', 'favorito', 'heart', 'love'],
  },
];

/**
 * YAAN Typography Collection
 * In production, these would be custom YAAN-licensed fonts
 */
export const YaanFonts: YaanFont[] = [
  {
    id: 'roboto-bold',
    name: 'Roboto Bold',
    family: 'Roboto',
    weight: 'bold',
    style: 'normal',
    url: 'https://cdn.img.ly/assets/v2/ly.img.typeface/fonts/Roboto/Roboto-Bold.ttf',
    preview: 'Aventura YAAN',
  },
  {
    id: 'roboto-regular',
    name: 'Roboto Regular',
    family: 'Roboto',
    weight: 'normal',
    style: 'normal',
    url: 'https://cdn.img.ly/assets/v2/ly.img.typeface/fonts/Roboto/Roboto-Regular.ttf',
    preview: 'Descubre el mundo',
  },
  {
    id: 'roboto-italic',
    name: 'Roboto Italic',
    family: 'Roboto',
    weight: 'normal',
    style: 'italic',
    url: 'https://cdn.img.ly/assets/v2/ly.img.typeface/fonts/Roboto/Roboto-Italic.ttf',
    preview: 'Tu próxima aventura',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function AssetLibraryYAAN({
  cesdkInstance,
  onAssetAdd,
  className = '',
}: AssetLibraryYAANProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [activeTab, setActiveTab] = useState<'stickers' | 'fonts'>('stickers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<YaanAssetCategory | 'all'>('all');
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  // ============================================================================
  // FILTERED ASSETS
  // ============================================================================

  const filteredAssets = YaanCuratedAssets.filter((asset) => {
    // Category filter
    if (selectedCategory !== 'all' && asset.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        asset.name.toLowerCase().includes(query) ||
        asset.keywords.some((keyword) => keyword.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // ============================================================================
  // ASSET HANDLERS
  // ============================================================================

  /**
   * Add sticker/icon to canvas
   */
  const handleAddSticker = useCallback(
    async (asset: YaanAsset) => {
      if (!cesdkInstance) {
        console.warn('[AssetLibraryYAAN] No CE.SDK instance');
        return;
      }

      setIsAddingAsset(true);

      try {
        const engine = cesdkInstance.engine;

        // Create graphic block with image fill
        const block = engine.block.create('//ly.img.ubq/graphic');
        const rectShape = engine.block.createShape('//ly.img.ubq/shape/rect');
        const imageFill = engine.block.createFill('//ly.img.ubq/fill/image');

        // Set image URL
        engine.block.setString(imageFill, 'fill/image/imageFileURI', asset.assetUrl);

        // Assemble block
        engine.block.setShape(block, rectShape);
        engine.block.setFill(block, imageFill);
        engine.block.setKind(block, 'sticker');

        // Add to scene
        const scene = engine.scene.get();
        if (scene) {
          engine.block.appendChild(scene, block);

          // Position at center
          engine.block.setPositionX(block, 0);
          engine.block.setPositionY(block, 0);

          console.log('[AssetLibraryYAAN] ✅ Sticker agregado:', asset.name);

          if (onAssetAdd) {
            onAssetAdd(asset.id);
          }
        }
      } catch (error) {
        console.error('[AssetLibraryYAAN] ❌ Error agregando sticker:', error);
      } finally {
        setIsAddingAsset(false);
      }
    },
    [cesdkInstance, onAssetAdd]
  );

  /**
   * Apply font to selected text block
   */
  const handleApplyFont = useCallback(
    async (font: YaanFont) => {
      if (!cesdkInstance) {
        console.warn('[AssetLibraryYAAN] No CE.SDK instance');
        return;
      }

      try {
        const engine = cesdkInstance.engine;

        // Get selected text blocks
        const selection = engine.block.findAllSelected();
        const textBlocks = selection.filter(
          (id: string) => engine.block.getType(id) === '//ly.img.ubq/text'
        );

        if (textBlocks.length === 0) {
          console.warn('[AssetLibraryYAAN] No hay bloques de texto seleccionados');
          return;
        }

        // Apply font to each text block
        for (const textBlockId of textBlocks) {
          const typeface = {
            name: font.family,
            fonts: [
              {
                uri: font.url,
                subFamily: font.name,
                weight: font.weight,
                style: font.style,
              },
            ],
          };

          engine.block.setFont(textBlockId, font.url, typeface);

          console.log('[AssetLibraryYAAN] ✅ Fuente aplicada:', font.name);
        }

        if (onAssetAdd) {
          onAssetAdd(font.id);
        }
      } catch (error) {
        console.error('[AssetLibraryYAAN] ❌ Error aplicando fuente:', error);
      }
    },
    [cesdkInstance, onAssetAdd]
  );

  // ============================================================================
  // CATEGORY FILTERS
  // ============================================================================

  const categories: { id: YaanAssetCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: '🌎' },
    { id: 'travel', label: 'Viaje', icon: '✈️' },
    { id: 'adventure', label: 'Aventura', icon: '🏔️' },
    { id: 'landmarks', label: 'Lugares', icon: '🗼' },
    { id: 'transportation', label: 'Transporte', icon: '🚗' },
    { id: 'nature', label: 'Naturaleza', icon: '🌿' },
    { id: 'food', label: 'Comida', icon: '🍕' },
    { id: 'activities', label: 'Actividades', icon: '🎯' },
    { id: 'decorative', label: 'Decorativo', icon: '✨' },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Librería YAAN
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Stickers, iconos y tipografía curada para tus momentos
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('stickers')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'stickers'
              ? 'border-pink-500 text-pink-600 dark:text-pink-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🎨 Stickers
        </button>
        <button
          onClick={() => setActiveTab('fonts')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'fonts'
              ? 'border-pink-500 text-pink-600 dark:text-pink-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🔤 Tipografía
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Content */}
      {activeTab === 'stickers' ? (
        <>
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>

          {/* Stickers Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filteredAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleAddSticker(asset)}
                disabled={isAddingAsset}
                className="group relative aspect-square bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-500 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <Image
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg p-2">
                  <p className="text-xs text-white font-medium text-center truncate">
                    {asset.name}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* No Results */}
          {filteredAssets.length === 0 && (
            <div className="text-center py-8">
              <svg
                className="mx-auto w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                No se encontraron stickers con &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Fonts List */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecciona un bloque de texto y haz click en una fuente para aplicarla
            </p>

            {YaanFonts.map((font) => (
              <button
                key={font.id}
                onClick={() => handleApplyFont(font)}
                className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-500 transition-all text-left hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {font.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {font.weight} {font.style !== 'normal' && `• ${font.style}`}
                  </span>
                </div>
                <p
                  className="text-lg text-gray-700 dark:text-gray-300"
                  style={{ fontFamily: font.family, fontWeight: font.weight, fontStyle: font.style }}
                >
                  {font.preview}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AssetLibraryYAAN;
