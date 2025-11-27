/**
 * Unit Tests for ProductFormContext
 *
 * Tests the context provider, reducer, and helper functions
 * for the Product Wizard state management.
 *
 * @coverage Target: 90%+ for reducer logic, hook behavior
 */
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import {
  ProductFormProvider,
  useProductForm,
  getInitialFormData,
} from '../ProductFormContext';
import type { ProductFormData, ProductFormAction, FormStep } from '@/types/wizard';
import { z } from 'zod';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock the s3-url-transformer to avoid external dependencies
jest.mock('@/lib/utils/s3-url-transformer', () => ({
  transformPathsToUrls: jest.fn((product) => product),
}));

// Mock console.log/warn to reduce noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

afterAll(() => {
  mockConsoleLog.mockRestore();
  mockConsoleWarn.mockRestore();
});

// ============================================================================
// TEST HELPERS
// ============================================================================

// Minimal mock step for testing
const createMockStep = (id: string, title: string): FormStep => ({
  id,
  title,
  component: () => null,
  validation: z.object({}),
  optional: false,
});

// Create mock steps array
const mockSteps: FormStep[] = [
  createMockStep('step-1', 'Step 1'),
  createMockStep('step-2', 'Step 2'),
  createMockStep('step-3', 'Step 3'),
];

// Initial form data for comparison
const expectedInitialFormData: ProductFormData = {
  productId: null,
  name: '',
  preferences: [],
  languages: [],
  description: '',
  cover_image_url: '',
  image_url: [],
  video_url: [],
  destination: [],
  departures: { regular_departures: [], specific_departures: [] },
  origin: [],
  itinerary: '',
  seasons: [],
  planned_hotels_or_similar: [],
  payment_policy: null,
  published: false,
  is_foreign: false,
  productType: 'circuit',
  currentStep: 0,
  isSubmitting: false,
};

// Wrapper component for testing hooks
const createWrapper = (
  productType: 'circuit' | 'package' = 'circuit',
  steps: FormStep[] = mockSteps
) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ProductFormProvider productType={productType} steps={steps}>
        {children}
      </ProductFormProvider>
    );
  };
};

// ============================================================================
// getInitialFormData TESTS
// ============================================================================

describe('getInitialFormData', () => {
  it('returns initial form data for circuit type', () => {
    const result = getInitialFormData('circuit');

    expect(result.productType).toBe('circuit');
    expect(result.productId).toBeNull();
    expect(result.name).toBe('');
    expect(result.currentStep).toBe(0);
    expect(result.isSubmitting).toBe(false);
  });

  it('returns initial form data for package type', () => {
    const result = getInitialFormData('package');

    expect(result.productType).toBe('package');
    expect(result.productId).toBeNull();
  });

  it('sets productId when provided', () => {
    const productId = 'test-product-123';
    const result = getInitialFormData('circuit', productId);

    expect(result.productId).toBe(productId);
    expect(result.productType).toBe('circuit');
  });

  it('sets productId to null when undefined is passed', () => {
    const result = getInitialFormData('circuit', undefined);

    expect(result.productId).toBeNull();
  });

  it('sets productId to null when null is passed', () => {
    const result = getInitialFormData('package', null);

    expect(result.productId).toBeNull();
  });

  it('includes all required fields', () => {
    const result = getInitialFormData('circuit');

    // Check all fields exist
    expect(result).toHaveProperty('productId');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('preferences');
    expect(result).toHaveProperty('languages');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('cover_image_url');
    expect(result).toHaveProperty('image_url');
    expect(result).toHaveProperty('video_url');
    expect(result).toHaveProperty('destination');
    expect(result).toHaveProperty('departures');
    expect(result).toHaveProperty('origin');
    expect(result).toHaveProperty('itinerary');
    expect(result).toHaveProperty('seasons');
    expect(result).toHaveProperty('planned_hotels_or_similar');
    expect(result).toHaveProperty('payment_policy');
    expect(result).toHaveProperty('published');
    expect(result).toHaveProperty('is_foreign');
    expect(result).toHaveProperty('productType');
    expect(result).toHaveProperty('currentStep');
    expect(result).toHaveProperty('isSubmitting');
  });

  it('initializes arrays as empty arrays', () => {
    const result = getInitialFormData('circuit');

    expect(Array.isArray(result.preferences)).toBe(true);
    expect(result.preferences).toHaveLength(0);
    expect(Array.isArray(result.languages)).toBe(true);
    expect(result.languages).toHaveLength(0);
    expect(Array.isArray(result.image_url)).toBe(true);
    expect(result.image_url).toHaveLength(0);
    expect(Array.isArray(result.destination)).toBe(true);
    expect(result.destination).toHaveLength(0);
  });

  it('initializes departures with correct structure', () => {
    const result = getInitialFormData('circuit');

    expect(result.departures).toBeDefined();
    expect(result.departures).toHaveProperty('regular_departures');
    expect(result.departures).toHaveProperty('specific_departures');
    expect(Array.isArray(result.departures.regular_departures)).toBe(true);
    expect(Array.isArray(result.departures.specific_departures)).toBe(true);
  });
});

// ============================================================================
// REDUCER TESTS (via useProductForm hook)
// ============================================================================

describe('productFormReducer (via useProductForm)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('UPDATE_FORM_DATA action', () => {
    it('updates single field', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateFormData({ name: 'Test Product' });
      });

      expect(result.current.formData.name).toBe('Test Product');
    });

    it('updates multiple fields at once', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateFormData({
          name: 'Test Product',
          description: 'Test Description',
          published: true,
        });
      });

      expect(result.current.formData.name).toBe('Test Product');
      expect(result.current.formData.description).toBe('Test Description');
      expect(result.current.formData.published).toBe(true);
    });

    it('preserves existing fields when updating', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      // First update
      act(() => {
        result.current.updateFormData({ name: 'Test Product' });
      });

      // Second update should preserve name
      act(() => {
        result.current.updateFormData({ description: 'Test Description' });
      });

      expect(result.current.formData.name).toBe('Test Product');
      expect(result.current.formData.description).toBe('Test Description');
    });

    it('updates arrays correctly', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      const languages = ['es', 'en', 'fr'];
      act(() => {
        result.current.updateFormData({ languages });
      });

      expect(result.current.formData.languages).toEqual(languages);
    });

    it('updates nested objects correctly', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      const departures = {
        regular_departures: [{ origin: { place: 'Test' }, days: ['Monday'] }],
        specific_departures: [],
      };

      act(() => {
        result.current.updateFormData({ departures });
      });

      expect(result.current.formData.departures).toEqual(departures);
    });

    it('updates productId', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateFormData({ productId: 'new-product-id' });
      });

      expect(result.current.formData.productId).toBe('new-product-id');
    });
  });

  describe('SET_CURRENT_STEP action (via navigateToStep)', () => {
    it('navigates to valid step', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentStepIndex).toBe(0);

      act(() => {
        result.current.navigateToStep(1);
      });

      expect(result.current.currentStepIndex).toBe(1);
    });

    it('navigates to last step', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.navigateToStep(2);
      });

      expect(result.current.currentStepIndex).toBe(2);
      expect(result.current.isLastStep).toBe(true);
    });

    it('does not navigate to negative step', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.navigateToStep(-1);
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it('does not navigate beyond last step', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.navigateToStep(10);
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it('navigates to step 0', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      // First go to step 2
      act(() => {
        result.current.navigateToStep(2);
      });

      // Then back to step 0
      act(() => {
        result.current.navigateToStep(0);
      });

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.isFirstStep).toBe(true);
    });
  });

  describe('SET_SUBMITTING action (via dispatch)', () => {
    it('sets isSubmitting to true', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.dispatch({ type: 'SET_SUBMITTING', payload: true });
      });

      expect(result.current.formData.isSubmitting).toBe(true);
    });

    it('sets isSubmitting to false', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      // First set to true
      act(() => {
        result.current.dispatch({ type: 'SET_SUBMITTING', payload: true });
      });

      // Then set to false
      act(() => {
        result.current.dispatch({ type: 'SET_SUBMITTING', payload: false });
      });

      expect(result.current.formData.isSubmitting).toBe(false);
    });
  });

  describe('RESET_FORM action', () => {
    it('resets form to initial state', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      // Make some changes
      act(() => {
        result.current.updateFormData({
          name: 'Test Product',
          description: 'Test Description',
        });
        result.current.navigateToStep(2);
      });

      // Reset
      act(() => {
        result.current.dispatch({ type: 'RESET_FORM' });
      });

      expect(result.current.formData.name).toBe('');
      expect(result.current.formData.description).toBe('');
      expect(result.current.formData.currentStep).toBe(0);
    });
  });

  describe('unknown action type', () => {
    it('returns state unchanged for unknown action', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      const initialName = result.current.formData.name;

      act(() => {
        // @ts-expect-error - Testing unknown action type
        result.current.dispatch({ type: 'UNKNOWN_ACTION', payload: 'test' });
      });

      expect(result.current.formData.name).toBe(initialName);
    });
  });
});

// ============================================================================
// useProductForm HOOK TESTS
// ============================================================================

describe('useProductForm hook', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useProductForm());
    }).toThrow('useProductForm must be used within ProductFormProvider');

    consoleError.mockRestore();
  });

  it('returns context when used inside provider', () => {
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.formData).toBeDefined();
    expect(result.current.dispatch).toBeDefined();
    expect(result.current.updateFormData).toBeDefined();
    expect(result.current.navigateToStep).toBeDefined();
  });
});

// ============================================================================
// ProductFormProvider TESTS
// ============================================================================

describe('ProductFormProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children', () => {
    render(
      <ProductFormProvider productType="circuit" steps={mockSteps}>
        <div data-testid="child">Child Content</div>
      </ProductFormProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('provides correct productType for circuit', () => {
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('circuit'),
    });

    expect(result.current.formData.productType).toBe('circuit');
  });

  it('provides correct productType for package', () => {
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('package'),
    });

    expect(result.current.formData.productType).toBe('package');
  });

  it('provides correct steps array', () => {
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('circuit', mockSteps),
    });

    expect(result.current.steps).toHaveLength(3);
    expect(result.current.steps[0].id).toBe('step-1');
    expect(result.current.steps[1].id).toBe('step-2');
    expect(result.current.steps[2].id).toBe('step-3');
  });

  describe('isFirstStep and isLastStep', () => {
    it('isFirstStep is true at step 0', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
    });

    it('isLastStep is true at last step', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.navigateToStep(2);
      });

      expect(result.current.isFirstStep).toBe(false);
      expect(result.current.isLastStep).toBe(true);
    });

    it('both are false at middle step', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.navigateToStep(1);
      });

      expect(result.current.isFirstStep).toBe(false);
      expect(result.current.isLastStep).toBe(false);
    });
  });

  describe('initialFormData in context', () => {
    it('provides initialFormData for comparison', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper('circuit'),
      });

      expect(result.current.initialFormData).toBeDefined();
      expect(result.current.initialFormData.productType).toBe('circuit');
      expect(result.current.initialFormData.name).toBe('');
    });
  });

  describe('canProceed', () => {
    it('returns true by default', () => {
      const { result } = renderHook(() => useProductForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.canProceed).toBe(true);
    });
  });
});

// ============================================================================
// localStorage INTEGRATION TESTS
// ============================================================================

describe('localStorage integration', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads data from yaan-wizard-{productType} key', () => {
    const savedData = {
      productId: 'saved-product-id',
      name: 'Saved Product',
      productType: 'circuit',
      currentStep: 1,
      isSubmitting: false,
      preferences: [],
      languages: ['es'],
      description: 'Saved description',
      cover_image_url: '',
      image_url: [],
      video_url: [],
      destination: [],
      departures: { regular_departures: [], specific_departures: [] },
      origin: [],
      itinerary: '',
      seasons: [],
      planned_hotels_or_similar: [],
      payment_policy: null,
      published: false,
      is_foreign: false,
    };

    localStorage.setItem('yaan-wizard-circuit', JSON.stringify(savedData));

    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('circuit'),
    });

    expect(result.current.formData.name).toBe('Saved Product');
    expect(result.current.formData.languages).toEqual(['es']);
  });

  it('loads data from yaan-product-form-data key with matching productType', () => {
    const savedData = {
      productId: 'saved-product-id',
      name: 'Unified Saved Product',
      productType: 'package',
      currentStep: 0,
      isSubmitting: false,
      preferences: [],
      languages: [],
      description: '',
      cover_image_url: '',
      image_url: [],
      video_url: [],
      destination: [],
      departures: { regular_departures: [], specific_departures: [] },
      origin: [],
      itinerary: '',
      seasons: [],
      planned_hotels_or_similar: [],
      payment_policy: null,
      published: false,
      is_foreign: false,
    };

    localStorage.setItem('yaan-product-form-data', JSON.stringify(savedData));

    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('package'),
    });

    expect(result.current.formData.name).toBe('Unified Saved Product');
  });

  it('ignores yaan-product-form-data if productType does not match', () => {
    const savedData = {
      productId: 'saved-product-id',
      name: 'Mismatched Product',
      productType: 'package', // Different from wrapper
      currentStep: 0,
      isSubmitting: false,
    };

    localStorage.setItem('yaan-product-form-data', JSON.stringify(savedData));

    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('circuit'), // Different productType
    });

    // Should not load mismatched data
    expect(result.current.formData.name).toBe('');
  });

  it('auto-saves form data after debounce delay', async () => {
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('circuit'),
    });

    act(() => {
      result.current.updateFormData({ name: 'Auto-saved Product' });
    });

    // Fast-forward past debounce delay (500ms)
    act(() => {
      jest.advanceTimersByTime(600);
    });

    const savedData = localStorage.getItem('yaan-wizard-circuit');
    expect(savedData).not.toBeNull();

    const parsed = JSON.parse(savedData!);
    expect(parsed.name).toBe('Auto-saved Product');
    expect(parsed._savedAt).toBeDefined();
    expect(parsed._savedBy).toBe('auto-save');
  });

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage.getItem to throw
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn(() => {
      throw new Error('Storage error');
    });

    // Should not throw, should fall back to initial data
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('circuit'),
    });

    expect(result.current.formData.name).toBe('');
    expect(result.current.formData.productType).toBe('circuit');

    // Restore
    localStorage.getItem = originalGetItem;
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('yaan-wizard-circuit', 'invalid json {{{');

    // Should not throw, should fall back to initial data
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('circuit'),
    });

    expect(result.current.formData.name).toBe('');
  });
});

// ============================================================================
// EDIT MODE TESTS (with initialProduct)
// ============================================================================

describe('Edit mode (with initialProduct)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads data from initialProduct prop', () => {
    const initialProduct = {
      id: 'product-123',
      name: 'Existing Product',
      description: 'Existing description',
      preferences: ['hiking', 'beach'],
      languages: ['es', 'en'],
      cover_image_url: '',
      image_url: [],
      video_url: [],
      destination: [],
      departures: [],
      seasons: [],
      planned_hotels_or_similar: [],
      origin: [],
      itinerary: '',
      payment_policy: null,
      published: true,
      is_foreign: false,
    };

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProductFormProvider
        productType="circuit"
        steps={mockSteps}
        initialProduct={initialProduct as any}
      >
        {children}
      </ProductFormProvider>
    );

    const { result } = renderHook(() => useProductForm(), {
      wrapper: Wrapper,
    });

    expect(result.current.formData.productId).toBe('product-123');
    expect(result.current.formData.name).toBe('Existing Product');
    expect(result.current.formData.description).toBe('Existing description');
    expect(result.current.formData.preferences).toEqual(['hiking', 'beach']);
    expect(result.current.formData.languages).toEqual(['es', 'en']);
    expect(result.current.formData.published).toBe(true);
  });

  it('transforms departures with object coordinates to array format', () => {
    const initialProduct = {
      id: 'product-123',
      name: 'Test Product',
      departures: [
        {
          days: ['Monday', 'Friday'],
          origin: {
            place: 'Mexico City',
            placeSub: 'CDMX',
            coordinates: { latitude: 19.4326, longitude: -99.1332 },
          },
        },
      ],
      destination: [],
      seasons: [],
      planned_hotels_or_similar: [],
    };

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProductFormProvider
        productType="circuit"
        steps={mockSteps}
        initialProduct={initialProduct as any}
      >
        {children}
      </ProductFormProvider>
    );

    const { result } = renderHook(() => useProductForm(), {
      wrapper: Wrapper,
    });

    const regularDepartures = result.current.formData.departures?.regular_departures;
    expect(regularDepartures).toHaveLength(1);
    expect(regularDepartures?.[0].origin?.place).toBe('Mexico City');
    // Coordinates should be transformed to [longitude, latitude] array
    expect(regularDepartures?.[0].origin?.coordinates).toEqual([-99.1332, 19.4326]);
  });

  it('handles array of origins in departures', () => {
    const initialProduct = {
      id: 'product-123',
      name: 'Test Product',
      departures: [
        {
          days: ['Monday'],
          origin: [
            { place: 'Origin 1', placeSub: 'Sub 1' },
            { place: 'Origin 2', placeSub: 'Sub 2' },
          ],
        },
      ],
      destination: [],
      seasons: [],
      planned_hotels_or_similar: [],
    };

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProductFormProvider
        productType="circuit"
        steps={mockSteps}
        initialProduct={initialProduct as any}
      >
        {children}
      </ProductFormProvider>
    );

    const { result } = renderHook(() => useProductForm(), {
      wrapper: Wrapper,
    });

    const regularDepartures = result.current.formData.departures?.regular_departures;
    expect(regularDepartures).toHaveLength(2);
    expect(regularDepartures?.[0].origin?.place).toBe('Origin 1');
    expect(regularDepartures?.[1].origin?.place).toBe('Origin 2');
  });

  it('transforms destination coordinates from object to array', () => {
    const initialProduct = {
      id: 'product-123',
      name: 'Test Product',
      destination: [
        {
          place: 'Cancun',
          placeSub: 'Quintana Roo',
          complementary_description: 'Beach paradise',
          coordinates: { latitude: 21.1619, longitude: -86.8515 },
        },
      ],
      departures: [],
      seasons: [],
      planned_hotels_or_similar: [],
    };

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProductFormProvider
        productType="circuit"
        steps={mockSteps}
        initialProduct={initialProduct as any}
      >
        {children}
      </ProductFormProvider>
    );

    const { result } = renderHook(() => useProductForm(), {
      wrapper: Wrapper,
    });

    const destinations = result.current.formData.destination;
    expect(destinations).toHaveLength(1);
    expect(destinations?.[0].place).toBe('Cancun');
    expect(destinations?.[0].coordinates).toEqual([-86.8515, 21.1619]);
  });

  it('handles destination with array coordinates (already transformed)', () => {
    const initialProduct = {
      id: 'product-123',
      name: 'Test Product',
      destination: [
        {
          place: 'Cancun',
          coordinates: [-86.8515, 21.1619], // Already in array format
        },
      ],
      departures: [],
      seasons: [],
      planned_hotels_or_similar: [],
    };

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProductFormProvider
        productType="circuit"
        steps={mockSteps}
        initialProduct={initialProduct as any}
      >
        {children}
      </ProductFormProvider>
    );

    const { result } = renderHook(() => useProductForm(), {
      wrapper: Wrapper,
    });

    const destinations = result.current.formData.destination;
    expect(destinations?.[0].coordinates).toEqual([-86.8515, 21.1619]);
  });

  it('initialProduct has priority over localStorage data', () => {
    // Set localStorage data
    localStorage.setItem(
      'yaan-wizard-circuit',
      JSON.stringify({
        productId: 'local-product',
        name: 'Local Product',
        productType: 'circuit',
      })
    );

    const initialProduct = {
      id: 'prop-product',
      name: 'Prop Product',
      destination: [],
      departures: [],
      seasons: [],
      planned_hotels_or_similar: [],
    };

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProductFormProvider
        productType="circuit"
        steps={mockSteps}
        initialProduct={initialProduct as any}
      >
        {children}
      </ProductFormProvider>
    );

    const { result } = renderHook(() => useProductForm(), {
      wrapper: Wrapper,
    });

    // initialProduct should take priority
    expect(result.current.formData.productId).toBe('prop-product');
    expect(result.current.formData.name).toBe('Prop Product');
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge cases', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('handles empty steps array', () => {
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('circuit', []),
    });

    expect(result.current.steps).toHaveLength(0);
    // With empty steps, navigating should be a no-op
    act(() => {
      result.current.navigateToStep(0);
    });
    // Should remain at 0 (or not crash)
  });

  it('handles single step', () => {
    const singleStep = [createMockStep('only-step', 'Only Step')];

    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper('circuit', singleStep),
    });

    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(true);
  });

  it('handles null/undefined values in initialProduct', () => {
    const initialProduct = {
      id: 'product-123',
      name: null,
      description: undefined,
      preferences: null,
      languages: undefined,
      destination: null,
      departures: null,
      seasons: null,
      planned_hotels_or_similar: null,
      origin: null,
      payment_policy: null,
    };

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProductFormProvider
        productType="circuit"
        steps={mockSteps}
        initialProduct={initialProduct as any}
      >
        {children}
      </ProductFormProvider>
    );

    const { result } = renderHook(() => useProductForm(), {
      wrapper: Wrapper,
    });

    // Should use fallback empty values
    expect(result.current.formData.name).toBe('');
    expect(result.current.formData.description).toBe('');
    expect(result.current.formData.preferences).toEqual([]);
    expect(result.current.formData.languages).toEqual([]);
  });

  it('handles rapid sequential updates', () => {
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateFormData({ name: 'Update 1' });
      result.current.updateFormData({ name: 'Update 2' });
      result.current.updateFormData({ name: 'Update 3' });
    });

    expect(result.current.formData.name).toBe('Update 3');
  });

  it('handles rapid step navigation', () => {
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.navigateToStep(1);
      result.current.navigateToStep(2);
      result.current.navigateToStep(0);
      result.current.navigateToStep(1);
    });

    expect(result.current.currentStepIndex).toBe(1);
  });

  it('maintains formData reference stability during updates', () => {
    const { result } = renderHook(() => useProductForm(), {
      wrapper: createWrapper(),
    });

    const initialFormData = result.current.formData;

    act(() => {
      result.current.updateFormData({ name: 'New Name' });
    });

    // formData reference should change (new object)
    expect(result.current.formData).not.toBe(initialFormData);
    // But initialFormData in context should remain stable
    expect(result.current.initialFormData).toBeDefined();
  });
});
