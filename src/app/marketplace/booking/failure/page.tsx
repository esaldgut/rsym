/**
 * Booking Failure Page
 *
 * Displayed when payment processing fails.
 * Allows user to retry payment or contact support.
 *
 * URL: /marketplace/booking/failure?reservation_id=xxx&reason=xxx
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { getReservationWithDetailsAction } from '@/lib/server/reservation-actions';
import BookingFailureClient from './failure-client';

export const metadata = {
  title: 'Error en el Pago | YAAN',
  description: 'Hubo un problema procesando tu pago'
};

interface BookingFailurePageProps {
  searchParams: Promise<{
    reservation_id?: string;
    reason?: string;
  }>;
}

export default async function BookingFailurePage({
  searchParams
}: BookingFailurePageProps) {
  // Next.js 16: searchParams is now async
  const resolvedParams = await searchParams;

  // STEP 1: Validate authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/auth?redirect=/marketplace/booking/failure');
  }

  // STEP 2: Validate reservation_id parameter
  const reservationId = resolvedParams.reservation_id;
  if (!reservationId) {
    console.error('[BookingFailurePage] ❌ Missing reservation_id parameter');
    redirect('/traveler/reservations');
  }

  console.log('[BookingFailurePage] ⚠️ Loading failed reservation:', reservationId);

  // STEP 3: Fetch reservation details
  const result = await getReservationWithDetailsAction(reservationId);

  if (!result.success || !result.data) {
    console.error('[BookingFailurePage] ❌ Error loading reservation:', result.error);
    redirect('/traveler/reservations');
  }

  // STEP 4: Verify reservation belongs to authenticated user
  if (result.data.reservation.user_id !== user.userId) {
    console.error('[BookingFailurePage] ❌ Reservation does not belong to user');
    redirect('/traveler/reservations');
  }

  // STEP 5: Get failure reason
  const failureReason = resolvedParams.reason || 'unknown';

  // STEP 6: Render failure page with reservation data
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>}>
      <BookingFailureClient
        reservation={result.data.reservation}
        product={result.data.product}
        paymentPlan={result.data.paymentPlan}
        failureReason={failureReason}
        userId={user.userId}
      />
    </Suspense>
  );
}
