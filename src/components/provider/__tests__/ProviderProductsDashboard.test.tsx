/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ProviderProductsDashboard } from '../ProviderProductsDashboard';
import type { Product } from '@/generated/graphql';

// Mock server actions
const mockGetProviderProductsAction = jest.fn();
const mockDeleteProductAction = jest.fn();
jest.mock('@/lib/server/provider-products-actions', () => ({
  getProviderProductsAction: (...args: unknown[]) => mockGetProviderProductsAction(...args),
  deleteProductAction: (...args: unknown[]) => mockDeleteProductAction(...args)
}));

// Mock toast manager
const mockToastShow = jest.fn();
jest.mock('@/components/ui/Toast', () => ({
  toastManager: {
    show: (...args: unknown[]) => mockToastShow(...args)
  }
}));

// Mock analytics service
const mockTrack = jest.fn();
const mockTrackSuccess = jest.fn();
const mockTrackError = jest.fn();
const mockTrackUserFlow = jest.fn();
jest.mock('@/lib/services/analytics-service', () => ({
  analytics: {
    track: (...args: unknown[]) => mockTrack(...args),
    trackSuccess: (...args: unknown[]) => mockTrackSuccess(...args),
    trackError: (...args: unknown[]) => mockTrackError(...args),
    trackUserFlow: (...args: unknown[]) => mockTrackUserFlow(...args)
  }
}));

// Mock InfiniteScroll component
jest.mock('@/components/provider/InfiniteScroll', () => ({
  InfiniteScroll: ({ children, hasMore, isLoading, onLoadMore, className }: {
    children: React.ReactNode;
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    className?: string;
  }) => (
    <div data-testid="infinite-scroll" className={className}>
      {children}
      {isLoading && <div data-testid="loading-indicator">Loading...</div>}
      {hasMore && <button data-testid="load-more-trigger" onClick={onLoadMore}>Load More</button>}
    </div>
  )
}));

// Mock ProductCard component
jest.mock('@/components/provider/ProductCard', () => ({
  ProductCard: ({ product, onDelete }: { product: Product; onDelete: (product: Product) => void }) => (
    <div data-testid={`product-card-${product.id}`}>
      <span data-testid="product-name">{product.name}</span>
      <span data-testid="product-type">{product.product_type}</span>
      <button data-testid={`delete-btn-${product.id}`} onClick={() => onDelete(product)}>Delete</button>
    </div>
  )
}));

describe('ProviderProductsDashboard', () => {
  const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
    id: `product-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Product',
    description: 'Test description',
    product_type: 'circuit',
    published: true,
    ...overrides
  } as Product);

  const defaultMetrics = {
    total: 10,
    published: 7,
    drafts: 3,
    circuits: 6,
    packages: 4,
    totalViews: 150
  };

  const defaultProducts = [
    createMockProduct({ id: 'product-1', name: 'Circuito Maya', product_type: 'circuit', published: true }),
    createMockProduct({ id: 'product-2', name: 'Paquete Cancún', product_type: 'package', published: true }),
    createMockProduct({ id: 'product-3', name: 'Circuito Oaxaca', product_type: 'circuit', published: false })
  ];

  const defaultInitialProducts = {
    items: defaultProducts,
    nextToken: 'next-token-123',
    total: 3
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders filter tabs', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      expect(screen.getByText('📊 Todos')).toBeInTheDocument();
      expect(screen.getByText('🗺️ Circuitos')).toBeInTheDocument();
      expect(screen.getByText('📦 Paquetes')).toBeInTheDocument();
      expect(screen.getByText('✏️ Borradores')).toBeInTheDocument();
      expect(screen.getByText('✅ Publicados')).toBeInTheDocument();
    });

    it('renders metrics cards', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      expect(screen.getByText('Total Productos')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Publicados')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('Borradores')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Vistas totales')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('renders product cards', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      expect(screen.getByTestId('product-card-product-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-product-2')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-product-3')).toBeInTheDocument();
    });

    it('renders InfiniteScroll container', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      expect(screen.getByTestId('infinite-scroll')).toBeInTheDocument();
    });

    it('renders load more trigger when hasMore is true', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      expect(screen.getByTestId('load-more-trigger')).toBeInTheDocument();
    });

    it('does not render load more when no more products', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={{ ...defaultInitialProducts, nextToken: undefined }}
          metrics={defaultMetrics}
        />
      );

      expect(screen.queryByTestId('load-more-trigger')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no products', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={{ items: [], total: 0 }}
          metrics={{ ...defaultMetrics, total: 0 }}
        />
      );

      expect(screen.getByText('No tienes productos creados')).toBeInTheDocument();
    });

    it('shows refresh button in empty state', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={{ items: [], total: 0 }}
          metrics={defaultMetrics}
        />
      );

      expect(screen.getByText('🔄 Actualizar')).toBeInTheDocument();
    });

    it('shows appropriate empty state for circuits filter', async () => {
      mockGetProviderProductsAction.mockResolvedValueOnce({
        success: true,
        data: { items: [], total: 0 }
      });

      render(
        <ProviderProductsDashboard
          initialProducts={{ items: [], total: 0 }}
          metrics={defaultMetrics}
          initialFilter="circuit"
        />
      );

      expect(screen.getByText('No tienes circuitos')).toBeInTheDocument();
    });

    it('shows appropriate empty state for packages filter', async () => {
      render(
        <ProviderProductsDashboard
          initialProducts={{ items: [], total: 0 }}
          metrics={defaultMetrics}
          initialFilter="package"
        />
      );

      expect(screen.getByText('No tienes paquetes')).toBeInTheDocument();
    });

    it('shows appropriate empty state for drafts filter', async () => {
      render(
        <ProviderProductsDashboard
          initialProducts={{ items: [], total: 0 }}
          metrics={defaultMetrics}
          initialFilter="draft"
        />
      );

      expect(screen.getByText('No tienes borradores')).toBeInTheDocument();
    });

    it('shows appropriate empty state for published filter', async () => {
      render(
        <ProviderProductsDashboard
          initialProducts={{ items: [], total: 0 }}
          metrics={defaultMetrics}
          initialFilter="published"
        />
      );

      expect(screen.getByText('No tienes productos publicados')).toBeInTheDocument();
    });
  });

  describe('Filter Tabs', () => {
    it('applies active styling to selected filter', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
          initialFilter="all"
        />
      );

      const allTab = screen.getByText('📊 Todos');
      expect(allTab).toHaveClass('border-pink-500', 'text-pink-600');
    });

    it('changes filter when clicking tab', async () => {
      mockGetProviderProductsAction.mockResolvedValueOnce({
        success: true,
        data: { items: defaultProducts.filter(p => p.product_type === 'circuit'), total: 2 }
      });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const circuitsTab = screen.getByText('🗺️ Circuitos');
      await act(async () => {
        fireEvent.click(circuitsTab);
      });

      expect(mockGetProviderProductsAction).toHaveBeenCalledWith({
        pagination: { limit: 12 },
        filter: { product_type: 'circuit' }
      });
    });

    it('changes filter to packages', async () => {
      mockGetProviderProductsAction.mockResolvedValueOnce({
        success: true,
        data: { items: [], total: 0 }
      });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const packagesTab = screen.getByText('📦 Paquetes');
      await act(async () => {
        fireEvent.click(packagesTab);
      });

      expect(mockGetProviderProductsAction).toHaveBeenCalledWith({
        pagination: { limit: 12 },
        filter: { product_type: 'package' }
      });
    });

    it('changes filter to drafts', async () => {
      mockGetProviderProductsAction.mockResolvedValueOnce({
        success: true,
        data: { items: [], total: 0 }
      });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const draftsTab = screen.getByText('✏️ Borradores');
      await act(async () => {
        fireEvent.click(draftsTab);
      });

      expect(mockGetProviderProductsAction).toHaveBeenCalledWith({
        pagination: { limit: 12 },
        filter: { published: false }
      });
    });

    it('changes filter to published', async () => {
      mockGetProviderProductsAction.mockResolvedValueOnce({
        success: true,
        data: { items: [], total: 0 }
      });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const publishedTab = screen.getByText('✅ Publicados');
      await act(async () => {
        fireEvent.click(publishedTab);
      });

      expect(mockGetProviderProductsAction).toHaveBeenCalledWith({
        pagination: { limit: 12 },
        filter: { published: true }
      });
    });

    it('shows toast with filter results', async () => {
      mockGetProviderProductsAction.mockResolvedValueOnce({
        success: true,
        data: { items: [defaultProducts[0]], total: 1 }
      });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const circuitsTab = screen.getByText('🗺️ Circuitos');
      await act(async () => {
        fireEvent.click(circuitsTab);
      });

      await waitFor(() => {
        expect(mockToastShow).toHaveBeenCalled();
      });
    });

    it('tracks analytics when changing filter', async () => {
      mockGetProviderProductsAction.mockResolvedValueOnce({
        success: true,
        data: { items: [], total: 0 }
      });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const circuitsTab = screen.getByText('🗺️ Circuitos');
      await act(async () => {
        fireEvent.click(circuitsTab);
      });

      expect(mockTrackUserFlow).toHaveBeenCalledWith(
        'product_filtering',
        'filter_circuit',
        'filter_all',
        expect.any(Object)
      );
    });

  });

  describe('Load More / Infinite Scroll', () => {
    it('loads more products when triggered', async () => {
      const moreProducts = [
        createMockProduct({ id: 'product-4', name: 'Circuito Extra' })
      ];

      mockGetProviderProductsAction.mockResolvedValueOnce({
        success: true,
        data: { items: moreProducts, nextToken: null, total: 4 }
      });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const loadMoreTrigger = screen.getByTestId('load-more-trigger');
      await act(async () => {
        fireEvent.click(loadMoreTrigger);
      });

      expect(mockGetProviderProductsAction).toHaveBeenCalledWith({
        pagination: { limit: 12, nextToken: 'next-token-123' },
        filter: {}
      });
    });

    it('tracks analytics on successful load more', async () => {
      mockGetProviderProductsAction.mockResolvedValueOnce({
        success: true,
        data: { items: [], nextToken: null, total: 3 }
      });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const loadMoreTrigger = screen.getByTestId('load-more-trigger');
      await act(async () => {
        fireEvent.click(loadMoreTrigger);
      });

      await waitFor(() => {
        expect(mockTrackSuccess).toHaveBeenCalledWith(
          'infinite_scroll',
          'load_more',
          expect.any(Object)
        );
      });
    });

  });

  describe('Delete Product', () => {
    it('shows delete confirmation modal when clicking delete', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      expect(screen.getByText('¿Eliminar producto?')).toBeInTheDocument();
      expect(screen.getByText('Esta acción no se puede deshacer')).toBeInTheDocument();
    });

    it('shows cancel button in delete modal', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('shows confirm button in delete modal', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      expect(screen.getByText('Eliminar')).toBeInTheDocument();
    });

    it('closes modal when clicking cancel', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      const cancelBtn = screen.getByText('Cancelar');
      fireEvent.click(cancelBtn);

      expect(screen.queryByText('¿Eliminar producto?')).not.toBeInTheDocument();
    });

    it('deletes product when confirmed', async () => {
      mockDeleteProductAction.mockResolvedValueOnce({ success: true });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      const confirmBtn = screen.getByText('Eliminar');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      expect(mockDeleteProductAction).toHaveBeenCalledWith('product-1');
    });

    it('shows success toast after deletion', async () => {
      mockDeleteProductAction.mockResolvedValueOnce({ success: true });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      const confirmBtn = screen.getByText('Eliminar');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(mockToastShow).toHaveBeenCalledWith('✅ Producto eliminado exitosamente', 'success');
      });
    });

    it('removes product from list after deletion', async () => {
      mockDeleteProductAction.mockResolvedValueOnce({ success: true });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      const confirmBtn = screen.getByText('Eliminar');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('product-card-product-1')).not.toBeInTheDocument();
      });
    });

    it('handles delete error', async () => {
      mockDeleteProductAction.mockResolvedValueOnce({ success: false, error: 'Delete failed' });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      const confirmBtn = screen.getByText('Eliminar');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(mockToastShow).toHaveBeenCalledWith('❌ Delete failed', 'error');
      });
    });

    it('tracks analytics on successful deletion', async () => {
      mockDeleteProductAction.mockResolvedValueOnce({ success: true });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      const confirmBtn = screen.getByText('Eliminar');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(mockTrackSuccess).toHaveBeenCalledWith(
          'product_deletion',
          'delete_product',
          expect.objectContaining({ productId: 'product-1' })
        );
      });
    });

    it('shows loading state while deleting', async () => {
      let resolveDelete: (value: { success: boolean }) => void;
      mockDeleteProductAction.mockReturnValueOnce(
        new Promise(resolve => { resolveDelete = resolve; })
      );

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      const confirmBtn = screen.getByText('Eliminar');
      fireEvent.click(confirmBtn);

      expect(screen.getByText('Eliminando...')).toBeInTheDocument();

      await act(async () => {
        resolveDelete!({ success: true });
      });
    });
  });

  describe('Initial Filter from URL', () => {
    it('uses initialFilter prop', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
          initialFilter="circuit"
        />
      );

      const circuitsTab = screen.getByText('🗺️ Circuitos');
      expect(circuitsTab).toHaveClass('border-pink-500', 'text-pink-600');
    });

    it('tracks analytics for URL filter', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
          initialFilter="circuit"
        />
      );

      expect(mockTrack).toHaveBeenCalledWith(
        'url_filter_applied',
        expect.objectContaining({
          feature: 'product_management',
          metadata: expect.objectContaining({ filter: 'circuit' })
        })
      );
    });

    it('shows toast for URL filter with products', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
          initialFilter="circuit"
        />
      );

      expect(mockToastShow).toHaveBeenCalledWith(
        expect.stringContaining('Circuitos'),
        'info',
        2000
      );
    });

    it('does not show toast for URL filter without products', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={{ items: [], total: 0 }}
          metrics={defaultMetrics}
          initialFilter="circuit"
        />
      );

      // Check that toast was not called for circuit filter
      expect(mockToastShow).not.toHaveBeenCalledWith(
        expect.stringContaining('Circuitos cargados'),
        'info',
        2000
      );
    });
  });

  describe('Metrics Updates After Deletion', () => {
    it('decrements total metric after deletion', async () => {
      mockDeleteProductAction.mockResolvedValueOnce({ success: true });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      // Initial total is 10
      expect(screen.getByText('10')).toBeInTheDocument();

      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      const confirmBtn = screen.getByText('Eliminar');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        // Total should be 9 after deletion
        expect(screen.getByText('9')).toBeInTheDocument();
      });
    });

    it('decrements published metric when deleting published product', async () => {
      mockDeleteProductAction.mockResolvedValueOnce({ success: true });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      // Initial published is 7
      expect(screen.getByText('7')).toBeInTheDocument();

      // Delete published product (product-1 is published)
      const deleteBtn = screen.getByTestId('delete-btn-product-1');
      fireEvent.click(deleteBtn);

      const confirmBtn = screen.getByText('Eliminar');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        // Published should be 6 after deletion
        expect(screen.getByText('6')).toBeInTheDocument();
      });
    });

    it('decrements drafts metric when deleting draft product', async () => {
      mockDeleteProductAction.mockResolvedValueOnce({ success: true });

      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={defaultMetrics}
        />
      );

      // Initial drafts is 3
      expect(screen.getByText('3')).toBeInTheDocument();

      // Delete draft product (product-3 is not published)
      const deleteBtn = screen.getByTestId('delete-btn-product-3');
      fireEvent.click(deleteBtn);

      const confirmBtn = screen.getByText('Eliminar');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        // Drafts should be 2 after deletion
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('Null/Undefined Props', () => {
    it('handles null initialProducts', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={null}
          metrics={defaultMetrics}
        />
      );

      expect(screen.getByText('No tienes productos creados')).toBeInTheDocument();
    });

    it('handles null metrics', () => {
      render(
        <ProviderProductsDashboard
          initialProducts={defaultInitialProducts}
          metrics={null}
        />
      );

      // Should show 0 for all metrics
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });
});
