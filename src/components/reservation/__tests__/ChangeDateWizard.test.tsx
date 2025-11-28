/**
 * Unit tests for ChangeDateWizard component
 *
 * Tests the multi-step wizard for changing reservation date:
 * - Blocking modals (date change not allowed, past deadline)
 * - Header and progress bar
 * - Step navigation (select-date → review → confirm → completed)
 * - Deadline warning banner
 * - Form submission and loading states
 * - Cancel confirmation
 *
 * @see src/components/reservation/ChangeDateWizard.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChangeDateWizard from '../ChangeDateWizard';

// Mock next/navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: mockRefresh,
    back: jest.fn()
  })
}));

// Mock server action
const mockChangeReservationDateAction = jest.fn();
jest.mock('@/lib/server/reservation-actions', () => ({
  changeReservationDateAction: (...args: unknown[]) => mockChangeReservationDateAction(...args)
}));

// Store the callback to simulate date selection
let capturedOnDateSelected: ((data: {
  newDate: string;
  newPricePerPerson: number;
  newTotalPrice: number;
  seasonName?: string;
}) => void) | null = null;
let capturedOnCancel: (() => void) | null = null;

// Mock child components
jest.mock('../SelectNewDateStep', () => ({
  __esModule: true,
  default: function MockSelectNewDateStep({
    onDateSelected,
    onCancel
  }: {
    reservation: { id: string };
    product: { id: string };
    onDateSelected: (data: { newDate: string; newPricePerPerson: number; newTotalPrice: number }) => void;
    onCancel: () => void;
  }) {
    capturedOnDateSelected = onDateSelected;
    capturedOnCancel = onCancel;
    return (
      <div data-testid="select-new-date-step">
        SelectNewDateStep
        <button
          data-testid="select-date-btn"
          onClick={() => onDateSelected({
            newDate: '2025-06-15',
            newPricePerPerson: 5500,
            newTotalPrice: 16500,
            seasonName: 'Verano 2025'
          })}
        >
          Seleccionar Fecha
        </button>
      </div>
    );
  }
}));

let capturedOnBack: (() => void) | null = null;
let capturedOnConfirm: (() => void) | null = null;

jest.mock('../ReviewChangeDateStep', () => ({
  __esModule: true,
  default: function MockReviewChangeDateStep({
    onBack,
    onConfirm
  }: {
    reservation: { id: string };
    paymentPlan: { id: string };
    product: { id: string };
    newDateData: { newDate: string };
    onBack: () => void;
    onConfirm: () => void;
  }) {
    capturedOnBack = onBack;
    capturedOnConfirm = onConfirm;
    return (
      <div data-testid="review-change-date-step">
        ReviewChangeDateStep
        <button data-testid="review-back-btn" onClick={onBack}>Anterior</button>
        <button data-testid="review-confirm-btn" onClick={onConfirm}>Confirmar</button>
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

describe('ChangeDateWizard', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  // Future date for tests (30 days from now)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const futureDateISO = futureDate.toISOString().split('T')[0];

  // Past date for deadline tests
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 10);

  const mockReservation = {
    id: 'reservation-123',
    experience_id: 'exp-456',
    experience_type: 'circuit',
    adults: 2,
    kids: 1,
    babys: 0,
    reservation_date: futureDateISO,
    price_per_person: 5000,
    price_per_kid: 2500,
    total_price: 15000,
    currency: 'MXN'
  };

  const mockPaymentPlan = {
    id: 'plan-789',
    allows_date_change: true,
    change_deadline_days: 15,
    plan_type: 'PLAZOS',
    total_cost: 15000,
    currency: 'MXN',
    installments: [
      { installment_number: 1, amount: 5000, due_date: '2025-01-15', status: 'PAID' },
      { installment_number: 2, amount: 5000, due_date: '2025-02-15', status: 'PENDING' },
      { installment_number: 3, amount: 5000, due_date: '2025-03-15', status: 'PENDING' }
    ]
  };

  const mockPaymentPlanNotAllowed = {
    ...mockPaymentPlan,
    allows_date_change: false
  };

  const mockPaymentPlanPastDeadline = {
    ...mockPaymentPlan,
    change_deadline_days: 60 // 60 days before, but travel is only 30 days away
  };

  const mockProduct = {
    id: 'product-abc',
    name: 'Tour de Prueba',
    product_type: 'circuit'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnDateSelected = null;
    capturedOnCancel = null;
    capturedOnBack = null;
    capturedOnConfirm = null;
    mockChangeReservationDateAction.mockResolvedValue({ success: true });
  });

  // ============================================================
  // BLOCKING MODALS (EARLY RETURNS)
  // ============================================================

  describe('Blocking modals', () => {
    it('shows "Cambio de Fecha No Permitido" when allows_date_change=false', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanNotAllowed}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Cambio de Fecha No Permitido')).toBeInTheDocument();
      expect(screen.getByText('El plan de pagos seleccionado no permite cambios de fecha.')).toBeInTheDocument();
    });

    it('shows "Entendido" button on not allowed modal', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanNotAllowed}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Entendido')).toBeInTheDocument();
    });

    it('calls onClose when clicking "Entendido" on not allowed modal', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanNotAllowed}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Entendido'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows "Fecha Límite Vencida" when past deadline', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanPastDeadline}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Fecha Límite Vencida')).toBeInTheDocument();
      expect(screen.getByText('El plazo para cambiar la fecha de tu viaje ha vencido.')).toBeInTheDocument();
    });

    it('shows deadline date formatted in Spanish on past deadline modal', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanPastDeadline}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Fecha límite:/)).toBeInTheDocument();
    });

    it('calls onClose when clicking "Entendido" on past deadline modal', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanPastDeadline}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Entendido'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ============================================================
  // HEADER & PROGRESS BAR
  // ============================================================

  describe('Header & Progress bar', () => {
    it('renders modal with title "Cambiar Fecha de Viaje"', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Cambiar Fecha de Viaje')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
    });

    it('renders progress bar at 25% on select-date step', () => {
      const { container } = render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      const progressBar = container.querySelector('[style*="width: 25%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('renders step indicators', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('1. Seleccionar Fecha')).toBeInTheDocument();
      expect(screen.getByText('2. Revisar Cambios')).toBeInTheDocument();
      expect(screen.getByText('3. Confirmar')).toBeInTheDocument();
      expect(screen.getByText('4. Completado')).toBeInTheDocument();
    });

    it('highlights current step indicator', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      const selectDateStep = screen.getByText('1. Seleccionar Fecha');
      expect(selectDateStep).toHaveClass('text-blue-600', 'font-semibold');
    });
  });

  // ============================================================
  // DEADLINE WARNING BANNER
  // ============================================================

  describe('Deadline warning banner', () => {
    it('renders deadline warning when deadline exists and not past', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Fecha límite para cambios')).toBeInTheDocument();
    });

    it('shows deadline days in warning', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/15 días antes del viaje/)).toBeInTheDocument();
    });

    it('does not render deadline warning when no deadline set', () => {
      const planWithoutDeadline = {
        ...mockPaymentPlan,
        change_deadline_days: 0
      };

      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={planWithoutDeadline}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Fecha límite para cambios')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // SELECT DATE STEP
  // ============================================================

  describe('Select date step', () => {
    it('renders SelectNewDateStep component', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('select-new-date-step')).toBeInTheDocument();
    });

    it('navigates to review step when date is selected', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('select-date-btn'));

      expect(screen.getByTestId('review-change-date-step')).toBeInTheDocument();
    });

    it('updates progress bar to 50% on review step', () => {
      const { container } = render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('select-date-btn'));

      const progressBar = container.querySelector('[style*="width: 50%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('calls onClose when cancel is triggered from SelectNewDateStep', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      // Call the captured onCancel callback directly
      if (capturedOnCancel) {
        capturedOnCancel();
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ============================================================
  // REVIEW STEP
  // ============================================================

  describe('Review step', () => {
    it('renders ReviewChangeDateStep with selected date data', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('select-date-btn'));

      expect(screen.getByTestId('review-change-date-step')).toBeInTheDocument();
    });

    it('returns to select-date step when back is clicked', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('select-date-btn'));
      fireEvent.click(screen.getByTestId('review-back-btn'));

      expect(screen.getByTestId('select-new-date-step')).toBeInTheDocument();
    });

    it('navigates to confirm step when confirm is clicked', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('select-date-btn'));
      fireEvent.click(screen.getByTestId('review-confirm-btn'));

      expect(screen.getByText('¿Estás seguro de cambiar la fecha de tu viaje?')).toBeInTheDocument();
    });

    it('updates progress bar to 75% on confirm step', () => {
      const { container } = render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('select-date-btn'));
      fireEvent.click(screen.getByTestId('review-confirm-btn'));

      const progressBar = container.querySelector('[style*="width: 75%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  // ============================================================
  // CONFIRM STEP
  // ============================================================

  describe('Confirm step', () => {
    const navigateToConfirmStep = () => {
      fireEvent.click(screen.getByTestId('select-date-btn'));
      fireEvent.click(screen.getByTestId('review-confirm-btn'));
    };

    it('shows confirmation question', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      navigateToConfirmStep();

      expect(screen.getByText('¿Estás seguro de cambiar la fecha de tu viaje?')).toBeInTheDocument();
    });

    it('shows confirmation message about email', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      navigateToConfirmStep();

      expect(screen.getByText(/Esta acción actualizará tu reservación/)).toBeInTheDocument();
    });

    it('shows "← Revisar Cambios" button', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      navigateToConfirmStep();

      expect(screen.getByText('← Revisar Cambios')).toBeInTheDocument();
    });

    it('shows "Confirmar Cambio de Fecha" button', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      navigateToConfirmStep();

      expect(screen.getByText('Confirmar Cambio de Fecha')).toBeInTheDocument();
    });

    it('returns to review step when clicking "← Revisar Cambios"', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      navigateToConfirmStep();
      fireEvent.click(screen.getByText('← Revisar Cambios'));

      expect(screen.getByTestId('review-change-date-step')).toBeInTheDocument();
    });

    it('calls server action when clicking "Confirmar Cambio de Fecha"', async () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      navigateToConfirmStep();
      fireEvent.click(screen.getByText('Confirmar Cambio de Fecha'));

      await waitFor(() => {
        expect(mockChangeReservationDateAction).toHaveBeenCalledWith({
          reservationId: 'reservation-123',
          paymentPlanId: 'plan-789',
          productId: 'product-abc',
          newDate: '2025-06-15',
          newPricePerPerson: 5500,
          newPricePerKid: undefined,
          newTotalPrice: 16500,
          seasonId: undefined,
          priceId: undefined
        });
      });
    });

    it('shows spinner and "Procesando..." when saving', async () => {
      mockChangeReservationDateAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      navigateToConfirmStep();
      fireEvent.click(screen.getByText('Confirmar Cambio de Fecha'));

      expect(screen.getByText('Procesando...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Procesando...')).not.toBeInTheDocument();
      });
    });

    it('disables buttons when saving', async () => {
      mockChangeReservationDateAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      navigateToConfirmStep();
      fireEvent.click(screen.getByText('Confirmar Cambio de Fecha'));

      expect(screen.getByText('← Revisar Cambios').closest('button')).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('¡Fecha Actualizada!')).toBeInTheDocument();
      });
    });

    it('shows error alert on server action failure', async () => {
      mockChangeReservationDateAction.mockResolvedValue({
        success: false,
        error: 'Error de validación'
      });

      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      navigateToConfirmStep();
      fireEvent.click(screen.getByText('Confirmar Cambio de Fecha'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error al cambiar la fecha: Error de validación');
      });
    });

    it('shows generic error alert on exception', async () => {
      mockChangeReservationDateAction.mockRejectedValue(new Error('Network error'));

      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      navigateToConfirmStep();
      fireEvent.click(screen.getByText('Confirmar Cambio de Fecha'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error al cambiar la fecha. Por favor intenta de nuevo.'
        );
      });
    });
  });

  // ============================================================
  // COMPLETED STEP
  // ============================================================

  describe('Completed step', () => {
    const navigateToCompletedStep = async () => {
      fireEvent.click(screen.getByTestId('select-date-btn'));
      fireEvent.click(screen.getByTestId('review-confirm-btn'));
      fireEvent.click(screen.getByText('Confirmar Cambio de Fecha'));

      await waitFor(() => {
        expect(screen.getByText('¡Fecha Actualizada!')).toBeInTheDocument();
      });
    };

    it('shows success icon', async () => {
      const { container } = render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      await navigateToCompletedStep();

      const successIcon = container.querySelector('.bg-green-100');
      expect(successIcon).toBeInTheDocument();
    });

    it('shows success message "¡Fecha Actualizada!"', async () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      await navigateToCompletedStep();

      expect(screen.getByText('¡Fecha Actualizada!')).toBeInTheDocument();
    });

    it('shows success description with email mention', async () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      await navigateToCompletedStep();

      expect(screen.getByText(/Recibirás un correo de confirmación/)).toBeInTheDocument();
    });

    it('shows "Volver a Detalles" button', async () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      await navigateToCompletedStep();

      expect(screen.getByText('Volver a Detalles')).toBeInTheDocument();
    });

    it('updates progress bar to 100% on completed step', async () => {
      const { container } = render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      await navigateToCompletedStep();

      const progressBar = container.querySelector('[style*="width: 100%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('calls onSuccess and onClose when clicking "Volver a Detalles"', async () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await navigateToCompletedStep();
      fireEvent.click(screen.getByText('Volver a Detalles'));

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls router.refresh on success', async () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      await navigateToCompletedStep();

      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  // ============================================================
  // CANCEL CONFIRMATION
  // ============================================================

  describe('Cancel confirmation', () => {
    it('does not show confirmation dialog when cancelling from select-date step', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByLabelText('Cerrar'));

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows confirmation dialog when cancelling from review step', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('select-date-btn'));
      fireEvent.click(screen.getByLabelText('Cerrar'));

      expect(mockConfirm).toHaveBeenCalledWith('¿Estás seguro? Los cambios no se guardarán.');
    });

    it('shows confirmation dialog when cancelling from confirm step', () => {
      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('select-date-btn'));
      fireEvent.click(screen.getByTestId('review-confirm-btn'));
      fireEvent.click(screen.getByLabelText('Cerrar'));

      expect(mockConfirm).toHaveBeenCalledWith('¿Estás seguro? Los cambios no se guardarán.');
    });

    it('calls onClose when confirmation is accepted', () => {
      mockConfirm.mockReturnValue(true);

      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('select-date-btn'));
      fireEvent.click(screen.getByLabelText('Cerrar'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not call onClose when confirmation is declined', () => {
      mockConfirm.mockReturnValue(false);

      render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('select-date-btn'));
      fireEvent.click(screen.getByLabelText('Cerrar'));

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // MODAL STRUCTURE
  // ============================================================

  describe('Modal structure', () => {
    it('renders with fixed position overlay', () => {
      const { container } = render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('renders with z-50 for modal layering', () => {
      const { container } = render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      const overlay = container.querySelector('.z-50');
      expect(overlay).toBeInTheDocument();
    });

    it('renders modal container with max width', () => {
      const { container } = render(
        <ChangeDateWizard
          reservation={mockReservation}
          paymentPlan={mockPaymentPlan}
          product={mockProduct}
          onClose={mockOnClose}
        />
      );

      const modal = container.querySelector('.max-w-4xl');
      expect(modal).toBeInTheDocument();
    });
  });
});
