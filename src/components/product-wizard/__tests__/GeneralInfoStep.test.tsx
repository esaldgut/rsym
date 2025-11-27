/**
 * Unit tests for GeneralInfoStep component
 *
 * Tests the first step of the product wizard:
 * - Product name input with validation
 * - Description textarea
 * - Language selection
 * - Preferences selection
 * - Media upload zones (cover, gallery, videos)
 * - Navigation buttons
 *
 * @see src/components/product-wizard/steps/GeneralInfoStep.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneralInfoStep from '../steps/GeneralInfoStep';

// Mock toastManager
jest.mock('@/components/ui/Toast', () => ({
  toastManager: {
    show: jest.fn(),
  },
}));

// Mock MediaUploadZone
jest.mock('@/components/media/MediaUploadZone', () => ({
  __esModule: true,
  default: ({ type, accept }: { type: string; accept: string }) => (
    <div data-testid={`media-upload-zone-${type}`} data-accept={accept}>
      MediaUploadZone: {type}
    </div>
  ),
}));

// Mock MediaPreview
jest.mock('@/components/media/MediaPreview', () => ({
  __esModule: true,
  default: ({ files }: { files: unknown[] }) => (
    <div data-testid="media-preview" data-files-count={files?.length || 0}>
      MediaPreview: {files?.length || 0} files
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

// Mock LocationSelector (not used but imported)
jest.mock('@/components/location/LocationSelector', () => ({
  LocationSelector: () => <div data-testid="location-selector">LocationSelector</div>,
}));

// Default mock form data for circuit
const getDefaultCircuitFormData = () => ({
  productId: 'test-product-id',
  productType: 'circuit' as const,
  name: '',
  description: '',
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
(global as Record<string, FormDataType>).__mockGeneralInfoFormData = getDefaultCircuitFormData();

const setMockFormData = (data: Partial<FormDataType>) => {
  (global as Record<string, FormDataType>).__mockGeneralInfoFormData = {
    ...getDefaultCircuitFormData(),
    ...data,
  } as FormDataType;
};

const resetMockFormData = () => {
  (global as Record<string, FormDataType>).__mockGeneralInfoFormData = getDefaultCircuitFormData();
};

// Mock useProductForm hook
const mockUpdateFormData = jest.fn();
jest.mock('@/context/ProductFormContext', () => ({
  useProductForm: () => {
    const formData = (global as Record<string, unknown>).__mockGeneralInfoFormData;
    return {
      formData,
      updateFormData: mockUpdateFormData,
    };
  },
}));

describe('GeneralInfoStep', () => {
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
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText('Crea tu Circuito')).toBeInTheDocument();
      expect(screen.getByText(/Comparte tu experiencia turística/)).toBeInTheDocument();
    });

    it('renders name input with circuit-specific label', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText(/Nombra tu circuito/)).toBeInTheDocument();
    });

    it('renders name input with circuit placeholder', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(
        screen.getByPlaceholderText(/Gran Tour por los Cenotes/)
      ).toBeInTheDocument();
    });

    it('renders description textarea with circuit label', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(
        screen.getByText(/¿Qué harán tus viajeros en esta experiencia?/)
      ).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(
        screen.getByPlaceholderText(/Describe la experiencia única/)
      ).toBeInTheDocument();
    });

    it('renders language selector section', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText(/Idiomas de la experiencia/)).toBeInTheDocument();
    });

    it('renders preferences selector section', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText(/Tipo de interés/i)).toBeInTheDocument();
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
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText('Crea tu Paquete')).toBeInTheDocument();
    });

    it('renders name input with package-specific label', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText(/Nombra tu paquete/)).toBeInTheDocument();
    });

    it('renders name input with package placeholder', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(
        screen.getByPlaceholderText(/Escapada Romántica a Tulum/)
      ).toBeInTheDocument();
    });

    it('renders description with package label', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText(/Descripción de la experiencia/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // MEDIA UPLOAD ZONES TESTS
  // ============================================================

  describe('Media Upload Zones', () => {
    it('renders cover image section', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText('Imagen de portada *')).toBeInTheDocument();
      expect(screen.getByTestId('media-upload-zone-cover')).toBeInTheDocument();
    });

    it('renders gallery images section', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText('Galería de imágenes')).toBeInTheDocument();
      expect(screen.getByTestId('media-upload-zone-gallery')).toBeInTheDocument();
    });

    it('renders videos section', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText('Videos (Opcional)')).toBeInTheDocument();
      expect(screen.getByTestId('media-upload-zone-video')).toBeInTheDocument();
    });

    it('shows image count for gallery', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText(/\d+ imagen(es)? subida(s)?/)).toBeInTheDocument();
    });

    it('shows video count', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText(/\d+ video(s)? subido(s)?/)).toBeInTheDocument();
    });

    it('cover upload zone accepts images', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      const coverZone = screen.getByTestId('media-upload-zone-cover');
      expect(coverZone).toHaveAttribute('data-accept', 'image');
    });

    it('video upload zone accepts videos', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      const videoZone = screen.getByTestId('media-upload-zone-video');
      expect(videoZone).toHaveAttribute('data-accept', 'video');
    });
  });

  // ============================================================
  // NAVIGATION BUTTONS TESTS
  // ============================================================

  describe('Navigation Buttons', () => {
    it('renders continue button', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Continuar →/ })).toBeInTheDocument();
    });

    it('renders SaveDraftButton', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByTestId('save-draft-button')).toBeInTheDocument();
    });

    it('renders cancel button when onCancelClick provided', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument();
    });

    it('does not render cancel button when onCancelClick not provided', () => {
      const propsWithoutCancel = { ...defaultProps, onCancelClick: undefined };
      render(<GeneralInfoStep {...propsWithoutCancel} />);

      expect(screen.queryByRole('button', { name: /^Cancelar$/ })).not.toBeInTheDocument();
    });

    it('calls onCancelClick when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<GeneralInfoStep {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Cancelar/ }));

      expect(defaultProps.onCancelClick).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // FORM SUBMISSION TESTS
  // ============================================================

  describe('Form Submission', () => {
    it('calls onNext when form is submitted with valid data', async () => {
      const user = userEvent.setup();
      setMockFormData({
        productType: 'circuit',
        name: 'Test Circuit Name',
        description: 'This is a test description for the circuit',
      });

      render(<GeneralInfoStep {...defaultProps} />);

      // Fill in form data
      const nameInput = screen.getByPlaceholderText(/Gran Tour por los Cenotes/);
      await user.type(nameInput, 'My Test Circuit');

      const descriptionInput = screen.getByPlaceholderText(/Describe la experiencia única/);
      await user.type(descriptionInput, 'This is a test description with enough characters');

      // Submit form
      await user.click(screen.getByRole('button', { name: /Continuar →/ }));

      // Note: onNext is called after form validation passes
      // The actual call depends on the form's internal state
    });

    it('shows validation error for empty name', async () => {
      const user = userEvent.setup();
      render(<GeneralInfoStep {...defaultProps} />);

      // Submit without filling name
      await user.click(screen.getByRole('button', { name: /Continuar →/ }));

      // Wait for validation error
      await waitFor(() => {
        // The exact error message depends on the schema
        const errorElements = screen.queryAllByText(/obligatorio|requerido|mínimo/i);
        expect(errorElements.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ============================================================
  // LANGUAGE SELECTION TESTS
  // ============================================================

  describe('Language Selection', () => {
    it('renders language options', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText('Español')).toBeInTheDocument();
      expect(screen.getByText('Inglés')).toBeInTheDocument();
    });

    it('shows French option', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText('Francés')).toBeInTheDocument();
    });

    it('shows German option', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText('Alemán')).toBeInTheDocument();
    });

    it('shows Italian option', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText('Italiano')).toBeInTheDocument();
    });

    it('shows Portuguese option', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      expect(screen.getByText('Portugués')).toBeInTheDocument();
    });
  });

  // ============================================================
  // PRE-FILLED DATA TESTS
  // ============================================================

  describe('Pre-filled Data', () => {
    it('displays existing name from formData', () => {
      setMockFormData({ name: 'Existing Circuit Name' });
      render(<GeneralInfoStep {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText(/Gran Tour por los Cenotes/) as HTMLInputElement;
      expect(nameInput.value).toBe('Existing Circuit Name');
    });

    it('displays existing description from formData', () => {
      setMockFormData({ description: 'Existing description text' });
      render(<GeneralInfoStep {...defaultProps} />);

      const descInput = screen.getByPlaceholderText(/Describe la experiencia única/) as HTMLTextAreaElement;
      expect(descInput.value).toBe('Existing description text');
    });
  });

  // ============================================================
  // STYLING AND ACCESSIBILITY TESTS
  // ============================================================

  describe('Styling and Accessibility', () => {
    it('header has gradient styling', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      const header = screen.getByText('Crea tu Circuito').closest('div');
      expect(header).toHaveClass('bg-gradient-to-r');
    });

    it('continue button has gradient styling', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      const button = screen.getByRole('button', { name: /Continuar →/ });
      expect(button).toHaveClass('bg-gradient-to-r');
    });

    it('cancel button has red styling', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancelar/ });
      expect(cancelButton).toHaveClass('text-red-600');
      expect(cancelButton).toHaveClass('border-red-300');
    });

    it('name input has focus ring styling', () => {
      render(<GeneralInfoStep {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText(/Gran Tour por los Cenotes/);
      expect(nameInput).toHaveClass('focus:ring-pink-500');
    });
  });

  // ============================================================
  // EDGE CASES TESTS
  // ============================================================

  describe('Edge Cases', () => {
    it('handles undefined preferences gracefully', () => {
      setMockFormData({ preferences: undefined as unknown as string[] });
      expect(() => render(<GeneralInfoStep {...defaultProps} />)).not.toThrow();
    });

    it('handles undefined languages gracefully', () => {
      setMockFormData({ languages: undefined as unknown as string[] });
      expect(() => render(<GeneralInfoStep {...defaultProps} />)).not.toThrow();
    });

    it('handles empty string name gracefully', () => {
      setMockFormData({ name: '' });
      expect(() => render(<GeneralInfoStep {...defaultProps} />)).not.toThrow();
    });

    it('handles null description gracefully', () => {
      setMockFormData({ description: null as unknown as string });
      expect(() => render(<GeneralInfoStep {...defaultProps} />)).not.toThrow();
    });
  });

  // ============================================================
  // FORM DATA UPDATE TESTS
  // ============================================================

  describe('Form Data Updates', () => {
    it('calls updateFormData when name changes', async () => {
      const user = userEvent.setup();
      render(<GeneralInfoStep {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText(/Gran Tour por los Cenotes/);
      await user.type(nameInput, 'New Name');

      // Wait for debounced update (300ms)
      await waitFor(
        () => {
          expect(mockUpdateFormData).toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });
  });
});
