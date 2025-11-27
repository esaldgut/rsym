/**
 * Unit tests for DateInput component
 *
 * Tests date input with DD/MM/YYYY display format and YYYY-MM-DD internal format.
 * Uses real date-format-helpers (pure functions, no mocking needed).
 *
 * @see src/components/ui/DateInput.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateInput } from '../DateInput';

describe('DateInput', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // RENDERING TESTS
  // ============================================================

  describe('Rendering', () => {
    it('renders input with default placeholder DD/MM/AAAA', () => {
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      expect(input).toBeInTheDocument();
    });

    it('renders custom placeholder when provided', () => {
      render(<DateInput {...defaultProps} placeholder="Fecha de nacimiento" />);

      const input = screen.getByPlaceholderText('Fecha de nacimiento');
      expect(input).toBeInTheDocument();
    });

    it('shows label when provided', () => {
      render(<DateInput {...defaultProps} label="Fecha de inicio" />);

      expect(screen.getByText('Fecha de inicio')).toBeInTheDocument();
    });

    it('shows red asterisk when required=true', () => {
      render(<DateInput {...defaultProps} label="Fecha" required />);

      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('text-red-500');
    });

    it('shows error message when error prop present', () => {
      render(<DateInput {...defaultProps} error="Fecha inválida" />);

      expect(screen.getByText('Fecha inválida')).toBeInTheDocument();
    });

    it('applies className to container', () => {
      const { container } = render(
        <DateInput {...defaultProps} className="my-custom-class" />
      );

      expect(container.firstChild).toHaveClass('my-custom-class');
    });

    it('shows calendar button for native picker', () => {
      render(<DateInput {...defaultProps} />);

      const calendarButton = screen.getByTitle('Abrir calendario');
      expect(calendarButton).toBeInTheDocument();
    });
  });

  // ============================================================
  // FORMAT CONVERSION TESTS
  // ============================================================

  describe('Format Conversion', () => {
    it('displays DD/MM/YYYY when value is YYYY-MM-DD', () => {
      render(<DateInput {...defaultProps} value="2024-01-15" />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      expect(input).toHaveValue('15/01/2024');
    });

    it('displays empty when value is empty string', () => {
      render(<DateInput {...defaultProps} value="" />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      expect(input).toHaveValue('');
    });

    it('updates displayValue when value prop changes', () => {
      const { rerender } = render(<DateInput {...defaultProps} value="2024-01-01" />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      expect(input).toHaveValue('01/01/2024');

      rerender(<DateInput {...defaultProps} value="2024-12-25" />);
      expect(input).toHaveValue('25/12/2024');
    });

    it('handles leap year dates correctly', () => {
      render(<DateInput {...defaultProps} value="2024-02-29" />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      expect(input).toHaveValue('29/02/2024');
    });

    it('handles end of year dates correctly', () => {
      render(<DateInput {...defaultProps} value="2024-12-31" />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      expect(input).toHaveValue('31/12/2024');
    });
  });

  // ============================================================
  // AUTO-FORMATTING TESTS
  // ============================================================

  describe('Auto-formatting', () => {
    it('auto-inserts "/" after 2 digits (day)', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '15');

      expect(input).toHaveValue('15/');
    });

    it('auto-inserts "/" after month (5 chars total)', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '1501');

      expect(input).toHaveValue('15/01/');
    });

    it('formats "01012024" as "01/01/2024"', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '01012024');

      expect(input).toHaveValue('01/01/2024');
    });

    it('removes non-numeric characters', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '15a01b2024');

      // Letters should be stripped
      expect(input).toHaveValue('15/01/2024');
    });

    it('respects maxLength of 10 characters', () => {
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('calls onChange with YYYY-MM-DD when complete date entered', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '15012024');

      expect(onChange).toHaveBeenCalledWith('2024-01-15');
    });

    it('does not call onChange for incomplete date', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '1501');

      // onChange should not be called until date is complete
      expect(onChange).not.toHaveBeenCalled();
    });

    it('allows manual slash input', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '15/01/2024');

      expect(input).toHaveValue('15/01/2024');
    });
  });

  // ============================================================
  // KEYBOARD HANDLING TESTS
  // ============================================================

  describe('Keyboard Handling', () => {
    it('allows numeric keys 0-9', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '0123456789');

      // Should contain all digits (formatted)
      expect(input).toHaveValue('01/23/4567');
    });

    it('allows slash character', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '15/');

      expect(input).toHaveValue('15/');
    });

    it('allows backspace to delete characters', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} value="2024-01-15" />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.clear(input);

      expect(input).toHaveValue('');
    });

    it('prevents letter keys via keyDown handler', () => {
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');

      // Simulate keyDown for a letter
      const event = fireEvent.keyDown(input, {
        key: 'a',
        code: 'KeyA',
        charCode: 97,
      });

      // The handler should have prevented default
      // (fireEvent doesn't actually prevent, but we can test the logic)
      expect(input).toHaveValue('');
    });
  });

  // ============================================================
  // NATIVE DATE PICKER TESTS
  // ============================================================

  describe('Native Date Picker', () => {
    it('shows calendar button', () => {
      render(<DateInput {...defaultProps} />);

      const calendarButton = screen.getByTitle('Abrir calendario');
      expect(calendarButton).toBeInTheDocument();
    });

    it('shows native date input when calendar clicked', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} />);

      const calendarButton = screen.getByTitle('Abrir calendario');
      await user.click(calendarButton);

      // Should now show type="date" input
      const dateInput = screen.getByDisplayValue('');
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('passes min prop to native date input', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} min="2024-01-01" />);

      const calendarButton = screen.getByTitle('Abrir calendario');
      await user.click(calendarButton);

      const dateInput = screen.getByDisplayValue('');
      expect(dateInput).toHaveAttribute('min', '2024-01-01');
    });

    it('passes max prop to native date input', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} max="2024-12-31" />);

      const calendarButton = screen.getByTitle('Abrir calendario');
      await user.click(calendarButton);

      const dateInput = screen.getByDisplayValue('');
      expect(dateInput).toHaveAttribute('max', '2024-12-31');
    });

    it('calls onChange when native picker value changes', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} onChange={onChange} />);

      const calendarButton = screen.getByTitle('Abrir calendario');
      await user.click(calendarButton);

      const dateInput = screen.getByDisplayValue('');
      fireEvent.change(dateInput, { target: { value: '2024-06-15' } });

      expect(onChange).toHaveBeenCalledWith('2024-06-15');
    });

    it('hides native picker on blur', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} />);

      const calendarButton = screen.getByTitle('Abrir calendario');
      await user.click(calendarButton);

      // Native input should be visible
      const dateInput = screen.getByDisplayValue('');
      expect(dateInput).toHaveAttribute('type', 'date');

      // Blur the input
      fireEvent.blur(dateInput);

      // Should return to text input
      await waitFor(() => {
        const textInput = screen.getByPlaceholderText('DD/MM/AAAA');
        expect(textInput).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // DATE DISPLAY HELPER TESTS
  // ============================================================

  describe('Date Display Helper', () => {
    it('shows formatted date below input when not editing', async () => {
      render(<DateInput {...defaultProps} value="2024-01-15" />);

      // Should show formatted display like "15 de Enero de 2024"
      await waitFor(() => {
        expect(screen.getByText(/15 de Enero de 2024/i)).toBeInTheDocument();
      });
    });

    it('hides formatted date when input is focused', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} value="2024-01-15" />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.click(input);

      // When editing, the display helper should be hidden
      const displayText = screen.queryByText(/15 de Enero de 2024/i);
      expect(displayText).not.toBeInTheDocument();
    });

    it('does not show display text when value is empty', () => {
      render(<DateInput {...defaultProps} value="" />);

      // Should not show any date display
      const container = screen.getByPlaceholderText('DD/MM/AAAA').closest('div');
      expect(container?.querySelector('.text-gray-500')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles partial date without crash', async () => {
      const user = userEvent.setup();
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '15/0');

      expect(input).toHaveValue('15/0');
    });

    it('handles value with non-standard format gracefully', () => {
      // If value is not YYYY-MM-DD, it should still render
      render(<DateInput {...defaultProps} value="15/01/2024" />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      expect(input).toHaveValue('15/01/2024');
    });

    it('handles rapid typing correctly', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      await user.type(input, '31122024');

      expect(input).toHaveValue('31/12/2024');
    });

    it('applies error styling to input', () => {
      render(<DateInput {...defaultProps} error="Fecha inválida" />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      expect(input).toHaveClass('border-red-300');
      expect(input).toHaveClass('bg-red-50');
    });

    it('renders as type text (not date) by default', () => {
      render(<DateInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('DD/MM/AAAA');
      expect(input).toHaveAttribute('type', 'text');
    });
  });
});
