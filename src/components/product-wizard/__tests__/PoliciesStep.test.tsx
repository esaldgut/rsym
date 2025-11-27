/**
 * Unit tests for PoliciesStep component
 *
 * Tests the payment policies step:
 * - Header rendering based on product type
 * - Payment options (CONTADO/PLAZOS) management
 * - General policies section
 * - Navigation buttons
 * - Form validation
 *
 * @see src/components/product-wizard/steps/PoliciesStep.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoliciesStep from '../steps/PoliciesStep';

// Mock toastManager
jest.mock('@/components/ui/Toast', () => ({
  toastManager: {
    show: jest.fn(),
  },
}));

// Mock SaveDraftButton
jest.mock('@/components/product-wizard/SaveDraftButton', () => ({
  SaveDraftButton: ({ variant }: { variant?: string }) => (
    <button data-testid="save-draft-button" data-variant={variant}>
      Guardar Borrador
    </button>
  ),
}));

// Default mock form data
const getDefaultFormData = () => ({
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
    general_policies: {
      change_policy: {
        allows_date_change: true,
        deadline_days_to_make_change: 15
      }
    }
  }
});

// Using global to avoid Jest hoisting issues
type FormDataType = ReturnType<typeof getDefaultFormData>;
(global as Record<string, FormDataType>).__mockPoliciesFormData = getDefaultFormData();

const setMockFormData = (data: Partial<FormDataType>) => {
  (global as Record<string, FormDataType>).__mockPoliciesFormData = {
    ...getDefaultFormData(),
    ...data,
  } as FormDataType;
};

const resetMockFormData = () => {
  (global as Record<string, FormDataType>).__mockPoliciesFormData = getDefaultFormData();
};

// Mock useProductForm hook
const mockUpdateFormData = jest.fn();
jest.mock('@/context/ProductFormContext', () => ({
  useProductForm: () => {
    const formData = (global as Record<string, unknown>).__mockPoliciesFormData;
    return {
      formData,
      updateFormData: mockUpdateFormData,
    };
  },
}));

describe('PoliciesStep', () => {
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
  // HEADER RENDERING
  // ============================================================

  describe('Header Rendering', () => {
    it('renders header with title', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText('Políticas de Pago')).toBeInTheDocument();
    });

    it('renders description for circuit type', () => {
      setMockFormData({ productType: 'circuit' });
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText(/circuito/)).toBeInTheDocument();
    });

    it('renders description for package type', () => {
      setMockFormData({ productType: 'package' });
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText(/paquete/)).toBeInTheDocument();
    });

    it('header has gradient styling', () => {
      render(<PoliciesStep {...defaultProps} />);

      const header = screen.getByText('Políticas de Pago').closest('div');
      expect(header).toHaveClass('bg-gradient-to-r');
    });
  });

  // ============================================================
  // PAYMENT OPTIONS SECTION
  // ============================================================

  describe('Payment Options Section', () => {
    it('renders payment options heading', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText('Opciones de Pago')).toBeInTheDocument();
    });

    it('renders description for payment options', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText('Agrega múltiples formas de pago para tu producto')).toBeInTheDocument();
    });

    it('renders add payment buttons', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText('+ Pago de Contado')).toBeInTheDocument();
      expect(screen.getByText('+ Pago en Plazos')).toBeInTheDocument();
    });

    it('shows empty state when no options', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText('Agrega al menos una opción de pago')).toBeInTheDocument();
    });
  });

  // ============================================================
  // ADD PAYMENT OPTIONS
  // ============================================================

  describe('Add Payment Options', () => {
    it('adds CONTADO option when button clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago de Contado'));

      await waitFor(() => {
        expect(screen.getByText('Pago de Contado')).toBeInTheDocument();
      });
    });

    it('adds PLAZOS option when button clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago en Plazos'));

      await waitFor(() => {
        expect(screen.getByText('Pago en Plazos')).toBeInTheDocument();
      });
    });

    it('shows counters when options are added', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago de Contado'));
      await user.click(screen.getByText('+ Pago en Plazos'));

      await waitFor(() => {
        expect(screen.getByText('1 Contado')).toBeInTheDocument();
        expect(screen.getByText('1 Plazos')).toBeInTheDocument();
        expect(screen.getByText('2 Total')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // CONTADO PAYMENT OPTION
  // ============================================================

  describe('CONTADO Payment Option', () => {
    it('shows CONTADO card styling', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago de Contado'));

      await waitFor(() => {
        const card = screen.getByText('Pago de Contado').closest('div');
        expect(card).toBeInTheDocument();
      });
    });

    it('shows discount fields for CONTADO', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago de Contado'));

      await waitFor(() => {
        expect(screen.getByText('Descuento')).toBeInTheDocument();
        expect(screen.getByText('Tipo de descuento')).toBeInTheDocument();
      });
    });

    it('shows payment methods checkboxes for CONTADO', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago de Contado'));

      await waitFor(() => {
        expect(screen.getByText('💵 Efectivo')).toBeInTheDocument();
        expect(screen.getByText('💳 Tarjeta')).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // PLAZOS PAYMENT OPTION
  // ============================================================

  describe('PLAZOS Payment Option', () => {
    it('shows PLAZOS card styling', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago en Plazos'));

      await waitFor(() => {
        expect(screen.getByText('Pago fraccionado')).toBeInTheDocument();
      });
    });

    it('shows installment fields for PLAZOS', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago en Plazos'));

      await waitFor(() => {
        expect(screen.getByText('Enganche inicial')).toBeInTheDocument();
        expect(screen.getByText('Frecuencia de pagos')).toBeInTheDocument();
      });
    });

  });

  // ============================================================
  // REMOVE PAYMENT OPTIONS
  // ============================================================

  describe('Remove Payment Options', () => {
    it('removes option when delete button clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago de Contado'));

      await waitFor(() => {
        expect(screen.getByText('Pago de Contado')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Eliminar opción');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByText('Pago único con descuento')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // GENERAL POLICIES SECTION
  // ============================================================

  describe('General Policies Section', () => {
    it('renders general policies heading', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText('Políticas Generales')).toBeInTheDocument();
    });

    it('renders date change checkbox', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText('Permitir cambios de fecha')).toBeInTheDocument();
    });

    it('shows deadline days field when checkbox checked', async () => {
      render(<PoliciesStep {...defaultProps} />);

      // Default is checked based on formData
      expect(screen.getByText('Días límite para cambios')).toBeInTheDocument();
    });

    it('renders description for date change policy', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText(/Los viajeros podrán cambiar las fechas/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // NAVIGATION BUTTONS
  // ============================================================

  describe('Navigation Buttons', () => {
    it('renders previous button', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText('← Anterior')).toBeInTheDocument();
    });

    it('renders continue button', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByText('Continuar →')).toBeInTheDocument();
    });

    it('renders SaveDraftButton', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByTestId('save-draft-button')).toBeInTheDocument();
    });

    it('renders cancel button when onCancelClick provided', () => {
      render(<PoliciesStep {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument();
    });

    it('calls onPrevious when previous button clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('← Anterior'));

      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    it('calls onCancelClick when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Cancelar/ }));

      expect(defaultProps.onCancelClick).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // SUBMIT BUTTON STATE
  // ============================================================

  describe('Submit Button State', () => {
    it('disables submit when no payment options', () => {
      render(<PoliciesStep {...defaultProps} />);

      const submitButton = screen.getByText('Continuar →');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit when payment options added', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago de Contado'));

      await waitFor(() => {
        const submitButton = screen.getByText('Continuar →');
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  // ============================================================
  // BENEFITS/LEGAL SECTION
  // ============================================================

  describe('Benefits/Legal Section', () => {
    it('shows add benefit button on payment option', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago de Contado'));

      await waitFor(() => {
        expect(screen.getByText(/Agregar Beneficio/)).toBeInTheDocument();
      });
    });

    it('shows empty benefits message', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago de Contado'));

      await waitFor(() => {
        expect(screen.getByText(/No hay beneficios o declaraciones/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // DESCRIPTION FIELD
  // ============================================================

  describe('Description Field', () => {
    it('shows description input for CONTADO', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago de Contado'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/5% descuento en pagos con tarjeta/)).toBeInTheDocument();
      });
    });

    it('shows description input for PLAZOS', async () => {
      const user = userEvent.setup();
      render(<PoliciesStep {...defaultProps} />);

      await user.click(screen.getByText('+ Pago en Plazos'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/6 meses sin intereses/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles undefined payment_policy gracefully', () => {
      setMockFormData({ payment_policy: undefined as any });
      expect(() => render(<PoliciesStep {...defaultProps} />)).not.toThrow();
    });

    it('handles null payment_policy gracefully', () => {
      setMockFormData({ payment_policy: null as any });
      expect(() => render(<PoliciesStep {...defaultProps} />)).not.toThrow();
    });
  });
});
