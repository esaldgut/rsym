import { notFound, redirect } from 'next/navigation';
import { getReservationWithDetailsAction } from '@/lib/server/reservation-actions';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import ReservationDetailClient from './reservation-detail-client';

interface ReservationDetailPageProps {
  params: Promise<{
    reservationId: string;
  }>;
}

/**
 * Reservation Detail Page (SSR)
 *
 * Server-side rendered page that fetches complete reservation details including:
 * - Reservation data (companions, dates, status)
 * - Product information (name, destination, itinerary, media)
 * - Payment plan (installments, deadlines, status)
 *
 * Part of Sprint 1: Fundamentos del Detalle de Viaje
 */
export default async function ReservationDetailPage({
  params
}: ReservationDetailPageProps) {
  // Next.js 16: params is now async
  const resolvedParams = await params;

  console.log('🔐 [ReservationDetailPage] Validando autenticación...');

  // 1. Validate authentication
  const user = await getAuthenticatedUser();

  if (!user) {
    console.log('❌ [ReservationDetailPage] Usuario no autenticado, redirigiendo a /auth');
    redirect('/auth?redirect=/traveler/reservations/' + resolvedParams.reservationId);
  }

  console.log('✅ [ReservationDetailPage] Usuario autenticado:', {
    userId: user.userId,
    userType: user.userType
  });

  // 2. Fetch reservation with complete details
  console.log('📋 [ReservationDetailPage] Obteniendo detalles de reservación:', resolvedParams.reservationId);

  const result = await getReservationWithDetailsAction(resolvedParams.reservationId);

  // 3. Handle errors
  if (!result.success) {
    console.error('❌ [ReservationDetailPage] Error al obtener reservación:', result.error);

    // If reservation not found, show 404
    if (result.error?.includes('not found') || result.error?.includes('no existe')) {
      notFound();
    }

    // For other errors, redirect to reservations list
    redirect('/traveler/reservations?error=load_failed');
  }

  if (!result.data) {
    console.error('❌ [ReservationDetailPage] Sin datos de reservación');
    notFound();
  }

  console.log('✅ [ReservationDetailPage] Datos cargados exitosamente:', {
    reservationId: result.data.reservation.id,
    productName: result.data.product.name,
    hasPaymentPlan: !!result.data.paymentPlan
  });

  // 4. Pass data to client component
  return (
    <ReservationDetailClient
      reservation={result.data.reservation}
      product={result.data.product}
      paymentPlan={result.data.paymentPlan}
      userId={user.userId}
    />
  );
}

/**
 * Metadata for SEO
 */
export async function generateMetadata({
  params
}: ReservationDetailPageProps) {
  // Next.js 16: params is now async
  const resolvedParams = await params;
  const result = await getReservationWithDetailsAction(resolvedParams.reservationId);

  if (!result.success || !result.data) {
    return {
      title: 'Reservación no encontrada',
      description: 'La reservación solicitada no existe o no tienes permiso para verla.'
    };
  }

  const { product } = result.data;

  return {
    title: `Mi Viaje: ${product.name} | YAAN`,
    description: product.description || `Detalles de tu reservación para ${product.name}`
  };
}
