import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock aws-amplify fetchAuthSession
jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn(async () => ({ tokens: { idToken: { toString: () => 'fake-id-token' } } }))
}));

// Mock auth helper
jest.mock('@aws/amazon-location-utilities-auth-helper', () => ({
  withIdentityPoolId: jest.fn(async () => ({ 
    getMapAuthenticationOptions: () => ({ transformRequest: jest.fn() }) 
  }))
}));

// Mock maplibre-gl 
jest.mock('maplibre-gl', () => {
  class MockMap {
    static instances: any[] = [];
    opts: any;
    _handlers: Record<string, Function[]> = {};
    _controls: any[] = [];
    _sources: Record<string, any> = {};
    _layers: any[] = [];
    _removed: boolean = false;

    constructor(opts: any) {
      this.opts = opts;
      MockMap.instances.push(this);
    }
    
    on(event: string, cb: Function) { 
      if (!this._handlers[event]) this._handlers[event] = [];
      this._handlers[event].push(cb);
    }
    
    trigger(event: string, data?: any) { 
      if (this._handlers[event]) {
        this._handlers[event].forEach(cb => cb(data));
      }
    }
    
    addControl(control: any, position?: string) { 
      this._controls.push({ control, position }); 
    }
    
    addSource(name: string, config: any) { 
      this._sources[name] = config;
    }
    
    addLayer(layer: any, before?: string) { 
      this._layers.push({ layer, before });
    }
    
    getSource(name: string) { 
      return this._sources[name] ? {
        setData: jest.fn()
      } : undefined;
    }
    
    fitBounds(bounds: any, options?: any) { 
      this.opts.fitBoundsCalled = true;
    }
    
    remove() { 
      this._removed = true;
      const idx = MockMap.instances.indexOf(this);
      if (idx > -1) MockMap.instances.splice(idx, 1);
    }
    
    flyTo(opts: any) { 
      this.opts.lastFlyTo = opts;
    }
  }

  class MockNavigationControl {}
  class MockScaleControl { 
    constructor(public opts?: any) {} 
  }
  
  class MockPopup { 
    _html: string = '';
    constructor(public opts?: any) {} 
    setHTML(html: string) { 
      this._html = html; 
      return this; 
    } 
  }
  
  class MockMarker { 
    _lngLat: [number, number] | null = null;
    _popup: any = null;
    _addedTo: any = null;
    
    constructor(public opts?: any) {} 
    
    setLngLat(lngLat: [number, number]) { 
      this._lngLat = lngLat;
      return this; 
    } 
    
    setPopup(popup: any) { 
      this._popup = popup;
      return this; 
    } 
    
    addTo(map: any) { 
      this._addedTo = map;
      return this; 
    } 
    
    togglePopup() { 
      return this; 
    } 
  }
  
  class MockLngLatBounds { 
    _pts: [number, number][] = [];
    extend(pt: [number, number]) { 
      this._pts.push(pt); 
    } 
  }

  return {
    Map: MockMap,
    NavigationControl: MockNavigationControl,
    ScaleControl: MockScaleControl,
    Popup: MockPopup,
    Marker: MockMarker,
    LngLatBounds: MockLngLatBounds
  };
});

const realFetch = global.fetch;

import { CognitoLocationMap } from '../../maps/CognitoLocationMap';

describe('CognitoLocationMap', () => {
  beforeEach(() => {
    const maplibre = require('maplibre-gl');
    if (maplibre && maplibre.Map && Array.isArray(maplibre.Map.instances)) {
      maplibre.Map.instances.length = 0;
    }
    global.fetch = realFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  test('1- muestra un error cuando no hay coordenadas de destino válidas', async () => {
    render(<CognitoLocationMap destinations={[{ place: 'NoCoords' } as any]} productType="package" productName="P" />);

    await waitFor(() => expect(screen.getByText(/No hay destinos con coordenadas válidas/i)).toBeInTheDocument());
  });

  test('2- inicializa el mapa y oculta la carga después de cargar', async () => {
    const destinations = [{ place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } }];

    render(<CognitoLocationMap destinations={destinations as any} productType="package" productName="P" />);

    const maplibre = require('maplibre-gl');
    await waitFor(() => expect(maplibre.Map.instances.length).toBeGreaterThan(0));
    
    expect(screen.getByText(/Cargando mapa interactivo/i)).toBeInTheDocument();

    const instance = maplibre.Map.instances[0];
    instance.trigger('load');

    await waitFor(() => expect(screen.queryByText(/Cargando mapa interactivo/i)).not.toBeInTheDocument());
  });

  test('3- dibujo de ruta de reserva en API 400 establece mensaje de advertencia', async () => {
    const destinations = [
      { place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } },
      { place: 'B', coordinates: { latitude: -13.0, longitude: -76.0 } }
    ];

    global.fetch = jest.fn(async () => ({ 
      status: 400, 
      json: async () => ({ message: 'too long' }) 
    } as any));

    render(<CognitoLocationMap destinations={destinations as any} productType="circuit" productName="P" />);

    const maplibre = require('maplibre-gl');
    await waitFor(() => expect(maplibre.Map.instances.length).toBeGreaterThan(0));
    const instance = maplibre.Map.instances[0];
    instance.trigger('load');

    await waitFor(() => expect(screen.getByText(/Ruta aproximada con líneas rectas/i)).toBeInTheDocument());
  });

  test('4- calcula centro y zoom inicial correctos para múltiples destinos', async () => {
    const destinations = [
      { place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } },
      { place: 'B', coordinates: { latitude: -13.0, longitude: -76.0 } }
    ];

    render(<CognitoLocationMap destinations={destinations as any} productType="circuit" productName="P" />);

    const maplibre = require('maplibre-gl');
    await waitFor(() => expect(maplibre.Map.instances.length).toBeGreaterThan(0));
    const instance = maplibre.Map.instances[0];

    // lng = (-77 + -76)/2 = -76.5, lat = (-12 + -13)/2 = -12.5
    expect(instance.opts.center).toEqual([-76.5, -12.5]);
    expect(instance.opts.zoom).toBe(9);
  });

  test('5- al hacer click en un destino llama a flyTo y selecciona destino', async () => {
    const destinations = [
      { place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } },
      { place: 'B', coordinates: { latitude: -13.0, longitude: -76.0 } }
    ];

    render(<CognitoLocationMap destinations={destinations as any} productType="circuit" productName="P" />);

    const maplibre = require('maplibre-gl');
    await waitFor(() => expect(maplibre.Map.instances.length).toBeGreaterThan(0));
    const instance = maplibre.Map.instances[0];
    instance.trigger('load');
    const heading = screen.getByText('A');
    const button = heading.closest('button');
    expect(button).toBeTruthy();

    fireEvent.click(button!);
    expect(instance.opts.lastFlyTo).toBeDefined();
    expect(instance.opts.lastFlyTo.center).toEqual([-77.0, -12.0]);
    expect(button).toHaveClass('bg-purple-50');
  });

  test('6- muestra error cuando fetchAuthSession falla', async () => {
    const authModule = require('aws-amplify/auth');
    authModule.fetchAuthSession.mockRejectedValueOnce(new Error('Auth failed'));

    const destinations = [{ place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } }];

    render(<CognitoLocationMap destinations={destinations as any} productType="package" productName="P" />);

    await waitFor(() => expect(screen.getByText(/Auth failed/i)).toBeInTheDocument());
  });

  test('7- maneja error 500 de API con fallback a líneas rectas', async () => {
    const destinations = [
      { place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } },
      { place: 'B', coordinates: { latitude: -13.0, longitude: -76.0 } }
    ];

    global.fetch = jest.fn(async () => ({ 
      status: 500, 
      ok: false,
      text: async () => 'Internal Server Error'
    } as any));

    render(<CognitoLocationMap destinations={destinations as any} productType="circuit" productName="P" />);

    const maplibre = require('maplibre-gl');
    await waitFor(() => expect(maplibre.Map.instances.length).toBeGreaterThan(0));
    const instance = maplibre.Map.instances[0];
    instance.trigger('load');

    await waitFor(() => expect(screen.getByText(/Ruta aproximada con líneas rectas/i)).toBeInTheDocument());
  });

  test('8- renderiza ruta exitosa con datos de API', async () => {
    const destinations = [
      { place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } },
      { place: 'B', coordinates: { latitude: -13.0, longitude: -76.0 } }
    ];

    global.fetch = jest.fn(async () => ({ 
      status: 200,
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalDistance: 120.5,
          totalDuration: 7200,
          routeGeometry: [[-77.0, -12.0], [-76.5, -12.5], [-76.0, -13.0]]
        }
      })
    } as any));

    render(<CognitoLocationMap destinations={destinations as any} productType="circuit" productName="P" />);

    const maplibre = require('maplibre-gl');
    await waitFor(() => expect(maplibre.Map.instances.length).toBeGreaterThan(0));
    const instance = maplibre.Map.instances[0];
    instance.trigger('load');

    await waitFor(() => expect(instance._sources['route']).toBeDefined());
    
    await waitFor(() => {
      const legend = screen.getByText(/120.5 km/i);
      expect(legend).toBeInTheDocument();
    });
  });

  test('9- limpia el mapa al desmontar el componente', async () => {
    const destinations = [{ place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } }];

    const { unmount } = render(
      <CognitoLocationMap destinations={destinations as any} productType="package" productName="P" />
    );

    const maplibre = require('maplibre-gl');
    await waitFor(() => expect(maplibre.Map.instances.length).toBeGreaterThan(0));
    const instance = maplibre.Map.instances[0];

    unmount();

    await waitFor(() => expect(instance._removed).toBe(true));
  });

  test('10- cierra el banner de advertencia al hacer click en el botón cerrar', async () => {
    const destinations = [
      { place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } },
      { place: 'B', coordinates: { latitude: -13.0, longitude: -76.0 } }
    ];

    global.fetch = jest.fn(async () => ({ 
      status: 400, 
      json: async () => ({ message: 'too long' }) 
    } as any));

    render(<CognitoLocationMap destinations={destinations as any} productType="circuit" productName="P" />);

    const maplibre = require('maplibre-gl');
    await waitFor(() => expect(maplibre.Map.instances.length).toBeGreaterThan(0));
    const instance = maplibre.Map.instances[0];
    instance.trigger('load');

    await waitFor(() => expect(screen.getByText(/Ruta aproximada con líneas rectas/i)).toBeInTheDocument());

    const closeButton = screen.getByLabelText(/Cerrar advertencia/i);
    fireEvent.click(closeButton);

    await waitFor(() => expect(screen.queryByText(/Ruta aproximada con líneas rectas/i)).not.toBeInTheDocument());
  });

  test('11- añade controles de navegación y escala al mapa', async () => {
    const destinations = [{ place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } }];

    render(<CognitoLocationMap destinations={destinations as any} productType="package" productName="P" />);

    const maplibre = require('maplibre-gl');
    await waitFor(() => expect(maplibre.Map.instances.length).toBeGreaterThan(0));
    const instance = maplibre.Map.instances[0];

    instance.trigger('load');

    await waitFor(() => {
      const navControl = instance._controls.find(
        (c: any) => c.control instanceof maplibre.NavigationControl && c.position === 'top-right'
      );
      expect(navControl).toBeDefined();
      const scaleControl = instance._controls.find(
        (c: any) => c.control instanceof maplibre.ScaleControl && c.position === 'bottom-left'
      );
      expect(scaleControl).toBeDefined();
    });
  });

  test('12- muestra destinos en lista con información correcta', async () => {
    const destinations = [
      { 
        place: 'Lima', 
        placeSub: 'Centro Histórico',
        complementary_description: 'Capital del Perú',
        coordinates: { latitude: -12.0464, longitude: -77.0428 } 
      },
      { 
        place: 'Cusco', 
        coordinates: { latitude: -13.5319, longitude: -71.9675 } 
      }
    ];

    render(<CognitoLocationMap destinations={destinations as any} productType="circuit" productName="Tour" />);

    const maplibre = require('maplibre-gl');
    await waitFor(() => expect(maplibre.Map.instances.length).toBeGreaterThan(0));
    const instance = maplibre.Map.instances[0];
    instance.trigger('load');

    // Verify destination list shows correct info
    expect(screen.getByText('Lima')).toBeInTheDocument();
    expect(screen.getByText('Centro Histórico')).toBeInTheDocument();
    expect(screen.getByText('Capital del Perú')).toBeInTheDocument();
    expect(screen.getByText('Cusco')).toBeInTheDocument();
    
    // Verify coordinates are displayed
    expect(screen.getByText(/-12.0464, -77.0428/)).toBeInTheDocument();
    expect(screen.getByText(/-13.5319, -71.9675/)).toBeInTheDocument();
  });
});
