/**
 * Unit tests for ReviewChangeDateStep component
 *
 * Tests the change date review step:
 * - Header with review message
 * - Product info display
 * - Date comparison (current vs new, side-by-side)
 * - Price breakdown for both dates
 * - Price difference display (increase/decrease/same with correct colors)
 * - Payment plan impact (CONTADO vs PLAZOS)
 * - Installment details when applicable
 * - Important notes (conditional based on price change)
 * - Action buttons (back/confirm)
 *
 * @see src/components/reservation/ReviewChangeDateStep.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ReviewChangeDateStep from '../ReviewChangeDateStep';

describe('ReviewChangeDateStep', () => {
  const mockOnBack = jest.fn();
  const mockOnConfirm = jest.fn();

  const mockReservation = {
    id: 'reservation-123',
    adults: 2,
    kids: 1,
    babys: 0,
    reservation_date: '2030-06-15',
    price_per_person: 5000,
    price_per_kid: 2500,
    total_price: 12500,
    currency: 'MXN'
  };

  const mockPaymentPlanContado = {
    id: 'plan-123',
    plan_type: 'CONTADO',
    total_cost: 12500,
    currency: 'MXN'
  };

  const mockPaymentPlanPlazos = {
    id: 'plan-456',
    plan_type: 'PLAZOS',
    total_cost: 12500,
    currency: 'MXN',
    installments: [
      { installment_number: 1, amount: 4166.67, due_date: '2030-01-15', status: 'PAID' },
      { installment_number: 2, amount: 4166.67, due_date: '2030-02-15', status: 'PAID' },
      { installment_number: 3, amount: 4166.66, due_date: '2030-03-15', status: 'PENDING' }
    ]
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Circuito Baja California',
    product_type: 'circuit'
  };

  // Same price
  const mockNewDateDataSame = {
    newDate: '2030-08-20',
    seasonId: 'season-1',
    seasonName: 'Temporada Alta',
    newPricePerPerson: 5000,
    newPricePerKid: 2500,
    newTotalPrice: 12500
  };

  // Price increase
  const mockNewDateDataIncrease = {
    newDate: '2030-08-20',
    seasonId: 'season-2',
    seasonName: 'Temporada Premium',
    newPricePerPerson: 6000,
    newPricePerKid: 3000,
    newTotalPrice: 15000
  };

  // Price decrease
  const mockNewDateDataDecrease = {
    newDate: '2030-08-20',
    seasonId: 'season-3',
    seasonName: 'Temporada Baja',
    newPricePerPerson: 4000,
    newPricePerKid: 2000,
    newTotalPrice: 10000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // HEADER
  // ============================================================

  describe('Header', () => {
    it('renders review title', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Revisa los Cambios')).toBeInTheDocument();
    });

    it('renders verification instruction', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/Verifica que toda la información sea correcta/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // PRODUCT INFO
  // ============================================================

  describe('Product info', () => {
    it('renders product name', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Circuito Baja California')).toBeInTheDocument();
    });

    it('renders product type', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('circuit')).toBeInTheDocument();
    });

    it('renders "Producto" label', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Producto')).toBeInTheDocument();
    });
  });

  // ============================================================
  // DATE COMPARISON
  // ============================================================

  describe('Date comparison', () => {
    it('renders "Fecha Actual" section', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Fecha Actual')).toBeInTheDocument();
    });

    it('renders "Nueva Fecha" section', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Nueva Fecha')).toBeInTheDocument();
    });

    it('renders current date formatted in Spanish', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      // Check for June 2030 date - allow timezone variations
      expect(screen.getByText(/\d+ de junio de 2030/i)).toBeInTheDocument();
    });

    it('renders new date formatted in Spanish', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      // Check for August 2030 date
      expect(screen.getByText(/\d+ de agosto de 2030/i)).toBeInTheDocument();
    });

    it('renders season name for new date', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/Temporada: Temporada Alta/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // PRICE BREAKDOWN
  // ============================================================

  describe('Price breakdown', () => {
    it('renders adults count with price', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      // Both sections should show adults
      const adultsElements = screen.getAllByText(/Adultos \(2\):/);
      expect(adultsElements.length).toBe(2);
    });

    it('renders kids count with price when kids > 0', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      // Both sections should show kids
      const kidsElements = screen.getAllByText(/Niños \(1\):/);
      expect(kidsElements.length).toBe(2);
    });

    it('does not render kids when kids = 0', () => {
      const reservationNoKids = { ...mockReservation, kids: 0, price_per_kid: undefined };
      const newDateNoKids = { ...mockNewDateDataSame, newPricePerKid: undefined };

      render(
        <ReviewChangeDateStep
          reservation={reservationNoKids}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={newDateNoKids}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByText(/Niños/)).not.toBeInTheDocument();
    });

    it('renders "Desglose de Precios" labels', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      const desgloseElements = screen.getAllByText('Desglose de Precios');
      expect(desgloseElements.length).toBe(2);
    });

    it('renders totals for both dates', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      const totalLabels = screen.getAllByText('Total:');
      expect(totalLabels.length).toBe(2);
    });
  });

  // ============================================================
  // PRICE DIFFERENCE - SAME
  // ============================================================

  describe('Price difference - same', () => {
    it('renders "Precio Sin Cambios" when prices equal', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Precio Sin Cambios')).toBeInTheDocument();
    });

    it('renders "Sin Cambio en el Plan de Pagos" message', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Sin Cambio en el Plan de Pagos')).toBeInTheDocument();
    });
  });

  // ============================================================
  // PRICE DIFFERENCE - INCREASE
  // ============================================================

  describe('Price difference - increase', () => {
    it('renders increment message with difference', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataIncrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/Incremento de \$2,500\.00/)).toBeInTheDocument();
    });

    it('renders "Pago Adicional Requerido" for CONTADO', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataIncrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Pago Adicional Requerido')).toBeInTheDocument();
    });

    it('renders "Ajuste al Plan de Pagos" for PLAZOS with increase', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanPlazos}
          product={mockProduct}
          newDateData={mockNewDateDataIncrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Ajuste al Plan de Pagos')).toBeInTheDocument();
    });

    it('renders 48-hour payment note for price increase', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataIncrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/El pago adicional deberá realizarse dentro de las próximas 48 horas/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // PRICE DIFFERENCE - DECREASE
  // ============================================================

  describe('Price difference - decrease', () => {
    it('renders discount message with difference', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataDecrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/Descuento de \$2,500\.00/)).toBeInTheDocument();
    });

    it('renders "Reembolso Disponible" for CONTADO with decrease', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataDecrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Reembolso Disponible')).toBeInTheDocument();
    });

    it('renders refund description for CONTADO with decrease', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataDecrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/Recibirás un reembolso de \$2,500\.00/)).toBeInTheDocument();
    });

    it('renders "Ajuste al Plan de Pagos" for PLAZOS with decrease', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanPlazos}
          product={mockProduct}
          newDateData={mockNewDateDataDecrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Ajuste al Plan de Pagos')).toBeInTheDocument();
    });

    it('renders 5-7 days refund note for price decrease', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataDecrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/El reembolso se procesará en un plazo de 5-7 días hábiles/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // INSTALLMENTS SECTION
  // ============================================================

  describe('Installments section', () => {
    it('renders "Estado de Pagos" when has installments and price changed', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanPlazos}
          product={mockProduct}
          newDateData={mockNewDateDataIncrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Estado de Pagos:')).toBeInTheDocument();
    });

    it('renders paid installments count', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanPlazos}
          product={mockProduct}
          newDateData={mockNewDateDataIncrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Pagos completados:')).toBeInTheDocument();
      // 2 paid installments
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('renders pending installments count', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanPlazos}
          product={mockProduct}
          newDateData={mockNewDateDataIncrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Pagos pendientes:')).toBeInTheDocument();
      // 1 pending installment
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('does not render installment details when price is same', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanPlazos}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByText('Estado de Pagos:')).not.toBeInTheDocument();
    });

    it('does not render installment details for CONTADO', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataIncrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByText('Estado de Pagos:')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // IMPORTANT NOTES
  // ============================================================

  describe('Important notes', () => {
    it('renders "Notas Importantes" section', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Notas Importantes')).toBeInTheDocument();
    });

    it('renders immediate processing note', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/El cambio de fecha se procesará inmediatamente/)).toBeInTheDocument();
    });

    it('renders email confirmation note', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/Recibirás un correo de confirmación/)).toBeInTheDocument();
    });

    it('renders traveler data note', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/Los datos de los viajeros permanecerán sin cambios/)).toBeInTheDocument();
    });

    it('does not render payment timing note when price is same', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByText(/48 horas/)).not.toBeInTheDocument();
      expect(screen.queryByText(/5-7 días hábiles/)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // ACTION BUTTONS
  // ============================================================

  describe('Action buttons', () => {
    it('renders back button', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('← Cambiar Fecha')).toBeInTheDocument();
    });

    it('renders confirm button', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Confirmar Cambio →')).toBeInTheDocument();
    });

    it('calls onBack when back button clicked', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByText('← Cambiar Fecha'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when confirm button clicked', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByText('Confirmar Cambio →'));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // CURRENCY FORMATTING
  // ============================================================

  describe('Currency formatting', () => {
    it('formats MXN currency correctly', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      // Total price $12,500.00 should appear multiple times
      const priceElements = screen.getAllByText(/\$12,500\.00/);
      expect(priceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('formats adult prices correctly', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      // 2 adults x $5,000 = $10,000
      const adultPriceElements = screen.getAllByText(/\$10,000\.00/);
      expect(adultPriceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('formats kid prices correctly', () => {
      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      // 1 kid x $2,500 = $2,500
      const kidPriceElements = screen.getAllByText(/\$2,500\.00/);
      expect(kidPriceElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge cases', () => {
    it('handles large price difference', () => {
      const expensiveNewDate = {
        ...mockNewDateDataIncrease,
        newPricePerPerson: 50000,
        newPricePerKid: 25000,
        newTotalPrice: 125000
      };

      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={expensiveNewDate}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/Incremento de \$112,500\.00/)).toBeInTheDocument();
    });

    it('handles package product type', () => {
      const packageProduct = {
        ...mockProduct,
        product_type: 'package'
      };

      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={packageProduct}
          newDateData={mockNewDateDataSame}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('package')).toBeInTheDocument();
    });

    it('handles completed status for installments', () => {
      const planWithCompleted = {
        ...mockPaymentPlanPlazos,
        installments: [
          { installment_number: 1, amount: 4166.67, due_date: '2030-01-15', status: 'COMPLETED' },
          { installment_number: 2, amount: 4166.67, due_date: '2030-02-15', status: 'COMPLETED' },
          { installment_number: 3, amount: 4166.66, due_date: '2030-03-15', status: 'DUE' }
        ]
      };

      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={planWithCompleted}
          product={mockProduct}
          newDateData={mockNewDateDataIncrease}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      // 2 completed (counting as paid)
      expect(screen.getByText('2')).toBeInTheDocument();
      // 1 due (counting as pending)
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('handles no season name', () => {
      const noSeasonName = {
        ...mockNewDateDataSame,
        seasonName: undefined
      };

      render(
        <ReviewChangeDateStep
          reservation={mockReservation}
          paymentPlan={mockPaymentPlanContado}
          product={mockProduct}
          newDateData={noSeasonName}
          onBack={mockOnBack}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByText(/Temporada:/)).not.toBeInTheDocument();
    });
  });
});
