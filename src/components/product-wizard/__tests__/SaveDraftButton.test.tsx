/**
 * Unit tests for SaveDraftButton component
 *
 * Tests the save draft functionality:
 * - Button rendering and labels
 * - Disabled state when no productId
 * - Saving state display
 * - Click handler and save action
 * - Variant styling
 *
 * @see src/components/product-wizard/SaveDraftButton.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveDraftButton } from '../SaveDraftButton';

// Mock toastManager
jest.mock('@/components/ui/Toast', () => ({
  toastManager: {
    show: jest.fn(),
  },
}));

// Mock updateProductAction
const mockUpdateProductAction = jest.fn();
jest.mock('@/lib/server/product-creation-actions', () => ({
  updateProductAction: (...args: unknown[]) => mockUpdateProductAction(...args),
}));

// Default mock form data
const getDefaultFormData = () => ({
  productId: 'test-product-id',
  productType: 'circuit' as const,
  name: 'Test Product',
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
  },
  published: false,
});

// Using global to avoid Jest hoisting issues
type FormDataType = ReturnType<typeof getDefaultFormData>;
(global as Record<string, FormDataType>).__mockSaveDraftFormData = getDefaultFormData();

const setMockFormData = (data: Partial<FormDataType>) => {
  (global as Record<string, FormDataType>).__mockSaveDraftFormData = {
    ...getDefaultFormData(),
    ...data,
  } as FormDataType;
};

const resetMockFormData = () => {
  (global as Record<string, FormDataType>).__mockSaveDraftFormData = getDefaultFormData();
};

// Mock useProductForm hook
jest.mock('@/context/ProductFormContext', () => ({
  useProductForm: () => ({
    formData: (global as Record<string, unknown>).__mockSaveDraftFormData,
  }),
}));

describe('SaveDraftButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockFormData();
    mockUpdateProductAction.mockResolvedValue({ success: true, data: {} });
  });

  // ============================================================
  // BUTTON RENDERING
  // ============================================================

  describe('Button Rendering', () => {
    it('renders save draft button', () => {
      render(<SaveDraftButton />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows draft label for unpublished products', () => {
      setMockFormData({ published: false });
      render(<SaveDraftButton />);

      expect(screen.getByText('💾 Guardar Borrador')).toBeInTheDocument();
    });

    it('shows changes label for published products', () => {
      setMockFormData({ published: true });
      render(<SaveDraftButton />);

      expect(screen.getByText('💾 Guardar Cambios')).toBeInTheDocument();
    });

    it('button is type="button"', () => {
      render(<SaveDraftButton />);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
  });

  // ============================================================
  // DISABLED STATE
  // ============================================================

  describe('Disabled State', () => {
    it('disables button when no productId', () => {
      setMockFormData({ productId: '' });
      render(<SaveDraftButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('enables button when productId exists', () => {
      setMockFormData({ productId: 'test-id' });
      render(<SaveDraftButton />);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('has correct title for published products', () => {
      setMockFormData({ published: true });
      render(<SaveDraftButton />);

      expect(screen.getByRole('button')).toHaveAttribute('title', 'Guardar cambios sin despublicar');
    });

    it('has correct title for draft products', () => {
      setMockFormData({ published: false });
      render(<SaveDraftButton />);

      expect(screen.getByRole('button')).toHaveAttribute('title', 'Guardar como borrador');
    });
  });

  // ============================================================
  // SAVING STATE
  // ============================================================

  describe('Saving State', () => {
    it('shows loading spinner when saving', async () => {
      const user = userEvent.setup();
      mockUpdateProductAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<SaveDraftButton />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Guardando...')).toBeInTheDocument();
    });

    it('disables button while saving', async () => {
      const user = userEvent.setup();
      mockUpdateProductAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<SaveDraftButton />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('returns to normal state after save completes', async () => {
      const user = userEvent.setup();
      mockUpdateProductAction.mockResolvedValue({ success: true, data: {} });

      render(<SaveDraftButton />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('💾 Guardar Borrador')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // CLICK HANDLER
  // ============================================================

  describe('Click Handler', () => {
    it('calls updateProductAction with correct params', async () => {
      const user = userEvent.setup();
      render(<SaveDraftButton />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockUpdateProductAction).toHaveBeenCalled();
      });

      expect(mockUpdateProductAction).toHaveBeenCalledWith(
        'test-product-id',
        expect.objectContaining({
          name: 'Test Product',
          description: 'Test description',
        })
      );
    });

    it('does not call updateProductAction when no productId', async () => {
      const user = userEvent.setup();
      setMockFormData({ productId: '' });
      render(<SaveDraftButton />);

      // Force click even though disabled
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockUpdateProductAction).not.toHaveBeenCalled();
      });
    });

    it('preserves published state for published products', async () => {
      const user = userEvent.setup();
      setMockFormData({ published: true });
      render(<SaveDraftButton />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockUpdateProductAction).toHaveBeenCalledWith(
          'test-product-id',
          expect.objectContaining({
            published: true,
          })
        );
      });
    });

    it('keeps published false for draft products', async () => {
      const user = userEvent.setup();
      setMockFormData({ published: false });
      render(<SaveDraftButton />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockUpdateProductAction).toHaveBeenCalledWith(
          'test-product-id',
          expect.objectContaining({
            published: false,
          })
        );
      });
    });
  });

  // ============================================================
  // VARIANT STYLING
  // ============================================================

  describe('Variant Styling', () => {
    it('uses outline styling by default', () => {
      render(<SaveDraftButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-purple-600');
    });

    it('uses solid styling when variant="solid"', () => {
      render(<SaveDraftButton variant="solid" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-purple-600');
      expect(button).toHaveClass('text-white');
    });

    it('applies custom className', () => {
      render(<SaveDraftButton className="custom-class" />);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  describe('Error Handling', () => {
    it('shows error toast when save fails', async () => {
      const { toastManager } = require('@/components/ui/Toast');
      const user = userEvent.setup();
      mockUpdateProductAction.mockResolvedValue({ success: false, error: 'Save failed' });

      render(<SaveDraftButton />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(toastManager.show).toHaveBeenCalledWith(
          expect.stringContaining('Error'),
          'error',
          expect.any(Number)
        );
      });
    });

    it('shows success toast when save succeeds', async () => {
      const { toastManager } = require('@/components/ui/Toast');
      const user = userEvent.setup();
      mockUpdateProductAction.mockResolvedValue({ success: true, data: {} });

      render(<SaveDraftButton />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(toastManager.show).toHaveBeenCalledWith(
          expect.stringContaining('guardado'),
          'success',
          expect.any(Number)
        );
      });
    });

    it('returns to normal state after error', async () => {
      const user = userEvent.setup();
      mockUpdateProductAction.mockRejectedValue(new Error('Network error'));

      render(<SaveDraftButton />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('💾 Guardar Borrador')).toBeInTheDocument();
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });
  });
});
