import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ItineraryCard } from '../../ItineraryCard';

describe('ItineraryCard', () => {
  test('0- muestra un estado vacío cuando el itinerario está vacío', () => {
    render(<ItineraryCard itinerary="" productType="circuit" />);
    expect(screen.getByText(/No hay itinerario disponible/i)).toBeInTheDocument();
  });

  test('1- analiza los encabezados Día y Day y muestra las actividades con los íconos correctos', () => {
    const itinerary = `Día 1: Llegada\n- Registro en hotel\nDesayuno en restaurante\nDía 2: Tour por la ciudad\n- Visita al museo\n- Transfer to airport\nDay 3: Playa day\n• Relajarse en la playa\nVuelo de regreso`;

    render(<ItineraryCard itinerary={itinerary} productType="circuit" />);

    expect(screen.getByText(/Día 1: Llegada/)).toBeInTheDocument();
    expect(screen.getByText(/Día 2: Tour por la ciudad/)).toBeInTheDocument();
    expect(screen.getByText(/Día 3: Playa day/)).toBeInTheDocument();

    const registro = screen.getByText(/Registro en hotel/);
    expect(registro).toBeInTheDocument();
    const registroLi = registro.closest('li');
    expect(registroLi).toBeTruthy();
    expect(within(registroLi as HTMLElement).getByText('🏨')).toBeInTheDocument();

    const desayuno = screen.getByText(/Desayuno en restaurante/);
    expect(within(desayuno.closest('li') as HTMLElement).getByText('🍽️')).toBeInTheDocument();
    expect(screen.queryByText(/Visita al museo/)).not.toBeInTheDocument();

    //  Day 2
    const day2Button = screen.getByText(/Día 2: Tour por la ciudad/).closest('button');
    expect(day2Button).toBeTruthy();
    fireEvent.click(day2Button!);
    const museo = screen.getByText(/Visita al museo/);
    expect(museo).toBeInTheDocument();
    expect(within(museo.closest('li') as HTMLElement).getByText('🎫')).toBeInTheDocument();

    const transfer = screen.getByText(/Transfer to airport/);
    expect(within(transfer.closest('li') as HTMLElement).getByText('🚌')).toBeInTheDocument();

    //  Day 3
    const day3Button = screen.getByText(/Día 3: Playa day/).closest('button');
    fireEvent.click(day3Button!);
    const playa = screen.getByText(/Relajarse en la playa/);
    expect(within(playa.closest('li') as HTMLElement).getByText('🏖️')).toBeInTheDocument();

    // Vuelo de regreso plane icon
    const vuelo = screen.getByText(/Vuelo de regreso/);
    expect(within(vuelo.closest('li') as HTMLElement).getByText('✈️')).toBeInTheDocument();
  });

  test('2- alterna expandir/colapsar para un día', () => {
    const itinerary = `Día 1: Test Day\n- Actividad uno\n- Actividad dos`;
    render(<ItineraryCard itinerary={itinerary} productType="circuit" />);

    // día 1 está expandido por defecto
    expect(screen.getByText(/Actividad uno/)).toBeInTheDocument();

    const button = screen.getByText(/Día 1: Test Day/).closest('button');
    expect(button).toBeTruthy();
    fireEvent.click(button!);
    expect(screen.queryByText(/Actividad uno/)).not.toBeInTheDocument();
    // expandir de nuevo
    fireEvent.click(button!);
    expect(screen.getByText(/Actividad uno/)).toBeInTheDocument();
  });
});
