'use client';

/**
 * Refund Calculator Component
 *
 * Calculates refund amount based on:
 * - Days before travel date
 * - Total amount paid
 * - Refund policy from payment plan
 * - Processing fees
 *
 * Refund Policy Logic (Default):
 * - 30+ days before: 90% refund
 * - 15-29 days before: 70% refund
 * - 7-14 days before: 50% refund
 * - Less than 7 days: 20% refund
 *
 * Processing Fee: 3% of refund amount (max $500 MXN)
 */

import { useEffect, useState } from 'react';

/**
 * Reservation Data (minimal required)
 */
interface ReservationData {
  id: string;
  total_price: number;
  currency: string;
  reservation_date: string;
}

/**
 * Payment Plan Data
 */
interface PaymentPlanData {
  id: string;
  plan_type: string;
  total_cost: number;
  installments?: Array<{
    installment_number: number;
    amount: number;
    status: string;
    paid_date?: string;
  }>;
  refund_percentage_by_days?: Array<{
    days_before: number;
    refund_percentage: number;
  }>;
}

/**
 * Refund Data
 */
export interface RefundData {
  totalPaid: number;
  refundAmount: number;
  refundPercentage: number;
  daysBeforeTravel: number;
  processingFee: number;
  netRefund: number;
}

/**
 * RefundCalculator Props
 */
interface RefundCalculatorProps {
  reservation: ReservationData;
  paymentPlan: PaymentPlanData;
  daysBeforeTravel: number;
  onCalculated: (refundData: RefundData) => void;
  onBack: () => void;
}

/**
 * Default Refund Policy (if not provided by backend)
 */
const DEFAULT_REFUND_POLICY = [
  { days_before: 30, refund_percentage: 90 },
  { days_before: 15, refund_percentage: 70 },
  { days_before: 7, refund_percentage: 50 },
  { days_before: 0, refund_percentage: 20 }
];

export default function RefundCalculator({
  reservation,
  paymentPlan,
  daysBeforeTravel,
  onCalculated,
  onBack
}: RefundCalculatorProps) {
  const [calculatedRefund, setCalculatedRefund] = useState<RefundData | null>(null);

  useEffect(() => {
    calculateRefund();
  }, []);

  const calculateRefund = () => {
    console.log('[RefundCalculator] 💰 Calculando reembolso...');

    // STEP 1: Calculate total paid
    const paidInstallments = paymentPlan.installments?.filter(i =>
      i.status.toLowerCase() === 'paid' || i.status.toLowerCase() === 'completed'
    ) || [];

    const totalPaid = paidInstallments.reduce((sum, inst) => sum + inst.amount, 0);

    console.log('[RefundCalculator] Total pagado:', totalPaid);

    // STEP 2: Get refund policy
    const refundPolicy = paymentPlan.refund_percentage_by_days || DEFAULT_REFUND_POLICY;

    // STEP 3: Determine refund percentage based on days before travel
    let refundPercentage = 0;

    // Sort policy by days_before descending
    const sortedPolicy = [...refundPolicy].sort((a, b) => b.days_before - a.days_before);

    for (const tier of sortedPolicy) {
      if (daysBeforeTravel >= tier.days_before) {
        refundPercentage = tier.refund_percentage;
        break;
      }
    }

    console.log('[RefundCalculator] Días antes del viaje:', daysBeforeTravel);
    console.log('[RefundCalculator] Porcentaje de reembolso:', refundPercentage);

    // STEP 4: Calculate refund amount
    const refundAmount = (totalPaid * refundPercentage) / 100;

    // STEP 5: Calculate processing fee (3% of refund, max 500 MXN)
    const processingFeePercentage = 3;
    let processingFee = (refundAmount * processingFeePercentage) / 100;
    const maxProcessingFee = 500; // MXN

    if (processingFee > maxProcessingFee) {
      processingFee = maxProcessingFee;
    }

    // STEP 6: Calculate net refund
    const netRefund = refundAmount - processingFee;

    const refundData: RefundData = {
      totalPaid,
      refundAmount,
      refundPercentage,
      daysBeforeTravel,
      processingFee,
      netRefund: Math.max(0, netRefund) // Never negative
    };

    console.log('[RefundCalculator] ✅ Reembolso calculado:', refundData);

    setCalculatedRefund(refundData);
  };

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

  // Get refund policy to display
  const refundPolicy = paymentPlan.refund_percentage_by_days || DEFAULT_REFUND_POLICY;
  const sortedPolicy = [...refundPolicy].sort((a, b) => b.days_before - a.days_before);

  if (!calculatedRefund) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Calculando reembolso...</p>
        </div>
      </div>
    );
  }

  const hasRefund = calculatedRefund.netRefund > 0;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-base font-semibold text-red-900 mb-1">
              Cálculo de Reembolso
            </p>
            <p className="text-sm text-red-800">
              Este es el reembolso estimado basado en la política de cancelación y los pagos realizados.
            </p>
          </div>
        </div>
      </div>

      {/* Travel Date Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Fecha de Viaje</h3>
          <p className="text-base text-gray-900">{formatDate(reservation.reservation_date)}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Días Hasta el Viaje</h3>
          <p className="text-base text-gray-900">{calculatedRefund.daysBeforeTravel} días</p>
        </div>
      </div>

      {/* Refund Policy Table */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Política de Reembolso</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Días Antes del Viaje</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Porcentaje de Reembolso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPolicy.map((tier, index) => {
                const isCurrentTier = calculatedRefund.daysBeforeTravel >= tier.days_before &&
                                     (index === 0 || calculatedRefund.daysBeforeTravel < sortedPolicy[index - 1].days_before);

                return (
                  <tr key={index} className={isCurrentTier ? 'bg-red-50' : 'bg-white'}>
                    <td className={`px-4 py-3 text-sm ${isCurrentTier ? 'font-semibold text-red-900' : 'text-gray-700'}`}>
                      {tier.days_before === 0 ? 'Menos de 7 días' : `${tier.days_before}+ días`}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isCurrentTier ? 'font-semibold text-red-900' : 'text-gray-700'}`}>
                      {tier.refund_percentage}%
                      {isCurrentTier && (
                        <span className="ml-2 text-xs text-red-600">← Tu cancelación</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Calculation Breakdown */}
      <div className={`border-2 rounded-lg p-6 ${
        hasRefund
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${
          hasRefund ? 'text-green-900' : 'text-red-900'
        }`}>
          Desglose de Reembolso
        </h3>

        <div className="space-y-3">
          {/* Total Paid */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-300">
            <span className="text-sm text-gray-700">Total Pagado</span>
            <span className="text-base font-medium text-gray-900">
              {formatCurrency(calculatedRefund.totalPaid)}
            </span>
          </div>

          {/* Refund Percentage */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Porcentaje de Reembolso Aplicable</span>
            <span className="text-base font-medium text-gray-900">
              {calculatedRefund.refundPercentage}%
            </span>
          </div>

          {/* Refund Amount (before fees) */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Reembolso (antes de comisiones)</span>
            <span className="text-base font-medium text-gray-900">
              {formatCurrency(calculatedRefund.refundAmount)}
            </span>
          </div>

          {/* Processing Fee */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-300">
            <span className="text-sm text-gray-700">
              Comisión por Procesamiento (3%, máx. $500)
            </span>
            <span className="text-base font-medium text-red-600">
              - {formatCurrency(calculatedRefund.processingFee)}
            </span>
          </div>

          {/* Net Refund */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-base font-bold text-gray-900">
              Reembolso Neto a Recibir
            </span>
            <span className={`text-xl font-bold ${
              hasRefund ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(calculatedRefund.netRefund)}
            </span>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      {hasRefund ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Información del Reembolso</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>El reembolso se procesará en un plazo de 5-7 días hábiles</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>El monto será devuelto al método de pago original</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Recibirás un correo de confirmación con los detalles</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>La comisión por procesamiento es retenida por el procesador de pagos</span>
            </li>
          </ul>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900 mb-1">Sin Reembolso Disponible</p>
              <p className="text-sm text-amber-800">
                Debido a la proximidad de la fecha de viaje, no hay reembolso disponible según la política de cancelación. Sin embargo, tu reservación será cancelada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
        >
          ← Anterior
        </button>

        <button
          onClick={() => onCalculated(calculatedRefund)}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-900 transition-colors"
        >
          Continuar con Cancelación →
        </button>
      </div>
    </div>
  );
}
