/**
 * Unit tests for PaymentStatusBadge component
 *
 * Tests the payment status badge display:
 * - Status color mapping (PROCESSED, MIT_PAYMENT_PENDING, etc.)
 * - Icon visibility toggle
 * - Size variants (sm, md, lg)
 * - Unknown status handling
 * - CSS class application
 *
 * @see src/components/reservation/PaymentStatusBadge.tsx
 */

import { render, screen } from '@testing-library/react';
import PaymentStatusBadge from '../PaymentStatusBadge';

describe('PaymentStatusBadge', () => {
  // ============================================================
  // STATUS MAPPING - PROCESSED
  // ============================================================

  describe('PROCESSED status', () => {
    it('renders with green color scheme', () => {
      render(<PaymentStatusBadge status="PROCESSED" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-800');
      expect(badge).toHaveClass('border-green-300');
    });

    it('displays correct label', () => {
      render(<PaymentStatusBadge status="PROCESSED" />);

      expect(screen.getByText('Pago Completado')).toBeInTheDocument();
    });

    it('shows checkmark icon by default', () => {
      render(<PaymentStatusBadge status="PROCESSED" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      const svg = badge?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  // ============================================================
  // STATUS MAPPING - MIT_PAYMENT_PENDING
  // ============================================================

  describe('MIT_PAYMENT_PENDING status', () => {
    it('renders with yellow color scheme', () => {
      render(<PaymentStatusBadge status="MIT_PAYMENT_PENDING" />);

      const badge = screen.getByText('Pago Pendiente').closest('div');
      expect(badge).toHaveClass('bg-yellow-100');
      expect(badge).toHaveClass('text-yellow-800');
      expect(badge).toHaveClass('border-yellow-300');
    });

    it('displays correct label', () => {
      render(<PaymentStatusBadge status="MIT_PAYMENT_PENDING" />);

      expect(screen.getByText('Pago Pendiente')).toBeInTheDocument();
    });
  });

  // ============================================================
  // STATUS MAPPING - AWAITING_MANUAL_PAYMENT
  // ============================================================

  describe('AWAITING_MANUAL_PAYMENT status', () => {
    it('renders with orange color scheme', () => {
      render(<PaymentStatusBadge status="AWAITING_MANUAL_PAYMENT" />);

      const badge = screen.getByText('Esperando Pago').closest('div');
      expect(badge).toHaveClass('bg-orange-100');
      expect(badge).toHaveClass('text-orange-800');
      expect(badge).toHaveClass('border-orange-300');
    });

    it('displays correct label', () => {
      render(<PaymentStatusBadge status="AWAITING_MANUAL_PAYMENT" />);

      expect(screen.getByText('Esperando Pago')).toBeInTheDocument();
    });
  });

  // ============================================================
  // STATUS MAPPING - CANCELLED
  // ============================================================

  describe('CANCELLED status', () => {
    it('renders with red color scheme', () => {
      render(<PaymentStatusBadge status="CANCELLED" />);

      const badge = screen.getByText('Pago Cancelado').closest('div');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-800');
      expect(badge).toHaveClass('border-red-300');
    });

    it('displays correct label', () => {
      render(<PaymentStatusBadge status="CANCELLED" />);

      expect(screen.getByText('Pago Cancelado')).toBeInTheDocument();
    });

    it('handles alternative spelling CANCELED', () => {
      render(<PaymentStatusBadge status="CANCELED" />);

      expect(screen.getByText('Pago Cancelado')).toBeInTheDocument();
    });
  });

  // ============================================================
  // STATUS MAPPING - FAILED
  // ============================================================

  describe('FAILED status', () => {
    it('renders with red color scheme', () => {
      render(<PaymentStatusBadge status="FAILED" />);

      const badge = screen.getByText('Pago Fallido').closest('div');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-800');
      expect(badge).toHaveClass('border-red-300');
    });

    it('displays correct label', () => {
      render(<PaymentStatusBadge status="FAILED" />);

      expect(screen.getByText('Pago Fallido')).toBeInTheDocument();
    });
  });

  // ============================================================
  // UNKNOWN STATUS HANDLING
  // ============================================================

  describe('Unknown status', () => {
    it('renders with gray color scheme for unknown status', () => {
      render(<PaymentStatusBadge status="UNKNOWN_STATUS" />);

      const badge = screen.getByText('UNKNOWN_STATUS').closest('div');
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-800');
      expect(badge).toHaveClass('border-gray-300');
    });

    it('displays the raw status as label', () => {
      render(<PaymentStatusBadge status="CUSTOM_STATUS" />);

      expect(screen.getByText('CUSTOM_STATUS')).toBeInTheDocument();
    });

    it('handles empty string gracefully', () => {
      const { container } = render(<PaymentStatusBadge status="" />);

      // Empty string becomes the label, component still renders
      const badge = container.querySelector('.inline-flex');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100'); // Default gray for unknown
    });
  });

  // ============================================================
  // CASE INSENSITIVITY
  // ============================================================

  describe('Case insensitivity', () => {
    it('handles lowercase status', () => {
      render(<PaymentStatusBadge status="processed" />);

      expect(screen.getByText('Pago Completado')).toBeInTheDocument();
    });

    it('handles mixed case status', () => {
      render(<PaymentStatusBadge status="Processed" />);

      expect(screen.getByText('Pago Completado')).toBeInTheDocument();
    });
  });

  // ============================================================
  // ICON VISIBILITY
  // ============================================================

  describe('Icon visibility', () => {
    it('shows icon by default (showIcon=true)', () => {
      render(<PaymentStatusBadge status="PROCESSED" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      const svg = badge?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('hides icon when showIcon=false', () => {
      render(<PaymentStatusBadge status="PROCESSED" showIcon={false} />);

      const badge = screen.getByText('Pago Completado').closest('div');
      const svg = badge?.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // SIZE VARIANTS
  // ============================================================

  describe('Size variants', () => {
    it('applies small size classes', () => {
      render(<PaymentStatusBadge status="PROCESSED" size="sm" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('gap-1');
    });

    it('applies medium size classes (default)', () => {
      render(<PaymentStatusBadge status="PROCESSED" size="md" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-sm');
      expect(badge).toHaveClass('gap-1.5');
    });

    it('applies large size classes', () => {
      render(<PaymentStatusBadge status="PROCESSED" size="lg" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-2');
      expect(badge).toHaveClass('text-base');
      expect(badge).toHaveClass('gap-2');
    });

    it('defaults to medium size when size not specified', () => {
      render(<PaymentStatusBadge status="PROCESSED" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      expect(badge).toHaveClass('text-sm');
    });
  });

  // ============================================================
  // CUSTOM CLASS NAME
  // ============================================================

  describe('Custom className', () => {
    it('applies custom className', () => {
      render(<PaymentStatusBadge status="PROCESSED" className="my-custom-class" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      expect(badge).toHaveClass('my-custom-class');
    });

    it('preserves default classes when adding custom', () => {
      render(<PaymentStatusBadge status="PROCESSED" className="my-custom-class" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('font-medium');
      expect(badge).toHaveClass('my-custom-class');
    });
  });

  // ============================================================
  // STRUCTURAL ELEMENTS
  // ============================================================

  describe('Structural elements', () => {
    it('renders as inline-flex container', () => {
      render(<PaymentStatusBadge status="PROCESSED" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
    });

    it('has rounded-full border radius', () => {
      render(<PaymentStatusBadge status="PROCESSED" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      expect(badge).toHaveClass('rounded-full');
    });

    it('has border styling', () => {
      render(<PaymentStatusBadge status="PROCESSED" />);

      const badge = screen.getByText('Pago Completado').closest('div');
      expect(badge).toHaveClass('border');
    });
  });
});
