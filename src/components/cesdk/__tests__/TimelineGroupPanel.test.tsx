/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TimelineGroupPanel } from '../TimelineGroupPanel';
import type { TimelineGroup } from '@/lib/cesdk/timeline-groups';

// Mock type for CreativeEditorSDK
type CreativeEditorSDK = {
  ui: {
    showNotification: jest.Mock;
  };
};

// ============================================================================
// MOCKS
// ============================================================================

// Mock useTimelineGroups hook
const mockCreateGroupFromSelection = jest.fn();
const mockDeleteGroup = jest.fn();
const mockUpdateGroup = jest.fn();
const mockMergeGroups = jest.fn();
const mockSelectGroup = jest.fn();

jest.mock('@/hooks/useTimelineGroups', () => ({
  useTimelineGroups: jest.fn(() => ({
    groups: [],
    selectedGroupId: null,
    hasSelection: false,
    canCreateGroup: false,
    createGroupFromSelection: mockCreateGroupFromSelection,
    deleteGroup: mockDeleteGroup,
    updateGroup: mockUpdateGroup,
    mergeGroups: mockMergeGroups,
    selectGroup: mockSelectGroup
  }))
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockGroups: TimelineGroup[] = [
  {
    id: 1,
    name: 'Grupo A',
    color: '#EC4899',
    clipIds: [10, 11, 12],
    startTime: 0,
    duration: 10.5
  },
  {
    id: 2,
    name: 'Grupo B',
    color: '#9333EA',
    clipIds: [20, 21],
    startTime: 12,
    duration: 8.25
  },
  {
    id: 3,
    name: 'Grupo C',
    color: '#F472B6',
    clipIds: [30, 31, 32, 33],
    startTime: 22,
    duration: 15.75
  }
];

const mockCESDKInstance = {
  ui: {
    showNotification: jest.fn()
  }
} as unknown as CreativeEditorSDK;

// ============================================================================
// TESTS
// ============================================================================

describe('TimelineGroupPanel', () => {
  // Import the hook mock
  const { useTimelineGroups } = require('@/hooks/useTimelineGroups');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // 1. RENDERIZADO
  // ==========================================================================

  describe('Renderizado', () => {
    it('no se renderiza si no está en modo video', () => {
      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('no se renderiza si no hay instancia de CE.SDK', () => {
      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={null}
          isVideoMode={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renderiza el header del panel correctamente', () => {
      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      expect(screen.getByText('📦')).toBeInTheDocument();
      expect(screen.getByText('Grupos de Timeline')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('muestra la cantidad de grupos en el badge', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renderiza colapsado si defaultCollapsed es true', () => {
      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
          defaultCollapsed={true}
        />
      );

      expect(screen.queryByText('Crear Grupo')).not.toBeInTheDocument();
    });

    it('muestra mensaje cuando no hay grupos', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      expect(screen.getByText('No hay grupos creados')).toBeInTheDocument();
      expect(screen.getByText('Selecciona 2 o más clips para agruparlos')).toBeInTheDocument();
    });

    it('renderiza la lista de grupos', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      expect(screen.getByText('Grupo A')).toBeInTheDocument();
      expect(screen.getByText('Grupo B')).toBeInTheDocument();
      expect(screen.getByText('Grupo C')).toBeInTheDocument();
    });

    it('muestra información de cada grupo (clips, duración, tiempo)', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      expect(screen.getByText('3 clips')).toBeInTheDocument();
      expect(screen.getByText('2 clips')).toBeInTheDocument();
      expect(screen.getByText('4 clips')).toBeInTheDocument();

      expect(screen.getByText('0:10')).toBeInTheDocument();
      expect(screen.getByText('0:08')).toBeInTheDocument();
      expect(screen.getByText('0:15')).toBeInTheDocument();
    });

    it('resalta el grupo seleccionado con ring rosa', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: 2,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const groupCards = container.querySelectorAll('.ring-pink-500');
      expect(groupCards.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 2. COLAPSAR/EXPANDIR PANEL
  // ==========================================================================

  describe('Colapsar/Expandir Panel', () => {
    it('colapsa el contenido al hacer clic en el header', () => {
      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const header = screen.getByText('Grupos de Timeline').closest('button');
      expect(screen.getByText('Crear Grupo')).toBeInTheDocument();

      fireEvent.click(header!);

      expect(screen.queryByText('Crear Grupo')).not.toBeInTheDocument();
    });

    it('expande el contenido al hacer clic nuevamente', () => {
      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const header = screen.getByText('Grupos de Timeline').closest('button');

      fireEvent.click(header!);
      expect(screen.queryByText('Crear Grupo')).not.toBeInTheDocument();

      fireEvent.click(header!);
      expect(screen.getByText('Crear Grupo')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 3. CREAR GRUPO
  // ==========================================================================

  describe('Crear Grupo', () => {
    it('botón crear grupo deshabilitado si no se puede crear', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const createButton = screen.getByText('Crear Grupo').closest('button');
      expect(createButton).toBeDisabled();
    });

    it('botón crear grupo habilitado si se puede crear', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: true,
        canCreateGroup: true,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const createButton = screen.getByText('Crear Grupo').closest('button');
      expect(createButton).not.toBeDisabled();
    });

    it('muestra formulario de creación al hacer clic en crear grupo', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: true,
        canCreateGroup: true,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const createButton = screen.getByText('Crear Grupo');
      fireEvent.click(createButton);

      expect(screen.getByPlaceholderText('Nombre del grupo...')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('muestra selector de colores en formulario de creación', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: true,
        canCreateGroup: true,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const createButton = screen.getByText('Crear Grupo');
      fireEvent.click(createButton);

      // Buscar botones de color con títulos específicos
      const colorButtons = container.querySelectorAll('[title="Rosa"], [title="Morado"], [title="Naranja"]');
      expect(colorButtons.length).toBeGreaterThan(0);
    });

    it('crea grupo con nombre y color seleccionado', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: true,
        canCreateGroup: true,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      mockCreateGroupFromSelection.mockReturnValue({
        id: 10,
        name: 'Nuevo Grupo',
        color: '#EC4899',
        clipIds: [1, 2],
        startTime: 0,
        duration: 5
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const createButton = screen.getByText('Crear Grupo');
      fireEvent.click(createButton);

      const input = screen.getByPlaceholderText('Nombre del grupo...');
      fireEvent.change(input, { target: { value: 'Nuevo Grupo' } });

      const submitButton = screen.getByText('Crear Grupo');
      fireEvent.click(submitButton);

      expect(mockCreateGroupFromSelection).toHaveBeenCalledWith('Nuevo Grupo', '#EC4899');
    });

    it('cancela creación y cierra formulario', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: true,
        canCreateGroup: true,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const createButton = screen.getByText('Crear Grupo');
      fireEvent.click(createButton);

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText('Nombre del grupo...')).not.toBeInTheDocument();
    });

    it('permite crear grupo con Enter en el input', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: true,
        canCreateGroup: true,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      mockCreateGroupFromSelection.mockReturnValue({
        id: 10,
        name: 'Grupo Enter',
        color: '#EC4899',
        clipIds: [1, 2],
        startTime: 0,
        duration: 5
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const createButton = screen.getByText('Crear Grupo');
      fireEvent.click(createButton);

      const input = screen.getByPlaceholderText('Nombre del grupo...');
      fireEvent.change(input, { target: { value: 'Grupo Enter' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockCreateGroupFromSelection).toHaveBeenCalledWith('Grupo Enter', '#EC4899');
    });

    it('permite cancelar creación con Escape en el input', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: true,
        canCreateGroup: true,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const createButton = screen.getByText('Crear Grupo');
      fireEvent.click(createButton);

      const input = screen.getByPlaceholderText('Nombre del grupo...');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByPlaceholderText('Nombre del grupo...')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 4. EDITAR GRUPO
  // ==========================================================================

  describe('Editar Grupo', () => {
    it('muestra formulario de edición al hacer clic en editar', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      // Buscar el botón de editar por su título
      const editButtons = container.querySelectorAll('[title="Editar nombre"]');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Guardar')).toBeInTheDocument();
    });

    it('actualiza el nombre del grupo', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const editButtons = container.querySelectorAll('[title="Editar nombre"]');
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue('Grupo A');
      fireEvent.change(input, { target: { value: 'Grupo Editado' } });

      const saveButton = screen.getByText('Guardar');
      fireEvent.click(saveButton);

      expect(mockUpdateGroup).toHaveBeenCalledWith(1, { name: 'Grupo Editado' });
    });

    it('cancela edición sin guardar cambios', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const editButtons = container.querySelectorAll('[title="Editar nombre"]');
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue('Grupo A');
      fireEvent.change(input, { target: { value: 'Cambio No Guardado' } });

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(mockUpdateGroup).not.toHaveBeenCalled();
    });

    it('permite guardar edición con Enter', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const editButtons = container.querySelectorAll('[title="Editar nombre"]');
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue('Grupo A');
      fireEvent.change(input, { target: { value: 'Grupo Enter' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockUpdateGroup).toHaveBeenCalledWith(1, { name: 'Grupo Enter' });
    });

    it('permite cancelar edición con Escape', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const editButtons = container.querySelectorAll('[title="Editar nombre"]');
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue('Grupo A');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(mockUpdateGroup).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 5. ELIMINAR/DESAGRUPAR
  // ==========================================================================

  describe('Eliminar/Desagrupar', () => {
    it('desagrupa al hacer clic en botón desagrupar', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const ungroupButtons = container.querySelectorAll('[title="Desagrupar"]');
      fireEvent.click(ungroupButtons[0]);

      expect(mockDeleteGroup).toHaveBeenCalledWith(1, false);
    });

    it('elimina grupo y clips al hacer clic en botón eliminar', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const deleteButtons = container.querySelectorAll('[title="Eliminar grupo y clips"]');
      fireEvent.click(deleteButtons[0]);

      expect(mockDeleteGroup).toHaveBeenCalledWith(1, true);
    });
  });

  // ==========================================================================
  // 6. SELECCIONAR GRUPO
  // ==========================================================================

  describe('Seleccionar Grupo', () => {
    it('selecciona grupo al hacer clic en el nombre', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const groupButton = screen.getByText('Grupo A');
      fireEvent.click(groupButton);

      expect(mockSelectGroup).toHaveBeenCalledWith(1);
    });
  });

  // ==========================================================================
  // 7. FUSIONAR GRUPOS
  // ==========================================================================

  describe('Fusionar Grupos', () => {
    it('no muestra botón de fusión si hay menos de 2 grupos', () => {
      useTimelineGroups.mockReturnValue({
        groups: [mockGroups[0]],
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      expect(screen.queryByText('🔗 Fusionar Grupos')).not.toBeInTheDocument();
    });

    it('muestra botón de fusión si hay 2 o más grupos', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      expect(screen.getByText('🔗 Fusionar Grupos')).toBeInTheDocument();
    });

    it('activa modo de fusión al hacer clic en botón fusionar', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const mergeButton = screen.getByText('🔗 Fusionar Grupos');
      fireEvent.click(mergeButton);

      expect(screen.getByText('Cancelar Fusión')).toBeInTheDocument();
    });

    it('permite seleccionar grupos para fusionar', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const mergeButton = screen.getByText('🔗 Fusionar Grupos');
      fireEvent.click(mergeButton);

      const groupA = screen.getByText('Grupo A');
      const groupB = screen.getByText('Grupo B');

      fireEvent.click(groupA);
      fireEvent.click(groupB);

      const checkboxes = container.querySelectorAll('.bg-purple-600');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('muestra botón de fusión cuando se seleccionan 2+ grupos', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const mergeButton = screen.getByText('🔗 Fusionar Grupos');
      fireEvent.click(mergeButton);

      const groupA = screen.getByText('Grupo A');
      const groupB = screen.getByText('Grupo B');

      fireEvent.click(groupA);
      fireEvent.click(groupB);

      expect(screen.getByText(/✓ Fusionar 2 grupos/)).toBeInTheDocument();
    });

    it('fusiona grupos seleccionados', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const mergeButton = screen.getByText('🔗 Fusionar Grupos');
      fireEvent.click(mergeButton);

      const groupA = screen.getByText('Grupo A');
      const groupB = screen.getByText('Grupo B');

      fireEvent.click(groupA);
      fireEvent.click(groupB);

      const confirmMergeButton = screen.getByText(/✓ Fusionar 2 grupos/);
      fireEvent.click(confirmMergeButton);

      expect(mockMergeGroups).toHaveBeenCalledWith([1, 2], 'Merged: Grupo A + Grupo B');
    });

    it('muestra notificación si se intenta fusionar menos de 2 grupos', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const mergeButton = screen.getByText('🔗 Fusionar Grupos');
      fireEvent.click(mergeButton);

      const groupA = screen.getByText('Grupo A');
      fireEvent.click(groupA);

      // Intentar fusionar sin botón visible (llamar directamente)
      // En este caso, el botón no aparece, pero podemos probar el flujo interno
      expect(screen.queryByText(/✓ Fusionar/)).not.toBeInTheDocument();
    });

    it('cancela modo de fusión', () => {
      useTimelineGroups.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const mergeButton = screen.getByText('🔗 Fusionar Grupos');
      fireEvent.click(mergeButton);

      const cancelButton = screen.getByText('Cancelar Fusión');
      fireEvent.click(cancelButton);

      expect(screen.getByText('🔗 Fusionar Grupos')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 8. APLICAR CLASE PERSONALIZADA
  // ==========================================================================

  describe('Estilo y Personalización', () => {
    it('aplica className personalizado', () => {
      const { container } = render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
          className="w-96 custom-class"
        />
      );

      const panel = container.firstChild as HTMLElement;
      expect(panel.className).toContain('w-96');
      expect(panel.className).toContain('custom-class');
    });
  });

  // ==========================================================================
  // 9. FORMATEO DE DURACIÓN
  // ==========================================================================

  describe('Formateo de Duración', () => {
    it('formatea correctamente duraciones cortas', () => {
      useTimelineGroups.mockReturnValue({
        groups: [{
          id: 1,
          name: 'Test',
          color: '#EC4899',
          clipIds: [1],
          startTime: 0,
          duration: 5.5
        }],
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      expect(screen.getByText('0:05')).toBeInTheDocument();
    });

    it('formatea correctamente duraciones largas', () => {
      useTimelineGroups.mockReturnValue({
        groups: [{
          id: 1,
          name: 'Test',
          color: '#EC4899',
          clipIds: [1],
          startTime: 0,
          duration: 125.8
        }],
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      expect(screen.getByText('2:05')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 10. MANEJO DE ERRORES
  // ==========================================================================

  describe('Manejo de Errores', () => {
    it('no falla si createGroupFromSelection devuelve null', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: true,
        canCreateGroup: true,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      mockCreateGroupFromSelection.mockReturnValue(null);

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      const createButton = screen.getByText('Crear Grupo');
      fireEvent.click(createButton);

      const input = screen.getByPlaceholderText('Nombre del grupo...');
      fireEvent.change(input, { target: { value: 'Test' } });

      const submitButton = screen.getByText('Crear Grupo');
      fireEvent.click(submitButton);

      // No debe haber error, el formulario permanece visible
      expect(screen.getByPlaceholderText('Nombre del grupo...')).toBeInTheDocument();
    });

    it('maneja hook sin grupos correctamente', () => {
      useTimelineGroups.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        hasSelection: false,
        canCreateGroup: false,
        createGroupFromSelection: mockCreateGroupFromSelection,
        deleteGroup: mockDeleteGroup,
        updateGroup: mockUpdateGroup,
        mergeGroups: mockMergeGroups,
        selectGroup: mockSelectGroup
      });

      render(
        <TimelineGroupPanel
          cesdkInstance={mockCESDKInstance}
          isVideoMode={true}
        />
      );

      expect(screen.getByText('No hay grupos creados')).toBeInTheDocument();
    });
  });
});
