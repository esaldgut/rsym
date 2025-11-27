'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// ✅ Migrado de @/lib/graphql/types a @/generated/graphql (GraphQL Code Generator)
import type { PaymentPlan } from '@/generated/graphql';

/**
 * ReservationsClient - Client Component para lista de reservaciones
 *
 * Maneja filtros, estado y navegación del cliente
 */

interface Reservation {
  id: string;
  experience_id: string;
  adults: number;
  kids: number;
  babys: number;
  total_price: number;
  status: string;
  reservationDate: string;
  payment_method?: string;
  type?: string;
  product?: {
    id: string;
    name: string;
    product_type: string;
    cover_image_url?: string;
  };
  paymentPlan?: PaymentPlan;
}

interface ReservationsClientProps {
  initialData: {
    success: boolean;
    data?: {
      reservations: Reservation[];
    };
    error?: string;
  };
}

type FilterStatus = 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export function ReservationsClient({ initialData }: ReservationsClientProps) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

  // Manejar error inicial
  if (!initialData.success || !initialData.data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-red-900 font-semibold mb-2">Error al cargar reservaciones</h3>
        <p className="text-red-800">{initialData.error || 'Error desconocido'}</p>
      </div>
    );
  }

  const allReservations = initialData.data.reservations;

  // Filtrar reservaciones por estado
  const filteredReservations = filterStatus === 'ALL'
    ? allReservations
    : allReservations.filter(r => r.status === filterStatus);

  // Renderizar estado vacío
  if (allReservations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes reservaciones aún</h3>
        <p className="text-gray-600 mb-6">
          Explora nuestro marketplace y reserva tu próxima aventura
        </p>
        <button
          onClick={() => router.push('/marketplace')}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
        >
          Explorar experiencias
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            label="Todas"
            count={allReservations.length}
            active={filterStatus === 'ALL'}
            onClick={() => setFilterStatus('ALL')}
          />
          <FilterButton
            label="En proceso"
            count={allReservations.filter(r => r.status === 'IN_PROGRESS').length}
            active={filterStatus === 'IN_PROGRESS'}
            onClick={() => setFilterStatus('IN_PROGRESS')}
          />
          <FilterButton
            label="Completadas"
            count={allReservations.filter(r => r.status === 'COMPLETED').length}
            active={filterStatus === 'COMPLETED'}
            onClick={() => setFilterStatus('COMPLETED')}
          />
          <FilterButton
            label="Canceladas"
            count={allReservations.filter(r => r.status === 'CANCELLED').length}
            active={filterStatus === 'CANCELLED'}
            onClick={() => setFilterStatus('CANCELLED')}
          />
        </div>
      </div>

      {/* Lista de reservaciones */}
      {filteredReservations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-600">No hay reservaciones con el filtro seleccionado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * FilterButton - Botón de filtro
 */
interface FilterButtonProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function FilterButton({ label, count, active, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label} ({count})
    </button>
  );
}

/**
 * ReservationCard - Tarjeta de reservación
 */
interface ReservationCardProps {
  reservation: Reservation;
}

function ReservationCard({ reservation }: ReservationCardProps) {
  const router = useRouter();

  const statusConfig = {
    IN_PROGRESS: {
      label: 'En proceso',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '⏳'
    },
    COMPLETED: {
      label: 'Completada',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✓'
    },
    CANCELLED: {
      label: 'Cancelada',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '✗'
    }
  };

  const status = statusConfig[reservation.status as keyof typeof statusConfig] || {
    label: reservation.status,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '•'
  };

  const totalTravelers = reservation.adults + reservation.kids + reservation.babys;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
        {/* Imagen del producto */}
        <div className="md:col-span-3">
          {reservation.product?.cover_image_url ? (
            <div className="relative w-full h-40 md:h-full rounded-xl overflow-hidden">
              <Image
                src={reservation.product.cover_image_url}
                alt={reservation.product.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-40 md:h-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
              <span className="text-4xl">🌍</span>
            </div>
          )}
        </div>

        {/* Detalles */}
        <div className="md:col-span-6 space-y-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {reservation.product?.name || 'Producto no disponible'}
            </h3>
            <p className="text-sm text-gray-600">
              {reservation.product?.product_type === 'circuit' ? 'Circuito' : 'Paquete'} •{' '}
              Reservación #{reservation.id.slice(0, 8)}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(reservation.reservationDate).toLocaleDateString('es-MX')}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{totalTravelers} viajero{totalTravelers !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>${reservation.total_price.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Plan Info */}
          {reservation.paymentPlan && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-900 font-medium">
                Plan de pago:{' '}
                {reservation.paymentPlan.payment_type_selected === 'CONTADO'
                  ? `Contado (${reservation.paymentPlan.cash_discount_percentage}% descuento)`
                  : `${reservation.paymentPlan.installment_number_of_payments} parcialidades`}
              </p>
            </div>
          )}
        </div>

        {/* Status y acciones */}
        <div className="md:col-span-3 flex flex-col justify-between items-end gap-4">
          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${status.color}`}>
            {status.icon} {status.label}
          </span>

          <button
            onClick={() => router.push(`/marketplace?product=${reservation.experience_id}`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </div>
  );
}
