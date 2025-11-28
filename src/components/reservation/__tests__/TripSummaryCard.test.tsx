/**
 * Unit tests for TripSummaryCard component
 *
 * Tests the trip summary card display:
 * - Image gallery with navigation
 * - Product type badge (circuit/package)
 * - Product name and description
 * - Destinations text formatting
 * - Travelers breakdown with pluralization
 * - Reservation date formatting
 * - Price display with currency
 * - Itinerary section (collapsible)
 * - Hotels section
 *
 * @see src/components/reservation/TripSummaryCard.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import TripSummaryCard from '../TripSummaryCard';

// Mock S3GalleryImage component
jest.mock('@/components/ui/S3GalleryImage', () => ({
  S3GalleryImage: ({ path, alt, objectFit, className }: { path?: string; alt: string; objectFit: string; className: string }) => (
    <div data-testid="mock-s3-gallery-image" data-path={path} data-alt={alt} data-object-fit={objectFit} className={className}>
      S3GalleryImage
    </div>
  ),
}));

describe('TripSummaryCard', () => {
  const mockProduct = {
    id: 'product-123',
    name: 'Circuito Mágico por Michoacán',
    description: 'Una experiencia única por los pueblos mágicos',
    product_type: 'circuit',
    cover_image_url: 'public/products/cover.jpg',
    image_url: ['public/products/img1.jpg', 'public/products/img2.jpg'],
    itinerary: 'Día 1: Llegada a Morelia\nDía 2: Visita a Pátzcuaro\nDía 3: Janitzio\nDía 4: Regreso',
    planned_hotels_or_similar: ['Hotel Casa Grande', 'Hotel Mansión Iturbe', 'Hotel Posada de la Basílica'],
    destination: [
      { place: 'Morelia', placeSub: 'Michoacán' },
      { place: 'Pátzcuaro', placeSub: 'Michoacán' },
    ],
  };

  const mockReservation = {
    id: 'reservation-123',
    adults: 2,
    kids: 1,
    babys: 0,
    price_per_person: 5000,
    total_price: 15000,
    currency: 'MXN',
    reservation_date: '2025-06-15T12:00:00.000Z',
    status: 'confirmed',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // IMAGE GALLERY
  // ============================================================

  describe('Image gallery', () => {
    it('renders S3GalleryImage with cover image', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      const image = screen.getByTestId('mock-s3-gallery-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('data-path', 'public/products/cover.jpg');
    });

    it('displays image navigation dots when multiple images', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      // 3 images total: cover + 2 additional
      const dots = screen.getAllByRole('button', { name: /Ver imagen/i });
      expect(dots).toHaveLength(3);
    });

    it('changes image when navigation dot is clicked', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      const dots = screen.getAllByRole('button', { name: /Ver imagen/i });
      fireEvent.click(dots[1]); // Click second dot

      const image = screen.getByTestId('mock-s3-gallery-image');
      expect(image).toHaveAttribute('data-path', 'public/products/img1.jpg');
    });

    it('hides gallery when no images', () => {
      const noImagesProduct = { ...mockProduct, cover_image_url: undefined, image_url: undefined };
      render(<TripSummaryCard product={noImagesProduct} reservation={mockReservation} />);

      expect(screen.queryByTestId('mock-s3-gallery-image')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // PRODUCT TYPE BADGE
  // ============================================================

  describe('Product type badge', () => {
    it('displays "Circuito" for circuit type', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Circuito')).toBeInTheDocument();
    });

    it('displays "Paquete" for package type', () => {
      const packageProduct = { ...mockProduct, product_type: 'package' };
      render(<TripSummaryCard product={packageProduct} reservation={mockReservation} />);

      expect(screen.getByText('Paquete')).toBeInTheDocument();
    });
  });

  // ============================================================
  // HEADER
  // ============================================================

  describe('Header', () => {
    it('displays product name', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Circuito Mágico por Michoacán')).toBeInTheDocument();
    });

    it('displays product description when available', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Una experiencia única por los pueblos mágicos')).toBeInTheDocument();
    });

    it('hides description when not available', () => {
      const noDescProduct = { ...mockProduct, description: undefined };
      render(<TripSummaryCard product={noDescProduct} reservation={mockReservation} />);

      expect(screen.queryByText('Una experiencia única por los pueblos mágicos')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // DESTINATIONS
  // ============================================================

  describe('Destinations', () => {
    it('displays destinations with arrows between them', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Morelia, Michoacán → Pátzcuaro, Michoacán')).toBeInTheDocument();
    });

    it('displays "Destino" label', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Destino')).toBeInTheDocument();
    });

    it('shows fallback when no destinations', () => {
      const noDestProduct = { ...mockProduct, destination: undefined };
      render(<TripSummaryCard product={noDestProduct} reservation={mockReservation} />);

      expect(screen.getByText('Destino no especificado')).toBeInTheDocument();
    });

    it('handles destination without placeSub', () => {
      const simpleDestProduct = {
        ...mockProduct,
        destination: [{ place: 'Cancún' }],
      };
      render(<TripSummaryCard product={simpleDestProduct} reservation={mockReservation} />);

      expect(screen.getByText('Cancún')).toBeInTheDocument();
    });
  });

  // ============================================================
  // TRAVELERS
  // ============================================================

  describe('Travelers', () => {
    it('displays travelers breakdown', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('2 adultos, 1 niño')).toBeInTheDocument();
    });

    it('displays "Viajeros" label', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Viajeros')).toBeInTheDocument();
    });

    it('handles singular adult', () => {
      const singleAdultReservation = { ...mockReservation, adults: 1, kids: 0 };
      render(<TripSummaryCard product={mockProduct} reservation={singleAdultReservation} />);

      expect(screen.getByText('1 adulto')).toBeInTheDocument();
    });

    it('includes babys when present', () => {
      const withBabysReservation = { ...mockReservation, babys: 1 };
      render(<TripSummaryCard product={mockProduct} reservation={withBabysReservation} />);

      expect(screen.getByText('2 adultos, 1 niño, 1 bebé')).toBeInTheDocument();
    });

    it('handles plural babys', () => {
      const multipleBabysReservation = { ...mockReservation, babys: 2 };
      render(<TripSummaryCard product={mockProduct} reservation={multipleBabysReservation} />);

      expect(screen.getByText('2 adultos, 1 niño, 2 bebés')).toBeInTheDocument();
    });
  });

  // ============================================================
  // RESERVATION DATE
  // ============================================================

  describe('Reservation date', () => {
    it('displays formatted reservation date', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText(/15 de junio de 2025/i)).toBeInTheDocument();
    });

    it('displays "Reservado el" label', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Reservado el')).toBeInTheDocument();
    });
  });

  // ============================================================
  // PRICE
  // ============================================================

  describe('Price', () => {
    it('displays formatted total price with currency', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('$15,000 MXN')).toBeInTheDocument();
    });

    it('displays "Precio Total" label', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Precio Total')).toBeInTheDocument();
    });

    it('handles large amounts', () => {
      const largeAmountReservation = { ...mockReservation, total_price: 1500000 };
      render(<TripSummaryCard product={mockProduct} reservation={largeAmountReservation} />);

      expect(screen.getByText('$1,500,000 MXN')).toBeInTheDocument();
    });
  });

  // ============================================================
  // ITINERARY
  // ============================================================

  describe('Itinerary', () => {
    it('displays "Itinerario" heading', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Itinerario')).toBeInTheDocument();
    });

    it('shows first 2 days by default', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText(/Llegada a Morelia/)).toBeInTheDocument();
      expect(screen.getByText(/Visita a Pátzcuaro/)).toBeInTheDocument();
    });

    it('shows "Ver más" button when more than 2 days', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText(/Ver 2 días más/)).toBeInTheDocument();
    });

    it('expands to show all days when "Ver más" is clicked', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      const expandButton = screen.getByText(/Ver 2 días más/);
      fireEvent.click(expandButton);

      expect(screen.getByText(/Janitzio/)).toBeInTheDocument();
      expect(screen.getByText(/Regreso/)).toBeInTheDocument();
    });

    it('shows "Ver menos" when expanded', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      const expandButton = screen.getByText(/Ver 2 días más/);
      fireEvent.click(expandButton);

      expect(screen.getByText('Ver menos')).toBeInTheDocument();
    });

    it('collapses when "Ver menos" is clicked', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      // Expand
      fireEvent.click(screen.getByText(/Ver 2 días más/));
      // Collapse
      fireEvent.click(screen.getByText('Ver menos'));

      expect(screen.getByText(/Ver 2 días más/)).toBeInTheDocument();
    });

    it('hides itinerary section when not available', () => {
      const noItineraryProduct = { ...mockProduct, itinerary: undefined };
      render(<TripSummaryCard product={noItineraryProduct} reservation={mockReservation} />);

      expect(screen.queryByText('Itinerario')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // HOTELS
  // ============================================================

  describe('Hotels', () => {
    it('displays "Alojamiento" heading', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Alojamiento')).toBeInTheDocument();
    });

    it('displays all hotels', () => {
      render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      expect(screen.getByText('Hotel Casa Grande')).toBeInTheDocument();
      expect(screen.getByText('Hotel Mansión Iturbe')).toBeInTheDocument();
      expect(screen.getByText('Hotel Posada de la Basílica')).toBeInTheDocument();
    });

    it('hides hotels section when not available', () => {
      const noHotelsProduct = { ...mockProduct, planned_hotels_or_similar: undefined };
      render(<TripSummaryCard product={noHotelsProduct} reservation={mockReservation} />);

      expect(screen.queryByText('Alojamiento')).not.toBeInTheDocument();
    });

    it('hides hotels section when empty array', () => {
      const emptyHotelsProduct = { ...mockProduct, planned_hotels_or_similar: [] };
      render(<TripSummaryCard product={emptyHotelsProduct} reservation={mockReservation} />);

      expect(screen.queryByText('Alojamiento')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // STRUCTURAL ELEMENTS
  // ============================================================

  describe('Structural elements', () => {
    it('has correct card styling', () => {
      const { container } = render(<TripSummaryCard product={mockProduct} reservation={mockReservation} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('shadow-sm');
    });
  });
});
