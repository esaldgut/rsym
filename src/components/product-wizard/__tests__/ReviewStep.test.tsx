/**
 * Unit tests for ReviewStep component
 *
 * Tests the final review step of the Product Wizard, including:
 * - Product summary display
 * - Validation warnings
 * - Publication flow (success/error)
 * - localStorage cleanup
 * - Navigation callbacks
 *
 * @see src/components/product-wizard/steps/ReviewStep.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewStep from '../steps/ReviewStep';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock toast manager
const mockToastShow = jest.fn();
jest.mock('@/components/ui/Toast', () => ({
  toastManager: {
    show: (...args: unknown[]) => mockToastShow(...args),
  },
}));

// Mock updateProductAction
const mockUpdateProductAction = jest.fn();
jest.mock('@/lib/server/product-creation-actions', () => ({
  updateProductAction: (...args: unknown[]) => mockUpdateProductAction(...args),
}));

// Mock validateForPublication
const mockValidateForPublication = jest.fn();
jest.mock('@/lib/validations/product-schemas', () => ({
  validateForPublication: (...args: unknown[]) => mockValidateForPublication(...args),
}));

// Default mock form data factory
const getDefaultMockFormData = () => ({
  productId: 'test-product-id',
  productType: 'circuit' as const,
  name: 'Test Circuit',
  description: 'A beautiful test circuit',
  languages: ['es', 'en'],
  preferences: ['aventura', 'naturaleza'],
  cover_image_url: 'https://example.com/cover.jpg',
  image_url: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  video_url: ['https://example.com/video.mp4'],
  destination: [
    { place: 'Ciudad de México', placeSub: 'Centro Histórico', coordinates: { latitude: 19.4326, longitude: -99.1332 } },
    { place: 'Oaxaca', placeSub: 'Monte Albán', coordinates: { latitude: 17.0732, longitude: -96.7266 } },
    { place: 'Chiapas', placeSub: 'Palenque', coordinates: { latitude: 17.4838, longitude: -92.0436 } },
  ],
  departures: {
    regular_departures: ['Monday', 'Friday'],
    specific_departures: ['2024-12-25'],
  },
  itinerary: 'Día 1: Ciudad de México\nDía 2: Oaxaca\nDía 3: Chiapas',
  seasons: [
    {
      category: 'Primera',
      start_date: '2024-01-01',
      end_date: '2024-06-30',
      prices: [
        { currency: 'MXN', price: 15000, room_name: 'Doble', max_adult: 2, max_minor: 2, children: [] },
      ],
      extra_prices: [],
      schedules: '',
      aditional_services: 'Desayuno incluido',
      number_of_nights: '',
    },
  ],
  planned_hotels_or_similar: ['Hotel Centro Histórico', 'Hotel Monte Albán'],
  payment_policy: {
    options: [
      {
        type: 'CONTADO',
        description: 'Pago completo al reservar',
        config: { cash: { discount: 5, deadline_days_to_pay: 7 } },
      },
      {
        type: 'PLAZOS',
        description: 'Pago en parcialidades',
        config: { installments: { down_payment_before: 30, down_payment_after: 70 } },
      },
    ],
    general_policies: {
      change_policy: {
        allows_date_change: true,
        deadline_days_to_make_change: 15,
      },
    },
  },
});

// Store current form data in a global that the mock can access
// Using global to avoid Jest hoisting issues
type FormDataType = ReturnType<typeof getDefaultMockFormData>;
(global as Record<string, FormDataType>).__mockFormData = getDefaultMockFormData();

// Helper function to set mock form data for specific tests
const setMockFormData = (data: FormDataType) => {
  (global as Record<string, FormDataType>).__mockFormData = data;
};

// Reset to default
const resetMockFormData = () => {
  (global as Record<string, FormDataType>).__mockFormData = getDefaultMockFormData();
};

jest.mock('@/context/ProductFormContext', () => ({
  useProductForm: () => {
    const formData = (global as Record<string, unknown>).__mockFormData;
    return { formData };
  },
}));

describe('ReviewStep', () => {
  const defaultProps = {
    userId: 'test-user-id',
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    onCancelClick: jest.fn(),
    isValid: true,
    resetUnsavedChanges: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default form data
    resetMockFormData();
    mockValidateForPublication.mockReturnValue({ isValid: true, errors: [] });
    mockUpdateProductAction.mockResolvedValue({ success: true, data: { id: 'test-product-id' } });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: jest.fn(),
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  // ============================================================
  // RENDERING TESTS
  // ============================================================

  describe('Rendering', () => {
    it('renders product name in header', () => {
      render(<ReviewStep {...defaultProps} />);

      // Product name appears in multiple places (header + info section)
      expect(screen.getAllByText('Test Circuit').length).toBeGreaterThanOrEqual(1);
    });

    it('renders destinations count', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('3 destinos')).toBeInTheDocument();
    });

    it('renders minimum price', () => {
      render(<ReviewStep {...defaultProps} />);

      // Price appears in multiple places (header stat + seasons section)
      expect(screen.getAllByText(/\$15,000 MXN/).length).toBeGreaterThanOrEqual(1);
    });

    it('renders season count', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('1 temporadas')).toBeInTheDocument();
    });

    it('renders Información General section', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Información General')).toBeInTheDocument();
      expect(screen.getByText('Nombre del Producto')).toBeInTheDocument();
      expect(screen.getByText('A beautiful test circuit')).toBeInTheDocument();
    });

    it('renders languages badges', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('es')).toBeInTheDocument();
      expect(screen.getByText('en')).toBeInTheDocument();
    });

    it('renders preferences badges', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('aventura')).toBeInTheDocument();
      expect(screen.getByText('naturaleza')).toBeInTheDocument();
    });

    it('renders route section with destinations', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText(/Ruta del Circuito/)).toBeInTheDocument();
      expect(screen.getByText('Ciudad de México')).toBeInTheDocument();
      expect(screen.getByText('Oaxaca')).toBeInTheDocument();
      expect(screen.getByText('Chiapas')).toBeInTheDocument();
    });

    it('renders seasons section', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Temporadas y Precios')).toBeInTheDocument();
      // "Primera" appears twice (header stat + season section), use getAllByText
      expect(screen.getAllByText('Primera').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('2024-01-01 - 2024-06-30')).toBeInTheDocument();
    });

    it('renders multimedia section with counts', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Contenido Multimedia')).toBeInTheDocument();
      expect(screen.getByText('✓ Cargada')).toBeInTheDocument();
      expect(screen.getByText('2 imágenes')).toBeInTheDocument();
      expect(screen.getByText('1 videos')).toBeInTheDocument();
    });

    it('renders itinerary section', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText(/Itinerario del Circuito/)).toBeInTheDocument();
      expect(screen.getByText(/Día 1: Ciudad de México/)).toBeInTheDocument();
    });

    it('renders hotels section', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Hoteles Planificados')).toBeInTheDocument();
      expect(screen.getByText('Hotel Centro Histórico')).toBeInTheDocument();
      expect(screen.getByText('Hotel Monte Albán')).toBeInTheDocument();
    });

    it('renders payment policies section', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Políticas de Pago')).toBeInTheDocument();
      expect(screen.getByText('Pago de Contado')).toBeInTheDocument();
      expect(screen.getByText('Pago en Plazos')).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('← Anterior')).toBeInTheDocument();
      expect(screen.getByText(/Publicar Circuito/)).toBeInTheDocument();
    });

    it('renders cancel button when onCancelClick provided', () => {
      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
  });

  // ============================================================
  // VALIDATION WARNING TESTS
  // ============================================================

  describe('Validation Warnings', () => {
    it('shows warning banner when validation fails', () => {
      mockValidateForPublication.mockReturnValue({
        isValid: false,
        summary: 'Faltan campos requeridos',
        errors: [
          { message: 'Falta imagen de portada' },
          { message: 'Falta descripción' },
        ],
      });

      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Campos Requeridos para Publicación')).toBeInTheDocument();
      expect(screen.getByText('Faltan campos requeridos')).toBeInTheDocument();
      expect(screen.getByText('Falta imagen de portada')).toBeInTheDocument();
      expect(screen.getByText('Falta descripción')).toBeInTheDocument();
    });

    it('shows "Publicar de Todos Modos" button when has warnings', () => {
      mockValidateForPublication.mockReturnValue({
        isValid: false,
        errors: [{ message: 'Falta campo' }],
      });

      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText(/Publicar de Todos Modos/)).toBeInTheDocument();
    });

    it('shows normal publish button when no warnings', () => {
      mockValidateForPublication.mockReturnValue({ isValid: true, errors: [] });

      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText(/Publicar Circuito/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // SUBMIT SUCCESS TESTS
  // ============================================================

  describe('Submit Success', () => {
    it('calls updateProductAction on submit', async () => {
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} />);

      await user.click(screen.getByText(/Publicar Circuito/));

      await waitFor(() => {
        expect(mockUpdateProductAction).toHaveBeenCalledWith(
          'test-product-id',
          expect.objectContaining({
            name: 'Test Circuit',
            published: true,
          })
        );
      });
    });

    it('shows success state after publish', async () => {
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} />);

      await user.click(screen.getByText(/Publicar Circuito/));

      await waitFor(() => {
        expect(screen.getByText(/¡Circuito Completado!/)).toBeInTheDocument();
      });
    });

    it('shows success toast', async () => {
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} />);

      await user.click(screen.getByText(/Publicar Circuito/));

      await waitFor(() => {
        expect(mockToastShow).toHaveBeenCalledWith(
          expect.stringContaining('Test Circuit'),
          'success',
          5000
        );
      });
    });

    it('cleans localStorage after success', async () => {
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} />);

      await user.click(screen.getByText(/Publicar Circuito/));

      await waitFor(() => {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('yaan-current-product-id');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('yaan-current-product-type');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('yaan-current-product-name');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('yaan-product-form-data');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('yaan-wizard-circuit');
      });
    });

    it('calls resetUnsavedChanges before redirect', async () => {
      const resetUnsavedChanges = jest.fn();
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} resetUnsavedChanges={resetUnsavedChanges} />);

      await user.click(screen.getByText(/Publicar Circuito/));

      await waitFor(() => {
        expect(resetUnsavedChanges).toHaveBeenCalled();
      });
    });

    it('redirects to products page after success', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<ReviewStep {...defaultProps} />);

      await user.click(screen.getByText(/Publicar Circuito/));

      await waitFor(() => {
        expect(screen.getByText(/Redirigiendo.../)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(3500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/provider/products');
      });

      jest.useRealTimers();
    });
  });

  // ============================================================
  // SUBMIT ERROR TESTS
  // ============================================================

  describe('Submit Error', () => {
    it('shows error message when update fails', async () => {
      mockUpdateProductAction.mockResolvedValue({
        success: false,
        error: 'Error de conexión',
      });
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} />);

      await user.click(screen.getByText(/Publicar Circuito/));

      await waitFor(() => {
        expect(screen.getByText('Error de conexión')).toBeInTheDocument();
      });
    });

    it('shows error toast when update fails', async () => {
      mockUpdateProductAction.mockResolvedValue({
        success: false,
        error: 'Error de servidor',
      });
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} />);

      await user.click(screen.getByText(/Publicar Circuito/));

      await waitFor(() => {
        expect(mockToastShow).toHaveBeenCalledWith(
          expect.stringContaining('Error de servidor'),
          'error',
          5000
        );
      });
    });

    it('shows error when productId is missing', async () => {
      const formDataWithNoProductId = getDefaultMockFormData();
      // @ts-expect-error - intentionally setting undefined for test
      formDataWithNoProductId.productId = undefined;
      setMockFormData(formDataWithNoProductId);
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} />);

      await user.click(screen.getByText(/Publicar/));

      await waitFor(() => {
        expect(screen.getByText(/No se encontró el ID del producto/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // LOADING STATE TESTS
  // ============================================================

  describe('Loading State', () => {
    it('shows loading spinner during submit', async () => {
      // Make updateProductAction slow
      mockUpdateProductAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
      );
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} />);

      await user.click(screen.getByText(/Publicar Circuito/));

      expect(screen.getByText('Publicando...')).toBeInTheDocument();
    });

    it('disables submit button during loading', async () => {
      mockUpdateProductAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
      );
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} />);

      const submitButton = screen.getByText(/Publicar Circuito/);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Publicando...').closest('button')).toBeDisabled();
      });
    });
  });

  // ============================================================
  // NAVIGATION TESTS
  // ============================================================

  describe('Navigation', () => {
    it('calls onPrevious when "Anterior" clicked', async () => {
      const onPrevious = jest.fn();
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} onPrevious={onPrevious} />);

      await user.click(screen.getByText('← Anterior'));

      expect(onPrevious).toHaveBeenCalled();
    });

    it('calls onCancelClick when "Cancelar" clicked', async () => {
      const onCancelClick = jest.fn();
      const user = userEvent.setup();

      render(<ReviewStep {...defaultProps} onCancelClick={onCancelClick} />);

      await user.click(screen.getByText('Cancelar'));

      expect(onCancelClick).toHaveBeenCalled();
    });
  });

  // ============================================================
  // PRODUCT TYPE VARIATIONS
  // ============================================================

  describe('Product Type Variations', () => {
    it('shows "Paquete" for package product type', () => {
      const formDataWithPackageType = getDefaultMockFormData();
      formDataWithPackageType.productType = 'package' as const;
      setMockFormData(formDataWithPackageType);

      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText(/Publicar Paquete/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles undefined destinations gracefully', () => {
      // Note: Component uses map() || fallback pattern, so fallback only shows for undefined
      const formDataWithUndefinedDestinations = getDefaultMockFormData();
      // @ts-expect-error - intentionally setting undefined for test
      formDataWithUndefinedDestinations.destination = undefined;
      setMockFormData(formDataWithUndefinedDestinations);

      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Sin destinos especificados')).toBeInTheDocument();
    });

    it('handles undefined seasons gracefully', () => {
      // Note: Component uses map() || fallback pattern, so fallback only shows for undefined
      const formDataWithUndefinedSeasons = getDefaultMockFormData();
      // @ts-expect-error - intentionally setting undefined for test
      formDataWithUndefinedSeasons.seasons = undefined;
      setMockFormData(formDataWithUndefinedSeasons);

      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Sin temporadas configuradas')).toBeInTheDocument();
    });

    it('handles empty destinations array without crash', () => {
      const formDataWithEmptyDestinations = getDefaultMockFormData();
      formDataWithEmptyDestinations.destination = [];
      setMockFormData(formDataWithEmptyDestinations);

      render(<ReviewStep {...defaultProps} />);

      // Component renders but destination section is hidden when empty
      // Verify component renders without crashing
      expect(screen.getByText('Información General')).toBeInTheDocument();
      // The "X destinos" stat is not rendered when destinations array is empty
      expect(screen.queryByText(/destinos/)).not.toBeInTheDocument();
    });

    it('handles empty seasons array without crash', () => {
      const formDataWithEmptySeasons = getDefaultMockFormData();
      formDataWithEmptySeasons.seasons = [];
      setMockFormData(formDataWithEmptySeasons);

      render(<ReviewStep {...defaultProps} />);

      // Component renders but seasons section in header is hidden when empty
      // Verify component renders without crashing
      expect(screen.getByText('Información General')).toBeInTheDocument();
      // The "X temporadas" stat is not rendered when seasons array is empty
      expect(screen.queryByText(/temporadas/)).not.toBeInTheDocument();
    });

    it('handles missing cover image', () => {
      const formDataWithNoCover = getDefaultMockFormData();
      formDataWithNoCover.cover_image_url = '';
      setMockFormData(formDataWithNoCover);

      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Sin cargar')).toBeInTheDocument();
    });

    it('handles missing product name', () => {
      const formDataWithNoName = getDefaultMockFormData();
      formDataWithNoName.name = '';
      setMockFormData(formDataWithNoName);

      render(<ReviewStep {...defaultProps} />);

      expect(screen.getByText('Producto Sin Nombre')).toBeInTheDocument();
    });
  });
});
