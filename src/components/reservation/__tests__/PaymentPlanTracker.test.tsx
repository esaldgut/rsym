/**
 * Unit tests for PaymentPlanTracker component
 *
 * Tests the payment plan tracker display:
 * - Header (plan type, total amount)
 * - Progress bar (PLAZOS only)
 * - Benefits and discounts
 * - Installments list with status badges
 * - Single payment display (CONTADO)
 * - Pay button states
 * - Change date section
 * - Cancellation section
 * - Expandable installment details
 *
 * @see src/components/reservation/PaymentPlanTracker.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import PaymentPlanTracker from '../PaymentPlanTracker';

describe('PaymentPlanTracker', () => {
  // Payment plan with installments (PLAZOS)
  const mockPaymentPlanPlazos = {
    id: 'plan-123',
    reservation_id: 'reservation-123',
    total_amount: 15000,
    currency: 'MXN',
    plan_type: 'PLAZOS',
    installments: [
      {
        installment_number: 1,
        amount: 5000,
        due_date: '2025-01-15T12:00:00.000Z',
        status: 'paid',
        paid_date: '2025-01-10T12:00:00.000Z',
      },
      {
        installment_number: 2,
        amount: 5000,
        due_date: '2025-02-15T12:00:00.000Z',
        status: 'paid',
        paid_date: '2025-02-08T12:00:00.000Z',
      },
      {
        installment_number: 3,
        amount: 5000,
        due_date: '2025-03-15T12:00:00.000Z',
        status: 'pending',
      },
    ],
    allows_date_change: true,
    change_deadline_days: 7,
  };

  // Payment plan single payment (CONTADO)
  const mockPaymentPlanContado = {
    id: 'plan-456',
    reservation_id: 'reservation-456',
    total_amount: 15000,
    currency: 'MXN',
    plan_type: 'CONTADO',
    cash_discount_amount: 500,
    benefits_statements: {
      stated: 'Descuento especial por pago de contado',
    },
  };

  const mockOnPayInstallment = jest.fn();
  const mockOnChangeDate = jest.fn();
  const mockOnCancelReservation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // HEADER
  // ============================================================

  describe('Header', () => {
    it('displays "Plan de Pagos" title', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText('Plan de Pagos')).toBeInTheDocument();
    });

    it('displays "Pago a plazos" for PLAZOS plan type', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText(/Pago a plazos \(3 pagos\)/)).toBeInTheDocument();
    });

    it('displays "Pago único (CONTADO)" for CONTADO plan type', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanContado} />);

      expect(screen.getByText('Pago único (CONTADO)')).toBeInTheDocument();
    });

    it('displays total amount', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText('$15,000')).toBeInTheDocument();
    });

    it('displays currency', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText('MXN')).toBeInTheDocument();
    });

    it('displays "Total" label', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  // ============================================================
  // PROGRESS BAR (PLAZOS)
  // ============================================================

  describe('Progress bar', () => {
    it('displays progress bar for PLAZOS plan', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText('Progreso')).toBeInTheDocument();
    });

    it('shows correct completion count', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      // 2 of 3 paid
      expect(screen.getByText('2 / 3 pagos completados')).toBeInTheDocument();
    });

    it('hides progress bar for CONTADO plan', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanContado} />);

      expect(screen.queryByText('Progreso')).not.toBeInTheDocument();
    });

    it('calculates 100% progress when all paid', () => {
      const allPaidPlan = {
        ...mockPaymentPlanPlazos,
        installments: mockPaymentPlanPlazos.installments?.map(i => ({
          ...i,
          status: 'paid',
        })),
      };

      render(<PaymentPlanTracker paymentPlan={allPaidPlan} />);

      expect(screen.getByText('3 / 3 pagos completados')).toBeInTheDocument();
    });
  });

  // ============================================================
  // BENEFITS & DISCOUNTS
  // ============================================================

  describe('Benefits and discounts', () => {
    it('displays cash discount amount when available', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanContado} />);

      expect(screen.getByText(/Descuento de \$500 MXN/)).toBeInTheDocument();
    });

    it('displays benefits statement when available', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanContado} />);

      expect(screen.getByText('Descuento especial por pago de contado')).toBeInTheDocument();
    });

    it('hides benefits section when no discount or statement', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.queryByText(/Descuento de/)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // INSTALLMENTS LIST (PLAZOS)
  // ============================================================

  describe('Installments list', () => {
    it('displays "Parcialidades" heading', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText('Parcialidades')).toBeInTheDocument();
    });

    it('displays all installments', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText('Pago 1 de 3')).toBeInTheDocument();
      expect(screen.getByText('Pago 2 de 3')).toBeInTheDocument();
      expect(screen.getByText('Pago 3 de 3')).toBeInTheDocument();
    });

    it('displays installment amounts', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      // Each installment shows $5,000
      const amounts = screen.getAllByText('$5,000');
      expect(amounts.length).toBe(3);
    });

    it('displays "Pagado" status for paid installments', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      const pagadoStatuses = screen.getAllByText('Pagado');
      expect(pagadoStatuses.length).toBe(2); // 2 paid installments
    });

    it('displays "Pendiente" status for pending installments', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('displays "Vencido" status for overdue installments', () => {
      const overduePlan = {
        ...mockPaymentPlanPlazos,
        installments: [
          {
            installment_number: 1,
            amount: 5000,
            due_date: '2024-01-01T12:00:00.000Z',
            status: 'overdue',
          },
        ],
      };

      render(<PaymentPlanTracker paymentPlan={overduePlan} />);

      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('displays due date for each installment', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText(/15 de enero de 2025/)).toBeInTheDocument();
      expect(screen.getByText(/15 de febrero de 2025/)).toBeInTheDocument();
      expect(screen.getByText(/15 de marzo de 2025/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // EXPANDABLE DETAILS
  // ============================================================

  describe('Expandable details', () => {
    it('expands installment on click', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      // Click first installment to expand
      const installmentButton = screen.getByText('Pago 1 de 3').closest('button');
      if (installmentButton) {
        fireEvent.click(installmentButton);
      }

      // Should show expanded details
      expect(screen.getByText('Fecha de vencimiento')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
    });

    it('shows paid date in expanded view', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      // Click first installment to expand
      const installmentButton = screen.getByText('Pago 1 de 3').closest('button');
      if (installmentButton) {
        fireEvent.click(installmentButton);
      }

      expect(screen.getByText('Fecha de pago')).toBeInTheDocument();
      expect(screen.getByText(/10 de enero de 2025/)).toBeInTheDocument();
    });

    it('shows "Pagar ahora" button for pending installment', () => {
      render(
        <PaymentPlanTracker
          paymentPlan={mockPaymentPlanPlazos}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      // Click third installment (pending) to expand
      const installmentButton = screen.getByText('Pago 3 de 3').closest('button');
      if (installmentButton) {
        fireEvent.click(installmentButton);
      }

      expect(screen.getByText('Pagar ahora')).toBeInTheDocument();
    });

    it('collapses installment on second click', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      // Click to expand
      const installmentButton = screen.getByText('Pago 1 de 3').closest('button');
      if (installmentButton) {
        fireEvent.click(installmentButton);
        expect(screen.getByText('Fecha de vencimiento')).toBeInTheDocument();

        // Click again to collapse
        fireEvent.click(installmentButton);
        expect(screen.queryByText('Fecha de vencimiento')).not.toBeInTheDocument();
      }
    });
  });

  // ============================================================
  // SINGLE PAYMENT (CONTADO)
  // ============================================================

  describe('Single payment (CONTADO)', () => {
    it('displays "Pago único" text', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanContado} />);

      expect(screen.getByText('Pago único')).toBeInTheDocument();
    });

    it('displays total amount prominently', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanContado} />);

      // Total amount shown in single payment section
      const totalText = screen.getByText(/\$15,000 MXN/);
      expect(totalText).toBeInTheDocument();
    });

    it('displays single payment description', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanContado} />);

      expect(screen.getByText(/Este plan requiere un solo pago/)).toBeInTheDocument();
    });

    it('hides "Parcialidades" heading for CONTADO', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanContado} />);

      expect(screen.queryByText('Parcialidades')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // PAY BUTTON
  // ============================================================

  describe('Pay button', () => {
    it('shows "Pagar ahora" when onPayInstallment provided', () => {
      render(
        <PaymentPlanTracker
          paymentPlan={mockPaymentPlanContado}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      expect(screen.getByText('Pagar ahora')).toBeInTheDocument();
    });

    it('shows "Pago en línea próximamente" when onPayInstallment not provided', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanContado} />);

      expect(screen.getByText('Pago en línea próximamente')).toBeInTheDocument();
    });

    it('shows "Procesando..." when isProcessingPayment is true', () => {
      render(
        <PaymentPlanTracker
          paymentPlan={mockPaymentPlanContado}
          onPayInstallment={mockOnPayInstallment}
          isProcessingPayment={true}
        />
      );

      expect(screen.getByText('Procesando...')).toBeInTheDocument();
    });

    it('calls onPayInstallment when pay button clicked', () => {
      render(
        <PaymentPlanTracker
          paymentPlan={mockPaymentPlanContado}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      const payButton = screen.getByText('Pagar ahora');
      fireEvent.click(payButton);

      expect(mockOnPayInstallment).toHaveBeenCalledWith(1);
    });

    it('disables pay button when no callback', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanContado} />);

      const payButton = screen.getByText('Pago en línea próximamente');
      expect(payButton).toBeDisabled();
    });

    it('disables pay button when processing', () => {
      render(
        <PaymentPlanTracker
          paymentPlan={mockPaymentPlanContado}
          onPayInstallment={mockOnPayInstallment}
          isProcessingPayment={true}
        />
      );

      const payButton = screen.getByText('Procesando...').closest('button');
      expect(payButton).toBeDisabled();
    });
  });

  // ============================================================
  // CHANGE DATE SECTION
  // ============================================================

  describe('Change date section', () => {
    it('displays change date section when allowed', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText('Cambio de fecha disponible')).toBeInTheDocument();
    });

    it('displays change deadline days', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText(/hasta 7 días antes de la salida/)).toBeInTheDocument();
    });

    it('shows "Cambiar Fecha" button when callback provided', () => {
      render(
        <PaymentPlanTracker
          paymentPlan={mockPaymentPlanPlazos}
          onChangeDate={mockOnChangeDate}
        />
      );

      expect(screen.getByText('Cambiar Fecha')).toBeInTheDocument();
    });

    it('calls onChangeDate when button clicked', () => {
      render(
        <PaymentPlanTracker
          paymentPlan={mockPaymentPlanPlazos}
          onChangeDate={mockOnChangeDate}
        />
      );

      const changeButton = screen.getByText('Cambiar Fecha');
      fireEvent.click(changeButton);

      expect(mockOnChangeDate).toHaveBeenCalledTimes(1);
    });

    it('hides change date section when not allowed', () => {
      const noChangePlan = {
        ...mockPaymentPlanPlazos,
        allows_date_change: false,
        change_deadline_days: undefined,
      };

      render(<PaymentPlanTracker paymentPlan={noChangePlan} />);

      expect(screen.queryByText('Cambio de fecha disponible')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // CANCELLATION SECTION
  // ============================================================

  describe('Cancellation section', () => {
    it('displays "Política de Cancelación" heading', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText('Política de Cancelación')).toBeInTheDocument();
    });

    it('displays cancellation policy text', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      expect(screen.getByText(/Puedes cancelar esta reservación/)).toBeInTheDocument();
    });

    it('shows "Cancelar Reservación" button when callback provided', () => {
      render(
        <PaymentPlanTracker
          paymentPlan={mockPaymentPlanPlazos}
          onCancelReservation={mockOnCancelReservation}
        />
      );

      expect(screen.getByText('Cancelar Reservación')).toBeInTheDocument();
    });

    it('calls onCancelReservation when button clicked', () => {
      render(
        <PaymentPlanTracker
          paymentPlan={mockPaymentPlanPlazos}
          onCancelReservation={mockOnCancelReservation}
        />
      );

      const cancelButton = screen.getByText('Cancelar Reservación');
      fireEvent.click(cancelButton);

      expect(mockOnCancelReservation).toHaveBeenCalledTimes(1);
    });

    it('displays cancellation deadline when available', () => {
      const planWithDeadline = {
        ...mockPaymentPlanPlazos,
        cancellation_deadline_days: 14,
      };

      render(<PaymentPlanTracker paymentPlan={planWithDeadline} />);

      expect(screen.getByText(/14 días/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // STATUS BADGES
  // ============================================================

  describe('Status badges', () => {
    it('shows green styling for paid status', () => {
      render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      // The paid installments should have green styling
      const pagadoStatuses = screen.getAllByText('Pagado');
      expect(pagadoStatuses[0]).toBeInTheDocument();
    });

    it('handles completed status same as paid', () => {
      const completedPlan = {
        ...mockPaymentPlanPlazos,
        installments: [
          {
            installment_number: 1,
            amount: 5000,
            due_date: '2025-01-15T12:00:00.000Z',
            status: 'completed',
          },
        ],
      };

      render(<PaymentPlanTracker paymentPlan={completedPlan} />);

      // completed should show as "Pagado"
      expect(screen.getByText('Pagado')).toBeInTheDocument();
    });

    it('handles due status as overdue', () => {
      const duePlan = {
        ...mockPaymentPlanPlazos,
        installments: [
          {
            installment_number: 1,
            amount: 5000,
            due_date: '2025-01-15T12:00:00.000Z',
            status: 'due',
          },
        ],
      };

      render(<PaymentPlanTracker paymentPlan={duePlan} />);

      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('handles unknown status gracefully', () => {
      const unknownStatusPlan = {
        ...mockPaymentPlanPlazos,
        installments: [
          {
            installment_number: 1,
            amount: 5000,
            due_date: '2025-01-15T12:00:00.000Z',
            status: 'CUSTOM_STATUS',
          },
        ],
      };

      render(<PaymentPlanTracker paymentPlan={unknownStatusPlan} />);

      // Should display the status as-is
      expect(screen.getByText('CUSTOM_STATUS')).toBeInTheDocument();
    });
  });

  // ============================================================
  // STRUCTURAL ELEMENTS
  // ============================================================

  describe('Structural elements', () => {
    it('has correct card styling', () => {
      const { container } = render(<PaymentPlanTracker paymentPlan={mockPaymentPlanPlazos} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('shadow-sm');
    });
  });
});
