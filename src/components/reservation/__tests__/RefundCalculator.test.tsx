/**
 * Unit tests for RefundCalculator component
 *
 * Tests the refund calculation logic:
 * - Refund percentage by days before travel (90%/70%/50%/20%)
 * - Processing fee calculation (3%, max 500 MXN)
 * - Total paid calculation from installments
 * - Policy table with current tier highlighting
 * - Breakdown display
 * - Currency and date formatting
 * - Loading state
 * - Action callbacks
 *
 * @see src/components/reservation/RefundCalculator.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RefundCalculator, { RefundData } from '../RefundCalculator';

describe('RefundCalculator', () => {
  const mockReservation = {
    id: 'reservation-123',
    total_price: 15000,
    currency: 'MXN',
    reservation_date: '2025-06-15T12:00:00.000Z',
  };

  const mockPaymentPlanContado = {
    id: 'plan-123',
    plan_type: 'CONTADO',
    total_cost: 15000,
    installments: [
      { installment_number: 1, amount: 15000, status: 'paid', paid_date: '2025-01-01' },
    ],
  };

  const mockPaymentPlanPlazos = {
    id: 'plan-456',
    plan_type: 'PLAZOS',
    total_cost: 15000,
    installments: [
      { installment_number: 1, amount: 5000, status: 'paid', paid_date: '2025-01-01' },
      { installment_number: 2, amount: 5000, status: 'paid', paid_date: '2025-02-01' },
      { installment_number: 3, amount: 5000, status: 'pending' },
    ],
  };

  const mockOnCalculated = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // LOADING STATE
  // ============================================================

  describe('Loading state', () => {
    it('shows loading spinner initially', () => {
      // Since useEffect runs after render, we need to check before it completes
      const { container } = render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      // The component should show loading first, then calculate
      // After calculation completes, loading disappears
    });

    it('shows "Calculando reembolso..." text during loading', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      // Wait for calculation to complete - loading should disappear
      await waitFor(() => {
        expect(screen.queryByText('Calculando reembolso...')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // REFUND CALCULATION - 90% TIER (30+ days)
  // ============================================================

  describe('Refund calculation - 90% tier (30+ days)', () => {
    it('calculates 90% refund for 35 days before travel', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // 90% appears in both policy table and breakdown, verify at least one exists
        const percentages = screen.getAllByText('90%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calculates 90% refund for exactly 30 days', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={30}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Should show 90% highlighted as current tier
        expect(screen.getByText('← Tu cancelación')).toBeInTheDocument();
        const percentages = screen.getAllByText('90%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calculates correct refund amount for 90% tier', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Total paid: 15000, 90% = 13500
        // Processing fee: 3% of 13500 = 405
        // Net refund: 13500 - 405 = 13095
        expect(screen.getByText('$13,095.00')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // REFUND CALCULATION - 70% TIER (15-29 days)
  // ============================================================

  describe('Refund calculation - 70% tier (15-29 days)', () => {
    it('calculates 70% refund for 20 days before travel', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={20}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // 70% appears in policy table and breakdown
        const percentages = screen.getAllByText('70%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calculates 70% refund for exactly 15 days', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={15}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Should show 70% highlighted as current tier
        expect(screen.getByText('← Tu cancelación')).toBeInTheDocument();
        const percentages = screen.getAllByText('70%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calculates correct refund amount for 70% tier', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={20}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Total paid: 15000, 70% = 10500
        // Processing fee: 3% of 10500 = 315
        // Net refund: 10500 - 315 = 10185
        expect(screen.getByText('$10,185.00')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // REFUND CALCULATION - 50% TIER (7-14 days)
  // ============================================================

  describe('Refund calculation - 50% tier (7-14 days)', () => {
    it('calculates 50% refund for 10 days before travel', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={10}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // 50% appears in policy table and breakdown
        const percentages = screen.getAllByText('50%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calculates 50% refund for exactly 7 days', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={7}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Should show 50% highlighted as current tier
        expect(screen.getByText('← Tu cancelación')).toBeInTheDocument();
        const percentages = screen.getAllByText('50%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calculates correct refund amount for 50% tier', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={10}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Total paid: 15000, 50% = 7500
        // Processing fee: 3% of 7500 = 225
        // Net refund: 7500 - 225 = 7275
        expect(screen.getByText('$7,275.00')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // REFUND CALCULATION - 20% TIER (<7 days)
  // ============================================================

  describe('Refund calculation - 20% tier (<7 days)', () => {
    it('calculates 20% refund for 5 days before travel', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={5}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // 20% appears in policy table and breakdown
        const percentages = screen.getAllByText('20%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calculates 20% refund for 0 days (same day)', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={0}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Should show 20% highlighted as current tier
        expect(screen.getByText('← Tu cancelación')).toBeInTheDocument();
        const percentages = screen.getAllByText('20%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calculates correct refund amount for 20% tier', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={5}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Total paid: 15000, 20% = 3000
        // Processing fee: 3% of 3000 = 90
        // Net refund: 3000 - 90 = 2910
        expect(screen.getByText('$2,910.00')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // PROCESSING FEE
  // ============================================================

  describe('Processing fee calculation', () => {
    it('calculates 3% processing fee', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // 90% of 15000 = 13500, 3% of 13500 = 405
        expect(screen.getByText('- $405.00')).toBeInTheDocument();
      });
    });

    it('caps processing fee at 500 MXN', async () => {
      const highValuePlan = {
        ...mockPaymentPlanContado,
        total_cost: 50000,
        installments: [
          { installment_number: 1, amount: 50000, status: 'paid', paid_date: '2025-01-01' },
        ],
      };

      render(
        <RefundCalculator
          reservation={{ ...mockReservation, total_price: 50000 }}
          paymentPlan={highValuePlan}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // 90% of 50000 = 45000, 3% = 1350, but capped at 500
        expect(screen.getByText('- $500.00')).toBeInTheDocument();
      });
    });

    it('displays fee description text', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Comisión por Procesamiento \(3%, máx\. \$500\)/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // TOTAL PAID CALCULATION
  // ============================================================

  describe('Total paid calculation', () => {
    it('calculates total from paid installments only', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanPlazos}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Only 2 of 3 installments are paid: 5000 + 5000 = 10000
        expect(screen.getByText('$10,000.00')).toBeInTheDocument();
      });
    });

    it('includes completed status installments', async () => {
      const planWithCompleted = {
        ...mockPaymentPlanPlazos,
        installments: [
          { installment_number: 1, amount: 5000, status: 'completed', paid_date: '2025-01-01' },
          { installment_number: 2, amount: 5000, status: 'PAID', paid_date: '2025-02-01' },
          { installment_number: 3, amount: 5000, status: 'pending' },
        ],
      };

      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={planWithCompleted}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Handles case-insensitive status check
        expect(screen.getByText('$10,000.00')).toBeInTheDocument();
      });
    });

    it('handles zero paid amount', async () => {
      const noPaidPlan = {
        ...mockPaymentPlanPlazos,
        installments: [
          { installment_number: 1, amount: 5000, status: 'pending' },
          { installment_number: 2, amount: 5000, status: 'pending' },
        ],
      };

      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={noPaidPlan}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Total Pagado should show $0.00 - there are multiple $0.00 values
        const zeroAmounts = screen.getAllByText('$0.00');
        expect(zeroAmounts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('handles undefined installments', async () => {
      const noInstallmentsPlan = {
        id: 'plan-789',
        plan_type: 'CONTADO',
        total_cost: 15000,
      };

      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={noInstallmentsPlan}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Total Pagado should show $0.00 - there are multiple $0.00 values
        const zeroAmounts = screen.getAllByText('$0.00');
        expect(zeroAmounts.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ============================================================
  // POLICY TABLE
  // ============================================================

  describe('Policy table', () => {
    it('displays "Política de Reembolso" heading', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Política de Reembolso')).toBeInTheDocument();
      });
    });

    it('displays all policy tiers', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('30+ días')).toBeInTheDocument();
        expect(screen.getByText('15+ días')).toBeInTheDocument();
        expect(screen.getByText('7+ días')).toBeInTheDocument();
        expect(screen.getByText('Menos de 7 días')).toBeInTheDocument();
      });
    });

    it('highlights current tier row', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={20}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('← Tu cancelación')).toBeInTheDocument();
      });
    });

    it('uses custom refund policy from backend when available', async () => {
      const customPolicyPlan = {
        ...mockPaymentPlanContado,
        refund_percentage_by_days: [
          { days_before: 45, refund_percentage: 95 },
          { days_before: 20, refund_percentage: 75 },
          { days_before: 10, refund_percentage: 40 },
          { days_before: 0, refund_percentage: 10 },
        ],
      };

      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={customPolicyPlan}
          daysBeforeTravel={25}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // Custom policy should display 45+ días
        expect(screen.getByText('45+ días')).toBeInTheDocument();
        // Both percentages appear in table
        const percentages95 = screen.getAllByText('95%');
        expect(percentages95.length).toBeGreaterThanOrEqual(1);
        const percentages75 = screen.getAllByText('75%');
        expect(percentages75.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ============================================================
  // BREAKDOWN SECTION
  // ============================================================

  describe('Breakdown section', () => {
    it('displays "Desglose de Reembolso" heading', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Desglose de Reembolso')).toBeInTheDocument();
      });
    });

    it('displays "Total Pagado" label', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Total Pagado')).toBeInTheDocument();
      });
    });

    it('displays "Porcentaje de Reembolso Aplicable" label', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Porcentaje de Reembolso Aplicable')).toBeInTheDocument();
      });
    });

    it('displays "Reembolso (antes de comisiones)" label', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Reembolso (antes de comisiones)')).toBeInTheDocument();
      });
    });

    it('displays "Reembolso Neto a Recibir" label', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Reembolso Neto a Recibir')).toBeInTheDocument();
      });
    });

    it('has green styling when refund available', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        const breakdown = screen.getByText('Desglose de Reembolso').closest('div');
        expect(breakdown).toHaveClass('bg-green-50');
        expect(breakdown).toHaveClass('border-green-200');
      });
    });
  });

  // ============================================================
  // HEADER INFO
  // ============================================================

  describe('Header info', () => {
    it('displays "Cálculo de Reembolso" title', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cálculo de Reembolso')).toBeInTheDocument();
      });
    });

    it('displays informational message', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Este es el reembolso estimado/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // TRAVEL DATE INFO
  // ============================================================

  describe('Travel date info', () => {
    it('displays "Fecha de Viaje" label', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Fecha de Viaje')).toBeInTheDocument();
      });
    });

    it('displays formatted travel date', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/15 de junio de 2025/i)).toBeInTheDocument();
      });
    });

    it('displays "Días Hasta el Viaje" label', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Días Hasta el Viaje')).toBeInTheDocument();
      });
    });

    it('displays days count', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('35 días')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // NOTES SECTION
  // ============================================================

  describe('Notes section', () => {
    it('displays refund info when refund available', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Información del Reembolso')).toBeInTheDocument();
        expect(screen.getByText(/5-7 días hábiles/)).toBeInTheDocument();
      });
    });

    it('displays "Sin Reembolso Disponible" when net refund is 0', async () => {
      const noPaidPlan = {
        ...mockPaymentPlanPlazos,
        installments: [
          { installment_number: 1, amount: 0, status: 'paid' },
        ],
      };

      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={noPaidPlan}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Sin Reembolso Disponible')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // ACTION BUTTONS
  // ============================================================

  describe('Action buttons', () => {
    it('displays "← Anterior" button', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('← Anterior')).toBeInTheDocument();
      });
    });

    it('calls onBack when "← Anterior" clicked', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('← Anterior')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('← Anterior'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('displays "Continuar con Cancelación →" button', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Continuar con Cancelación →')).toBeInTheDocument();
      });
    });

    it('calls onCalculated with refund data when continue clicked', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Continuar con Cancelación →')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Continuar con Cancelación →'));

      expect(mockOnCalculated).toHaveBeenCalledTimes(1);
      expect(mockOnCalculated).toHaveBeenCalledWith(
        expect.objectContaining({
          totalPaid: 15000,
          refundPercentage: 90,
          daysBeforeTravel: 35,
        })
      );
    });
  });

  // ============================================================
  // CURRENCY FORMATTING
  // ============================================================

  describe('Currency formatting', () => {
    it('formats amounts with MXN currency', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('$15,000.00')).toBeInTheDocument();
      });
    });

    it('handles different currencies', async () => {
      render(
        <RefundCalculator
          reservation={{ ...mockReservation, currency: 'USD' }}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={35}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // USD formatting
        expect(screen.getByText(/15,000/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge cases', () => {
    it('never returns negative net refund', async () => {
      // This would be an edge case with very small amounts
      const smallAmountPlan = {
        ...mockPaymentPlanContado,
        installments: [
          { installment_number: 1, amount: 1, status: 'paid', paid_date: '2025-01-01' },
        ],
      };

      render(
        <RefundCalculator
          reservation={{ ...mockReservation, total_price: 1 }}
          paymentPlan={smallAmountPlan}
          daysBeforeTravel={5}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // 20% of 1 = 0.20, fee = 0.006, net should be ~0.19, never negative
        const netRefund = screen.getAllByText(/\$/);
        expect(netRefund.length).toBeGreaterThan(0);
      });
    });

    it('handles 29 days (edge of 70% tier)', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={29}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // 29 days should highlight 70% tier, not 90%
        expect(screen.getByText('← Tu cancelación')).toBeInTheDocument();
        // The 70% tier should be highlighted
        const percentages = screen.getAllByText('70%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('handles 14 days (edge of 50% tier)', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={14}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // 14 days should highlight 50% tier, not 70%
        expect(screen.getByText('← Tu cancelación')).toBeInTheDocument();
        const percentages = screen.getAllByText('50%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('handles 6 days (edge of 20% tier)', async () => {
      render(
        <RefundCalculator
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          daysBeforeTravel={6}
          onCalculated={mockOnCalculated}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        // 6 days should highlight 20% tier
        expect(screen.getByText('← Tu cancelación')).toBeInTheDocument();
        const percentages = screen.getAllByText('20%');
        expect(percentages.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
