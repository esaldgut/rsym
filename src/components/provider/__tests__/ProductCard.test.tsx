/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';
import type { Product } from '@/generated/graphql';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  )
}));

// Mock ProfileImage
jest.mock('@/components/ui/ProfileImage', () => ({
  ProfileImage: ({ path, alt }: { path?: string; alt?: string }) => (
    <img data-testid="profile-image" src={path || ''} alt={alt || ''} />
  )
}));

describe('ProductCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  // Helper to create mock product with current active season
  const createMockProduct = (overrides: Partial<Product> = {}): Partial<Product> => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    return {
      id: 'product-123',
      name: 'Circuito Mágico Yucatán',
      description: 'Un hermoso circuito por la península de Yucatán',
      product_type: 'circuit',
      published: true,
      cover_image_url: 'public/products/yucatan.jpg',
      created_at: '2024-01-15T10:00:00Z',
      destination: [
        { place: 'Mérida', placeSub: 'Yucatán' },
        { place: 'Cancún', placeSub: 'Quintana Roo' }
      ],
      min_product_price: 15000,
      seasons: [
        {
          category: 'Verano 2024',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          allotment: 20,
          allotment_remain: 15
        }
      ],
      ...overrides
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders product name', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('Circuito Mágico Yucatán')).toBeInTheDocument();
    });

    it('renders product description', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('Un hermoso circuito por la península de Yucatán')).toBeInTheDocument();
    });

    it('renders ProfileImage with cover_image_url', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      const image = screen.getByTestId('profile-image');
      expect(image).toHaveAttribute('src', 'public/products/yucatan.jpg');
      expect(image).toHaveAttribute('alt', 'Circuito Mágico Yucatán');
    });

    it('does not render description when not provided', () => {
      const product = createMockProduct({ description: undefined });
      render(<ProductCard product={product as Product} />);

      expect(screen.queryByText('Un hermoso circuito por la península de Yucatán')).not.toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    it('renders "Publicado" badge with green styling when published', () => {
      const product = createMockProduct({ published: true });
      render(<ProductCard product={product as Product} />);

      const badge = screen.getByText('Publicado');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('renders "Borrador" badge with amber styling when not published', () => {
      const product = createMockProduct({ published: false });
      render(<ProductCard product={product as Product} />);

      const badge = screen.getByText('Borrador');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-amber-100', 'text-amber-800');
    });
  });

  describe('Type Badge', () => {
    it('renders circuit badge with blue styling', () => {
      const product = createMockProduct({ product_type: 'circuit' });
      render(<ProductCard product={product as Product} />);

      const badge = screen.getByText('🗺️ Circuito');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('renders package badge with purple styling', () => {
      const product = createMockProduct({ product_type: 'package' });
      render(<ProductCard product={product as Product} />);

      const badge = screen.getByText('📦 Paquete');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
    });
  });

  describe('Destination Text', () => {
    it('shows first destination with additional count', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('Mérida +1 más')).toBeInTheDocument();
    });

    it('shows single destination without additional count', () => {
      const product = createMockProduct({
        destination: [{ place: 'Cancún', placeSub: 'Quintana Roo' }]
      });
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('Cancún')).toBeInTheDocument();
      expect(screen.queryByText(/\+\d+ más/)).not.toBeInTheDocument();
    });

    it('shows "Sin destino definido" when no destinations', () => {
      const product = createMockProduct({ destination: [] });
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('Sin destino definido')).toBeInTheDocument();
    });

    it('shows "Sin destino definido" when destination is undefined', () => {
      const product = createMockProduct({ destination: undefined });
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('Sin destino definido')).toBeInTheDocument();
    });

    it('shows correct count for multiple destinations', () => {
      const product = createMockProduct({
        destination: [
          { place: 'Mérida', placeSub: 'Yucatán' },
          { place: 'Cancún', placeSub: 'Quintana Roo' },
          { place: 'Playa del Carmen', placeSub: 'Quintana Roo' }
        ]
      });
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('Mérida +2 más')).toBeInTheDocument();
    });
  });

  describe('Current Season', () => {
    it('shows current season info when season is active', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('Temporada activa:')).toBeInTheDocument();
      expect(screen.getByText('Verano 2024')).toBeInTheDocument();
    });

    it('shows allotment information', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('15 / 20 disponibles')).toBeInTheDocument();
    });

    it('does not show season info when no active season', () => {
      const pastDate = new Date('2020-01-01').toISOString();
      const pastEndDate = new Date('2020-02-01').toISOString();

      const product = createMockProduct({
        seasons: [
          {
            category: 'Temporada Pasada',
            start_date: pastDate,
            end_date: pastEndDate,
            allotment: 10,
            allotment_remain: 5
          }
        ]
      });
      render(<ProductCard product={product as Product} />);

      expect(screen.queryByText('Temporada activa:')).not.toBeInTheDocument();
    });

    it('does not show season info when no seasons', () => {
      const product = createMockProduct({ seasons: [] });
      render(<ProductCard product={product as Product} />);

      expect(screen.queryByText('Temporada activa:')).not.toBeInTheDocument();
    });

    it('shows 0 / 0 when allotment values are undefined', () => {
      const now = new Date();
      const product = createMockProduct({
        seasons: [
          {
            category: 'Test Season',
            start_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            allotment: undefined,
            allotment_remain: undefined
          }
        ]
      });
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('0 / 0 disponibles')).toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('shows price when min_product_price exists', () => {
      const product = createMockProduct({ min_product_price: 15000 });
      render(<ProductCard product={product as Product} />);

      expect(screen.getByText('Desde')).toBeInTheDocument();
      expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
      expect(screen.getByText('MXN')).toBeInTheDocument();
    });

    it('does not show price when min_product_price is undefined', () => {
      const product = createMockProduct({ min_product_price: undefined });
      render(<ProductCard product={product as Product} />);

      expect(screen.queryByText('Desde')).not.toBeInTheDocument();
    });

    it('formats price with locale separators', () => {
      const product = createMockProduct({ min_product_price: 1234567 });
      render(<ProductCard product={product as Product} />);

      // Should format with commas or locale-appropriate separator
      expect(screen.getByText(/\$1,234,567/)).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats created_at date in Spanish locale', () => {
      const product = createMockProduct({ created_at: '2024-01-15T10:00:00Z' });
      render(<ProductCard product={product as Product} />);

      // Should show "Creado: 15 ene 2024" or similar Spanish format
      expect(screen.getByText(/Creado:/)).toBeInTheDocument();
    });
  });

  describe('Menu Toggle', () => {
    it('does not show menu by default', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      expect(screen.queryByText('✏️ Editar')).not.toBeInTheDocument();
    });

    it('shows menu when menu button is clicked', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.getByText('✏️ Editar')).toBeInTheDocument();
    });

    it('hides menu when clicked again', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton); // Open
      fireEvent.click(menuButton); // Close

      expect(screen.queryByText('✏️ Editar')).not.toBeInTheDocument();
    });
  });

  describe('Menu Links', () => {
    it('renders edit link with correct href', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      fireEvent.click(screen.getByRole('button')); // Open menu

      const editLink = screen.getByText('✏️ Editar');
      expect(editLink).toHaveAttribute('href', '/provider/products/product-123/edit');
    });

    it('renders view details link with correct href', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      fireEvent.click(screen.getByRole('button')); // Open menu

      const viewLink = screen.getByText('👁️ Ver detalles');
      expect(viewLink).toHaveAttribute('href', '/provider/products/product-123');
    });

    it('shows marketplace link only when published', () => {
      const product = createMockProduct({ published: true });
      render(<ProductCard product={product as Product} />);

      fireEvent.click(screen.getByRole('button')); // Open menu

      expect(screen.getByText('🚀 Ver en marketplace')).toBeInTheDocument();
    });

    it('does not show marketplace link when not published', () => {
      const product = createMockProduct({ published: false });
      render(<ProductCard product={product as Product} />);

      fireEvent.click(screen.getByRole('button')); // Open menu

      expect(screen.queryByText('🚀 Ver en marketplace')).not.toBeInTheDocument();
    });

    it('marketplace link has correct href and opens in new tab', () => {
      const product = createMockProduct({ published: true });
      render(<ProductCard product={product as Product} />);

      fireEvent.click(screen.getByRole('button')); // Open menu

      const marketplaceLink = screen.getByText('🚀 Ver en marketplace');
      expect(marketplaceLink).toHaveAttribute('href', '/marketplace/products/product-123');
      expect(marketplaceLink).toHaveAttribute('target', '_blank');
    });

    it('closes menu when clicking edit link', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      fireEvent.click(screen.getByRole('button')); // Open menu
      fireEvent.click(screen.getByText('✏️ Editar'));

      // Menu should close (test by checking menu item is gone)
      expect(screen.queryByText('👁️ Ver detalles')).not.toBeInTheDocument();
    });
  });

  describe('Delete Action', () => {
    it('renders delete button in menu', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} onDelete={mockOnDelete} />);

      fireEvent.click(screen.getByRole('button')); // Open menu

      expect(screen.getByText('🗑️ Eliminar')).toBeInTheDocument();
    });

    it('calls onDelete with product when delete is clicked', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} onDelete={mockOnDelete} />);

      fireEvent.click(screen.getByRole('button')); // Open menu
      fireEvent.click(screen.getByText('🗑️ Eliminar'));

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(product);
    });

    it('closes menu after delete is clicked', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} onDelete={mockOnDelete} />);

      fireEvent.click(screen.getByRole('button')); // Open menu
      fireEvent.click(screen.getByText('🗑️ Eliminar'));

      expect(screen.queryByText('✏️ Editar')).not.toBeInTheDocument();
    });

    it('does not throw when onDelete is not provided', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      fireEvent.click(screen.getByRole('button')); // Open menu

      expect(() => {
        fireEvent.click(screen.getByText('🗑️ Eliminar'));
      }).not.toThrow();
    });
  });

  describe('Footer Links', () => {
    it('renders Gestionar link with correct href', () => {
      const product = createMockProduct();
      render(<ProductCard product={product as Product} />);

      const manageLink = screen.getByText('Gestionar');
      expect(manageLink).toHaveAttribute('href', '/provider/products/product-123/edit');
    });
  });
});
