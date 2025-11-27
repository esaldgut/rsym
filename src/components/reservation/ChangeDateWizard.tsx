'use client';

/**
 * Change Date Wizard
 *
 * Multi-step wizard for changing reservation travel date
 *
 * Steps:
 * 1. Select New Date - Calendar with available seasons
 * 2. Review Changes - Preview price difference and new payment plan
 * 3. Confirm - User confirmation
 * 4. Completed - Success message
 *
 * Features:
 * - Validates change_deadline_days from payment plan
 * - Calculates price difference (refund/additional payment)
 * - Generates new payment plan if price changes
 * - Shows which installments are affected
 * - Unsaved changes warning
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SelectNewDateStep from './SelectNewDateStep';
import ReviewChangeDateStep from './ReviewChangeDateStep';

/**
 * Wizard Steps
 */
type WizardStep = 'select-date' | 'review' | 'confirm' | 'completed';

/**
 * Reservation Data (minimal required)
 */
interface ReservationData {
  id: string;
  experience_id: string;
  experience_type?: string;
  adults: number;
  kids: number;
  babys: number;
  reservation_date: string; // Current reservation date
  price_per_person: number;
  price_per_kid?: number;
  total_price: number;
  currency: string;
}

/**
 * Payment Plan Data
 */
interface PaymentPlanData {
  id: string;
  allows_date_change?: boolean;
  change_deadline_days?: number;
  plan_type: string; // 'CONTADO' | 'PLAZOS'
  total_cost: number;
  currency: string;
  installments?: Array<{
    installment_number: number;
    amount: number;
    due_date: string;
    status: string;
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
 * Selected New Date Data
 */
export interface SelectedDateData {
  newDate: string;
  newPricePerPerson: number;
  newPricePerKid?: number;
  newTotalPrice: number;
  seasonName?: string;
  seasonId?: string;
  priceId?: string;
}

/**
 * ChangeDateWizard Props
 */
interface ChangeDateWizardProps {
  reservation: ReservationData;
  paymentPlan: PaymentPlanData;
  product: ProductData;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangeDateWizard({
  reservation,
  paymentPlan,
  product,
  onClose,
  onSuccess
}: ChangeDateWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('select-date');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<SelectedDateData | null>(null);

  // Check if date change is allowed
  const isDateChangeAllowed = paymentPlan.allows_date_change ?? false;
  const changeDeadlineDays = paymentPlan.change_deadline_days || 0;

  // Calculate deadline for date changes
  const getChangeDateDeadline = (): Date | null => {
    if (!changeDeadlineDays) return null;

    const travelDate = new Date(reservation.reservation_date);
    const deadlineDate = new Date(travelDate);
    deadlineDate.setDate(deadlineDate.getDate() - changeDeadlineDays);

    return deadlineDate;
  };

  const changeDateDeadline = getChangeDateDeadline();
  const today = new Date();
  const isPastDeadline = changeDateDeadline ? today > changeDateDeadline : false;

  // Handle step navigation
  const handleDateSelected = useCallback((dateData: SelectedDateData) => {
    console.log('[ChangeDateWizard] 📅 Fecha seleccionada:', dateData);
    setSelectedDateData(dateData);
    setCurrentStep('review');
  }, []);

  const handleBackToDateSelection = useCallback(() => {
    setCurrentStep('select-date');
  }, []);

  const handleConfirmChange = useCallback(async () => {
    if (!selectedDateData) {
      console.error('[ChangeDateWizard] ❌ No hay fecha seleccionada');
      return;
    }

    console.log('[ChangeDateWizard] 💾 Confirmando cambio de fecha...');
    setIsSaving(true);

    try {
      // Import server action dynamically
      const { changeReservationDateAction } = await import('@/lib/server/reservation-actions');

      // Call server action
      const result = await changeReservationDateAction({
        reservationId: reservation.id,
        paymentPlanId: paymentPlan.id,
        productId: product.id,
        newDate: selectedDateData.newDate,
        newPricePerPerson: selectedDateData.newPricePerPerson,
        newPricePerKid: selectedDateData.newPricePerKid,
        newTotalPrice: selectedDateData.newTotalPrice,
        seasonId: selectedDateData.seasonId,
        priceId: selectedDateData.priceId
      });

      if (!result.success) {
        console.error('[ChangeDateWizard] ❌ Error:', result.error);
        alert(`Error al cambiar la fecha: ${result.error}`);
        return;
      }

      console.log('[ChangeDateWizard] ✅ Fecha cambiada exitosamente');

      // Move to completion step
      setCurrentStep('completed');

      // Refresh page data after success
      router.refresh();

    } catch (error) {
      console.error('[ChangeDateWizard] ❌ Error cambiando fecha:', error);
      alert('Error al cambiar la fecha. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }, [reservation.id, paymentPlan.id, product.id, selectedDateData, router]);

  const handleComplete = useCallback(() => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  }, [onClose, onSuccess]);

  // Handle cancel with confirmation
  const handleCancel = () => {
    if (currentStep !== 'completed' && currentStep !== 'select-date') {
      const confirmed = window.confirm(
        '¿Estás seguro? Los cambios no se guardarán.'
      );
      if (!confirmed) return;
    }

    onClose();
  };

  // Progress calculation
  const stepProgress = {
    'select-date': 25,
    'review': 50,
    'confirm': 75,
    'completed': 100
  };

  // If date change not allowed, show error
  if (!isDateChangeAllowed) {
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
              Cambio de Fecha No Permitido
            </h3>
            <p className="text-gray-600 mb-6">
              El plan de pagos seleccionado no permite cambios de fecha.
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

  // If past deadline, show error
  if (isPastDeadline && changeDateDeadline) {
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
              Fecha Límite Vencida
            </h3>
            <p className="text-gray-600 mb-2">
              El plazo para cambiar la fecha de tu viaje ha vencido.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Fecha límite: {changeDateDeadline.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Cambiar Fecha de Viaje
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
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stepProgress[currentStep]}%` }}
            />
          </div>

          {/* Step Indicator */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className={currentStep === 'select-date' ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              1. Seleccionar Fecha
            </span>
            <span className={currentStep === 'review' ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              2. Revisar Cambios
            </span>
            <span className={currentStep === 'confirm' ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              3. Confirmar
            </span>
            <span className={currentStep === 'completed' ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              4. Completado
            </span>
          </div>

          {/* Deadline Warning */}
          {changeDateDeadline && !isPastDeadline && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Fecha límite para cambios
                  </p>
                  <p className="text-xs text-amber-700">
                    {changeDateDeadline.toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} ({changeDeadlineDays} días antes del viaje)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'select-date' && (
            <SelectNewDateStep
              reservation={reservation}
              product={product}
              onDateSelected={handleDateSelected}
              onCancel={handleCancel}
            />
          )}

          {currentStep === 'review' && selectedDateData && (
            <ReviewChangeDateStep
              reservation={reservation}
              paymentPlan={paymentPlan}
              product={product}
              newDateData={selectedDateData}
              onBack={handleBackToDateSelection}
              onConfirm={() => setCurrentStep('confirm')}
            />
          )}

          {currentStep === 'confirm' && selectedDateData && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-base font-semibold text-blue-900 mb-2">
                      ¿Estás seguro de cambiar la fecha de tu viaje?
                    </p>
                    <p className="text-sm text-blue-800">
                      Esta acción actualizará tu reservación y plan de pagos. Se enviará un correo de confirmación.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep('review')}
                  disabled={isSaving}
                  className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  ← Revisar Cambios
                </button>

                <button
                  onClick={handleConfirmChange}
                  disabled={isSaving}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    'Confirmar Cambio de Fecha'
                  )}
                </button>
              </div>
            </div>
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
                ¡Fecha Actualizada!
              </h3>
              <p className="text-gray-600 mb-6">
                La fecha de tu viaje ha sido cambiada exitosamente. Recibirás un correo de confirmación con los detalles actualizados.
              </p>

              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors"
              >
                Volver a Detalles
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
