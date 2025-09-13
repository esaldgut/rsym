'use client';

import { useState, useEffect, useCallback } from 'react';
import { executeQuery } from '@/lib/graphql/client';
import { getAllProductsByEmail } from '@/lib/graphql/operations';
import { toastManager } from '@/components/ui/Toast';

export type ProductFilter = 'all' | 'circuit' | 'package' | 'draft' | 'published';

interface Product {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  status: string;
  published: boolean;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
  seasons?: Array<{
    id: string;
    start_date: string;
    end_date: string;
    category: string;
    allotment: number;
    allotment_remain: number;
  }>;
  destination?: Array<{
    place: string;
    placeSub: string;
  }>;
  min_product_price?: number;
}

interface ProductConnection {
  items: Product[];
  nextToken?: string;
  total: number;
}

interface ProductMetrics {
  total: number;
  published: number;
  drafts: number;
  circuits: number;
  packages: number;
  totalViews: number; // Placeholder - would come from analytics
}

export function useProviderProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<ProductMetrics>({
    total: 0,
    published: 0,
    drafts: 0,
    circuits: 0,
    packages: 0,
    totalViews: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<ProductFilter>('all');

  // Load initial metrics
  const loadMetrics = useCallback(async () => {
    try {
      const result = await executeQuery(getAllProductsByEmail, {
        pagination: { limit: 1000 }
      });
      
      if (result?.getAllProductsByEmail?.items) {
        const items = result.getAllProductsByEmail.items;
        const total = result.getAllProductsByEmail.total || items.length;
        
        const calculatedMetrics: ProductMetrics = {
          total,
          published: items.filter((p: Product) => p.published).length,
          drafts: items.filter((p: Product) => !p.published).length,
          circuits: items.filter((p: Product) => p.product_type === 'circuit').length,
          packages: items.filter((p: Product) => p.product_type === 'package').length,
          totalViews: 0 // Placeholder - would integrate with analytics
        };
        
        setMetrics(calculatedMetrics);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      toastManager.error('❌ Error al cargar métricas', {
        trackingContext: {
          feature: 'provider_dashboard',
          error: error instanceof Error ? error.message : 'Unknown error',
          category: 'data_loading_error'
        }
      });
    }
  }, []);

  // Load products with pagination
  const loadProducts = useCallback(async (
    filter: ProductFilter = 'all', 
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

      // Build filter object based on current filter
      const graphqlFilter: any = {};
      
      switch (filter) {
        case 'circuit':
          graphqlFilter.product_type = 'circuit';
          break;
        case 'package':
          graphqlFilter.product_type = 'package';
          break;
        case 'draft':
          graphqlFilter.published = false;
          break;
        case 'published':
          graphqlFilter.published = true;
          break;
        // 'all' case needs no additional filters
      }

      const variables = {
        pagination: {
          limit: 12, // Load 12 products per page
          ...(token && { nextToken: token })
        },
        filter: graphqlFilter
      };

      const result = await executeQuery(getAllProductsByEmail, variables);
      
      if (result?.getAllProductsByEmail) {
        const connection: ProductConnection = result.getAllProductsByEmail;
        
        if (append) {
          setProducts(prev => [...prev, ...connection.items]);
        } else {
          setProducts(connection.items);
        }
        
        setNextToken(connection.nextToken || null);
        setHasMore(!!connection.nextToken);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      
      toastManager.error('❌ Error al cargar productos', {
        trackingContext: {
          feature: 'provider_dashboard',
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

  // Load more products (infinite scroll)
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && nextToken) {
      loadProducts(currentFilter, nextToken, true);
    }
  }, [hasMore, isLoadingMore, nextToken, currentFilter, loadProducts]);

  // Change filter and reload
  const changeFilter = useCallback((filter: ProductFilter) => {
    setCurrentFilter(filter);
    setNextToken(null);
    setHasMore(true);
    loadProducts(filter, null, false);
  }, [loadProducts]);

  // Refresh all data
  const refresh = useCallback(() => {
    setNextToken(null);
    setHasMore(true);
    loadMetrics();
    loadProducts(currentFilter, null, false);
  }, [currentFilter, loadProducts, loadMetrics]);

  // Initial load
  useEffect(() => {
    loadMetrics();
    loadProducts();
  }, [loadMetrics, loadProducts]);

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
    
    // Actions
    loadMore,
    changeFilter,
    refresh
  };
}