'use server';

import { getAllActiveAndPublishedProducts, getProductById, createReservation, generatePaymentLink } from '@/lib/graphql/operations';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import { revalidateTag, unstable_cache } from 'next/cache';
import outputs from '../../../amplify/outputs.json';
import { getServerSession } from '@/utils/amplify-server-utils';
import type { Schema } from '@/amplify/data/resource';
import { transformPathsToUrls } from '@/lib/utils/s3-url-transformer';

// SIGUIENDO EXACTAMENTE EL PATTERN DE provider-products-actions.ts
interface ServerActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  cached?: boolean;
}

interface MarketplaceProduct {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  published: boolean;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  min_product_price?: number;
  itinerary?: string;
  preferences?: string[];
  destination?: Array<{
    id?: string;
    place?: string;
    placeSub?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
    complementary_description?: string;
  }>;
  departures?: Array<{
    id?: string;
    days?: string[];
    specific_dates?: string[];
    origin?: Array<{
      id?: string;
      place?: string;
      placeSub?: string;
      coordinates?: {
        latitude?: number;
        longitude?: number;
      };
      complementary_description?: string;
    }>;
  }>;
  seasons?: Array<{
    id: string;
    start_date?: string;
    end_date?: string;
    number_of_nights?: string;
  }>;
  user_data?: {
    username?: string;
    name?: string;
    avatar_url?: string;
  };
}

interface MarketplaceConnection {
  items: MarketplaceProduct[];
  nextToken?: string;
  total: number;
}

interface MarketplaceMetrics {
  total: number;
  circuits: number;
  packages: number;
  avgPrice: number;
  topDestinations: string[];
}

interface GetMarketplaceParams {
  pagination?: {
    limit?: number;
    nextToken?: string;
  };
  filter?: {
    product_type?: string;
    preferences?: string[];
    location?: string;
    maxPrice?: number;
    minPrice?: number;
  };
  searchTerm?: string;
}

/**
 * Server Action para obtener productos del marketplace con paginación optimizada
 * PATTERN: Next.js 15.3.4 + AWS Amplify Gen 2 v6 + generateServerClientUsingCookies
 */
export async function getMarketplaceProductsAction(
  params: GetMarketplaceParams = {}
): Promise<ServerActionResponse<MarketplaceConnection>> {
  try {
    console.log('🚀 [SERVER ACTION] getMarketplaceProductsAction:', {
      params: {
        ...params,
        nextToken: params.pagination?.nextToken ? '***HIDDEN***' : undefined
      }
    });

    // 1. Build GraphQL filter (OPTIMIZADO - solo productos publicados)
    const graphqlFilter: any = { published: true };

    // Apply filters
    if (params.filter?.product_type) {
      graphqlFilter.product_type = params.filter.product_type;
    }

    if (params.filter?.preferences?.length) {
      graphqlFilter.preferences = params.filter.preferences;
    }

    if (params.filter?.maxPrice) {
      graphqlFilter.max_price = params.filter.maxPrice;
    }

    if (params.filter?.minPrice) {
      graphqlFilter.min_price = params.filter.minPrice;
    }

    // 2. Create server client using cookies (ARQUITECTURA CORRECTA)
    const cookiesStore = await cookies();
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies: () => cookiesStore
    });

    const variables = {
      filter: graphqlFilter,
      pagination: {
        limit: params.pagination?.limit || 20,
        ...(params.pagination?.nextToken && { nextToken: params.pagination.nextToken })
      }
    };

    console.log('📊 [GraphQL Query] getAllActiveAndPublishedProducts (OPTIMIZED):', {
      filter: graphqlFilter,
      limit: variables.pagination.limit,
      hasNextToken: !!params.pagination?.nextToken
    });

    // 3. Execute query with automatic auth token handling
    const result = await client.graphql({
      query: getAllActiveAndPublishedProducts,
      variables
    });

    // 3. Process response
    if (result?.data?.getAllActiveAndPublishedProducts) {
      const connection = result.data.getAllActiveAndPublishedProducts;

      // Apply client-side filtering (FALLBACK - backend no filtra correctamente)
      // CRITICAL: El backend NO soporta preferences, maxPrice, minPrice
      // Y el filtrado por product_type no funciona server-side
      let filteredItems = connection.items;

      // Filter by product_type (fallback porque backend NO filtra)
      if (params.filter?.product_type) {
        filteredItems = filteredItems.filter((product: any) =>
          product.product_type === params.filter.product_type
        );
      }

      // Filter by preferences (backend NO soporta - campo no existe en ProductFilterInput)
      if (params.filter?.preferences?.length) {
        filteredItems = filteredItems.filter((product: any) =>
          params.filter.preferences.some((pref: string) =>
            product.preferences?.includes(pref)
          )
        );
      }

      // Filter by max price (backend NO soporta - campo no existe en ProductFilterInput)
      if (params.filter?.maxPrice) {
        filteredItems = filteredItems.filter((product: any) =>
          !product.min_product_price || product.min_product_price <= params.filter.maxPrice
        );
      }

      // Filter by min price (backend NO soporta - campo no existe en ProductFilterInput)
      if (params.filter?.minPrice) {
        filteredItems = filteredItems.filter((product: any) =>
          product.min_product_price && product.min_product_price >= params.filter.minPrice
        );
      }

      // Filter by search term
      if (params.searchTerm) {
        const searchLower = params.searchTerm.toLowerCase();
        filteredItems = filteredItems.filter((product: any) =>
          product.name?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.destination?.some((dest: any) =>
            dest.place?.toLowerCase().includes(searchLower) ||
            dest.placeSub?.toLowerCase().includes(searchLower)
          )
        );
      }

      // Log client-side filtering results
      if (connection.items.length !== filteredItems.length) {
        console.log('🔍 [CLIENT-SIDE FILTER]:', {
          before: connection.items.length,
          after: filteredItems.length,
          appliedFilters: {
            product_type: params.filter?.product_type,
            preferences: params.filter?.preferences,
            maxPrice: params.filter?.maxPrice,
            minPrice: params.filter?.minPrice,
            searchTerm: params.searchTerm
          }
        });
      }

      console.log('✅ [SUCCESS] Marketplace products loaded:', {
        totalReceived: connection.items.length,
        filteredCount: filteredItems.length,
        hasNextToken: !!connection.nextToken,
        serverTotal: connection.total
      });

      // Transform S3 paths to full URLs for images and videos
      const itemsWithUrls = filteredItems.map((item: any) => transformPathsToUrls(item));

      console.log('🔄 [S3 URLs] Transformed paths to URLs for', itemsWithUrls.length, 'products');

      return {
        success: true,
        data: {
          items: itemsWithUrls,
          nextToken: params.searchTerm ? undefined : connection.nextToken, // No pagination when searching
          total: connection.total || filteredItems.length
        }
      };
    }

    return {
      success: false,
      error: 'No se pudieron cargar los productos del marketplace'
    };

  } catch (error) {
    console.error('❌ [ERROR] getMarketplaceProductsAction:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para obtener métricas del marketplace
 * CACHED para mejor performance
 */
export async function getMarketplaceMetricsAction(): Promise<ServerActionResponse<MarketplaceMetrics>> {
  try {
    console.log('📊 [SERVER ACTION] getMarketplaceMetricsAction');

    // Create server client using cookies (ARQUITECTURA CORRECTA)
    // NO CACHE: unstable_cache no es compatible con cookies/auth en Next.js 15
    const cookiesStore = await cookies();
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies: () => cookiesStore
    });

    // Get a larger sample for metrics (but not all)
    const result = await client.graphql({
      query: getAllActiveAndPublishedProducts,
      variables: {
        filter: { published: true },
        pagination: { limit: 100 } // Sample for metrics
      }
    });

    if (result?.data?.getAllActiveAndPublishedProducts?.items) {
      const items = result.data.getAllActiveAndPublishedProducts.items;

      // Calculate metrics
      const total = result.data.getAllActiveAndPublishedProducts.total || items.length;
      const circuits = items.filter((p: any) => p.product_type === 'circuit').length;
      const packages = items.filter((p: any) => p.product_type === 'package').length;

      const prices = items
        .map((p: any) => p.min_product_price)
        .filter((price: any): price is number => price !== undefined && price > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;

      // Extract top destinations
      const destinations = items
        .flatMap((p: any) => p.destination?.map((d: any) => d.place) || [])
        .filter((place: any): place is string => !!place);
      const destinationCounts = destinations.reduce((acc: Record<string, number>, dest: string) => {
        acc[dest] = (acc[dest] || 0) + 1;
        return acc;
      }, {});
      const topDestinations = Object.entries(destinationCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([dest]) => dest);

      const metrics = {
        total,
        circuits,
        packages,
        avgPrice,
        topDestinations
      };

      console.log('✅ [SUCCESS] Marketplace metrics loaded:', metrics);

      return {
        success: true,
        data: metrics,
        cached: false // NO CACHE usado debido a restricciones de Next.js 15
      };
    }

    // Si no hay items, retornar métricas vacías
    return {
      success: true,
      data: {
        total: 0,
        circuits: 0,
        packages: 0,
        avgPrice: 0,
        topDestinations: []
      },
      cached: false
    };

  } catch (error) {
    console.error('❌ [ERROR] getMarketplaceMetricsAction:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para obtener un producto específico del marketplace
 * CACHED para mejor performance
 */
export async function getMarketplaceProductAction(
  productId: string
): Promise<ServerActionResponse<MarketplaceProduct>> {
  try {
    console.log('🎯 [SERVER ACTION] getMarketplaceProductAction:', productId);

    if (!productId) {
      return {
        success: false,
        error: 'ID de producto requerido'
      };
    }

    // Use Next.js 15 unstable_cache for product details (10 minutes)
    const getCachedProduct = unstable_cache(
      async (id: string) => {
        // Create server client using cookies (ARQUITECTURA CORRECTA)
        const cookiesStore = await cookies();
        const client = generateServerClientUsingCookies<Schema>({
          config: outputs,
          cookies: () => cookiesStore
        });

        const result = await client.graphql({
          query: getProductById,
          variables: { id }
        });

        return result?.data?.getProductById;
      },
      ['marketplace-product'],
      {
        revalidate: 600, // 10 minutes cache
        tags: ['marketplace', 'product', productId]
      }
    );

    const product = await getCachedProduct(productId);

    if (product && product.published) {
      console.log('✅ [SUCCESS] Marketplace product loaded:', product.id);

      // Transform S3 paths to full URLs for images and videos
      const productWithUrls = transformPathsToUrls(product);

      console.log('🔄 [S3 URLs] Transformed paths to URLs for product:', productId);

      return {
        success: true,
        data: productWithUrls,
        cached: true
      };
    }

    return {
      success: false,
      error: 'Producto no encontrado o no publicado'
    };

  } catch (error) {
    console.error('❌ [ERROR] getMarketplaceProductAction:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para revalidar cache del marketplace
 * Útil después de actualizaciones de productos
 */
export async function revalidateMarketplaceAction(): Promise<ServerActionResponse> {
  try {
    console.log('🔄 [SERVER ACTION] revalidateMarketplaceAction');

    revalidateTag('marketplace');
    revalidateTag('metrics');

    return {
      success: true,
      message: 'Cache del marketplace revalidado exitosamente'
    };

  } catch (error) {
    console.error('❌ [ERROR] revalidateMarketplaceAction:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}