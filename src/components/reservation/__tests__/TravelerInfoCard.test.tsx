/**
 * Unit tests for TravelerInfoCard component
 *
 * Tests the traveler info card display:
 * - Header title and total travelers
 * - Edit button (enabled/disabled states)
 * - Traveler distribution (adults, kids, babys)
 * - Completeness indicator (progress bar, count, colors)
 * - Companions list (empty state, cards, expandable details)
 * - Age calculation
 * - Birthday formatting
 * - Gender labels
 * - Warning message for incomplete data
 *
 * @see src/components/reservation/TravelerInfoCard.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import TravelerInfoCard from '../TravelerInfoCard';

describe('TravelerInfoCard', () => {
  const mockCompanions = [
    {
      name: 'Juan',
      family_name: 'Pérez',
      birthday: '1990-06-15T12:00:00.000Z',
      country: 'México',
      gender: 'male',
      passport_number: 'ABC123456',
    },
    {
      name: 'María',
      family_name: 'García',
      birthday: '1992-03-20T12:00:00.000Z',
      country: 'México',
      gender: 'female',
      passport_number: 'DEF789012',
    },
    {
      name: 'Pedrito',
      family_name: 'Pérez',
      birthday: '2015-09-10T12:00:00.000Z',
      country: 'México',
      gender: 'male',
      passport_number: 'GHI345678',
    },
  ];

  const mockReservation = {
    id: 'reservation-123',
    adults: 2,
    kids: 1,
    babys: 0,
    companions: mockCompanions,
  };

  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // HEADER
  // ============================================================

  describe('Header', () => {
    it('displays "Información de Viajeros" title', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      expect(screen.getByText('Información de Viajeros')).toBeInTheDocument();
    });

    it('displays total travelers count with plural', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      expect(screen.getByText('3 viajeros en total')).toBeInTheDocument();
    });

    it('displays singular form for 1 traveler', () => {
      const singleTravelerReservation = { ...mockReservation, adults: 1, kids: 0, babys: 0, companions: [mockCompanions[0]] };
      render(<TravelerInfoCard reservation={singleTravelerReservation} />);

      expect(screen.getByText('1 viajero en total')).toBeInTheDocument();
    });
  });

  // ============================================================
  // EDIT BUTTON
  // ============================================================

  describe('Edit button', () => {
    it('renders enabled edit button when onEdit provided', () => {
      render(<TravelerInfoCard reservation={mockReservation} onEdit={mockOnEdit} />);

      const button = screen.getByRole('button', { name: /Editar/i });
      expect(button).not.toBeDisabled();
    });

    it('calls onEdit when enabled button is clicked', () => {
      render(<TravelerInfoCard reservation={mockReservation} onEdit={mockOnEdit} />);

      const button = screen.getByRole('button', { name: /Editar/i });
      fireEvent.click(button);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('renders disabled edit button when onEdit not provided', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      const button = screen.getByRole('button', { name: /Editar/i });
      expect(button).toBeDisabled();
    });

    it('has correct styling for enabled button', () => {
      render(<TravelerInfoCard reservation={mockReservation} onEdit={mockOnEdit} />);

      const button = screen.getByRole('button', { name: /Editar/i });
      expect(button).toHaveClass('text-blue-700');
      expect(button).toHaveClass('bg-blue-50');
    });

    it('has correct styling for disabled button', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      const button = screen.getByRole('button', { name: /Editar/i });
      expect(button).toHaveClass('text-gray-400');
      expect(button).toHaveClass('bg-gray-100');
      expect(button).toHaveClass('cursor-not-allowed');
    });
  });

  // ============================================================
  // TRAVELER DISTRIBUTION
  // ============================================================

  describe('Traveler distribution', () => {
    it('displays adults count and label', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Adultos')).toBeInTheDocument();
    });

    it('displays kids count and label', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Niño')).toBeInTheDocument();
    });

    it('displays singular "Adulto" for 1 adult', () => {
      const singleAdultReservation = { ...mockReservation, adults: 1, kids: 0, babys: 0 };
      render(<TravelerInfoCard reservation={singleAdultReservation} />);

      expect(screen.getByText('Adulto')).toBeInTheDocument();
    });

    it('displays plural "Niños" for multiple kids', () => {
      const multipleKidsReservation = { ...mockReservation, kids: 2 };
      render(<TravelerInfoCard reservation={multipleKidsReservation} />);

      expect(screen.getByText('Niños')).toBeInTheDocument();
    });

    it('displays babys count and label when present', () => {
      const withBabysReservation = { ...mockReservation, babys: 1 };
      render(<TravelerInfoCard reservation={withBabysReservation} />);

      expect(screen.getByText('Bebé')).toBeInTheDocument();
    });

    it('hides category when count is 0', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      // babys is 0, so Bebé/Bebés should not appear
      expect(screen.queryByText('Bebé')).not.toBeInTheDocument();
      expect(screen.queryByText('Bebés')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // COMPLETENESS INDICATOR
  // ============================================================

  describe('Completeness indicator', () => {
    it('displays completeness count', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('displays "Datos completados" label', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      expect(screen.getByText('Datos completados')).toBeInTheDocument();
    });

    it('shows green text for 100% completeness', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      const countText = screen.getByText('3 / 3');
      expect(countText).toHaveClass('text-green-600');
    });

    it('shows yellow text for 50-99% completeness', () => {
      const incompleteReservation = {
        ...mockReservation,
        companions: [mockCompanions[0], mockCompanions[1]], // 2 of 3
      };
      render(<TravelerInfoCard reservation={incompleteReservation} />);

      const countText = screen.getByText('2 / 3');
      expect(countText).toHaveClass('text-yellow-600');
    });

    it('shows red text for <50% completeness', () => {
      const veryIncompleteReservation = {
        ...mockReservation,
        adults: 4,
        companions: [mockCompanions[0]], // 1 of 5
      };
      render(<TravelerInfoCard reservation={veryIncompleteReservation} />);

      const countText = screen.getByText('1 / 5');
      expect(countText).toHaveClass('text-red-600');
    });
  });

  // ============================================================
  // EMPTY STATE
  // ============================================================

  describe('Empty state', () => {
    it('shows empty state message when no companions', () => {
      const noCompanionsReservation = { ...mockReservation, companions: undefined };
      render(<TravelerInfoCard reservation={noCompanionsReservation} />);

      expect(screen.getByText('Aún no se han capturado los datos de los viajeros')).toBeInTheDocument();
    });

    it('shows empty state for empty companions array', () => {
      const emptyCompanionsReservation = { ...mockReservation, companions: [] };
      render(<TravelerInfoCard reservation={emptyCompanionsReservation} />);

      expect(screen.getByText('Aún no se han capturado los datos de los viajeros')).toBeInTheDocument();
    });

    it('shows deadline information in empty state', () => {
      const noCompanionsReservation = { ...mockReservation, companions: undefined };
      render(<TravelerInfoCard reservation={noCompanionsReservation} />);

      expect(screen.getByText('La información será requerida antes de la fecha límite de pago')).toBeInTheDocument();
    });
  });

  // ============================================================
  // COMPANIONS LIST
  // ============================================================

  describe('Companions list', () => {
    it('displays companion name', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    it('displays companion avatar with initials', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      expect(screen.getByText('JP')).toBeInTheDocument(); // Juan Pérez
      expect(screen.getByText('MG')).toBeInTheDocument(); // María García
    });

    it('displays companion age', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      // Ages will vary based on current date, so just check the "años" suffix
      const ageTexts = screen.getAllByText(/\d+ años/);
      expect(ageTexts.length).toBe(3);
    });
  });

  // ============================================================
  // EXPANDABLE DETAILS
  // ============================================================

  describe('Expandable details', () => {
    it('expands companion details on click', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      // Click to expand Juan Pérez
      const juanButton = screen.getByText('Juan Pérez').closest('button');
      if (juanButton) {
        fireEvent.click(juanButton);
      }

      // Should now show expanded details
      expect(screen.getByText('Fecha de Nacimiento')).toBeInTheDocument();
      expect(screen.getByText('Género')).toBeInTheDocument();
      expect(screen.getByText('País')).toBeInTheDocument();
      expect(screen.getByText('Pasaporte')).toBeInTheDocument();
    });

    it('displays formatted birthday in expanded view', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      const juanButton = screen.getByText('Juan Pérez').closest('button');
      if (juanButton) {
        fireEvent.click(juanButton);
      }

      // Check for Spanish formatted date
      expect(screen.getByText(/15 de junio de 1990/i)).toBeInTheDocument();
    });

    it('displays gender label in Spanish', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      const juanButton = screen.getByText('Juan Pérez').closest('button');
      if (juanButton) {
        fireEvent.click(juanButton);
      }

      expect(screen.getByText('Masculino')).toBeInTheDocument();
    });

    it('displays female gender label in Spanish', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      const mariaButton = screen.getByText('María García').closest('button');
      if (mariaButton) {
        fireEvent.click(mariaButton);
      }

      expect(screen.getByText('Femenino')).toBeInTheDocument();
    });

    it('displays country', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      const juanButton = screen.getByText('Juan Pérez').closest('button');
      if (juanButton) {
        fireEvent.click(juanButton);
      }

      expect(screen.getByText('México')).toBeInTheDocument();
    });

    it('displays passport number', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      const juanButton = screen.getByText('Juan Pérez').closest('button');
      if (juanButton) {
        fireEvent.click(juanButton);
      }

      expect(screen.getByText('ABC123456')).toBeInTheDocument();
    });

    it('collapses details when clicked again', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      const juanButton = screen.getByText('Juan Pérez').closest('button');
      if (juanButton) {
        fireEvent.click(juanButton); // Expand
        fireEvent.click(juanButton); // Collapse
      }

      // Details should be hidden
      expect(screen.queryByText('Fecha de Nacimiento')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // WARNING MESSAGE
  // ============================================================

  describe('Warning message', () => {
    it('shows warning when companions are incomplete', () => {
      const incompleteReservation = {
        ...mockReservation,
        companions: [mockCompanions[0]], // Only 1 of 3
      };
      render(<TravelerInfoCard reservation={incompleteReservation} />);

      expect(screen.getByText(/Faltan datos de 2 viajeros/)).toBeInTheDocument();
    });

    it('shows singular form for 1 missing traveler', () => {
      const almostCompleteReservation = {
        ...mockReservation,
        companions: [mockCompanions[0], mockCompanions[1]], // 2 of 3
      };
      render(<TravelerInfoCard reservation={almostCompleteReservation} />);

      expect(screen.getByText(/Faltan datos de 1 viajero$/)).toBeInTheDocument();
    });

    it('shows deadline reminder in warning', () => {
      const incompleteReservation = {
        ...mockReservation,
        companions: [mockCompanions[0]],
      };
      render(<TravelerInfoCard reservation={incompleteReservation} />);

      expect(screen.getByText('Completa la información antes de la fecha límite de pago')).toBeInTheDocument();
    });

    it('hides warning when all companions are complete', () => {
      render(<TravelerInfoCard reservation={mockReservation} />);

      expect(screen.queryByText(/Faltan datos de/)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // STRUCTURAL ELEMENTS
  // ============================================================

  describe('Structural elements', () => {
    it('has correct card styling', () => {
      const { container } = render(<TravelerInfoCard reservation={mockReservation} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('shadow-sm');
    });
  });
});
