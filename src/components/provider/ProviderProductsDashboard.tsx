'use client';

import { useState, useCallback } from 'react';
import { getProviderProductsAction, deleteProductAction } from '@/lib/server/provider-products-actions';
import { toastManager } from '@/components/ui/Toast';
import { analytics } from '@/lib/services/analytics-service';
import { InfiniteScroll } from '@/components/provider/InfiniteScroll';
import { ProductCard } from '@/components/provider/ProductCard';
import type { Product, ProductFilterInput } from '@/generated/graphql';

export type ProductFilter = 'all' | 'circuit' | 'package' | 'draft' | 'published';

// Tipos derivados de la respuesta del Server Action (más estrictos que GraphQL generados)
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
  totalViews: number;
}

interface ProviderProductsDashboardProps {
  initialProducts: ProductConnection | null;
  metrics: ProductMetrics | null;
}

const FILTER_CONFIG = {
  all: { label: 'Todos', icon: '📊' },
  circuit: { label: 'Circuitos', icon: '🗺️' },
  package: { label: 'Paquetes', icon: '📦' },
  draft: { label: 'Borradores', icon: '✏️' },
  published: { label: 'Publicados', icon: '✅' }
};

export function ProviderProductsDashboard({ initialProducts, metrics }: ProviderProductsDashboardProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts?.items || []);
  const [currentMetrics, setCurrentMetrics] = useState<ProductMetrics>(metrics || {
    total: 0, published: 0, drafts: 0, circuits: 0, packages: 0, totalViews: 0
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialProducts?.nextToken);
  const [nextToken, setNextToken] = useState<string | null>(initialProducts?.nextToken || null);
  const [currentFilter, setCurrentFilter] = useState<ProductFilter>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load more products using server action
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextToken) return;

    setIsLoadingMore(true);
    const startTime = Date.now();
    
    try {
      // Build filter for server action
      const graphqlFilter: ProductFilterInput = {};
      switch (currentFilter) {
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
      }

      const result = await getProviderProductsAction({
        pagination: { limit: 12, nextToken },
        filter: graphqlFilter
      });

      if (result.success && result.data) {
        setProducts(prev => [...prev, ...result.data!.items]);
        setNextToken(result.data.nextToken || null);
        setHasMore(!!result.data.nextToken);

        toastManager.show('📦 Más productos cargados', 'info');
        
        // Analytics tracking
        analytics.trackSuccess('infinite_scroll', 'load_more', {
          filter: currentFilter,
          loadedCount: result.data.items.length,
          hasMore: !!result.data.nextToken,
          operationTime: Date.now() - startTime
        });
      }
    } catch (error) {
      toastManager.show('❌ Error cargando más productos', 'error');
      
      // Analytics error tracking
      analytics.trackError('infinite_scroll', error instanceof Error ? error : 'Unknown error', {
        filter: currentFilter,
        nextToken: nextToken
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, nextToken, currentFilter]);

  // Change filter and reload with server-side filtering
  const changeFilter = useCallback(async (filter: ProductFilter) => {
    const previousFilter = currentFilter;
    setCurrentFilter(filter);
    setNextToken(null);
    setHasMore(true);
    
    const startTime = Date.now();
    
    // Track user flow
    analytics.trackUserFlow('product_filtering', `filter_${filter}`, `filter_${previousFilter}`, {
      fromFilter: previousFilter,
      toFilter: filter
    });
    
    try {
      const graphqlFilter: ProductFilterInput = {};
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
      }

      const result = await getProviderProductsAction({
        pagination: { limit: 12 },
        filter: graphqlFilter
      });

      if (result.success && result.data) {
        setProducts(result.data.items);
        setNextToken(result.data.nextToken || null);
        setHasMore(!!result.data.nextToken);

        toastManager.show('📊 Productos filtrados', 'info');
        
        // Analytics tracking
        analytics.trackSuccess('product_filtering', `apply_${filter}_filter`, {
          filter: filter,
          resultCount: result.data.items.length,
          hasMore: !!result.data.nextToken,
          operationTime: Date.now() - startTime
        });
      }
    } catch (error) {
      toastManager.show('❌ Error aplicando filtro', 'error');
      
      // Analytics error tracking
      analytics.trackError('product_filtering', error instanceof Error ? error : 'Unknown error', {
        filter: filter,
        previousFilter: previousFilter
      });
    }
  }, [currentFilter]);

  // Delete product
  const handleDeleteProduct = useCallback(async (productId: string) => {
    setIsDeleting(true);
    const startTime = Date.now();
    const productToDelete = products.find(p => p.id === productId);
    
    try {
      const result = await deleteProductAction(productId);
      
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        setShowDeleteConfirm(null);
        
        // Update metrics
        if (productToDelete) {
          setCurrentMetrics(prev => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
            published: productToDelete.published ? Math.max(0, prev.published - 1) : prev.published,
            drafts: !productToDelete.published ? Math.max(0, prev.drafts - 1) : prev.drafts,
            circuits: productToDelete.product_type === 'circuit' ? Math.max(0, prev.circuits - 1) : prev.circuits,
            packages: productToDelete.product_type === 'package' ? Math.max(0, prev.packages - 1) : prev.packages,
          }));
        }

        toastManager.show('✅ Producto eliminado exitosamente', 'success');
        
        // Analytics tracking
        analytics.trackSuccess('product_deletion', 'delete_product', {
          productId: productId,
          productType: productToDelete?.product_type,
          wasPublished: productToDelete?.published,
          operationTime: Date.now() - startTime
        });
      } else {
        toastManager.show('❌ ' + (result.error || 'Error eliminando producto'), 'error');
        
        // Analytics error tracking
        analytics.trackError('product_deletion', result.error || 'Unknown error', {
          productId: productId,
          productType: productToDelete?.product_type
        });
      }
    } catch (error) {
      toastManager.show('❌ Error eliminando producto', 'error');
      
      // Analytics error tracking
      analytics.trackError('product_deletion', error instanceof Error ? error : 'Unknown error', {
        productId: productId,
        productType: productToDelete?.product_type
      });
    } finally {
      setIsDeleting(false);
    }
  }, [products]);

  // Refresh all data
  const refresh = useCallback(async () => {
    const startTime = Date.now();
    
    // Track refresh action
    analytics.track('product_refresh_initiated', {
      feature: 'product_management',
      category: 'user_action',
      userFlow: {
        currentAction: 'refresh_products'
      },
      metadata: {
        currentFilter: currentFilter
      }
    });
    
    try {
      const result = await getProviderProductsAction({
        pagination: { limit: 12 },
        filter: currentFilter === 'all' ? {} : {
          ...(currentFilter === 'circuit' && { product_type: 'circuit' }),
          ...(currentFilter === 'package' && { product_type: 'package' }),
          ...(currentFilter === 'draft' && { published: false }),
          ...(currentFilter === 'published' && { published: true })
        }
      });

      if (result.success && result.data) {
        setProducts(result.data.items);
        setNextToken(result.data.nextToken || null);
        setHasMore(!!result.data.nextToken);

        toastManager.show('🔄 Productos actualizados', 'success');
        
        // Analytics tracking
        analytics.trackSuccess('data_refresh', 'refresh_products', {
          filter: currentFilter,
          resultCount: result.data.items.length,
          hasMore: !!result.data.nextToken,
          operationTime: Date.now() - startTime
        });
      }
    } catch (error) {
      toastManager.show('❌ Error actualizando productos', 'error');
      
      // Analytics error tracking  
      analytics.trackError('data_refresh', error instanceof Error ? error : 'Unknown error', {
        filter: currentFilter
      });
    }
  }, [currentFilter]);

  // Render empty state based on current filter
  const renderEmptyState = () => {
    if (products.length > 0) return null;

    const emptyStateConfig = {
      all: {
        icon: '📦',
        title: 'No tienes productos creados',
        message: 'Comienza creando tu primer circuito turístico o paquete de viaje para empezar a vender experiencias únicas.'
      },
      circuit: {
        icon: '🗺️',
        title: 'No tienes circuitos',
        message: 'Los circuitos son itinerarios detallados. Crea tu primer circuito para ofrecer experiencias guiadas.'
      },
      package: {
        icon: '📦',
        title: 'No tienes paquetes',
        message: 'Los paquetes combinan múltiples servicios. Crea tu primer paquete integral de viaje.'
      },
      draft: {
        icon: '✏️',
        title: 'No tienes borradores',
        message: 'Todos tus productos están publicados. Los borradores te permiten trabajar en productos antes de publicarlos.'
      },
      published: {
        icon: '✅',
        title: 'No tienes productos publicados',
        message: 'Publica tus productos para que los viajeros puedan descubrirlos y reservarlos.'
      }
    };

    const config = emptyStateConfig[currentFilter];

    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
        <div className="text-6xl mb-4">{config.icon}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">{config.message}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {Object.entries(FILTER_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => changeFilter(key as ProductFilter)}
                className={`border-b-2 whitespace-nowrap py-4 px-1 text-sm font-medium transition-colors ${
                  currentFilter === key
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-pink-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{currentMetrics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Publicados</p>
              <p className="text-2xl font-bold text-gray-900">{currentMetrics.published}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-amber-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Borradores</p>
              <p className="text-2xl font-bold text-gray-900">{currentMetrics.drafts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-violet-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Vistas totales</p>
              <p className="text-2xl font-bold text-gray-900">{currentMetrics.totalViews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid or Empty State */}
      {renderEmptyState()}

      {products.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <InfiniteScroll
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={loadMore}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={(product) => setShowDeleteConfirm(product.id)}
              />
            ))}
          </InfiniteScroll>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">¿Eliminar producto?</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              El producto será eliminado permanentemente junto con todas sus temporadas, precios y datos asociados.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={() => showDeleteConfirm && handleDeleteProduct(showDeleteConfirm)}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
