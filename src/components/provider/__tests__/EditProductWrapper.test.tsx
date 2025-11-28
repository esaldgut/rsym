/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EditProductWrapper } from '../EditProductWrapper';
import type { Product } from '@/generated/graphql';

// Mock analytics service
const mockTrack = jest.fn();
jest.mock('@/lib/services/analytics-service', () => ({
  analytics: {
    track: (...args: unknown[]) => mockTrack(...args)
  }
}));

// Mock ProductWizard - capture props passed to it
const mockProductWizardProps = jest.fn();
jest.mock('@/components/product-wizard/ProductWizard', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockProductWizardProps(props);
    return <div data-testid="product-wizard">ProductWizard Mock</div>;
  }
}));

// Mock console.log
const originalConsoleLog = console.log;
const mockConsoleLog = jest.fn();

describe('EditProductWrapper', () => {
  const mockProduct: Partial<Product> = {
    id: 'product-123',
    name: 'Circuito Yucatán',
    product_type: 'circuit',
    published: true,
    description: 'Un hermoso circuito por Yucatán'
  };

  const mockUserId = 'user-456';

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('Rendering', () => {
    it('renders ProductWizard component', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(screen.getByTestId('product-wizard')).toBeInTheDocument();
    });

    it('passes editMode={true} to ProductWizard', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockProductWizardProps).toHaveBeenCalledWith(
        expect.objectContaining({
          editMode: true
        })
      );
    });

    it('passes initialProduct prop to ProductWizard', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockProductWizardProps).toHaveBeenCalledWith(
        expect.objectContaining({
          initialProduct: mockProduct
        })
      );
    });

    it('passes userId prop to ProductWizard', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockProductWizardProps).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId
        })
      );
    });

    it('passes productType from product to ProductWizard', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockProductWizardProps).toHaveBeenCalledWith(
        expect.objectContaining({
          productType: 'circuit'
        })
      );
    });

    it('passes productType "package" when product is a package', () => {
      const packageProduct = { ...mockProduct, product_type: 'package' };

      render(
        <EditProductWrapper
          product={packageProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockProductWizardProps).toHaveBeenCalledWith(
        expect.objectContaining({
          productType: 'package'
        })
      );
    });
  });

  describe('Analytics Tracking', () => {
    it('calls analytics.track on mount', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockTrack).toHaveBeenCalledTimes(1);
    });

    it('tracks "product_edit_started" event', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockTrack).toHaveBeenCalledWith(
        'product_edit_started',
        expect.any(Object)
      );
    });

    it('includes correct feature and category in tracking', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockTrack).toHaveBeenCalledWith(
        'product_edit_started',
        expect.objectContaining({
          feature: 'product_management',
          category: 'user_action'
        })
      );
    });

    it('includes userFlow information in tracking', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockTrack).toHaveBeenCalledWith(
        'product_edit_started',
        expect.objectContaining({
          userFlow: {
            currentAction: 'edit_product',
            previousAction: 'view_product_list'
          }
        })
      );
    });

    it('includes product metadata in tracking', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockTrack).toHaveBeenCalledWith(
        'product_edit_started',
        expect.objectContaining({
          metadata: {
            productId: 'product-123',
            productType: 'circuit',
            isPublished: true
          }
        })
      );
    });

    it('tracks unpublished product status correctly', () => {
      const draftProduct = { ...mockProduct, published: false };

      render(
        <EditProductWrapper
          product={draftProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockTrack).toHaveBeenCalledWith(
        'product_edit_started',
        expect.objectContaining({
          metadata: expect.objectContaining({
            isPublished: false
          })
        })
      );
    });
  });

  describe('Console Logging', () => {
    it('logs initialization message on mount', () => {
      render(
        <EditProductWrapper
          product={mockProduct as Product}
          userId={mockUserId}
        />
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📝 Iniciando ProductWizard en modo edición:',
        expect.objectContaining({
          productId: 'product-123',
          productName: 'Circuito Yucatán',
          productType: 'circuit'
        })
      );
    });
  });
});
