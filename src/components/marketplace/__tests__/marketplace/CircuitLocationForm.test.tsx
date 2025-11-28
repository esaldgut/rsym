import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/components/location/LocationSelector', () => ({
  LocationSelector: ({ onLocationSelect, selectedLocation }: any) => {
    const isEdit = !!selectedLocation;
    const label = isEdit ? 'mock-select-edit' : 'mock-select-add';
    const payload = isEdit
      ? { place: 'Edited Place', placeSub: 'Edited Sub', complementaryDescription: 'Edited' }
      : { place: 'New Place', placeSub: 'New Sub', complementaryDescription: 'New' };

    return (
      <div>
        <button data-testid={label} onClick={() => onLocationSelect(payload)}>{label}</button>
      </div>
    );
  }
}));

import { CircuitLocationForm } from '../../CircuitLocationForm';

describe('CircuitLocationForm', () => {
  it('1- muestra el encabezado y la sección de agregar vacía', () => {
    const onLocationsChange = jest.fn();
    render(<CircuitLocationForm onLocationsChange={onLocationsChange} minLocations={1} />);

    expect(screen.getByText('Ubicaciones del Circuit')).toBeInTheDocument();
    expect(screen.getByText(/Primera parada/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-select-add')).toBeInTheDocument();
  });

  it('2- agrega una ubicación cuando LocationSelector dispara la selección', () => {
    const onLocationsChange = jest.fn();
    render(<CircuitLocationForm onLocationsChange={onLocationsChange} minLocations={1} />);

    const addBtn = screen.getByTestId('mock-select-add');
    fireEvent.click(addBtn);
    expect(onLocationsChange).toHaveBeenCalledTimes(1);
    const callArg = onLocationsChange.mock.calls[0][0];
    expect(Array.isArray(callArg)).toBe(true);
    expect(callArg[0].place).toBe('New Place');
    expect(screen.getByText(/Paradas del Circuit \(1\)/)).toBeInTheDocument();
  });

  it('3- muestra error al agregar ubicación duplicada', () => {
    const onLocationsChange = jest.fn();
    const initial = [{ place: 'New Place', placeSub: 'X', complementaryDescription: '' }];
    render(<CircuitLocationForm initialLocations={initial} onLocationsChange={onLocationsChange} minLocations={1} />);

    const addBtn = screen.getByTestId('mock-select-add');
    fireEvent.click(addBtn);
    expect(onLocationsChange).toHaveBeenCalledTimes(0);
    expect(screen.getByText(/No puedes agregar ubicaciones duplicadas/)).toBeInTheDocument();
  });

  it('4- elimina una ubicación cuando se hace clic en eliminar', () => {
    const onLocationsChange = jest.fn();
    const initial = [
      { place: 'A', placeSub: '', complementaryDescription: '' },
      { place: 'B', placeSub: '', complementaryDescription: '' }
    ];

    render(<CircuitLocationForm initialLocations={initial} onLocationsChange={onLocationsChange} minLocations={1} />);
    const deleteButtons = screen.getAllByTitle('Eliminar ubicación');
    expect(deleteButtons.length).toBe(2);

    fireEvent.click(deleteButtons[0]);
    expect(onLocationsChange).toHaveBeenCalledTimes(1);
    const updated = onLocationsChange.mock.calls[0][0];
    expect(updated.length).toBe(1);
    expect(updated[0].place).toBe('B');
  });

  it('5- mueve una ubicación hacia arriba cuando se hace clic en mover arriba', () => {
    const onLocationsChange = jest.fn();
    const initial = [
      { place: 'A', placeSub: '', complementaryDescription: '' },
      { place: 'B', placeSub: '', complementaryDescription: '' },
      { place: 'C', placeSub: '', complementaryDescription: '' }
    ];

    render(<CircuitLocationForm initialLocations={initial} onLocationsChange={onLocationsChange} />);
    const moveUpButtons = screen.getAllByTitle('Mover arriba');
    expect(moveUpButtons.length).toBe(2);
    fireEvent.click(moveUpButtons[0]);

    expect(onLocationsChange).toHaveBeenCalledTimes(1);
    const updated = onLocationsChange.mock.calls[0][0];
    expect(updated[0].place).toBe('B');
    expect(updated[1].place).toBe('A');
  });

  it('6- oculta los botones de acción cuando está deshabilitado', () => {
    const onLocationsChange = jest.fn();
    const initial = [{ place: 'X', placeSub: '', complementaryDescription: '' }];

    render(<CircuitLocationForm initialLocations={initial} onLocationsChange={onLocationsChange} disabled={true} />);

    expect(screen.queryByTitle('Editar ubicación')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Eliminar ubicación')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-select-add')).toBeInTheDocument();
  });
});
