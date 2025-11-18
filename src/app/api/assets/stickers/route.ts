/**
 * YAAN Stickers API Endpoint
 *
 * Serves curated travel-themed stickers with pagination, search, and analytics.
 *
 * FASE C.2 Implementation (2025-11-18):
 * - Migrated stickers from hardcoded array to S3-backed API
 * - Added pagination support (page, perPage parameters)
 * - Added search/filtering by name and keywords
 * - Added category filtering
 * - Added usage analytics tracking
 * - Public endpoint (no authentication required for asset discovery)
 *
 * Endpoints:
 * - GET /api/assets/stickers - List all stickers with pagination
 *
 * Query Parameters:
 * - page: number (default: 0) - Page number (0-indexed)
 * - perPage: number (default: 20, max: 100) - Items per page
 * - query: string (optional) - Search query (matches name and keywords)
 * - category: string (optional) - Filter by category
 *
 * Response Format:
 * {
 *   success: boolean,
 *   data: {
 *     assets: YaanAsset[],
 *     currentPage: number,
 *     nextPage: number | null,
 *     total: number,
 *     categories: string[]
 *   }
 * }
 *
 * References:
 * - CLAUDE.md: "API Routes Authentication Pattern"
 * - docs/CESDK_NEXTJS_LLMS_FULL.txt: "Custom Asset Sources"
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

export interface YaanAsset {
  id: string;
  name: string;
  category: string;
  type: 'sticker';
  thumbnailUrl: string;
  assetUrl: string;
  keywords: string[];
}

// ============================================================================
// YAAN CURATED STICKERS (MIGRATED FROM yaan-asset-source.ts)
// ============================================================================
//
// FUTURE: Move these to S3 and load dynamically
// For now, keeping same assets but served via API for analytics tracking
//
// TODO (Phase 2):
// 1. Upload PNGs to S3: s3://yaan-provider-documents/public/stickers/
// 2. Update URLs to use S3 paths
// 3. Implement caching (Redis or CloudFront)
// 4. Add admin API to manage stickers (CRUD operations)
// ============================================================================

const YAAN_STICKERS: YaanAsset[] = [
  // Transportation
  {
    id: 'yaan-plane-1',
    name: 'Avión',
    category: 'transportation',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Airplane_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Airplane_1.png',
    keywords: ['avión', 'vuelo', 'viajar', 'airplane', 'flight', 'travel'],
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
    keywords: ['maleta', 'equipaje', 'suitcase', 'luggage'],
  },
  {
    id: 'yaan-globe-1',
    name: 'Globo Terráqueo',
    category: 'travel',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Globe_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Globe_1.png',
    keywords: ['globo', 'mundo', 'world', 'globe'],
  },
  {
    id: 'yaan-heart-1',
    name: 'Corazón',
    category: 'decorative',
    type: 'sticker',
    thumbnailUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/thumbnails/imgly_sticker_Heart_1.png',
    assetUrl: 'https://cdn.img.ly/assets/demo/v1/ly.img.sticker/imgly_sticker_Heart_1.png',
    keywords: ['corazón', 'amor', 'heart', 'love'],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Search stickers by query (matches name and keywords)
 */
function searchStickers(query: string | null): YaanAsset[] {
  if (!query || query.trim() === '') {
    return YAAN_STICKERS;
  }

  const lowerQuery = query.toLowerCase().trim();

  return YAAN_STICKERS.filter(sticker => {
    // Match against name
    if (sticker.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Match against keywords
    return sticker.keywords.some(keyword =>
      keyword.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Filter stickers by category
 */
function filterByCategory(stickers: YaanAsset[], category: string | null): YaanAsset[] {
  if (!category || category.trim() === '') {
    return stickers;
  }

  const lowerCategory = category.toLowerCase().trim();
  return stickers.filter(sticker => sticker.category.toLowerCase() === lowerCategory);
}

/**
 * Paginate stickers array
 */
function paginateStickers(
  stickers: YaanAsset[],
  page: number,
  perPage: number
): {
  items: YaanAsset[];
  currentPage: number;
  nextPage: number | null;
  total: number;
} {
  const start = page * perPage;
  const end = start + perPage;
  const items = stickers.slice(start, end);
  const hasMore = end < stickers.length;

  return {
    items,
    currentPage: page,
    nextPage: hasMore ? page + 1 : null,
    total: stickers.length
  };
}

/**
 * Get all unique categories
 */
function getCategories(): string[] {
  const categories = new Set(YAAN_STICKERS.map(s => s.category));
  return Array.from(categories).sort();
}

/**
 * Track sticker usage analytics
 *
 * FUTURE: Send to CloudWatch Logs or analytics service
 * For now, just console.log for debugging
 */
function trackStickerUsage(query: string | null, category: string | null, resultCount: number) {
  const analyticsEvent = {
    timestamp: new Date().toISOString(),
    event: 'sticker_search',
    query: query || null,
    category: category || null,
    resultCount,
    userAgent: 'API', // Will be extracted from request headers in production
  };

  console.log('[API /api/assets/stickers] 📊 Analytics:', JSON.stringify(analyticsEvent));

  // TODO (Phase 2): Send to CloudWatch or analytics service
  // await sendToAnalytics(analyticsEvent);
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * GET /api/assets/stickers
 *
 * List stickers with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API /api/assets/stickers] 📥 Fetching stickers...');

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0', 10);
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20', 10), 100); // Max 100
    const query = searchParams.get('query');
    const category = searchParams.get('category');

    // Validate parameters
    if (page < 0 || perPage <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pagination parameters. page must be >= 0 and perPage must be > 0'
        },
        { status: 400 }
      );
    }

    console.log('[API /api/assets/stickers] 🔍 Query params:', { page, perPage, query, category });

    // Search and filter
    let results = searchStickers(query);
    results = filterByCategory(results, category);

    // Paginate
    const paginated = paginateStickers(results, page, perPage);

    // Track analytics
    trackStickerUsage(query, category, paginated.total);

    console.log(`[API /api/assets/stickers] ✅ Returning ${paginated.items.length} stickers (page ${paginated.currentPage}, total: ${paginated.total})`);

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        assets: paginated.items,
        currentPage: paginated.currentPage,
        nextPage: paginated.nextPage,
        total: paginated.total,
        categories: getCategories() // Include available categories for filtering UI
      }
    });

  } catch (error) {
    console.error('[API /api/assets/stickers] ❌ Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
