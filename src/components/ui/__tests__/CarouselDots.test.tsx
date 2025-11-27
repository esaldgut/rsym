/**
 * Unit tests for CarouselDots component
 *
 * Tests carousel navigation dots rendering, interactions, and accessibility.
 * Pure presentation component - no mocks required.
 *
 * @see src/components/ui/CarouselDots.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CarouselDots } from '../CarouselDots';

describe('CarouselDots', () => {
  const defaultProps = {
    total: 5,
    current: 0,
    onDotClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // RENDERING TESTS
  // ============================================================

  describe('Rendering', () => {
    it('renders correct number of dots based on total prop', () => {
      render(<CarouselDots {...defaultProps} total={5} />);

      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(5);
    });

    it('renders 3 dots when total is 3', () => {
      render(<CarouselDots {...defaultProps} total={3} />);

      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(3);
    });

    it('renders 10 dots when total is 10', () => {
      render(<CarouselDots {...defaultProps} total={10} />);

      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(10);
    });

    it('renders nothing when total is 0', () => {
      const { container } = render(<CarouselDots {...defaultProps} total={0} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when total is 1', () => {
      const { container } = render(<CarouselDots {...defaultProps} total={1} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when total is negative', () => {
      const { container } = render(<CarouselDots {...defaultProps} total={-1} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders dots when total is 2', () => {
      render(<CarouselDots {...defaultProps} total={2} />);

      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(2);
    });

    it('applies custom className to container', () => {
      const { container } = render(
        <CarouselDots {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies flex layout to container', () => {
      const { container } = render(<CarouselDots {...defaultProps} />);

      expect(container.firstChild).toHaveClass('flex', 'items-center', 'gap-2');
    });
  });

  // ============================================================
  // ACTIVE DOT HIGHLIGHTING
  // ============================================================

  describe('Active Dot Highlighting', () => {
    it('applies scale-125 to active dot', () => {
      render(<CarouselDots {...defaultProps} current={2} />);

      const dots = screen.getAllByRole('button');
      expect(dots[2]).toHaveClass('scale-125');
    });

    it('applies scale-100 to inactive dots', () => {
      render(<CarouselDots {...defaultProps} current={2} />);

      const dots = screen.getAllByRole('button');
      expect(dots[0]).toHaveClass('scale-100');
      expect(dots[1]).toHaveClass('scale-100');
      expect(dots[3]).toHaveClass('scale-100');
      expect(dots[4]).toHaveClass('scale-100');
    });

    it('highlights first dot when current is 0', () => {
      render(<CarouselDots {...defaultProps} current={0} />);

      const dots = screen.getAllByRole('button');
      expect(dots[0]).toHaveClass('scale-125');
      expect(dots[1]).toHaveClass('scale-100');
    });

    it('highlights last dot when current is total-1', () => {
      render(<CarouselDots {...defaultProps} total={5} current={4} />);

      const dots = screen.getAllByRole('button');
      expect(dots[4]).toHaveClass('scale-125');
      expect(dots[3]).toHaveClass('scale-100');
    });

    it('updates highlighted dot when current changes', () => {
      const { rerender } = render(<CarouselDots {...defaultProps} current={0} />);

      let dots = screen.getAllByRole('button');
      expect(dots[0]).toHaveClass('scale-125');

      rerender(<CarouselDots {...defaultProps} current={3} />);

      dots = screen.getAllByRole('button');
      expect(dots[0]).toHaveClass('scale-100');
      expect(dots[3]).toHaveClass('scale-125');
    });
  });

  // ============================================================
  // CLICK INTERACTIONS
  // ============================================================

  describe('Click Interactions', () => {
    it('calls onDotClick with correct index when dot is clicked', () => {
      const onDotClick = jest.fn();
      render(<CarouselDots {...defaultProps} onDotClick={onDotClick} />);

      const dots = screen.getAllByRole('button');
      fireEvent.click(dots[2]);

      expect(onDotClick).toHaveBeenCalledTimes(1);
      expect(onDotClick).toHaveBeenCalledWith(2);
    });

    it('calls onDotClick with 0 when first dot is clicked', () => {
      const onDotClick = jest.fn();
      render(<CarouselDots {...defaultProps} onDotClick={onDotClick} />);

      const dots = screen.getAllByRole('button');
      fireEvent.click(dots[0]);

      expect(onDotClick).toHaveBeenCalledWith(0);
    });

    it('calls onDotClick with last index when last dot is clicked', () => {
      const onDotClick = jest.fn();
      render(<CarouselDots {...defaultProps} total={5} onDotClick={onDotClick} />);

      const dots = screen.getAllByRole('button');
      fireEvent.click(dots[4]);

      expect(onDotClick).toHaveBeenCalledWith(4);
    });

    it('allows clicking multiple dots in sequence', () => {
      const onDotClick = jest.fn();
      render(<CarouselDots {...defaultProps} onDotClick={onDotClick} />);

      const dots = screen.getAllByRole('button');
      fireEvent.click(dots[0]);
      fireEvent.click(dots[2]);
      fireEvent.click(dots[4]);

      expect(onDotClick).toHaveBeenCalledTimes(3);
      expect(onDotClick).toHaveBeenNthCalledWith(1, 0);
      expect(onDotClick).toHaveBeenNthCalledWith(2, 2);
      expect(onDotClick).toHaveBeenNthCalledWith(3, 4);
    });

    it('calls onDotClick even when clicking currently active dot', () => {
      const onDotClick = jest.fn();
      render(<CarouselDots {...defaultProps} current={2} onDotClick={onDotClick} />);

      const dots = screen.getAllByRole('button');
      fireEvent.click(dots[2]); // Click active dot

      expect(onDotClick).toHaveBeenCalledWith(2);
    });
  });

  // ============================================================
  // SIZE VARIANTS
  // ============================================================

  describe('Size Variants', () => {
    it('applies sm size classes when dotSize is sm', () => {
      render(<CarouselDots {...defaultProps} dotSize="sm" />);

      const dots = screen.getAllByRole('button');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('w-1.5', 'h-1.5');
      });
    });

    it('applies md size classes when dotSize is md', () => {
      render(<CarouselDots {...defaultProps} dotSize="md" />);

      const dots = screen.getAllByRole('button');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('w-2', 'h-2');
      });
    });

    it('applies lg size classes when dotSize is lg', () => {
      render(<CarouselDots {...defaultProps} dotSize="lg" />);

      const dots = screen.getAllByRole('button');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('w-2.5', 'h-2.5');
      });
    });

    it('defaults to md size when dotSize is not provided', () => {
      render(<CarouselDots total={3} current={0} onDotClick={jest.fn()} />);

      const dots = screen.getAllByRole('button');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('w-2', 'h-2');
      });
    });
  });

  // ============================================================
  // COLOR VARIANTS
  // ============================================================

  describe('Color Variants', () => {
    describe('Light Variant', () => {
      it('applies white background to active dot', () => {
        render(<CarouselDots {...defaultProps} variant="light" current={1} />);

        const dots = screen.getAllByRole('button');
        expect(dots[1]).toHaveClass('bg-white');
      });

      it('applies white/40 background to inactive dots', () => {
        render(<CarouselDots {...defaultProps} variant="light" current={0} />);

        const dots = screen.getAllByRole('button');
        expect(dots[1]).toHaveClass('bg-white/40');
        expect(dots[2]).toHaveClass('bg-white/40');
      });

      it('applies white focus ring', () => {
        render(<CarouselDots {...defaultProps} variant="light" />);

        const dots = screen.getAllByRole('button');
        expect(dots[0]).toHaveClass('focus:ring-white');
      });
    });

    describe('Dark Variant', () => {
      it('applies gray-900 background to active dot', () => {
        render(<CarouselDots {...defaultProps} variant="dark" current={1} />);

        const dots = screen.getAllByRole('button');
        expect(dots[1]).toHaveClass('bg-gray-900');
      });

      it('applies gray-300 background to inactive dots', () => {
        render(<CarouselDots {...defaultProps} variant="dark" current={0} />);

        const dots = screen.getAllByRole('button');
        expect(dots[1]).toHaveClass('bg-gray-300');
        expect(dots[2]).toHaveClass('bg-gray-300');
      });

      it('applies gray-900 focus ring', () => {
        render(<CarouselDots {...defaultProps} variant="dark" />);

        const dots = screen.getAllByRole('button');
        expect(dots[0]).toHaveClass('focus:ring-gray-900');
      });
    });

    it('defaults to light variant when not specified', () => {
      render(<CarouselDots total={3} current={0} onDotClick={jest.fn()} />);

      const dots = screen.getAllByRole('button');
      expect(dots[0]).toHaveClass('bg-white');
      expect(dots[1]).toHaveClass('bg-white/40');
    });
  });

  // ============================================================
  // ACCESSIBILITY (ARIA)
  // ============================================================

  describe('Accessibility', () => {
    it('has correct aria-label for each dot', () => {
      render(<CarouselDots {...defaultProps} total={3} />);

      expect(screen.getByLabelText('Ir a item 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Ir a item 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Ir a item 3')).toBeInTheDocument();
    });

    it('sets aria-current to true for active dot', () => {
      render(<CarouselDots {...defaultProps} current={1} />);

      const dots = screen.getAllByRole('button');
      expect(dots[1]).toHaveAttribute('aria-current', 'true');
    });

    it('sets aria-current to false for inactive dots', () => {
      render(<CarouselDots {...defaultProps} current={1} />);

      const dots = screen.getAllByRole('button');
      expect(dots[0]).toHaveAttribute('aria-current', 'false');
      expect(dots[2]).toHaveAttribute('aria-current', 'false');
    });

    it('uses 1-based indexing in aria-labels (user-friendly)', () => {
      render(<CarouselDots {...defaultProps} total={5} />);

      // Dot at index 0 should be labeled "Ir a item 1"
      const firstDot = screen.getByLabelText('Ir a item 1');
      expect(firstDot).toBeInTheDocument();

      // Dot at index 4 should be labeled "Ir a item 5"
      const lastDot = screen.getByLabelText('Ir a item 5');
      expect(lastDot).toBeInTheDocument();
    });

    it('all dots are focusable buttons', () => {
      render(<CarouselDots {...defaultProps} />);

      const dots = screen.getAllByRole('button');
      dots.forEach((dot) => {
        expect(dot.tagName).toBe('BUTTON');
      });
    });

    it('has focus outline styles for keyboard navigation', () => {
      render(<CarouselDots {...defaultProps} />);

      const dots = screen.getAllByRole('button');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2');
      });
    });
  });

  // ============================================================
  // STYLING
  // ============================================================

  describe('Styling', () => {
    it('applies rounded-full to all dots', () => {
      render(<CarouselDots {...defaultProps} />);

      const dots = screen.getAllByRole('button');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('rounded-full');
      });
    });

    it('applies transition classes for smooth animations', () => {
      render(<CarouselDots {...defaultProps} />);

      const dots = screen.getAllByRole('button');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('transition-all', 'duration-300');
      });
    });

    it('applies hover:scale-110 for hover effect', () => {
      render(<CarouselDots {...defaultProps} />);

      const dots = screen.getAllByRole('button');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('hover:scale-110');
      });
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles current index greater than total gracefully', () => {
      // Component doesn't validate this, but shouldn't crash
      render(<CarouselDots {...defaultProps} total={3} current={10} />);

      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(3);

      // No dot should have scale-125 since current is out of bounds
      dots.forEach((dot) => {
        expect(dot).toHaveClass('scale-100');
      });
    });

    it('handles negative current index gracefully', () => {
      render(<CarouselDots {...defaultProps} total={3} current={-1} />);

      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(3);

      // No dot should have scale-125 since current is negative
      dots.forEach((dot) => {
        expect(dot).toHaveClass('scale-100');
      });
    });

    it('handles very large total count', () => {
      render(<CarouselDots {...defaultProps} total={100} current={50} />);

      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(100);
      expect(dots[50]).toHaveClass('scale-125');
    });

    it('empty className does not affect rendering', () => {
      const { container } = render(<CarouselDots {...defaultProps} className="" />);

      expect(container.firstChild).toHaveClass('flex');
    });
  });
});
