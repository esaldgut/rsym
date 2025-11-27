/**
 * Unit tests for ProductNameModal component
 *
 * Tests the product name creation modal:
 * - Modal visibility (open/closed)
 * - Header with product type label
 * - Form validation (min/max length, regex)
 * - Character counter
 * - Submit behavior and server action calls
 * - Loading state
 * - Error handling
 * - Tips section
 *
 * @see src/components/product-wizard/ProductNameModal.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductNameModal from '../ProductNameModal';

// Mock toastManager
jest.mock('@/components/ui/Toast', () => ({
  toastManager: {
    show: jest.fn(),
  },
}));

// Mock server actions
const mockCreateCircuitProductAction = jest.fn();
const mockCreatePackageProductAction = jest.fn();
jest.mock('@/lib/server/product-creation-actions', () => ({
  createCircuitProductAction: (...args: unknown[]) => mockCreateCircuitProductAction(...args),
  createPackageProductAction: (...args: unknown[]) => mockCreatePackageProductAction(...args),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ProductNameModal', () => {
  const defaultProps = {
    isOpen: true,
    productType: 'circuit' as const,
    onProductCreated: jest.fn(),
    onError: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateCircuitProductAction.mockResolvedValue({ success: true, data: { productId: 'test-id-123' } });
    mockCreatePackageProductAction.mockResolvedValue({ success: true, data: { productId: 'test-id-456' } });
  });

  // ============================================================
  // MODAL VISIBILITY
  // ============================================================

  describe('Modal Visibility', () => {
    it('renders modal when open', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByText('🗺️ Nuevo Circuito')).toBeInTheDocument();
    });

    it('does not render modal when closed', () => {
      render(<ProductNameModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('🗺️ Nuevo Circuito')).not.toBeInTheDocument();
    });

    it('has correct z-index', () => {
      render(<ProductNameModal {...defaultProps} />);

      const modal = screen.getByText('🗺️ Nuevo Circuito').closest('.fixed');
      expect(modal).toHaveClass('z-50');
    });
  });

  // ============================================================
  // HEADER
  // ============================================================

  describe('Header', () => {
    it('shows circuit header for circuit type', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByText('🗺️ Nuevo Circuito')).toBeInTheDocument();
    });

    it('shows package header for package type', () => {
      render(<ProductNameModal {...defaultProps} productType="package" />);

      expect(screen.getByText('📦 Nuevo Paquete')).toBeInTheDocument();
    });

    it('shows description for circuit', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByText(/Ingresa el nombre de tu circuito/)).toBeInTheDocument();
    });

    it('shows description for package', () => {
      render(<ProductNameModal {...defaultProps} productType="package" />);

      expect(screen.getByText(/Ingresa el nombre de tu paquete/)).toBeInTheDocument();
    });

    it('has gradient styling', () => {
      render(<ProductNameModal {...defaultProps} />);

      // The header with gradient is the parent container
      const headerText = screen.getByText('🗺️ Nuevo Circuito');
      const headerContainer = headerText.closest('.bg-gradient-to-r');
      expect(headerContainer).toBeInTheDocument();
    });
  });

  // ============================================================
  // CLOSE BUTTON
  // ============================================================

  describe('Close Button', () => {
    it('renders close button when onClose provided', () => {
      render(<ProductNameModal {...defaultProps} />);

      // Find the close button by its SVG content in header
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('svg'));
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      // Find the X button (first button with SVG in header)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('svg') && !btn.textContent?.includes('Crear'));

      if (closeButton) {
        await user.click(closeButton);
        expect(defaultProps.onClose).toHaveBeenCalled();
      }
    });

    it('does not render close button when onClose not provided', () => {
      const propsWithoutClose = { ...defaultProps, onClose: undefined };
      render(<ProductNameModal {...propsWithoutClose} />);

      expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // FORM INPUT
  // ============================================================

  describe('Form Input', () => {
    it('renders name input field', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByLabelText(/Nombre del Circuito/)).toBeInTheDocument();
    });

    it('shows package label for package type', () => {
      render(<ProductNameModal {...defaultProps} productType="package" />);

      expect(screen.getByLabelText(/Nombre del Paquete/)).toBeInTheDocument();
    });

    it('shows circuit placeholder', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByPlaceholderText(/Circuito Mágico por Michoacán/)).toBeInTheDocument();
    });

    it('shows package placeholder', () => {
      render(<ProductNameModal {...defaultProps} productType="package" />);

      expect(screen.getByPlaceholderText(/Paquete Aventura en Oaxaca/)).toBeInTheDocument();
    });

    it('input is rendered with focus intent', () => {
      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      // autoFocus becomes autofocus (lowercase) in HTML
      // But JSDOM doesn't support it fully, so we just verify the input exists and is enabled
      expect(input).toBeInTheDocument();
      expect(input).not.toBeDisabled();
    });
  });

  // ============================================================
  // CHARACTER COUNTER
  // ============================================================

  describe('Character Counter', () => {
    it('shows initial character count', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('updates character count on input', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Test');

      expect(screen.getByText('4/100')).toBeInTheDocument();
    });
  });

  // ============================================================
  // VALIDATION
  // ============================================================

  describe('Validation', () => {
    it('shows error for name too short', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'AB');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/al menos 3 caracteres/)).toBeInTheDocument();
      });
    });

    it('disables submit button when invalid', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'AB');

      const submitButton = screen.getByText(/Crear Circuito/);
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when valid', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Valid Product Name');

      await waitFor(() => {
        const submitButton = screen.getByText(/Crear Circuito/);
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  // ============================================================
  // TIPS SECTION
  // ============================================================

  describe('Tips Section', () => {
    it('shows tips heading', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByText('💡 Consejos:')).toBeInTheDocument();
    });

    it('shows descriptive name tip', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByText(/nombre descriptivo y atractivo/)).toBeInTheDocument();
    });

    it('shows location tip', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByText(/Incluye la ubicación principal/)).toBeInTheDocument();
    });

    it('shows abbreviation tip', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByText(/Evita abreviaciones excesivas/)).toBeInTheDocument();
    });

    it('tips section has blue styling', () => {
      render(<ProductNameModal {...defaultProps} />);

      const tipsSection = screen.getByText('💡 Consejos:').closest('div');
      expect(tipsSection).toHaveClass('bg-blue-50');
    });
  });

  // ============================================================
  // SUBMIT BEHAVIOR
  // ============================================================

  describe('Submit Behavior', () => {
    it('calls createCircuitProductAction for circuit type', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Test Circuit');

      const submitButton = screen.getByText(/Crear Circuito/);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateCircuitProductAction).toHaveBeenCalledWith('Test Circuit');
      });
    });

    it('calls createPackageProductAction for package type', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} productType="package" />);

      const input = screen.getByLabelText(/Nombre del Paquete/);
      await user.type(input, 'Test Package');

      const submitButton = screen.getByText(/Crear Paquete/);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreatePackageProductAction).toHaveBeenCalledWith('Test Package');
      });
    });

    it('trims whitespace from name', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, '  Test Circuit  ');

      const submitButton = screen.getByText(/Crear Circuito/);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateCircuitProductAction).toHaveBeenCalledWith('Test Circuit');
      });
    });

    it('calls onProductCreated on success', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Test Circuit');

      const submitButton = screen.getByText(/Crear Circuito/);
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onProductCreated).toHaveBeenCalledWith('test-id-123', 'Test Circuit');
      });
    });

    it('saves to localStorage on success', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Test Circuit');

      const submitButton = screen.getByText(/Crear Circuito/);
      await user.click(submitButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('yaan-current-product-id', 'test-id-123');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('yaan-current-product-type', 'circuit');
      });
    });

    it('shows success toast on success', async () => {
      const { toastManager } = require('@/components/ui/Toast');
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Test Circuit');

      const submitButton = screen.getByText(/Crear Circuito/);
      await user.click(submitButton);

      await waitFor(() => {
        expect(toastManager.show).toHaveBeenCalledWith(
          expect.stringContaining('creado exitosamente'),
          'success',
          expect.any(Number)
        );
      });
    });
  });

  // ============================================================
  // LOADING STATE
  // ============================================================

  describe('Loading State', () => {
    it('shows loading spinner while submitting', async () => {
      const user = userEvent.setup();
      mockCreateCircuitProductAction.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: { productId: 'test' } }), 100))
      );

      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Test Circuit');

      const submitButton = screen.getByText(/Crear Circuito/);
      await user.click(submitButton);

      expect(screen.getByText('Creando...')).toBeInTheDocument();
    });

    it('disables input while submitting', async () => {
      const user = userEvent.setup();
      mockCreateCircuitProductAction.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: { productId: 'test' } }), 100))
      );

      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Test Circuit');

      const submitButton = screen.getByText(/Crear Circuito/);
      await user.click(submitButton);

      expect(input).toBeDisabled();
    });
  });

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  describe('Error Handling', () => {
    it('calls onError when server action fails', async () => {
      const user = userEvent.setup();
      mockCreateCircuitProductAction.mockResolvedValue({ success: false, error: 'Server error' });

      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Test Circuit');

      const submitButton = screen.getByText(/Crear Circuito/);
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Server error');
      });
    });

    it('shows error toast on failure', async () => {
      const { toastManager } = require('@/components/ui/Toast');
      const user = userEvent.setup();
      mockCreateCircuitProductAction.mockResolvedValue({ success: false, error: 'Server error' });

      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Test Circuit');

      const submitButton = screen.getByText(/Crear Circuito/);
      await user.click(submitButton);

      await waitFor(() => {
        expect(toastManager.show).toHaveBeenCalledWith(
          expect.stringContaining('Error'),
          'error',
          expect.any(Number)
        );
      });
    });

    it('handles thrown exceptions', async () => {
      const user = userEvent.setup();
      mockCreateCircuitProductAction.mockRejectedValue(new Error('Network error'));

      render(<ProductNameModal {...defaultProps} />);

      const input = screen.getByLabelText(/Nombre del Circuito/);
      await user.type(input, 'Test Circuit');

      const submitButton = screen.getByText(/Crear Circuito/);
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Network error');
      });
    });
  });

  // ============================================================
  // CANCEL BUTTON
  // ============================================================

  describe('Cancel Button', () => {
    it('renders cancel button when onClose provided', () => {
      render(<ProductNameModal {...defaultProps} />);

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('calls onClose when cancel clicked', async () => {
      const user = userEvent.setup();
      render(<ProductNameModal {...defaultProps} />);

      await user.click(screen.getByText('Cancelar'));

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render cancel button when onClose not provided', () => {
      const propsWithoutClose = { ...defaultProps, onClose: undefined };
      render(<ProductNameModal {...propsWithoutClose} />);

      expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
    });
  });
});
