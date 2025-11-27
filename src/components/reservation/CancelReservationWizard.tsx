'use client';

/**
 * Cancel Reservation Wizard
 *
 * Multi-step wizard for canceling a reservation with refund calculation
 *
 * Steps:
 * 1. Cancel Reason - User selects cancellation reason
 * 2. Refund Preview - Shows refund calculation based on policy
 * 3. Confirm - Final confirmation with warnings
 * 4. Completed - Success message
 *
 * Features:
 * - Calculates refund based on days before travel date
 * - Shows refund policy from payment plan
 * - Validates if cancellation is allowed
 * - Processes refund via MIT Payment Gateway (if applicable)
 * - Updates reservation status to CANCELLED
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RefundCalculator from './RefundCalculator';
import CancelConfirmationStep from './CancelConfirmationStep';

/**
 * Wizard Steps
 */
type WizardStep = 'reason' | 'refund' | 'confirm' | 'completed';

/**
 * Cancellation Reasons
 */
const CANCELLATION_REASONS = [
  { value: 'personal', label: 'Motivos personales' },
  { value: 'schedule_conflict', label: 'Conflicto de agenda' },
  { value: 'health', label: 'Motivos de salud' },
  { value: 'financial', label: 'Motivos económicos' },
  { value: 'found_better_option', label: 'Encontré mejor opción' },
  { value: 'trip_cancelled', label: 'Viaje cancelado' },
  { value: 'other', label: 'Otro motivo' }
];

/**
 * Reservation Data (minimal required)
 */
interface ReservationData {
  id: string;
  experience_id: string;
  adults: number;
  kids: number;
  babys: number;
  reservation_date: string;
  total_price: number;
  currency: string;
  status: string;
}

/**
 * Payment Plan Data
 */
interface PaymentPlanData {
  id: string;
  plan_type: string;
  total_cost: number;
  currency: string;
  installments?: Array<{
    installment_number: number;
    amount: number;
    due_date: string;
    status: string;
    paid_date?: string;
  }>;
  // Refund policy fields (to be added by backend)
  allows_cancellation?: boolean;
  cancellation_deadline_days?: number;
  refund_percentage_by_days?: Array<{
    days_before: number;
    refund_percentage: number;
  }>;
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
 * Refund Calculation Result
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
 * CancelReservationWizard Props
 */
interface CancelReservationWizardProps {
  reservation: ReservationData;
  paymentPlan: PaymentPlanData;
  product: ProductData;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CancelReservationWizard({
  reservation,
  paymentPlan,
  product,
  onClose,
  onSuccess
}: CancelReservationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('reason');
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalComments, setAdditionalComments] = useState<string>('');
  const [refundData, setRefundData] = useState<RefundData | null>(null);

  // Check if cancellation is allowed
  const isCancellationAllowed = paymentPlan.allows_cancellation ?? true; // Default to true if not specified
  const cancellationDeadlineDays = paymentPlan.cancellation_deadline_days || 0;

  // Calculate days before travel
  const today = new Date();
  const travelDate = new Date(reservation.reservation_date);
  const daysBeforeTravel = Math.ceil((travelDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Check if past cancellation deadline
  const isPastDeadline = cancellationDeadlineDays > 0 && daysBeforeTravel < cancellationDeadlineDays;

  // Check if already cancelled
  const isAlreadyCancelled = reservation.status.toLowerCase() === 'cancelled' ||
                             reservation.status.toLowerCase() === 'canceled';

  // Handle step navigation
  const handleReasonSelected = useCallback(() => {
    if (!selectedReason) {
      alert('Por favor selecciona un motivo de cancelación');
      return;
    }

    console.log('[CancelReservationWizard] 📝 Motivo seleccionado:', selectedReason);
    setCurrentStep('refund');
  }, [selectedReason]);

  const handleRefundCalculated = useCallback((calculatedRefund: RefundData) => {
    console.log('[CancelReservationWizard] 💰 Refund calculado:', calculatedRefund);
    setRefundData(calculatedRefund);
    setCurrentStep('confirm');
  }, []);

  const handleBackToReason = useCallback(() => {
    setCurrentStep('reason');
  }, []);

  const handleBackToRefund = useCallback(() => {
    setCurrentStep('refund');
  }, []);

  const handleConfirmCancellation = useCallback(async () => {
    if (!refundData) {
      console.error('[CancelReservationWizard] ❌ No hay datos de refund');
      return;
    }

    console.log('[CancelReservationWizard] 🚫 Confirmando cancelación...');
    setIsCancelling(true);

    try {
      // Import server action dynamically
      const { cancelReservationAction } = await import('@/lib/server/reservation-actions');

      // Call server action
      const result = await cancelReservationAction({
        reservationId: reservation.id,
        paymentPlanId: paymentPlan.id,
        cancellationReason: selectedReason,
        additionalComments: additionalComments || undefined,
        refundAmount: refundData.netRefund,
        totalPaid: refundData.totalPaid
      });

      if (!result.success) {
        console.error('[CancelReservationWizard] ❌ Error:', result.error);
        alert(`Error al cancelar: ${result.error}`);
        return;
      }

      console.log('[CancelReservationWizard] ✅ Reservación cancelada exitosamente');

      // Move to completion step
      setCurrentStep('completed');

      // Refresh page data after success
      router.refresh();

    } catch (error) {
      console.error('[CancelReservationWizard] ❌ Error cancelando reservación:', error);
      alert('Error al cancelar la reservación. Por favor intenta de nuevo.');
    } finally {
      setIsCancelling(false);
    }
  }, [reservation.id, paymentPlan.id, selectedReason, additionalComments, refundData, router]);

  const handleComplete = useCallback(() => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  }, [onClose, onSuccess]);

  // Handle cancel with confirmation
  const handleCancel = () => {
    if (currentStep !== 'completed' && currentStep !== 'reason') {
      const confirmed = window.confirm(
        '¿Estás seguro? El proceso de cancelación no se completará.'
      );
      if (!confirmed) return;
    }

    onClose();
  };

  // Progress calculation
  const stepProgress = {
    'reason': 25,
    'refund': 50,
    'confirm': 75,
    'completed': 100
  };

  // If already cancelled, show info
  if (isAlreadyCancelled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            {/* Info Icon */}
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Reservación Ya Cancelada
            </h3>
            <p className="text-gray-600 mb-6">
              Esta reservación ya fue cancelada anteriormente.
            </p>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If cancellation not allowed, show error
  if (!isCancellationAllowed) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Cancelación No Permitida
            </h3>
            <p className="text-gray-600 mb-6">
              El plan de pagos seleccionado no permite cancelaciones. Por favor contacta a soporte.
            </p>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If past deadline, show warning
  if (isPastDeadline) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            {/* Warning Icon */}
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Fecha Límite de Cancelación Vencida
            </h3>
            <p className="text-gray-600 mb-2">
              El plazo para cancelar con reembolso ha vencido.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Se requieren al menos {cancellationDeadlineDays} días antes del viaje. Días restantes: {daysBeforeTravel}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  // Allow cancellation but with 0% refund
                  setCurrentStep('reason');
                }}
                className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
              >
                Cancelar Sin Reembolso
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Cancelar Reservación
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-red-500 to-red-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stepProgress[currentStep]}%` }}
            />
          </div>

          {/* Step Indicator */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className={currentStep === 'reason' ? 'text-red-600 font-semibold' : 'text-gray-500'}>
              1. Motivo
            </span>
            <span className={currentStep === 'refund' ? 'text-red-600 font-semibold' : 'text-gray-500'}>
              2. Reembolso
            </span>
            <span className={currentStep === 'confirm' ? 'text-red-600 font-semibold' : 'text-gray-500'}>
              3. Confirmar
            </span>
            <span className={currentStep === 'completed' ? 'text-red-600 font-semibold' : 'text-gray-500'}>
              4. Completado
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'reason' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-base font-semibold text-red-900 mb-1">
                      ¿Estás seguro que deseas cancelar?
                    </p>
                    <p className="text-sm text-red-800">
                      Esta acción no se puede deshacer. Por favor selecciona el motivo de tu cancelación.
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Producto</h3>
                <p className="text-base text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600 capitalize">{product.product_type}</p>
              </div>

              {/* Cancellation Reason */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Motivo de Cancelación *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CANCELLATION_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setSelectedReason(reason.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedReason === reason.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{reason.label}</span>
                        {selectedReason === reason.value && (
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Comments */}
              <div>
                <label htmlFor="comments" className="block text-base font-semibold text-gray-900 mb-2">
                  Comentarios Adicionales (Opcional)
                </label>
                <textarea
                  id="comments"
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  rows={4}
                  placeholder="¿Hay algo más que quieras compartir sobre tu cancelación?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
                >
                  Volver
                </button>

                <button
                  onClick={handleReasonSelected}
                  disabled={!selectedReason}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {currentStep === 'refund' && (
            <RefundCalculator
              reservation={reservation}
              paymentPlan={paymentPlan}
              daysBeforeTravel={daysBeforeTravel}
              onCalculated={handleRefundCalculated}
              onBack={handleBackToReason}
            />
          )}

          {currentStep === 'confirm' && refundData && (
            <CancelConfirmationStep
              reservation={reservation}
              product={product}
              refundData={refundData}
              cancellationReason={CANCELLATION_REASONS.find(r => r.value === selectedReason)?.label || selectedReason}
              onBack={handleBackToRefund}
              onConfirm={handleConfirmCancellation}
              isCancelling={isCancelling}
            />
          )}

          {currentStep === 'completed' && (
            <div className="text-center py-12">
              {/* Success Icon */}
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Cancelación Procesada
              </h3>
              <p className="text-gray-600 mb-6">
                Tu reservación ha sido cancelada. {refundData && refundData.netRefund > 0 && 'Recibirás un correo con los detalles del reembolso en las próximas 24 horas.'}
              </p>

              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors"
              >
                Volver a Mis Viajes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
