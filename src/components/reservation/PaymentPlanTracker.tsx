'use client';

import { useState } from 'react';

/**
 * Payment Plan Tracker Component
 *
 * Displays payment plan information and tracking:
 * - Plan type (CONTADO vs PLAZOS)
 * - Total amount and currency
 * - Installments list with status
 * - Due dates and amounts
 * - Payment actions (future: MIT integration)
 * - Progress indicator
 *
 * Part of: Sprint 2 - Gestión de Pagos
 */

interface Installment {
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_date?: string;
}

interface PaymentPlan {
  id: string;
  reservation_id: string;
  total_amount: number;
  currency: string;
  plan_type: string; // 'CONTADO' | 'PLAZOS'
  installments?: Installment[];
  cash_discount_amount?: number;
  allows_date_change?: boolean;
  change_deadline_days?: number;
  benefits_statements?: {
    stated: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface PaymentPlanTrackerProps {
  paymentPlan: PaymentPlan;
  onPayInstallment?: (installmentNumber: number) => void; // FASE 6: MIT payment integration
  isProcessingPayment?: boolean; // FASE 6: Loading state during payment redirect
  onChangeDate?: () => void; // FASE 3: Open change date wizard
  onCancelReservation?: () => void; // FASE 4: Open cancel reservation wizard
}

export default function PaymentPlanTracker({
  paymentPlan,
  onPayInstallment,
  isProcessingPayment = false,
  onChangeDate,
  onCancelReservation
}: PaymentPlanTrackerProps) {
  const [expandedInstallment, setExpandedInstallment] = useState<number | null>(null);

  const isContado = paymentPlan.plan_type === 'CONTADO';
  const hasInstallments = paymentPlan.installments && paymentPlan.installments.length > 0;

  // Calculate progress
  const paidInstallments = paymentPlan.installments?.filter(i =>
    i.status.toLowerCase() === 'paid' || i.status.toLowerCase() === 'completed'
  ).length || 0;
  const totalInstallments = paymentPlan.installments?.length || 1;
  const progressPercentage = (paidInstallments / totalInstallments) * 100;

  // Get next pending installment
  const nextPending = paymentPlan.installments?.find(i =>
    i.status.toLowerCase() === 'pending' || i.status.toLowerCase() === 'due'
  );

  // Get installment status info
  const getStatusInfo = (status: string): { label: string; color: string; icon: string } => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return {
          label: 'Pagado',
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: '✓'
        };
      case 'pending':
        return {
          label: 'Pendiente',
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: '○'
        };
      case 'due':
      case 'overdue':
        return {
          label: 'Vencido',
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: '!'
        };
      default:
        return {
          label: status,
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: '○'
        };
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Check if date is near (within 7 days)
  const isDateNear = (dateString: string): boolean => {
    try {
      const dueDate = new Date(dateString);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    } catch {
      return false;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Plan de Pagos</h2>
            <p className="text-sm text-gray-600">
              {isContado ? 'Pago único (CONTADO)' : `Pago a plazos (${totalInstallments} pagos)`}
            </p>
          </div>

          {/* Total Amount */}
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">
              ${paymentPlan.total_amount.toLocaleString('es-MX')}
            </p>
            <p className="text-sm text-gray-600">{paymentPlan.currency}</p>
          </div>
        </div>

        {/* Progress Bar (only for installments) */}
        {!isContado && hasInstallments && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progreso</span>
              <span className="text-sm font-semibold text-gray-900">
                {paidInstallments} / {totalInstallments} pagos completados
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Benefits/Discount (if any) */}
      {(paymentPlan.cash_discount_amount || paymentPlan.benefits_statements) && (
        <div className="px-6 py-4 bg-green-50 border-b border-green-100">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
            <div>
              {paymentPlan.cash_discount_amount && (
                <p className="text-sm font-medium text-green-900">
                  Descuento de ${paymentPlan.cash_discount_amount.toLocaleString('es-MX')}{' '}
                  {paymentPlan.currency}
                </p>
              )}
              {paymentPlan.benefits_statements && (
                <p className="text-sm text-green-700 mt-1">
                  {paymentPlan.benefits_statements.stated}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Installments List */}
      {hasInstallments ? (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parcialidades</h3>
          <div className="space-y-3">
            {paymentPlan.installments!.map((installment) => {
              const statusInfo = getStatusInfo(installment.status);
              const isExpanded = expandedInstallment === installment.installment_number;
              const isNearDue = isDateNear(installment.due_date);

              return (
                <div
                  key={installment.installment_number}
                  className={`border rounded-lg overflow-hidden transition-all ${statusInfo.color}`}
                >
                  {/* Installment Header */}
                  <button
                    onClick={() =>
                      setExpandedInstallment(isExpanded ? null : installment.installment_number)
                    }
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Status Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          statusInfo.color
                        }`}
                      >
                        {statusInfo.icon}
                      </div>

                      {/* Installment Info */}
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          Pago {installment.installment_number} de {totalInstallments}
                        </p>
                        <p className="text-sm text-gray-600">
                          Vence: {formatDate(installment.due_date)}
                          {isNearDue && (
                            <span className="ml-2 text-orange-600 font-medium">
                              (Próximo vencimiento)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Amount */}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${installment.amount.toLocaleString('es-MX')}
                        </p>
                        <p className="text-sm text-gray-600">{statusInfo.label}</p>
                      </div>

                      {/* Expand Icon */}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Installment Details (Expanded) */}
                  {isExpanded && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-gray-600 font-medium">Monto</dt>
                          <dd className="text-gray-900 mt-1">
                            ${installment.amount.toLocaleString('es-MX')} {paymentPlan.currency}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-600 font-medium">Estado</dt>
                          <dd className="text-gray-900 mt-1">{statusInfo.label}</dd>
                        </div>

                        <div>
                          <dt className="text-gray-600 font-medium">Fecha de vencimiento</dt>
                          <dd className="text-gray-900 mt-1">{formatDate(installment.due_date)}</dd>
                        </div>

                        {installment.paid_date && (
                          <div>
                            <dt className="text-gray-600 font-medium">Fecha de pago</dt>
                            <dd className="text-gray-900 mt-1">
                              {formatDate(installment.paid_date)}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {/* Pay Button - FASE 6: MIT Payment Integration */}
                      {(installment.status.toLowerCase() === 'pending' ||
                        installment.status.toLowerCase() === 'due') && (
                        <button
                          onClick={() => onPayInstallment?.(installment.installment_number)}
                          disabled={!onPayInstallment || isProcessingPayment}
                          className={`mt-4 w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                            onPayInstallment && !isProcessingPayment
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isProcessingPayment ? (
                            <>
                              <svg className="animate-spin h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Procesando...
                            </>
                          ) : onPayInstallment ? (
                            'Pagar ahora'
                          ) : (
                            'Pago en línea próximamente'
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Single Payment (CONTADO) */
        <div className="p-6">
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">Pago único</p>
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  ${paymentPlan.total_amount.toLocaleString('es-MX')} {paymentPlan.currency}
                </p>
                <p className="text-sm text-gray-600">
                  Este plan requiere un solo pago para confirmar tu reservación
                </p>
              </div>
            </div>

            {/* Pay Button - FASE 6: MIT Payment Integration */}
            <button
              onClick={() => onPayInstallment?.(1)}
              disabled={!onPayInstallment || isProcessingPayment}
              className={`mt-4 w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                onPayInstallment && !isProcessingPayment
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessingPayment ? (
                <>
                  <svg className="animate-spin h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </>
              ) : onPayInstallment ? (
                'Pagar ahora'
              ) : (
                'Pago en línea próximamente'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Change Date Policy (if applicable) - FASE 3 */}
      {paymentPlan.allows_date_change && paymentPlan.change_deadline_days && (
        <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-900">Cambio de fecha disponible</p>
                <p className="text-sm text-amber-700 mt-1">
                  Puedes cambiar la fecha de tu viaje hasta {paymentPlan.change_deadline_days} días
                  antes de la salida
                </p>
              </div>
            </div>

            {/* Change Date Button */}
            {onChangeDate && (
              <button
                onClick={onChangeDate}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0"
              >
                Cambiar Fecha
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Policy - FASE 4 */}
      {paymentPlan.allows_cancellation !== false && (
        <div className="px-6 py-4 bg-red-50 border-t border-red-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
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

              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Política de Cancelación
                </p>
                <p className="text-xs text-red-700">
                  {paymentPlan.cancellation_deadline_days ? (
                    <>
                      Puedes cancelar hasta <span className="font-semibold">{paymentPlan.cancellation_deadline_days} días</span> antes del viaje.
                      El reembolso dependerá de la fecha de cancelación según la política establecida.
                    </>
                  ) : (
                    <>
                      Puedes cancelar esta reservación en cualquier momento.
                      El reembolso dependerá de la fecha de cancelación según la política establecida.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Cancel Reservation Button */}
            {onCancelReservation && (
              <button
                onClick={onCancelReservation}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
              >
                Cancelar Reservación
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
