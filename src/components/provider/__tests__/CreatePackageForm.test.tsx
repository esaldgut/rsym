/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreatePackageForm } from '../CreatePackageForm';

describe('CreatePackageForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form title', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Crear Nuevo Paquete')).toBeInTheDocument();
    });

    it('renders all required form fields', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Nombre del Paquete *')).toBeInTheDocument();
      expect(screen.getByText('Descripción *')).toBeInTheDocument();
      expect(screen.getByText('Número de Noches *')).toBeInTheDocument();
      expect(screen.getByText('Capacidad (personas) *')).toBeInTheDocument();
      expect(screen.getByText('Servicios Incluidos *')).toBeInTheDocument();
    });

    it('renders optional fields', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Servicios Adicionales')).toBeInTheDocument();
      expect(screen.getByText('Preferencias')).toBeInTheDocument();
      expect(screen.getByText('Categorías')).toBeInTheDocument();
    });

    it('renders price section', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Precio Base')).toBeInTheDocument();
      expect(screen.getByText('Precio *')).toBeInTheDocument();
      expect(screen.getByText('Moneda')).toBeInTheDocument();
      expect(screen.getByText('Tipo de Habitación')).toBeInTheDocument();
    });

    it('renders publish checkbox', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Publicar inmediatamente')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Crear Paquete')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('renders as modal overlay', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('renders currency select with options', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('option', { name: 'USD' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'EUR' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'MXN' })).toBeInTheDocument();
    });

    it('renders room type select with options', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('option', { name: 'Estándar' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Suite' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Deluxe' })).toBeInTheDocument();
    });
  });

  describe('Form Inputs', () => {
    it('updates name field on input', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const textInputs = container.querySelectorAll('input[type="text"]');
      const nameInput = textInputs[0] as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Mi Paquete' } });

      expect(nameInput).toHaveValue('Mi Paquete');
    });

    it('updates description field on input', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const textareas = container.querySelectorAll('textarea');
      const descInput = textareas[0] as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Una descripción del paquete' } });

      expect(descInput).toHaveValue('Una descripción del paquete');
    });

    it('updates numberOfNights field on input', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const numberInputs = container.querySelectorAll('input[type="number"]');
      const nightsInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(nightsInput, { target: { value: '5' } });

      expect(nightsInput).toHaveValue(5);
    });

    it('updates capacity field on input', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const numberInputs = container.querySelectorAll('input[type="number"]');
      const capacityInput = numberInputs[1] as HTMLInputElement;
      fireEvent.change(capacityInput, { target: { value: '10' } });

      expect(capacityInput).toHaveValue(10);
    });

    it('updates included_services field on input', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const servicesInput = screen.getByPlaceholderText('Alojamiento, desayuno, transporte...');
      fireEvent.change(servicesInput, { target: { value: 'Alojamiento incluido' } });

      expect(servicesInput).toHaveValue('Alojamiento incluido');
    });

    it('updates aditional_services field on input', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const additionalInput = screen.getByPlaceholderText('Tours opcionales, spa, actividades...');
      fireEvent.change(additionalInput, { target: { value: 'Spa incluido' } });

      expect(additionalInput).toHaveValue('Spa incluido');
    });

    it('updates price field on input', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const numberInputs = container.querySelectorAll('input[type="number"]');
      const priceInput = numberInputs[2] as HTMLInputElement;
      fireEvent.change(priceInput, { target: { value: '1500.50' } });

      expect(priceInput).toHaveValue(1500.50);
    });

    it('toggles publish checkbox', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Currency Select', () => {
    it('changes currency selection', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const selects = screen.getAllByRole('combobox');
      const currencySelect = selects[0];

      fireEvent.change(currencySelect, { target: { value: 'EUR' } });
      expect(currencySelect).toHaveValue('EUR');

      fireEvent.change(currencySelect, { target: { value: 'MXN' } });
      expect(currencySelect).toHaveValue('MXN');
    });
  });

  describe('Room Type Select', () => {
    it('changes room type selection', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const selects = screen.getAllByRole('combobox');
      const roomTypeSelect = selects[1];

      fireEvent.change(roomTypeSelect, { target: { value: 'suite' } });
      expect(roomTypeSelect).toHaveValue('suite');

      fireEvent.change(roomTypeSelect, { target: { value: 'deluxe' } });
      expect(roomTypeSelect).toHaveValue('deluxe');
    });
  });

  describe('Preferences Management', () => {
    it('adds preference when clicking Add button', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const preferenceInput = screen.getByPlaceholderText('Playa, Montaña, Ciudad...');
      const addButtons = screen.getAllByText('Agregar');
      const addPreferenceButton = addButtons[0];

      fireEvent.change(preferenceInput, { target: { value: 'Playa' } });
      fireEvent.click(addPreferenceButton);

      expect(screen.getByText('Playa')).toBeInTheDocument();
      expect(preferenceInput).toHaveValue('');
    });

    it('adds preference when pressing Enter', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const preferenceInput = screen.getByPlaceholderText('Playa, Montaña, Ciudad...');

      fireEvent.change(preferenceInput, { target: { value: 'Montaña' } });
      fireEvent.keyPress(preferenceInput, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(screen.getByText('Montaña')).toBeInTheDocument();
    });

    it('does not add empty preference', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const addButtons = screen.getAllByText('Agregar');
      const addPreferenceButton = addButtons[0];

      fireEvent.click(addPreferenceButton);

      // No preference badges should be rendered
      expect(screen.queryByText('×')).not.toBeInTheDocument();
    });

    it('does not add whitespace-only preference', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const preferenceInput = screen.getByPlaceholderText('Playa, Montaña, Ciudad...');
      const addButtons = screen.getAllByText('Agregar');
      const addPreferenceButton = addButtons[0];

      fireEvent.change(preferenceInput, { target: { value: '   ' } });
      fireEvent.click(addPreferenceButton);

      // No preference badges should be rendered
      expect(screen.queryAllByText('×').length).toBe(0);
    });

    it('removes preference when clicking × button', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Add a preference first
      const preferenceInput = screen.getByPlaceholderText('Playa, Montaña, Ciudad...');
      const addButtons = screen.getAllByText('Agregar');
      const addPreferenceButton = addButtons[0];

      fireEvent.change(preferenceInput, { target: { value: 'Playa' } });
      fireEvent.click(addPreferenceButton);

      expect(screen.getByText('Playa')).toBeInTheDocument();

      // Remove it
      const removeButton = screen.getAllByText('×')[0];
      fireEvent.click(removeButton);

      expect(screen.queryByText('Playa')).not.toBeInTheDocument();
    });

    it('renders preferences with purple styling', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const preferenceInput = screen.getByPlaceholderText('Playa, Montaña, Ciudad...');
      const addButtons = screen.getAllByText('Agregar');
      const addPreferenceButton = addButtons[0];

      fireEvent.change(preferenceInput, { target: { value: 'Playa' } });
      fireEvent.click(addPreferenceButton);

      const badge = screen.getByText('Playa').closest('span');
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
    });
  });

  describe('Categories Management', () => {
    it('adds category when clicking Add button', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const categoryInput = screen.getByPlaceholderText('Familiar, Romántico, Aventura...');
      const addButtons = screen.getAllByText('Agregar');
      const addCategoryButton = addButtons[1];

      fireEvent.change(categoryInput, { target: { value: 'Familiar' } });
      fireEvent.click(addCategoryButton);

      expect(screen.getByText('Familiar')).toBeInTheDocument();
      expect(categoryInput).toHaveValue('');
    });

    it('adds category when pressing Enter', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const categoryInput = screen.getByPlaceholderText('Familiar, Romántico, Aventura...');

      fireEvent.change(categoryInput, { target: { value: 'Romántico' } });
      fireEvent.keyPress(categoryInput, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(screen.getByText('Romántico')).toBeInTheDocument();
    });

    it('does not add empty category', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const addButtons = screen.getAllByText('Agregar');
      const addCategoryButton = addButtons[1];

      fireEvent.click(addCategoryButton);

      // No category badges should be rendered
      expect(screen.queryAllByText('×').length).toBe(0);
    });

    it('removes category when clicking × button', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Add a category first
      const categoryInput = screen.getByPlaceholderText('Familiar, Romántico, Aventura...');
      const addButtons = screen.getAllByText('Agregar');
      const addCategoryButton = addButtons[1];

      fireEvent.change(categoryInput, { target: { value: 'Familiar' } });
      fireEvent.click(addCategoryButton);

      expect(screen.getByText('Familiar')).toBeInTheDocument();

      // Remove it
      const removeButton = screen.getAllByText('×')[0];
      fireEvent.click(removeButton);

      expect(screen.queryByText('Familiar')).not.toBeInTheDocument();
    });

    it('renders categories with green styling', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const categoryInput = screen.getByPlaceholderText('Familiar, Romántico, Aventura...');
      const addButtons = screen.getAllByText('Agregar');
      const addCategoryButton = addButtons[1];

      fireEvent.change(categoryInput, { target: { value: 'Familiar' } });
      fireEvent.click(addCategoryButton);

      const badge = screen.getByText('Familiar').closest('span');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('adds multiple categories', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const categoryInput = screen.getByPlaceholderText('Familiar, Romántico, Aventura...');
      const addButtons = screen.getAllByText('Agregar');
      const addCategoryButton = addButtons[1];

      // Add first category
      fireEvent.change(categoryInput, { target: { value: 'Familiar' } });
      fireEvent.click(addCategoryButton);

      // Add second category
      fireEvent.change(categoryInput, { target: { value: 'Romántico' } });
      fireEvent.click(addCategoryButton);

      expect(screen.getByText('Familiar')).toBeInTheDocument();
      expect(screen.getByText('Romántico')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const fillRequiredFields = (container: HTMLElement) => {
      // Name
      const textInputs = container.querySelectorAll('input[type="text"]');
      const nameInput = textInputs[0] as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Paquete Test' } });

      // Description
      const textareas = container.querySelectorAll('textarea');
      const descInput = textareas[0] as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Descripción del paquete' } });

      // Number of nights and capacity
      const numberInputs = container.querySelectorAll('input[type="number"]');
      fireEvent.change(numberInputs[0], { target: { value: '3' } });
      fireEvent.change(numberInputs[1], { target: { value: '4' } });
      fireEvent.change(numberInputs[2], { target: { value: '1000' } });

      // Included services
      const includedServicesInput = textareas[1] as HTMLTextAreaElement;
      fireEvent.change(includedServicesInput, { target: { value: 'Alojamiento, transporte' } });
    };

    it('calls onSubmit with form data when submitted', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fillRequiredFields(container);

      // Submit form
      const submitButton = screen.getByText('Crear Paquete');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Paquete Test',
          description: 'Descripción del paquete'
        })
      );
    });

    it('includes preferences in submission', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fillRequiredFields(container);

      // Add a preference
      const preferenceInput = screen.getByPlaceholderText('Playa, Montaña, Ciudad...');
      const addButtons = screen.getAllByText('Agregar');
      fireEvent.change(preferenceInput, { target: { value: 'Playa' } });
      fireEvent.click(addButtons[0]);

      // Submit
      const submitButton = screen.getByText('Crear Paquete');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: ['Playa']
        })
      );
    });

    it('includes categories in submission', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fillRequiredFields(container);

      // Add a category
      const categoryInput = screen.getByPlaceholderText('Familiar, Romántico, Aventura...');
      const addButtons = screen.getAllByText('Agregar');
      fireEvent.change(categoryInput, { target: { value: 'Familiar' } });
      fireEvent.click(addButtons[1]);

      // Submit
      const submitButton = screen.getByText('Crear Paquete');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: ['Familiar']
        })
      );
    });

    it('includes prices in submission when price is set', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fillRequiredFields(container);

      // Submit
      const submitButton = screen.getByText('Crear Paquete');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          prices: [expect.objectContaining({ price: 1000 })]
        })
      );
    });

    it('includes published status in submission', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fillRequiredFields(container);

      // Toggle publish checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Submit
      const submitButton = screen.getByText('Crear Paquete');
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
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit when cancel button is clicked', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Default Values', () => {
    it('initializes with empty form data', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const textInputs = container.querySelectorAll('input[type="text"]');
      const nameInput = textInputs[0] as HTMLInputElement;
      expect(nameInput).toHaveValue('');

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('initializes currency select with USD', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const selects = screen.getAllByRole('combobox');
      const currencySelect = selects[0];
      expect(currencySelect).toHaveValue('USD');
    });

    it('initializes room type select with standard', () => {
      render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const selects = screen.getAllByRole('combobox');
      const roomTypeSelect = selects[1];
      expect(roomTypeSelect).toHaveValue('standard');
    });

    it('initializes with draft status', () => {
      const { container } = render(<CreatePackageForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill required fields first
      const textInputs = container.querySelectorAll('input[type="text"]');
      fireEvent.change(textInputs[0], { target: { value: 'Paquete Test' } });

      const textareas = container.querySelectorAll('textarea');
      fireEvent.change(textareas[0], { target: { value: 'Descripción' } });
      fireEvent.change(textareas[1], { target: { value: 'Servicios incluidos' } });

      const numberInputs = container.querySelectorAll('input[type="number"]');
      fireEvent.change(numberInputs[0], { target: { value: '3' } });
      fireEvent.change(numberInputs[1], { target: { value: '4' } });
      fireEvent.change(numberInputs[2], { target: { value: '1000' } });

      // Submit - should have draft status by default (checkbox unchecked)
      const submitButton = screen.getByText('Crear Paquete');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft'
        })
      );
    });
  });
});
