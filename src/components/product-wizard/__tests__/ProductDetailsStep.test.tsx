/**
 * Unit tests for ProductDetailsStep component
 *
 * Tests the circuit details step with tab navigation:
 * - Tab rendering (destination, departures, itinerary, seasons, hotels)
 * - Tab navigation (next/previous)
 * - Tab completion indicators
 * - Form submission behavior
 * - Product type variations (circuit vs package)
 *
 * @see src/components/product-wizard/steps/ProductDetailsStep.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductDetailsStep from '../steps/ProductDetailsStep';

// Mock toastManager
jest.mock('@/components/ui/Toast', () => ({
  toastManager: {
    show: jest.fn(),
  },
}));

// Mock LocationMultiSelector
jest.mock('@/components/location/LocationMultiSelector', () => ({
  LocationMultiSelector: ({ selectedLocations }: { selectedLocations: unknown[] }) => (
    <div data-testid="location-multi-selector" data-count={selectedLocations?.length || 0}>
      LocationMultiSelector: {selectedLocations?.length || 0} locations
    </div>
  ),
}));

// Mock GuaranteedDeparturesSelector
jest.mock('../components/GuaranteedDeparturesSelector', () => ({
  GuaranteedDeparturesSelector: () => (
    <div data-testid="departures-selector">GuaranteedDeparturesSelector</div>
  ),
}));

// Mock SeasonConfiguration
jest.mock('../components/SeasonConfiguration', () => ({
  SeasonConfiguration: ({ seasons }: { seasons: unknown[] }) => (
    <div data-testid="season-configuration" data-count={seasons?.length || 0}>
      SeasonConfiguration: {seasons?.length || 0} seasons
    </div>
  ),
}));

// Mock SaveDraftButton
jest.mock('@/components/product-wizard/SaveDraftButton', () => ({
  SaveDraftButton: ({ variant }: { variant?: string }) => (
    <button data-testid="save-draft-button" data-variant={variant}>
      Guardar Borrador
    </button>
  ),
}));

// Default mock form data for circuit
const getDefaultCircuitFormData = () => ({
  productId: 'test-product-id',
  productType: 'circuit' as const,
  name: 'Test Circuit',
  description: 'Test description',
  preferences: [],
  languages: [],
  cover_image_url: '',
  image_url: [],
  video_url: [],
  destination: [],
  seasons: [],
  departures: { regular_departures: [], specific_departures: [] },
  itinerary: '',
  planned_hotels_or_similar: [],
  payment_policy: {
    options: [],
    general_policies: { change_policy: {} }
  }
});

// Default mock form data for package
const getDefaultPackageFormData = () => ({
  ...getDefaultCircuitFormData(),
  productType: 'package' as const,
});

// Using global to avoid Jest hoisting issues
type FormDataType = ReturnType<typeof getDefaultCircuitFormData>;
(global as Record<string, FormDataType>).__mockProductDetailsFormData = getDefaultCircuitFormData();

const setMockFormData = (data: Partial<FormDataType>) => {
  (global as Record<string, FormDataType>).__mockProductDetailsFormData = {
    ...getDefaultCircuitFormData(),
    ...data,
  } as FormDataType;
};

const resetMockFormData = () => {
  (global as Record<string, FormDataType>).__mockProductDetailsFormData = getDefaultCircuitFormData();
};

// Mock useProductForm hook
const mockUpdateFormData = jest.fn();
jest.mock('@/context/ProductFormContext', () => ({
  useProductForm: () => {
    const formData = (global as Record<string, unknown>).__mockProductDetailsFormData;
    return {
      formData,
      updateFormData: mockUpdateFormData,
    };
  },
}));

describe('ProductDetailsStep', () => {
  const defaultProps = {
    userId: 'test-user-id',
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    onCancelClick: jest.fn(),
    isValid: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetMockFormData();
  });

  // ============================================================
  // RENDERING TESTS - CIRCUIT
  // ============================================================

  describe('Rendering - Circuit Type', () => {
    beforeEach(() => {
      setMockFormData({ productType: 'circuit' });
    });

    it('renders header with circuit title', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText('Configura tu Circuito')).toBeInTheDocument();
    });

    it('renders circuit description', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText(/Circuito turístico con múltiples destinos/)).toBeInTheDocument();
    });

    it('renders circuit badge', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText('🗺️ Circuito Turístico')).toBeInTheDocument();
    });

    it('renders all 5 tabs for circuit', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText('Destinos del Circuito')).toBeInTheDocument();
      expect(screen.getByText('Salidas Garantizadas')).toBeInTheDocument();
      expect(screen.getByText('Itinerario')).toBeInTheDocument();
      expect(screen.getByText('Temporadas y Precios')).toBeInTheDocument();
      expect(screen.getByText('Hoteles Sugeridos')).toBeInTheDocument();
    });

    it('starts with destination tab active', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      // Destination tab should be highlighted (has purple color)
      const destTab = screen.getByText('Destinos del Circuito');
      expect(destTab.closest('button')).toHaveClass('text-purple-600');
    });

    it('shows circuit requirement info', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText(/Circuito: Requiere mínimo 2 destinos/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // RENDERING TESTS - PACKAGE
  // ============================================================

  describe('Rendering - Package Type', () => {
    beforeEach(() => {
      setMockFormData({ productType: 'package' });
    });

    it('renders header with package title', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText('Configura tu Paquete')).toBeInTheDocument();
    });

    it('renders package description', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText(/Paquete turístico con destino específico/)).toBeInTheDocument();
    });

    it('renders package badge', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText('🎁 Paquete Turístico')).toBeInTheDocument();
    });

    it('renders only 4 tabs for package (no hotels)', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText('Destino del Paquete')).toBeInTheDocument();
      expect(screen.getByText('Salidas Garantizadas')).toBeInTheDocument();
      expect(screen.getByText('Itinerario')).toBeInTheDocument();
      expect(screen.getByText('Temporadas y Precios')).toBeInTheDocument();
      expect(screen.queryByText('Hoteles Sugeridos')).not.toBeInTheDocument();
    });

    it('shows package requirement info', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText(/Paquete: Requiere exactamente 1 destino/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // TAB NAVIGATION TESTS
  // ============================================================

  describe('Tab Navigation', () => {
    beforeEach(() => {
      setMockFormData({ productType: 'circuit' });
    });

    it('shows next tab button with correct label on first tab', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByText(/Siguiente: Salidas Garantizadas/)).toBeInTheDocument();
    });

    it('navigates to departures tab when next clicked', async () => {
      const user = userEvent.setup();
      render(<ProductDetailsStep {...defaultProps} />);

      await user.click(screen.getByText(/Siguiente: Salidas Garantizadas/));

      // Departures tab should now be active
      const departuresTab = screen.getByText('Salidas Garantizadas');
      expect(departuresTab.closest('button')).toHaveClass('text-purple-600');
    });

    it('shows previous tab button with correct label', async () => {
      const user = userEvent.setup();
      render(<ProductDetailsStep {...defaultProps} />);

      // Navigate to departures tab
      await user.click(screen.getByText(/Siguiente: Salidas Garantizadas/));

      expect(screen.getByText(/← Anterior: Destinos del Circuito/)).toBeInTheDocument();
    });

    it('navigates back to previous tab', async () => {
      const user = userEvent.setup();
      render(<ProductDetailsStep {...defaultProps} />);

      // Navigate to departures tab
      await user.click(screen.getByText(/Siguiente: Salidas Garantizadas/));

      // Navigate back
      await user.click(screen.getByText(/← Anterior: Destinos del Circuito/));

      // Destination tab should be active again
      const destTab = screen.getByText('Destinos del Circuito');
      expect(destTab.closest('button')).toHaveClass('text-purple-600');
    });

    it('calls onPrevious when on first tab and previous clicked', async () => {
      const user = userEvent.setup();
      render(<ProductDetailsStep {...defaultProps} />);

      await user.click(screen.getByText('← Anterior'));

      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    it('can navigate by clicking tab buttons directly', async () => {
      const user = userEvent.setup();
      render(<ProductDetailsStep {...defaultProps} />);

      // Click itinerary tab directly
      await user.click(screen.getByText('Itinerario'));

      // Itinerary tab should be active
      const itineraryTab = screen.getByText('Itinerario');
      expect(itineraryTab.closest('button')).toHaveClass('text-purple-600');
    });
  });

  // ============================================================
  // TAB COMPLETION INDICATORS
  // ============================================================

  describe('Tab Completion Indicators', () => {
    it('shows checkmark when destination has locations', () => {
      setMockFormData({
        productType: 'circuit',
        destination: [{ place: 'Mexico City', coordinates: { latitude: 19.4, longitude: -99.1 } }],
      });
      render(<ProductDetailsStep {...defaultProps} />);

      // There should be a checkmark near destination tab
      expect(screen.getByTitle('Tab completado')).toBeInTheDocument();
    });

    it('does not show checkmark when destination is empty', () => {
      setMockFormData({ productType: 'circuit', destination: [] });
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.queryByTitle('Tab completado')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // TAB CONTENT TESTS
  // ============================================================

  describe('Tab Content', () => {
    beforeEach(() => {
      setMockFormData({ productType: 'circuit' });
    });

    it('renders LocationMultiSelector on destination tab', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByTestId('location-multi-selector')).toBeInTheDocument();
    });

    it('renders GuaranteedDeparturesSelector on departures tab', async () => {
      const user = userEvent.setup();
      render(<ProductDetailsStep {...defaultProps} />);

      await user.click(screen.getByText('Salidas Garantizadas'));

      expect(screen.getByTestId('departures-selector')).toBeInTheDocument();
    });

    it('renders itinerary textarea on itinerary tab', async () => {
      const user = userEvent.setup();
      render(<ProductDetailsStep {...defaultProps} />);

      await user.click(screen.getByText('Itinerario'));

      expect(screen.getByPlaceholderText(/Día 1: Llegada/)).toBeInTheDocument();
    });

    it('renders SeasonConfiguration on seasons tab', async () => {
      const user = userEvent.setup();
      render(<ProductDetailsStep {...defaultProps} />);

      await user.click(screen.getByText('Temporadas y Precios'));

      expect(screen.getByTestId('season-configuration')).toBeInTheDocument();
    });

    it('renders hotels textarea on hotels tab (circuit only)', async () => {
      const user = userEvent.setup();
      render(<ProductDetailsStep {...defaultProps} />);

      await user.click(screen.getByText('Hoteles Sugeridos'));

      // Placeholder starts with "Ejemplo:" and contains hotel info
      expect(screen.getByPlaceholderText(/Ejemplo:/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // NAVIGATION BUTTONS
  // ============================================================

  describe('Navigation Buttons', () => {
    it('renders SaveDraftButton', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByTestId('save-draft-button')).toBeInTheDocument();
    });

    it('renders cancel button when onCancelClick provided', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument();
    });

    it('does not render cancel button when onCancelClick not provided', () => {
      const propsWithoutCancel = { ...defaultProps, onCancelClick: undefined };
      render(<ProductDetailsStep {...propsWithoutCancel} />);

      expect(screen.queryByRole('button', { name: /^Cancelar$/ })).not.toBeInTheDocument();
    });

    it('calls onCancelClick when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<ProductDetailsStep {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Cancelar/ }));

      expect(defaultProps.onCancelClick).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

  describe('Form Submission', () => {
    it('shows submit button on last tab (circuit - hotels)', async () => {
      const user = userEvent.setup();
      setMockFormData({ productType: 'circuit' });
      render(<ProductDetailsStep {...defaultProps} />);

      // Navigate to last tab (hotels for circuit)
      await user.click(screen.getByText('Hoteles Sugeridos'));

      expect(screen.getByText('Continuar al Siguiente Paso →')).toBeInTheDocument();
    });

    it('shows submit button on last tab (package - seasons)', async () => {
      const user = userEvent.setup();
      setMockFormData({ productType: 'package' });
      render(<ProductDetailsStep {...defaultProps} />);

      // Navigate to last tab (seasons for package)
      await user.click(screen.getByText('Temporadas y Precios'));

      expect(screen.getByText('Continuar al Siguiente Paso →')).toBeInTheDocument();
    });

    it('next button is type="button" on intermediate tabs', () => {
      setMockFormData({ productType: 'circuit' });
      render(<ProductDetailsStep {...defaultProps} />);

      const nextButton = screen.getByText(/Siguiente: Salidas Garantizadas/).closest('button');
      expect(nextButton).toHaveAttribute('type', 'button');
    });

    it('next button is type="submit" on last tab', async () => {
      const user = userEvent.setup();
      setMockFormData({ productType: 'circuit' });
      render(<ProductDetailsStep {...defaultProps} />);

      // Navigate to last tab
      await user.click(screen.getByText('Hoteles Sugeridos'));

      const submitButton = screen.getByText('Continuar al Siguiente Paso →').closest('button');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles undefined destination gracefully', () => {
      setMockFormData({ destination: undefined as unknown as [] });
      expect(() => render(<ProductDetailsStep {...defaultProps} />)).not.toThrow();
    });

    it('handles undefined seasons gracefully', () => {
      setMockFormData({ seasons: undefined as unknown as [] });
      expect(() => render(<ProductDetailsStep {...defaultProps} />)).not.toThrow();
    });

    it('handles undefined departures gracefully', () => {
      setMockFormData({ departures: undefined as unknown as { regular_departures: []; specific_departures: [] } });
      expect(() => render(<ProductDetailsStep {...defaultProps} />)).not.toThrow();
    });
  });

  // ============================================================
  // GRADIENT STYLING
  // ============================================================

  describe('Styling', () => {
    it('header has gradient styling', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      const header = screen.getByText('Configura tu Circuito').closest('div');
      expect(header).toHaveClass('bg-gradient-to-r');
    });

    it('next button has gradient styling', () => {
      render(<ProductDetailsStep {...defaultProps} />);

      const button = screen.getByText(/Siguiente:/).closest('button');
      expect(button).toHaveClass('bg-gradient-to-r');
    });
  });
});
