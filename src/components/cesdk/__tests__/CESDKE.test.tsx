import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CESDKEditorWrapper } from '../CESDKEditorWrapper';

// Mock functions - defined before mocks to be accessible in both scopes
const mockDispose = jest.fn();
const mockCreateVideoScene = jest.fn();
const mockCreateDesignScene = jest.fn();
const mockAddDefaultAssetSources = jest.fn();
const mockAddDemoAssetSources = jest.fn();
const mockAddPlugin = jest.fn();
const mockRegisterAction = jest.fn();
const mockRunAction = jest.fn();
const mockSubscribe = jest.fn().mockReturnValue(jest.fn()); // Return unsubscribe function
const mockOnHistoryUpdated = jest.fn().mockReturnValue(jest.fn()); // Return unsubscribe function
const mockShowNotification = jest.fn().mockReturnValue('notification-id-123');
const mockUpdateNotification = jest.fn();
const mockExportUtils = jest.fn();
const mockGetScene = jest.fn().mockReturnValue(1);
const mockFindByType = jest.fn().mockReturnValue([1]);
const mockGetWidth = jest.fn().mockReturnValue(1920);
const mockGetHeight = jest.fn().mockReturnValue(1080);
const mockAddVideo = jest.fn().mockResolvedValue(10);
const mockAddImage = jest.fn().mockResolvedValue(11);
const mockAppendChild = jest.fn();
const mockSetPositionX = jest.fn();
const mockSetPositionY = jest.fn();
const mockSendToBack = jest.fn();
const mockAddSource = jest.fn();
const mockAddAssetLibraryEntry = jest.fn();
const mockGetDockOrder = jest.fn().mockReturnValue([]);
const mockSetDockOrder = jest.fn();
const mockGetCanvasMenuOrder = jest.fn().mockReturnValue([]);
const mockSetCanvasMenuOrder = jest.fn();
const mockGetInspectorBar = jest.fn().mockReturnValue([]);
const mockSetInspectorBar = jest.fn();
const mockCanUndo = jest.fn().mockReturnValue(false);
const mockCanRedo = jest.fn().mockReturnValue(false);
const mockFindAll = jest.fn().mockReturnValue([]);

const mockCesdkInstance = {
  dispose: mockDispose,
  createVideoScene: mockCreateVideoScene,
  createDesignScene: mockCreateDesignScene,
  addDefaultAssetSources: mockAddDefaultAssetSources,
  addDemoAssetSources: mockAddDemoAssetSources,
  addPlugin: mockAddPlugin,
  engine: {
    scene: {
      get: mockGetScene,
      saveToString: jest.fn().mockResolvedValue('{"scene":"data"}'),
      loadFromString: jest.fn(),
    },
    block: {
      findByType: mockFindByType,
      getWidth: mockGetWidth,
      getHeight: mockGetHeight,
      addVideo: mockAddVideo,
      addImage: mockAddImage,
      appendChild: mockAppendChild,
      setPositionX: mockSetPositionX,
      setPositionY: mockSetPositionY,
      sendToBack: mockSendToBack,
      export: jest.fn().mockResolvedValue(new Blob(['mock-export'], { type: 'image/jpeg' })),
      create: jest.fn().mockReturnValue(20),
      createFill: jest.fn().mockReturnValue(30),
      setString: jest.fn(),
      setFill: jest.fn(),
      setWidth: jest.fn(),
      setHeight: jest.fn(),
      findAll: mockFindAll,
    },
    asset: {
      addSource: mockAddSource,
    },
    event: {
      subscribe: mockSubscribe,
    },
    editor: {
      onHistoryUpdated: mockOnHistoryUpdated,
      canUndo: mockCanUndo,
      canRedo: mockCanRedo,
    },
  },
  ui: {
    addAssetLibraryEntry: mockAddAssetLibraryEntry,
    getDockOrder: mockGetDockOrder,
    setDockOrder: mockSetDockOrder,
    getCanvasMenuOrder: mockGetCanvasMenuOrder,
    setCanvasMenuOrder: mockSetCanvasMenuOrder,
    getInspectorBar: mockGetInspectorBar,
    setInspectorBar: mockSetInspectorBar,
    showNotification: mockShowNotification,
    updateNotification: mockUpdateNotification,
  },
  actions: {
    register: mockRegisterAction,
    run: mockRunAction,
  },
  utils: {
    export: mockExportUtils,
  },
};

// Mock CE.SDK module - use virtual module to avoid lookup errors
const mockCreate = jest.fn();
const mockSupportsVideo = jest.fn();

jest.mock('@cesdk/cesdk-js', () => ({
  __esModule: true,
  default: {
    create: (...args: any[]) => mockCreate(...args),
  },
  supportsVideo: () => mockSupportsVideo(),
}), { virtual: true });

jest.mock('@imgly/plugin-background-removal-web', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ name: 'BackgroundRemoval' }),
}), { virtual: true });

jest.mock('@/config/cesdk/ThemeConfigYAAN', () => ({
  applyYaanTheme: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/cesdk/yaan-asset-source', () => ({
  createYaanAssetSource: jest.fn().mockReturnValue({
    id: 'yaan-travel-stickers',
    findAssets: jest.fn(),
  }),
}));

jest.mock('@/utils/browser-detection', () => ({
  detectBrowser: jest.fn().mockReturnValue({
    name: 'Chrome',
    version: '120.0',
    os: 'Windows',
  }),
}));

jest.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: jest.fn().mockReturnValue({
    saveNow: jest.fn(),
    hasUnsavedChanges: false,
    lastSaved: null,
    isSaving: false,
    clearDrafts: jest.fn(),
    loadDraft: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('@/hooks/useVideoTranscode', () => ({
  useVideoTranscode: jest.fn().mockReturnValue({
    transcode: jest.fn(),
    isTranscoding: false,
    error: null,
    clearError: jest.fn(),
  }),
}));

// Mock subcomponents
jest.mock('@/components/cesdk/EyeDropperButton', () => ({
  EyeDropperButton: () => <div data-testid="eye-dropper-button">Eye Dropper</div>,
}));

jest.mock('@/components/cesdk/ExportFormatSelector', () => ({
  ExportFormatSelector: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="export-format-modal">Export Format Selector</div> : null,
}));

jest.mock('@/components/cesdk/RecoveryDialog', () => ({
  RecoveryDialog: ({ isOpen, onRecover, onDiscard }: any) =>
    isOpen ? (
      <div data-testid="recovery-dialog">
        <button onClick={onRecover}>Recover</button>
        <button onClick={onDiscard}>Discard</button>
      </div>
    ) : null,
}));

jest.mock('@/components/cesdk/TimelineGroupPanel', () => ({
  TimelineGroupPanel: () => <div data-testid="timeline-panel">Timeline Panel</div>,
}));

jest.mock('@/components/cesdk/UndoRedoControls', () => ({
  UndoRedoControls: () => <div data-testid="undo-redo-controls">Undo/Redo</div>,
}));

// Get mock references after modules are mocked
const { applyYaanTheme: mockApplyYaanTheme } = jest.requireMock('@/config/cesdk/ThemeConfigYAAN');

describe('CESDKEditorWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockCreate.mockResolvedValue(mockCesdkInstance);
    mockApplyYaanTheme.mockResolvedValue(undefined);
    mockAddDefaultAssetSources.mockResolvedValue(undefined);
    mockAddDemoAssetSources.mockResolvedValue(undefined);
    mockCreateVideoScene.mockResolvedValue(undefined);
    mockCreateDesignScene.mockResolvedValue(undefined);
    mockAddPlugin.mockResolvedValue(undefined);
    mockAddSource.mockResolvedValue(undefined);
    mockExportUtils.mockResolvedValue({
      blobs: [new Blob(['test-export'], { type: 'image/jpeg' })],
    });

    // Setup supportsVideo default
    mockSupportsVideo.mockReturnValue(true);

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  test('1- renderiza loading state durante inicialización', () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Cargando editor...')).toBeInTheDocument();
  });

  test('2- inicializa CE.SDK con configuración correcta para imagen', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          userId: 'user-123',
          baseURL: '/cesdk-assets/',
          role: 'Creator',
        })
      );
    });

    expect(mockCreateDesignScene).toHaveBeenCalled();
    expect(mockCreateVideoScene).not.toHaveBeenCalled();
  });

  test('3- inicializa CE.SDK con configuración correcta para video', async () => {
    mockSupportsVideo.mockReturnValue(true);

    render(
      <CESDKEditorWrapper
        userId="user-456"
        mediaType="video"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(mockCreateVideoScene).toHaveBeenCalled();
      expect(mockCreateDesignScene).not.toHaveBeenCalled();
    });
  });

  test('4- aplica tema YAAN después de inicialización', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockApplyYaanTheme).toHaveBeenCalledWith(mockCesdkInstance);
    });
  });

  test('5- carga asset sources de forma progresiva', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockAddDefaultAssetSources).toHaveBeenCalledWith({
        baseURL: 'https://cdn.img.ly/assets/v4',
      });

      expect(mockAddDemoAssetSources).toHaveBeenCalledWith({
        sceneMode: 'Design',
        withUploadAssetSources: true,
        baseURL: 'https://cdn.img.ly/assets/demo/v1',
      });
    });
  });

  test('6- registra asset source personalizado de YAAN', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockAddSource).toHaveBeenCalled();
      expect(mockAddAssetLibraryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'yaan-stickers-entry',
          sourceIds: ['yaan-travel-stickers'],
        })
      );
    });
  });

  test('7- registra plugin de Background Removal', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockAddPlugin).toHaveBeenCalled();
      expect(mockSetCanvasMenuOrder).toHaveBeenCalled();
      expect(mockSetInspectorBar).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // INITIAL MEDIA LOADING
  // ============================================================================

  test('8- carga media inicial de imagen correctamente', async () => {
    const imageUrl = 'https://example.com/image.jpg';

    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        initialMediaUrl={imageUrl}
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockAddImage).toHaveBeenCalledWith(imageUrl, {
        size: { width: 1920, height: 1080 },
      });
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockSendToBack).toHaveBeenCalled();
    });
  });

  test('9- carga media inicial de video correctamente', async () => {
    const videoUrl = 'https://example.com/video.mp4';

    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="video"
        initialMediaUrl={videoUrl}
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockAddVideo).toHaveBeenCalledWith(
        videoUrl,
        1920,
        1080,
        expect.objectContaining({
          sizeMode: 'Absolute',
          positionMode: 'Absolute',
        })
      );
    });
  });

  test('10- maneja error cuando no hay escena activa para cargar media', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockGetScene.mockReturnValueOnce(null);

    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        initialMediaUrl="https://example.com/image.jpg"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('No active scene found')
      );
    });

    consoleError.mockRestore();
  });

  // ============================================================================
  // ACTIONS API
  // ============================================================================

  test('11- registra acción de exportación', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockRegisterAction).toHaveBeenCalledWith('ly.img.export', expect.any(Function));
    });
  });

  test('12- registra acción de guardado', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockRegisterAction).toHaveBeenCalledWith('ly.img.save', expect.any(Function));
    });
  });

  test('13- registra acciones adicionales (saveScene, shareScene, etc)', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockRegisterAction).toHaveBeenCalledWith('saveScene', expect.any(Function));
      expect(mockRegisterAction).toHaveBeenCalledWith('shareScene', expect.any(Function));
      expect(mockRegisterAction).toHaveBeenCalledWith('importScene', expect.any(Function));
      expect(mockRegisterAction).toHaveBeenCalledWith('exportScene', expect.any(Function));
      expect(mockRegisterAction).toHaveBeenCalledWith('uploadFile', expect.any(Function));
    });
  });

  test('14- ejecuta acción de exportación al hacer click en botón', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Guardar y continuar →')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Guardar y continuar →');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockRunAction).toHaveBeenCalledWith('ly.img.export');
    });
  });

  // ============================================================================
  // EVENT API
  // ============================================================================

  test('15- suscribe a eventos de historial', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockOnHistoryUpdated).toHaveBeenCalled();
    });
  });

  test('16- suscribe a eventos de bloques', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith([], expect.any(Function));
    });
  });

  // ============================================================================
  // UI COMPONENTS
  // ============================================================================

  test('17- renderiza controles de undo/redo cuando está inicializado', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('undo-redo-controls')).toBeInTheDocument();
    });
  });

  test('18- renderiza eye dropper button cuando está inicializado', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('eye-dropper-button')).toBeInTheDocument();
    });
  });

  test('19- renderiza timeline panel solo en modo video', async () => {
    const { rerender } = render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="video"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('timeline-panel')).toBeInTheDocument();
    });

    // Switch to image mode
    rerender(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('timeline-panel')).not.toBeInTheDocument();
    });
  });

  test('20- renderiza botones de acción (Cancelar y Guardar)', async () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Guardar y continuar →')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // RECOVERY DIALOG
  // ============================================================================

  test('21- muestra recovery dialog cuando hay draft en localStorage', async () => {
    // Mock draft in localStorage
    const draftKey = 'moment-draft-user-123-latest';
    const timestamp = new Date(Date.now() - 1000 * 60 * 30).toISOString(); // 30 minutes ago

    localStorage.setItem(draftKey, '{"scene":"draft-data"}');
    localStorage.setItem(`${draftKey}-timestamp`, timestamp);
    localStorage.setItem(`${draftKey}-savedBy`, 'auto-save');
    localStorage.setItem(`${draftKey}-hash`, 'abc123');
    localStorage.setItem(`${draftKey}-size`, '1024');

    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('recovery-dialog')).toBeInTheDocument();
    });
  });

  test('22- no muestra recovery dialog si draft es muy antiguo', async () => {
    // Mock old draft (25 hours ago)
    const draftKey = 'moment-draft-user-123-latest';
    const timestamp = new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString();

    localStorage.setItem(draftKey, '{"scene":"old-draft"}');
    localStorage.setItem(`${draftKey}-timestamp`, timestamp);

    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('recovery-dialog')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  test('23- muestra error cuando falla inicialización', async () => {
    mockCreate.mockRejectedValueOnce(new Error('CE.SDK initialization failed'));

    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error al cargar el editor')).toBeInTheDocument();
      expect(screen.getByText(/CE.SDK initialization failed/)).toBeInTheDocument();
    });
  });

  test('24- muestra error cuando video no está soportado', async () => {
    mockSupportsVideo.mockReturnValue(false);

    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="video"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Edición de video no disponible/)).toBeInTheDocument();
    });
  });

  test('25- botón de cerrar funciona en pantalla de error', async () => {
    const onClose = jest.fn();
    mockCreate.mockRejectedValueOnce(new Error('Test error'));

    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cerrar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cerrar'));
    expect(onClose).toHaveBeenCalled();
  });

  // ============================================================================
  // CLEANUP
  // ============================================================================

  test('26- limpia instancia de CE.SDK al desmontar', async () => {
    const { unmount } = render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    unmount();

    await waitFor(() => {
      expect(mockDispose).toHaveBeenCalled();
    });
  });

  test('27- limpia suscripciones de eventos al desmontar', async () => {
    const unsubscribe = jest.fn();
    mockSubscribe.mockReturnValue(unsubscribe);
    mockOnHistoryUpdated.mockReturnValue(unsubscribe);

    const { unmount } = render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });

    unmount();

    await waitFor(() => {
      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // DEVICE OPTIMIZATION
  // ============================================================================

  test('28- ajusta maxImageSize para dispositivos móviles', async () => {
    // Mock mobile user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    });

    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          editor: {
            maxImageSize: 2048, // Mobile limit
          },
        })
      );
    });
  });

  test('29- usa maxImageSize mayor para desktop', async () => {
    // Mock desktop user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    });

    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          editor: {
            maxImageSize: 4096, // Desktop limit
          },
        })
      );
    });
  });

  // ============================================================================
  // CUSTOM PROPS
  // ============================================================================

  test('30- acepta className personalizado', () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
        className="custom-editor-class"
      />
    );

    const container = document.querySelector('.custom-editor-class');
    expect(container).toBeInTheDocument();
  });

  test('31- muestra loading overlay cuando loading prop es true', () => {
    render(
      <CESDKEditorWrapper
        userId="user-123"
        mediaType="image"
        onExport={jest.fn()}
        onClose={jest.fn()}
        loading={true}
      />
    );

    expect(screen.getByText('Cargando editor...')).toBeInTheDocument();
  });
});
