/**
 * Unit tests for ReviewCompanionsStep component
 *
 * Tests the companions review step:
 * - Info banner display
 * - Summary stats with age grouping
 * - Pluralization (Adulto/Adultos, etc)
 * - Companion cards display
 * - Avatar initials
 * - Formatted birthday dates
 * - Country with flag emoji
 * - Confirmation message
 *
 * @see src/components/reservation/ReviewCompanionsStep.tsx
 */

import { render, screen } from '@testing-library/react';
import ReviewCompanionsStep from '../ReviewCompanionsStep';

// Mock companion-schemas module
jest.mock('@/lib/validations/companion-schemas', () => ({
  getCountryName: jest.fn((code: string) => {
    const countries: Record<string, string> = {
      MX: 'México',
      US: 'Estados Unidos',
      CA: 'Canadá',
      GB: 'Reino Unido'
    };
    return countries[code] || code;
  }),
  getGenderLabel: jest.fn((gender: string) => {
    const labels: Record<string, string> = {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Otro'
    };
    return labels[gender.toLowerCase()] || gender;
  }),
  getCompanionTypeLabel: jest.fn((birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age >= 18) return `Adulto (${age} años)`;
    if (age >= 2) return `Niño (${age} años)`;
    return `Bebé (${age} meses)`;
  })
}));

describe('ReviewCompanionsStep', () => {
  // Helper to create a birthday that results in a specific age
  const createBirthdayForAge = (age: number): string => {
    const today = new Date();
    return `${today.getFullYear() - age}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const mockReservation = {
    id: 'reservation-123',
    adults: 2,
    kids: 1,
    babys: 0
  };

  const mockAdultCompanion = {
    name: 'Juan',
    family_name: 'Pérez',
    birthday: '1990-06-15',
    gender: 'male',
    country: 'MX',
    passport_number: 'G12345678'
  };

  const mockKidCompanion = {
    name: 'María',
    family_name: 'García',
    birthday: createBirthdayForAge(10),
    gender: 'female',
    country: 'US',
    passport_number: '123456789'
  };

  const mockBabyCompanion = {
    name: 'Bebé',
    family_name: 'López',
    birthday: createBirthdayForAge(1),
    gender: 'other',
    country: 'CA',
    passport_number: 'AB123456'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // INFO BANNER
  // ============================================================

  describe('Info banner', () => {
    it('renders info banner with review message', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('Revisa la información antes de guardar')).toBeInTheDocument();
    });

    it('shows passport verification reminder', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText(/Asegúrate de que todos los datos sean correctos/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // SUMMARY STATS
  // ============================================================

  describe('Summary stats', () => {
    it('displays correct adults count', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion, { ...mockAdultCompanion, name: 'Pedro' }]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Adultos')).toBeInTheDocument();
    });

    it('displays singular "Adulto" for 1 adult', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Adulto')).toBeInTheDocument();
    });

    it('displays correct kids count', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockKidCompanion, { ...mockKidCompanion, name: 'Ana' }]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Niños')).toBeInTheDocument();
    });

    it('displays singular "Niño" for 1 kid', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockKidCompanion]}
          reservation={mockReservation}
        />
      );

      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Niño')).toBeInTheDocument();
    });

    it('displays correct babys count', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockBabyCompanion, { ...mockBabyCompanion, name: 'Bebe2' }]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Bebés')).toBeInTheDocument();
    });

    it('displays zero counts correctly', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(2); // kids and babys
    });

    it('groups mixed companions correctly', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion, mockKidCompanion, mockBabyCompanion]}
          reservation={mockReservation}
        />
      );

      // Should show 1 adult, 1 kid, 1 baby
      const ones = screen.getAllByText('1');
      expect(ones.length).toBe(3);
    });
  });

  // ============================================================
  // COMPANIONS LIST
  // ============================================================

  describe('Companions list', () => {
    it('renders "Información de Viajeros" heading', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('Información de Viajeros')).toBeInTheDocument();
    });

    it('renders a card for each companion', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion, mockKidCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
  });

  // ============================================================
  // AVATAR
  // ============================================================

  describe('Avatar', () => {
    it('displays initials from name and family name', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('JP')).toBeInTheDocument(); // Juan Pérez
    });

    it('displays different initials for different companions', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion, mockKidCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('JP')).toBeInTheDocument(); // Juan Pérez
      expect(screen.getByText('MG')).toBeInTheDocument(); // María García
    });
  });

  // ============================================================
  // COMPANION DETAILS
  // ============================================================

  describe('Companion details', () => {
    it('displays full name', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('displays companion type label', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText(/Adulto \(\d+ años\)/)).toBeInTheDocument();
    });

    it('displays "Fecha de Nacimiento" label', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('Fecha de Nacimiento')).toBeInTheDocument();
    });

    it('displays formatted birthday', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      // Should display formatted date (Spanish locale) - allow for timezone variations
      expect(screen.getByText(/\d+ de junio de 1990/i)).toBeInTheDocument();
    });

    it('displays "Género" label', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('Género')).toBeInTheDocument();
    });

    it('displays gender label in Spanish', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('Masculino')).toBeInTheDocument();
    });

    it('displays "País de Pasaporte" label', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('País de Pasaporte')).toBeInTheDocument();
    });

    it('displays country name', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('México')).toBeInTheDocument();
    });

    it('displays flag emoji for country', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      // MX flag emoji
      expect(screen.getByText('🇲🇽')).toBeInTheDocument();
    });

    it('displays "Número de Pasaporte" label', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('Número de Pasaporte')).toBeInTheDocument();
    });

    it('displays passport number', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('G12345678')).toBeInTheDocument();
    });
  });

  // ============================================================
  // FLAG EMOJI
  // ============================================================

  describe('Flag emoji', () => {
    it('displays US flag for US country', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockKidCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    });

    it('displays CA flag for Canada', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockBabyCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('🇨🇦')).toBeInTheDocument();
    });
  });

  // ============================================================
  // CONFIRMATION MESSAGE
  // ============================================================

  describe('Confirmation message', () => {
    it('displays success message', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText('¡Todos los datos están completos!')).toBeInTheDocument();
    });

    it('displays save instruction', () => {
      render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      expect(screen.getByText(/Haz clic en "Guardar Cambios"/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // STRUCTURAL ELEMENTS
  // ============================================================

  describe('Structural elements', () => {
    it('has correct summary stats grid', () => {
      const { container } = render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      const grid = container.querySelector('.grid.grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('renders companion card with correct structure', () => {
      const { container } = render(
        <ReviewCompanionsStep
          companions={[mockAdultCompanion]}
          reservation={mockReservation}
        />
      );

      // Should have border and padding
      const card = container.querySelector('.border-2.border-gray-200.rounded-lg');
      expect(card).toBeInTheDocument();
    });
  });
});
