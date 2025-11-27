/**
 * Unit tests for GuaranteedDeparturesSelector component
 *
 * Tests the departures selector:
 * - Header rendering
 * - Tab navigation (regular/specific)
 * - Regular departures management
 * - Specific departures management
 * - Day selection for regular departures
 * - Date ranges for specific departures
 * - Error message display
 *
 * @see src/components/product-wizard/components/GuaranteedDeparturesSelector.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuaranteedDeparturesSelector } from '../components/GuaranteedDeparturesSelector';

// Mock LocationMultiSelector
jest.mock('@/components/location/LocationMultiSelector', () => ({
  LocationMultiSelector: ({ onChange, helpText }: { onChange: (locations: unknown[]) => void; helpText?: string }) => (
    <div data-testid="location-multi-selector">
      <span>{helpText}</span>
      <button
        onClick={() => onChange([{ place: 'Mexico City', placeSub: 'CDMX', coordinates: { latitude: 19.4, longitude: -99.1 } }])}
        data-testid="select-location"
      >
        Select Location
      </button>
    </div>
  ),
}));

// Mock DateRangeInput
jest.mock('@/components/ui/DateRangeInput', () => ({
  DateRangeInput: ({ value, onChange }: { value: { start_datetime: string; end_datetime: string }; onChange: (range: unknown) => void }) => (
    <div data-testid="date-range-input">
      <input
        data-testid="start-date"
        value={value.start_datetime}
        onChange={(e) => onChange({ ...value, start_datetime: e.target.value })}
      />
      <input
        data-testid="end-date"
        value={value.end_datetime}
        onChange={(e) => onChange({ ...value, end_datetime: e.target.value })}
      />
    </div>
  ),
}));

describe('GuaranteedDeparturesSelector', () => {
  const defaultProps = {
    departures: {
      regular_departures: [],
      specific_departures: [],
    },
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // HEADER RENDERING
  // ============================================================

  describe('Header Rendering', () => {
    it('renders header with title', () => {
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      expect(screen.getByText('Salidas Garantizadas')).toBeInTheDocument();
    });

    it('renders header description', () => {
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      expect(screen.getByText(/Configura desde qué ciudades y cuándo salen tus tours/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // TAB NAVIGATION
  // ============================================================

  describe('Tab Navigation', () => {
    it('renders both tabs', () => {
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      // Tabs include count like "Salidas Regulares (0)"
      expect(screen.getByText(/Salidas Regulares \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Fechas Específicas \(0\)/)).toBeInTheDocument();
    });

    it('starts with regular tab active', () => {
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      // Use specific tab text with count to find the button
      const regularTab = screen.getByText(/Salidas Regulares \(0\)/).closest('button');
      expect(regularTab).toHaveClass('border-purple-500');
    });

    it('switches to specific tab when clicked', async () => {
      const user = userEvent.setup();
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      // Click the tab button (with count)
      await user.click(screen.getByText(/Fechas Específicas \(0\)/));

      const specificTab = screen.getByText(/Fechas Específicas \(0\)/).closest('button');
      expect(specificTab).toHaveClass('border-purple-500');
    });

    it('shows correct count in tabs', () => {
      const propsWithData = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: 'City1', placeSub: '', coordinates: undefined }, days: [] },
            { origin: { place: 'City2', placeSub: '', coordinates: undefined }, days: [] },
          ],
          specific_departures: [
            { origin: { place: 'City3', placeSub: '', coordinates: undefined }, date_ranges: [] },
          ],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithData} />);

      expect(screen.getByText(/Salidas Regulares \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Fechas Específicas \(1\)/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // REGULAR DEPARTURES - EMPTY STATE
  // ============================================================

  describe('Regular Departures - Empty State', () => {
    it('shows empty state message when no regular departures', () => {
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      expect(screen.getByText('Sin salidas regulares configuradas')).toBeInTheDocument();
    });

    it('shows empty state description', () => {
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      expect(screen.getByText(/Agrega ciudades de salida con sus días específicos de operación/)).toBeInTheDocument();
    });

    it('shows add first city button in empty state', () => {
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      expect(screen.getByText('Agregar Primera Ciudad de Salida')).toBeInTheDocument();
    });

    it('shows info box for regular departures', () => {
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      expect(screen.getByText(/Define salidas que se repiten semanalmente/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // REGULAR DEPARTURES - ADD/REMOVE
  // ============================================================

  describe('Regular Departures - Add/Remove', () => {
    it('adds regular departure when button clicked', async () => {
      const user = userEvent.setup();
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      await user.click(screen.getByText('Agregar Primera Ciudad de Salida'));

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        regular_departures: [
          { origin: { place: '', placeSub: '', coordinates: undefined }, days: [] },
        ],
        specific_departures: [],
      });
    });

    it('shows departure card after adding', () => {
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, days: [] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      expect(screen.getByText('Ciudad de Salida 1')).toBeInTheDocument();
    });

    it('shows add another city button when departures exist', () => {
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: 'City', placeSub: '', coordinates: undefined }, days: [] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      expect(screen.getByText('Agregar Otra Ciudad de Salida')).toBeInTheDocument();
    });

    it('removes regular departure when delete clicked', async () => {
      const user = userEvent.setup();
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, days: [] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      const deleteButton = screen.getByTitle('Eliminar ciudad de salida');
      await user.click(deleteButton);

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        regular_departures: [],
        specific_departures: [],
      });
    });
  });

  // ============================================================
  // REGULAR DEPARTURES - LOCATION SELECTION
  // ============================================================

  describe('Regular Departures - Location Selection', () => {
    it('shows LocationMultiSelector for empty origin', () => {
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, days: [] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      expect(screen.getByTestId('location-multi-selector')).toBeInTheDocument();
    });

    it('shows selected location when origin has place', () => {
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: 'Mexico City', placeSub: 'CDMX', coordinates: undefined }, days: [] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      expect(screen.getByText('Mexico City')).toBeInTheDocument();
      expect(screen.getByText('CDMX')).toBeInTheDocument();
    });

    it('shows change city button when location selected', () => {
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: 'Mexico City', placeSub: '', coordinates: undefined }, days: [] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      expect(screen.getByTitle('Cambiar ciudad')).toBeInTheDocument();
    });
  });

  // ============================================================
  // REGULAR DEPARTURES - DAY SELECTION
  // ============================================================

  describe('Regular Departures - Day Selection', () => {
    it('shows all week days', () => {
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, days: [] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('X')).toBeInTheDocument();
      expect(screen.getByText('J')).toBeInTheDocument();
      expect(screen.getByText('V')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('shows day labels', () => {
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, days: [] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      expect(screen.getByText('Lunes')).toBeInTheDocument();
      expect(screen.getByText('Martes')).toBeInTheDocument();
      expect(screen.getByText('Miércoles')).toBeInTheDocument();
    });

    it('selects day when clicked', async () => {
      const user = userEvent.setup();
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, days: [] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      // Click on Monday (L button with Lunes label)
      const mondayButton = screen.getByText('L').closest('button');
      await user.click(mondayButton!);

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        regular_departures: [
          { origin: { place: '', placeSub: '', coordinates: undefined }, days: ['MONDAY'] },
        ],
        specific_departures: [],
      });
    });

    it('shows selected days with different styling', () => {
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, days: ['MONDAY', 'FRIDAY'] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      const mondayButton = screen.getByText('L').closest('button');
      const fridayButton = screen.getByText('V').closest('button');
      const wednesdayButton = screen.getByText('X').closest('button');

      expect(mondayButton).toHaveClass('bg-purple-100');
      expect(fridayButton).toHaveClass('bg-purple-100');
      expect(wednesdayButton).not.toHaveClass('bg-purple-100');
    });
  });

  // ============================================================
  // REGULAR DEPARTURES - PREVIEW
  // ============================================================

  describe('Regular Departures - Preview', () => {
    it('shows preview when origin and days are set', () => {
      const propsWithComplete = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: 'Mexico City', placeSub: '', coordinates: undefined }, days: ['MONDAY', 'WEDNESDAY'] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithComplete} />);

      expect(screen.getByText('Vista Previa')).toBeInTheDocument();
      expect(screen.getByText('→ L, X')).toBeInTheDocument();
    });

    it('does not show preview without origin', () => {
      const propsWithDays = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, days: ['MONDAY'] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDays} />);

      expect(screen.queryByText('Vista Previa')).not.toBeInTheDocument();
    });

    it('does not show preview without days', () => {
      const propsWithOrigin = {
        ...defaultProps,
        departures: {
          regular_departures: [
            { origin: { place: 'Mexico City', placeSub: '', coordinates: undefined }, days: [] },
          ],
          specific_departures: [],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithOrigin} />);

      expect(screen.queryByText('Vista Previa')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // SPECIFIC DEPARTURES - EMPTY STATE
  // ============================================================

  describe('Specific Departures - Empty State', () => {
    it('shows empty state message when no specific departures', async () => {
      const user = userEvent.setup();
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));

      expect(screen.getByText('Sin fechas específicas configuradas')).toBeInTheDocument();
    });

    it('shows add first city button in empty state', async () => {
      const user = userEvent.setup();
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));

      expect(screen.getByText('Agregar Primera Ciudad con Rangos de Fechas')).toBeInTheDocument();
    });

    it('shows info box for specific departures', async () => {
      const user = userEvent.setup();
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));

      expect(screen.getByText(/Define salidas en rangos de fechas específicos/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // SPECIFIC DEPARTURES - ADD/REMOVE
  // ============================================================

  describe('Specific Departures - Add/Remove', () => {
    it('adds specific departure when button clicked', async () => {
      const user = userEvent.setup();
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));
      await user.click(screen.getByText('Agregar Primera Ciudad con Rangos de Fechas'));

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        regular_departures: [],
        specific_departures: [
          { origin: { place: '', placeSub: '', coordinates: undefined }, date_ranges: [] },
        ],
      });
    });

    it('shows departure card after adding', async () => {
      const user = userEvent.setup();
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [],
          specific_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, date_ranges: [] },
          ],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));

      expect(screen.getByText('Salida Específica 1')).toBeInTheDocument();
    });

    it('shows add another city button when departures exist', async () => {
      const user = userEvent.setup();
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [],
          specific_departures: [
            { origin: { place: 'City', placeSub: '', coordinates: undefined }, date_ranges: [] },
          ],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));

      expect(screen.getByText('Agregar Otra Ciudad con Rangos de Fechas')).toBeInTheDocument();
    });

    it('removes specific departure when delete clicked', async () => {
      const user = userEvent.setup();
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [],
          specific_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, date_ranges: [] },
          ],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));

      const deleteButton = screen.getByTitle('Eliminar salida específica');
      await user.click(deleteButton);

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        regular_departures: [],
        specific_departures: [],
      });
    });
  });

  // ============================================================
  // SPECIFIC DEPARTURES - DATE RANGES
  // ============================================================

  describe('Specific Departures - Date Ranges', () => {
    it('shows add date range button', async () => {
      const user = userEvent.setup();
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [],
          specific_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, date_ranges: [] },
          ],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));

      expect(screen.getByText('Agregar rango de fechas')).toBeInTheDocument();
    });

    it('adds date range when button clicked', async () => {
      const user = userEvent.setup();
      const propsWithDeparture = {
        ...defaultProps,
        departures: {
          regular_departures: [],
          specific_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, date_ranges: [] },
          ],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDeparture} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));
      await user.click(screen.getByText('Agregar rango de fechas'));

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        regular_departures: [],
        specific_departures: [
          { origin: { place: '', placeSub: '', coordinates: undefined }, date_ranges: [{ start_datetime: '', end_datetime: '' }] },
        ],
      });
    });

    it('shows DateRangeInput when date range exists', async () => {
      const user = userEvent.setup();
      const propsWithDateRange = {
        ...defaultProps,
        departures: {
          regular_departures: [],
          specific_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, date_ranges: [{ start_datetime: '', end_datetime: '' }] },
          ],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDateRange} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));

      expect(screen.getByTestId('date-range-input')).toBeInTheDocument();
    });

    it('shows range label with number', async () => {
      const user = userEvent.setup();
      const propsWithDateRange = {
        ...defaultProps,
        departures: {
          regular_departures: [],
          specific_departures: [
            { origin: { place: '', placeSub: '', coordinates: undefined }, date_ranges: [{ start_datetime: '', end_datetime: '' }] },
          ],
        },
      };

      render(<GuaranteedDeparturesSelector {...propsWithDateRange} />);

      await user.click(screen.getByText(/Fechas Específicas \(\d+\)/));

      expect(screen.getByText('Rango 1')).toBeInTheDocument();
    });
  });

  // ============================================================
  // ERROR MESSAGE
  // ============================================================

  describe('Error Message', () => {
    it('shows error message when error prop provided', () => {
      const propsWithError = {
        ...defaultProps,
        error: 'Por favor selecciona al menos una salida',
      };

      render(<GuaranteedDeparturesSelector {...propsWithError} />);

      expect(screen.getByText('Por favor selecciona al menos una salida')).toBeInTheDocument();
    });

    it('does not show error when no error prop', () => {
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('error message has red styling', () => {
      const propsWithError = {
        ...defaultProps,
        error: 'Error message',
      };

      render(<GuaranteedDeparturesSelector {...propsWithError} />);

      const errorContainer = screen.getByText('Error message').closest('div');
      expect(errorContainer).toHaveClass('bg-red-50');
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles undefined departures gracefully', () => {
      const propsWithUndefined = {
        ...defaultProps,
        departures: {
          regular_departures: undefined as unknown as [],
          specific_departures: undefined as unknown as [],
        },
      };

      expect(() => render(<GuaranteedDeparturesSelector {...propsWithUndefined} />)).not.toThrow();
    });

    it('handles empty arrays gracefully', () => {
      render(<GuaranteedDeparturesSelector {...defaultProps} />);

      expect(screen.getByText('Sin salidas regulares configuradas')).toBeInTheDocument();
    });
  });
});
