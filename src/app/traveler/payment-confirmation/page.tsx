import { Suspense } from 'react';
import PaymentConfirmationClient from './payment-confirmation-client';

/**
 * Payment Confirmation Page - FASE 6
 *
 * Server Component wrapper for payment confirmation.
 * MIT Payment Gateway redirects here after payment processing.
 *
 * Query parameters expected:
 * - paymentId: MIT payment ID
 * - status: 'success' | 'failed' | 'cancelled'
 * - reservationId: Reservation ID (from metadata)
 * - amount: Payment amount in centavos
 *
 * Part of: Sprint 1+ - Sistema de Reservaciones
 */

export const metadata = {
  title: 'Confirmación de Pago | YAAN',
  description: 'Confirmación de tu pago de reservación'
};

export default function PaymentConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 mx-auto text-blue-600"
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
            <p className="mt-4 text-gray-600">Verificando pago...</p>
          </div>
        </div>
      }
    >
      <PaymentConfirmationClient />
    </Suspense>
  );
}
