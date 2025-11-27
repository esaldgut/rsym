/**
 * Unit tests for SeasonConfiguration component
 *
 * Tests season management including CRUD operations, pricing, currency handling,
 * child ranges, and legacy data migration.
 *
 * @see src/components/product-wizard/components/SeasonConfiguration.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeasonConfiguration } from '../components/SeasonConfiguration';
import type { ProductSeasonInput } from '@/generated/graphql';

// Helper to create a mock season
function createMockSeason(overrides: Partial<ProductSeasonInput> = {}): ProductSeasonInput {
  return {
    category: 'Primera',
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    schedules: '',
    aditional_services: '',
    number_of_nights: '3',
    prices: [{
      currency: 'MXN',
      price: 15000,
      room_name: 'Doble',
      max_adult: 2,
      max_minor: 2,
      children: []
    }],
    extra_prices: [],
    ...overrides
  };
}

describe('SeasonConfiguration', () => {
  const defaultProps = {
    seasons: [],
    onChange: jest.fn(),
    productType: 'circuit' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // RENDERING TESTS
  // ============================================================

  describe('Rendering', () => {
    it('renders title "Temporadas y Precios"', () => {
      render(<SeasonConfiguration {...defaultProps} />);

      expect(screen.getByText('Temporadas y Precios')).toBeInTheDocument();
    });

    it('renders "Agregar Temporada" button', () => {
      render(<SeasonConfiguration {...defaultProps} />);

      expect(screen.getByText('+ Agregar Temporada')).toBeInTheDocument();
    });

    it('shows empty state when no seasons', () => {
      render(<SeasonConfiguration {...defaultProps} />);

      expect(screen.getByText('No hay temporadas configuradas')).toBeInTheDocument();
      expect(screen.getByText('Crear Primera Temporada')).toBeInTheDocument();
    });

    it('renders season cards when seasons exist', () => {
      const seasons = [createMockSeason()];
      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      // Check for season header title (h4 element)
      expect(screen.getByRole('heading', { name: 'Primera', level: 4 })).toBeInTheDocument();
      expect(screen.getByText(/2024-01-01 - 2024-03-31/)).toBeInTheDocument();
    });

    it('shows error message when error prop is provided', () => {
      render(<SeasonConfiguration {...defaultProps} error="Error de temporada" />);

      expect(screen.getByText('Error de temporada')).toBeInTheDocument();
    });
  });

  // ============================================================
  // ADD SEASON TESTS
  // ============================================================

  describe('Add Season', () => {
    it('calls onChange with new season when "Agregar Temporada" clicked', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('+ Agregar Temporada'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          category: 'Primera',
          start_date: '',
          end_date: '',
          prices: expect.arrayContaining([
            expect.objectContaining({
              currency: 'MXN',
              room_name: 'Doble',
              max_adult: 2,
              max_minor: 2
            })
          ])
        })
      ]);
    });

    it('adds season from empty state button', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Crear Primera Temporada'));

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('initializes package with number_of_nights = 3', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} productType="package" onChange={onChange} />);

      await user.click(screen.getByText('+ Agregar Temporada'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          number_of_nights: '3'
        })
      ]);
    });

    it('initializes circuit without number_of_nights', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} productType="circuit" onChange={onChange} />);

      await user.click(screen.getByText('+ Agregar Temporada'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          number_of_nights: ''
        })
      ]);
    });
  });

  // ============================================================
  // UPDATE SEASON TESTS
  // ============================================================

  describe('Update Season', () => {
    it('updates start_date when date input changes', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      const startDateInput = screen.getByDisplayValue('2024-01-01');
      fireEvent.change(startDateInput, { target: { value: '2024-02-01' } });

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          start_date: '2024-02-01'
        })
      ]);
    });

    it('updates end_date when date input changes', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      const endDateInput = screen.getByDisplayValue('2024-03-31');
      fireEvent.change(endDateInput, { target: { value: '2024-04-30' } });

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          end_date: '2024-04-30'
        })
      ]);
    });

    it('updates allotment as number', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      const allotmentInput = screen.getByPlaceholderText('Ej: 90');
      fireEvent.change(allotmentInput, { target: { value: '50' } });

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          allotment: 50
        })
      ]);
    });

    it('converts empty allotment to 0', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason({ allotment: 100 })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      const allotmentInput = screen.getByDisplayValue('100');
      fireEvent.change(allotmentInput, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          allotment: 0
        })
      ]);
    });

    it('updates category when star rating clicked', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason()];
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      // Find and click the 5-star (Lujo) button
      const lujoButton = screen.getByRole('button', { name: /Lujo/i });
      await user.click(lujoButton);

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          category: 'Lujo'
        })
      ]);
    });
  });

  // ============================================================
  // REMOVE SEASON TESTS
  // ============================================================

  describe('Remove Season', () => {
    it('shows remove button only when multiple seasons exist', () => {
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      expect(screen.queryByText('🗑️ Eliminar')).not.toBeInTheDocument();
    });

    it('shows remove button when 2+ seasons exist', () => {
      const seasons = [createMockSeason(), createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      expect(screen.getAllByText('🗑️ Eliminar')).toHaveLength(2);
    });

    it('removes season when delete button clicked', async () => {
      const onChange = jest.fn();
      const seasons = [
        createMockSeason({ category: 'Primera' }),
        createMockSeason({ category: 'Lujo' })
      ];
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      // Click delete on first season
      const deleteButtons = screen.getAllByText('🗑️ Eliminar');
      await user.click(deleteButtons[0]);

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ category: 'Lujo' })
      ]);
    });
  });

  // ============================================================
  // DUPLICATE SEASON TESTS
  // ============================================================

  describe('Duplicate Season', () => {
    it('shows duplicate button for each season', () => {
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      expect(screen.getByText('📋 Duplicar')).toBeInTheDocument();
    });

    it('duplicates season when button clicked', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason({ category: 'Primera' })];
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      await user.click(screen.getByText('📋 Duplicar'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ category: 'Primera' }),
        expect.objectContaining({ category: 'Primera' }) // Duplicated
      ]);
    });

    it('deep clones prices and children arrays', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason({
        prices: [{
          currency: 'MXN',
          price: 1000,
          room_name: 'Doble',
          max_adult: 2,
          max_minor: 1,
          children: [{ name: 'Menor', min_minor_age: 0, max_minor_age: 12, child_price: 500 }]
        }]
      })];
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      await user.click(screen.getByText('📋 Duplicar'));

      const calledWith = onChange.mock.calls[0][0];
      expect(calledWith).toHaveLength(2);
      expect(calledWith[1].prices[0].children[0]).toEqual(
        expect.objectContaining({ name: 'Menor', child_price: 500 })
      );
    });
  });

  // ============================================================
  // ACCORDION EXPAND/COLLAPSE TESTS
  // ============================================================

  describe('Accordion Expand/Collapse', () => {
    it('expands first season by default', () => {
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      // Should show content (Fecha de Inicio label)
      expect(screen.getByText('Fecha de Inicio')).toBeInTheDocument();
    });

    it('collapses season when header clicked', async () => {
      const seasons = [createMockSeason()];
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      // Find the header by the h4 title and get the clickable parent
      const seasonTitle = screen.getByRole('heading', { name: 'Primera', level: 4 });
      const clickableHeader = seasonTitle.closest('div.bg-gray-50');
      expect(clickableHeader).toBeInTheDocument();

      if (clickableHeader) await user.click(clickableHeader);

      // Content should be hidden
      expect(screen.queryByText('Fecha de Inicio')).not.toBeInTheDocument();
    });

    it('expands different season when clicked', async () => {
      const seasons = [
        createMockSeason({ category: 'Primera' }),
        createMockSeason({ category: 'Lujo' })
      ];
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      // First season is expanded by default, verify content shows
      expect(screen.getByText('Fecha de Inicio')).toBeInTheDocument();

      // Find second season header by heading and get clickable parent
      const lujoTitle = screen.getByRole('heading', { name: 'Lujo', level: 4 });
      const clickableHeader = lujoTitle.closest('div.bg-gray-50');
      expect(clickableHeader).toBeInTheDocument();

      if (clickableHeader) await user.click(clickableHeader);

      // Content should still be visible (now from second season)
      expect(screen.getByText('Fecha de Inicio')).toBeInTheDocument();
    });
  });

  // ============================================================
  // CURRENCY TESTS
  // ============================================================

  describe('Currency Management', () => {
    it('shows currency selector with MXN default', () => {
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      const currencySelect = screen.getByRole('combobox');
      expect(currencySelect).toHaveValue('MXN');
    });

    it('updates all prices when currency changed', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason()];
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      const currencySelect = screen.getByRole('combobox');
      await user.selectOptions(currencySelect, 'USD');

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          prices: expect.arrayContaining([
            expect.objectContaining({ currency: 'USD' })
          ])
        })
      ]);
    });

    it('initializes currency from existing season data', () => {
      const seasons = [createMockSeason({
        prices: [{ currency: 'USD', price: 1000, room_name: 'Doble', max_adult: 2, max_minor: 0, children: [] }]
      })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      const currencySelect = screen.getByRole('combobox');
      expect(currencySelect).toHaveValue('USD');
    });
  });

  // ============================================================
  // PRICE OPTIONS TESTS
  // ============================================================

  describe('Price Options', () => {
    it('shows "Agregar Precio" button when less than 3 prices', () => {
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      expect(screen.getByText('+ Agregar Precio')).toBeInTheDocument();
    });

    it('shows "Máximo alcanzado" when 3 prices exist', () => {
      const seasons = [createMockSeason({
        prices: [
          { currency: 'MXN', price: 1000, room_name: 'Sencilla', max_adult: 1, max_minor: 0, children: [] },
          { currency: 'MXN', price: 1500, room_name: 'Doble', max_adult: 2, max_minor: 2, children: [] },
          { currency: 'MXN', price: 2000, room_name: 'Triple', max_adult: 3, max_minor: 2, children: [] }
        ]
      })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      expect(screen.getByText('Máximo alcanzado')).toBeInTheDocument();
    });

    it('adds next available room type when button clicked', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason()]; // Has 'Doble'
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      await user.click(screen.getByText('+ Agregar Precio'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          prices: expect.arrayContaining([
            expect.objectContaining({ room_name: 'Doble' }),
            expect.objectContaining({ room_name: 'Sencilla' }) // Next available
          ])
        })
      ]);
    });

    it('removes price option when delete clicked', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason({
        prices: [
          { currency: 'MXN', price: 1000, room_name: 'Sencilla', max_adult: 1, max_minor: 0, children: [] },
          { currency: 'MXN', price: 1500, room_name: 'Doble', max_adult: 2, max_minor: 2, children: [] }
        ]
      })];
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      const deleteButtons = screen.getAllByText('Eliminar');
      await user.click(deleteButtons[0]); // Delete first price

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          prices: [expect.objectContaining({ room_name: 'Doble' })]
        })
      ]);
    });

    it('updates price when input changes', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      const priceInput = screen.getByDisplayValue('15000');
      fireEvent.change(priceInput, { target: { value: '20000' } });

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          prices: [expect.objectContaining({ price: 20000 })]
        })
      ]);
    });
  });

  // ============================================================
  // CHILD RANGE TESTS
  // ============================================================

  describe('Child Ranges', () => {
    it('shows child range section when max_minor > 0', () => {
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      expect(screen.getByText('Precios para Menores')).toBeInTheDocument();
    });

    it('hides child range section when max_minor = 0', () => {
      const seasons = [createMockSeason({
        prices: [{ currency: 'MXN', price: 1000, room_name: 'Sencilla', max_adult: 1, max_minor: 0, children: [] }]
      })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      expect(screen.queryByText('Precios para Menores')).not.toBeInTheDocument();
    });

    it('adds child range when button clicked', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason()];
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      await user.click(screen.getByText('+ Agregar Rango'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          prices: [expect.objectContaining({
            children: [expect.objectContaining({
              name: 'Menor',
              min_minor_age: 0,
              max_minor_age: 12,
              child_price: 0
            })]
          })]
        })
      ]);
    });

    it('updates child range name', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason({
        prices: [{
          currency: 'MXN',
          price: 1000,
          room_name: 'Doble',
          max_adult: 2,
          max_minor: 2,
          children: [{ name: 'Menor', min_minor_age: 0, max_minor_age: 12, child_price: 500 }]
        }]
      })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      const nameInput = screen.getByDisplayValue('Menor');
      fireEvent.change(nameInput, { target: { value: 'Infante' } });

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          prices: [expect.objectContaining({
            children: [expect.objectContaining({ name: 'Infante' })]
          })]
        })
      ]);
    });
  });

  // ============================================================
  // EXTRA PRICES TESTS
  // ============================================================

  describe('Extra Night Prices', () => {
    it('shows extra prices section when prices exist', () => {
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      expect(screen.getByText('Precios por Noche Extra')).toBeInTheDocument();
    });

    it('updates extra price for room type', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason()];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      // Find extra price input (there's one for each room type)
      const extraPriceInputs = screen.getAllByPlaceholderText('0.00');
      fireEvent.change(extraPriceInputs[0], { target: { value: '1500' } });

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          extra_prices: expect.arrayContaining([
            expect.objectContaining({ price: 1500, room_name: 'Doble' })
          ])
        })
      ]);
    });
  });

  // ============================================================
  // LEGACY MIGRATION TESTS
  // ============================================================

  describe('Legacy Data Migration', () => {
    it('migrates "Standard" to "Doble"', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason({
        prices: [{ currency: 'MXN', price: 1000, room_name: 'Standard', max_adult: 2, max_minor: 2, children: [] }]
      })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([
          expect.objectContaining({
            prices: [expect.objectContaining({ room_name: 'Doble' })]
          })
        ]);
      });
    });

    it('migrates "Estándar" to "Doble"', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason({
        prices: [{ currency: 'MXN', price: 1000, room_name: 'Estándar', max_adult: 2, max_minor: 2, children: [] }]
      })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([
          expect.objectContaining({
            prices: [expect.objectContaining({ room_name: 'Doble' })]
          })
        ]);
      });
    });

    it('migrates lowercase "standard" to "Doble"', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason({
        prices: [{ currency: 'MXN', price: 1000, room_name: 'standard', max_adult: 2, max_minor: 2, children: [] }]
      })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([
          expect.objectContaining({
            prices: [expect.objectContaining({ room_name: 'Doble' })]
          })
        ]);
      });
    });
  });

  // ============================================================
  // CATEGORY SELECTION TESTS
  // ============================================================

  describe('Category Selection', () => {
    it('highlights selected category', () => {
      const seasons = [createMockSeason({ category: 'Lujo' })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      const lujoButton = screen.getByRole('button', { name: /Lujo/i });
      expect(lujoButton).toHaveClass('bg-purple-100');
    });

    it('shows "Primera superior" for 4 stars', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason()];
      const user = userEvent.setup();

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      const primeraSupButton = screen.getByRole('button', { name: /Primera superior/i });
      await user.click(primeraSupButton);

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ category: 'Primera superior' })
      ]);
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles empty prices array gracefully', () => {
      const seasons = [createMockSeason({ prices: [] })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      expect(screen.getByText('+ Agregar Precio')).toBeInTheDocument();
    });

    it('handles undefined prices gracefully', () => {
      const seasons = [createMockSeason({ prices: undefined })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} />);

      expect(screen.getByText('+ Agregar Precio')).toBeInTheDocument();
    });

    it('prevents adding more than 3 room types', async () => {
      const onChange = jest.fn();
      const seasons = [createMockSeason({
        prices: [
          { currency: 'MXN', price: 1000, room_name: 'Sencilla', max_adult: 1, max_minor: 0, children: [] },
          { currency: 'MXN', price: 1500, room_name: 'Doble', max_adult: 2, max_minor: 2, children: [] },
          { currency: 'MXN', price: 2000, room_name: 'Triple', max_adult: 3, max_minor: 2, children: [] }
        ]
      })];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      // Should not show add button
      expect(screen.queryByText('+ Agregar Precio')).not.toBeInTheDocument();
    });

    it('handles multiple seasons independently', async () => {
      const onChange = jest.fn();
      const seasons = [
        createMockSeason({ category: 'Primera', start_date: '2024-01-01' }),
        createMockSeason({ category: 'Lujo', start_date: '2024-06-01' })
      ];

      render(<SeasonConfiguration {...defaultProps} seasons={seasons} onChange={onChange} />);

      // Verify both seasons are rendered by their h4 headings
      expect(screen.getByRole('heading', { name: 'Primera', level: 4 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Lujo', level: 4 })).toBeInTheDocument();
    });
  });
});
