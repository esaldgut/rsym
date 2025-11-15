'use client';

/**
 * ExperienceSelector - Reservation/Experience Selector for Moments
 *
 * Allows users to link a moment to one of their reservations/experiences.
 * Fetches user's reservations from GraphQL and provides selection interface.
 *
 * Features:
 * - Fetches reservations via getReservationsBySUB query
 * - Visual cards with experience details
 * - Single-select (only 1 experience per moment)
 * - Search/filter functionality
 * - Loading and error states
 * - Responsive layout
 *
 * @example
 * ```tsx
 * <ExperienceSelector
 *   selectedExperienceId="reservation-123"
 *   onExperienceChange={(id) => setSelectedExperienceId(id)}
 * />
 * ```
 */

import { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAmplifyAuth } from '@/hooks/useAmplifyAuth';
import type { Reservation } from '@/graphql/operations';
import { getReservationsBySUB } from '@/graphql/operations';

// ============================================================================
// TYPES
// ============================================================================

export interface ExperienceSelectorProps {
  /** Currently selected experience/reservation ID */
  selectedExperienceId: string | null;

  /** Callback when experience selection changes */
  onExperienceChange: (experienceId: string | null) => void;

  /** Custom className */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ExperienceSelector({
  selectedExperienceId,
  onExperienceChange,
  className = ''
}: ExperienceSelectorProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAmplifyAuth();

  // ============================================================================
  // FETCH RESERVATIONS
  // ============================================================================

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[ExperienceSelector] 📡 Fetching reservations from GraphQL...');

        // Initialize GraphQL client
        const client = generateClient();

        // Fetch user's reservations
        const { data, errors } = await client.graphql({
          query: getReservationsBySUB
        });

        // Handle GraphQL errors
        if (errors && errors.length > 0) {
          console.error('[ExperienceSelector] ❌ GraphQL errors:', errors);
          setError(errors[0]?.message || 'Error al cargar experiencias');
          return;
        }

        // Handle no data
        if (!data?.getReservationsBySUB) {
          console.warn('[ExperienceSelector] ⚠️ No data returned from getReservationsBySUB');
          setReservations([]);
          return;
        }

        // Filter out invalid reservations (missing required fields)
        const validReservations = data.getReservationsBySUB.filter(reservation =>
          reservation.id &&
          reservation.experience_id &&
          reservation.reservationDate
        );

        console.log(`[ExperienceSelector] ✅ Loaded ${validReservations.length} reservations`);
        setReservations(validReservations);

      } catch (err) {
        console.error('[ExperienceSelector] Error fetching reservations:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar experiencias');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user]);

  // ============================================================================
  // FILTERED RESERVATIONS
  // ============================================================================

  const filteredReservations = useMemo(() => {
    if (!searchQuery.trim()) {
      return reservations;
    }

    const query = searchQuery.toLowerCase();
    return reservations.filter((reservation) =>
      reservation.experience_id?.toLowerCase().includes(query) ||
      reservation.experience_type?.toLowerCase().includes(query) ||
      reservation.id?.toLowerCase().includes(query)
    );
  }, [reservations, searchQuery]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectExperience = (reservationId: string) => {
    if (selectedExperienceId === reservationId) {
      // Deselect if already selected
      onExperienceChange(null);
    } else {
      // Select new experience
      onExperienceChange(reservationId);
    }
  };

  const handleClear = () => {
    onExperienceChange(null);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price?: number | null) => {
    if (!price) return '$0.00';

    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getExperienceTypeLabel = (type?: string | null) => {
    switch (type?.toLowerCase()) {
      case 'circuit':
        return '🚗 Circuito';
      case 'package':
        return '📦 Paquete';
      default:
        return '✈️ Experiencia';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400">
          Inicia sesión para vincular experiencias
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Cargando experiencias...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <svg
          className="mx-auto w-12 h-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="mt-3 text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vincular Experiencia
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {selectedExperienceId
              ? 'Experiencia vinculada - Click para desvincular'
              : 'Selecciona una de tus reservaciones (opcional)'}
          </p>
        </div>

        {/* Clear Button */}
        {selectedExperienceId && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Desvincular
          </button>
        )}
      </div>

      {/* Search Bar */}
      {reservations.length > 3 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar experiencias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      )}

      {/* Reservations List */}
      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No tienes reservaciones todavía
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Reserva una experiencia para poder vincularla a tus momentos
          </p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No se encontraron experiencias con &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((reservation) => {
            const isSelected = selectedExperienceId === reservation.id;

            return (
              <button
                key={reservation.id}
                onClick={() => handleSelectExperience(reservation.id || '')}
                className={`
                  w-full text-left p-4 rounded-xl border-2 transition-all duration-300
                  ${isSelected
                    ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 shadow-lg scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Experience Details */}
                  <div className="flex-1 min-w-0">
                    {/* Type Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span>{getExperienceTypeLabel(reservation.experience_type)}</span>
                    </div>

                    {/* Date */}
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(reservation.reservationDate)}
                    </h4>

                    {/* Travelers */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {reservation.adults && reservation.adults > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {reservation.adults} {reservation.adults === 1 ? 'Adulto' : 'Adultos'}
                        </span>
                      )}
                      {reservation.kids && reservation.kids > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {reservation.kids} {reservation.kids === 1 ? 'Niño' : 'Niños'}
                        </span>
                      )}
                    </div>

                    {/* Experience ID (truncated) */}
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      ID: {reservation.experience_id}
                    </p>
                  </div>

                  {/* Right: Price & Checkmark */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Price */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatPrice(reservation.total_price)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Total
                      </div>
                    </div>

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Experience Summary */}
      {selectedExperienceId && (
        <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-lg border-2 border-pink-300 dark:border-pink-700">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-pink-800 dark:text-pink-200">
              Experiencia vinculada - Los viajeros podrán ver esta reservación en tu momento
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ExperienceSelector;
