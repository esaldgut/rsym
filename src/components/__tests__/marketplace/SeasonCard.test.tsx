import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SeasonCard } from '../../marketplace/SeasonCard';

describe('SeasonCard', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern' as unknown as jest.FakeTimersConfig);
    jest.setSystemTime(new Date('2025-11-27T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('1- renderiza temporada mínima y muestra N/A para fechas faltantes y Consultar para precio faltante', () => {
    const season = { id: 's1' } as any;
    const { container } = render(<SeasonCard season={season} index={0} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Inicio:').nextSibling?.textContent).toBe('N/A');
    expect(screen.getByText('Fin:').nextSibling?.textContent).toBe('N/A');
    expect(container).toHaveTextContent('Consultar');
  });

  it('2- formatea y muestra el precio cuando se proporciona product_pricing', () => {
    const season = { id: 's2', product_pricing: 1234 } as any;
    const { container } = render(<SeasonCard season={season} index={1} />);
    expect(container).toHaveTextContent('$1,234');
  });

  it('3- muestra insignia activa cuando la fecha actual está entre las fechas de inicio y fin', () => {
    const season = {
      id: 's3',
      start_date: '2025-11-01T00:00:00Z',
      end_date: '2025-12-31T23:59:59Z',
    } as any;

    render(<SeasonCard season={season} index={2} />);
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  it('4- no muestra insignia activa cuando las fechas faltan o están fuera de rango', () => {
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

  it('5- renderiza duración cuando se proporciona number_of_nights y pluraliza correctamente', () => {
    const seasonOne = { id: 's6', number_of_nights: '1' } as any;
    const seasonTwo = { id: 's7', number_of_nights: '2' } as any;

    const { rerender } = render(<SeasonCard season={seasonOne} index={5} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('noche')).toBeInTheDocument();

    rerender(<SeasonCard season={seasonTwo} index={6} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('noches')).toBeInTheDocument();
  });

  it('6- oculta el bloque de duración cuando number_of_nights no está presente', () => {
    const season = { id: 's8' } as any;
    render(<SeasonCard season={season} index={7} />);
    expect(screen.queryByText('Duración')).not.toBeInTheDocument();
  });

  it('7- llama a onSelect cuando se hace clic y alterna la UI de selección basada en isSelected', () => {
    const season = { id: 's9' } as any;
    const onSelect = jest.fn();

    const { rerender, container } = render(
      <SeasonCard season={season} index={8} onSelect={onSelect} isSelected={false} />
    );
    expect(screen.getByText('Clic para seleccionar')).toBeInTheDocument();
    fireEvent.click(container.firstChild as ChildNode);
    expect(onSelect).toHaveBeenCalled();
    rerender(<SeasonCard season={season} index={8} onSelect={onSelect} isSelected={true} />);
    expect(screen.getByText('Temporada seleccionada')).toBeInTheDocument();
  });

  it('8- renderiza patrón SVG con id basado en el id de la temporada', () => {
    const season = { id: 'unique-pattern-id' } as any;
    const { container } = render(<SeasonCard season={season} index={9} />);
    const patternEl = container.querySelector('#pattern-unique-pattern-id');
    expect(patternEl).toBeTruthy();
  });

  it('9- coincide con la instantánea para una temporada completa', () => {
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
