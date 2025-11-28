/**
 * Unit tests for ReservationCard component
 *
 * Tests the reservation card display:
 * - Product type badge (circuit/package)
 * - Reservation ID display (truncated)
 * - Date formatting (es-MX locale)
 * - Status badge (confirmed, pending, cancelled, completed)
 * - Travelers count calculation
 * - Price display with currency
 * - Companions data status
 * - Payment method label
 * - Click handler
 *
 * @see src/components/reservation/ReservationCard.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ReservationCard from '../ReservationCard';

describe('ReservationCard', () => {
  const mockReservation = {
    id: 'abc12345-6789-0123-4567-890123456789',
    experience_id: 'exp-123',
    experience_type: 'circuit',
    user_id: 'user-123',
    adults: 2,
    kids: 1,
    babys: 0,
    companions: [
      { name: 'John', family_name: 'Doe', birthday: '1990-01-01', country: 'MX', gender: 'male', passport_number: 'ABC123' },
      { name: 'Jane', family_name: 'Doe', birthday: '1992-05-15', country: 'MX', gender: 'female', passport_number: 'DEF456' },
      { name: 'Kid', family_name: 'Doe', birthday: '2015-08-20', country: 'MX', gender: 'male', passport_number: 'GHI789' },
    ],
    reservation_date: '2025-12-25T00:00:00.000Z',
    status: 'confirmed',
    price_per_person: 5000,
    total_price: 15000,
    currency: 'MXN',
    payment_method: 'CONTADO',
  };

  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // PRODUCT TYPE BADGE
  // ============================================================

  describe('Product type badge', () => {
    it('displays "Circuito" for circuit type', () => {
      render(<ReservationCard reservation={mockReservation} />);

      expect(screen.getByText('Circuito')).toBeInTheDocument();
    });

    it('displays "Paquete" for package type', () => {
      const packageReservation = { ...mockReservation, experience_type: 'package' };
      render(<ReservationCard reservation={packageReservation} />);

      expect(screen.getByText('Paquete')).toBeInTheDocument();
    });

    it('displays "Paquete" for undefined experience type', () => {
      const noTypeReservation = { ...mockReservation, experience_type: undefined };
      render(<ReservationCard reservation={noTypeReservation} />);

      expect(screen.getByText('Paquete')).toBeInTheDocument();
    });
  });

  // ============================================================
  // RESERVATION ID
  // ============================================================

  describe('Reservation ID', () => {
    it('displays truncated reservation ID (first 8 chars)', () => {
      render(<ReservationCard reservation={mockReservation} />);

      expect(screen.getByText('Reservación #abc12345')).toBeInTheDocument();
    });

    it('handles short IDs gracefully', () => {
      const shortIdReservation = { ...mockReservation, id: 'short' };
      render(<ReservationCard reservation={shortIdReservation} />);

      expect(screen.getByText('Reservación #short')).toBeInTheDocument();
    });
  });

  // ============================================================
  // DATE FORMATTING
  // ============================================================

  describe('Date formatting', () => {
    it('formats date in Spanish locale', () => {
      // Use noon UTC to avoid timezone rollover issues
      const noonReservation = { ...mockReservation, reservation_date: '2025-12-25T12:00:00.000Z' };
      render(<ReservationCard reservation={noonReservation} />);

      // December 25, 2025 in Spanish
      expect(screen.getByText(/25 de diciembre de 2025/i)).toBeInTheDocument();
    });

    it('handles different date formats', () => {
      // Use noon UTC to avoid timezone rollover issues
      const differentDateReservation = { ...mockReservation, reservation_date: '2025-06-15T12:00:00.000Z' };
      render(<ReservationCard reservation={differentDateReservation} />);

      expect(screen.getByText(/15 de junio de 2025/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // STATUS BADGE
  // ============================================================

  describe('Status badge', () => {
    it('renders confirmed status with green styling', () => {
      render(<ReservationCard reservation={mockReservation} />);

      const badge = screen.getByText('Confirmada');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-green-800');
      expect(badge).toHaveClass('bg-green-100');
    });

    it('renders pending status with yellow styling', () => {
      const pendingReservation = { ...mockReservation, status: 'pending' };
      render(<ReservationCard reservation={pendingReservation} />);

      const badge = screen.getByText('Pendiente');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-yellow-800');
      expect(badge).toHaveClass('bg-yellow-100');
    });

    it('renders cancelled status with red styling', () => {
      const cancelledReservation = { ...mockReservation, status: 'cancelled' };
      render(<ReservationCard reservation={cancelledReservation} />);

      const badge = screen.getByText('Cancelada');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-red-800');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('renders completed status with blue styling', () => {
      const completedReservation = { ...mockReservation, status: 'completed' };
      render(<ReservationCard reservation={completedReservation} />);

      const badge = screen.getByText('Completada');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-blue-800');
      expect(badge).toHaveClass('bg-blue-100');
    });

    it('renders unknown status with gray styling', () => {
      const unknownReservation = { ...mockReservation, status: 'custom_status' };
      render(<ReservationCard reservation={unknownReservation} />);

      const badge = screen.getByText('custom_status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-gray-800');
      expect(badge).toHaveClass('bg-gray-100');
    });

    it('handles case insensitive status', () => {
      const upperCaseReservation = { ...mockReservation, status: 'CONFIRMED' };
      render(<ReservationCard reservation={upperCaseReservation} />);

      expect(screen.getByText('Confirmada')).toBeInTheDocument();
    });
  });

  // ============================================================
  // TRAVELERS COUNT
  // ============================================================

  describe('Travelers count', () => {
    it('displays total travelers (adults + kids + babys)', () => {
      render(<ReservationCard reservation={mockReservation} />);

      // 2 adults + 1 kid + 0 babys = 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays "Viajeros" label', () => {
      render(<ReservationCard reservation={mockReservation} />);

      expect(screen.getByText('Viajeros')).toBeInTheDocument();
    });

    it('calculates correctly with all traveler types', () => {
      const allTypesReservation = { ...mockReservation, adults: 2, kids: 2, babys: 1 };
      render(<ReservationCard reservation={allTypesReservation} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  // ============================================================
  // PRICE DISPLAY
  // ============================================================

  describe('Price display', () => {
    it('displays formatted total price with currency', () => {
      render(<ReservationCard reservation={mockReservation} />);

      expect(screen.getByText('$15,000 MXN')).toBeInTheDocument();
    });

    it('displays "Total" label', () => {
      render(<ReservationCard reservation={mockReservation} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('handles different currencies', () => {
      const usdReservation = { ...mockReservation, total_price: 1000, currency: 'USD' };
      render(<ReservationCard reservation={usdReservation} />);

      expect(screen.getByText('$1,000 USD')).toBeInTheDocument();
    });

    it('handles large amounts', () => {
      const largeAmountReservation = { ...mockReservation, total_price: 1500000 };
      render(<ReservationCard reservation={largeAmountReservation} />);

      expect(screen.getByText('$1,500,000 MXN')).toBeInTheDocument();
    });
  });

  // ============================================================
  // COMPANIONS DATA STATUS
  // ============================================================

  describe('Companions data status', () => {
    it('shows "Completo" when companions match total travelers', () => {
      render(<ReservationCard reservation={mockReservation} />);

      expect(screen.getByText('Completo')).toBeInTheDocument();
    });

    it('shows "Pendiente" when companions are incomplete', () => {
      const incompleteReservation = {
        ...mockReservation,
        companions: [
          { name: 'John', family_name: 'Doe', birthday: '1990-01-01', country: 'MX', gender: 'male', passport_number: 'ABC123' },
        ], // Only 1 companion but 3 travelers
      };
      render(<ReservationCard reservation={incompleteReservation} />);

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('shows "Pendiente" when no companions data', () => {
      const noCompanionsReservation = { ...mockReservation, companions: undefined };
      render(<ReservationCard reservation={noCompanionsReservation} />);

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('shows "Pendiente" when companions array is empty', () => {
      const emptyCompanionsReservation = { ...mockReservation, companions: [] };
      render(<ReservationCard reservation={emptyCompanionsReservation} />);

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('displays "Datos" label', () => {
      render(<ReservationCard reservation={mockReservation} />);

      expect(screen.getByText('Datos')).toBeInTheDocument();
    });
  });

  // ============================================================
  // PAYMENT METHOD
  // ============================================================

  describe('Payment method', () => {
    it('displays "Pago único" for CONTADO', () => {
      render(<ReservationCard reservation={mockReservation} />);

      expect(screen.getByText('Pago único')).toBeInTheDocument();
    });

    it('displays "Pago a plazos" for PLAZOS', () => {
      const plazosReservation = { ...mockReservation, payment_method: 'PLAZOS' };
      render(<ReservationCard reservation={plazosReservation} />);

      expect(screen.getByText('Pago a plazos')).toBeInTheDocument();
    });

    it('displays "Pago a plazos" for undefined payment method', () => {
      const noPaymentMethodReservation = { ...mockReservation, payment_method: undefined };
      render(<ReservationCard reservation={noPaymentMethodReservation} />);

      expect(screen.getByText('Pago a plazos')).toBeInTheDocument();
    });
  });

  // ============================================================
  // CLICK HANDLER
  // ============================================================

  describe('Click handler', () => {
    it('calls onClick when card is clicked', () => {
      render(<ReservationCard reservation={mockReservation} onClick={mockOnClick} />);

      const card = screen.getByText('Reservación #abc12345').closest('div')?.closest('div');
      if (card) {
        fireEvent.click(card);
      }

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('renders without onClick prop', () => {
      expect(() => render(<ReservationCard reservation={mockReservation} />)).not.toThrow();
    });
  });

  // ============================================================
  // ACTION HINT
  // ============================================================

  describe('Action hint', () => {
    it('displays "Ver detalles" text', () => {
      render(<ReservationCard reservation={mockReservation} />);

      expect(screen.getByText('Ver detalles')).toBeInTheDocument();
    });
  });

  // ============================================================
  // STRUCTURAL ELEMENTS
  // ============================================================

  describe('Structural elements', () => {
    it('has correct styling classes', () => {
      const { container } = render(<ReservationCard reservation={mockReservation} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('shadow-sm');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('has hover effects', () => {
      const { container } = render(<ReservationCard reservation={mockReservation} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:shadow-md');
      expect(card).toHaveClass('hover:border-blue-300');
    });
  });
});
