'use client';

/**
 * Cancel Confirmation Step
 *
 * Final confirmation step before canceling reservation.
 * Shows critical warnings and requires explicit confirmation.
 *
 * Features:
 * - Summary of reservation being cancelled
 * - Refund amount confirmation
 * - Critical warnings about consequences
 * - Checkbox confirmation required
 * - Disabled confirm button until checked
 */

import { useState } from 'react';
import type { RefundData } from './RefundCalculator';

/**
 * Reservation Data (minimal required)
 */
interface ReservationData {
  id: string;
  adults: number;
  kids: number;
  babys: number;
  reservation_date: string;
  total_price: number;
  currency: string;
}

/**
 * Product Data (minimal required)
 */
interface ProductData {
  id: string;
  name: string;
  product_type: string;
}

/**
 * CancelConfirmationStep Props
 */
interface CancelConfirmationStepProps {
  reservation: ReservationData;
  product: ProductData;
  refundData: RefundData;
  cancellationReason: string;
  onBack: () => void;
  onConfirm: () => void;
  isCancelling: boolean;
}

export default function CancelConfirmationStep({
  reservation,
  product,
  refundData,
  cancellationReason,
  onBack,
  onConfirm,
  isCancelling
}: CancelConfirmationStepProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: reservation.currency || 'MXN'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const hasRefund = refundData.netRefund > 0;
  const totalTravelers = reservation.adults + reservation.kids + reservation.babys;

  return (
    <div className="space-y-6">
      {/* Critical Warning Header */}
      <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-lg font-bold text-red-900 mb-2">
              ¿Estás seguro que deseas cancelar esta reservación?
            </p>
            <p className="text-sm text-red-800">
              Esta acción es <span className="font-bold">irreversible</span>. Por favor lee cuidadosamente la información antes de confirmar.
            </p>
          </div>
        </div>
      </div>

      {/* Reservation Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <h3 className="text-base font-bold text-gray-900 mb-4">Resumen de Reservación</h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-700">Producto:</span>
            <span className="text-sm font-medium text-gray-900">{product.name}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-700">Tipo:</span>
            <span className="text-sm font-medium text-gray-900 capitalize">{product.product_type}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-700">Fecha de Viaje:</span>
            <span className="text-sm font-medium text-gray-900">{formatDate(reservation.reservation_date)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-700">Viajeros:</span>
            <span className="text-sm font-medium text-gray-900">
              {totalTravelers} ({reservation.adults} adultos, {reservation.kids} niños, {reservation.babys} bebés)
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-700">Total de Reservación:</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(reservation.total_price)}</span>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-300">
            <span className="text-sm text-gray-700">Motivo de Cancelación:</span>
            <span className="text-sm font-medium text-gray-900">{cancellationReason}</span>
          </div>
        </div>
      </div>

      {/* Refund Information */}
      <div className={`border-2 rounded-lg p-5 ${
        hasRefund
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <h3 className={`text-base font-bold mb-4 ${
          hasRefund ? 'text-green-900' : 'text-red-900'
        }`}>
          Información de Reembolso
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={`text-sm ${hasRefund ? 'text-green-800' : 'text-red-800'}`}>
              Total Pagado:
            </span>
            <span className={`text-sm font-medium ${hasRefund ? 'text-green-900' : 'text-red-900'}`}>
              {formatCurrency(refundData.totalPaid)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className={`text-sm ${hasRefund ? 'text-green-800' : 'text-red-800'}`}>
              Porcentaje de Reembolso:
            </span>
            <span className={`text-sm font-medium ${hasRefund ? 'text-green-900' : 'text-red-900'}`}>
              {refundData.refundPercentage}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className={`text-sm ${hasRefund ? 'text-green-800' : 'text-red-800'}`}>
              Comisión por Procesamiento:
            </span>
            <span className={`text-sm font-medium ${hasRefund ? 'text-green-900' : 'text-red-900'}`}>
              {formatCurrency(refundData.processingFee)}
            </span>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-300">
            <span className={`text-base font-bold ${hasRefund ? 'text-green-900' : 'text-red-900'}`}>
              Reembolso Neto:
            </span>
            <span className={`text-lg font-bold ${hasRefund ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(refundData.netRefund)}
            </span>
          </div>
        </div>

        {hasRefund && (
          <div className="mt-4 pt-4 border-t border-green-300">
            <p className="text-xs text-green-800">
              El reembolso se procesará en 5-7 días hábiles y será depositado en tu método de pago original.
            </p>
          </div>
        )}
      </div>

      {/* Critical Consequences */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
        <h3 className="text-base font-bold text-amber-900 mb-3">
          Consecuencias de la Cancelación
        </h3>

        <ul className="space-y-2 text-sm text-amber-900">
          <li className="flex gap-2">
            <span className="text-amber-600 mt-0.5 font-bold">⚠️</span>
            <span>
              <span className="font-semibold">No podrás recuperar esta reservación</span> una vez cancelada
            </span>
          </li>

          <li className="flex gap-2">
            <span className="text-amber-600 mt-0.5 font-bold">⚠️</span>
            <span>
              La reservación se marcará como <span className="font-semibold">CANCELADA</span> inmediatamente
            </span>
          </li>

          <li className="flex gap-2">
            <span className="text-amber-600 mt-0.5 font-bold">⚠️</span>
            <span>
              {hasRefund ? (
                <>
                  El reembolso de <span className="font-semibold">{formatCurrency(refundData.netRefund)}</span> puede tardar hasta <span className="font-semibold">7 días hábiles</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">No recibirás ningún reembolso</span> según la política de cancelación
                </>
              )}
            </span>
          </li>

          <li className="flex gap-2">
            <span className="text-amber-600 mt-0.5 font-bold">⚠️</span>
            <span>
              Si decides volver a reservar, los <span className="font-semibold">precios pueden haber cambiado</span>
            </span>
          </li>

          <li className="flex gap-2">
            <span className="text-amber-600 mt-0.5 font-bold">⚠️</span>
            <span>
              El proveedor será notificado de la cancelación y tu lugar quedará disponible para otros viajeros
            </span>
          </li>
        </ul>
      </div>

      {/* Confirmation Checkbox */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
          />
          <div>
            <p className="text-base font-semibold text-gray-900 mb-1">
              Confirmo que he leído y entiendo las consecuencias
            </p>
            <p className="text-sm text-gray-600">
              Entiendo que esta acción es irreversible y acepto los términos de cancelación y reembolso descritos arriba.
            </p>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isCancelling}
          className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Revisar Reembolso
        </button>

        <button
          onClick={onConfirm}
          disabled={!isConfirmed || isCancelling}
          className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isCancelling ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cancelando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Confirmar Cancelación
            </>
          )}
        </button>
      </div>

      {/* Final Warning */}
      {!isConfirmed && (
        <div className="text-center">
          <p className="text-sm text-gray-500 italic">
            Debes confirmar que has leído las consecuencias para proceder con la cancelación
          </p>
        </div>
      )}
    </div>
  );
}
