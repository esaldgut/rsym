/**
 * Unit tests for PackageDetailsStep component
 *
 * Tests the package details step with tab navigation:
 * - Package-specific labels and header
 * - Tab rendering and navigation
 * - Form submission behavior
 *
 * Note: Most structural tests are covered by ProductDetailsStep.test.tsx
 * This file focuses on package-specific differences.
 *
 * @see src/components/product-wizard/steps/PackageDetailsStep.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PackageDetailsStep from '../steps/PackageDetailsStep';

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

// Default mock form data for package
const getDefaultPackageFormData = () => ({
  productId: 'test-product-id',
  productType: 'package' as const,
  name: 'Test Package',
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

// Using global to avoid Jest hoisting issues
type FormDataType = ReturnType<typeof getDefaultPackageFormData>;
(global as Record<string, FormDataType>).__mockPackageDetailsFormData = getDefaultPackageFormData();

const setMockFormData = (data: Partial<FormDataType>) => {
  (global as Record<string, FormDataType>).__mockPackageDetailsFormData = {
    ...getDefaultPackageFormData(),
    ...data,
  } as FormDataType;
};

const resetMockFormData = () => {
  (global as Record<string, FormDataType>).__mockPackageDetailsFormData = getDefaultPackageFormData();
};

// Mock useProductForm hook
const mockUpdateFormData = jest.fn();
jest.mock('@/context/ProductFormContext', () => ({
  useProductForm: () => {
    const formData = (global as Record<string, unknown>).__mockPackageDetailsFormData;
    return {
      formData,
      updateFormData: mockUpdateFormData,
    };
  },
}));

describe('PackageDetailsStep', () => {
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
  // PACKAGE-SPECIFIC HEADER AND LABELS
  // ============================================================

  describe('Package-Specific Header', () => {
    it('renders header with package title', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      expect(screen.getByText('Configura tu Paquete')).toBeInTheDocument();
    });

    it('renders package description', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      expect(screen.getByText(/Paquete turístico con destino específico/)).toBeInTheDocument();
    });

    it('renders package badge', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      expect(screen.getByText('🎁 Paquete Turístico')).toBeInTheDocument();
    });
  });

  // ============================================================
  // TAB STRUCTURE
  // ============================================================

  describe('Tab Structure', () => {
    it('renders all 5 tabs', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      expect(screen.getByText('Destino del Paquete')).toBeInTheDocument();
      expect(screen.getByText('Salidas Garantizadas')).toBeInTheDocument();
      expect(screen.getByText('Itinerario')).toBeInTheDocument();
      expect(screen.getByText('Temporadas y Precios')).toBeInTheDocument();
      expect(screen.getByText('Hoteles Sugeridos')).toBeInTheDocument();
    });

    it('starts with destination tab active', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      const destTab = screen.getByText('Destino del Paquete');
      expect(destTab.closest('button')).toHaveClass('text-purple-600');
    });

    it('shows package destination requirement', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      expect(screen.getByText(/Paquete: Requiere exactamente 1 destino/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // TAB NAVIGATION
  // ============================================================

  describe('Tab Navigation', () => {
    it('navigates to departures tab', async () => {
      const user = userEvent.setup();
      render(<PackageDetailsStep {...defaultProps} />);

      await user.click(screen.getByText(/Siguiente: Salidas Garantizadas/));

      const departuresTab = screen.getByText('Salidas Garantizadas');
      expect(departuresTab.closest('button')).toHaveClass('text-purple-600');
    });

    it('navigates back to previous step when on first tab', async () => {
      const user = userEvent.setup();
      render(<PackageDetailsStep {...defaultProps} />);

      await user.click(screen.getByText('← Anterior'));

      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    it('can navigate by clicking tabs directly', async () => {
      const user = userEvent.setup();
      render(<PackageDetailsStep {...defaultProps} />);

      await user.click(screen.getByText('Itinerario'));

      const itineraryTab = screen.getByText('Itinerario');
      expect(itineraryTab.closest('button')).toHaveClass('text-purple-600');
    });
  });

  // ============================================================
  // TAB CONTENT
  // ============================================================

  describe('Tab Content', () => {
    it('renders LocationMultiSelector on destination tab', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      expect(screen.getByTestId('location-multi-selector')).toBeInTheDocument();
    });

    it('renders GuaranteedDeparturesSelector on departures tab', async () => {
      const user = userEvent.setup();
      render(<PackageDetailsStep {...defaultProps} />);

      await user.click(screen.getByText('Salidas Garantizadas'));

      expect(screen.getByTestId('departures-selector')).toBeInTheDocument();
    });

    it('renders SeasonConfiguration on seasons tab', async () => {
      const user = userEvent.setup();
      render(<PackageDetailsStep {...defaultProps} />);

      await user.click(screen.getByText('Temporadas y Precios'));

      expect(screen.getByTestId('season-configuration')).toBeInTheDocument();
    });
  });

  // ============================================================
  // NAVIGATION BUTTONS
  // ============================================================

  describe('Navigation Buttons', () => {
    it('renders SaveDraftButton', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      expect(screen.getByTestId('save-draft-button')).toBeInTheDocument();
    });

    it('renders cancel button when onCancelClick provided', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument();
    });

    it('calls onCancelClick when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<PackageDetailsStep {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Cancelar/ }));

      expect(defaultProps.onCancelClick).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

  describe('Form Submission', () => {
    it('shows submit button on last tab (hotels)', async () => {
      const user = userEvent.setup();
      render(<PackageDetailsStep {...defaultProps} />);

      await user.click(screen.getByText('Hoteles Sugeridos'));

      expect(screen.getByText('Continuar al Siguiente Paso →')).toBeInTheDocument();
    });

    it('submit button is type="submit" on last tab', async () => {
      const user = userEvent.setup();
      render(<PackageDetailsStep {...defaultProps} />);

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
      expect(() => render(<PackageDetailsStep {...defaultProps} />)).not.toThrow();
    });

    it('handles undefined seasons gracefully', () => {
      setMockFormData({ seasons: undefined as unknown as [] });
      expect(() => render(<PackageDetailsStep {...defaultProps} />)).not.toThrow();
    });
  });

  // ============================================================
  // STYLING
  // ============================================================

  describe('Styling', () => {
    it('header has gradient styling', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      const header = screen.getByText('Configura tu Paquete').closest('div');
      expect(header).toHaveClass('bg-gradient-to-r');
    });

    it('next button has gradient styling', () => {
      render(<PackageDetailsStep {...defaultProps} />);

      const button = screen.getByText(/Siguiente:/).closest('button');
      expect(button).toHaveClass('bg-gradient-to-r');
    });
  });
});
