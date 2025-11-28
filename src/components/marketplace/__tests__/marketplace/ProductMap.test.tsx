import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductMap } from '../../ProductMap';

describe('ProductMap', () => {
  test('1- renderiza estado vacío cuando no hay destinos', () => {
    render(<ProductMap destinations={[]} productType="circuit" productName="Test" />);

    expect(screen.getByText(/No hay destinos disponibles/i)).toBeInTheDocument();
  });

  test('2- renderiza circuito con múltiples destinos, selecciona marcador y muestra coordenadas', () => {
    const destinations = [
      {
        place: 'Lima',
        placeSub: 'Centro',
        coordinates: { latitude: -12.0464, longitude: -77.0428 },
        complementaryDescription: 'Punto inicial',
      },
      {
        place: 'Cusco',
        coordinates: [-72.545, -13.531],
        complementary_description: 'Destino final',
      },
    ];

    render(<ProductMap destinations={destinations as any} productType="circuit" productName="Circuito Uno" />);
    expect(screen.getByRole('heading', { name: /Ruta del Circuito/i })).toBeInTheDocument();
    expect(screen.getByText(/2 destinos en circuito/i)).toBeInTheDocument();

    const cuscoMarker = screen.getAllByTitle('Cusco')[0];
    expect(cuscoMarker).toBeTruthy();
    fireEvent.click(cuscoMarker);

    const allButtons = screen.getAllByRole('button');
    const cuscoListButton = allButtons.find(btn => {
      try {
        within(btn).getByRole('heading', { name: /Cusco/i });
        return true;
      } catch (e) {
        return false;
      }
    });

    expect(cuscoListButton).toBeTruthy();
    expect((cuscoListButton as HTMLElement).className).toContain('border-l-pink-500');

    expect(screen.getByText(/-13.5310, -72.5450/)).toBeInTheDocument();
  });

  test('3- renderiza leyenda de paquete correctamente para un solo destino', () => {
    const destinations = [
      { place: 'Arequipa', coordinates: { latitude: -16.4090, longitude: -71.5375 } },
    ];

    render(<ProductMap destinations={destinations as any} productType="package" productName="Paquete" />);

    expect(screen.getByRole('heading', { name: /Destinos del Paquete/i })).toBeInTheDocument();
    expect(screen.getByText(/1 destino del paquete/i)).toBeInTheDocument();
  });
});
