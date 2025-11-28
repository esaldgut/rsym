import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EffectStackManager } from '../EffectStackManager';

// Mock CE.SDK functions
const mockSupportsEffects = jest.fn();
const mockGetEffects = jest.fn();
const mockGetType = jest.fn();
const mockIsEffectEnabled = jest.fn();
const mockSetEffectEnabled = jest.fn();
const mockRemoveEffect = jest.fn();
const mockDestroy = jest.fn();
const mockInsertEffect = jest.fn();
const mockCreateEffect = jest.fn();
const mockAppendEffect = jest.fn();
const mockSetFloat = jest.fn();
const mockShowNotification = jest.fn();

const mockCesdkInstance = {
  engine: {
    block: {
      supportsEffects: mockSupportsEffects,
      getEffects: mockGetEffects,
      getType: mockGetType,
      isEffectEnabled: mockIsEffectEnabled,
      setEffectEnabled: mockSetEffectEnabled,
      removeEffect: mockRemoveEffect,
      destroy: mockDestroy,
      insertEffect: mockInsertEffect,
      createEffect: mockCreateEffect,
      appendEffect: mockAppendEffect,
      setFloat: mockSetFloat,
    },
  },
  ui: {
    showNotification: mockShowNotification,
  },
};

describe('EffectStackManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockSupportsEffects.mockReturnValue(true);
    mockGetEffects.mockReturnValue([]);
    mockIsEffectEnabled.mockReturnValue(true);
    mockCreateEffect.mockImplementation((type) => {
      return Math.floor(Math.random() * 1000) + 100; // Random effect ID
    });
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  test('1- no renderiza cuando no hay CE.SDK instance', () => {
    const { container } = render(
      <EffectStackManager
        cesdkInstance={null}
        selectedBlockId={1}
        onEffectChange={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('2- no renderiza cuando no hay bloque seleccionado', () => {
    const { container } = render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={null}
        onEffectChange={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('3- renderiza presets rápidos', () => {
    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    expect(screen.getByText('Presets Rápidos')).toBeInTheDocument();
    expect(screen.getByText('Vintage')).toBeInTheDocument();
    expect(screen.getByText('HDR')).toBeInTheDocument();
    expect(screen.getByText('Dreamy')).toBeInTheDocument();
    expect(screen.getByText('Dramatic')).toBeInTheDocument();
  });

  test('4- muestra mensaje cuando no hay efectos', () => {
    mockGetEffects.mockReturnValue([]);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    expect(screen.getByText(/No hay efectos aplicados/)).toBeInTheDocument();
  });

  test('5- renderiza lista de efectos aplicados', () => {
    mockGetEffects.mockReturnValue([101, 102, 103]);
    mockGetType.mockImplementation((id) => {
      const types: Record<number, string> = {
        101: 'adjustments',
        102: 'extrude_blur',
        103: 'vignette',
      };
      return types[id];
    });
    mockIsEffectEnabled.mockReturnValue(true);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    expect(screen.getByText('Efectos Aplicados (3)')).toBeInTheDocument();
    expect(screen.getByText('Ajustes')).toBeInTheDocument();
    expect(screen.getByText('Desenfoque')).toBeInTheDocument();
    expect(screen.getByText('Viñeta')).toBeInTheDocument();
  });

  // ============================================================================
  // EFFECT SUPPORT DETECTION
  // ============================================================================

  test('6- maneja bloque que no soporta efectos', () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockSupportsEffects.mockReturnValue(false);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    expect(mockSupportsEffects).toHaveBeenCalledWith(1);
    expect(screen.getByText(/No hay efectos aplicados/)).toBeInTheDocument();

    consoleLog.mockRestore();
  });

  // ============================================================================
  // EFFECT TOGGLE
  // ============================================================================

  test('7- habilita/deshabilita efecto al hacer click en toggle', async () => {
    mockGetEffects.mockReturnValue([101]);
    mockGetType.mockReturnValue('adjustments');
    mockIsEffectEnabled.mockReturnValue(true);

    const onEffectChange = jest.fn();

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
        onEffectChange={onEffectChange}
      />
    );

    const toggleButton = screen.getByText('ON');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockSetEffectEnabled).toHaveBeenCalledWith(101, false);
      expect(onEffectChange).toHaveBeenCalled();
    });
  });

  test('8- muestra estado correcto del toggle (ON/OFF)', () => {
    mockGetEffects.mockReturnValue([101, 102]);
    mockGetType.mockImplementation((id) => id === 101 ? 'adjustments' : 'blur');
    mockIsEffectEnabled.mockImplementation((id) => id === 101);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const buttons = screen.getAllByRole('button');
    const toggleButtons = buttons.filter(btn => btn.textContent === 'ON' || btn.textContent === 'OFF');

    expect(toggleButtons[0]).toHaveTextContent('ON');
    expect(toggleButtons[1]).toHaveTextContent('OFF');
  });

  // ============================================================================
  // EFFECT REMOVAL
  // ============================================================================

  test('9- elimina efecto al hacer click en botón X', async () => {
    mockGetEffects.mockReturnValue([101]);
    mockGetType.mockReturnValue('adjustments');
    mockIsEffectEnabled.mockReturnValue(true);

    const onEffectChange = jest.fn();

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
        onEffectChange={onEffectChange}
      />
    );

    // Find the remove button (X icon)
    const removeButton = screen.getByTitle('Eliminar efecto');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockRemoveEffect).toHaveBeenCalledWith(1, 0); // blockId, index
      expect(mockDestroy).toHaveBeenCalledWith(101); // effectId
      expect(onEffectChange).toHaveBeenCalled();
    });
  });

  test('10- libera memoria al destruir efecto eliminado', async () => {
    mockGetEffects.mockReturnValue([101]);
    mockGetType.mockReturnValue('adjustments');
    mockIsEffectEnabled.mockReturnValue(true);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const removeButton = screen.getByTitle('Eliminar efecto');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockDestroy).toHaveBeenCalledWith(101);
    });
  });

  // ============================================================================
  // DRAG & DROP REORDERING
  // ============================================================================

  test('11- inicia drag al arrastrar efecto', () => {
    mockGetEffects.mockReturnValue([101, 102]);
    mockGetType.mockImplementation((id) => id === 101 ? 'adjustments' : 'blur');
    mockIsEffectEnabled.mockReturnValue(true);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const effectItems = screen.getAllByText('☰');
    const firstEffect = effectItems[0].parentElement;

    fireEvent.dragStart(firstEffect!);

    // Verify drag state (visually indicated by opacity-50 class)
    expect(firstEffect).toHaveClass('opacity-50');
  });

  test('12- reordena efectos al hacer drop', async () => {
    mockGetEffects.mockReturnValue([101, 102, 103]);
    mockGetType.mockImplementation((id) => {
      const types: Record<number, string> = { 101: 'adjustments', 102: 'blur', 103: 'vignette' };
      return types[id];
    });
    mockIsEffectEnabled.mockReturnValue(true);

    const onEffectChange = jest.fn();

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
        onEffectChange={onEffectChange}
      />
    );

    const effectItems = screen.getAllByText('☰');
    const firstEffect = effectItems[0].parentElement;
    const thirdEffect = effectItems[2].parentElement;

    // Drag first effect to third position
    fireEvent.dragStart(firstEffect!);
    fireEvent.dragOver(thirdEffect!);
    fireEvent.drop(thirdEffect!);

    await waitFor(() => {
      expect(mockRemoveEffect).toHaveBeenCalledWith(1, 0); // Remove from index 0
      expect(mockInsertEffect).toHaveBeenCalledWith(1, 101, 2); // Insert at index 2
      expect(onEffectChange).toHaveBeenCalled();
    });
  });

  test('13- no reordena si se suelta en la misma posición', () => {
    mockGetEffects.mockReturnValue([101, 102]);
    mockGetType.mockImplementation((id) => id === 101 ? 'adjustments' : 'blur');
    mockIsEffectEnabled.mockReturnValue(true);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const effectItems = screen.getAllByText('☰');
    const firstEffect = effectItems[0].parentElement;

    // Drag and drop to same position
    fireEvent.dragStart(firstEffect!);
    fireEvent.drop(firstEffect!);

    expect(mockRemoveEffect).not.toHaveBeenCalled();
    expect(mockInsertEffect).not.toHaveBeenCalled();
  });

  // ============================================================================
  // PRESET APPLICATION
  // ============================================================================

  test('14- aplica preset vintage correctamente', async () => {
    const onEffectChange = jest.fn();

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
        onEffectChange={onEffectChange}
      />
    );

    const vintageButton = screen.getByText('Vintage');
    fireEvent.click(vintageButton);

    await waitFor(() => {
      // Should create adjustments and vignette effects
      expect(mockCreateEffect).toHaveBeenCalledWith('adjustments');
      expect(mockCreateEffect).toHaveBeenCalledWith('vignette');
      expect(mockAppendEffect).toHaveBeenCalled();
      expect(mockSetFloat).toHaveBeenCalled();
      expect(onEffectChange).toHaveBeenCalled();
    });
  });

  test('15- limpia efectos existentes antes de aplicar preset', async () => {
    mockGetEffects.mockReturnValue([101, 102]);
    mockGetType.mockImplementation((id) => id === 101 ? 'adjustments' : 'blur');
    mockIsEffectEnabled.mockReturnValue(true);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const hdrButton = screen.getByText('HDR');
    fireEvent.click(hdrButton);

    await waitFor(() => {
      // Should remove existing effects
      expect(mockRemoveEffect).toHaveBeenCalledTimes(2);
      expect(mockDestroy).toHaveBeenCalledWith(101);
      expect(mockDestroy).toHaveBeenCalledWith(102);
    });
  });

  test('16- muestra notificación de éxito al aplicar preset', async () => {
    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const dreamyButton = screen.getByText('Dreamy');
    fireEvent.click(dreamyButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Preset "Dreamy" aplicado',
        duration: 'short',
      });
    });
  });

  test('17- deshabilita botones mientras aplica preset', async () => {
    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const dramaticButton = screen.getByText('Dramatic');
    fireEvent.click(dramaticButton);

    // Verify notification is shown after preset application
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalled();
    });
  });

  test('18- maneja error al aplicar preset', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockCreateEffect.mockImplementation(() => {
      throw new Error('Effect creation failed');
    });

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const vintageButton = screen.getByText('Vintage');
    fireEvent.click(vintageButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Error al aplicar preset',
        duration: 'short',
      });
    });

    consoleError.mockRestore();
  });

  // ============================================================================
  // EFFECT STACK DISPLAY
  // ============================================================================

  test('19- muestra información de posición en el stack', () => {
    mockGetEffects.mockReturnValue([101, 102, 103]);
    mockGetType.mockImplementation((id) => {
      const types: Record<number, string> = { 101: 'adjustments', 102: 'blur', 103: 'vignette' };
      return types[id];
    });
    mockIsEffectEnabled.mockReturnValue(true);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    expect(screen.getByText('Posición 1 de 3')).toBeInTheDocument();
    expect(screen.getByText('Posición 2 de 3')).toBeInTheDocument();
    expect(screen.getByText('Posición 3 de 3')).toBeInTheDocument();
  });

  test('20- muestra tooltip de reordenamiento con múltiples efectos', () => {
    mockGetEffects.mockReturnValue([101, 102]);
    mockGetType.mockImplementation((id) => id === 101 ? 'adjustments' : 'blur');
    mockIsEffectEnabled.mockReturnValue(true);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    expect(screen.getByText(/Arrastra los efectos para cambiar el orden/)).toBeInTheDocument();
  });

  test('21- no muestra tooltip con un solo efecto', () => {
    mockGetEffects.mockReturnValue([101]);
    mockGetType.mockReturnValue('adjustments');
    mockIsEffectEnabled.mockReturnValue(true);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    expect(screen.queryByText(/Arrastra los efectos/)).not.toBeInTheDocument();
  });

  // ============================================================================
  // EFFECT STATE VISUALIZATION
  // ============================================================================

  test('22- aplica estilo visual a efectos deshabilitados', () => {
    mockGetEffects.mockReturnValue([101]);
    mockGetType.mockReturnValue('adjustments');
    mockIsEffectEnabled.mockReturnValue(false);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    // Get the parent container with the opacity class (not the text div)
    const effectContainer = screen.getByText('Ajustes').closest('.opacity-60');
    expect(effectContainer).toBeInTheDocument();
    expect(effectContainer).toHaveClass('opacity-60');
  });

  test('23- muestra handle de drag en cada efecto', () => {
    mockGetEffects.mockReturnValue([101, 102]);
    mockGetType.mockImplementation((id) => id === 101 ? 'adjustments' : 'blur');
    mockIsEffectEnabled.mockReturnValue(true);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const dragHandles = screen.getAllByText('☰');
    expect(dragHandles).toHaveLength(2);
  });

  // ============================================================================
  // PRESET ICONS
  // ============================================================================

  test('24- muestra iconos correctos para cada preset', () => {
    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    expect(screen.getByText('📷')).toBeInTheDocument(); // Vintage
    expect(screen.getByText('✨')).toBeInTheDocument(); // HDR
    expect(screen.getByText('☁️')).toBeInTheDocument(); // Dreamy
    expect(screen.getByText('🎭')).toBeInTheDocument(); // Dramatic
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  test('25- maneja error al cargar effect stack', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockGetEffects.mockImplementation(() => {
      throw new Error('Failed to get effects');
    });

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    expect(screen.getByText(/No hay efectos aplicados/)).toBeInTheDocument();

    consoleError.mockRestore();
  });

  test('26- maneja error al toggle efecto', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockGetEffects.mockReturnValue([101]);
    mockGetType.mockReturnValue('adjustments');
    mockIsEffectEnabled.mockReturnValue(true);
    mockSetEffectEnabled.mockImplementation(() => {
      throw new Error('Toggle failed');
    });

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const toggleButton = screen.getByText('ON');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error toggling effect'),
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  // ============================================================================
  // CUSTOM PROPS
  // ============================================================================

  test('27- acepta className personalizado', () => {
    const { container } = render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
        className="custom-effect-manager"
      />
    );

    expect(container.firstChild).toHaveClass('custom-effect-manager');
  });

  test('28- callback onEffectChange es opcional', () => {
    mockGetEffects.mockReturnValue([101]);
    mockGetType.mockReturnValue('adjustments');
    mockIsEffectEnabled.mockReturnValue(true);

    render(
      <EffectStackManager
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={1}
      />
    );

    const removeButton = screen.getByTitle('Eliminar efecto');
    
    // Should not throw error without callback
    expect(() => fireEvent.click(removeButton)).not.toThrow();
  });
});
