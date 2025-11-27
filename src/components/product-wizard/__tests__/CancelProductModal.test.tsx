/**
 * Unit tests for CancelProductModal component
 *
 * Tests the cancel confirmation modal:
 * - Modal visibility (open/closed)
 * - Header with product type label
 * - Warning message display
 * - Suggestion box
 * - Button callbacks (close/confirm)
 * - Keyboard hint
 *
 * @see src/components/product-wizard/CancelProductModal.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CancelProductModal } from '../CancelProductModal';

describe('CancelProductModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    productName: 'Test Product',
    productType: 'circuit' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // MODAL VISIBILITY
  // ============================================================

  describe('Modal Visibility', () => {
    it('renders modal when open', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText('¿Cancelar Circuito?')).toBeInTheDocument();
    });

    it('does not render modal when closed', () => {
      render(<CancelProductModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('¿Cancelar Circuito?')).not.toBeInTheDocument();
    });

    it('has correct z-index', () => {
      render(<CancelProductModal {...defaultProps} />);

      const backdrop = screen.getByText('¿Cancelar Circuito?').closest('.fixed');
      expect(backdrop).toHaveClass('z-50');
    });
  });

  // ============================================================
  // HEADER
  // ============================================================

  describe('Header', () => {
    it('shows circuit label for circuit type', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText('¿Cancelar Circuito?')).toBeInTheDocument();
    });

    it('shows package label for package type', () => {
      render(<CancelProductModal {...defaultProps} productType="package" />);

      expect(screen.getByText('¿Cancelar Paquete?')).toBeInTheDocument();
    });

    it('shows product name when provided', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText('"Test Product"')).toBeInTheDocument();
    });

    it('does not show product name when not provided', () => {
      const propsWithoutName = { ...defaultProps, productName: undefined };
      render(<CancelProductModal {...propsWithoutName} />);

      expect(screen.queryByText('"Test Product"')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // WARNING MESSAGE
  // ============================================================

  describe('Warning Message', () => {
    it('shows irreversible action warning', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText('⚠️ Acción Irreversible')).toBeInTheDocument();
    });

    it('shows data loss warning', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText(/todos los datos capturados se PERDERÁN permanentemente/)).toBeInTheDocument();
    });

    it('shows recovery warning', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText(/No podrás recuperarlos después/)).toBeInTheDocument();
    });

    it('warning section has red styling', () => {
      render(<CancelProductModal {...defaultProps} />);

      const warningSection = screen.getByText('⚠️ Acción Irreversible').closest('div');
      expect(warningSection).toHaveClass('bg-red-50');
      expect(warningSection).toHaveClass('border-red-200');
    });
  });

  // ============================================================
  // SUGGESTION BOX
  // ============================================================

  describe('Suggestion Box', () => {
    it('shows better option suggestion', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText('💡 Mejor Opción')).toBeInTheDocument();
    });

    it('shows auto-save message', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText(/Tus datos se guardan automáticamente/)).toBeInTheDocument();
    });

    it('suggestion box has yellow styling', () => {
      render(<CancelProductModal {...defaultProps} />);

      // The suggestion box is a div with flex items-start that wraps the content
      // The parent with gradient is 2 levels up
      const suggestionText = screen.getByText('💡 Mejor Opción');
      const suggestionBox = suggestionText.closest('.bg-gradient-to-br');
      expect(suggestionBox).toBeInTheDocument();
    });
  });

  // ============================================================
  // BUTTONS
  // ============================================================

  describe('Buttons', () => {
    it('renders continue editing button', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText('Seguir Editando')).toBeInTheDocument();
    });

    it('renders confirm cancel button', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText('Sí, Cancelar')).toBeInTheDocument();
    });

    it('calls onClose when continue editing clicked', async () => {
      const user = userEvent.setup();
      render(<CancelProductModal {...defaultProps} />);

      await user.click(screen.getByText('Seguir Editando'));

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when cancel confirmed', async () => {
      const user = userEvent.setup();
      render(<CancelProductModal {...defaultProps} />);

      await user.click(screen.getByText('Sí, Cancelar'));

      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('confirm button has red gradient styling', () => {
      render(<CancelProductModal {...defaultProps} />);

      const confirmButton = screen.getByText('Sí, Cancelar');
      expect(confirmButton).toHaveClass('bg-gradient-to-r');
      expect(confirmButton).toHaveClass('from-red-600');
    });
  });

  // ============================================================
  // KEYBOARD HINT
  // ============================================================

  describe('Keyboard Hint', () => {
    it('shows escape key hint', () => {
      render(<CancelProductModal {...defaultProps} />);

      expect(screen.getByText(/Presiona/)).toBeInTheDocument();
      expect(screen.getByText('Esc')).toBeInTheDocument();
    });

    it('escape hint has keyboard styling', () => {
      render(<CancelProductModal {...defaultProps} />);

      const escKey = screen.getByText('Esc');
      expect(escKey.tagName.toLowerCase()).toBe('kbd');
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles empty product name gracefully', () => {
      const propsWithEmptyName = { ...defaultProps, productName: '' };
      expect(() => render(<CancelProductModal {...propsWithEmptyName} />)).not.toThrow();
    });

    it('renders correctly for both product types', () => {
      const { rerender } = render(<CancelProductModal {...defaultProps} productType="circuit" />);
      expect(screen.getByText('¿Cancelar Circuito?')).toBeInTheDocument();

      rerender(<CancelProductModal {...defaultProps} productType="package" />);
      expect(screen.getByText('¿Cancelar Paquete?')).toBeInTheDocument();
    });
  });
});
