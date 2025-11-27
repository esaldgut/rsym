/**
 * Unit tests for DateRangeInput component
 *
 * Tests date range selection with single date toggle and Spanish formatting.
 * Mocks DateInput to isolate component behavior.
 *
 * @see src/components/ui/DateRangeInput.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeInput } from '../DateRangeInput';

// Mock DateInput to isolate tests
jest.mock('../DateInput', () => ({
  DateInput: jest.fn(({ value, onChange, label, min }) => (
    <input
      data-testid={`date-input-${label?.replace(/\s+/g, '-').toLowerCase() || 'unlabeled'}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-min={min}
      aria-label={label}
    />
  ))
}));

describe('DateRangeInput', () => {
  const defaultProps = {
    value: {
      start_datetime: '',
      end_datetime: ''
    },
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // RENDERING TESTS
  // ============================================================

  describe('Rendering', () => {
    it('renders single date checkbox', () => {
      render(<DateRangeInput {...defaultProps} />);

      const checkbox = screen.getByLabelText('Fecha única (mismo día)');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('shows label when provided', () => {
      render(<DateRangeInput {...defaultProps} label="Periodo de viaje" />);

      expect(screen.getByText('Periodo de viaje')).toBeInTheDocument();
    });

    it('renders two DateInputs when not single date mode', () => {
      render(<DateRangeInput {...defaultProps} value={{
        start_datetime: '2024-01-01',
        end_datetime: '2024-01-15'
      }} />);

      const startInput = screen.getByTestId('date-input-fecha-de-inicio');
      const endInput = screen.getByTestId('date-input-fecha-de-fin');

      expect(startInput).toBeInTheDocument();
      expect(endInput).toBeInTheDocument();
    });

    it('renders only one DateInput when single date mode', () => {
      render(<DateRangeInput {...defaultProps} value={{
        start_datetime: '2024-01-01',
        end_datetime: '2024-01-01'
      }} />);

      const startInput = screen.getByTestId('date-input-fecha-de-inicio');
      expect(startInput).toBeInTheDocument();

      // End input should not be present
      expect(screen.queryByTestId('date-input-fecha-de-fin')).not.toBeInTheDocument();
    });

    it('applies className to container', () => {
      const { container } = render(
        <DateRangeInput {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  // ============================================================
  // SINGLE DATE TOGGLE TESTS
  // ============================================================

  describe('Single Date Toggle', () => {
    it('checkbox is checked when start === end and not empty', () => {
      render(<DateRangeInput {...defaultProps} value={{
        start_datetime: '2024-01-15',
        end_datetime: '2024-01-15'
      }} />);

      const checkbox = screen.getByLabelText('Fecha única (mismo día)');
      expect(checkbox).toBeChecked();
    });

    it('checkbox is unchecked when start !== end', () => {
      render(<DateRangeInput {...defaultProps} value={{
        start_datetime: '2024-01-01',
        end_datetime: '2024-01-15'
      }} />);

      const checkbox = screen.getByLabelText('Fecha única (mismo día)');
      expect(checkbox).not.toBeChecked();
    });

    it('checkbox is unchecked when both dates are empty', () => {
      render(<DateRangeInput {...defaultProps} value={{
        start_datetime: '',
        end_datetime: ''
      }} />);

      const checkbox = screen.getByLabelText('Fecha única (mismo día)');
      expect(checkbox).not.toBeChecked();
    });

    it('activating checkbox sets end_datetime = start_datetime', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-01-15',
          end_datetime: '2024-01-20'
        }}
        onChange={onChange}
      />);

      const checkbox = screen.getByLabelText('Fecha única (mismo día)');
      await user.click(checkbox);

      expect(onChange).toHaveBeenCalledWith({
        start_datetime: '2024-01-15',
        end_datetime: '2024-01-15'
      });
    });

    it('deactivating checkbox shows second date input', async () => {
      const user = userEvent.setup();

      const { rerender } = render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-01-15',
          end_datetime: '2024-01-15'
        }}
      />);

      // Initially single date mode - no end input
      expect(screen.queryByTestId('date-input-fecha-de-fin')).not.toBeInTheDocument();

      const checkbox = screen.getByLabelText('Fecha única (mismo día)');
      await user.click(checkbox);

      // Rerender with updated state to simulate the toggle
      rerender(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-01-15',
          end_datetime: '2024-01-20' // Different dates now
        }}
      />);

      expect(screen.getByTestId('date-input-fecha-de-fin')).toBeInTheDocument();
    });
  });

  // ============================================================
  // DATE RANGE LOGIC TESTS
  // ============================================================

  describe('Date Range Logic', () => {
    it('changing start_datetime calls onChange with updated value', () => {
      const onChange = jest.fn();

      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-01-01',
          end_datetime: '2024-01-15'
        }}
        onChange={onChange}
      />);

      const startInput = screen.getByTestId('date-input-fecha-de-inicio');
      fireEvent.change(startInput, { target: { value: '2024-02-01' } });

      expect(onChange).toHaveBeenCalledWith({
        start_datetime: '2024-02-01',
        end_datetime: '2024-01-15'
      });
    });

    it('changing end_datetime calls onChange with updated value', () => {
      const onChange = jest.fn();

      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-01-01',
          end_datetime: '2024-01-15'
        }}
        onChange={onChange}
      />);

      const endInput = screen.getByTestId('date-input-fecha-de-fin');
      fireEvent.change(endInput, { target: { value: '2024-01-31' } });

      expect(onChange).toHaveBeenCalledWith({
        start_datetime: '2024-01-01',
        end_datetime: '2024-01-31'
      });
    });

    it('in single date mode, changing start also changes end', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-01-15',
          end_datetime: '2024-01-15'
        }}
        onChange={onChange}
      />);

      // Verify single date mode is active
      expect(screen.getByLabelText('Fecha única (mismo día)')).toBeChecked();

      const startInput = screen.getByTestId('date-input-fecha-de-inicio');
      fireEvent.change(startInput, { target: { value: '2024-02-20' } });

      expect(onChange).toHaveBeenCalledWith({
        start_datetime: '2024-02-20',
        end_datetime: '2024-02-20'
      });
    });

    it('end date min is set to start_datetime', () => {
      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-01-15',
          end_datetime: '2024-01-20'
        }}
      />);

      const endInput = screen.getByTestId('date-input-fecha-de-fin');
      expect(endInput).toHaveAttribute('data-min', '2024-01-15');
    });

    it('end date min falls back to prop min when start is empty', () => {
      // Render with empty start but different end to show the end input
      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '',
          end_datetime: '2024-01-15'
        }}
        min="2024-01-01"
      />);

      // The end input should be visible since dates are different
      const endInput = screen.getByTestId('date-input-fecha-de-fin');
      expect(endInput).toHaveAttribute('data-min', '2024-01-01');
    });
  });

  // ============================================================
  // DATE DISPLAY FORMAT TESTS
  // ============================================================

  describe('Date Display Format', () => {
    it('shows preview when start_datetime has value', () => {
      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-01-15',
          end_datetime: '2024-01-15'
        }}
      />);

      // Should show the preview container
      expect(screen.getByText(/Fecha única:|Rango de fechas:/)).toBeInTheDocument();
    });

    it('does not show preview when start_datetime is empty', () => {
      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '',
          end_datetime: ''
        }}
      />);

      // Should not show the preview
      expect(screen.queryByText(/Fecha única:|Rango de fechas:/)).not.toBeInTheDocument();
    });

    it('shows "Fecha única:" label when in single date mode', () => {
      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-01-15',
          end_datetime: '2024-01-15'
        }}
      />);

      expect(screen.getByText('Fecha única:')).toBeInTheDocument();
    });

    it('shows "Rango de fechas:" label when in range mode', () => {
      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-01-01',
          end_datetime: '2024-01-15'
        }}
      />);

      expect(screen.getByText('Rango de fechas:')).toBeInTheDocument();
    });

    it('formats single date in Spanish', () => {
      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-06-15',
          end_datetime: '2024-06-15'
        }}
      />);

      // Should show Spanish formatted date (month varies by timezone, but year should be present)
      // The format is like "15 jun 2024" or "14 jun 2024" depending on timezone
      expect(screen.getByText(/\d+ \w+\.? 2024/i)).toBeInTheDocument();
    });

    it('formats date range in Spanish', () => {
      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '2024-06-01',
          end_datetime: '2024-06-15'
        }}
      />);

      // Should show range with dash separator and year
      // Format: "X mon - Y mon 2024" pattern
      expect(screen.getByText(/\d+ \w+\.? - \d+ \w+\.? 2024/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // ERROR HANDLING TESTS
  // ============================================================

  describe('Error Handling', () => {
    it('shows error message with icon', () => {
      render(<DateRangeInput {...defaultProps} error="Las fechas son inválidas" />);

      expect(screen.getByText('Las fechas son inválidas')).toBeInTheDocument();
    });

    it('error message has red color', () => {
      render(<DateRangeInput {...defaultProps} error="Error de fecha" />);

      const errorText = screen.getByText('Error de fecha');
      expect(errorText.closest('div')).toHaveClass('text-red-600');
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles undefined label gracefully', () => {
      render(<DateRangeInput {...defaultProps} />);

      // Should not crash and checkbox should still render
      expect(screen.getByLabelText('Fecha única (mismo día)')).toBeInTheDocument();
    });

    it('handles empty string dates correctly', () => {
      const onChange = jest.fn();

      render(<DateRangeInput {...defaultProps}
        value={{
          start_datetime: '',
          end_datetime: ''
        }}
        onChange={onChange}
      />);

      const startInput = screen.getByTestId('date-input-fecha-de-inicio');
      fireEvent.change(startInput, { target: { value: '2024-01-01' } });

      expect(onChange).toHaveBeenCalled();
    });

    it('checkbox has correct id for accessibility', () => {
      render(<DateRangeInput {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'single-date-toggle');
    });
  });
});
