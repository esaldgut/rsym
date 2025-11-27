'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMarketplaceProductsAction, getMarketplaceMetricsAction } from '@/lib/server/marketplace-actions';
import { toastManager } from '@/components/ui/ToastWithPinpoint';

// REPLICANDO EXACTAMENTE LOS PATRONES DE useProviderProducts.ts

export type MarketplaceFilter = 'all' | 'circuit' | 'package' | 'adventure' | 'gastronomic' | 'cultural' | 'relax';

interface MarketplaceProduct {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  published: boolean;
  cover_image_url?: string;
  min_product_price?: number;
  preferences?: string[];
  destination?: Array<{
    place?: string;
    placeSub?: string;
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

interface MarketplaceMetrics {
  total: number;
  circuits: number;
  packages: number;
  avgPrice: number;
  topDestinations: string[];
}

interface MarketplaceFilters {
  category?: string;
  location?: string;
  maxPrice?: number;
  minPrice?: number;
}

/**
 * Filtro GraphQL para consultas de productos
 */
interface ProductFilterInput {
  product_type?: string;
  preferences?: string[];
  maxPrice?: number;
  minPrice?: number;
  published?: boolean;
}

interface UseMarketplacePaginationProps {
  initialProducts?: MarketplaceProduct[];
  initialMetrics?: MarketplaceMetrics;
  initialNextToken?: string;
}

export function useMarketplacePagination({
  initialProducts = [],
  initialMetrics,
  initialNextToken
}: UseMarketplacePaginationProps = {}) {
  // PATRÓN EXACTO DE useProviderProducts.ts
  const [products, setProducts] = useState<MarketplaceProduct[]>(initialProducts);
  const [metrics, setMetrics] = useState<MarketplaceMetrics>(initialMetrics || {
    total: 0,
    circuits: 0,
    packages: 0,
    avgPrice: 0,
    topDestinations: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialNextToken);
  const [nextToken, setNextToken] = useState<string | null>(initialNextToken || null);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<MarketplaceFilter>('all');
  const [activeFilters, setActiveFilters] = useState<MarketplaceFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // PATRÓN DE FeedGrid.tsx - Intersection Observer para infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load metrics (PATRÓN DE useProviderProducts.ts)
  const loadMetrics = useCallback(async () => {
    try {
      const result = await getMarketplaceMetricsAction();

      // ✅ Type narrowing automático: después de verificar success, TypeScript garantiza que data existe
      if (result.success) {
        setMetrics(result.data);
        console.log('📊 Metrics loaded:', result.data, result.cached ? '(cached)' : '(fresh)');
      } else {
        // TypeScript garantiza que error existe aquí
        console.error('Error loading metrics:', result.error);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      toastManager.error('❌ Error al cargar métricas del marketplace', {
        trackingContext: {
          feature: 'marketplace',
          error: error instanceof Error ? error.message : 'Unknown error',
          category: 'metrics_loading_error'
        }
      });
    }
  }, []);

  // Load products with pagination (PATRÓN DE useProviderProducts.ts + ProviderProductsDashboard.tsx)
  const loadProducts = useCallback(async (
    filter: MarketplaceFilter = 'all',
    filters: MarketplaceFilters = {},
    search: string = '',
    token: string | null = null,
    append = false
  ) => {
    try {
      if (!append) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      // Build filter object (PATRÓN DE useProviderProducts.ts)
      const graphqlFilter: ProductFilterInput = {};

      // Apply product type filter
      if (filter === 'circuit') {
        graphqlFilter.product_type = 'circuit';
      } else if (filter === 'package') {
        graphqlFilter.product_type = 'package';
      }

      // Apply preference filters
      if (['adventure', 'gastronomic', 'cultural', 'relax'].includes(filter)) {
        graphqlFilter.preferences = [filter.toUpperCase()];
      }

      // Apply additional filters
      if (filters.category) {
        graphqlFilter.preferences = [filters.category.toUpperCase()];
      }

      if (filters.maxPrice) {
        graphqlFilter.maxPrice = filters.maxPrice;
      }

      if (filters.minPrice) {
        graphqlFilter.minPrice = filters.minPrice;
      }

      const params = {
        pagination: {
          limit: 20, // OPTIMIZADO para paginación real
          ...(token && { nextToken: token })
        },
        filter: graphqlFilter,
        ...(search && { searchTerm: search })
      };

      console.log('🔍 Loading marketplace products:', {
        filter,
        filters,
        search,
        hasToken: !!token,
        append
      });

      const result = await getMarketplaceProductsAction(params);

      // ✅ Type narrowing automático: discriminated union garantiza tipos correctos
      if (result.success) {
        // TypeScript garantiza que result.data existe (MarketplaceConnection)
        const connection = result.data;

        if (append) {
          setProducts(prev => [...prev, ...connection.items]);
        } else {
          setProducts(connection.items);
        }

        setNextToken(connection.nextToken || null);
        setHasMore(!!connection.nextToken);

        console.log('✅ Products loaded:', {
          count: connection.items.length,
          hasMore: !!connection.nextToken,
          total: connection.total
        });
      } else {
        // TypeScript garantiza que result.error existe (string)
        setError(result.error);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');

      toastManager.error('❌ Error al cargar productos del marketplace', {
        trackingContext: {
          feature: 'marketplace',
          error: error instanceof Error ? error.message : 'Unknown error',
          filter,
          category: 'data_loading_error'
        }
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Load more products (PATRÓN EXACTO DE useProviderProducts.ts)
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && nextToken) {
      console.log('📄 Loading more products with nextToken:', nextToken.substring(0, 20) + '...');
      loadProducts(currentFilter, activeFilters, searchTerm, nextToken, true);
    }
  }, [hasMore, isLoadingMore, nextToken, currentFilter, activeFilters, searchTerm, loadProducts]);

  // Change filter and reload (PATRÓN EXACTO DE useProviderProducts.ts)
  const changeFilter = useCallback((filter: MarketplaceFilter) => {
    console.log('🔄 Changing filter from', currentFilter, 'to', filter);
    setCurrentFilter(filter);
    setNextToken(null);
    setHasMore(true);
    setSearchTerm(''); // Clear search when changing filter
    loadProducts(filter, activeFilters, '', null, false);
  }, [currentFilter, activeFilters, loadProducts]);

  // Apply filters (PATRÓN DE ProviderProductsDashboard.tsx)
  const applyFilters = useCallback((filters: MarketplaceFilters) => {
    console.log('🎯 Applying filters:', filters);
    setActiveFilters(filters);
    setNextToken(null);
    setHasMore(true);
    loadProducts(currentFilter, filters, searchTerm, null, false);
  }, [currentFilter, searchTerm, loadProducts]);

  // Search products (NUEVO - optimizado)
  const searchProducts = useCallback((search: string) => {
    console.log('🔍 Searching products:', search);
    setSearchTerm(search);
    setNextToken(null);
    setHasMore(!search); // No pagination when searching
    loadProducts(currentFilter, activeFilters, search, null, false);
  }, [currentFilter, activeFilters, loadProducts]);

  // Clear filters and search (PATRÓN DE ProviderProductsDashboard.tsx)
  const clearFilters = useCallback(() => {
    console.log('🧹 Clearing all filters and search');
    setCurrentFilter('all');
    setActiveFilters({});
    setSearchTerm('');
    setNextToken(null);
    setHasMore(true);
    loadProducts('all', {}, '', null, false);
  }, [loadProducts]);

  // Refresh all data (PATRÓN EXACTO DE useProviderProducts.ts)
  const refresh = useCallback(() => {
    console.log('🔄 Refreshing marketplace data');
    setNextToken(null);
    setHasMore(true);
    setError(null);
    loadMetrics();
    loadProducts(currentFilter, activeFilters, searchTerm, null, false);
  }, [currentFilter, activeFilters, searchTerm, loadProducts, loadMetrics]);

  // Intersection Observer setup (PATRÓN EXACTO DE FeedGrid.tsx)
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore && !searchTerm) {
          console.log('👁️ Intersection observer triggered - loading more');
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoading, isLoadingMore, searchTerm]);

  // Initial load (solo si no hay productos iniciales - SSR)
  useEffect(() => {
    if (initialProducts.length === 0) {
      console.log('🚀 Initial client-side load (no SSR data)');
      loadMetrics();
      loadProducts();
    } else {
      console.log('📦 Using SSR initial data:', initialProducts.length, 'products');
      // Load metrics even with SSR data
      loadMetrics();
    }
  }, [loadMetrics, loadProducts, initialProducts.length]);

  // Auto-refresh cuando métricas indican más productos que los mostrados
  // SOLUCIÓN: Detecta desincronización entre SSR y client-side data después de publicar productos
  useEffect(() => {
    // Solo refrescar si:
    // 1. Las métricas muestran más productos que los cargados
    // 2. No estamos en medio de una carga
    // 3. Tenemos productos cargados (evitar refresh en estado inicial)
    if (metrics.total > products.length && !isLoading && !isLoadingMore && products.length > 0) {
      console.log('🔄 Auto-refreshing: metrics show', metrics.total, 'products but only', products.length, 'loaded');
      refresh();
    }
  }, [metrics.total, products.length, isLoading, isLoadingMore, refresh]);

  return {
    // Data
    products,
    metrics,

    // Loading states
    isLoading,
    isLoadingMore,
    hasMore,
    error,

    // Current state
    currentFilter,
    activeFilters,
    searchTerm,

    // Actions
    loadMore,
    changeFilter,
    applyFilters,
    searchProducts,
    clearFilters,
    refresh,

    // Refs for infinite scroll
    loadMoreRef
  };
}