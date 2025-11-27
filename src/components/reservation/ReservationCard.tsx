'use client';

/**
 * Reservation Card Component
 *
 * Displays reservation summary in list view:
 * - Product name and type
 * - Reservation date and status
 * - Travelers count
 * - Total price
 * - Quick actions
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

interface ReservationCardProps {
  reservation: ReservationData;
  onClick?: () => void;
}

export default function ReservationCard({ reservation, onClick }: ReservationCardProps) {
  // Format date
  const reservationDate = new Date(reservation.reservation_date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get status info
  const getStatusInfo = (status: string): { label: string; color: string; bgColor: string } => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return {
          label: 'Confirmada',
          color: 'text-green-800',
          bgColor: 'bg-green-100'
        };
      case 'pending':
        return {
          label: 'Pendiente',
          color: 'text-yellow-800',
          bgColor: 'bg-yellow-100'
        };
      case 'cancelled':
        return {
          label: 'Cancelada',
          color: 'text-red-800',
          bgColor: 'bg-red-100'
        };
      case 'completed':
        return {
          label: 'Completada',
          color: 'text-blue-800',
          bgColor: 'bg-blue-100'
        };
      default:
        return {
          label: status,
          color: 'text-gray-800',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const statusInfo = getStatusInfo(reservation.status);

  // Get product type label
  const productTypeLabel = reservation.experience_type === 'circuit' ? 'Circuito' : 'Paquete';

  // Calculate travelers
  const totalTravelers = reservation.adults + reservation.kids + reservation.babys;

  // Check companions data completeness
  const hasCompanionsData = reservation.companions && reservation.companions.length > 0;
  const companionsComplete = hasCompanionsData && (reservation.companions?.length || 0) === totalTravelers;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-200 hover:border-blue-300"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Left: Reservation Info */}
          <div className="flex-1 min-w-0">
            {/* Product Type Badge */}
            <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded mb-2">
              {productTypeLabel}
            </span>

            {/* Reservation ID (short) */}
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              Reservación #{reservation.id.slice(0, 8)}
            </h3>

            {/* Date */}
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {reservationDate}
            </p>
          </div>

          {/* Right: Status Badge */}
          <div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
          {/* Travelers */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Viajeros</p>
            <div className="flex items-center gap-1">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="font-semibold text-gray-900">{totalTravelers}</span>
            </div>
          </div>

          {/* Price */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="font-semibold text-gray-900">
              ${reservation.total_price.toLocaleString('es-MX')} {reservation.currency}
            </p>
          </div>

          {/* Companions Status */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Datos</p>
            <div className="flex items-center gap-1">
              {companionsComplete ? (
                <>
                  <svg
                    className="w-5 h-5 text-green-500"
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
                  <span className="text-sm text-green-600 font-medium">Completo</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-yellow-500"
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
                  <span className="text-sm text-yellow-600 font-medium">Pendiente</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Hint */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {reservation.payment_method === 'CONTADO' ? 'Pago único' : 'Pago a plazos'}
          </p>

          <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
            Ver detalles
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
