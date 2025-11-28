/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplateVariableEditor } from '../TemplateVariableEditor';
import type { MomentTemplate } from '../MomentTemplateLibrary';

// ============================================================================
// MOCKS
// ============================================================================

const mockSetString = jest.fn();
const mockGetString = jest.fn();

const mockCESDKInstance = {
  engine: {
    variable: {
      setString: mockSetString,
      getString: mockGetString
    }
  }
} as any;

// ============================================================================
// TEST DATA
// ============================================================================

const mockTemplate: MomentTemplate = {
  id: 'birthday-card',
  name: 'Tarjeta de Cumpleaños',
  description: 'Template festivo para celebrar cumpleaños',
  category: 'celebration',
  thumbnail: '/templates/birthday.jpg',
  sceneUri: 'https://cdn.img.ly/templates/birthday.scene',
  variables: [
    {
      name: 'recipientName',
      label: 'Nombre del destinatario',
      defaultValue: 'Amigo',
      placeholder: 'Ej: María',
      maxLength: 20
    },
    {
      name: 'message',
      label: 'Mensaje',
      defaultValue: '¡Feliz cumpleaños!',
      placeholder: 'Escribe tu mensaje aquí...',
      maxLength: 100
    },
    {
      name: 'senderName',
      label: 'Tu nombre',
      defaultValue: 'De: Tu amigo',
      placeholder: 'Ej: Juan',
      maxLength: 30
    }
  ],
  aspectRatio: 1,
  tags: ['birthday', 'celebration', 'card']
};

const mockTemplateWithLongText: MomentTemplate = {
  id: 'story-template',
  name: 'Historia Personal',
  description: 'Template para contar historias',
  category: 'personal',
  thumbnail: '/templates/story.jpg',
  sceneUri: 'https://cdn.img.ly/templates/story.scene',
  variables: [
    {
      name: 'title',
      label: 'Título',
      defaultValue: 'Mi Historia',
      placeholder: 'Título de tu historia',
      maxLength: 40
    },
    {
      name: 'story',
      label: 'Historia',
      defaultValue: 'Había una vez...',
      placeholder: 'Escribe tu historia completa aquí',
      maxLength: 500
    }
  ],
  aspectRatio: 1,
  tags: ['story', 'personal']
};

// ============================================================================
// TESTS
// ============================================================================

describe('TemplateVariableEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetString.mockReturnValue('');
  });

  // ==========================================================================
  // 1. RENDERIZADO
  // ==========================================================================

  describe('Renderizado', () => {
    it('renderiza el título y descripción del template', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      expect(screen.getByText('Personaliza tu Template')).toBeInTheDocument();
      expect(screen.getByText(/Tarjeta de Cumpleaños/)).toBeInTheDocument();
      expect(screen.getByText(/Template festivo para celebrar cumpleaños/)).toBeInTheDocument();
    });

    it('renderiza todos los campos de variables', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      expect(screen.getByLabelText(/Nombre del destinatario/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mensaje/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tu nombre/)).toBeInTheDocument();
    });

    it('renderiza inputs con valores por defecto', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/) as HTMLInputElement;
      const messageInput = screen.getByLabelText(/Mensaje/) as HTMLInputElement;

      expect(nameInput.value).toBe('Amigo');
      expect(messageInput.value).toBe('¡Feliz cumpleaños!');
    });

    it('renderiza placeholders correctamente', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByPlaceholderText('Ej: María');
      const messageInput = screen.getByPlaceholderText('Escribe tu mensaje aquí...');

      expect(nameInput).toBeInTheDocument();
      expect(messageInput).toBeInTheDocument();
    });
    
    it('renderiza textarea para campos largos (>50 caracteres)', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplateWithLongText}
        />
      );

      const storyField = screen.getByLabelText(/Historia/);
      expect(storyField.tagName).toBe('TEXTAREA');
    });

    it('renderiza input text para campos cortos', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameField = screen.getByLabelText(/Nombre del destinatario/);
      expect(nameField.tagName).toBe('INPUT');
    });

    it('renderiza botones de acción', () => {
      const onSave = jest.fn();
      const onCancel = jest.fn();

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Restaurar')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Aplicar Cambios')).toBeInTheDocument();
    });

    it('no renderiza botón cancelar si no hay callback onCancel', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
    });

    it('renderiza mensaje de ayuda sobre vista previa', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      expect(screen.getByText('Vista previa en tiempo real')).toBeInTheDocument();
      expect(screen.getByText(/Los cambios se reflejan automáticamente/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 2. CARGA DE VALORES INICIALES
  // ==========================================================================

  describe('Carga de Valores Iniciales', () => {
    it('carga valores desde CE.SDK en mount', () => {
      mockGetString.mockImplementation((name: string) => {
        if (name === 'recipientName') return 'Carlos';
        if (name === 'message') return '¡Felicidades!';
        return '';
      });

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      expect(mockGetString).toHaveBeenCalledWith('recipientName');
      expect(mockGetString).toHaveBeenCalledWith('message');
      expect(mockGetString).toHaveBeenCalledWith('senderName');
    });

    it('usa valores por defecto si la variable no existe en CE.SDK', async () => {
      mockGetString.mockImplementation(() => {
        throw new Error('Variable not found');
      });

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Nombre del destinatario/) as HTMLInputElement;
        expect(nameInput.value).toBe('Amigo');
      });
    });

    it('actualiza valores cuando carga desde CE.SDK', async () => {
      mockGetString.mockImplementation((name: string) => {
        if (name === 'recipientName') return 'Ana';
        if (name === 'message') return 'Que tengas un gran día';
        if (name === 'senderName') return 'Pedro';
        return '';
      });

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Nombre del destinatario/) as HTMLInputElement;
        const messageInput = screen.getByLabelText(/Mensaje/) as HTMLInputElement;
        const senderInput = screen.getByLabelText(/Tu nombre/) as HTMLInputElement;

        expect(nameInput.value).toBe('Ana');
        expect(messageInput.value).toBe('Que tengas un gran día');
        expect(senderInput.value).toBe('Pedro');
      });
    });
  });

  // ==========================================================================
  // 3. EDICIÓN DE CAMPOS
  // ==========================================================================

  describe('Edición de Campos', () => {
    it('actualiza el valor del campo al escribir', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: 'Laura' } });

      expect((nameInput as HTMLInputElement).value).toBe('Laura');
    });

    it('actualiza CE.SDK en tiempo real al escribir', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: 'Laura' } });

      expect(mockSetString).toHaveBeenCalledWith('recipientName', 'Laura');
    });

    it('actualiza múltiples campos independientemente', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      const messageInput = screen.getByLabelText(/Mensaje/);

      fireEvent.change(nameInput, { target: { value: 'Roberto' } });
      fireEvent.change(messageInput, { target: { value: '¡Muchas felicidades!' } });

      expect(mockSetString).toHaveBeenCalledWith('recipientName', 'Roberto');
      expect(mockSetString).toHaveBeenCalledWith('message', '¡Muchas felicidades!');
    });

    it('maneja errores de CE.SDK al actualizar variables', () => {
      mockSetString.mockImplementation(() => {
        throw new Error('CE.SDK error');
      });

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  // ==========================================================================
  // 4. VALIDACIÓN
  // ==========================================================================

  describe('Validación', () => {
    it('muestra error si se excede maxLength', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      const tooLongText = 'Este nombre es demasiado largo para el campo';

      fireEvent.change(nameInput, { target: { value: tooLongText } });

      expect(screen.getByText(/Máximo 20 caracteres/)).toBeInTheDocument();
    });

    it('no actualiza el valor si excede maxLength', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      const tooLongText = 'Este nombre es demasiado largo';

      fireEvent.change(nameInput, { target: { value: tooLongText } });

      // El valor no debe cambiar (debe mantener el valor anterior)
      expect((nameInput as HTMLInputElement).value).toBe('Amigo');
    });

    it('elimina error cuando el texto vuelve a ser válido', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);

      // Primero excedemos el límite
      fireEvent.change(nameInput, { target: { value: 'Este texto es muy largo' } });
      expect(screen.getByText(/Máximo 20 caracteres/)).toBeInTheDocument();

      // Luego escribimos un texto válido
      fireEvent.change(nameInput, { target: { value: 'Ana' } });
      expect(screen.queryByText(/Máximo 20 caracteres/)).not.toBeInTheDocument();
    });

    it('muestra contador en naranja cuando está cerca del límite (>80%)', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: 'Nombre Muy Largo X' } }); // 18 chars (>80% de 20)

      const counter = screen.getByText(/18\/20/);
      expect(counter).toHaveClass('text-orange-500');
    });

    it('muestra error de campo requerido al guardar con campo vacío', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveButton = screen.getByText('Aplicar Cambios');
      fireEvent.click(saveButton);

      expect(screen.getByText('Este campo es requerido')).toBeInTheDocument();
    });

    it('muestra error de campo requerido para campos con solo espacios', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: '   ' } });

      const saveButton = screen.getByText('Aplicar Cambios');
      fireEvent.click(saveButton);

      expect(screen.getByText('Este campo es requerido')).toBeInTheDocument();
    });

    it('aplica estilos de error al campo con validación fallida', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: 'Texto extremadamente largo' } });

      expect(nameInput).toHaveClass('border-red-500');
    });
  });

  // ==========================================================================
  // 5. BOTÓN RESTAURAR
  // ==========================================================================

  describe('Botón Restaurar', () => {
    it('restaura todos los campos a valores por defecto', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      const messageInput = screen.getByLabelText(/Mensaje/);

      // Cambiar valores
      fireEvent.change(nameInput, { target: { value: 'Nuevo Nombre' } });
      fireEvent.change(messageInput, { target: { value: 'Nuevo Mensaje' } });

      // Restaurar
      const resetButton = screen.getByText('Restaurar');
      fireEvent.click(resetButton);

      // Verificar que volvieron a los valores por defecto
      expect((nameInput as HTMLInputElement).value).toBe('Amigo');
      expect((messageInput as HTMLInputElement).value).toBe('¡Feliz cumpleaños!');
    });

    it('actualiza CE.SDK con valores por defecto al restaurar', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      mockSetString.mockClear();

      const resetButton = screen.getByText('Restaurar');
      fireEvent.click(resetButton);

      expect(mockSetString).toHaveBeenCalledWith('recipientName', 'Amigo');
      expect(mockSetString).toHaveBeenCalledWith('message', '¡Feliz cumpleaños!');
      expect(mockSetString).toHaveBeenCalledWith('senderName', 'De: Tu amigo');
    });

    it('limpia errores de validación al restaurar', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      
      // Crear un error
      fireEvent.change(nameInput, { target: { value: 'Texto extremadamente largo' } });
      expect(screen.getByText(/Máximo 20 caracteres/)).toBeInTheDocument();

      // Restaurar
      const resetButton = screen.getByText('Restaurar');
      fireEvent.click(resetButton);

      // Error debe desaparecer
      expect(screen.queryByText(/Máximo 20 caracteres/)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 6. BOTÓN GUARDAR
  // ==========================================================================

  describe('Botón Guardar', () => {
    it('llama a onSave con los valores actuales', () => {
      const onSave = jest.fn();

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
          onSave={onSave}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: 'Laura' } });

      const saveButton = screen.getByText('Aplicar Cambios');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith({
        recipientName: 'Laura',
        message: '¡Feliz cumpleaños!',
        senderName: 'De: Tu amigo'
      });
    });

    it('no llama a onSave si hay errores de validación', () => {
      const onSave = jest.fn();

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
          onSave={onSave}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveButton = screen.getByText('Aplicar Cambios');
      fireEvent.click(saveButton);

      expect(onSave).not.toHaveBeenCalled();
    });

    it('valida todos los campos antes de guardar', () => {
      const onSave = jest.fn();

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
          onSave={onSave}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      const messageInput = screen.getByLabelText(/Mensaje/);

      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.change(messageInput, { target: { value: '' } });

      const saveButton = screen.getByText('Aplicar Cambios');
      fireEvent.click(saveButton);

      // Debe mostrar errores en ambos campos
      const errorMessages = screen.getAllByText('Este campo es requerido');
      expect(errorMessages.length).toBeGreaterThanOrEqual(2);
    });

    it('funciona correctamente si no hay callback onSave', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const saveButton = screen.getByText('Aplicar Cambios');
      
      // No debe lanzar error
      expect(() => {
        fireEvent.click(saveButton);
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // 7. BOTÓN CANCELAR
  // ==========================================================================

  describe('Botón Cancelar', () => {
    it('llama a onCancel cuando se hace clic', () => {
      const onCancel = jest.fn();

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 8. INTEGRACIÓN COMPLETA
  // ==========================================================================

  describe('Integración Completa', () => {
    it('flujo completo: cargar -> editar -> guardar', async () => {
      const onSave = jest.fn();

      mockGetString.mockImplementation((name: string) => {
        if (name === 'recipientName') return 'Carlos';
        return '';
      });

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
          onSave={onSave}
        />
      );

      // Esperar carga inicial
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Nombre del destinatario/) as HTMLInputElement;
        expect(nameInput.value).toBe('Carlos');
      });

      // Editar
      const messageInput = screen.getByLabelText(/Mensaje/);
      fireEvent.change(messageInput, { target: { value: '¡Que cumplas muchos más!' } });

      // Guardar
      const saveButton = screen.getByText('Aplicar Cambios');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith({
        recipientName: 'Carlos',
        message: '¡Que cumplas muchos más!',
        senderName: 'De: Tu amigo'
      });
    });

    it('flujo completo: cargar -> editar -> restaurar -> guardar', async () => {
      const onSave = jest.fn();

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
          onSave={onSave}
        />
      );

      // Editar
      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: 'Modificado' } });

      // Restaurar
      const resetButton = screen.getByText('Restaurar');
      fireEvent.click(resetButton);

      // Guardar
      const saveButton = screen.getByText('Aplicar Cambios');
      fireEvent.click(saveButton);

      // Debe guardar valores por defecto
      expect(onSave).toHaveBeenCalledWith({
        recipientName: 'Amigo',
        message: '¡Feliz cumpleaños!',
        senderName: 'De: Tu amigo'
      });
    });

    it('maneja múltiples ediciones seguidas correctamente', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);

      mockSetString.mockClear();

      // Editar múltiples veces
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.change(nameInput, { target: { value: 'An' } });
      fireEvent.change(nameInput, { target: { value: 'Ana' } });

      expect(mockSetString).toHaveBeenCalledTimes(3);
      expect(mockSetString).toHaveBeenLastCalledWith('recipientName', 'Ana');
    });
  });

  // ==========================================================================
  // 9. CASOS EDGE
  // ==========================================================================

  describe('Casos Edge', () => {
    it('maneja template sin variables', () => {
      const emptyTemplate: MomentTemplate = {
        ...mockTemplate,
        variables: []
      };

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={emptyTemplate}
        />
      );

      expect(screen.getByText('Personaliza tu Template')).toBeInTheDocument();
      expect(screen.getByText('Aplicar Cambios')).toBeInTheDocument();
    });

    it('maneja valores con caracteres especiales', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const messageInput = screen.getByLabelText(/Mensaje/);
      const specialText = '¡Hola! 🎉 #Cumpleaños @Ana';

      fireEvent.change(messageInput, { target: { value: specialText } });

      expect((messageInput as HTMLInputElement).value).toBe(specialText);
      expect(mockSetString).toHaveBeenCalledWith('message', specialText);
    });

    it('maneja valores con saltos de línea en textarea', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplateWithLongText}
        />
      );

      const storyTextarea = screen.getByLabelText(/Historia/);
      const multilineText = 'Línea 1\nLínea 2\nLínea 3';

      fireEvent.change(storyTextarea, { target: { value: multilineText } });

      expect((storyTextarea as HTMLTextAreaElement).value).toBe(multilineText);
      expect(mockSetString).toHaveBeenCalledWith('story', multilineText);
    });

    it('maneja cambio de template mientras está editando', async () => {
      const { rerender } = render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: 'Editado' } });

      // Cambiar a otro template
      rerender(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplateWithLongText}
        />
      );

      // Debe mostrar los nuevos campos
      expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Historia/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Nombre del destinatario/)).not.toBeInTheDocument();
    });

    it('maneja instancia CE.SDK nula gracefully', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <TemplateVariableEditor
          cesdkInstance={null as any}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      
      // No debe lanzar error al intentar actualizar
      expect(() => {
        fireEvent.change(nameInput, { target: { value: 'Test' } });
      }).not.toThrow();

      consoleWarn.mockRestore();
    });
  });

  // ==========================================================================
  // 10. ACCESIBILIDAD
  // ==========================================================================

  describe('Accesibilidad', () => {
    it('todos los inputs tienen labels asociados', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      const messageInput = screen.getByLabelText(/Mensaje/);
      const senderInput = screen.getByLabelText(/Tu nombre/);

      expect(nameInput).toBeInTheDocument();
      expect(messageInput).toBeInTheDocument();
      expect(senderInput).toBeInTheDocument();
    });

    it('los campos con error tienen estilos visuales apropiados', () => {
      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre del destinatario/);
      fireEvent.change(nameInput, { target: { value: 'Texto extremadamente largo que excede el límite' } });

      expect(nameInput).toHaveClass('border-red-500');
      expect(screen.getByText(/Máximo 20 caracteres/)).toHaveClass('text-red-500');
    });

    it('los botones tienen texto descriptivo', () => {
      const onSave = jest.fn();
      const onCancel = jest.fn();

      render(
        <TemplateVariableEditor
          cesdkInstance={mockCESDKInstance}
          template={mockTemplate}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Restaurar')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Aplicar Cambios')).toBeInTheDocument();
    });
  });
});
