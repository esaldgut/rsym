import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetLibraryYAAN, YaanCuratedAssets, YaanFonts } from '../AssetLibraryYAAN';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('AssetLibraryYAAN', () => {
  let mockCesdkInstance: any;
  let mockEngine: any;
  let mockBlock: any;
  let mockScene: any;

  beforeEach(() => {
    // Mock CE.SDK engine
    mockBlock = {
      create: jest.fn().mockReturnValue('block-123'),
      createShape: jest.fn().mockReturnValue('shape-456'),
      createFill: jest.fn().mockReturnValue('fill-789'),
      setString: jest.fn(),
      setShape: jest.fn(),
      setFill: jest.fn(),
      setKind: jest.fn(),
      appendChild: jest.fn(),
      setPositionX: jest.fn(),
      setPositionY: jest.fn(),
      findAllSelected: jest.fn().mockReturnValue([]),
      getType: jest.fn(),
      setFont: jest.fn(),
    };

    mockScene = {
      get: jest.fn().mockReturnValue('scene-001'),
    };

    mockEngine = {
      block: mockBlock,
      scene: mockScene,
    };

    mockCesdkInstance = {
      engine: mockEngine,
    };

    jest.clearAllMocks();
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  test('1- renderiza correctamente con tab de stickers por defecto', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    expect(screen.getByText('Librería YAAN')).toBeInTheDocument();
    expect(screen.getByText(/Stickers, iconos y tipografía curada/)).toBeInTheDocument();
    expect(screen.getByText('🎨 Stickers')).toBeInTheDocument();
    expect(screen.getByText('🔤 Tipografía')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar assets...')).toBeInTheDocument();
  });

  test('2- muestra todas las categorías de filtro', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    const categories = [
      '🌎 Todos',
      '✈️ Viaje',
      '🏔️ Aventura',
      '🗼 Lugares',
      '🚗 Transporte',
      '🌿 Naturaleza',
      '🍕 Comida',
      '🎯 Actividades',
      '✨ Decorativo',
    ];

    categories.forEach((category) => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });

  test('3- renderiza grid de stickers con assets curados', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    // Verify some stickers are displayed
    expect(screen.getByAltText('Avión')).toBeInTheDocument();
    expect(screen.getByAltText('Cámara')).toBeInTheDocument();
    expect(screen.getByAltText('Palmera')).toBeInTheDocument();
  });

  // ============================================================================
  // TAB SWITCHING
  // ============================================================================

  test('4- cambia entre tabs de stickers y tipografía', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    // Initially on stickers tab
    expect(screen.getByAltText('Avión')).toBeInTheDocument();

    // Click on fonts tab
    fireEvent.click(screen.getByText('🔤 Tipografía'));

    // Should show fonts content
    expect(screen.getByText(/Selecciona un bloque de texto/)).toBeInTheDocument();
    expect(screen.getByText('Roboto Bold')).toBeInTheDocument();
    expect(screen.getByText('Roboto Regular')).toBeInTheDocument();
    expect(screen.getByText('Roboto Italic')).toBeInTheDocument();
  });

  test('5- activa visualmente el tab seleccionado', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    const stickersTab = screen.getByText('🎨 Stickers');
    const fontsTab = screen.getByText('🔤 Tipografía');

    // Stickers tab should be active initially
    expect(stickersTab).toHaveClass('border-pink-500');
    expect(fontsTab).toHaveClass('border-transparent');

    // Switch to fonts
    fireEvent.click(fontsTab);

    // Fonts tab should now be active
    expect(fontsTab).toHaveClass('border-pink-500');
    expect(stickersTab).toHaveClass('border-transparent');
  });

  // ============================================================================
  // SEARCH FUNCTIONALITY
  // ============================================================================

  test('6- filtra stickers por búsqueda de nombre', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    const searchInput = screen.getByPlaceholderText('Buscar assets...');

    // Search for "avión"
    fireEvent.change(searchInput, { target: { value: 'avión' } });

    // Should show only matching sticker
    expect(screen.getByAltText('Avión')).toBeInTheDocument();
    expect(screen.queryByAltText('Cámara')).not.toBeInTheDocument();
  });

  test('7- filtra stickers por búsqueda de keyword', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    const searchInput = screen.getByPlaceholderText('Buscar assets...');

    // Search by keyword "beach" (matches "Palmera")
    fireEvent.change(searchInput, { target: { value: 'beach' } });

    expect(screen.getByAltText('Palmera')).toBeInTheDocument();
  });

  test('8- muestra mensaje cuando no hay resultados de búsqueda', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    const searchInput = screen.getByPlaceholderText('Buscar assets...');

    // Search for non-existent term
    fireEvent.change(searchInput, { target: { value: 'xyzabc123' } });

    expect(screen.getByText(/No se encontraron stickers con/)).toBeInTheDocument();
  });

  // ============================================================================
  // CATEGORY FILTERING
  // ============================================================================

  test('9- filtra stickers por categoría', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    // Click on "Transporte" category
    fireEvent.click(screen.getByText('🚗 Transporte'));

    // Should show only transportation stickers
    expect(screen.getByAltText('Avión')).toBeInTheDocument();
    
    // Should not show other categories
    expect(screen.queryByAltText('Palmera')).not.toBeInTheDocument(); // nature
    expect(screen.queryByAltText('Cámara')).not.toBeInTheDocument(); // activities
  });

  test('10- resalta categoría seleccionada', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    const travelButton = screen.getByText('✈️ Viaje');

    // Click travel category
    fireEvent.click(travelButton);

    // Should have gradient background
    expect(travelButton).toHaveClass('from-pink-500', 'to-purple-600');
  });

  test('11- combina filtro de categoría y búsqueda', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    // Select "Naturaleza" category
    fireEvent.click(screen.getByText('🌿 Naturaleza'));

    // Search for "palmera"
    const searchInput = screen.getByPlaceholderText('Buscar assets...');
    fireEvent.change(searchInput, { target: { value: 'palmera' } });

    // Should show Palmera (nature category + matches search)
    expect(screen.getByAltText('Palmera')).toBeInTheDocument();

    // Should not show Sol (nature but doesn't match search)
    expect(screen.queryByAltText('Sol')).not.toBeInTheDocument();
  });

  // ============================================================================
  // STICKER ADDITION
  // ============================================================================

  test('12- agrega sticker al canvas al hacer click', async () => {
    const onAssetAdd = jest.fn();
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} onAssetAdd={onAssetAdd} />);

    // Click on first sticker (Avión)
    const stickerButton = screen.getByAltText('Avión').closest('button');
    fireEvent.click(stickerButton!);

    await waitFor(() => {
      // Verify CE.SDK calls
      expect(mockBlock.create).toHaveBeenCalledWith('//ly.img.ubq/graphic');
      expect(mockBlock.createShape).toHaveBeenCalledWith('//ly.img.ubq/shape/rect');
      expect(mockBlock.createFill).toHaveBeenCalledWith('//ly.img.ubq/fill/image');
      expect(mockBlock.setString).toHaveBeenCalledWith(
        'fill-789',
        'fill/image/imageFileURI',
        expect.stringContaining('imgly_sticker_Airplane_1.png')
      );
      expect(mockBlock.setShape).toHaveBeenCalledWith('block-123', 'shape-456');
      expect(mockBlock.setFill).toHaveBeenCalledWith('block-123', 'fill-789');
      expect(mockBlock.setKind).toHaveBeenCalledWith('block-123', 'sticker');
      expect(mockBlock.appendChild).toHaveBeenCalledWith('scene-001', 'block-123');
      expect(mockBlock.setPositionX).toHaveBeenCalledWith('block-123', 0);
      expect(mockBlock.setPositionY).toHaveBeenCalledWith('block-123', 0);

      // Verify callback
      expect(onAssetAdd).toHaveBeenCalledWith('yaan-plane-1');
    });
  });

  test('13- maneja error cuando no hay instancia de CE.SDK', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    render(<AssetLibraryYAAN cesdkInstance={null} />);

    const stickerButton = screen.getByAltText('Avión').closest('button');
    fireEvent.click(stickerButton!);

    await waitFor(() => {
      expect(consoleWarn).toHaveBeenCalledWith('[AssetLibraryYAAN] No CE.SDK instance');
    });

    consoleWarn.mockRestore();
  });

  // ============================================================================
  // FONT APPLICATION
  // ============================================================================

  test('15- aplica fuente a bloque de texto seleccionado', async () => {
    const onAssetAdd = jest.fn();

    // Mock selected text block
    mockBlock.findAllSelected.mockReturnValue(['text-block-1']);
    mockBlock.getType.mockReturnValue('//ly.img.ubq/text');

    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} onAssetAdd={onAssetAdd} />);

    // Switch to fonts tab
    fireEvent.click(screen.getByText('🔤 Tipografía'));

    // Click on Roboto Bold
    const fontButton = screen.getByText('Roboto Bold').closest('button');
    fireEvent.click(fontButton!);

    await waitFor(() => {
      expect(mockBlock.findAllSelected).toHaveBeenCalled();
      expect(mockBlock.getType).toHaveBeenCalledWith('text-block-1');
      expect(mockBlock.setFont).toHaveBeenCalledWith(
        'text-block-1',
        expect.stringContaining('Roboto-Bold.ttf'),
        expect.objectContaining({
          name: 'Roboto',
          fonts: expect.arrayContaining([
            expect.objectContaining({
              subFamily: 'Roboto Bold',
              weight: 'bold',
              style: 'normal',
            }),
          ]),
        })
      );
      expect(onAssetAdd).toHaveBeenCalledWith('roboto-bold');
    });
  });

  test('16- muestra advertencia si no hay texto seleccionado', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

    // No selected blocks
    mockBlock.findAllSelected.mockReturnValue([]);

    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    // Switch to fonts tab
    fireEvent.click(screen.getByText('🔤 Tipografía'));

    // Click on a font
    const fontButton = screen.getByText('Roboto Bold').closest('button');
    fireEvent.click(fontButton!);

    await waitFor(() => {
      expect(consoleWarn).toHaveBeenCalledWith(
        '[AssetLibraryYAAN] No hay bloques de texto seleccionados'
      );
      expect(mockBlock.setFont).not.toHaveBeenCalled();
    });

    consoleWarn.mockRestore();
  });

  test('17- aplica fuente a múltiples bloques de texto', async () => {
    // Mock multiple selected text blocks
    mockBlock.findAllSelected.mockReturnValue(['text-1', 'text-2', 'text-3']);
    mockBlock.getType.mockReturnValue('//ly.img.ubq/text');

    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    // Switch to fonts tab
    fireEvent.click(screen.getByText('🔤 Tipografía'));

    // Apply font
    const fontButton = screen.getByText('Roboto Italic').closest('button');
    fireEvent.click(fontButton!);

    await waitFor(() => {
      expect(mockBlock.setFont).toHaveBeenCalledTimes(3);
      expect(mockBlock.setFont).toHaveBeenCalledWith('text-1', expect.any(String), expect.any(Object));
      expect(mockBlock.setFont).toHaveBeenCalledWith('text-2', expect.any(String), expect.any(Object));
      expect(mockBlock.setFont).toHaveBeenCalledWith('text-3', expect.any(String), expect.any(Object));
    });
  });

  test('18- ignora bloques no-texto al aplicar fuente', async () => {
    // Mock mixed selection
    mockBlock.findAllSelected.mockReturnValue(['text-1', 'graphic-1', 'text-2']);
    mockBlock.getType.mockImplementation((id: string) => {
      if (id === 'graphic-1') return '//ly.img.ubq/graphic';
      return '//ly.img.ubq/text';
    });

    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    fireEvent.click(screen.getByText('🔤 Tipografía'));

    const fontButton = screen.getByText('Roboto Regular').closest('button');
    fireEvent.click(fontButton!);

    await waitFor(() => {
      // Should only apply to text blocks (2)
      expect(mockBlock.setFont).toHaveBeenCalledTimes(2);
      expect(mockBlock.setFont).toHaveBeenCalledWith('text-1', expect.any(String), expect.any(Object));
      expect(mockBlock.setFont).toHaveBeenCalledWith('text-2', expect.any(String), expect.any(Object));
    });
  });

  // ============================================================================
  // DATA INTEGRITY
  // ============================================================================

  test('19- YaanCuratedAssets contiene assets válidos', () => {
    expect(YaanCuratedAssets.length).toBeGreaterThan(0);

    YaanCuratedAssets.forEach((asset) => {
      expect(asset).toHaveProperty('id');
      expect(asset).toHaveProperty('name');
      expect(asset).toHaveProperty('category');
      expect(asset).toHaveProperty('type');
      expect(asset).toHaveProperty('thumbnailUrl');
      expect(asset).toHaveProperty('assetUrl');
      expect(asset).toHaveProperty('keywords');
      expect(Array.isArray(asset.keywords)).toBe(true);
    });
  });

  test('20- YaanFonts contiene fuentes válidas', () => {
    expect(YaanFonts.length).toBeGreaterThan(0);

    YaanFonts.forEach((font) => {
      expect(font).toHaveProperty('id');
      expect(font).toHaveProperty('name');
      expect(font).toHaveProperty('family');
      expect(font).toHaveProperty('weight');
      expect(font).toHaveProperty('style');
      expect(font).toHaveProperty('url');
      expect(font).toHaveProperty('preview');
      expect(font.url).toMatch(/\.ttf$/);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  test('21- maneja error al agregar sticker', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    // Force error
    mockBlock.create.mockImplementation(() => {
      throw new Error('Mock error');
    });

    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    const stickerButton = screen.getByAltText('Avión').closest('button');
    fireEvent.click(stickerButton!);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[AssetLibraryYAAN] ❌ Error agregando sticker:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  test('22- maneja error al aplicar fuente', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    mockBlock.findAllSelected.mockReturnValue(['text-1']);
    mockBlock.getType.mockReturnValue('//ly.img.ubq/text');
    mockBlock.setFont.mockImplementation(() => {
      throw new Error('Font error');
    });

    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    fireEvent.click(screen.getByText('🔤 Tipografía'));

    const fontButton = screen.getByText('Roboto Bold').closest('button');
    fireEvent.click(fontButton!);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[AssetLibraryYAAN] ❌ Error aplicando fuente:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  // ============================================================================
  // UI INTERACTIONS
  // ============================================================================

  test('23- muestra tooltip con nombre al hacer hover en sticker', () => {
    render(<AssetLibraryYAAN cesdkInstance={mockCesdkInstance} />);

    const stickerButton = screen.getByAltText('Avión').closest('button');

    // Hover should reveal name (through CSS)
    expect(stickerButton).toHaveClass('group');
  });

  test('24- acepta className personalizado', () => {
    const { container } = render(
      <AssetLibraryYAAN cesdkInstance={mockCesdkInstance} className="custom-class" />
    );

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('custom-class');
  });
});
