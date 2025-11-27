'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReservationCard from '@/components/reservation/ReservationCard';

/**
 * Reservations List Client Component
 *
 * Displays a list of user reservations with:
 * - Filter by status
 * - Sort by date
 * - Pagination (load more)
 * - Empty state
 * - Error state
 *
 * Part of: Sprint 1+ - Dashboard de Reservaciones
 */

interface Companion {
  name: string;
  family_name: string;
  birthday: string;
  country: string;
  gender: string;
  passport_number: string;
}

interface ReservationData {
  id: string;
  experience_id: string;
  experience_type?: string;
  user_id: string;
  adults: number;
  kids: number;
  babys: number;
  companions?: Companion[];
  reservation_date: string;
  status: string;
  price_per_person: number;
  price_per_kid?: number;
  total_price: number;
  currency: string;
  season_id?: string;
  price_id?: string;
  payment_method?: string;
  type?: string;
}

interface ReservationsListClientProps {
  initialReservations: ReservationData[];
  initialNextToken?: string;
  userId: string;
  error?: string;
}

type StatusFilter = 'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed';

export default function ReservationsListClient({
  initialReservations,
  initialNextToken,
  userId,
  error
}: ReservationsListClientProps) {
  const router = useRouter();

  const [reservations, setReservations] = useState<ReservationData[]>(initialReservations);
  const [nextToken, setNextToken] = useState<string | undefined>(initialNextToken);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter reservations by status
  const filteredReservations = statusFilter === 'all'
    ? reservations
    : reservations.filter(res => res.status.toLowerCase() === statusFilter);

  // Count by status
  const statusCounts = {
    all: reservations.length,
    confirmed: reservations.filter(r => r.status.toLowerCase() === 'confirmed').length,
    pending: reservations.filter(r => r.status.toLowerCase() === 'pending').length,
    cancelled: reservations.filter(r => r.status.toLowerCase() === 'cancelled').length,
    completed: reservations.filter(r => r.status.toLowerCase() === 'completed').length
  };

  // Handle load more - FASE 5 implementation
  const handleLoadMore = async () => {
    if (!nextToken || isLoadingMore) return;

    console.log('📄 [ReservationsListClient] Cargando más reservaciones con nextToken:', nextToken);
    setIsLoadingMore(true);

    try {
      // Dynamic import to avoid server action in initial bundle
      const { getAllReservationsByUserAction } = await import('@/lib/server/reservation-actions');

      const result = await getAllReservationsByUserAction({
        limit: 10,
        nextToken
      });

      if (result.success && result.data) {
        console.log('✅ [ReservationsListClient] Cargadas', result.data.items.length, 'reservaciones adicionales');

        // Append new reservations to existing list
        setReservations(prev => [...prev, ...(result.data?.items || [])]);

        // Update nextToken for next pagination
        setNextToken(result.data.nextToken);

        console.log('📊 [ReservationsListClient] Total ahora:', reservations.length + result.data.items.length);
      } else {
        console.error('❌ [ReservationsListClient] Error al cargar más:', result.error);
      }
    } catch (error) {
      console.error('❌ [ReservationsListClient] Error inesperado:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle reservation click
  const handleReservationClick = (reservationId: string) => {
    router.push(`/traveler/reservations/${reservationId}`);
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0"
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
              <div>
                <h3 className="text-lg font-semibold text-red-900">Error al cargar reservaciones</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => router.refresh()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Reservaciones</h1>
          <p className="text-gray-600">
            Gestiona y consulta el estado de todas tus reservaciones de viaje
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-2 flex gap-2 overflow-x-auto">
          {[
            { key: 'all' as const, label: 'Todas', count: statusCounts.all },
            { key: 'confirmed' as const, label: 'Confirmadas', count: statusCounts.confirmed },
            { key: 'pending' as const, label: 'Pendientes', count: statusCounts.pending },
            { key: 'completed' as const, label: 'Completadas', count: statusCounts.completed },
            { key: 'cancelled' as const, label: 'Canceladas', count: statusCounts.cancelled }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    statusFilter === tab.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {statusFilter === 'all'
                ? 'Aún no tienes reservaciones'
                : `No tienes reservaciones ${statusFilter === 'confirmed' ? 'confirmadas' :
                    statusFilter === 'pending' ? 'pendientes' :
                    statusFilter === 'cancelled' ? 'canceladas' : 'completadas'}`}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all'
                ? 'Explora nuestros productos y realiza tu primera reservación'
                : 'Cambia el filtro para ver otras reservaciones'}
            </p>
            {statusFilter === 'all' && (
              <button
                onClick={() => router.push('/marketplace')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Explorar Productos
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  onClick={() => handleReservationClick(reservation.id)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {nextToken && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 inline-block mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Cargando...
                    </>
                  ) : (
                    <>Cargar más</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
