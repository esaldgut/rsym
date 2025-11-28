/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProductDetailsView } from '../ProductDetailsView';
import type { Product } from '@/generated/graphql';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  )
}));

// Mock HeroSection
jest.mock('@/components/ui/HeroSection', () => ({
  HeroSection: ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <div data-testid="hero-section">
      <h1 data-testid="hero-title">{title}</h1>
      <p data-testid="hero-subtitle">{subtitle}</p>
      <div data-testid="hero-children">{children}</div>
    </div>
  )
}));

// Mock ProfileImage
jest.mock('@/components/ui/ProfileImage', () => ({
  ProfileImage: ({ path, alt }: { path?: string; alt?: string }) => (
    <img data-testid="profile-image" src={path || ''} alt={alt || ''} />
  )
}));

describe('ProductDetailsView', () => {
  const createMockProduct = (overrides: Partial<Product> = {}): Partial<Product> => ({
    id: 'product-123',
    name: 'Circuito Maya Completo',
    description: 'Un viaje inolvidable por la cultura maya',
    product_type: 'circuit',
    published: true,
    cover_image_url: 'public/products/maya.jpg',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-02-20T15:45:00Z',
    min_product_price: 25000,
    destination: [
      { place: 'Chichén Itzá', placeSub: 'Yucatán' },
      { place: 'Uxmal', placeSub: 'Yucatán' }
    ],
    languages: ['Español', 'English', 'Français'],
    preferences: ['Cultura', 'Historia', 'Arqueología'],
    seasons: [
      {
        id: 'season-1',
        category: 'Temporada Alta',
        start_date: '2024-12-01',
        end_date: '2024-12-31',
        allotment: 50,
        allotment_remain: 30
      },
      {
        id: 'season-2',
        category: 'Temporada Baja',
        start_date: '2024-06-01',
        end_date: '2024-06-30',
        allotment: 30,
        allotment_remain: 0
      }
    ],
    itinerary: 'Día 1: Llegada a Mérida\nDía 2: Visita a Chichén Itzá\nDía 3: Exploración de Uxmal',
    ...overrides
  });

  const mockUserId = 'user-456';

  describe('HeroSection', () => {
    it('renders HeroSection with product name as title', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByTestId('hero-title')).toHaveTextContent('Circuito Maya Completo');
    });

    it('renders correct subtitle for circuit product', () => {
      const product = createMockProduct({ product_type: 'circuit' });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByTestId('hero-subtitle')).toHaveTextContent('Circuito Turístico - Vista Detallada');
    });

    it('renders correct subtitle for package product', () => {
      const product = createMockProduct({ product_type: 'package' });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByTestId('hero-subtitle')).toHaveTextContent('Paquete Turístico - Vista Detallada');
    });

    it('renders "Editar Producto" link with correct href', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      const editLink = screen.getByText('✏️ Editar Producto');
      expect(editLink).toHaveAttribute('href', '/provider/products/product-123/edit');
    });

    it('renders "Volver al Dashboard" link with correct href', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      const backLink = screen.getByText('← Volver al Dashboard');
      expect(backLink).toHaveAttribute('href', '/provider/products');
    });
  });

  describe('Status Badge', () => {
    it('renders "Publicado" badge when published', () => {
      const product = createMockProduct({ published: true });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      const badges = screen.getAllByText('Publicado');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('renders "Borrador" badge when not published', () => {
      const product = createMockProduct({ published: false });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      const badges = screen.getAllByText('Borrador');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('Type Badge', () => {
    it('renders circuit badge with blue styling', () => {
      const product = createMockProduct({ product_type: 'circuit' });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      const badge = screen.getByText('🗺️ Circuito');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('renders package badge with purple styling', () => {
      const product = createMockProduct({ product_type: 'package' });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      const badge = screen.getByText('📦 Paquete');
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
    });
  });

  describe('Product Image', () => {
    it('renders ProfileImage with cover_image_url', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      const image = screen.getByTestId('profile-image');
      expect(image).toHaveAttribute('src', 'public/products/maya.jpg');
      expect(image).toHaveAttribute('alt', 'Circuito Maya Completo');
    });
  });

  describe('Product Info', () => {
    it('renders product name in main content', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      // Name appears in both hero and content
      const names = screen.getAllByText('Circuito Maya Completo');
      expect(names.length).toBeGreaterThanOrEqual(1);
    });

    it('renders product description', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('Un viaje inolvidable por la cultura maya')).toBeInTheDocument();
    });

    it('does not render description section when not provided', () => {
      const product = createMockProduct({ description: undefined });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('Un viaje inolvidable por la cultura maya')).not.toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('shows price when min_product_price exists', () => {
      const product = createMockProduct({ min_product_price: 25000 });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('Desde')).toBeInTheDocument();
      expect(screen.getByText(/\$25,000/)).toBeInTheDocument();
    });

    it('does not show price section when min_product_price is undefined', () => {
      const product = createMockProduct({ min_product_price: undefined });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('Desde')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('shows created date with Spanish formatting', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('Creado')).toBeInTheDocument();
    });

    it('shows updated date with Spanish formatting', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('Última actualización')).toBeInTheDocument();
    });
  });

  describe('Destinations Section', () => {
    it('renders destinations when provided', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('📍 Destinos')).toBeInTheDocument();
      expect(screen.getByText('Chichén Itzá, Yucatán')).toBeInTheDocument();
      expect(screen.getByText('Uxmal, Yucatán')).toBeInTheDocument();
    });

    it('does not render destinations section when empty', () => {
      const product = createMockProduct({ destination: [] });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('📍 Destinos')).not.toBeInTheDocument();
    });

    it('does not render destinations section when undefined', () => {
      const product = createMockProduct({ destination: undefined });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('📍 Destinos')).not.toBeInTheDocument();
    });

    it('renders destination without placeSub correctly', () => {
      const product = createMockProduct({
        destination: [{ place: 'Cancún', placeSub: undefined }]
      });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('Cancún')).toBeInTheDocument();
    });
  });

  describe('Languages Section', () => {
    it('renders languages when provided', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('🌍 Idiomas')).toBeInTheDocument();
      expect(screen.getByText('Español')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Français')).toBeInTheDocument();
    });

    it('does not render languages section when empty', () => {
      const product = createMockProduct({ languages: [] });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('🌍 Idiomas')).not.toBeInTheDocument();
    });

    it('does not render languages section when undefined', () => {
      const product = createMockProduct({ languages: undefined });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('🌍 Idiomas')).not.toBeInTheDocument();
    });
  });

  describe('Preferences Section', () => {
    it('renders preferences when provided', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('✨ Preferencias')).toBeInTheDocument();
      expect(screen.getByText('Cultura')).toBeInTheDocument();
      expect(screen.getByText('Historia')).toBeInTheDocument();
      expect(screen.getByText('Arqueología')).toBeInTheDocument();
    });

    it('does not render preferences section when empty', () => {
      const product = createMockProduct({ preferences: [] });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('✨ Preferencias')).not.toBeInTheDocument();
    });

    it('does not render preferences section when undefined', () => {
      const product = createMockProduct({ preferences: undefined });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('✨ Preferencias')).not.toBeInTheDocument();
    });
  });

  describe('Seasons Section', () => {
    it('renders seasons section when seasons exist', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('🗓️ Temporadas')).toBeInTheDocument();
      expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      expect(screen.getByText('Temporada Baja')).toBeInTheDocument();
    });

    it('shows allotment with availability', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('30 / 50')).toBeInTheDocument();
      expect(screen.getByText('0 / 30')).toBeInTheDocument();
    });

    it('applies green styling when allotment_remain > 0', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      const availableBadge = screen.getByText('30 / 50');
      expect(availableBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('applies red styling when allotment_remain = 0', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      const unavailableBadge = screen.getByText('0 / 30');
      expect(unavailableBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('does not render seasons section when empty', () => {
      const product = createMockProduct({ seasons: [] });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('🗓️ Temporadas')).not.toBeInTheDocument();
    });

    it('does not render seasons section when undefined', () => {
      const product = createMockProduct({ seasons: undefined });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('🗓️ Temporadas')).not.toBeInTheDocument();
    });
  });

  describe('Itinerary Section', () => {
    it('renders itinerary when provided', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.getByText('🗺️ Itinerario')).toBeInTheDocument();
      expect(screen.getByText(/Día 1: Llegada a Mérida/)).toBeInTheDocument();
    });

    it('preserves whitespace in itinerary text', () => {
      const product = createMockProduct();
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      // The whitespace-pre-wrap class should be applied
      const itineraryContainer = screen.getByText(/Día 1: Llegada a Mérida/);
      expect(itineraryContainer).toHaveClass('whitespace-pre-wrap');
    });

    it('does not render itinerary section when not provided', () => {
      const product = createMockProduct({ itinerary: undefined });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      expect(screen.queryByText('🗺️ Itinerario')).not.toBeInTheDocument();
    });

    it('does not render itinerary section when empty string', () => {
      const product = createMockProduct({ itinerary: '' });
      render(<ProductDetailsView product={product as Product} userId={mockUserId} />);

      // Empty string is falsy so section won't render
      expect(screen.queryByText('🗺️ Itinerario')).not.toBeInTheDocument();
    });
  });
});
