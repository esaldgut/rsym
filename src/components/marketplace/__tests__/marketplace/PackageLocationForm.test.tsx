import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock LocationSelector 
jest.mock('@/components/location/LocationSelector', () => ({
  LocationSelector: ({ selectedLocation, onLocationSelect, onLocationRemove, placeholder, label, error }: any) => (
    <div>
      <div data-testid="ls-label">{label}</div>
      <div data-testid="ls-placeholder">{placeholder}</div>
      <div data-testid="ls-selected">{selectedLocation ? selectedLocation.place : 'none'}</div>
      <div data-testid="ls-error">{error || ''}</div>
      <button onClick={() => onLocationSelect && onLocationSelect({ place: 'Test Place', coordinates: [-70, -10] })}>Select</button>
      <button onClick={() => onLocationRemove && onLocationRemove()}>Remove</button>
    </div>
  ),
}));

const mockUseLocationSelector = jest.fn();
jest.mock('@/hooks/useLocationSelector', () => ({
  useLocationSelector: (opts: any) => mockUseLocationSelector(opts),
}));

import { PackageLocationForm } from '../../PackageLocationForm';

describe('PackageLocationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocationSelector.mockReturnValue({
      selectedLocation: null,
      selectLocation: jest.fn(),
      removeLocation: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });
  });

  test('1- muestra LocationSelector con el marcador de posición y la etiqueta proporcionados', () => {
    render(
      <PackageLocationForm onLocationChange={jest.fn()} /> as any
    );

    expect(screen.getByTestId('ls-label').textContent).toBe('Ubicación del Package');
    expect(screen.getByTestId('ls-placeholder').textContent).toMatch(/Buscar destino principal del package/i);
  });

  test('2- seleccionar una ubicación llama a selectLocation del hook', () => {
    const selectLocation = jest.fn();
    mockUseLocationSelector.mockReturnValueOnce({
      selectedLocation: null,
      selectLocation,
      removeLocation: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    render(<PackageLocationForm onLocationChange={jest.fn()} /> as any);

    const btn = screen.getByText('Select');
    fireEvent.click(btn);

    expect(selectLocation).toHaveBeenCalled();
  });

  test('3- el botón de eliminar llama a removeLocation del hook', () => {
    const removeLocation = jest.fn();
    mockUseLocationSelector.mockReturnValueOnce({
      selectedLocation: { place: 'X', coordinates: [-70, -10] },
      selectLocation: jest.fn(),
      removeLocation,
      error: null,
      clearError: jest.fn(),
    });

    render(<PackageLocationForm onLocationChange={jest.fn()} /> as any);

    const btn = screen.getByText('Remove');
    fireEvent.click(btn);

    expect(removeLocation).toHaveBeenCalled();
  });

  test('4- muestra un cuadro de confirmación cuando selectedLocation existe', () => {
    mockUseLocationSelector.mockReturnValueOnce({
      selectedLocation: { place: 'Confirmed Place', coordinates: [-70, -10] },
      selectLocation: jest.fn(),
      removeLocation: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    render(<PackageLocationForm onLocationChange={jest.fn()} /> as any);

    expect(screen.getByText(/Ubicación del Package Confirmada/i)).toBeInTheDocument();
  });

  test('5- reenvía externalError a LocationSelector cuando se proporciona', () => {
    mockUseLocationSelector.mockReturnValueOnce({
      selectedLocation: null,
      selectLocation: jest.fn(),
      removeLocation: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    render(<PackageLocationForm onLocationChange={jest.fn()} externalError="External problem" /> as any);

    expect(screen.getByTestId('ls-error').textContent).toBe('External problem');
  });

  test('6- muestra un error de validación proporcionado por el hook', () => {
    mockUseLocationSelector.mockReturnValueOnce({
      selectedLocation: null,
      selectLocation: jest.fn(),
      removeLocation: jest.fn(),
      error: 'Coordinates invalid',
      clearError: jest.fn(),
    });

    render(<PackageLocationForm onLocationChange={jest.fn()} /> as any);

    expect(screen.getByTestId('ls-error').textContent).toBe('Coordinates invalid');
  });
});
