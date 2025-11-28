/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreatePostCard } from '../CreatePostCard';
import { useAuth } from '@/contexts/AuthContext';
import { createMomentAction } from '@/lib/server/moments-actions';
import type { Moment } from '@/generated/graphql';

// ============================================================================
// MOCKS
// ============================================================================

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock moments-actions
jest.mock('@/lib/server/moments-actions', () => ({
  createMomentAction: jest.fn(),
}));

// Mock ProfileImage component
jest.mock('@/components/ui/ProfileImage', () => ({
  ProfileImage: ({ alt, fallbackText, size }: any) => (
    <div data-testid="profile-image" data-alt={alt} data-fallback={fallbackText} data-size={size}>
      Profile Image
    </div>
  ),
}));

// Mock MediaUploader component
jest.mock('@/components/media/MediaUploader', () => ({
  MediaUploader: ({ onFileSelected, selectedFile, disabled }: any) => (
    <div data-testid="media-uploader">
      <input
        type="file"
        data-testid="file-input"
        onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
        disabled={disabled}
      />
      {selectedFile && <div data-testid="selected-file">{selectedFile.name}</div>}
    </div>
  ),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  profilePhotoPath: '/images/profile.jpg',
};

const mockMoment: Moment = {
  __typename: 'Moment',
  id: 'moment-123',
  description: 'Test moment',
  owner: 'user-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: ['test'],
  mediaUrl: null,
  mediaType: null,
  location: null,
  latitude: null,
  longitude: null,
};

// ============================================================================
// TEST SETUP
// ============================================================================

describe('CreatePostCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup auth mock
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });
  });

  // ==========================================================================
  // 1. RENDERIZADO INICIAL (VISTA COMPACTA)
  // ==========================================================================

  describe('Renderizado Inicial - Vista Compacta', () => {
    it('renderiza la vista compacta por defecto', () => {
      render(<CreatePostCard />);
      
      expect(screen.getByText('¿Qué estás pensando?')).toBeInTheDocument();
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
    });

    it('renderiza la imagen de perfil del usuario', () => {
      render(<CreatePostCard />);
      
      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('data-alt', 'John Doe');
      expect(profileImage).toHaveAttribute('data-fallback', 'JO');
    });

    it('muestra iconos de imagen y video', () => {
      render(<CreatePostCard />);
      
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThanOrEqual(2);
    });

    it('expande el formulario al hacer clic', () => {
      render(<CreatePostCard />);
      
      const button = screen.getByRole('button', { name: /¿Qué estás pensando?/i });
      fireEvent.click(button);
      
      expect(screen.getByPlaceholderText('¿Qué estás pensando?')).toBeInTheDocument();
    });

    it('muestra fallback correcto cuando no hay nombre de usuario', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, name: undefined },
      });

      render(<CreatePostCard />);
      
      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage).toHaveAttribute('data-fallback', 'U');
    });
  });

  // ==========================================================================
  // 2. VISTA EXPANDIDA
  // ==========================================================================

  describe('Vista Expandida', () => {
    beforeEach(() => {
      render(<CreatePostCard />);
      const button = screen.getByRole('button', { name: /¿Qué estás pensando?/i });
      fireEvent.click(button);
    });

    it('muestra el textarea de descripción', () => {
      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('muestra el componente MediaUploader', () => {
      expect(screen.getByTestId('media-uploader')).toBeInTheDocument();
    });

    it('muestra botones de acción', () => {
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Publicar/i })).toBeInTheDocument();
    });

    it('muestra botones de emoji y ubicación', () => {
      const buttons = screen.getAllByRole('button');
      const emojiButton = buttons.find(btn => btn.title === 'Agregar emoji');
      const locationButton = buttons.find(btn => btn.title === 'Agregar ubicación');
      
      expect(emojiButton).toBeInTheDocument();
      expect(locationButton).toBeInTheDocument();
    });

    it('enfoca automáticamente el textarea', () => {
      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      expect(document.activeElement).toBe(textarea);
    });
  });

  // ==========================================================================
  // 3. EDICIÓN DE DESCRIPCIÓN
  // ==========================================================================

  describe('Edición de Descripción', () => {
    beforeEach(() => {
      render(<CreatePostCard />);
      fireEvent.click(screen.getByRole('button', { name: /¿Qué estás pensando?/i }));
    });

    it('permite escribir en el textarea', () => {
      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?') as HTMLTextAreaElement;
      
      fireEvent.change(textarea, { target: { value: 'Mi primer post' } });
      
      expect(textarea.value).toBe('Mi primer post');
    });

    it('ajusta la altura del textarea automáticamente', () => {
      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?') as HTMLTextAreaElement;
      
      // Mock scrollHeight
      Object.defineProperty(textarea, 'scrollHeight', {
        writable: true,
        configurable: true,
        value: 200,
      });
      
      fireEvent.change(textarea, { target: { value: 'Texto largo\n'.repeat(10) } });
      
      expect(textarea.style.height).toBe('200px');
    });

    it('limpia el textarea al cancelar', () => {
      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?') as HTMLTextAreaElement;
      
      fireEvent.change(textarea, { target: { value: 'Test content' } });
      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
      
      expect(screen.queryByPlaceholderText('¿Qué estás pensando?')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 4. SELECCIÓN DE ARCHIVOS
  // ==========================================================================

  describe('Selección de Archivos', () => {
    beforeEach(() => {
      render(<CreatePostCard />);
      fireEvent.click(screen.getByRole('button', { name: /¿Qué estás pensando?/i }));
    });

    it('permite seleccionar un archivo', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(screen.getByTestId('selected-file')).toHaveTextContent('test.jpg');
    });

    it('muestra el nombre del archivo seleccionado', () => {
      const file = new File(['content'], 'vacation.png', { type: 'image/png' });
      const fileInput = screen.getByTestId('file-input');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(screen.getByText('vacation.png')).toBeInTheDocument();
    });

    it('limpia el archivo al cancelar', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
      
      expect(screen.queryByTestId('selected-file')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 5. MANEJO DE TAGS
  // ==========================================================================

  describe('Manejo de Tags', () => {
    beforeEach(() => {
      render(<CreatePostCard />);
      fireEvent.click(screen.getByRole('button', { name: /¿Qué estás pensando?/i }));
    });

    it('agrega tag al presionar Enter', () => {
      const tagInput = screen.getByPlaceholderText('Agregar tag...');
      
      fireEvent.change(tagInput, { target: { value: 'comida' } });
      fireEvent.keyPress(tagInput, { key: 'Enter', charCode: 13 });
      
      expect(screen.getByText('#comida')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 6. VALIDACIÓN
  // ==========================================================================

  describe('Validación', () => {
    beforeEach(() => {
      render(<CreatePostCard />);
      fireEvent.click(screen.getByRole('button', { name: /¿Qué estás pensando?/i }));
    });

    it('deshabilita el botón Publicar si no hay contenido', () => {
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      expect(publishButton).toBeDisabled();
    });

    it('habilita el botón Publicar con descripción', () => {
      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Contenido válido' } });
      
      expect(publishButton).not.toBeDisabled();
    });

    it('habilita el botón Publicar con archivo', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(publishButton).not.toBeDisabled();
    });

    it('muestra error si se intenta publicar sin contenido', async () => {
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      // Forzar submit aunque esté deshabilitado
      const form = publishButton.closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Agrega una descripción o selecciona un archivo')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 7. ENVÍO DEL FORMULARIO
  // ==========================================================================

  describe('Envío del Formulario', () => {
    beforeEach(() => {
      render(<CreatePostCard />);
      fireEvent.click(screen.getByRole('button', { name: /¿Qué estás pensando?/i }));
    });

    it('envía el formulario con descripción', async () => {
      (createMomentAction as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMoment,
      });

      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Mi primer momento' } });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(createMomentAction).toHaveBeenCalled();
      });

      const formData = (createMomentAction as jest.Mock).mock.calls[0][0];
      expect(formData.get('description')).toBe('Mi primer momento');
    });

    it('envía el formulario con archivo', async () => {
      (createMomentAction as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMoment,
      });

      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');
      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Con foto' } });
      fireEvent.change(fileInput, { target: { files: [file] } });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(createMomentAction).toHaveBeenCalled();
      });

      const formData = (createMomentAction as jest.Mock).mock.calls[0][0];
      expect(formData.get('media')).toBe(file);
    });

    it('limpia el formulario después de envío exitoso', async () => {
      (createMomentAction as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMoment,
      });

      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Test post' } });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(screen.getByText('¿Qué estás pensando?')).toBeInTheDocument();
        expect(screen.queryByRole('form')).not.toBeInTheDocument();
      });
    });

    it('colapsa a vista compacta después de envío exitoso', async () => {
      (createMomentAction as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMoment,
      });

      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Success' } });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        const compactButton = screen.getByRole('button', { name: /¿Qué estás pensando?/i });
        expect(compactButton).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 8. MANEJO DE ERRORES
  // ==========================================================================

  describe('Manejo de Errores', () => {
    beforeEach(() => {
      render(<CreatePostCard />);
      fireEvent.click(screen.getByRole('button', { name: /¿Qué estás pensando?/i }));
    });

    it('muestra error del servidor', async () => {
      (createMomentAction as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error de red',
      });

      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error de red')).toBeInTheDocument();
      });
    });

    it('muestra error genérico si no hay mensaje específico', async () => {
      (createMomentAction as jest.Mock).mockResolvedValue({
        success: false,
      });

      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error al crear el momento')).toBeInTheDocument();
      });
    });

    it('muestra error de excepción', async () => {
      (createMomentAction as jest.Mock).mockRejectedValue(new Error('Network error'));

      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error inesperado al crear el momento')).toBeInTheDocument();
      });
    });

    it('mantiene la vista expandida después de error', async () => {
      (createMomentAction as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error',
      });

      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('¿Qué estás pensando?')).toBeInTheDocument();
    });

    it('limpia el error al seleccionar archivo', async () => {
      // Primero generar un error
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      const form = publishButton.closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Agrega una descripción o selecciona un archivo')).toBeInTheDocument();
      });

      // Seleccionar archivo
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(screen.queryByText('Agrega una descripción o selecciona un archivo')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 9. CALLBACK onPostCreated
  // ==========================================================================

  describe('Callback onPostCreated', () => {
    it('llama onPostCreated después de crear el post exitosamente', async () => {
      const onPostCreated = jest.fn();
      (createMomentAction as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMoment,
      });

      render(<CreatePostCard onPostCreated={onPostCreated} />);
      
      fireEvent.click(screen.getByRole('button', { name: /¿Qué estás pensando?/i }));
      
      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Nuevo post' } });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(onPostCreated).toHaveBeenCalledWith(mockMoment);
      });
    });

    it('no llama onPostCreated si hay error', async () => {
      const onPostCreated = jest.fn();
      (createMomentAction as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error',
      });

      render(<CreatePostCard onPostCreated={onPostCreated} />);
      
      fireEvent.click(screen.getByRole('button', { name: /¿Qué estás pensando?/i }));
      
      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      expect(onPostCreated).not.toHaveBeenCalled();
    });

    it('funciona sin callback onPostCreated', async () => {
      (createMomentAction as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMoment,
      });

      render(<CreatePostCard />);
      
      fireEvent.click(screen.getByRole('button', { name: /¿Qué estás pensando?/i }));
      
      const textarea = screen.getByPlaceholderText('¿Qué estás pensando?');
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      
      fireEvent.change(textarea, { target: { value: 'Sin callback' } });
      
      // No debería lanzar error
      await expect(async () => {
        fireEvent.click(publishButton);
        await waitFor(() => {
          expect(createMomentAction).toHaveBeenCalled();
        });
      }).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // 10. CANCELAR EDICIÓN
  // ==========================================================================

  describe('Cancelar Edición', () => {
    beforeEach(() => {
      render(<CreatePostCard />);
      fireEvent.click(screen.getByRole('button', { name: /¿Qué estás pensando?/i }));
    });

    it('colapsa a vista compacta al cancelar', () => {
      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
      
      expect(screen.queryByPlaceholderText('¿Qué estás pensando?')).not.toBeInTheDocument();
      expect(screen.getByText('¿Qué estás pensando?')).toBeInTheDocument();
    });

    it('limpia mensajes de error al cancelar', async () => {
      const publishButton = screen.getByRole('button', { name: /Publicar/i });
      const form = publishButton.closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Agrega una descripción o selecciona un archivo')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
      
      expect(screen.queryByText('Agrega una descripción o selecciona un archivo')).not.toBeInTheDocument();
    });
  });
});

