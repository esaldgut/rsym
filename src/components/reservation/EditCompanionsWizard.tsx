'use client';

/**
 * Edit Companions Wizard
 *
 * Multi-step wizard for editing traveler information
 *
 * Steps:
 * 1. Edit Companions - Form for each traveler
 * 2. Review Changes - Preview before saving
 * 3. Confirmation - Success message
 *
 * Features:
 * - Real-time validation with Zod
 * - Age-based classification (adult/kid/baby)
 * - Passport format validation by country
 * - Progress indicator
 * - Unsaved changes warning
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  companionsArraySchema,
  type Companion
} from '@/lib/validations/companion-schemas';
import CompanionFormCard from './CompanionFormCard';
import ReviewCompanionsStep from './ReviewCompanionsStep';

/**
 * Wizard Steps
 */
type WizardStep = 'edit' | 'review' | 'completed';

/**
 * Reservation Data (minimal)
 */
interface ReservationData {
  id: string;
  adults: number;
  kids: number;
  babys: number;
  companions?: Companion[];
}

/**
 * EditCompanionsWizard Props
 */
interface EditCompanionsWizardProps {
  reservation: ReservationData;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditCompanionsWizard({
  reservation,
  onClose,
  onSuccess
}: EditCompanionsWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('edit');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate expected total
  const expectedTotal = reservation.adults + reservation.kids + reservation.babys;

  // Initialize form with existing companions or empty array
  const initialCompanions: Companion[] = reservation.companions || [];

  // If no companions exist, create empty array with expected count
  const companionsToEdit = initialCompanions.length === expectedTotal
    ? initialCompanions
    : Array.from({ length: expectedTotal }, (_, index) => {
        // Try to use existing companion if available
        if (initialCompanions[index]) {
          return initialCompanions[index];
        }

        // Create empty companion
        return {
          name: '',
          family_name: '',
          birthday: '',
          country: 'MX',
          gender: 'male' as const,
          passport_number: ''
        };
      });

  // React Hook Form
  const methods = useForm<{ companions: Companion[] }>({
    resolver: zodResolver(companionsArraySchema),
    defaultValues: {
      companions: companionsToEdit
    },
    mode: 'onChange'
  });

  const {
    handleSubmit,
    formState: { isValid, isDirty }
  } = methods;

  // Handle step navigation
  const handleNext = useCallback(() => {
    if (currentStep === 'edit') {
      setCurrentStep('review');
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep === 'review') {
      setCurrentStep('edit');
    } else if (currentStep === 'completed') {
      // Close wizard and refresh
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    }
  }, [currentStep, onClose, onSuccess]);

  // Handle form submission
  const onSubmit = async (data: { companions: Companion[] }) => {
    console.log('[EditCompanionsWizard] 💾 Saving companions:', data.companions.length);
    setIsSaving(true);

    try {
      // Import server action dynamically
      const { updateCompanionsAction } = await import('@/lib/server/reservation-actions');

      // Call server action
      const result = await updateCompanionsAction(reservation.id, data.companions);

      if (!result.success) {
        console.error('[EditCompanionsWizard] ❌ Error:', result.error);
        alert(`Error al guardar: ${result.error}`);
        return;
      }

      console.log('[EditCompanionsWizard] ✅ Companions saved successfully');

      // Move to completion step
      setCurrentStep('completed');

      // Refresh page data after success
      router.refresh();

    } catch (error) {
      console.error('[EditCompanionsWizard] ❌ Error saving companions:', error);
      alert('Error al guardar los datos. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel with confirmation if dirty
  const handleCancel = () => {
    if (isDirty && currentStep !== 'completed') {
      const confirmed = window.confirm(
        '¿Estás seguro? Los cambios no guardados se perderán.'
      );
      if (!confirmed) return;
    }

    onClose();
  };

  // Progress calculation
  const stepProgress = {
    edit: 33,
    review: 66,
    completed: 100
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Editar Información de Viajeros
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
            <span className={currentStep === 'edit' ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              1. Editar
            </span>
            <span className={currentStep === 'review' ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              2. Revisar
            </span>
            <span className={currentStep === 'completed' ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              3. Completado
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <FormProvider {...methods}>
            {currentStep === 'edit' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Completa los datos de todos los viajeros
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Total: {expectedTotal} viajero{expectedTotal !== 1 ? 's' : ''} ({reservation.adults} adulto{reservation.adults !== 1 ? 's' : ''}, {reservation.kids} niño{reservation.kids !== 1 ? 's' : ''}, {reservation.babys} bebé{reservation.babys !== 1 ? 's' : ''})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Companion Forms */}
                {companionsToEdit.map((_, index) => (
                  <CompanionFormCard
                    key={index}
                    index={index}
                    reservation={reservation}
                  />
                ))}
              </div>
            )}

            {currentStep === 'review' && (
              <ReviewCompanionsStep
                companions={methods.watch('companions')}
                reservation={reservation}
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
                  ¡Datos Actualizados!
                </h3>
                <p className="text-gray-600 mb-6">
                  La información de los viajeros ha sido actualizada exitosamente.
                </p>

                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors"
                >
                  Volver a Detalles
                </button>
              </div>
            )}
          </FormProvider>
        </div>

        {/* Footer - Action Buttons */}
        {currentStep !== 'completed' && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={currentStep === 'edit' ? handleCancel : handleBack}
              className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              {currentStep === 'edit' ? 'Cancelar' : '← Anterior'}
            </button>

            <div className="flex gap-3">
              {currentStep === 'edit' && (
                <button
                  onClick={handleNext}
                  disabled={!isValid}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar →
                </button>
              )}

              {currentStep === 'review' && (
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSaving}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
