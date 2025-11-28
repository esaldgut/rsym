/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateCircuitForm } from '../CreateCircuitForm';

describe('CreateCircuitForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form title', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Crear Nuevo Circuito')).toBeInTheDocument();
    });

    it('renders all required form fields', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Nombre del Circuito *')).toBeInTheDocument();
      expect(screen.getByText('Descripción *')).toBeInTheDocument();
      expect(screen.getByText('Fecha de Inicio *')).toBeInTheDocument();
      expect(screen.getByText('Fecha de Fin *')).toBeInTheDocument();
    });

    it('renders optional fields', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Servicios Incluidos')).toBeInTheDocument();
      expect(screen.getByText('Preferencias/Categorías')).toBeInTheDocument();
      expect(screen.getByText('Idiomas')).toBeInTheDocument();
    });

    it('renders publish checkbox', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Publicar inmediatamente')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Crear Circuito')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('renders as modal overlay', () => {
      const { container } = render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Form Inputs', () => {
    it('updates name field on input', () => {
      const { container } = render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Input doesn't have accessible name, find by type and order
      const textInputs = container.querySelectorAll('input[type="text"]');
      const nameInput = textInputs[0] as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Mi Circuito' } });

      expect(nameInput).toHaveValue('Mi Circuito');
    });

    it('updates description field on input', () => {
      const { container } = render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const textareas = container.querySelectorAll('textarea');
      const descInput = textareas[0] as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Una descripción del circuito' } });

      expect(descInput).toHaveValue('Una descripción del circuito');
    });

    it('updates start date field on input', () => {
      const { container } = render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const dateInputs = container.querySelectorAll('input[type="date"]');
      const startDateInput = dateInputs[0] as HTMLInputElement;

      fireEvent.change(startDateInput, { target: { value: '2024-12-01' } });
      expect(startDateInput).toHaveValue('2024-12-01');
    });

    it('updates services field on input', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const servicesInput = screen.getByPlaceholderText('Transporte, alojamiento, guía turístico...');
      fireEvent.change(servicesInput, { target: { value: 'Transporte incluido' } });

      expect(servicesInput).toHaveValue('Transporte incluido');
    });

    it('toggles publish checkbox', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Preferences Management', () => {
    it('adds preference when clicking Add button', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const preferenceInput = screen.getByPlaceholderText('Aventura, Naturaleza, Cultural...');
      const addButtons = screen.getAllByText('Agregar');
      const addPreferenceButton = addButtons[0];

      fireEvent.change(preferenceInput, { target: { value: 'Aventura' } });
      fireEvent.click(addPreferenceButton);

      expect(screen.getByText('Aventura')).toBeInTheDocument();
      expect(preferenceInput).toHaveValue('');
    });

    it('adds preference when pressing Enter', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const preferenceInput = screen.getByPlaceholderText('Aventura, Naturaleza, Cultural...');

      fireEvent.change(preferenceInput, { target: { value: 'Cultural' } });
      fireEvent.keyPress(preferenceInput, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(screen.getByText('Cultural')).toBeInTheDocument();
    });

    it('does not add empty preference', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const addButtons = screen.getAllByText('Agregar');
      const addPreferenceButton = addButtons[0];

      fireEvent.click(addPreferenceButton);

      // No preference badges should be rendered
      expect(screen.queryByText('×')).not.toBeInTheDocument();
    });

    it('does not add whitespace-only preference', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const preferenceInput = screen.getByPlaceholderText('Aventura, Naturaleza, Cultural...');
      const addButtons = screen.getAllByText('Agregar');
      const addPreferenceButton = addButtons[0];

      fireEvent.change(preferenceInput, { target: { value: '   ' } });
      fireEvent.click(addPreferenceButton);

      // No preference badges should be rendered
      expect(screen.queryAllByText('×').length).toBe(0);
    });

    it('removes preference when clicking × button', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Add a preference first
      const preferenceInput = screen.getByPlaceholderText('Aventura, Naturaleza, Cultural...');
      const addButtons = screen.getAllByText('Agregar');
      const addPreferenceButton = addButtons[0];

      fireEvent.change(preferenceInput, { target: { value: 'Aventura' } });
      fireEvent.click(addPreferenceButton);

      expect(screen.getByText('Aventura')).toBeInTheDocument();

      // Remove it
      const removeButton = screen.getAllByText('×')[0];
      fireEvent.click(removeButton);

      expect(screen.queryByText('Aventura')).not.toBeInTheDocument();
    });

    it('adds multiple preferences', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const preferenceInput = screen.getByPlaceholderText('Aventura, Naturaleza, Cultural...');
      const addButtons = screen.getAllByText('Agregar');
      const addPreferenceButton = addButtons[0];

      // Add first preference
      fireEvent.change(preferenceInput, { target: { value: 'Aventura' } });
      fireEvent.click(addPreferenceButton);

      // Add second preference
      fireEvent.change(preferenceInput, { target: { value: 'Naturaleza' } });
      fireEvent.click(addPreferenceButton);

      expect(screen.getByText('Aventura')).toBeInTheDocument();
      expect(screen.getByText('Naturaleza')).toBeInTheDocument();
    });
  });

  describe('Languages Management', () => {
    it('adds language when clicking Add button', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const languageInput = screen.getByPlaceholderText('Español, Inglés, Francés...');
      const addButtons = screen.getAllByText('Agregar');
      const addLanguageButton = addButtons[1];

      fireEvent.change(languageInput, { target: { value: 'Español' } });
      fireEvent.click(addLanguageButton);

      expect(screen.getByText('Español')).toBeInTheDocument();
      expect(languageInput).toHaveValue('');
    });

    it('adds language when pressing Enter', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const languageInput = screen.getByPlaceholderText('Español, Inglés, Francés...');

      fireEvent.change(languageInput, { target: { value: 'Inglés' } });
      fireEvent.keyPress(languageInput, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(screen.getByText('Inglés')).toBeInTheDocument();
    });

    it('does not add empty language', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const addButtons = screen.getAllByText('Agregar');
      const addLanguageButton = addButtons[1];

      fireEvent.click(addLanguageButton);

      // No language badges should be rendered
      expect(screen.queryAllByText('×').length).toBe(0);
    });

    it('removes language when clicking × button', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Add a language first
      const languageInput = screen.getByPlaceholderText('Español, Inglés, Francés...');
      const addButtons = screen.getAllByText('Agregar');
      const addLanguageButton = addButtons[1];

      fireEvent.change(languageInput, { target: { value: 'Español' } });
      fireEvent.click(addLanguageButton);

      expect(screen.getByText('Español')).toBeInTheDocument();

      // Remove it
      const removeButton = screen.getAllByText('×')[0];
      fireEvent.click(removeButton);

      expect(screen.queryByText('Español')).not.toBeInTheDocument();
    });

    it('renders languages with blue styling', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const languageInput = screen.getByPlaceholderText('Español, Inglés, Francés...');
      const addButtons = screen.getAllByText('Agregar');
      const addLanguageButton = addButtons[1];

      fireEvent.change(languageInput, { target: { value: 'Español' } });
      fireEvent.click(addLanguageButton);

      const badge = screen.getByText('Español').closest('span');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data when submitted', () => {
      const { container } = render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill out required form fields using container queries
      const textInputs = container.querySelectorAll('input[type="text"]');
      const nameInput = textInputs[0] as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Mi Circuito Test' } });

      const textareas = container.querySelectorAll('textarea');
      const descInput = textareas[0] as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Descripción del circuito' } });

      // Fill required date fields
      const dateInputs = container.querySelectorAll('input[type="date"]');
      const startDateInput = dateInputs[0] as HTMLInputElement;
      const endDateInput = dateInputs[1] as HTMLInputElement;
      fireEvent.change(startDateInput, { target: { value: '2024-12-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-15' } });

      // Submit form
      const submitButton = screen.getByText('Crear Circuito');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Mi Circuito Test',
          description: 'Descripción del circuito'
        })
      );
    });

    it('includes preferences in submission', () => {
      const { container } = render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill required fields first
      const textInputs = container.querySelectorAll('input[type="text"]');
      const nameInput = textInputs[0] as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Circuito Test' } });

      const textareas = container.querySelectorAll('textarea');
      const descInput = textareas[0] as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Descripción' } });

      const dateInputs = container.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[0], { target: { value: '2024-12-01' } });
      fireEvent.change(dateInputs[1], { target: { value: '2024-12-15' } });

      // Add a preference
      const preferenceInput = screen.getByPlaceholderText('Aventura, Naturaleza, Cultural...');
      const addButtons = screen.getAllByText('Agregar');
      fireEvent.change(preferenceInput, { target: { value: 'Aventura' } });
      fireEvent.click(addButtons[0]);

      // Submit
      const submitButton = screen.getByText('Crear Circuito');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: ['Aventura']
        })
      );
    });

    it('includes languages in submission', () => {
      const { container } = render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill required fields first
      const textInputs = container.querySelectorAll('input[type="text"]');
      const nameInput = textInputs[0] as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Circuito Test' } });

      const textareas = container.querySelectorAll('textarea');
      const descInput = textareas[0] as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Descripción' } });

      const dateInputs = container.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[0], { target: { value: '2024-12-01' } });
      fireEvent.change(dateInputs[1], { target: { value: '2024-12-15' } });

      // Add a language
      const languageInput = screen.getByPlaceholderText('Español, Inglés, Francés...');
      const addButtons = screen.getAllByText('Agregar');
      fireEvent.change(languageInput, { target: { value: 'Español' } });
      fireEvent.click(addButtons[1]);

      // Submit
      const submitButton = screen.getByText('Crear Circuito');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          language: ['Español']
        })
      );
    });

    it('includes published status in submission', () => {
      const { container } = render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill required fields first
      const textInputs = container.querySelectorAll('input[type="text"]');
      const nameInput = textInputs[0] as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Circuito Test' } });

      const textareas = container.querySelectorAll('textarea');
      const descInput = textareas[0] as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Descripción' } });

      const dateInputs = container.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[0], { target: { value: '2024-12-01' } });
      fireEvent.change(dateInputs[1], { target: { value: '2024-12-15' } });

      // Toggle publish checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Submit
      const submitButton = screen.getByText('Crear Circuito');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          published: true
        })
      );
    });
  });

  describe('Cancel Action', () => {
    it('calls onCancel when cancel button is clicked', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit when cancel button is clicked', () => {
      render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Default Values', () => {
    it('initializes with empty form data', () => {
      const { container } = render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const textInputs = container.querySelectorAll('input[type="text"]');
      const nameInput = textInputs[0] as HTMLInputElement;
      expect(nameInput).toHaveValue('');

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('initializes with draft status', () => {
      const { container } = render(<CreateCircuitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill required fields first
      const textInputs = container.querySelectorAll('input[type="text"]');
      const nameInput = textInputs[0] as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Circuito Test' } });

      const textareas = container.querySelectorAll('textarea');
      const descInput = textareas[0] as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Descripción' } });

      const dateInputs = container.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[0], { target: { value: '2024-12-01' } });
      fireEvent.change(dateInputs[1], { target: { value: '2024-12-15' } });

      // Submit - should have draft status by default (checkbox unchecked)
      const submitButton = screen.getByText('Crear Circuito');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft'
        })
      );
    });
  });
});
