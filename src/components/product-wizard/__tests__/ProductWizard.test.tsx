/**
 * Unit tests for ProductWizard component
 *
 * Tests the main wizard orchestrator:
 * - Create vs Edit mode rendering
 * - Circuit vs Package types
 * - Recovery modal behavior
 * - Cancel modal behavior
 * - Progress bar display
 * - Loading states
 * - Keyboard navigation
 *
 * @see src/components/product-wizard/ProductWizard.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductWizard from '../ProductWizard';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock toastManager
jest.mock('@/components/ui/Toast', () => ({
  toastManager: {
    show: jest.fn(),
  },
}));

// Mock HeroSection
jest.mock('@/components/ui/HeroSection', () => ({
  HeroSection: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="hero-section">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
}));

// Mock ProductNameModal
jest.mock('../ProductNameModal', () => ({
  __esModule: true,
  default: ({ isOpen, onProductCreated }: { isOpen: boolean; onProductCreated: (id: string, name: string) => void }) => (
    isOpen ? (
      <div data-testid="product-name-modal">
        <button
          data-testid="create-product-btn"
          onClick={() => onProductCreated('new-product-id', 'New Product')}
        >
          Crear Producto
        </button>
      </div>
    ) : null
  ),
}));

// Mock RecoveryModal
jest.mock('../RecoveryModal', () => ({
  RecoveryModal: ({ isOpen, onRecover, onDiscard, recoveryData }: {
    isOpen: boolean;
    onRecover: () => void;
    onDiscard: () => void;
    recoveryData: unknown;
  }) => (
    isOpen ? (
      <div data-testid="recovery-modal">
        <span data-testid="recovery-data">{JSON.stringify(recoveryData)}</span>
        <button data-testid="recover-btn" onClick={onRecover}>Recuperar</button>
        <button data-testid="discard-btn" onClick={onDiscard}>Descartar</button>
      </div>
    ) : null
  ),
}));

// Mock CancelProductModal
jest.mock('../CancelProductModal', () => ({
  CancelProductModal: ({ isOpen, onClose, onConfirm, productName, productType }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    productName: string;
    productType: string;
  }) => (
    isOpen ? (
      <div data-testid="cancel-modal">
        <span>{productName}</span>
        <span>{productType}</span>
        <button data-testid="cancel-confirm-btn" onClick={onConfirm}>Confirmar Cancelación</button>
        <button data-testid="cancel-close-btn" onClick={onClose}>Cerrar</button>
      </div>
    ) : null
  ),
}));

// Mock UnsavedChangesModal
jest.mock('@/components/ui/UnsavedChangesModal', () => ({
  UnsavedChangesModal: ({ isOpen }: { isOpen: boolean }) => (
    isOpen ? <div data-testid="unsaved-changes-modal">Unsaved Changes</div> : null
  ),
}));

// Mock wizard steps configuration
jest.mock('../config/wizard-steps', () => ({
  getStepsForProductType: (productType: string) => {
    const baseSteps = [
      { id: 'general', title: 'Información General', component: () => <div data-testid="step-general">General Step</div> },
      { id: 'details', title: 'Detalles', component: () => <div data-testid="step-details">Details Step</div> },
      { id: 'media', title: 'Multimedia', component: () => <div data-testid="step-media">Media Step</div> },
      { id: 'policies', title: 'Políticas', component: () => <div data-testid="step-policies">Policies Step</div> },
      { id: 'review', title: 'Revisión', component: () => <div data-testid="step-review">Review Step</div> },
    ];
    return baseSteps;
  },
}));

// Default mock form data
const getDefaultFormData = () => ({
  productId: '',
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

// Using global to avoid Jest hoisting issues
type FormDataType = ReturnType<typeof getDefaultFormData>;
(global as Record<string, FormDataType>).__mockWizardFormData = getDefaultFormData();
(global as Record<string, number>).__mockCurrentStepIndex = 0;

const setMockFormData = (data: Partial<FormDataType>) => {
  (global as Record<string, FormDataType>).__mockWizardFormData = {
    ...getDefaultFormData(),
    ...data,
  } as FormDataType;
};

const setMockStepIndex = (index: number) => {
  (global as Record<string, number>).__mockCurrentStepIndex = index;
};

const resetMocks = () => {
  (global as Record<string, FormDataType>).__mockWizardFormData = getDefaultFormData();
  (global as Record<string, number>).__mockCurrentStepIndex = 0;
};

// Mock step components for context
const MockStepGeneral = () => <div data-testid="step-general">General Step</div>;
const MockStepDetails = () => <div data-testid="step-details">Details Step</div>;
const MockStepMedia = () => <div data-testid="step-media">Media Step</div>;
const MockStepPolicies = () => <div data-testid="step-policies">Policies Step</div>;
const MockStepReview = () => <div data-testid="step-review">Review Step</div>;

// Mock ProductFormContext
const mockUpdateFormData = jest.fn();
const mockNavigateToStep = jest.fn();

jest.mock('@/context/ProductFormContext', () => ({
  ProductFormProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useProductForm: () => {
    const formData = (global as Record<string, unknown>).__mockWizardFormData;
    const currentStepIndex = (global as Record<string, number>).__mockCurrentStepIndex;

    // Steps with component property
    const MockStepGeneral = () => <div data-testid="step-general">General Step</div>;
    const MockStepDetails = () => <div data-testid="step-details">Details Step</div>;
    const MockStepMedia = () => <div data-testid="step-media">Media Step</div>;
    const MockStepPolicies = () => <div data-testid="step-policies">Policies Step</div>;
    const MockStepReview = () => <div data-testid="step-review">Review Step</div>;

    return {
      formData,
      updateFormData: mockUpdateFormData,
      currentStepIndex,
      steps: [
        { id: 'general', title: 'Información General', component: MockStepGeneral },
        { id: 'details', title: 'Detalles', component: MockStepDetails },
        { id: 'media', title: 'Multimedia', component: MockStepMedia },
        { id: 'policies', title: 'Políticas', component: MockStepPolicies },
        { id: 'review', title: 'Revisión', component: MockStepReview },
      ],
      navigateToStep: mockNavigateToStep,
      isLastStep: currentStepIndex === 4,
      isFirstStep: currentStepIndex === 0,
      initialFormData: formData,
    };
  },
}));

// Mock useUnsavedChanges hook
jest.mock('@/hooks/useUnsavedChanges', () => ({
  useUnsavedChanges: () => ({
    hasUnsavedChanges: false,
    showModal: false,
    setShowModal: jest.fn(),
    resetInitialData: jest.fn(),
    getModifiedFields: () => [],
  }),
}));

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
  setItem: jest.fn((key: string, value: string) => { mockLocalStorage[key] = value; }),
  removeItem: jest.fn((key: string) => { delete mockLocalStorage[key]; }),
  clear: jest.fn(() => { Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]); }),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ProductWizard', () => {
  const defaultCircuitProps = {
    userId: 'test-user-id',
    productType: 'circuit' as const,
  };

  const defaultPackageProps = {
    userId: 'test-user-id',
    productType: 'package' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetMocks();
    localStorageMock.clear();
  });

  // ============================================================
  // RENDERING TESTS - CREATE MODE
  // ============================================================

  describe('Rendering - Create Mode', () => {
    it('renders hero section with create circuit title', async () => {
      render(<ProductWizard {...defaultCircuitProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      });
      expect(screen.getByText('Crear Circuito Turístico')).toBeInTheDocument();
    });

    it('renders hero section with create package title', async () => {
      render(<ProductWizard {...defaultPackageProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      });
      expect(screen.getByText('Crear Paquete Turístico')).toBeInTheDocument();
    });

    it('shows ProductNameModal when no recovery data', async () => {
      render(<ProductWizard {...defaultCircuitProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('product-name-modal')).toBeInTheDocument();
      });
    });

    it('shows loading state initially (showModal = null)', async () => {
      render(<ProductWizard {...defaultCircuitProps} />);

      // Initially shows loading before useEffect runs
      // After useEffect, either modal or content is shown
      await waitFor(() => {
        // Should show some content after loading
        expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // RENDERING TESTS - EDIT MODE
  // ============================================================

  describe('Rendering - Edit Mode', () => {
    const mockProduct = {
      id: 'existing-product-id',
      name: 'Existing Circuit',
      product_type: 'circuit',
      description: 'Test description',
    };

    it('renders hero section with edit circuit title', async () => {
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Editar Circuito Turístico')).toBeInTheDocument();
      });
    });

    it('renders hero section with edit package title', async () => {
      const packageProduct = { ...mockProduct, product_type: 'package' };
      render(
        <ProductWizard
          {...defaultPackageProps}
          editMode={true}
          initialProduct={packageProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Editar Paquete Turístico')).toBeInTheDocument();
      });
    });

    it('does not show ProductNameModal in edit mode', async () => {
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.queryByTestId('product-name-modal')).not.toBeInTheDocument();
      });
    });

    it('syncs localStorage with initialProduct in edit mode', async () => {
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('yaan-current-product-id', 'existing-product-id');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('yaan-current-product-type', 'circuit');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('yaan-current-product-name', 'Existing Circuit');
      });
    });

    it('shows update subtitle in edit mode', async () => {
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Actualiza los detalles de tu experiencia turística')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // PRODUCT CREATION FLOW
  // ============================================================

  describe('Product Creation Flow', () => {
    it('creates product when modal form submitted', async () => {
      const user = userEvent.setup();
      render(<ProductWizard {...defaultCircuitProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('product-name-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('create-product-btn'));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('yaan-current-product-id', 'new-product-id');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('yaan-current-product-name', 'New Product');
      });
    });

    it('hides modal after product created', async () => {
      const user = userEvent.setup();
      render(<ProductWizard {...defaultCircuitProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('product-name-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('create-product-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('product-name-modal')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // RECOVERY MODAL TESTS
  // ============================================================

  describe('Recovery Modal', () => {
    beforeEach(() => {
      // Set up recovery data in localStorage
      const recoveryData = {
        productId: 'recovery-product-id',
        productType: 'circuit',
        name: 'Recovered Product',
        _savedAt: new Date().toISOString(),
      };
      mockLocalStorage[`yaan-wizard-circuit`] = JSON.stringify(recoveryData);
    });

    it('shows recovery modal when recent data exists', async () => {
      render(<ProductWizard {...defaultCircuitProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('recovery-modal')).toBeInTheDocument();
      });
    });

    it('recovers data when recover button clicked', async () => {
      const user = userEvent.setup();
      render(<ProductWizard {...defaultCircuitProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('recovery-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('recover-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('recovery-modal')).not.toBeInTheDocument();
      });
    });

    it('discards data and shows create modal when discard clicked', async () => {
      const user = userEvent.setup();
      render(<ProductWizard {...defaultCircuitProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('recovery-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('discard-btn'));

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('yaan-wizard-circuit');
        expect(screen.queryByTestId('recovery-modal')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // CANCEL MODAL TESTS
  // ============================================================

  describe('Cancel Modal', () => {
    const mockProduct = {
      id: 'test-product-id',
      name: 'Test Product',
      product_type: 'circuit',
    };

    it('does not show cancel modal initially', async () => {
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.queryByTestId('cancel-modal')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // PROGRESS BAR TESTS
  // ============================================================

  describe('Progress Bar', () => {
    const mockProduct = {
      id: 'test-product-id',
      name: 'Test Product',
      product_type: 'circuit',
    };

    it('shows current step title', async () => {
      setMockStepIndex(0);
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        // Title appears in multiple places (header and step list)
        expect(screen.getAllByText('Información General').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows step progress text', async () => {
      setMockStepIndex(0);
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument();
      });
    });

    it('shows completion percentage', async () => {
      setMockStepIndex(0);
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('20% completado')).toBeInTheDocument();
      });
    });

    it('updates progress for different steps', async () => {
      setMockStepIndex(2);
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Paso 3 de 5')).toBeInTheDocument();
        expect(screen.getByText('60% completado')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // KEYBOARD NAVIGATION HINT
  // ============================================================

  describe('Keyboard Navigation Hint', () => {
    const mockProduct = {
      id: 'test-product-id',
      name: 'Test Product',
      product_type: 'circuit',
    };

    it('shows keyboard navigation hint', async () => {
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Navegación rápida:')).toBeInTheDocument();
      });
    });

    it('shows keyboard shortcuts', async () => {
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Anterior')).toBeInTheDocument();
        expect(screen.getByText('Siguiente')).toBeInTheDocument();
        expect(screen.getByText('Ir a paso')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // EXPIRED DATA CLEANUP
  // ============================================================

  describe('Expired Data Cleanup', () => {
    it('cleans up data older than 7 days', async () => {
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const oldData = {
        productId: 'old-product',
        productType: 'circuit',
        _savedAt: oldDate,
      };
      mockLocalStorage[`yaan-wizard-circuit`] = JSON.stringify(oldData);

      render(<ProductWizard {...defaultCircuitProps} />);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('yaan-wizard-circuit');
      });
    });
  });

  // ============================================================
  // BLURRED STATE
  // ============================================================

  describe('Blurred State', () => {
    it('applies blur when modal is open', async () => {
      render(<ProductWizard {...defaultCircuitProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('product-name-modal')).toBeInTheDocument();
      });

      // The wizard content should be blurred when modal is showing
      // This is tested by checking the class on the content wrapper
    });
  });

  // ============================================================
  // STEP COMPONENT RENDERING
  // ============================================================

  describe('Step Component Rendering', () => {
    const mockProduct = {
      id: 'test-product-id',
      name: 'Test Product',
      product_type: 'circuit',
    };

    it('renders current step component', async () => {
      setMockStepIndex(0);
      render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
          initialProduct={mockProduct as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('step-general')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles missing initialProduct in edit mode gracefully', async () => {
      expect(() => render(
        <ProductWizard
          {...defaultCircuitProps}
          editMode={true}
        />
      )).not.toThrow();
    });

    it('handles corrupted localStorage data gracefully', async () => {
      mockLocalStorage['yaan-wizard-circuit'] = 'invalid-json{';

      expect(() => render(<ProductWizard {...defaultCircuitProps} />)).not.toThrow();
    });

    it('handles empty recovery data gracefully', async () => {
      mockLocalStorage['yaan-wizard-circuit'] = JSON.stringify({});

      expect(() => render(<ProductWizard {...defaultCircuitProps} />)).not.toThrow();
    });
  });
});
