/**
 * Unit tests for RecoveryModal component
 *
 * Tests the recovery modal functionality:
 * - Modal visibility (open/closed)
 * - Recovery data display (name, type, description, step)
 * - Timestamp formatting
 * - Button callbacks (recover/discard)
 *
 * @see src/components/product-wizard/RecoveryModal.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecoveryModal, ProductFormDataWithRecovery } from '../RecoveryModal';

describe('RecoveryModal', () => {
  const defaultProps = {
    isOpen: true,
    recoveryData: {
      name: 'Test Product',
      productType: 'circuit' as const,
      description: 'Test description',
      currentStep: 2,
      _savedAt: '2025-01-15T10:30:00.000Z',
      _savedBy: 'auto-save' as const
    } as ProductFormDataWithRecovery,
    onRecover: jest.fn(),
    onDiscard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // MODAL VISIBILITY
  // ============================================================

  describe('Modal Visibility', () => {
    it('renders modal when open', () => {
      render(<RecoveryModal {...defaultProps} />);

      expect(screen.getByText('Datos Pendientes Detectados')).toBeInTheDocument();
    });

    it('does not render modal when closed', () => {
      render(<RecoveryModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Datos Pendientes Detectados')).not.toBeInTheDocument();
    });

    it('has correct backdrop styling', () => {
      render(<RecoveryModal {...defaultProps} />);

      const backdrop = screen.getByText('Datos Pendientes Detectados').closest('.fixed');
      expect(backdrop).toHaveClass('z-50');
    });
  });

  // ============================================================
  // HEADER
  // ============================================================

  describe('Header', () => {
    it('renders title', () => {
      render(<RecoveryModal {...defaultProps} />);

      expect(screen.getByText('Datos Pendientes Detectados')).toBeInTheDocument();
    });

    it('renders saved timestamp', () => {
      render(<RecoveryModal {...defaultProps} />);

      expect(screen.getByText(/Guardado:/)).toBeInTheDocument();
    });

    it('shows unknown date when _savedAt is missing', () => {
      const propsWithoutDate = {
        ...defaultProps,
        recoveryData: {
          ...defaultProps.recoveryData,
          _savedAt: undefined
        }
      };
      render(<RecoveryModal {...propsWithoutDate} />);

      expect(screen.getByText(/desconocida/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // RECOVERY DATA DISPLAY
  // ============================================================

  describe('Recovery Data Display', () => {
    it('shows product name', () => {
      render(<RecoveryModal {...defaultProps} />);

      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('shows "Sin nombre" when name is missing', () => {
      const propsWithoutName = {
        ...defaultProps,
        recoveryData: {
          ...defaultProps.recoveryData,
          name: undefined
        }
      };
      render(<RecoveryModal {...propsWithoutName} />);

      expect(screen.getByText('Sin nombre')).toBeInTheDocument();
    });

    it('shows circuit type with icon', () => {
      render(<RecoveryModal {...defaultProps} />);

      expect(screen.getByText(/Circuito/)).toBeInTheDocument();
      expect(screen.getByText('🗺️')).toBeInTheDocument();
    });

    it('shows package type with icon', () => {
      const packageProps = {
        ...defaultProps,
        recoveryData: {
          ...defaultProps.recoveryData,
          productType: 'package' as const
        }
      };
      render(<RecoveryModal {...packageProps} />);

      expect(screen.getByText(/Paquete/)).toBeInTheDocument();
      expect(screen.getByText('📦')).toBeInTheDocument();
    });

    it('shows description when available', () => {
      render(<RecoveryModal {...defaultProps} />);

      expect(screen.getByText(/"Test description"/)).toBeInTheDocument();
    });

    it('does not show description section when missing', () => {
      const propsWithoutDesc = {
        ...defaultProps,
        recoveryData: {
          ...defaultProps.recoveryData,
          description: undefined
        }
      };
      render(<RecoveryModal {...propsWithoutDesc} />);

      expect(screen.queryByText(/"Test description"/)).not.toBeInTheDocument();
    });

    it('shows progress step when available', () => {
      render(<RecoveryModal {...defaultProps} />);

      expect(screen.getByText('Paso 3')).toBeInTheDocument(); // currentStep 2 + 1
    });

    it('does not show progress when currentStep is undefined', () => {
      const propsWithoutStep = {
        ...defaultProps,
        recoveryData: {
          ...defaultProps.recoveryData,
          currentStep: undefined
        }
      };
      render(<RecoveryModal {...propsWithoutStep} />);

      expect(screen.queryByText(/Progreso:/)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // BUTTONS
  // ============================================================

  describe('Buttons', () => {
    it('renders discard button', () => {
      render(<RecoveryModal {...defaultProps} />);

      expect(screen.getByText('Descartar')).toBeInTheDocument();
    });

    it('renders recover button', () => {
      render(<RecoveryModal {...defaultProps} />);

      expect(screen.getByText('Recuperar Datos')).toBeInTheDocument();
    });

    it('calls onDiscard when discard button clicked', async () => {
      const user = userEvent.setup();
      render(<RecoveryModal {...defaultProps} />);

      await user.click(screen.getByText('Descartar'));

      expect(defaultProps.onDiscard).toHaveBeenCalledTimes(1);
    });

    it('calls onRecover when recover button clicked', async () => {
      const user = userEvent.setup();
      render(<RecoveryModal {...defaultProps} />);

      await user.click(screen.getByText('Recuperar Datos'));

      expect(defaultProps.onRecover).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // FOOTER
  // ============================================================

  describe('Footer', () => {
    it('shows auto-save tip', () => {
      render(<RecoveryModal {...defaultProps} />);

      expect(screen.getByText(/Los datos se guardan automáticamente/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // NULL RECOVERY DATA
  // ============================================================

  describe('Null Recovery Data', () => {
    it('handles null recoveryData gracefully', () => {
      const propsWithNull = {
        ...defaultProps,
        recoveryData: null
      };
      expect(() => render(<RecoveryModal {...propsWithNull} />)).not.toThrow();
    });

    it('shows "Sin nombre" for null recoveryData', () => {
      const propsWithNull = {
        ...defaultProps,
        recoveryData: null
      };
      render(<RecoveryModal {...propsWithNull} />);

      expect(screen.getByText('Sin nombre')).toBeInTheDocument();
    });
  });
});
