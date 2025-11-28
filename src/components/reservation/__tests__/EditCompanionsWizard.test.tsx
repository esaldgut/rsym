/**
 * Unit tests for EditCompanionsWizard component
 *
 * Tests the multi-step wizard for editing traveler information:
 * - Header and progress bar
 * - Step navigation (edit → review → completed)
 * - Form validation and submission
 * - Loading states
 * - Cancel confirmation with unsaved changes
 *
 * @see src/components/reservation/EditCompanionsWizard.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditCompanionsWizard from '../EditCompanionsWizard';

// Mock next/navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: mockRefresh,
    back: jest.fn()
  })
}));

// Mock @hookform/resolvers/zod to avoid Zod schema validation in tests
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => () => ({ values: {}, errors: {} })
}));

// Mock companion-schemas module
jest.mock('@/lib/validations/companion-schemas', () => ({
  companionsArraySchema: {},
  companionSchema: {},
  getCountryName: jest.fn((code: string) => code),
  getGenderLabel: jest.fn((gender: string) => gender),
  getCompanionTypeLabel: jest.fn(() => 'Adulto (30 años)')
}));

// Mock server action
const mockUpdateCompanionsAction = jest.fn();
jest.mock('@/lib/server/reservation-actions', () => ({
  updateCompanionsAction: (...args: unknown[]) => mockUpdateCompanionsAction(...args)
}));

// Mock child components
jest.mock('../CompanionFormCard', () => ({
  __esModule: true,
  default: function MockCompanionFormCard({ index }: { index: number }) {
    return (
      <div data-testid={`companion-form-card-${index}`}>
        CompanionFormCard {index + 1}
      </div>
    );
  }
}));

jest.mock('../ReviewCompanionsStep', () => ({
  __esModule: true,
  default: function MockReviewCompanionsStep({
    companions,
    reservation
  }: {
    companions: Array<{ name: string }>;
    reservation: { id: string };
  }) {
    return (
      <div data-testid="review-companions-step">
        ReviewCompanionsStep - {companions.length} companions for {reservation.id}
      </div>
    );
  }
}));

// Mock window.confirm
const mockConfirm = jest.fn(() => true);
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

// Mock window.alert
const mockAlert = jest.fn();
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true
});

// Mock react-hook-form with controllable state
let mockIsValid = true;
let mockIsDirty = false;
let mockWatchValue: Array<{ name: string; family_name: string; birthday: string; country: string; gender: string; passport_number: string }> = [];
let mockHandleSubmitCallback: ((data: { companions: typeof mockWatchValue }) => void) | null = null;

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: (callback: (data: { companions: typeof mockWatchValue }) => void) => {
      mockHandleSubmitCallback = callback;
      return (e?: React.FormEvent) => {
        e?.preventDefault?.();
        callback({ companions: mockWatchValue });
      };
    },
    watch: jest.fn(() => mockWatchValue),
    formState: {
      errors: {},
      isValid: mockIsValid,
      isDirty: mockIsDirty,
      isSubmitting: false
    },
    setValue: jest.fn(),
    getValues: jest.fn(() => ({ companions: mockWatchValue })),
    trigger: jest.fn()
  }),
  FormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useFormContext: () => ({
    register: jest.fn(),
    watch: jest.fn(),
    formState: { errors: {} },
    setValue: jest.fn()
  })
}));

describe('EditCompanionsWizard', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const mockReservation = {
    id: 'reservation-123',
    adults: 2,
    kids: 1,
    babys: 0
  };

  const mockReservationWithCompanions = {
    id: 'reservation-456',
    adults: 2,
    kids: 0,
    babys: 0,
    companions: [
      {
        name: 'Juan',
        family_name: 'Pérez',
        birthday: '1990-01-15',
        country: 'MX',
        gender: 'male' as const,
        passport_number: 'G12345678'
      },
      {
        name: 'María',
        family_name: 'García',
        birthday: '1992-06-20',
        country: 'MX',
        gender: 'female' as const,
        passport_number: 'G87654321'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsValid = true;
    mockIsDirty = false;
    mockWatchValue = [
      {
        name: 'Juan',
        family_name: 'Pérez',
        birthday: '1990-01-15',
        country: 'MX',
        gender: 'male',
        passport_number: 'G12345678'
      }
    ];
    mockUpdateCompanionsAction.mockResolvedValue({ success: true });
  });

  // ============================================================
  // HEADER & PROGRESS BAR
  // ============================================================

  describe('Header & Progress bar', () => {
    it('renders modal with title "Editar Información de Viajeros"', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Editar Información de Viajeros')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
    });

    it('renders progress bar at 33% on edit step', () => {
      const { container } = render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      const progressBar = container.querySelector('[style*="width: 33%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('renders step indicators', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('1. Editar')).toBeInTheDocument();
      expect(screen.getByText('2. Revisar')).toBeInTheDocument();
      expect(screen.getByText('3. Completado')).toBeInTheDocument();
    });

    it('highlights current step indicator', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      const editStep = screen.getByText('1. Editar');
      expect(editStep).toHaveClass('text-blue-600', 'font-semibold');
    });
  });

  // ============================================================
  // EDIT STEP
  // ============================================================

  describe('Edit step', () => {
    it('renders info banner with expected total travelers', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Completa los datos de todos los viajeros')).toBeInTheDocument();
      expect(screen.getByText(/Total: 3 viajeros/)).toBeInTheDocument();
    });

    it('shows correct breakdown in info banner', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/2 adultos, 1 niño, 0 bebés/)).toBeInTheDocument();
    });

    it('renders CompanionFormCard for each companion slot', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      // Should render 3 cards (2 adults + 1 kid)
      expect(screen.getByTestId('companion-form-card-0')).toBeInTheDocument();
      expect(screen.getByTestId('companion-form-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('companion-form-card-2')).toBeInTheDocument();
    });

    it('shows "Continuar" button', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Continuar →')).toBeInTheDocument();
    });

    it('shows "Cancelar" button on edit step', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('disables "Continuar" button when form is invalid', () => {
      mockIsValid = false;

      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      const continueButton = screen.getByText('Continuar →');
      expect(continueButton).toBeDisabled();
    });

    it('enables "Continuar" button when form is valid', () => {
      mockIsValid = true;

      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      const continueButton = screen.getByText('Continuar →');
      expect(continueButton).not.toBeDisabled();
    });

    it('uses existing companions data when available', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservationWithCompanions}
          onClose={mockOnClose}
        />
      );

      // Should render 2 cards for 2 existing companions
      expect(screen.getByTestId('companion-form-card-0')).toBeInTheDocument();
      expect(screen.getByTestId('companion-form-card-1')).toBeInTheDocument();
    });
  });

  // ============================================================
  // STEP NAVIGATION
  // ============================================================

  describe('Step navigation', () => {
    it('navigates to review step on "Continuar" click', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));

      expect(screen.getByTestId('review-companions-step')).toBeInTheDocument();
    });

    it('updates progress bar to 66% on review step', () => {
      const { container } = render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));

      const progressBar = container.querySelector('[style*="width: 66%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('highlights review step indicator when on review step', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));

      const reviewStep = screen.getByText('2. Revisar');
      expect(reviewStep).toHaveClass('text-blue-600', 'font-semibold');
    });

    it('shows "← Anterior" button on review step', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));

      expect(screen.getByText('← Anterior')).toBeInTheDocument();
    });

    it('navigates back to edit step from review', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('← Anterior'));

      expect(screen.getByTestId('companion-form-card-0')).toBeInTheDocument();
    });
  });

  // ============================================================
  // REVIEW STEP
  // ============================================================

  describe('Review step', () => {
    it('renders ReviewCompanionsStep with companions data', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));

      expect(screen.getByTestId('review-companions-step')).toBeInTheDocument();
    });

    it('shows "Guardar Cambios" button on review step', () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));

      expect(screen.getByText('Guardar Cambios')).toBeInTheDocument();
    });
  });

  // ============================================================
  // SAVE/LOADING STATES
  // ============================================================

  describe('Save/Loading states', () => {
    it('calls server action on "Guardar Cambios" click', async () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(mockUpdateCompanionsAction).toHaveBeenCalledWith(
          'reservation-123',
          expect.any(Array)
        );
      });
    });

    it('navigates to completed step on success', async () => {
      mockUpdateCompanionsAction.mockResolvedValue({ success: true });

      const { container } = render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(screen.getByText('¡Datos Actualizados!')).toBeInTheDocument();
      });

      // Progress bar should be 100%
      const progressBar = container.querySelector('[style*="width: 100%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('calls router.refresh on success', async () => {
      mockUpdateCompanionsAction.mockResolvedValue({ success: true });

      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('shows error alert on server action failure', async () => {
      mockUpdateCompanionsAction.mockResolvedValue({
        success: false,
        error: 'Error de validación'
      });

      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error al guardar: Error de validación');
      });
    });

    it('shows generic error alert on exception', async () => {
      mockUpdateCompanionsAction.mockRejectedValue(new Error('Network error'));

      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error al guardar los datos. Por favor intenta de nuevo.'
        );
      });
    });
  });

  // ============================================================
  // COMPLETED STEP
  // ============================================================

  describe('Completed step', () => {
    beforeEach(async () => {
      mockUpdateCompanionsAction.mockResolvedValue({ success: true });
    });

    it('shows success icon', async () => {
      const { container } = render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        const successIcon = container.querySelector('.bg-green-100');
        expect(successIcon).toBeInTheDocument();
      });
    });

    it('shows success message "¡Datos Actualizados!"', async () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(screen.getByText('¡Datos Actualizados!')).toBeInTheDocument();
      });
    });

    it('shows success description', async () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(
          screen.getByText('La información de los viajeros ha sido actualizada exitosamente.')
        ).toBeInTheDocument();
      });
    });

    it('shows "Volver a Detalles" button', async () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(screen.getByText('Volver a Detalles')).toBeInTheDocument();
      });
    });

    it('hides footer action buttons on completed step', async () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
        expect(screen.queryByText('← Anterior')).not.toBeInTheDocument();
      });
    });

    it('calls onSuccess and onClose when clicking "Volver a Detalles"', async () => {
      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText('Continuar →'));
      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(screen.getByText('Volver a Detalles')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Volver a Detalles'));

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ============================================================
  // CANCEL/CLOSE
  // ============================================================

  describe('Cancel/Close', () => {
    it('calls onClose when cancelling without changes', () => {
      mockIsDirty = false;

      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Cancelar'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows confirmation dialog when cancelling with unsaved changes', () => {
      mockIsDirty = true;

      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Cancelar'));

      expect(mockConfirm).toHaveBeenCalledWith(
        '¿Estás seguro? Los cambios no guardados se perderán.'
      );
    });

    it('calls onClose when confirmation is accepted', () => {
      mockIsDirty = true;
      mockConfirm.mockReturnValue(true);

      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Cancelar'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not call onClose when confirmation is declined', () => {
      mockIsDirty = true;
      mockConfirm.mockReturnValue(false);

      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Cancelar'));

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('close button (X) triggers cancel with confirmation', () => {
      mockIsDirty = true;

      render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByLabelText('Cerrar'));

      expect(mockConfirm).toHaveBeenCalled();
    });
  });

  // ============================================================
  // SINGULAR/PLURAL LABELS
  // ============================================================

  describe('Singular/plural labels', () => {
    it('shows singular "viajero" for 1 traveler', () => {
      const singleTravelerReservation = {
        id: 'res-1',
        adults: 1,
        kids: 0,
        babys: 0
      };

      render(
        <EditCompanionsWizard
          reservation={singleTravelerReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Total: 1 viajero/)).toBeInTheDocument();
    });

    it('shows singular "adulto" for 1 adult', () => {
      const singleAdultReservation = {
        id: 'res-1',
        adults: 1,
        kids: 2,
        babys: 0
      };

      render(
        <EditCompanionsWizard
          reservation={singleAdultReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/1 adulto/)).toBeInTheDocument();
    });

    it('shows singular "niño" for 1 kid', () => {
      const singleKidReservation = {
        id: 'res-1',
        adults: 2,
        kids: 1,
        babys: 0
      };

      render(
        <EditCompanionsWizard
          reservation={singleKidReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/1 niño/)).toBeInTheDocument();
    });

    it('shows singular "bebé" for 1 baby', () => {
      const singleBabyReservation = {
        id: 'res-1',
        adults: 1,
        kids: 0,
        babys: 1
      };

      render(
        <EditCompanionsWizard
          reservation={singleBabyReservation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/1 bebé/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // MODAL STRUCTURE
  // ============================================================

  describe('Modal structure', () => {
    it('renders with fixed position overlay', () => {
      const { container } = render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('renders with z-50 for modal layering', () => {
      const { container } = render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      const overlay = container.querySelector('.z-50');
      expect(overlay).toBeInTheDocument();
    });

    it('renders modal container with max width', () => {
      const { container } = render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      const modal = container.querySelector('.max-w-4xl');
      expect(modal).toBeInTheDocument();
    });

    it('has scrollable content area', () => {
      const { container } = render(
        <EditCompanionsWizard
          reservation={mockReservation}
          onClose={mockOnClose}
        />
      );

      const scrollArea = container.querySelector('.overflow-y-auto');
      expect(scrollArea).toBeInTheDocument();
    });
  });
});
