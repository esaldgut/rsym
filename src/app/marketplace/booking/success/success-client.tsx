'use client';

/**
 * Booking Success Client Component
 *
 * Displays reservation confirmation with:
 * - Celebration animation
 * - Reservation summary
 * - Voucher download button
 * - Next steps guidance
 * - Payment plan summary
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

interface BookingSuccessClientProps {
  reservation: ReservationData;
  product: ProductData;
  paymentPlan?: PaymentPlanData | null;
  userId: string;
}

export default function BookingSuccessClient({
  reservation,
  product,
  paymentPlan
}: BookingSuccessClientProps) {
  const router = useRouter();
  const [isDownloadingVoucher, setIsDownloadingVoucher] = useState(false);

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

  // Check if CONTADO or PLAZOS
  const isContado = paymentPlan?.plan_type === 'CONTADO';
  const paidInstallments = paymentPlan?.installments?.filter(i => i.status === 'paid').length || 0;
  const totalInstallments = paymentPlan?.installments?.length || 0;

  // Handle voucher download
  const handleDownloadVoucher = async () => {
    setIsDownloadingVoucher(true);
    console.log('[BookingSuccess] 📄 Downloading voucher for reservation:', reservation.id);

    try {
      // TODO: Implement PDF voucher generation in FASE 6
      // For now, navigate to reservation detail
      router.push(`/traveler/reservations/${reservation.id}`);
    } catch (error) {
      console.error('[BookingSuccess] ❌ Error downloading voucher:', error);
    } finally {
      setIsDownloadingVoucher(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8">
          {/* Checkmark Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Reservación Confirmada!
          </h1>
          <p className="text-lg text-gray-600">
            Tu viaje a {destinationName} está confirmado
          </p>
        </div>

        {/* Reservation Summary Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">
              Detalles de tu Reservación
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
              <span className="text-base font-medium text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                ${reservation.total_price.toLocaleString('es-MX')} {reservation.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        {paymentPlan && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estado de Pago
              </h3>

              {isContado ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-900">Pago Completo</p>
                    <p className="text-sm text-green-700">
                      Tu pago ha sido procesado exitosamente
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-blue-900">Plan de Pagos a Plazos</p>
                      <p className="text-sm text-blue-700">
                        {paidInstallments} de {totalInstallments} cuotas pagadas
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${(paidInstallments / totalInstallments) * 100}%` }}
                    />
                  </div>

                  {paidInstallments < totalInstallments && (
                    <p className="text-sm text-gray-600">
                      Recuerda pagar las siguientes cuotas antes de sus fechas de vencimiento.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Próximos Pasos
            </h3>

            <div className="space-y-4">
              {/* Step 1: Email confirmation */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Confirmación por Email</p>
                  <p className="text-sm text-gray-600">
                    Recibirás un email de confirmación con todos los detalles de tu reservación.
                  </p>
                </div>
              </div>

              {/* Step 2: Complete traveler info */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Completa Datos de Viajeros</p>
                  <p className="text-sm text-gray-600">
                    Asegúrate de completar los datos de todos los viajeros antes de la fecha límite.
                  </p>
                </div>
              </div>

              {/* Step 3: Provider contact */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Contacto del Proveedor</p>
                  <p className="text-sm text-gray-600">
                    El proveedor se pondrá en contacto contigo para coordinar detalles finales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Download Voucher (TODO: Implement in FASE 6) */}
          <button
            onClick={handleDownloadVoucher}
            disabled={isDownloadingVoucher}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloadingVoucher ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Descargando...
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Descargar Voucher
              </>
            )}
          </button>

          {/* View Reservation */}
          <Link
            href={`/traveler/reservations/${reservation.id}`}
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Ver Detalles
          </Link>
        </div>

        {/* Back to Reservations */}
        <div className="mt-6 text-center">
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
