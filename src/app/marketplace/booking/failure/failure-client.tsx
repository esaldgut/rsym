'use client';

/**
 * Booking Failure Client Component
 *
 * Displays payment failure with:
 * - Clear error message
 * - Failure reason explanation
 * - Retry payment button
 * - Alternative payment options
 * - Support contact information
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  created_at?: string;
  updated_at?: string;
}

interface ProductData {
  id: string;
  name: string;
  product_type?: string;
  cover_image_url?: string;
  destination?: Array<{
    place?: string;
    placeSub?: string;
  }>;
  origin?: Array<{
    place?: string;
    placeSub?: string;
  }>;
}

interface PaymentInstallment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_date?: string;
}

interface PaymentPlanData {
  id: string;
  reservation_id: string;
  plan_type: string;
  total_amount: number;
  currency: string;
  installments?: PaymentInstallment[];
  created_at?: string;
}

interface BookingFailureClientProps {
  reservation: ReservationData;
  product: ProductData;
  paymentPlan?: PaymentPlanData | null;
  failureReason: string;
  userId: string;
}

export default function BookingFailureClient({
  reservation,
  product,
  paymentPlan,
  failureReason
}: BookingFailureClientProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  // Calculate travelers
  const totalTravelers = reservation.adults + reservation.kids + reservation.babys;

  // Format reservation date
  const reservationDate = new Date(reservation.reservation_date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get destination name
  const destinationName = product.destination?.[0]?.place || 'Destino';

  // Get user-friendly failure reason
  const getFailureReasonText = (reason: string): { title: string; description: string } => {
    switch (reason.toLowerCase()) {
      case 'insufficient_funds':
        return {
          title: 'Fondos Insuficientes',
          description: 'Tu tarjeta no tiene fondos suficientes para completar la transacción.'
        };
      case 'card_declined':
        return {
          title: 'Tarjeta Rechazada',
          description: 'Tu tarjeta fue rechazada por el banco emisor.'
        };
      case 'expired_card':
        return {
          title: 'Tarjeta Vencida',
          description: 'La tarjeta que intentaste usar ha vencido.'
        };
      case 'invalid_card':
        return {
          title: 'Tarjeta Inválida',
          description: 'Los datos de la tarjeta ingresados son inválidos.'
        };
      case 'processing_error':
        return {
          title: 'Error de Procesamiento',
          description: 'Hubo un error al procesar tu pago. Por favor intenta nuevamente.'
        };
      case 'timeout':
        return {
          title: 'Tiempo de Espera Agotado',
          description: 'La transacción tardó demasiado tiempo en procesarse.'
        };
      case 'user_cancelled':
        return {
          title: 'Pago Cancelado',
          description: 'Cancelaste el proceso de pago.'
        };
      default:
        return {
          title: 'Error de Pago',
          description: 'Hubo un problema al procesar tu pago. Por favor intenta nuevamente.'
        };
    }
  };

  const failureInfo = getFailureReasonText(failureReason);

  // Handle retry payment
  const handleRetryPayment = async () => {
    setIsRetrying(true);
    console.log('[BookingFailure] 🔄 Retrying payment for reservation:', reservation.id);

    try {
      // TODO: Implement MIT payment gateway integration
      // For now, redirect to reservation detail where user can retry
      router.push(`/traveler/reservations/${reservation.id}`);
    } catch (error) {
      console.error('[BookingFailure] ❌ Error retrying payment:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Error Icon */}
        <div className="text-center mb-8">
          {/* X Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Error al Procesar el Pago
          </h1>
          <p className="text-lg text-gray-600">
            No pudimos completar tu reservación para {destinationName}
          </p>
        </div>

        {/* Failure Reason Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
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
                <h3 className="text-lg font-semibold text-red-900 mb-1">
                  {failureInfo.title}
                </h3>
                <p className="text-sm text-red-700">
                  {failureInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reservation Summary Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalles de la Reservación Pendiente
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Reservation ID */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-sm text-gray-500">ID de Reservación</span>
              <span className="font-mono font-semibold text-gray-900">
                #{reservation.id.slice(0, 8)}
              </span>
            </div>

            {/* Product Name */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-200">
              <span className="text-sm text-gray-500">Producto</span>
              <span className="font-semibold text-gray-900 text-right">
                {product.name}
              </span>
            </div>

            {/* Date */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-sm text-gray-500">Fecha de Viaje</span>
              <span className="font-semibold text-gray-900">
                {reservationDate}
              </span>
            </div>

            {/* Travelers */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-sm text-gray-500">Viajeros</span>
              <span className="font-semibold text-gray-900">
                {totalTravelers} persona{totalTravelers !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Total Price */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-medium text-gray-900">Total a Pagar</span>
              <span className="text-2xl font-bold text-gray-900">
                ${reservation.total_price.toLocaleString('es-MX')} {reservation.currency}
              </span>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ¿Qué Sucede Ahora?
            </h3>

            <div className="space-y-4">
              {/* Reservation on hold */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Reservación en Espera</p>
                  <p className="text-sm text-gray-600">
                    Tu reservación está pendiente hasta que completes el pago.
                  </p>
                </div>
              </div>

              {/* Limited time */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600"
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
                <div>
                  <p className="font-medium text-gray-900">Tiempo Limitado</p>
                  <p className="text-sm text-gray-600">
                    Tienes 24 horas para completar el pago antes de que se cancele la reservación.
                  </p>
                </div>
              </div>

              {/* Try again */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Intenta de Nuevo</p>
                  <p className="text-sm text-gray-600">
                    Puedes reintentar el pago usando otra tarjeta o método de pago.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Solutions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Soluciones Sugeridas
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Verifica que tu tarjeta tenga fondos suficientes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Asegúrate de que tu tarjeta esté habilitada para compras en línea</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Contacta a tu banco para autorizar la transacción</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Intenta con otra tarjeta o método de pago</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Retry Payment */}
          <button
            onClick={handleRetryPayment}
            disabled={isRetrying}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reintentar Pago
              </>
            )}
          </button>

          {/* Contact Support */}
          <Link
            href="/support"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Contactar Soporte
          </Link>
        </div>

        {/* Back to Reservations */}
        <div className="text-center">
          <Link
            href="/traveler/reservations"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Ir a Mis Reservaciones
          </Link>
        </div>
      </div>
    </div>
  );
}
