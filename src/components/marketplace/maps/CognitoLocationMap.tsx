'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { withIdentityPoolId } from '@aws/amazon-location-utilities-auth-helper';
import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from '../../../../amplify/outputs.json';

interface Destination {
  id?: string;
  place?: string;
  placeSub?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  complementary_description?: string;
}

interface CognitoLocationMapProps {
  destinations: Destination[];
  productType: 'circuit' | 'package';
  productName: string;
}

interface RouteData {
  distance: number;
  duration: number;
  geometry: GeoJSON.LineString;
}

/**
 * CognitoLocationMap - Interactive AWS Location Service Map with Cognito Authentication
 *
 * This component uses Amazon Cognito Identity Pool to authenticate with AWS Location Service
 * and render an interactive map using MapLibre GL JS.
 *
 * Authentication Flow:
 * 1. Fetch Cognito session (ID Token from User Pool)
 * 2. Exchange ID Token for temporary AWS credentials via Identity Pool
 * 3. Use credentials to authenticate MapLibre GL map requests
 *
 * Features:
 * - Real map tiles from AWS Location Service (YaanEsri map)
 * - Destination markers with custom styling
 * - Route calculation and rendering for circuits
 * - Interactive controls (zoom, navigation)
 */
export function CognitoLocationMap({ destinations, productType, productName }: CognitoLocationMapProps) {
  console.log('🗺️ [CognitoLocationMap] Componente renderizándose...', {
    destinationsCount: destinations.length,
    productType,
    productName
  });

  // Log raw destinations data structure
  console.log('📍 [CognitoLocationMap] Destinations raw:', JSON.stringify(destinations, null, 2));

  // Verify maplibregl import
  console.log('📦 [CognitoLocationMap] maplibregl:', {
    type: typeof maplibregl,
    hasMap: 'Map' in (maplibregl || {}),
    keys: Object.keys(maplibregl || {}).slice(0, 10)
  });

  console.log('🔧 [CognitoLocationMap] Inicializando hooks... (antes de useRef)');
  const mapContainer = useRef<HTMLDivElement>(null);
  console.log('✅ [CognitoLocationMap] mapContainer useRef inicializado');

  const map = useRef<maplibregl.Map | null>(null);
  console.log('✅ [CognitoLocationMap] map useRef inicializado');

  const [isLoading, setIsLoading] = useState(true);
  console.log('✅ [CognitoLocationMap] isLoading useState inicializado');

  const [error, setError] = useState<string | null>(null);
  console.log('✅ [CognitoLocationMap] error useState inicializado');

  const [routeData, setRouteData] = useState<RouteData | null>(null);
  console.log('✅ [CognitoLocationMap] routeData useState inicializado');

  const [selectedDestination, setSelectedDestination] = useState<number>(0);
  console.log('✅ [CognitoLocationMap] selectedDestination useState inicializado');

  console.log('🔧 [CognitoLocationMap] Todos los hooks básicos inicializados, comenzando useMemo...');

  // Filter valid destinations with coordinates (memoized to prevent re-renders)
  const validDestinations = useMemo(() => {
    try {
      console.log('🔍 [CognitoLocationMap] DENTRO de useMemo - Calculando validDestinations...');
      console.log('🔍 [CognitoLocationMap] destinations en useMemo:', destinations);

      const filtered = destinations.filter(
        d => d.coordinates?.latitude && d.coordinates?.longitude
      );

      console.log('✅ [CognitoLocationMap] validDestinations calculado:', filtered.length, 'de', destinations.length);
      return filtered;
    } catch (err) {
      console.error('❌ [CognitoLocationMap] ERROR en useMemo validDestinations:', err);
      return [];
    }
  }, [destinations]);

  console.log('✅ [CognitoLocationMap] useMemo validDestinations completado, resultado:', validDestinations.length);

  console.log('🔧 [CognitoLocationMap] Preparando segundo useMemo (initialCenter)...');

  // Calculate initial map center (average of all coordinates) - memoized
  const initialCenter = useMemo((): [number, number] => {
    try {
      console.log('🗺️ [CognitoLocationMap] DENTRO de useMemo initialCenter...');
      console.log('🗺️ [CognitoLocationMap] validDestinations.length:', validDestinations.length);

      if (validDestinations.length === 0) {
        console.log('⚠️ [CognitoLocationMap] No hay destinos válidos, usando default Mexico City');
        return [-99.1332, 19.4326]; // Mexico City default
      }

      console.log('🗺️ [CognitoLocationMap] Calculando avgLng con reduce...');
      const avgLng = validDestinations.reduce((sum, d) => {
        const lng = d.coordinates!.longitude || 0;
        console.log('  - Sumando longitude:', lng, 'sum actual:', sum);
        return sum + lng;
      }, 0) / validDestinations.length;
      console.log('✅ [CognitoLocationMap] avgLng calculado:', avgLng);

      console.log('🗺️ [CognitoLocationMap] Calculando avgLat con reduce...');
      const avgLat = validDestinations.reduce((sum, d) => {
        const lat = d.coordinates!.latitude || 0;
        console.log('  - Sumando latitude:', lat, 'sum actual:', sum);
        return sum + lat;
      }, 0) / validDestinations.length;
      console.log('✅ [CognitoLocationMap] avgLat calculado:', avgLat);

      const result: [number, number] = [avgLng, avgLat];
      console.log('✅ [CognitoLocationMap] initialCenter calculado:', result);
      return result;
    } catch (err) {
      console.error('❌ [CognitoLocationMap] ERROR en useMemo initialCenter:', err);
      return [-99.1332, 19.4326]; // Fallback to default
    }
  }, [validDestinations]);

  console.log('✅ [CognitoLocationMap] useMemo initialCenter completado, resultado:', initialCenter);

  console.log('🔧 [CognitoLocationMap] Preparando tercer useMemo (initialZoom)...');

  // Calculate initial zoom based on destination spread - memoized
  const initialZoom = useMemo((): number => {
    try {
      console.log('🔍 [CognitoLocationMap] DENTRO de useMemo initialZoom...');
      console.log('🔍 [CognitoLocationMap] validDestinations.length:', validDestinations.length);

      if (validDestinations.length <= 1) {
        console.log('⚠️ [CognitoLocationMap] Solo 1 destino o menos, usando zoom default: 10');
        return 10;
      }

      // Calculate bounding box
      console.log('🔍 [CognitoLocationMap] Mapeando longitudes...');
      const lngs = validDestinations.map(d => {
        const lng = d.coordinates!.longitude!;
        console.log('  - longitude:', lng);
        return lng;
      });
      console.log('✅ [CognitoLocationMap] Longitudes:', lngs);

      console.log('🔍 [CognitoLocationMap] Mapeando latitudes...');
      const lats = validDestinations.map(d => {
        const lat = d.coordinates!.latitude!;
        console.log('  - latitude:', lat);
        return lat;
      });
      console.log('✅ [CognitoLocationMap] Latitudes:', lats);

      console.log('🔍 [CognitoLocationMap] Calculando spans...');
      const lngSpan = Math.max(...lngs) - Math.min(...lngs);
      const latSpan = Math.max(...lats) - Math.min(...lats);
      console.log('✅ [CognitoLocationMap] lngSpan:', lngSpan, 'latSpan:', latSpan);

      const maxSpan = Math.max(lngSpan, latSpan);
      console.log('✅ [CognitoLocationMap] maxSpan:', maxSpan);

      // Approximate zoom level based on span
      let zoom = 10;
      if (maxSpan > 10) zoom = 5;
      else if (maxSpan > 5) zoom = 6;
      else if (maxSpan > 2) zoom = 7;
      else if (maxSpan > 1) zoom = 8;
      else if (maxSpan > 0.5) zoom = 9;

      console.log('✅ [CognitoLocationMap] initialZoom calculado:', zoom);
      return zoom;
    } catch (err) {
      console.error('❌ [CognitoLocationMap] ERROR en useMemo initialZoom:', err);
      return 10; // Fallback to default
    }
  }, [validDestinations]);

  console.log('✅ [CognitoLocationMap] useMemo initialZoom completado, resultado:', initialZoom);

  console.log('🔧 [CognitoLocationMap] Preparando useEffect principal...');

  // Initialize map with Cognito authentication
  useEffect(() => {
    console.log('🚀 [CognitoLocationMap] ENTRANDO a useEffect principal...');
    console.log('🚀 [CognitoLocationMap] mapContainer.current:', !!mapContainer.current);
    console.log('🚀 [CognitoLocationMap] map.current:', !!map.current);

    if (!mapContainer.current || map.current) {
      console.log('⚠️ [CognitoLocationMap] Saliendo de useEffect: mapContainer no existe o mapa ya inicializado');
      return;
    }

    console.log('✅ [CognitoLocationMap] Condiciones cumplidas, llamando initializeMap...');

    const initializeMap = async () => {
      try {
        console.log('🗺️ [CognitoLocationMap] initializeMap comenzando...');
        setIsLoading(true);
        setError(null);

        // STEP 1: Validate we have valid destinations
        if (validDestinations.length === 0) {
          setError('No hay destinos con coordenadas válidas');
          setIsLoading(false);
          return;
        }

        // STEP 2: Get Cognito session and ID Token
        console.log('🔐 [CognitoLocationMap] Fetching Cognito session...');
        const session = await fetchAuthSession();

        if (!session.tokens?.idToken) {
          throw new Error('No se pudo obtener el token de autenticación');
        }

        const idToken = session.tokens.idToken.toString();
        console.log('✅ [CognitoLocationMap] ID Token obtenido');

        // STEP 3: Create authentication helper with Identity Pool + User Pool token
        console.log('🔐 [CognitoLocationMap] Configurando autenticación con Identity Pool...');
        const authHelper = await withIdentityPoolId(
          outputs.auth.identity_pool_id,
          {
            logins: {
              [`cognito-idp.${outputs.auth.aws_region}.amazonaws.com/${outputs.auth.user_pool_id}`]: idToken
            }
          }
        );
        console.log('✅ [CognitoLocationMap] Autenticación configurada');

        // STEP 4: Initialize MapLibre GL with Cognito authentication
        const mapStyle = `https://maps.geo.${outputs.auth.aws_region}.amazonaws.com/maps/v0/maps/YaanEsri/style-descriptor`;

        console.log('🗺️ [CognitoLocationMap] Inicializando mapa...', {
          center: initialCenter,
          zoom: initialZoom,
          style: mapStyle
        });

        const mapInstance = new maplibregl.Map({
          container: mapContainer.current!,
          style: mapStyle,
          center: initialCenter,
          zoom: initialZoom,
          ...authHelper.getMapAuthenticationOptions(), // KEY: Cognito authentication options
        });

        // STEP 5: Wait for map to load
        mapInstance.on('load', () => {
          console.log('✅ [CognitoLocationMap] Mapa cargado exitosamente');
          setIsLoading(false);

          // Add markers for all destinations
          addDestinationMarkers(mapInstance);

          // Calculate and display route for circuits
          if (productType === 'circuit' && validDestinations.length > 1) {
            calculateAndDisplayRoute(mapInstance);
          }
        });

        // Add navigation controls
        mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Add scale control
        mapInstance.addControl(
          new maplibregl.ScaleControl({
            maxWidth: 80,
            unit: 'metric'
          }),
          'bottom-left'
        );

        // Error handling
        mapInstance.on('error', (e) => {
          console.error('❌ [CognitoLocationMap] Error en el mapa:', e);
          setError('Error al cargar el mapa');
          setIsLoading(false);
        });

        map.current = mapInstance;

      } catch (err) {
        console.error('❌ [CognitoLocationMap] Error al inicializar:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el mapa');
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [validDestinations.length, initialCenter, initialZoom, productType]); // Re-run if destinations change

  // Add destination markers to the map
  const addDestinationMarkers = (mapInstance: maplibregl.Map) => {
    validDestinations.forEach((destination, index) => {
      const { latitude, longitude } = destination.coordinates!;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.cursor = 'pointer';

      // Different styles for circuits vs packages
      const isCircuit = productType === 'circuit';
      const color = isCircuit ? '#ec4899' : '#8b5cf6'; // pink for circuits, purple for packages

      el.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        ${isCircuit ? `<div style="position: absolute; top: 8px; left: 50%; transform: translateX(-50%); background: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; color: ${color};">${index + 1}</div>` : ''}
      `;

      // Create popup
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">${destination.place || 'Destino'}</h3>
          ${destination.placeSub ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${destination.placeSub}</p>` : ''}
          ${destination.complementary_description ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #888;">${destination.complementary_description}</p>` : ''}
        </div>
      `);

      // Add marker to map
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(mapInstance);

      // Open popup on click
      el.addEventListener('click', () => {
        setSelectedDestination(index);
        marker.togglePopup();
      });
    });

    // Fit map to show all markers
    if (validDestinations.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      validDestinations.forEach(d => {
        bounds.extend([d.coordinates!.longitude!, d.coordinates!.latitude!]);
      });
      mapInstance.fitBounds(bounds, { padding: 50 });
    }
  };

  // Calculate and display route for circuits
  const calculateAndDisplayRoute = async (mapInstance: maplibregl.Map) => {
    try {
      console.log('🛣️ [CognitoLocationMap] Calculando ruta...');

      // Prepare waypoints - API expects position as [longitude, latitude]
      const waypoints = validDestinations.map(d => ({
        position: [d.coordinates!.longitude!, d.coordinates!.latitude!] as [number, number],
        place: d.place,
        placeSub: d.placeSub
      }));

      console.log('🛣️ [CognitoLocationMap] Waypoints preparados:', waypoints);

      // Call route calculation API
      const response = await fetch('/api/routes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waypoints,
          optimize: true,
          travelMode: 'Car'
        })
      });

      console.log('🛣️ [CognitoLocationMap] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CognitoLocationMap] API error response:', errorText);
        throw new Error(`Error al calcular la ruta: ${response.status}`);
      }

      const data = await response.json();
      console.log('🛣️ [CognitoLocationMap] API response data:', data);

      if (data.success && data.data) {
        console.log('✅ [CognitoLocationMap] Ruta calculada:', {
          distance: `${data.data.totalDistance.toFixed(1)} km`,
          duration: `${Math.round(data.data.totalDuration / 60)} min`,
          geometryPoints: data.data.routeGeometry.length
        });

        // Convert route geometry to GeoJSON LineString
        const routeGeoJSON: GeoJSON.LineString = {
          type: 'LineString',
          coordinates: data.data.routeGeometry
        };

        setRouteData({
          distance: data.data.totalDistance * 1000, // Convert km to meters for consistency
          duration: data.data.totalDuration,
          geometry: routeGeoJSON
        });

        // Add route line to map
        if (mapInstance.getSource('route')) {
          (mapInstance.getSource('route') as maplibregl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: routeGeoJSON
          });
        } else {
          mapInstance.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: routeGeoJSON
            }
          });

          mapInstance.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#ec4899',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          // Add route outline for better visibility
          mapInstance.addLayer({
            id: 'route-outline',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#ffffff',
              'line-width': 6,
              'line-opacity': 0.4
            }
          }, 'route');
        }
      }
    } catch (err) {
      console.error('❌ [CognitoLocationMap] Error al calcular ruta:', err);
      // Non-critical error - map still works without route
    }
  };

  console.log('🎨 [CognitoLocationMap] Renderizando JSX... isLoading:', isLoading, 'error:', error);

  // CRÍTICO: Siempre renderizar el div del mapa para que mapContainer.current exista cuando useEffect se ejecute
  return (
    <div className="w-full space-y-6">
      {/* Map container - SIEMPRE presente en el DOM */}
      <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Loading overlay - Se muestra ENCIMA del mapa */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Cargando mapa interactivo...</p>
            </div>
          </div>
        )}

        {/* Error overlay - Se muestra ENCIMA del mapa */}
        {error && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center z-10">
            <div className="text-center text-red-600">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Map legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {productType === 'circuit' ? (
              <>
                <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{validDestinations.length} destinos en circuito</span>
                {routeData && (
                  <span className="ml-2 text-gray-500">
                    • {(routeData.distance / 1000).toFixed(1)} km • {Math.round(routeData.duration / 60)} min
                  </span>
                )}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{validDestinations.length} destino{validDestinations.length > 1 ? 's' : ''} del paquete</span>
              </>
            )}
          </div>
        </div>

        {/* Powered by AWS badge */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1">
          <p className="text-xs text-gray-500 font-medium">Powered by AWS Location Service</p>
        </div>
      </div>

      {/* Destinations list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {productType === 'circuit' ? 'Ruta del Circuito' : 'Destinos del Paquete'}
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {validDestinations.map((destination, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedDestination(index);
                if (map.current) {
                  map.current.flyTo({
                    center: [destination.coordinates!.longitude!, destination.coordinates!.latitude!],
                    zoom: 12,
                    duration: 1000
                  });
                }
              }}
              className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                selectedDestination === index ? 'bg-purple-50 border-l-4 border-l-pink-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Number badge for circuits */}
                {productType === 'circuit' && (
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    selectedDestination === index
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                )}

                {/* Destination info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{destination.place}</h4>
                  {destination.placeSub && (
                    <p className="text-sm text-gray-600 truncate mt-1">{destination.placeSub}</p>
                  )}
                  {destination.complementary_description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {destination.complementary_description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2 font-mono">
                    {destination.coordinates!.latitude!.toFixed(4)}, {destination.coordinates!.longitude!.toFixed(4)}
                  </p>
                </div>

                {/* Arrow indicator for circuits */}
                {productType === 'circuit' && index < validDestinations.length - 1 && (
                  <div className="flex-shrink-0 text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive map note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              <strong>Mapa interactivo:</strong> Usa los controles para hacer zoom y navegar. Haz clic en los marcadores para ver más detalles de cada destino.
              {productType === 'circuit' && ' La línea rosa muestra la ruta optimizada del circuito.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
