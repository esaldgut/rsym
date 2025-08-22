'use client';

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { searchPlacesByText } from '@/lib/server/location-actions';
import type { CircuitLocation, SearchOptions } from '@/types/location';

interface LocationSearchProps {
  onLocationSelect?: (location: CircuitLocation) => void;
  placeholder?: string;
  countries?: string[];
  maxResults?: number;
  className?: string;
  showCoordinates?: boolean;
  autoFocus?: boolean;
  defaultValue?: string;
}

export function LocationSearch({
  onLocationSelect,
  placeholder = 'Buscar lugares, direcciones, ciudades...',
  countries = ['MEX', 'USA'],
  maxResults = 10,
  className = '',
  showCoordinates = false,
  autoFocus = false,
  defaultValue = ''
}: LocationSearchProps) {
  const [searchText, setSearchText] = useState(defaultValue);
  const [results, setResults] = useState<CircuitLocation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Búsqueda con debounce
  const performSearch = useCallback((text: string) => {
    if (!text.trim()) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      return;
    }

    startTransition(async () => {
      setError(null);
      
      const searchOptions: SearchOptions = {
        maxResults,
        countries,
        language: 'es'
      };
      
      const response = await searchPlacesByText(text, searchOptions);
      
      if (response.success && response.locations) {
        setResults(response.locations);
        setIsOpen(response.locations.length > 0);
      } else {
        setError(response.error || 'Error en la búsqueda');
        setResults([]);
        setIsOpen(false);
      }
    });
  }, [countries, maxResults]);

  // Manejar cambio en el input con debounce
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setSelectedIndex(-1);
    
    // Cancelar búsqueda anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Nueva búsqueda con debounce
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  // Seleccionar una ubicación
  const handleLocationSelect = useCallback((location: CircuitLocation) => {
    setSearchText(location.place);
    setIsOpen(false);
    setSelectedIndex(-1);
    onLocationSelect?.(location);
  }, [onLocationSelect]);

  // Navegación con teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleLocationSelect(results[selectedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, results, selectedIndex, handleLocationSelect]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Input de búsqueda */}
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all duration-200"
          disabled={isPending}
        />
        
        {/* Icono de búsqueda */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          {isPending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500" />
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Botón de limpiar */}
        {searchText && !isPending && (
          <button
            onClick={() => {
              setSearchText('');
              setResults([]);
              setIsOpen(false);
              setError(null);
              searchInputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="absolute w-full mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 z-50">
          {error}
        </div>
      )}

      {/* Resultados de búsqueda */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto z-50"
        >
          {results.map((location, index) => (
            <button
              key={index}
              onClick={() => handleLocationSelect(location)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                selectedIndex === index ? 'bg-gray-50' : ''
              } ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-start space-x-3">
                {/* Icono de ubicación */}
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                
                {/* Información de la ubicación */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {location.place}
                  </p>
                  
                  {location.placeSub && (
                    <p className="text-sm text-gray-500 truncate">
                      {location.placeSub}
                    </p>
                  )}
                  
                  {location.complementaryDescription && (
                    <p className="text-xs text-gray-400 truncate">
                      {location.complementaryDescription}
                    </p>
                  )}
                  
                  {showCoordinates && (
                    <p className="text-xs text-gray-400 mt-1">
                      {location.coordinates[1].toFixed(6)}, {location.coordinates[0].toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Estado cuando no hay resultados */}
      {isOpen && searchText && results.length === 0 && !isPending && !error && (
        <div className="absolute w-full mt-2 p-4 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <p className="text-gray-500 text-center">
            No se encontraron resultados para "{searchText}"
          </p>
        </div>
      )}
    </div>
  );
}