/**
 * Unit tests for SelectNewDateStep component
 *
 * Tests the date selection step for changing reservation date:
 * - Loading state while fetching seasons
 * - Error state handling with retry
 * - Empty state when no seasons available
 * - Current date information display
 * - Season selection cards
 * - Date picker behavior
 * - Price calculation preview
 * - Action buttons (cancel/continue)
 * - Validation logic
 *
 * @see src/components/reservation/SelectNewDateStep.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SelectNewDateStep from '../SelectNewDateStep';

// Mock the server action
jest.mock('@/lib/server/marketplace-product-actions', () => ({
  getProductSeasonsAction: jest.fn()
}));

import { getProductSeasonsAction } from '@/lib/server/marketplace-product-actions';
const mockGetProductSeasonsAction = getProductSeasonsAction as jest.MockedFunction<typeof getProductSeasonsAction>;

describe('SelectNewDateStep', () => {
  const mockReservation = {
    id: 'reservation-123',
    experience_id: 'exp-456',
    adults: 2,
    kids: 1,
    babys: 0,
    reservation_date: '2025-06-15T12:00:00.000Z',
    price_per_person: 5000,
    total_price: 15000,
    currency: 'MXN'
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Circuito Mágico',
    product_type: 'circuit'
  };

  // Use far future dates to ensure validation passes
  const mockSeasons = [
    {
      id: 'season-1',
      season_name: 'Temporada Alta',
      start_date: '2030-07-01',
      end_date: '2030-08-31',
      is_active: true,
      adult_base_price: 6000,
      child_ranges: [
        { name: 'Niño', min_minor_age: 2, max_minor_age: 12, child_price: 3000 }
      ]
    },
    {
      id: 'season-2',
      season_name: 'Temporada Baja',
      start_date: '2030-09-01',
      end_date: '2030-11-30',
      is_active: true,
      adult_base_price: 4500,
      child_ranges: [
        { name: 'Niño', min_minor_age: 2, max_minor_age: 12, child_price: 2250 }
      ]
    }
  ];

  const mockOnDateSelected = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: successful load
    mockGetProductSeasonsAction.mockResolvedValue({
      success: true,
      data: mockSeasons
    });
  });

  // ============================================================
  // LOADING STATE
  // ============================================================

  describe('Loading state', () => {
    it('displays loading spinner initially', () => {
      // Make the promise never resolve to keep in loading state
      mockGetProductSeasonsAction.mockImplementation(() => new Promise(() => {}));

      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Cargando temporadas disponibles...')).toBeInTheDocument();
    });

    it('shows spinner animation', () => {
      mockGetProductSeasonsAction.mockImplementation(() => new Promise(() => {}));

      const { container } = render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // ============================================================
  // ERROR STATE
  // ============================================================

  describe('Error state', () => {
    it('displays error message on fetch failure', async () => {
      mockGetProductSeasonsAction.mockResolvedValue({
        success: false,
        error: 'Error de conexión'
      });

      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Error de conexión')).toBeInTheDocument();
      });
    });

    it('displays retry button on error', async () => {
      mockGetProductSeasonsAction.mockResolvedValue({
        success: false,
        error: 'Error de conexión'
      });

      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });
    });

    it('retries fetch when retry button clicked', async () => {
      mockGetProductSeasonsAction.mockResolvedValueOnce({
        success: false,
        error: 'Error de conexión'
      });

      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });

      mockGetProductSeasonsAction.mockResolvedValueOnce({
        success: true,
        data: mockSeasons
      });

      fireEvent.click(screen.getByText('Reintentar'));

      expect(mockGetProductSeasonsAction).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // EMPTY STATE
  // ============================================================

  describe('Empty state', () => {
    it('displays empty message when no seasons', async () => {
      mockGetProductSeasonsAction.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No hay temporadas disponibles en este momento')).toBeInTheDocument();
      });
    });

    it('displays close button on empty state', async () => {
      mockGetProductSeasonsAction.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cerrar')).toBeInTheDocument();
      });
    });

    it('calls onCancel when close button clicked', async () => {
      mockGetProductSeasonsAction.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cerrar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cerrar'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('filters out inactive seasons', async () => {
      mockGetProductSeasonsAction.mockResolvedValue({
        success: true,
        data: [{ ...mockSeasons[0], is_active: false }]
      });

      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No hay temporadas disponibles en este momento')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // CURRENT DATE INFO
  // ============================================================

  describe('Current date info', () => {
    it('displays "Fecha Actual de Viaje" heading', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Fecha Actual de Viaje')).toBeInTheDocument();
      });
    });

    it('displays formatted current reservation date', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        // Allow for timezone variations
        expect(screen.getByText(/\d+ de junio de 2025/i)).toBeInTheDocument();
      });
    });

    it('displays current total price', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Total actual: \$15,000\.00/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // SEASONS SELECTION
  // ============================================================

  describe('Seasons selection', () => {
    it('displays "Selecciona una Temporada" heading', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Selecciona una Temporada')).toBeInTheDocument();
      });
    });

    it('displays all active seasons', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
        expect(screen.getByText('Temporada Baja')).toBeInTheDocument();
      });
    });

    it('displays season adult price', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('$6,000.00')).toBeInTheDocument(); // Season 1 adult price
      });
    });

    it('displays season child price', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('$3,000.00')).toBeInTheDocument(); // Season 1 child price
      });
    });

    it('selects season when clicked', async () => {
      const { container } = render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      // Should have selected styling
      await waitFor(() => {
        const selectedCard = container.querySelector('.border-blue-500');
        expect(selectedCard).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // DATE PICKER
  // ============================================================

  describe('Date picker', () => {
    it('does not show date picker before season selection', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      expect(screen.queryByText('Selecciona Nueva Fecha de Viaje')).not.toBeInTheDocument();
    });

    it('shows date picker after season selection', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        expect(screen.getByText('Selecciona Nueva Fecha de Viaje')).toBeInTheDocument();
      });
    });

    it('displays date input with type="date"', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Selecciona Nueva Fecha de Viaje');
        expect(dateInput).toHaveAttribute('type', 'date');
      });
    });

    it('displays available range text', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        expect(screen.getByText(/Rango disponible:/)).toBeInTheDocument();
      });
    });

    it('resets date when changing season', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      // Select first season and set date
      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Selecciona Nueva Fecha de Viaje') as HTMLInputElement;
        fireEvent.change(dateInput, { target: { value: '2030-07-15' } });
        expect(dateInput.value).toBe('2030-07-15');
      });

      // Select different season - date should reset
      fireEvent.click(screen.getByText('Temporada Baja'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Selecciona Nueva Fecha de Viaje') as HTMLInputElement;
        expect(dateInput.value).toBe('');
      });
    });
  });

  // ============================================================
  // PRICE PREVIEW
  // ============================================================

  describe('Price preview', () => {
    it('does not show price preview without date selection', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      expect(screen.queryByText('Nuevo Precio Estimado')).not.toBeInTheDocument();
    });

    it('shows price preview after date selection', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Selecciona Nueva Fecha de Viaje');
        fireEvent.change(dateInput, { target: { value: '2030-07-15' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Nuevo Precio Estimado')).toBeInTheDocument();
      });
    });

    it('displays calculated adult price', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Selecciona Nueva Fecha de Viaje');
        fireEvent.change(dateInput, { target: { value: '2030-07-15' } });
      });

      await waitFor(() => {
        // 2 adults * $6000 = $12,000
        expect(screen.getByText('$12,000.00')).toBeInTheDocument();
      });
    });

    it('displays calculated child price', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Selecciona Nueva Fecha de Viaje');
        fireEvent.change(dateInput, { target: { value: '2030-07-15' } });
      });

      await waitFor(() => {
        // Should show Niños count
        expect(screen.getByText(/Niños \(1\)/)).toBeInTheDocument();
      });
    });

    it('displays total calculated price', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Selecciona Nueva Fecha de Viaje');
        fireEvent.change(dateInput, { target: { value: '2030-07-15' } });
      });

      await waitFor(() => {
        // Total appears in both current date info and price preview
        // 2 adults * $6000 + 1 kid * $3000 = $15,000
        const totalElements = screen.getAllByText('$15,000.00');
        expect(totalElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ============================================================
  // ACTION BUTTONS
  // ============================================================

  describe('Action buttons', () => {
    it('displays cancel button', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });
    });

    it('calls onCancel when cancel clicked', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancelar'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('displays continue button', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Continuar →')).toBeInTheDocument();
      });
    });

    it('continue button is disabled without date selection', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const continueButton = screen.getByText('Continuar →');
        expect(continueButton).toBeDisabled();
      });
    });

    it('continue button is enabled with date selection', async () => {
      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Selecciona Nueva Fecha de Viaje');
        fireEvent.change(dateInput, { target: { value: '2030-07-15' } });
      });

      await waitFor(() => {
        const continueButton = screen.getByText('Continuar →');
        expect(continueButton).not.toBeDisabled();
      });
    });
  });

  // ============================================================
  // VALIDATION
  // ============================================================

  describe('Validation', () => {
    // Note: Validation tests that use alert() are harder to test
    // We can test that onDateSelected is called with correct data
    it('calls onDateSelected with correct data when continuing', async () => {
      // Mock alert to prevent actual alerts in test
      const originalAlert = window.alert;
      window.alert = jest.fn();

      render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Selecciona Nueva Fecha de Viaje');
        fireEvent.change(dateInput, { target: { value: '2030-07-15' } });
      });

      fireEvent.click(screen.getByText('Continuar →'));

      // Restore alert
      window.alert = originalAlert;

      await waitFor(() => {
        expect(mockOnDateSelected).toHaveBeenCalledWith(
          expect.objectContaining({
            newDate: '2030-07-15',
            newPricePerPerson: 6000,
            newPricePerKid: 3000,
            newTotalPrice: 15000, // 2*6000 + 1*3000
            seasonName: 'Temporada Alta',
            seasonId: 'season-1'
          })
        );
      });
    });
  });

  // ============================================================
  // STRUCTURAL ELEMENTS
  // ============================================================

  describe('Structural elements', () => {
    it('has blue background for price preview', async () => {
      const { container } = render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Temporada Alta')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Temporada Alta'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Selecciona Nueva Fecha de Viaje');
        fireEvent.change(dateInput, { target: { value: '2030-07-15' } });
      });

      await waitFor(() => {
        const pricePreview = container.querySelector('.bg-blue-50');
        expect(pricePreview).toBeInTheDocument();
      });
    });

    it('has gray background for current date info', async () => {
      const { container } = render(
        <SelectNewDateStep
          reservation={mockReservation}
          product={mockProduct}
          onDateSelected={mockOnDateSelected}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const currentDateBox = container.querySelector('.bg-gray-50');
        expect(currentDateBox).toBeInTheDocument();
      });
    });
  });
});
