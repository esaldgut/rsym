import { redirect } from 'next/navigation';
import { getAllReservationsByUserAction } from '@/lib/server/reservation-actions';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import ReservationsListClient from './reservations-list-client';

/**
 * Traveler Reservations List Page (SSR)
 *
 * Displays all reservations for the authenticated traveler.
 *
 * Features:
 * - Server-side rendering for SEO
 * - Authentication validation
 * - Initial data fetch (pagination client-side)
 * - Empty state when no reservations
 *
 * Part of: Sprint 1+ - Dashboard de Reservaciones
 */
export default async function TravelerReservationsPage() {
  console.log('📋 [TravelerReservationsPage] Cargando lista de reservaciones');

  // 1. Validate authentication
  const user = await getAuthenticatedUser();

  if (!user) {
    console.log('❌ [TravelerReservationsPage] Usuario no autenticado, redirigiendo');
    redirect('/auth?redirect=/traveler/reservations');
  }

  console.log('✅ [TravelerReservationsPage] Usuario autenticado:', {
    userId: user.userId,
    userType: user.userType
  });

  // 2. Fetch initial reservations
  const result = await getAllReservationsByUserAction({ limit: 20 });

  // 3. Handle errors
  if (!result.success) {
    console.error('❌ [TravelerReservationsPage] Error al cargar reservaciones:', result.error);
    // Show error state in client component
  }

  const reservations = result.data?.items || [];
  const nextToken = result.data?.nextToken;

  console.log('✅ [TravelerReservationsPage] Reservaciones cargadas:', {
    count: reservations.length,
    hasMore: !!nextToken
  });

  // 4. Render client component with data
  return (
    <ReservationsListClient
      initialReservations={reservations}
      initialNextToken={nextToken}
      userId={user.userId}
      error={result.success ? undefined : result.error}
    />
  );
}

/**
 * Metadata para SEO
 */
export const metadata = {
  title: 'Mis Reservaciones | YAAN',
  description: 'Consulta y gestiona tus reservaciones de viaje'
};
