import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrandedFiltersPanel, YaanFilterPresets } from '../BrandedFiltersPanel';

// Mock subcomponents
jest.mock('../EffectStackManager', () => ({
  EffectStackManager: ({ onEffectChange }: any) => (
    <div data-testid="effect-stack-manager">
      <button onClick={onEffectChange}>Trigger Effect Change</button>
    </div>
  ),
}));

jest.mock('../MomentTemplateLibrary', () => ({
  MomentTemplateLibrary: ({ onTemplateApply, onClose }: any) => (
    <div data-testid="moment-template-library">
      <button onClick={() => onTemplateApply({ id: 'test', name: 'Test Template', variables: [] })}>
        Apply Template
      </button>
      <button onClick={onClose}>Close Library</button>
    </div>
  ),
}));

jest.mock('../TemplateVariableEditor', () => ({
  TemplateVariableEditor: ({ onSave, onCancel }: any) => (
    <div data-testid="template-variable-editor">
      <button onClick={() => onSave({ var1: 'value1' })}>Save Variables</button>
      <button onClick={onCancel}>Cancel Editor</button>
    </div>
  ),
}));

// Mock CE.SDK functions
const mockCreateEffect = jest.fn();
const mockAppendChild = jest.fn();
const mockSetFloat = jest.fn();
const mockIsValid = jest.fn();
const mockDestroy = jest.fn();

const mockCesdkInstance = {
  engine: {
    block: {
      createEffect: mockCreateEffect,
      appendChild: mockAppendChild,
      setFloat: mockSetFloat,
      isValid: mockIsValid,
      destroy: mockDestroy,
    },
  },
};

describe('BrandedFiltersPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateEffect.mockReturnValue('effect-123');
    mockIsValid.mockReturnValue(true);
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  test('1- muestra mensaje cuando no hay bloque seleccionado', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId={null}
      />
    );

    expect(screen.getByText(/Selecciona una imagen o video/)).toBeInTheDocument();
  });

  test('2- renderiza header con título y botón reset', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    expect(screen.getByText('Filtros y Ajustes YAAN')).toBeInTheDocument();
    expect(screen.getByText('Resetear')).toBeInTheDocument();
  });

  test('3- renderiza tabs de navegación (Filtros, Efectos, Templates)', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    expect(screen.getByText('🎨 Filtros')).toBeInTheDocument();
    expect(screen.getByText('✨ Efectos')).toBeInTheDocument();
    expect(screen.getByText('📋 Templates')).toBeInTheDocument();
  });

  test('4- tab Filtros está activo por defecto', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    const filtrosTab = screen.getByText('🎨 Filtros');
    expect(filtrosTab).toHaveClass('text-pink-600');
  });

  test('5- renderiza presets de filtros YAAN', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    expect(screen.getByText('Filtros YAAN')).toBeInTheDocument();
    expect(screen.getByText('Vibrante')).toBeInTheDocument();
    expect(screen.getByText('Soñador')).toBeInTheDocument();
    expect(screen.getByText('Atardecer')).toBeInTheDocument();
    expect(screen.getByText('Vintage')).toBeInTheDocument();
    expect(screen.getByText('Dramático')).toBeInTheDocument();
    expect(screen.getByText('Fresco')).toBeInTheDocument();
  });

  test('6- renderiza sliders de ajustes manuales', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    expect(screen.getByText('Ajustes Manuales')).toBeInTheDocument();
    expect(screen.getByText('Brillo')).toBeInTheDocument();
    expect(screen.getByText('Contraste')).toBeInTheDocument();
    expect(screen.getByText('Saturación')).toBeInTheDocument();
    expect(screen.getByText('Exposición')).toBeInTheDocument();
    expect(screen.getByText('Temperatura')).toBeInTheDocument();
    expect(screen.getByText('Luces')).toBeInTheDocument();
    expect(screen.getByText('Sombras')).toBeInTheDocument();
    expect(screen.getByText('Claridad')).toBeInTheDocument();
  });

  // ============================================================================
  // TAB SWITCHING
  // ============================================================================

  test('7- cambia a tab Efectos al hacer click', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('✨ Efectos'));

    expect(screen.getByTestId('effect-stack-manager')).toBeInTheDocument();
    expect(screen.queryByText('Filtros YAAN')).not.toBeInTheDocument();
  });

  test('8- cambia a tab Templates al hacer click', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('📋 Templates'));

    expect(screen.getByTestId('moment-template-library')).toBeInTheDocument();
    expect(screen.queryByText('Filtros YAAN')).not.toBeInTheDocument();
  });

  test('9- activa visualmente el tab seleccionado', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    const efectosTab = screen.getByText('✨ Efectos');
    fireEvent.click(efectosTab);

    expect(efectosTab).toHaveClass('text-purple-600');
  });

  // ============================================================================
  // PRESET APPLICATION
  // ============================================================================

  test('10- aplica preset al hacer click', async () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    const vibranteButton = screen.getByText('Vibrante');
    fireEvent.click(vibranteButton);

    await waitFor(() => {
      expect(mockCreateEffect).toHaveBeenCalledWith('adjustments');
      expect(mockAppendChild).toHaveBeenCalledWith('block-1', 'effect-123');
      expect(mockSetFloat).toHaveBeenCalled();
    });
  });

  test('11- resalta preset activo visualmente', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    const sunsetButton = screen.getByText('Atardecer').closest('button');
    fireEvent.click(sunsetButton!);

    expect(sunsetButton).toHaveClass('border-pink-500');
  });

  test('12- muestra indicador de preset aplicado', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('Vintage'));

    expect(screen.getByText(/Filtro aplicado: Vintage/)).toBeInTheDocument();
  });

  test('13- callback onAdjustmentChange se ejecuta al aplicar preset', async () => {
    const onAdjustmentChange = jest.fn();

    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
        onAdjustmentChange={onAdjustmentChange}
      />
    );

    fireEvent.click(screen.getByText('Dramático'));

    await waitFor(() => {
      expect(onAdjustmentChange).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // MANUAL ADJUSTMENTS
  // ============================================================================

  test('14- ajusta brillo con slider', async () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    const brightnessSlider = screen.getAllByRole('slider')[0]; // Brillo es el primero
    fireEvent.change(brightnessSlider, { target: { value: '0.5' } });

    await waitFor(() => {
      expect(mockSetFloat).toHaveBeenCalledWith(
        'effect-123',
        'effect/adjustments/brightness',
        0.5
      );
    });
  });

  test('15- muestra valor numérico del slider', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    // All sliders start at 0.00
    const valueDisplays = screen.getAllByText('0.00');
    expect(valueDisplays.length).toBeGreaterThan(0);
  });

  test('16- limpia preset activo al hacer ajuste manual', async () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    // Apply preset first
    fireEvent.click(screen.getByText('Vibrante'));
    expect(screen.getByText(/Filtro aplicado: Vibrante/)).toBeInTheDocument();

    // Manual adjustment
    const contrastSlider = screen.getAllByRole('slider')[1]; // Contraste
    fireEvent.change(contrastSlider, { target: { value: '0.3' } });

    await waitFor(() => {
      expect(screen.queryByText(/Filtro aplicado:/)).not.toBeInTheDocument();
    });
  });

  test('17- ajusta múltiples parámetros correctamente', async () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    const sliders = screen.getAllByRole('slider');

    // Brightness
    fireEvent.change(sliders[0], { target: { value: '0.2' } });
    // Contrast
    fireEvent.change(sliders[1], { target: { value: '0.3' } });
    // Saturation
    fireEvent.change(sliders[2], { target: { value: '0.1' } });

    await waitFor(() => {
      expect(mockSetFloat).toHaveBeenCalledWith(
        expect.any(String),
        'effect/adjustments/brightness',
        0.2
      );
      expect(mockSetFloat).toHaveBeenCalledWith(
        expect.any(String),
        'effect/adjustments/contrast',
        0.3
      );
      expect(mockSetFloat).toHaveBeenCalledWith(
        expect.any(String),
        'effect/adjustments/saturation',
        0.1
      );
    });
  });

  // ============================================================================
  // RESET FUNCTIONALITY
  // ============================================================================

  test('18- resetea ajustes al hacer click en Resetear', async () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    // Apply preset
    fireEvent.click(screen.getByText('Soñador'));

    // Reset
    fireEvent.click(screen.getByText('Resetear'));

    await waitFor(() => {
      expect(mockDestroy).toHaveBeenCalled();
    });

    // Preset indicator should disappear
    expect(screen.queryByText(/Filtro aplicado:/)).not.toBeInTheDocument();
  });

  test('19- destruye efecto al resetear', async () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    // Create effect by applying preset
    fireEvent.click(screen.getByText('Fresco'));

    await waitFor(() => {
      expect(mockCreateEffect).toHaveBeenCalled();
    });

    // Reset
    fireEvent.click(screen.getByText('Resetear'));

    await waitFor(() => {
      expect(mockDestroy).toHaveBeenCalledWith('effect-123');
    });
  });

  test('20- callback onAdjustmentChange se ejecuta al resetear', async () => {
    const onAdjustmentChange = jest.fn();

    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
        onAdjustmentChange={onAdjustmentChange}
      />
    );

    fireEvent.click(screen.getByText('Resetear'));

    await waitFor(() => {
      expect(onAdjustmentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          brightness: 0,
          contrast: 0,
          saturation: 0,
        })
      );
    });
  });

  // ============================================================================
  // MEMORY MANAGEMENT
  // ============================================================================

  test('21- limpia efecto cuando cambia selectedBlockId', () => {
    const { rerender } = render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    // Apply preset to create effect
    fireEvent.click(screen.getByText('Vibrante'));

    // Change selected block
    rerender(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-2"
      />
    );

    expect(mockDestroy).toHaveBeenCalled();
  });

  test('22- resetea ajustes cuando cambia selectedBlockId', () => {
    const { rerender } = render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    // Apply preset
    fireEvent.click(screen.getByText('Atardecer'));
    expect(screen.getByText(/Filtro aplicado: Atardecer/)).toBeInTheDocument();

    // Change block
    rerender(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-2"
      />
    );

    // Preset should be cleared
    expect(screen.queryByText(/Filtro aplicado:/)).not.toBeInTheDocument();
  });

  test('23- no intenta destruir efecto inválido', () => {
    mockIsValid.mockReturnValue(false);

    const { rerender } = render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('Vintage'));

    rerender(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-2"
      />
    );

    expect(mockDestroy).not.toHaveBeenCalled();
  });

  // ============================================================================
  // EFFECT STACK MANAGER INTEGRATION
  // ============================================================================

  test('24- renderiza EffectStackManager en tab Efectos', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('✨ Efectos'));

    expect(screen.getByTestId('effect-stack-manager')).toBeInTheDocument();
  });

  test('25- pasa props correctamente a EffectStackManager', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('✨ Efectos'));

    // Trigger the callback
    fireEvent.click(screen.getByText('Trigger Effect Change'));

    // Should not throw - callback is properly connected
    expect(screen.getByTestId('effect-stack-manager')).toBeInTheDocument();
  });

  // ============================================================================
  // TEMPLATE LIBRARY INTEGRATION
  // ============================================================================

  test('26- renderiza MomentTemplateLibrary en tab Templates', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('📋 Templates'));

    expect(screen.getByTestId('moment-template-library')).toBeInTheDocument();
  });

  test('27- muestra TemplateVariableEditor al aplicar template', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('📋 Templates'));
    fireEvent.click(screen.getByText('Apply Template'));

    expect(screen.getByTestId('template-variable-editor')).toBeInTheDocument();
  });

  test('28- cierra TemplateVariableEditor al guardar', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('📋 Templates'));
    fireEvent.click(screen.getByText('Apply Template'));

    expect(screen.getByTestId('template-variable-editor')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save Variables'));

    expect(screen.queryByTestId('template-variable-editor')).not.toBeInTheDocument();
  });

  test('29- cierra TemplateVariableEditor al cancelar', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('📋 Templates'));
    fireEvent.click(screen.getByText('Apply Template'));
    fireEvent.click(screen.getByText('Cancel Editor'));

    expect(screen.queryByTestId('template-variable-editor')).not.toBeInTheDocument();
  });

  test('30- vuelve a tab Filtros al cerrar template library', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('📋 Templates'));
    fireEvent.click(screen.getByText('Close Library'));

    // Should be back on Filtros tab
    expect(screen.getByText('Filtros YAAN')).toBeInTheDocument();
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  test('31- maneja error al crear efecto', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockCreateEffect.mockImplementation(() => {
      throw new Error('Effect creation failed');
    });

    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('Vibrante'));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  test('32- maneja error al destruir efecto', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockDestroy.mockImplementation(() => {
      throw new Error('Destroy failed');
    });

    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    fireEvent.click(screen.getByText('Soñador'));
    fireEvent.click(screen.getByText('Resetear'));

    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  // ============================================================================
  // PRESET DATA VALIDATION
  // ============================================================================

  test('33- YaanFilterPresets contiene presets válidos', () => {
    expect(YaanFilterPresets.length).toBeGreaterThan(0);

    YaanFilterPresets.forEach(preset => {
      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('description');
      expect(preset).toHaveProperty('icon');
      expect(preset).toHaveProperty('adjustments');
      expect(typeof preset.adjustments).toBe('object');
    });
  });

  // ============================================================================
  // CUSTOM PROPS
  // ============================================================================

  test('34- acepta className personalizado', () => {
    const { container } = render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
        className="custom-filters-panel"
      />
    );

    expect(container.firstChild).toHaveClass('custom-filters-panel');
  });

  test('35- callback onAdjustmentChange es opcional', () => {
    render(
      <BrandedFiltersPanel
        cesdkInstance={mockCesdkInstance as any}
        selectedBlockId="block-1"
      />
    );

    // Should not throw without callback
    expect(() => fireEvent.click(screen.getByText('Vintage'))).not.toThrow();
  });
});
