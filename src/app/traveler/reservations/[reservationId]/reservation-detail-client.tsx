'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TripSummaryCard from '@/components/reservation/TripSummaryCard';
import TravelerInfoCard from '@/components/reservation/TravelerInfoCard';
import ProviderInfoCard from '@/components/reservation/ProviderInfoCard';
import PaymentPlanTracker from '@/components/reservation/PaymentPlanTracker';
import EditCompanionsWizard from '@/components/reservation/EditCompanionsWizard';
import ChangeDateWizard from '@/components/reservation/ChangeDateWizard';
import CancelReservationWizard from '@/components/reservation/CancelReservationWizard';

/**
 * Reservation Detail Client Component
 *
 * Main UI component for displaying reservation details.
 * Contains three main sections:
 * - Trip Summary (product info, dates, status)
 * - Traveler Information (companions, distribution)
 * - Provider Information (contact, rating)
 *
 * Part of Sprint 1: Fundamentos del Detalle de Viaje
 */

interface ReservationData {
  id: string;
  experience_id: string;
  experience_type?: string;
  user_id: string;
  adults: number;
  kids: number;
  babys: number;
  companions?: Array<{
    name: string;
    family_name: string;
    birthday: string;
    country: string;
    gender: string;
    passport_number: string;
  }>;
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

interface ProductData {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  itinerary?: string;
  planned_hotels_or_similar?: string[];
  destination?: Array<{
    place?: string;
    placeSub?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  }>;
  user_data?: {
    id: string;
    full_name?: string;
    profile_image?: string;
  };
}

interface PaymentPlan {
  id: string;
  reservation_id: string;
  total_amount: number;
  currency: string;
  plan_type: string;
  installments?: Array<{
    installment_number: number;
    amount: number;
    due_date: string;
    status: string;
  }>;
  cash_discount_amount?: number;
  allows_date_change?: boolean;
  change_deadline_days?: number;
  benefits_statements?: {
    stated: string;
  };
}

interface ReservationDetailClientProps {
  reservation: ReservationData;
  product: ProductData;
  paymentPlan: PaymentPlan | null;
  userId: string;
}

export default function ReservationDetailClient({
  reservation,
  product,
  paymentPlan,
  userId
}: ReservationDetailClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showEditCompanions, setShowEditCompanions] = useState(false);
  const [showChangeDate, setShowChangeDate] = useState(false);
  const [showCancelReservation, setShowCancelReservation] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Calculate totals for companions
  const totalTravelers = reservation.adults + reservation.kids + reservation.babys;
  const hasCompanionsData = reservation.companions && reservation.companions.length > 0;

  // Format reservation date
  const reservationDate = new Date(reservation.reservation_date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get primary destination
  const primaryDestination = product.destination?.[0];
  const destinationName = primaryDestination?.place || 'Destino no especificado';

  // Get status label
  const getStatusLabel = (status: string): { label: string; color: string } => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return { label: 'Confirmada', color: 'bg-green-100 text-green-800' };
      case 'pending':
        return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' };
      case 'cancelled':
        return { label: 'Cancelada', color: 'bg-red-100 text-red-800' };
      case 'completed':
        return { label: 'Completada', color: 'bg-blue-100 text-blue-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusInfo = getStatusLabel(reservation.status);

  // Handle MIT Payment - FASE 6
  const handlePayInstallment = async (installmentNumber: number) => {
    if (!paymentPlan) {
      console.error('❌ [ReservationDetailClient] No payment plan available');
      return;
    }

    console.log(`💳 [ReservationDetailClient] Iniciando pago de parcialidad ${installmentNumber}...`);
    setIsProcessingPayment(true);

    try {
      // Dynamic import to avoid server action in initial bundle
      const { initiateMITPaymentAction } = await import('@/lib/server/reservation-actions');

      const result = await initiateMITPaymentAction({
        reservationId: reservation.id,
        paymentPlanId: paymentPlan.id,
        installmentNumber
      });

      if (result.success && result.data?.checkoutUrl) {
        console.log('✅ [ReservationDetailClient] Checkout URL generado:', result.data.checkoutUrl);
        console.log('💰 [ReservationDetailClient] Monto:', result.data.amount, result.data.currency);

        // Redirect to MIT payment gateway
        window.location.href = result.data.checkoutUrl;
      } else {
        console.error('❌ [ReservationDetailClient] Error al generar pago:', result.error);
        alert(`Error al generar el pago: ${result.error || 'Error desconocido'}`);
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error('❌ [ReservationDetailClient] Error inesperado:', error);
      alert('Error inesperado al procesar el pago. Por favor intenta de nuevo.');
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a Mis Viajes
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>📍 {destinationName}</span>
            <span>📅 Reservado el {reservationDate}</span>
            <span className={`px-3 py-1 rounded-full font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Summary Card */}
            <TripSummaryCard product={product} reservation={reservation} />

            {/* Traveler Info Card */}
            <TravelerInfoCard
              reservation={reservation}
              onEdit={() => setShowEditCompanions(true)}
            />
          </div>

          {/* Right Column - Provider & Payment */}
          <div className="space-y-6">
            {/* Provider Info Card */}
            {product.user_data && (
              <ProviderInfoCard
                provider={{
                  id: product.user_data.id,
                  full_name: product.user_data.full_name,
                  profile_image: product.user_data.profile_image
                }}
              />
            )}

            {/* Payment Plan Tracker */}
            {paymentPlan && (
              <PaymentPlanTracker
                paymentPlan={paymentPlan}
                onChangeDate={() => setShowChangeDate(true)}
                onCancelReservation={() => setShowCancelReservation(true)}
                onPayInstallment={handlePayInstallment}
                isProcessingPayment={isProcessingPayment}
              />
            )}
          </div>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <details>
              <summary className="cursor-pointer font-semibold text-sm text-gray-700">
                Debug Info (Development Only)
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(
                  {
                    reservation: {
                      id: reservation.id,
                      status: reservation.status,
                      total_price: reservation.total_price,
                      travelers: { adults: reservation.adults, kids: reservation.kids, babys: reservation.babys }
                    },
                    product: {
                      id: product.id,
                      name: product.name,
                      type: product.product_type
                    },
                    paymentPlan: paymentPlan
                      ? {
                          id: paymentPlan.id,
                          type: paymentPlan.plan_type,
                          installments: paymentPlan.installments?.length
                        }
                      : null
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Edit Companions Wizard - FASE 2 */}
      {showEditCompanions && (
        <EditCompanionsWizard
          reservation={reservation}
          onClose={() => setShowEditCompanions(false)}
          onSuccess={() => {
            // Refresh the page to show updated data
            router.refresh();
          }}
        />
      )}

      {/* Change Date Wizard - FASE 3 */}
      {showChangeDate && paymentPlan && (
        <ChangeDateWizard
          reservation={reservation}
          paymentPlan={paymentPlan}
          product={product}
          onClose={() => setShowChangeDate(false)}
          onSuccess={() => {
            // Refresh the page to show updated data
            router.refresh();
          }}
        />
      )}

      {/* Cancel Reservation Wizard - FASE 4 */}
      {showCancelReservation && paymentPlan && (
        <CancelReservationWizard
          reservation={reservation}
          paymentPlan={paymentPlan}
          product={product}
          onClose={() => setShowCancelReservation(false)}
          onSuccess={() => {
            // Refresh the page to show updated data (cancelled status)
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
