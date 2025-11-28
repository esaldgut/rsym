/**
 * Unit tests for CompanionFormCard component
 *
 * Tests the individual companion form card:
 * - Form field rendering and labels
 * - Validation error display
 * - Companion type label from birthday
 * - Completion status indicator
 * - Country-specific passport hints
 * - Gender and country select options
 *
 * @see src/components/reservation/CompanionFormCard.tsx
 */

import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import CompanionFormCard from '../CompanionFormCard';

// Mock companion-schemas module
jest.mock('@/lib/validations/companion-schemas', () => ({
  getPassportHint: jest.fn((country: string) => {
    const hints: Record<string, string> = {
      MX: 'México: 8-10 caracteres alfanuméricos (ej: G12345678)',
      US: 'USA: 9 dígitos numéricos (ej: 123456789)',
      CA: 'Canadá: 2 letras + 6 dígitos (ej: AB123456)',
      DEFAULT: 'Formato general: 6-15 caracteres alfanuméricos'
    };
    return hints[country] || hints.DEFAULT;
  }),
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
  }),
  GENDER_OPTIONS: ['male', 'female', 'other'],
  COUNTRY_CODES: ['MX', 'US', 'CA', 'GB']
}));

// Wrapper component that provides FormProvider
interface WrapperProps {
  children: React.ReactNode;
  defaultValues?: {
    companions: Array<{
      name?: string;
      family_name?: string;
      birthday?: string;
      gender?: string;
      country?: string;
      passport_number?: string;
    }>;
  };
  errors?: Record<string, unknown>;
}

function FormWrapper({ children, defaultValues, errors }: WrapperProps) {
  const methods = useForm({
    defaultValues: defaultValues || {
      companions: [{}]
    }
  });

  // Inject errors if provided
  if (errors) {
    Object.entries(errors).forEach(([key, value]) => {
      methods.setError(key as never, value as never);
    });
  }

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('CompanionFormCard', () => {
  const mockReservation = {
    adults: 2,
    kids: 1,
    babys: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // BASIC RENDERING
  // ============================================================

  describe('Basic rendering', () => {
    it('renders the component', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByText('Viajero #1')).toBeInTheDocument();
    });

    it('renders correct heading for different indices', () => {
      const { rerender } = render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByText('Viajero #1')).toBeInTheDocument();

      rerender(
        <FormWrapper>
          <CompanionFormCard index={2} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByText('Viajero #3')).toBeInTheDocument();
    });

    it('has correct card styling', () => {
      const { container } = render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('border-2');
      expect(card).toHaveClass('rounded-lg');
    });
  });

  // ============================================================
  // FORM FIELDS
  // ============================================================

  describe('Form fields', () => {
    it('renders name input with label', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/Nombre\(s\)/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Juan Carlos')).toBeInTheDocument();
    });

    it('renders family name input with label', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/Apellido\(s\)/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Pérez García')).toBeInTheDocument();
    });

    it('renders birthday input with label', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/Fecha de Nacimiento/i)).toBeInTheDocument();
    });

    it('renders gender select with label', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/Género/i)).toBeInTheDocument();
    });

    it('renders country select with label', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/País de Pasaporte/i)).toBeInTheDocument();
    });

    it('renders passport number input with label', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/Número de Pasaporte/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ABC123456')).toBeInTheDocument();
    });

    it('renders required field indicators', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      // All fields should have * indicator
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBe(6); // 6 required fields
    });
  });

  // ============================================================
  // GENDER SELECT
  // ============================================================

  describe('Gender select', () => {
    it('renders all gender options', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      const genderSelect = screen.getByLabelText(/Género/i);
      expect(genderSelect).toBeInTheDocument();

      // Check options exist
      expect(screen.getByText('Masculino')).toBeInTheDocument();
      expect(screen.getByText('Femenino')).toBeInTheDocument();
      expect(screen.getByText('Otro')).toBeInTheDocument();
    });
  });

  // ============================================================
  // COUNTRY SELECT
  // ============================================================

  describe('Country select', () => {
    it('renders country options', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      const countrySelect = screen.getByLabelText(/País de Pasaporte/i);
      expect(countrySelect).toBeInTheDocument();

      // Check some country options exist
      expect(screen.getByText('México')).toBeInTheDocument();
      expect(screen.getByText('Estados Unidos')).toBeInTheDocument();
    });
  });

  // ============================================================
  // PASSPORT HINT
  // ============================================================

  describe('Passport hint', () => {
    it('shows passport hint for default country (MX)', () => {
      render(
        <FormWrapper defaultValues={{ companions: [{ country: 'MX' }] }}>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByText(/México: 8-10 caracteres/i)).toBeInTheDocument();
    });

    it('shows passport hint for US', () => {
      render(
        <FormWrapper defaultValues={{ companions: [{ country: 'US' }] }}>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByText(/USA: 9 dígitos numéricos/i)).toBeInTheDocument();
    });

    it('shows passport hint for Canada', () => {
      render(
        <FormWrapper defaultValues={{ companions: [{ country: 'CA' }] }}>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByText(/Canadá: 2 letras \+ 6 dígitos/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // COMPANION TYPE LABEL
  // ============================================================

  describe('Companion type label', () => {
    it('shows adult label for 18+ birthday', () => {
      const adultBirthday = '1990-06-15';
      render(
        <FormWrapper defaultValues={{ companions: [{ birthday: adultBirthday }] }}>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByText(/Adulto \(\d+ años\)/)).toBeInTheDocument();
    });

    it('shows kid label for 2-17 birthday', () => {
      // Create a birthday that makes the person 10 years old
      const today = new Date();
      const kidBirthday = `${today.getFullYear() - 10}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      render(
        <FormWrapper defaultValues={{ companions: [{ birthday: kidBirthday }] }}>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByText(/Niño \(\d+ años\)/)).toBeInTheDocument();
    });

    it('does not show type label when no birthday', () => {
      render(
        <FormWrapper defaultValues={{ companions: [{}] }}>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      // Should not have any adult/kid/baby label
      expect(screen.queryByText(/Adulto/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Niño/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Bebé/)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // COMPLETION STATUS
  // ============================================================

  describe('Completion status', () => {
    it('shows "Completo" when valid and has name', () => {
      render(
        <FormWrapper defaultValues={{
          companions: [{
            name: 'Juan',
            family_name: 'Pérez',
            birthday: '1990-01-01',
            gender: 'male',
            country: 'MX',
            passport_number: 'G12345678'
          }]
        }}>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.getByText('Completo')).toBeInTheDocument();
    });

    it('does not show "Completo" when name is empty', () => {
      render(
        <FormWrapper defaultValues={{
          companions: [{
            name: '',
            family_name: 'Pérez'
          }]
        }}>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      expect(screen.queryByText('Completo')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // BIRTHDAY DATE PICKER
  // ============================================================

  describe('Birthday date picker', () => {
    it('has max date set to today', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      const birthdayInput = screen.getByLabelText(/Fecha de Nacimiento/i);
      const today = new Date().toISOString().split('T')[0];
      expect(birthdayInput).toHaveAttribute('max', today);
    });

    it('has type="date"', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      const birthdayInput = screen.getByLabelText(/Fecha de Nacimiento/i);
      expect(birthdayInput).toHaveAttribute('type', 'date');
    });
  });

  // ============================================================
  // PASSPORT INPUT
  // ============================================================

  describe('Passport input', () => {
    it('has uppercase class for auto-formatting', () => {
      render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      const passportInput = screen.getByLabelText(/Número de Pasaporte/i);
      expect(passportInput).toHaveClass('uppercase');
    });
  });

  // ============================================================
  // FORM GRID
  // ============================================================

  describe('Form grid', () => {
    it('renders fields in grid layout', () => {
      const { container } = render(
        <FormWrapper>
          <CompanionFormCard index={0} reservation={mockReservation} />
        </FormWrapper>
      );

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
    });
  });
});
