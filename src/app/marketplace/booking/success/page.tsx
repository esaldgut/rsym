/**
 * Booking Success Page
 *
 * Displayed after successful payment processing.
 * Shows reservation confirmation and voucher download.
 *
 * URL: /marketplace/booking/success?reservation_id=xxx
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { getReservationWithDetailsAction } from '@/lib/server/reservation-actions';
import BookingSuccessClient from './success-client';

export const metadata = {
  title: 'Reservación Confirmada | YAAN',
  description: 'Tu reservación ha sido confirmada exitosamente'
};

interface BookingSuccessPageProps {
  searchParams: {
    reservation_id?: string;
  };
}

export default async function BookingSuccessPage({
  searchParams
}: BookingSuccessPageProps) {
  // STEP 1: Validate authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/auth?redirect=/marketplace/booking/success');
  }

  // STEP 2: Validate reservation_id parameter
  const reservationId = searchParams.reservation_id;
  if (!reservationId) {
    console.error('[BookingSuccessPage] ❌ Missing reservation_id parameter');
    redirect('/traveler/reservations');
  }

  console.log('[BookingSuccessPage] ✅ Loading reservation:', reservationId);

  // STEP 3: Fetch reservation details
  const result = await getReservationWithDetailsAction(reservationId);

  if (!result.success || !result.data) {
    console.error('[BookingSuccessPage] ❌ Error loading reservation:', result.error);
    redirect('/traveler/reservations');
  }

  // STEP 4: Verify reservation belongs to authenticated user
  if (result.data.reservation.user_id !== user.userId) {
    console.error('[BookingSuccessPage] ❌ Reservation does not belong to user');
    redirect('/traveler/reservations');
  }

  // STEP 5: Render success page with reservation data
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <BookingSuccessClient
        reservation={result.data.reservation}
        product={result.data.product}
        paymentPlan={result.data.paymentPlan}
        userId={user.userId}
      />
    </Suspense>
  );
}
