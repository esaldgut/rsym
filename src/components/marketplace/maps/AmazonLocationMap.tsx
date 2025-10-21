'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Destination {
  place?: string;
  placeSub?: string;
  coordinates?: number[] | [number, number];
  complementaryDescription?: string;
}

interface AmazonLocationMapProps {
  destinations: Destination[];
  productType: 'circuit' | 'package';
  productName: string;
}

interface RouteData {
  totalDistance: number;
  totalDuration: number;
  routeGeometry: Array<[number, number]>;
  optimizedOrder?: number[];
  waypoints: Array<{
    position: [number, number];
    place?: string;
    placeSub?: string;
  }>;
}

export function AmazonLocationMap({ destinations, productType, productName }: AmazonLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  // Filter valid destinations with coordinates
  const validDestinations = destinations.filter(
    (d) => d.coordinates && Array.isArray(d.coordinates) && d.coordinates.length === 2
  );

  useEffect(() => {
    if (!mapContainer.current || validDestinations.length === 0) {
      setIsLoading(false);
      return;
    }

    // Check if API key is configured
    const apiKey = process.env.NEXT_PUBLIC_LOCATION_API_KEY;
    if (!apiKey) {
      setError('Map API key not configured');
      setIsLoading(false);
      return;
    }

    // Initialize map
    const initializeMap = async () => {
      try {
        // Get first destination as initial center
        const firstDest = validDestinations[0];
        const initialCenter: [number, number] = [
          firstDest.coordinates![0],
          firstDest.coordinates![1]
        ];

        // Map configuration
        const mapInstance = new maplibregl.Map({
          container: mapContainer.current!,
          style: `https://maps.geo.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com/v2/styles/YaanEsri/descriptor?key=${apiKey}`,
          center: initialCenter,
          zoom: 10,
          attributionControl: false
        });

        // Add attribution
        mapInstance.addControl(
          new maplibregl.AttributionControl({
            compact: true
          }),
          'bottom-right'
        );

        // Add navigation controls
        mapInstance.addControl(
          new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true
          }),
          'top-right'
        );

        map.current = mapInstance;

        // Wait for map to load
        mapInstance.on('load', async () => {
          try {
            // Calculate route if circuit with multiple destinations
            if (productType === 'circuit' && validDestinations.length > 1) {
              const waypoints = validDestinations.map((dest) => ({
                position: [dest.coordinates![0], dest.coordinates![1]] as [number, number],
                place: dest.place,
                placeSub: dest.placeSub
              }));

              // Call API route to calculate route
              const response = await fetch('/api/routes/calculate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  waypoints,
                  optimize: true,
                  travelMode: 'Car'
                })
              });

              const result = await response.json();

              if (result.success && result.data) {
                setRouteData(result.data);

                // Add route line to map
                addRouteToMap(mapInstance, result.data.routeGeometry);

                // Use route waypoints for markers
                addMarkersToMap(mapInstance, result.data.waypoints, productType);

                // Fit bounds to route
                fitMapToRoute(mapInstance, result.data.routeGeometry);
              } else {
                throw new Error(result.error || 'Route calculation failed');
              }
            } else {
              // Just add markers for packages or single destinations
              const waypoints = validDestinations.map((dest) => ({
                position: [dest.coordinates![0], dest.coordinates![1]] as [number, number],
                place: dest.place,
                placeSub: dest.placeSub
              }));

              addMarkersToMap(mapInstance, waypoints, productType);
              fitMapToMarkers(mapInstance, waypoints);
            }

            setIsLoading(false);
          } catch (err) {
            console.error('Map initialization error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load map data');
            setIsLoading(false);
          }
        });

        mapInstance.on('error', (e) => {
          console.error('Map error:', e);
          setError('Map failed to load');
          setIsLoading(false);
        });
      } catch (err) {
        console.error('Map setup error:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup map');
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
  }, [validDestinations, productType]);

  // Add route line to map
  const addRouteToMap = (mapInstance: maplibregl.Map, routeGeometry: Array<[number, number]>) => {
    // Add route source
    mapInstance.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeGeometry
        }
      }
    });

    // Add route line layer with gradient
    mapInstance.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ec4899', // pink-500
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
        'line-color': '#9333ea', // purple-600
        'line-width': 6,
        'line-opacity': 0.4
      }
    });
  };

  // Add markers to map
  const addMarkersToMap = (
    mapInstance: maplibregl.Map,
    waypoints: Array<{ position: [number, number]; place?: string; placeSub?: string }>,
    type: 'circuit' | 'package'
  ) => {
    waypoints.forEach((waypoint, index) => {
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.style.width = '40px';
      markerEl.style.height = '40px';
      markerEl.style.cursor = 'pointer';

      // Different styles for circuit (numbered) vs package
      if (type === 'circuit') {
        markerEl.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #ec4899, #9333ea);
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-weight: bold;
            color: white;
            font-size: 16px;
          ">
            ${index + 1}
          </div>
        `;
      } else {
        markerEl.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #ec4899, #9333ea);
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          ">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
          </div>
        `;
      }

      // Create popup content
      const popupContent = `
        <div style="padding: 8px; min-width: 150px;">
          <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 4px;">
            ${waypoint.place || `Destino ${index + 1}`}
          </div>
          ${
            waypoint.placeSub
              ? `<div style="font-size: 12px; color: #6b7280;">${waypoint.placeSub}</div>`
              : ''
          }
          ${
            type === 'circuit'
              ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9333ea; font-weight: 500;">
                  Parada ${index + 1} de ${waypoints.length}
                 </div>`
              : ''
          }
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);

      // Add marker to map
      new maplibregl.Marker({ element: markerEl })
        .setLngLat(waypoint.position)
        .setPopup(popup)
        .addTo(mapInstance);

      // Show first marker popup by default
      if (index === 0) {
        popup.addTo(mapInstance);
      }
    });
  };

  // Fit map to route
  const fitMapToRoute = (mapInstance: maplibregl.Map, routeGeometry: Array<[number, number]>) => {
    const bounds = new maplibregl.LngLatBounds();

    routeGeometry.forEach((coord) => {
      bounds.extend(coord as [number, number]);
    });

    mapInstance.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 12,
      duration: 1000
    });
  };

  // Fit map to markers
  const fitMapToMarkers = (
    mapInstance: maplibregl.Map,
    waypoints: Array<{ position: [number, number] }>
  ) => {
    if (waypoints.length === 1) {
      mapInstance.setCenter(waypoints[0].position);
      mapInstance.setZoom(12);
      return;
    }

    const bounds = new maplibregl.LngLatBounds();

    waypoints.forEach((waypoint) => {
      bounds.extend(waypoint.position);
    });

    mapInstance.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 12,
      duration: 1000
    });
  };

  // No valid destinations
  if (validDestinations.length === 0) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-sm">No hay coordenadas disponibles para mostrar el mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Map container */}
      <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Cargando mapa interactivo...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center z-10">
            <div className="text-center px-6">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <p className="text-xs text-gray-600 mt-2">
                Mostrando ubicaciones en vista alternativa
              </p>
            </div>
          </div>
        )}

        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Route information card */}
      {routeData && productType === 'circuit' && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-3">Información de la Ruta</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Distancia Total</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {routeData.totalDistance.toFixed(1)} km
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Tiempo Estimado</div>
                  <div className="text-2xl font-bold text-pink-600">
                    {Math.floor(routeData.totalDuration / 3600)}h{' '}
                    {Math.floor((routeData.totalDuration % 3600) / 60)}m
                  </div>
                </div>
              </div>
              {routeData.optimizedOrder && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <p className="text-xs text-purple-700">
                    ✨ Ruta optimizada para el mejor tiempo de viaje
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Destinations list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {productType === 'circuit' ? 'Paradas del Circuito' : 'Ubicaciones del Paquete'}
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {validDestinations.map((destination, index) => (
            <div key={index} className="px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                {productType === 'circuit' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">{destination.place}</h4>
                  {destination.placeSub && (
                    <p className="text-xs text-gray-600 mt-0.5">{destination.placeSub}</p>
                  )}
                  {destination.complementaryDescription && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {destination.complementaryDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              <strong>Mapa interactivo:</strong> Haz clic en los marcadores para ver información detallada de cada destino.
              {productType === 'circuit' && ' La ruta mostrada está optimizada para el mejor tiempo de viaje.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
