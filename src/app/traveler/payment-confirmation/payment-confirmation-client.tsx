'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Payment Confirmation Client Component - FASE 6
 *
 * Displays payment confirmation status after MIT Payment Gateway redirect.
 *
 * URL Query Parameters:
 * - paymentId: MIT payment ID (required)
 * - status: 'success' | 'failed' | 'cancelled' (required)
 * - reservationId: Reservation ID (optional, from metadata)
 * - amount: Payment amount in centavos (optional)
 * - transactionId: MIT transaction ID (optional)
 *
 * States:
 * - Success: Shows confirmation with reservation link
 * - Failed: Shows error with retry option
 * - Cancelled: Shows cancellation notice with reservation link
 * - Invalid: Missing/invalid parameters
 *
 * Part of: Sprint 1+ - Sistema de Reservaciones
 */

type PaymentStatus = 'success' | 'failed' | 'cancelled' | 'invalid';

interface PaymentConfirmationData {
  paymentId: string;
  status: PaymentStatus;
  reservationId?: string;
  amount?: number; // in centavos
  transactionId?: string;
}

export default function PaymentConfirmationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [confirmationData, setConfirmationData] = useState<PaymentConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Extract query parameters
    const paymentId = searchParams.get('paymentId');
    const status = searchParams.get('status') as PaymentStatus;
    const reservationId = searchParams.get('reservationId') || undefined;
    const amountStr = searchParams.get('amount');
    const transactionId = searchParams.get('transactionId') || undefined;

    console.log('💳 [PaymentConfirmation] Query params:', {
      paymentId,
      status,
      reservationId,
      amount: amountStr,
      transactionId
    });

    // Validate required parameters
    if (!paymentId || !status) {
      console.error('❌ [PaymentConfirmation] Missing required parameters');
      setConfirmationData({
        paymentId: paymentId || 'unknown',
        status: 'invalid'
      });
      setIsLoading(false);
      return;
    }

    // Parse amount (convert from centavos to pesos)
    const amount = amountStr ? parseInt(amountStr, 10) : undefined;

    setConfirmationData({
      paymentId,
      status,
      reservationId,
      amount,
      transactionId
    });

    setIsLoading(false);
  }, [searchParams]);

  // Loading state
  if (isLoading || !confirmationData) {
    return (
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
    );
  }

  const { status, paymentId, reservationId, amount, transactionId } = confirmationData;

  // Format amount
  const formattedAmount = amount
    ? new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(amount / 100) // Convert centavos to pesos
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success State */}
        {status === 'success' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Pago Exitoso!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Tu pago ha sido procesado correctamente
            </p>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <dl className="space-y-4">
                {formattedAmount && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 font-medium">Monto pagado:</dt>
                    <dd className="text-gray-900 font-bold text-xl">{formattedAmount}</dd>
                  </div>
                )}

                {transactionId && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 font-medium">ID de transacción:</dt>
                    <dd className="text-gray-900 font-mono text-sm">{transactionId}</dd>
                  </div>
                )}

                <div className="flex justify-between">
                  <dt className="text-gray-600 font-medium">ID de pago:</dt>
                  <dd className="text-gray-900 font-mono text-sm">{paymentId}</dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-gray-600 font-medium">Fecha y hora:</dt>
                  <dd className="text-gray-900">
                    {new Date().toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
              <p className="text-sm text-blue-900">
                📧 Recibirás un correo de confirmación con los detalles de tu pago en breve.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {reservationId && (
                <Link
                  href={`/traveler/reservations/${reservationId}`}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Ver mi reservación
                </Link>
              )}

              <Link
                href="/traveler/reservations"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Todas mis reservaciones
              </Link>
            </div>
          </div>
        )}

        {/* Failed State */}
        {status === 'failed' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pago No Completado
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Hubo un problema al procesar tu pago. Por favor intenta de nuevo.
            </p>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-gray-600 font-medium">ID de pago:</dt>
                  <dd className="text-gray-900 font-mono text-sm">{paymentId}</dd>
                </div>
              </dl>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {reservationId && (
                <button
                  onClick={() => router.push(`/traveler/reservations/${reservationId}`)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Reintentar pago
                </button>
              )}

              <Link
                href="/traveler/reservations"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Ver mis reservaciones
              </Link>
            </div>
          </div>
        )}

        {/* Cancelled State */}
        {status === 'cancelled' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            {/* Warning Icon */}
            <div className="w-20 h-20 bg-yellow-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Cancelled Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pago Cancelado
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Has cancelado el proceso de pago. Puedes intentar de nuevo cuando lo desees.
            </p>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-gray-600 font-medium">ID de pago:</dt>
                  <dd className="text-gray-900 font-mono text-sm">{paymentId}</dd>
                </div>
              </dl>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {reservationId && (
                <button
                  onClick={() => router.push(`/traveler/reservations/${reservationId}`)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Volver a intentar
                </button>
              )}

              <Link
                href="/traveler/reservations"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Ver mis reservaciones
              </Link>
            </div>
          </div>
        )}

        {/* Invalid State */}
        {status === 'invalid' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-gray-600"
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
            </div>

            {/* Error Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Enlace Inválido
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              El enlace de confirmación es inválido o ha expirado.
            </p>

            {/* Action Button */}
            <Link
              href="/traveler/reservations"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ver mis reservaciones
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
