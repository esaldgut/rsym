/**
 * PaymentPlanSummary Component
 *
 * Displays the calculated PaymentPlan from backend with CONTADO vs PLAZOS comparison.
 * Shows discount details, payment schedule, and all 23 PaymentPlan fields.
 *
 * ARQUITECTURA:
 * - Client Component para interactividad
 * - Displays backend-calculated prices (NO frontend calculations)
 * - Side-by-side comparison for CONTADO vs PLAZOS
 * - Payment schedule for installments
 * - Change policy information
 *
 * @module PaymentPlanSummary
 */
'use client';

import type { PaymentPlan } from '@/lib/graphql/types';

export interface PaymentPlanSummaryProps {
  paymentPlan: PaymentPlan;
  selectedType: 'CONTADO' | 'PLAZOS';
}

export function PaymentPlanSummary({ paymentPlan, selectedType }: PaymentPlanSummaryProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Plan de Pago Calculado
      </h3>

      {/* Comparison Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* CONTADO Column */}
        <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
          selectedType === 'CONTADO'
            ? 'border-purple-600 bg-white shadow-lg scale-[1.02]'
            : 'border-gray-200 bg-white/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">💵 Pago de Contado</h4>
            {selectedType === 'CONTADO' && (
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Precio original:</span>
              <span className="font-medium">${paymentPlan.total_cost.toLocaleString()}</span>
            </div>

            {paymentPlan.cash_discount_percentage > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento ({paymentPlan.cash_discount_percentage}%):</span>
                <span className="font-medium">
                  -${paymentPlan.cash_discount_amount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="font-bold text-gray-900">Total a pagar:</span>
              <span className="text-xl font-bold text-purple-600">
                ${paymentPlan.cash_final_amount.toLocaleString()}
              </span>
            </div>

            {paymentPlan.cash_payment_deadline && (
              <p className="text-xs text-gray-600 mt-2">
                📅 Fecha límite de pago: {new Date(paymentPlan.cash_payment_deadline).toLocaleDateString('es-MX')}
              </p>
            )}
          </div>
        </div>

        {/* PLAZOS Column */}
        <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
          selectedType === 'PLAZOS'
            ? 'border-purple-600 bg-white shadow-lg scale-[1.02]'
            : 'border-gray-200 bg-white/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">💳 Pago en Plazos</h4>
            {selectedType === 'PLAZOS' && (
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Enganche ({paymentPlan.installment_down_payment_percentage}%):</span>
              <span className="font-medium">${paymentPlan.installment_down_payment_amount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cuotas mensuales:</span>
              <span className="font-medium">
                {paymentPlan.installment_number_of_payments} x ${paymentPlan.installment_amount_per_payment.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="font-bold text-gray-900">Total a pagar:</span>
              <span className="text-xl font-bold text-purple-600">
                ${paymentPlan.installment_total_amount.toLocaleString()}
              </span>
            </div>

            <div className="text-xs text-gray-600 mt-2 space-y-1">
              <p>📅 Primera cuota: {new Date(paymentPlan.installment_first_payment_deadline).toLocaleDateString('es-MX')}</p>
              <p>📅 Última cuota debe pagarse {paymentPlan.installment_available_days} días antes del viaje</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Schedule (if PLAZOS selected) */}
      {selectedType === 'PLAZOS' && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendario de Pagos
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha del viaje:</span>
              <span className="font-medium">{new Date(paymentPlan.travel_date).toLocaleDateString('es-MX')}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Primera cuota:</span>
              <span className="font-medium">{new Date(paymentPlan.installment_first_payment_deadline).toLocaleDateString('es-MX')}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Frecuencia de pagos:</span>
              <span className="font-medium">Cada {paymentPlan.installment_frequency_days} días</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Total de cuotas:</span>
              <span className="font-medium">{paymentPlan.installment_number_of_payments} cuotas</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Monto por cuota:</span>
              <span className="font-medium">${paymentPlan.installment_amount_per_payment.toLocaleString()}</span>
            </div>
          </div>

          {/* Warning about payment deadline */}
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium">
                  ⚠️ Importante: Todas las cuotas deben estar pagadas al menos <strong>{paymentPlan.installment_available_days} días antes</strong> de la fecha del viaje.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Policy */}
      {paymentPlan.allows_date_change && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Política de Cambios
          </h4>
          <p className="text-sm text-blue-800">
            ✓ Se permiten cambios de fecha hasta <strong>{paymentPlan.change_deadline_days} días antes</strong> del viaje.
          </p>
        </div>
      )}

      {/* Benefits Statements (if available) */}
      {paymentPlan.benefits_statements && paymentPlan.benefits_statements.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">✨ Beneficios</h4>
          <ul className="space-y-1">
            {paymentPlan.benefits_statements.map((benefit, idx) => (
              <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Currency Note */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Todos los precios en {paymentPlan.currency} • Calculado por el sistema de precios seguro del backend
      </p>
    </div>
  );
}
