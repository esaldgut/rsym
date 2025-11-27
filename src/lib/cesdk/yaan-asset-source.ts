/**
 * YAAN Custom Asset Source for CE.SDK
 *
 * Implements the official IMG.LY Asset Source API to integrate YAAN-branded
 * travel stickers into the CE.SDK asset library.
 *
 * Features:
 * - 10 curated travel-themed stickers (plane, camera, palm tree, etc.)
 * - Search and filter functionality
 * - Pagination support
 * - Proper meta properties for CE.SDK integration
 * - Full compatibility with CE.SDK asset system
 * - API-based asset fetching with analytics tracking
 *
 * Architecture:
 * - Implements AssetSourceAPI interface
 * - Provides findAssets() for searching/listing
 * - Provides applyAsset() for canvas integration
 * - Uses proper CE.SDK block types and fill types
 * - Fetches assets from /api/assets/stickers (FASE C.2)
 *
 * FASE C.2 Migration (2025-11-18):
 * - Migrated from hardcoded array to API-based fetching
 * - Added analytics tracking via API endpoint
 * - Prepared for future S3 migration (Phase 2)
 * - Maintained backward compatibility with CE.SDK
 *
 * References:
 * - Documentation: docs/CESDK_NEXTJS_LLMS_FULL.txt
 * - IMG.LY Best Practices: Asset Source API
 * - API Endpoint: /api/assets/stickers
 *
 * @example
 * ```typescript
 * import { createYaanAssetSource } from '@/lib/cesdk/yaan-asset-source';
 *
 * // Register with CE.SDK
 * await cesdk.engine.asset.addAssetSource(
 *   'yaan-travel-stickers',
 *   createYaanAssetSource()
 * );
 *
 * // Add UI entry
 * cesdk.ui.addAssetLibraryEntry({
 *   id: 'yaan-entry',
 *   sourceIds: ['yaan-travel-stickers'],
 *   sceneMode: 'Design'
 * });
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export interface YaanAsset {
  id: string;
  name: string;
  category: YaanAssetCategory;
  type: 'sticker';
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

export interface AssetResult {
  id: string;
  meta: {
    uri: string;
    thumbUri?: string;
    kind: string;
    fillType?: string;
    blockType?: string;
  };
  context?: {
    sourceId: string;
  };
  label?: string;
  tags?: string[];
  [key: string]: any;
}

export interface FindAssetsResult {
  assets: AssetResult[];
  currentPage: number;
  nextPage?: number;
  total: number;
}

// ============================================================================
// API CONFIGURATION (FASE C.2)
// ============================================================================

/**
 * YAAN Stickers API Base URL
 *
 * FASE C.2: Migrated from hardcoded array to API-based fetching
 * - Enables analytics tracking
 * - Prepares for future S3 migration
 * - Centralizes asset management
 */
const STICKERS_API_URL = '/api/assets/stickers';

/**
 * Asset cache for performance optimization
 *
 * Cache API responses for 5 minutes to reduce server load and improve UX.
 * CE.SDK may call findAssets() multiple times during UI interactions.
 */
interface AssetCache {
  data: YaanAsset[];
  timestamp: number;
  query: string | null;
  category: string | null;
}

let assetCache: AssetCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// HELPER FUNCTIONS (FASE C.2 - API-based)
// ============================================================================

/**
 * Fetch stickers from API with caching
 *
 * FASE C.2: Replaced local array with API call for analytics tracking
 */
async function fetchStickers(
  query: string | null = null,
  category: string | null = null
): Promise<YaanAsset[]> {
  // Check cache validity
  if (
    assetCache &&
    assetCache.query === query &&
    assetCache.category === category &&
    Date.now() - assetCache.timestamp < CACHE_TTL
  ) {
    console.log('[YaanAssetSource] ⚡ Using cached stickers');
    return assetCache.data;
  }

  console.log('[YaanAssetSource] 🌐 Fetching stickers from API:', { query, category });

  try {
    // Build API URL with query parameters
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    params.append('perPage', '100'); // Get all stickers (currently 10, but prepared for scaling)

    const url = `${STICKERS_API_URL}?${params.toString()}`;

    // Fetch from API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data?.assets) {
      throw new Error('Invalid API response format');
    }

    const stickers = result.data.assets as YaanAsset[];

    // Update cache
    assetCache = {
      data: stickers,
      timestamp: Date.now(),
      query,
      category
    };

    console.log(`[YaanAssetSource] ✅ Fetched ${stickers.length} stickers from API`);

    return stickers;

  } catch (error) {
    console.error('[YaanAssetSource] ❌ Error fetching stickers:', error);

    // Fallback: Return empty array instead of breaking the editor
    // This graceful degradation ensures CE.SDK continues working
    return [];
  }
}

/**
 * Paginate asset array (kept for backward compatibility)
 */
function paginateAssets(
  assets: YaanAsset[],
  page: number = 0,
  perPage: number = 20
): {
  items: YaanAsset[];
  currentPage: number;
  nextPage: number | undefined;
  total: number;
} {
  const start = page * perPage;
  const end = start + perPage;
  const items = assets.slice(start, end);
  const hasMore = end < assets.length;

  return {
    items,
    currentPage: page,
    nextPage: hasMore ? page + 1 : undefined,
    total: assets.length
  };
}

/**
 * Convert YaanAsset to CE.SDK AssetResult format
 */
function toAssetResult(asset: YaanAsset): AssetResult {
  return {
    id: asset.id,
    label: asset.name,
    tags: asset.keywords,
    meta: {
      uri: asset.assetUrl,
      thumbUri: asset.thumbnailUrl,
      kind: 'sticker',
      fillType: '//ly.img.ubq/fill/image',
      blockType: '//ly.img.ubq/graphic'
    },
    context: {
      sourceId: 'yaan-travel-stickers'
    }
  };
}

// ============================================================================
// ASSET SOURCE FACTORY
// ============================================================================

/**
 * Creates YAAN Custom Asset Source compatible with CE.SDK Asset Source API
 *
 * @returns Asset source object with findAssets and applyAsset methods
 */
export function createYaanAssetSource() {
  return {
    /**
     * Find assets by query with pagination
     *
     * FASE C.2: Updated to fetch from API instead of hardcoded array
     *
     * @param queryData - Search query and pagination options
     * @returns Promise resolving to asset list with pagination info
     */
    async findAssets(queryData: {
      query?: string | null;
      page?: number;
      perPage?: number;
    }): Promise<FindAssetsResult> {
      console.log('[YaanAssetSource] 🔍 Finding assets:', queryData);

      try {
        // Fetch stickers from API (with caching)
        const stickers = await fetchStickers(queryData.query || null);

        // Paginate results (local pagination after fetching all)
        const paginated = paginateAssets(
          stickers,
          queryData.page || 0,
          queryData.perPage || 20
        );

        // Convert to CE.SDK format
        const assetResults = paginated.items.map(toAssetResult);

        console.log(`[YaanAssetSource] ✅ Found ${assetResults.length} assets (page ${paginated.currentPage})`);

        return {
          assets: assetResults,
          currentPage: paginated.currentPage,
          nextPage: paginated.nextPage,
          total: paginated.total
        };

      } catch (error) {
        console.error('[YaanAssetSource] ❌ Find assets error:', error);

        // Return empty result on error (graceful degradation)
        return {
          assets: [],
          currentPage: 0,
          total: 0
        };
      }
    },

    /**
     * Get asset data for applying to canvas
     *
     * FASE C.2: Updated to work with API-fetched assets
     *
     * @param assetResult - Asset result from findAssets
     * @returns Asset data for CE.SDK to apply to canvas
     */
    async applyAsset(assetResult: AssetResult): Promise<any> {
      console.log('[YaanAssetSource] 🎨 Applying asset:', assetResult.id);

      try {
        // Find asset in cache or fetch from API
        let asset: YaanAsset | undefined;

        if (assetCache && assetCache.data.length > 0) {
          asset = assetCache.data.find(a => a.id === assetResult.id);
        }

        // If not in cache, fetch all assets and find it
        if (!asset) {
          console.log('[YaanAssetSource] 🌐 Asset not in cache, fetching from API...');
          const allStickers = await fetchStickers();
          asset = allStickers.find(a => a.id === assetResult.id);
        }

        if (!asset) {
          throw new Error(`Asset not found: ${assetResult.id}`);
        }

        // Return asset application data for CE.SDK
        const applicationData = {
          meta: {
            uri: asset.assetUrl,
            kind: 'sticker',
            fillType: '//ly.img.ubq/fill/image'
          },
          payload: {
            // Image fill configuration
            imageFileURI: asset.assetUrl
          }
        };

        console.log('[YaanAssetSource] ✅ Asset applied successfully');

        return applicationData;

      } catch (error) {
        console.error('[YaanAssetSource] ❌ Apply asset error:', error);
        throw error;
      }
    },

    /**
     * Get credits info (optional)
     * Not implemented for YAAN assets
     */
    async getCredits(): Promise<any> {
      return null;
    },

    /**
     * Get license info (optional)
     * YAAN assets are proprietary
     */
    async getLicense(): Promise<any> {
      return {
        id: 'yaan-proprietary',
        name: 'YAAN Proprietary License',
        url: 'https://yaan.com.mx/terms'
      };
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default createYaanAssetSource;
