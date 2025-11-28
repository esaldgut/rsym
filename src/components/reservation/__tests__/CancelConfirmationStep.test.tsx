/**
 * Unit tests for CancelConfirmationStep component
 *
 * Tests the final confirmation step before canceling:
 * - Critical warning header
 * - Reservation summary display
 * - Refund information with conditional styling
 * - Consequences list
 * - Confirmation checkbox behavior
 * - Action buttons (back/confirm)
 * - Loading state during cancellation
 * - Final warning message
 *
 * @see src/components/reservation/CancelConfirmationStep.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import CancelConfirmationStep from '../CancelConfirmationStep';

describe('CancelConfirmationStep', () => {
  const mockReservation = {
    id: 'reservation-123',
    adults: 2,
    kids: 1,
    babys: 0,
    reservation_date: '2025-06-15T12:00:00.000Z',
    total_price: 15000,
    currency: 'MXN'
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Circuito Mágico por Michoacán',
    product_type: 'circuit'
  };

  const mockRefundDataWithRefund = {
    totalPaid: 15000,
    refundPercentage: 70,
    processingFee: 450,
    netRefund: 10050,
    daysUntilTrip: 20,
    policyTier: 'tier2' as const,
    refundableAmount: 10500
  };

  const mockRefundDataNoRefund = {
    totalPaid: 15000,
    refundPercentage: 0,
    processingFee: 0,
    netRefund: 0,
    daysUntilTrip: 2,
    policyTier: 'tier4' as const,
    refundableAmount: 0
  };

  const mockOnBack = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // CRITICAL WARNING HEADER
  // ============================================================

  describe('Critical warning header', () => {
    it('displays the confirmation question', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('¿Estás seguro que deseas cancelar esta reservación?')).toBeInTheDocument();
    });

    it('displays irreversibility warning', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText(/Esta acción es/)).toBeInTheDocument();
      expect(screen.getByText('irreversible')).toBeInTheDocument();
    });

    it('has red background styling', () => {
      const { container } = render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const warningBox = container.querySelector('.bg-red-100');
      expect(warningBox).toBeInTheDocument();
    });
  });

  // ============================================================
  // RESERVATION SUMMARY
  // ============================================================

  describe('Reservation summary', () => {
    it('displays "Resumen de Reservación" heading', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('Resumen de Reservación')).toBeInTheDocument();
    });

    it('displays product name', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('Circuito Mágico por Michoacán')).toBeInTheDocument();
    });

    it('displays product type', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('circuit')).toBeInTheDocument();
    });

    it('displays formatted reservation date', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      // Allow for timezone variations
      expect(screen.getByText(/\d+ de junio de 2025/i)).toBeInTheDocument();
    });

    it('displays travelers breakdown', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText(/3 \(2 adultos, 1 niños, 0 bebés\)/)).toBeInTheDocument();
    });

    it('displays formatted total price', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('Total de Reservación:')).toBeInTheDocument();
      // Total price appears multiple times (reservation summary and refund info), so use getAllByText
      const priceElements = screen.getAllByText('$15,000.00');
      expect(priceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays cancellation reason', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Emergencia familiar"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('Emergencia familiar')).toBeInTheDocument();
    });
  });

  // ============================================================
  // REFUND INFORMATION - WITH REFUND
  // ============================================================

  describe('Refund information (with refund)', () => {
    it('displays "Información de Reembolso" heading', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('Información de Reembolso')).toBeInTheDocument();
    });

    it('displays total paid', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('Total Pagado:')).toBeInTheDocument();
    });

    it('displays refund percentage', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('displays processing fee', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('$450.00')).toBeInTheDocument();
    });

    it('displays net refund', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('Reembolso Neto:')).toBeInTheDocument();
      // Net refund may appear in refund section and consequences
      const netRefundElements = screen.getAllByText('$10,050.00');
      expect(netRefundElements.length).toBeGreaterThanOrEqual(1);
    });

    it('has green styling when refund available', () => {
      const { container } = render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const refundBox = container.querySelector('.bg-green-50');
      expect(refundBox).toBeInTheDocument();
    });

    it('displays refund processing time message', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText(/El reembolso se procesará en 5-7 días hábiles/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // REFUND INFORMATION - NO REFUND
  // ============================================================

  describe('Refund information (no refund)', () => {
    it('has red styling when no refund', () => {
      const { container } = render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataNoRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const refundBox = container.querySelector('.bg-red-50.border-red-200');
      expect(refundBox).toBeInTheDocument();
    });

    it('displays 0% refund percentage', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataNoRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays $0.00 net refund', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataNoRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      // $0.00 may appear multiple times (processing fee and net refund)
      const zeroElements = screen.getAllByText('$0.00');
      expect(zeroElements.length).toBeGreaterThanOrEqual(1);
    });

    it('does not display refund processing time message', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataNoRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.queryByText(/El reembolso se procesará en 5-7 días hábiles/)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // CONSEQUENCES SECTION
  // ============================================================

  describe('Consequences section', () => {
    it('displays "Consecuencias de la Cancelación" heading', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('Consecuencias de la Cancelación')).toBeInTheDocument();
    });

    it('displays irreversibility warning', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('No podrás recuperar esta reservación')).toBeInTheDocument();
    });

    it('displays cancellation status warning', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('CANCELADA')).toBeInTheDocument();
    });

    it('displays refund amount in consequences when hasRefund', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      // "7 días hábiles" appears in both refund info and consequences
      const daysElements = screen.getAllByText(/7 días hábiles/);
      expect(daysElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays no refund warning when no refund', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataNoRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('No recibirás ningún reembolso')).toBeInTheDocument();
    });

    it('displays price change warning', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      // Text is split with nested spans, check for the semibold part
      expect(screen.getByText('precios pueden haber cambiado')).toBeInTheDocument();
    });

    it('displays provider notification warning', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText(/El proveedor será notificado/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // CONFIRMATION CHECKBOX
  // ============================================================

  describe('Confirmation checkbox', () => {
    it('displays checkbox with label', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('Confirmo que he leído y entiendo las consecuencias')).toBeInTheDocument();
    });

    it('checkbox starts unchecked', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('checkbox can be toggled', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('displays acceptance text', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText(/Entiendo que esta acción es irreversible/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // ACTION BUTTONS
  // ============================================================

  describe('Action buttons', () => {
    it('displays back button', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('← Revisar Reembolso')).toBeInTheDocument();
    });

    it('calls onBack when back button clicked', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const backButton = screen.getByText('← Revisar Reembolso');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('displays confirm button', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText('Confirmar Cancelación')).toBeInTheDocument();
    });

    it('confirm button is disabled when not confirmed', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const confirmButton = screen.getByText('Confirmar Cancelación').closest('button');
      expect(confirmButton).toBeDisabled();
    });

    it('confirm button is enabled when confirmed', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const confirmButton = screen.getByText('Confirmar Cancelación').closest('button');
      expect(confirmButton).not.toBeDisabled();
    });

    it('calls onConfirm when confirm button clicked after confirmation', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const confirmButton = screen.getByText('Confirmar Cancelación').closest('button');
      fireEvent.click(confirmButton!);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // LOADING STATE
  // ============================================================

  describe('Loading state', () => {
    it('displays "Cancelando..." when isCancelling', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={true}
        />
      );

      expect(screen.getByText('Cancelando...')).toBeInTheDocument();
    });

    it('hides "Confirmar Cancelación" when isCancelling', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={true}
        />
      );

      expect(screen.queryByText('Confirmar Cancelación')).not.toBeInTheDocument();
    });

    it('disables back button when isCancelling', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={true}
        />
      );

      const backButton = screen.getByText('← Revisar Reembolso');
      expect(backButton).toBeDisabled();
    });

    it('disables confirm button when isCancelling', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={true}
        />
      );

      const confirmButton = screen.getByText('Cancelando...').closest('button');
      expect(confirmButton).toBeDisabled();
    });
  });

  // ============================================================
  // FINAL WARNING MESSAGE
  // ============================================================

  describe('Final warning message', () => {
    it('displays warning when not confirmed', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      expect(screen.getByText(/Debes confirmar que has leído las consecuencias/)).toBeInTheDocument();
    });

    it('hides warning when confirmed', () => {
      render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(screen.queryByText(/Debes confirmar que has leído las consecuencias/)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // STRUCTURAL ELEMENTS
  // ============================================================

  describe('Structural elements', () => {
    it('has amber background for consequences section', () => {
      const { container } = render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const consequencesBox = container.querySelector('.bg-amber-50');
      expect(consequencesBox).toBeInTheDocument();
    });

    it('has gray background for reservation summary', () => {
      const { container } = render(
        <CancelConfirmationStep
          reservation={mockReservation}
          product={mockProduct}
          refundData={mockRefundDataWithRefund}
          cancellationReason="Cambio de planes"
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
          isCancelling={false}
        />
      );

      const summaryBox = container.querySelector('.bg-gray-50');
      expect(summaryBox).toBeInTheDocument();
    });
  });
});
