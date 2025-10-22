'use client';

import { useState } from 'react';

interface Destination {
  place?: string;
  placeSub?: string;
  coordinates?: number[] | [number, number] | { latitude?: number; longitude?: number };
  complementaryDescription?: string;
  complementary_description?: string; // Alias para compatibilidad con GraphQL
}

interface ProductMapProps {
  destinations: Destination[];
  productType: 'circuit' | 'package';
  productName: string;
}

/**
 * Helper function para normalizar coordenadas a formato [lng, lat]
 * Acepta arrays [lng, lat] o Point objects {latitude, longitude}
 */
function normalizeCoordinates(
  coords: number[] | [number, number] | { latitude?: number; longitude?: number } | undefined
): [number, number] | undefined {
  if (!coords) return undefined;

  // Si ya es un array, retornar directamente
  if (Array.isArray(coords) && coords.length === 2) {
    return coords as [number, number];
  }

  // Si es un Point object, convertir a array [lng, lat]
  if (typeof coords === 'object' && 'latitude' in coords && 'longitude' in coords) {
    if (typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      return [coords.longitude, coords.latitude];
    }
  }

  return undefined;
}

export function ProductMap({ destinations, productType, productName }: ProductMapProps) {
  const [selectedDestination, setSelectedDestination] = useState<number>(0);

  if (!destinations || destinations.length === 0) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm">No hay destinos disponibles</p>
        </div>
      </div>
    );
  }

  const validDestinations = destinations.filter(d => d.place);

  return (
    <div className="w-full space-y-6">
      {/* Map placeholder with route visualization */}
      <div className="relative w-full h-96 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 rounded-2xl overflow-hidden shadow-inner">
        {/* Decorative map background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Route line connecting destinations */}
        {validDestinations.length > 1 && productType === 'circuit' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <polyline
              points={validDestinations.map((_, index) => {
                const x = (index / (validDestinations.length - 1)) * 100;
                const y = 50 + Math.sin((index / validDestinations.length) * Math.PI * 2) * 20;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="3"
              strokeDasharray="5,5"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Destination markers */}
        <div className="absolute inset-0 flex items-center justify-around px-8">
          {validDestinations.map((destination, index) => {
            const isSelected = selectedDestination === index;
            const isCircuit = productType === 'circuit';

            return (
              <button
                key={index}
                onClick={() => setSelectedDestination(index)}
                className={`group relative transition-all duration-300 ${
                  isSelected ? 'scale-125 z-10' : 'scale-100 hover:scale-110'
                }`}
                title={destination.place}
              >
                {/* Marker pin */}
                <div className={`relative w-12 h-12 ${isSelected ? 'animate-bounce' : ''}`}>
                  <svg
                    className={`w-full h-full transition-colors ${
                      isSelected
                        ? 'text-pink-500 drop-shadow-lg'
                        : 'text-purple-400 group-hover:text-pink-400'
                    }`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>

                  {/* Marker number for circuits */}
                  {isCircuit && (
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Marker label */}
                <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap transition-opacity ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg shadow-lg">
                    <p className="text-xs font-semibold text-gray-900">{destination.place}</p>
                    {destination.placeSub && (
                      <p className="text-xs text-gray-600">{destination.placeSub}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {productType === 'circuit' ? (
              <>
                <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{validDestinations.length} destinos en circuito</span>
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
              onClick={() => setSelectedDestination(index)}
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
                  {(destination.complementaryDescription || destination.complementary_description) && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {destination.complementaryDescription || destination.complementary_description}
                    </p>
                  )}
                  {(() => {
                    const normalizedCoords = normalizeCoordinates(destination.coordinates);
                    return normalizedCoords ? (
                      <p className="text-xs text-gray-400 mt-2 font-mono">
                        {normalizedCoords[1]?.toFixed(4)}, {normalizedCoords[0]?.toFixed(4)}
                      </p>
                    ) : null;
                  })()}
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

      {/* Note about interactive map */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              <strong>Visualización de ruta:</strong> Los destinos se muestran en orden {productType === 'circuit' ? 'del circuito' : 'del paquete'}. Haz clic en cada marcador para ver más detalles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
