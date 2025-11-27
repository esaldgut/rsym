import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SeasonCard } from '../../marketplace/SeasonCard';

describe('SeasonCard', () => {
  beforeAll(() => {
    // Use modern fake timers so we can set system time deterministically
    // Some Jest versions require this syntax; if the environment differs, adjust accordingly.
    // eslint-disable-next-line jest/no-standalone-expect
    jest.useFakeTimers('modern' as unknown as jest.FakeTimersConfig);
    jest.setSystemTime(new Date('2025-11-27T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders minimal season and shows N/A for missing dates and Consultar for missing price', () => {
    const season = { id: 's1' } as any;
    const { container } = render(<SeasonCard season={season} index={0} />);

    // Index badge
    expect(screen.getByText('1')).toBeInTheDocument();

    // Dates should show N/A
    expect(screen.getByText('Inicio:').nextSibling?.textContent).toBe('N/A');
    expect(screen.getByText('Fin:').nextSibling?.textContent).toBe('N/A');

    // Price should say 'Consultar'
    expect(container).toHaveTextContent('Consultar');
  });

  it('formats and displays price when product_pricing provided', () => {
    const season = { id: 's2', product_pricing: 1234 } as any;
    const { container } = render(<SeasonCard season={season} index={1} />);

    // Price should be formatted with commas (en-US uses commas, component used toLocaleString())
    expect(container).toHaveTextContent('$1,234');
  });

  it('shows active badge when now is between start and end dates', () => {
    const season = {
      id: 's3',
      start_date: '2025-11-01T00:00:00Z',
      end_date: '2025-12-31T23:59:59Z',
    } as any;

    render(<SeasonCard season={season} index={2} />);

    // Active badge text
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  it('does not show active badge when dates are missing or out of range', () => {
    const seasonMissing = { id: 's4' } as any;
    const seasonOutOfRange = {
      id: 's5',
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2024-12-31T23:59:59Z',
    } as any;

    const { rerender } = render(<SeasonCard season={seasonMissing} index={3} />);
    expect(screen.queryByText('Activa')).not.toBeInTheDocument();

    rerender(<SeasonCard season={seasonOutOfRange} index={4} />);
    expect(screen.queryByText('Activa')).not.toBeInTheDocument();
  });

  it('renders duration when number_of_nights provided and pluralizes correctly', () => {
    const seasonOne = { id: 's6', number_of_nights: '1' } as any;
    const seasonTwo = { id: 's7', number_of_nights: '2' } as any;

    const { rerender } = render(<SeasonCard season={seasonOne} index={5} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('noche')).toBeInTheDocument();

    rerender(<SeasonCard season={seasonTwo} index={6} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('noches')).toBeInTheDocument();
  });

  it('hides duration block when number_of_nights is absent', () => {
    const season = { id: 's8' } as any;
    render(<SeasonCard season={season} index={7} />);

    // The label 'Duración' should not be present
    expect(screen.queryByText('Duración')).not.toBeInTheDocument();
  });

  it('calls onSelect when clicked and toggles selection UI based on isSelected', () => {
    const season = { id: 's9' } as any;
    const onSelect = jest.fn();

    const { rerender, container } = render(
      <SeasonCard season={season} index={8} onSelect={onSelect} isSelected={false} />
    );

    // Should show 'Clic para seleccionar' when not selected
    expect(screen.getByText('Clic para seleccionar')).toBeInTheDocument();

    // Click the outermost element
    fireEvent.click(container.firstChild as ChildNode);
    expect(onSelect).toHaveBeenCalled();

    // When selected, it should show 'Temporada seleccionada'
    rerender(<SeasonCard season={season} index={8} onSelect={onSelect} isSelected={true} />);
    expect(screen.getByText('Temporada seleccionada')).toBeInTheDocument();
  });

  it('renders SVG pattern with id based on season id', () => {
    const season = { id: 'unique-pattern-id' } as any;
    const { container } = render(<SeasonCard season={season} index={9} />);

    // Pattern element should exist with id pattern-<season.id>
    const patternEl = container.querySelector('#pattern-unique-pattern-id');
    expect(patternEl).toBeTruthy();
  });

  it('matches snapshot for a rich season', () => {
    const season = {
      id: 'snap1',
      start_date: '2025-11-01T00:00:00Z',
      end_date: '2025-11-30T23:59:59Z',
      number_of_nights: '3',
      product_pricing: 98765,
    } as any;

    const { asFragment } = render(<SeasonCard season={season} index={10} isSelected={true} onSelect={() => {}} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
