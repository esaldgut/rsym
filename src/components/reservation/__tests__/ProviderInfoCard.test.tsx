/**
 * Unit tests for ProviderInfoCard component
 *
 * Tests the provider info card display:
 * - Header and title
 * - Provider name (with fallback)
 * - Profile image display
 * - Star rating rendering (full/half/empty)
 * - Reviews count
 * - Response time
 * - Contact button (enabled/disabled states)
 * - Profile link
 * - Verified badge
 * - Support info section
 *
 * @see src/components/reservation/ProviderInfoCard.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ProviderInfoCard from '../ProviderInfoCard';

// Mock ProfileImage component
jest.mock('@/components/ui/ProfileImage', () => ({
  ProfileImage: ({ path, alt, size }: { path?: string; alt: string; size: string }) => (
    <div data-testid="mock-profile-image" data-path={path} data-alt={alt} data-size={size}>
      ProfileImage
    </div>
  ),
}));

describe('ProviderInfoCard', () => {
  const mockProvider = {
    id: 'provider-123',
    full_name: 'Juan Pérez',
    profile_image: 'public/avatars/juan.jpg',
    rating: 4.5,
    total_reviews: 128,
    response_time: '2 hours',
  };

  const mockOnContactClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // HEADER
  // ============================================================

  describe('Header', () => {
    it('displays "Tu Proveedor" title', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      expect(screen.getByText('Tu Proveedor')).toBeInTheDocument();
    });
  });

  // ============================================================
  // PROVIDER NAME
  // ============================================================

  describe('Provider name', () => {
    it('displays provider full name', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('displays "Proveedor" as fallback when no name', () => {
      const noNameProvider = { ...mockProvider, full_name: undefined };
      render(<ProviderInfoCard provider={noNameProvider} />);

      expect(screen.getByText('Proveedor')).toBeInTheDocument();
    });
  });

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  describe('Profile image', () => {
    it('renders ProfileImage component with correct props', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      const profileImage = screen.getByTestId('mock-profile-image');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('data-path', 'public/avatars/juan.jpg');
      expect(profileImage).toHaveAttribute('data-alt', 'Juan Pérez');
      expect(profileImage).toHaveAttribute('data-size', '2xl');
    });

    it('uses fallback name for alt when no full_name', () => {
      const noNameProvider = { ...mockProvider, full_name: undefined };
      render(<ProviderInfoCard provider={noNameProvider} />);

      const profileImage = screen.getByTestId('mock-profile-image');
      expect(profileImage).toHaveAttribute('data-alt', 'Proveedor');
    });
  });

  // ============================================================
  // RATING
  // ============================================================

  describe('Rating', () => {
    it('displays star rating when available', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      // Rating value should be displayed
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('displays reviews count when available', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      expect(screen.getByText('(128)')).toBeInTheDocument();
    });

    it('hides rating when not available', () => {
      const noRatingProvider = { ...mockProvider, rating: undefined };
      render(<ProviderInfoCard provider={noRatingProvider} />);

      expect(screen.queryByText('4.5')).not.toBeInTheDocument();
    });

    it('hides rating when rating is 0', () => {
      const zeroRatingProvider = { ...mockProvider, rating: 0 };
      render(<ProviderInfoCard provider={zeroRatingProvider} />);

      expect(screen.queryByText('0.0')).not.toBeInTheDocument();
    });

    it('renders 5 stars total', () => {
      const { container } = render(<ProviderInfoCard provider={mockProvider} />);

      // Find the rating container that has the stars
      const ratingStars = container.querySelectorAll('.flex.gap-0\\.5 svg');
      expect(ratingStars).toHaveLength(5);
    });
  });

  // ============================================================
  // RESPONSE TIME
  // ============================================================

  describe('Response time', () => {
    it('displays response time when available', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      expect(screen.getByText(/Responde en 2 hours/)).toBeInTheDocument();
    });

    it('hides response time when not available', () => {
      const noResponseTimeProvider = { ...mockProvider, response_time: undefined };
      render(<ProviderInfoCard provider={noResponseTimeProvider} />);

      expect(screen.queryByText(/Responde en/)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // CONTACT BUTTON
  // ============================================================

  describe('Contact button', () => {
    it('renders enabled contact button when onContactClick provided', () => {
      render(<ProviderInfoCard provider={mockProvider} onContactClick={mockOnContactClick} />);

      const button = screen.getByRole('button', { name: /Enviar mensaje/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('calls onContactClick when enabled button is clicked', () => {
      render(<ProviderInfoCard provider={mockProvider} onContactClick={mockOnContactClick} />);

      const button = screen.getByRole('button', { name: /Enviar mensaje/i });
      fireEvent.click(button);

      expect(mockOnContactClick).toHaveBeenCalledTimes(1);
    });

    it('renders disabled button when onContactClick not provided', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      const button = screen.getByRole('button', { name: /Chat \(próximamente\)/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('has correct styling for enabled button', () => {
      render(<ProviderInfoCard provider={mockProvider} onContactClick={mockOnContactClick} />);

      const button = screen.getByRole('button', { name: /Enviar mensaje/i });
      expect(button).toHaveClass('bg-blue-600');
      expect(button).toHaveClass('text-white');
    });

    it('has correct styling for disabled button', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      const button = screen.getByRole('button', { name: /Chat \(próximamente\)/i });
      expect(button).toHaveClass('bg-gray-100');
      expect(button).toHaveClass('text-gray-400');
      expect(button).toHaveClass('cursor-not-allowed');
    });
  });

  // ============================================================
  // PROFILE LINK
  // ============================================================

  describe('Profile link', () => {
    it('renders profile link with correct href', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      const link = screen.getByRole('link', { name: /Ver perfil del proveedor/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/provider/provider-123');
    });

    it('displays "Ver perfil del proveedor" text', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      expect(screen.getByText('Ver perfil del proveedor')).toBeInTheDocument();
    });
  });

  // ============================================================
  // VERIFIED BADGE
  // ============================================================

  describe('Verified badge', () => {
    it('displays verified badge', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      expect(screen.getByText('Proveedor Verificado')).toBeInTheDocument();
    });

    it('displays verified description', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      expect(screen.getByText('Este proveedor ha sido verificado por YAAN')).toBeInTheDocument();
    });

    it('has green background styling', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      const verifiedBadge = screen.getByText('Proveedor Verificado').closest('.bg-green-50');
      expect(verifiedBadge).toBeInTheDocument();
    });
  });

  // ============================================================
  // SUPPORT INFO
  // ============================================================

  describe('Support info', () => {
    it('displays support heading', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      expect(screen.getByText('¿Necesitas ayuda?')).toBeInTheDocument();
    });

    it('displays support description', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      expect(screen.getByText('Contacta al proveedor para dudas sobre tu reservación')).toBeInTheDocument();
    });

    it('has blue background styling', () => {
      render(<ProviderInfoCard provider={mockProvider} />);

      const supportSection = screen.getByText('¿Necesitas ayuda?').closest('.bg-blue-50');
      expect(supportSection).toBeInTheDocument();
    });
  });

  // ============================================================
  // STRUCTURAL ELEMENTS
  // ============================================================

  describe('Structural elements', () => {
    it('has correct card styling', () => {
      const { container } = render(<ProviderInfoCard provider={mockProvider} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('shadow-sm');
    });
  });
});
