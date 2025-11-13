'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ProductGalleryHeader } from '@/components/marketplace/ProductGalleryHeader';
import { toastManager } from '@/components/ui/ToastWithPinpoint';
import { createReservationAction, generatePaymentPlanAction, checkAvailabilityAction } from '@/lib/server/reservation-actions';
import type { ReservationInput, PaymentPlan } from '@/lib/graphql/types';
import { PaymentTypeSelector } from '@/components/booking/PaymentTypeSelector';
import { PaymentPlanSummary } from '@/components/booking/PaymentPlanSummary';
import { RoomTypeSelector } from '@/components/booking/RoomTypeSelector';
import { CompanionDetailsForm } from '@/components/booking/CompanionDetailsForm';
import { ExtraServicesSelector } from '@/components/booking/ExtraServicesSelector';

/**
 * BookingClient - Multi-step Booking Wizard
 *
 * ARQUITECTURA:
 * - Client Component para interactividad
 * - Multi-step wizard inspirado en Exoticca
 * - Reusa ProductGalleryHeader component
 * - Server Actions para mutaciones
 * - TypeScript strict typing (no any/unknown)
 *
 * STEPS:
 * 1. SelectDateStep - Selección de temporada y fecha
 * 2. TravelersStep - Número de viajeros (adultos, niños, bebés)
 * 3. ReviewStep - Resumen y políticas
 * 4. PaymentStep - Integración con Stripe
 *
 * PATTERNS SEGUIDOS:
 * - marketplace-client.tsx: Modal pattern, transitions, error handling
 * - ProductWizard.tsx: Multi-step navigation
 * - reservation-actions.ts: Server Actions pattern
 */

interface MarketplaceProduct {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  published: boolean;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  min_product_price?: number;
  itinerary?: string;
  preferences?: string[];
  destination?: Array<{
    place?: string;
    placeSub?: string;
  }>;
  seasons?: Array<{
    id: string;
    start_date?: string;
    end_date?: string;
    number_of_nights?: string;
    category?: string;
    allotment?: number;
    allotment_remain?: number;
    aditional_services?: string;
    schedules?: string;

    // ✅ CRÍTICO: Precios por tipo de habitación con precios para niños
    prices?: Array<{
      id: string;
      room_name: string;
      price: number;
      currency: string;
      max_adult: number;
      max_minor: number;
      children?: Array<{
        name: string;
        min_minor_age: number;
        max_minor_age: number;
        child_price: number;
      }>;
    }>;

    // ✅ Servicios adicionales (tours extras, seguros, etc.)
    extra_prices?: Array<{
      id: string;
      room_name: string;
      price: number;
      currency: string;
      max_adult: number;
      max_minor: number;
      children?: Array<{
        name: string;
        min_minor_age: number;
        max_minor_age: number;
        child_price: number;
      }>;
    }>;
  }>;
  user_data?: {
    username?: string;
    name?: string;
    avatar_url?: string;
  };

  // ✅ CRÍTICO: Estructura completa de payment_policy (alineada con GraphQL)
  payment_policy?: {
    id: string;
    version: number;
    status: string;
    options: Array<{
      type: 'CONTADO' | 'PLAZOS';
      description: string;
      benefits_or_legal?: Array<{ stated: string }>;
      config: {
        cash?: {
          discount: number;
          discount_type: 'PERCENTAGE' | 'AMOUNT';
          deadline_days_to_pay: number;
          payment_methods: string[];
          benefits_or_legal?: Array<{ stated: string }>;
        };
        installments?: {
          down_payment_before: number;
          down_payment_after: number;
          down_payment_type: 'PERCENTAGE' | 'AMOUNT';
          installment_intervals: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL';
          days_before_must_be_settled: number;
          deadline_days_to_pay: number;
          payment_methods: string[];
          benefits_or_legal?: Array<{ stated: string }>;
        };
      };
    }>;
    general_policies: {
      change_policy: {
        allows_date_change: boolean;
        deadline_days_to_make_change: number;
      };
    };
  };
}

interface BookingClientProps {
  product: MarketplaceProduct;
  encryptedProductParam: string;
}

type WizardStep = 'date' | 'travelers' | 'review' | 'payment' | 'completed';

// ✅ Interface para datos de acompañantes
interface Companion {
  id: string;
  name: string;
  family_name: string;
  birthday: string; // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other';
  country?: string;
  passport_number?: string;
  isLeadPassenger: boolean;
}

// ✅ ACTUALIZADO: Agregados campos para nuevos componentes
interface BookingFormData {
  selectedSeasonId?: string;
  selectedDate?: string;
  selectedRoomType?: string;
  selectedRoomPriceId?: string; // ID del price seleccionado para backend
  adults: number;
  kids: number;
  babys: number;
  paymentType: 'CONTADO' | 'PLAZOS'; // Tipo de pago

  // ✅ NUEVO: Datos de acompañantes (CompanionDetailsForm)
  companions: Companion[];

  // ✅ NUEVO: Servicios extra seleccionados (ExtraServicesSelector)
  selectedExtraServices: string[]; // Array de IDs de extra_prices

  // ✅ Datos generados por backend con flujo de dos pasos
  reservationId?: string; // ID de reservación (Paso 1)
  paymentPlan?: PaymentPlan; // PaymentPlan completo (Paso 2)

  // ❌ REMOVIDO: selectedPriceId - Backend calcula precios automáticamente
  // ❌ REMOVIDO: totalPrice, priceBreakdown - Usar paymentPlan en su lugar
}

export function BookingClient({ product }: BookingClientProps) {
  console.log('🖥️ [CLIENT COMPONENT] BookingClient hydrating with product:', product.id);

  const router = useRouter();
  const [, startTransition] = useTransition();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('date');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<BookingFormData>({
    adults: 1,
    kids: 0,
    babys: 0,
    paymentType: 'CONTADO', // Valor por defecto: pago de contado
    companions: [], // ✅ NUEVO: Array vacío inicialmente
    selectedExtraServices: [], // ✅ NUEVO: Array vacío inicialmente
    // ✅ paymentPlan será populado por el backend después de createReservation
  });

  // Wrapper function for partial updates (allows updating individual fields)
  const updateFormData = (updates: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // ❌ ELIMINADO: calculateTotalPrice - Backend calcula precios con Secure Pricing System (7 reglas de negocio)
  // Precios ahora vienen en formData.paymentPlan desde backend después de createReservation

  // Manejar navegación entre steps
  const goToStep = (step: WizardStep) => {
    console.log('📍 [BookingClient] Navigating to step:', step);
    setCurrentStep(step);
  };

  const goToNextStep = () => {
    const stepOrder: WizardStep[] = ['date', 'travelers', 'review', 'payment', 'completed'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex < stepOrder.length - 1) {
      goToStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const stepOrder: WizardStep[] = ['date', 'travelers', 'review', 'payment', 'completed'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex > 0) {
      goToStep(stepOrder[currentIndex - 1]);
    }
  };

  // ✅ CORREGIDO: Eliminado price_id - Backend calcula precios automáticamente
  const handleDateSelection = (seasonId: string, roomType: string, date?: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSeasonId: seasonId,
      selectedRoomType: roomType,
      selectedDate: date,
      // ❌ REMOVIDO: selectedPriceId - Backend calcula precios sin necesidad de price_id
    }));

    goToNextStep();
  };

  // Manejar selección de viajeros
  const handleTravelersSelection = (adults: number, kids: number, babys: number) => {
    // ✅ ELIMINADO: calculateTotalPrice - Backend calculará precios

    setFormData(prev => ({
      ...prev,
      adults,
      kids,
      babys,
      // ❌ ELIMINADO: ...pricing - Backend calcula precios con Secure Pricing System
    }));

    goToNextStep();
  };

  // Manejar confirmación de reserva
  // ✅ REFACTORIZADO: Flujo de dos pasos (createReservation → generatePaymentPlan)
  // Backend schema NO incluye season_id/price_id/payment_plan en Reservation
  // PaymentPlan es un tipo separado generado después de crear la reservación
  const handleConfirmReservation = async () => {
    setIsProcessing(true);

    startTransition(async () => {
      try {
        // Validación de disponibilidad
        const availabilityResult = await checkAvailabilityAction(
          product.id,
          formData.adults,
          formData.kids
        );

        if (!availabilityResult.data?.available) {
          toastManager.error('❌ ' + (availabilityResult.data?.message || 'No hay disponibilidad'), {
            trackingContext: {
              feature: 'booking_wizard',
              error: 'no_availability',
              productId: product.id,
              category: 'availability_check',
            },
          });
          setIsProcessing(false);
          return;
        }

        // ========== PASO 1: Crear Reservación ==========
        console.log('📝 [BookingClient] PASO 1/2: Creando reservación...');

        const reservationInput: ReservationInput = {
          adults: formData.adults,
          kids: formData.kids,
          babys: formData.babys,
          experience_id: product.id,
          collection_type: product.product_type || 'circuit',
          reservationDate: formData.selectedDate || new Date().toISOString(),
          type: formData.paymentType, // CONTADO o PLAZOS
          // ✅ Backend calcula precios automáticamente con Secure Pricing System
          // NO se envían: season_id, price_id, price_per_person, price_per_kid, total_price
        };

        const reservationResult = await createReservationAction(reservationInput);

        if (!reservationResult.success || !reservationResult.data) {
          throw new Error(reservationResult.error || 'Error al crear la reservación');
        }

        const reservation = reservationResult.data;
        console.log('✅ [BookingClient] PASO 1/2 completado - Reservación creada:', {
          reservationId: reservation.id,
          totalPrice: reservation.total_price,
          status: reservation.status
        });

        // ========== PASO 2: Generar PaymentPlan ==========
        console.log('💰 [BookingClient] PASO 2/2: Generando PaymentPlan...');

        const paymentPlanResult = await generatePaymentPlanAction({
          product_id: product.id,
          total_cost: reservation.total_price || 0,
          travel_date: formData.selectedDate || new Date().toISOString(),
          currency: 'MXN',
          payment_type_selected: formData.paymentType
        });

        if (!paymentPlanResult.success || !paymentPlanResult.data) {
          // Error en PaymentPlan - Reservación ya creada pero sin plan de pago
          console.error('⚠️ [BookingClient] Reservación creada pero error en PaymentPlan:', paymentPlanResult.error);
          toastManager.error('⚠️ Reservación creada pero hubo un problema al generar el plan de pago. Contacta a soporte.', {
            trackingContext: {
              feature: 'booking_wizard',
              error: 'payment_plan_generation_failed',
              reservationId: reservation.id,
              productId: product.id,
              category: 'error_handling',
            },
          });
          setIsProcessing(false);
          return;
        }

        const paymentPlan = paymentPlanResult.data;
        console.log('✅ [BookingClient] PASO 2/2 completado - PaymentPlan generado:', {
          paymentPlanId: paymentPlan.id,
          totalCost: paymentPlan.total_cost,
          paymentTypeSelected: paymentPlan.payment_type_selected,
          cashFinalAmount: paymentPlan.cash_final_amount,
          installmentTotalAmount: paymentPlan.installment_total_amount
        });

        // ========== PASO 3: Almacenar datos y continuar ==========
        setFormData(prev => ({
          ...prev,
          reservationId: reservation.id,
          paymentPlan: paymentPlan
        }));

        toastManager.success('✅ Reservación y plan de pago creados exitosamente', {
          trackingContext: {
            feature: 'booking_wizard',
            reservationId: reservation.id,
            paymentPlanId: paymentPlan.id,
            productId: product.id,
            totalPrice: reservation.total_price,
            category: 'success',
          },
        });

        // Avanzar al paso de pago o completado
        goToStep('completed');

      } catch (error) {
        console.error('❌ [BookingClient] Error en flujo de reservación:', error);
        toastManager.error('❌ Error al procesar la reserva. Por favor intenta de nuevo.', {
          trackingContext: {
            feature: 'booking_wizard',
            error: error instanceof Error ? error.message : 'Unknown error',
            productId: product.id,
            category: 'error_handling',
          },
        });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // Renderizar step actual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'date':
        return (
          <SelectDateStep
            product={product}
            selectedSeasonId={formData.selectedSeasonId}
            onSelect={handleDateSelection}
            onCancel={() => router.push('/marketplace')}
          />
        );

      case 'travelers':
        return (
          <TravelersStep
            product={product} // ✅ AÑADIDO: Pasar producto completo
            selectedSeasonId={formData.selectedSeasonId} // ✅ AÑADIDO
            selectedRoomType={formData.selectedRoomType} // ✅ AÑADIDO
            adults={formData.adults}
            kids={formData.kids}
            babys={formData.babys}
            basePrice={product.min_product_price || 0}
            companions={formData.companions} // ✅ NUEVO: Pasar companions
            selectedExtraServices={formData.selectedExtraServices} // ✅ NUEVO: Pasar selected extra services
            onSelect={handleTravelersSelection}
            onBack={goToPreviousStep}
            onUpdateCompanions={(companions) => {
              // ✅ NUEVO: Actualizar companions en formData
              setFormData(prev => ({ ...prev, companions }));
            }}
            onUpdateExtraServices={(selectedExtraServices) => {
              // ✅ NUEVO: Actualizar extra services en formData
              setFormData(prev => ({ ...prev, selectedExtraServices }));
            }}
          />
        );

      case 'review':
        return (
          <ReviewStep
            product={product}
            formData={formData}
            onConfirm={handleConfirmReservation}
            onBack={goToPreviousStep}
            isProcessing={isProcessing}
            onUpdateFormData={updateFormData}
          />
        );

      case 'completed':
        return (
          <CompletedStep
            product={product}
            formData={formData}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<BookingWizardSkeleton />}>
      <div className="bg-gray-50 -mt-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal: Wizard */}
            <div className="lg:col-span-2">
              {/* Progress indicator */}
              <WizardProgress currentStep={currentStep} />

              {/* Step content */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
                {renderCurrentStep()}
              </div>
            </div>

            {/* Columna lateral: Resumen del producto */}
            <div className="lg:col-span-1">
              <ProductSummaryCard product={product} formData={formData} />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

/**
 * WizardProgress - Indicador de progreso del wizard
 */
interface WizardProgressProps {
  currentStep: WizardStep;
}

function WizardProgress({ currentStep }: WizardProgressProps) {
  const steps = [
    { id: 'date', label: 'Fecha', icon: '📅' },
    { id: 'travelers', label: 'Viajeros', icon: '👥' },
    { id: 'review', label: 'Revisión', icon: '📋' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                  index <= currentStepIndex
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStepIndex ? '✓' : step.icon}
              </div>
              <span
                className={`mt-2 text-sm font-medium ${
                  index <= currentStepIndex ? 'text-purple-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                  index < currentStepIndex ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ProductSummaryCard - Resumen del producto en sidebar
 */
interface ProductSummaryCardProps {
  product: MarketplaceProduct;
  formData: BookingFormData;
}

function ProductSummaryCard({ product, formData }: ProductSummaryCardProps) {
  const selectedSeason = product.seasons?.find(s => s.id === formData.selectedSeasonId);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de reserva</h3>

      {/* Product gallery */}
      <ProductGalleryHeader
        images={[product.cover_image_url, ...(product.image_url || [])].filter(Boolean) as string[]}
        videos={product.video_url || []}
        alt={product.name}
      />

      <div className="mt-4 space-y-4">
        {/* Product name */}
        <div>
          <h4 className="font-semibold text-gray-900">{product.name}</h4>
          <p className="text-sm text-gray-600">{product.product_type === 'circuit' ? 'Circuito' : 'Paquete'}</p>
        </div>

        {/* Selected season */}
        {selectedSeason && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Temporada seleccionada</p>
            <p className="font-medium text-gray-900">
              {new Date(selectedSeason.start_date || '').toLocaleDateString()} - {new Date(selectedSeason.end_date || '').toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">{selectedSeason.number_of_nights} noches</p>
          </div>
        )}

        {/* Travelers */}
        {(formData.adults > 0 || formData.kids > 0 || formData.babys > 0) && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Viajeros</p>
            <div className="space-y-1 text-sm">
              {formData.adults > 0 && (
                <div className="flex justify-between">
                  <span>{formData.adults} Adulto(s)</span>
                </div>
              )}
              {formData.kids > 0 && (
                <div className="flex justify-between">
                  <span>{formData.kids} Niño(s)</span>
                </div>
              )}
              {formData.babys > 0 && (
                <div className="flex justify-between">
                  <span>{formData.babys} Bebé(s)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Total price - ✅ CAMBIADO: Usar PaymentPlan desde backend */}
        {formData.paymentPlan && (
          <div className="pt-4 border-t-2 border-gray-900">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">
                {formData.paymentType === 'CONTADO' ? 'Total (Contado)' : 'Total (Plazos)'}
              </span>
              <span className="text-2xl font-bold text-purple-600">
                ${(formData.paymentType === 'CONTADO'
                  ? formData.paymentPlan.cash_final_amount
                  : formData.paymentPlan.installment_total_amount
                ).toLocaleString()} {formData.paymentPlan.currency}
              </span>
            </div>
            {formData.paymentType === 'CONTADO' && formData.paymentPlan.cash_discount_percentage > 0 && (
              <p className="text-xs text-green-600 mt-1 text-right">
                ✓ {formData.paymentPlan.cash_discount_percentage}% descuento aplicado
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SelectDateStep - Paso 1: Selección de fecha/temporada
 * ✅ CORREGIDO: Eliminado price_id - Backend calcula precios automáticamente
 */
interface SelectDateStepProps {
  product: MarketplaceProduct;
  selectedSeasonId?: string;
  onSelect: (seasonId: string, roomType: string, date?: string) => void;
  onCancel: () => void;
}

function SelectDateStep({ product, selectedSeasonId, onSelect, onCancel }: SelectDateStepProps) {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(selectedSeasonId);
  const [selectedRoomPriceId, setSelectedRoomPriceId] = useState<string | undefined>(undefined);

  // Obtener temporada seleccionada
  const currentSeason = product.seasons?.find(s => s.id === selectedSeason);

  // Obtener room type name desde el price ID seleccionado
  const selectedRoomType = currentSeason?.prices?.find(p => p.id === selectedRoomPriceId)?.room_name;

  const handleContinue = () => {
    if (!selectedSeason) {
      toastManager.error('Por favor selecciona una temporada');
      return;
    }
    if (!selectedRoomType) {
      toastManager.error('Por favor selecciona un tipo de habitación');
      return;
    }
    onSelect(selectedSeason, selectedRoomType);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona temporada y habitación</h2>
        <p className="text-gray-600">Elige la fecha y tipo de habitación que mejor se ajusten a tus planes</p>
      </div>

      {/* Seasons list */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">1. Temporada</h3>
        {product.seasons && product.seasons.length > 0 ? (
          product.seasons.map(season => (
            <button
              key={season.id}
              onClick={() => {
                setSelectedSeason(season.id);
                setSelectedRoomType(undefined); // Reset room selection when changing season
              }}
              className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                selectedSeason === season.id
                  ? 'border-purple-600 bg-purple-50 shadow-lg'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📅</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(season.start_date || '').toLocaleDateString('es-MX')} - {new Date(season.end_date || '').toLocaleDateString('es-MX')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{season.number_of_nights} noches</p>
                  {season.category && (
                    <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      {season.category}
                    </span>
                  )}

                  {/* ✅ Disponibilidad */}
                  {season.allotment_remain !== undefined && (
                    <div className="mt-2 text-sm">
                      {season.allotment_remain > 0 ? (
                        <span className="text-green-600 font-medium">
                          ✓ {season.allotment_remain} lugares disponibles
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          ✗ Agotado
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {selectedSeason === season.id && (
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white">
                    ✓
                  </div>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No hay temporadas disponibles para este producto</p>
          </div>
        )}
      </div>

      {/* ✅ Room type selector (solo visible si hay temporada seleccionada) */}
      {selectedSeason && currentSeason && currentSeason.prices && currentSeason.prices.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <RoomTypeSelector
            prices={currentSeason.prices.map(p => ({
              id: p.id,
              room_name: p.room_name,
              price: p.price,
              currency: p.currency,
              max_adult: p.max_adult,
              max_minor: p.max_minor,
              children: p.children
            }))}
            selected={selectedRoomPriceId || null}
            onSelect={(priceId) => {
              setSelectedRoomPriceId(priceId);
            }}
            adults={1} // Default value, will be set in next step
            kids={0}
            babys={0}
          />

          {/* ✅ Servicios adicionales disponibles */}
          {currentSeason.extra_prices && currentSeason.extra_prices.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Servicios adicionales disponibles</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {currentSeason.extra_prices.map((extra, idx) => (
                  <li key={idx}>
                    • {extra.room_name} - ${extra.price.toLocaleString()} {extra.currency}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-blue-700 mt-2">Podrás añadirlos en el siguiente paso</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedSeason || !selectedRoomType}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            selectedSeason && selectedRoomType
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

/**
 * TravelersStep - Paso 2: Número de viajeros
 */
interface TravelersStepProps {
  product: MarketplaceProduct; // ✅ AÑADIDO: Producto completo
  selectedSeasonId?: string; // ✅ AÑADIDO: Temporada seleccionada
  selectedRoomType?: string; // ✅ AÑADIDO: Tipo de habitación seleccionada
  adults: number;
  kids: number;
  babys: number;
  basePrice: number;
  companions: Companion[]; // ✅ NUEVO: Acompañantes (CompanionDetailsForm)
  selectedExtraServices: string[]; // ✅ NUEVO: Servicios extra seleccionados (ExtraServicesSelector)
  onSelect: (adults: number, kids: number, babys: number) => void;
  onBack: () => void;
  onUpdateCompanions: (companions: Companion[]) => void; // ✅ NUEVO: Callback para actualizar companions
  onUpdateExtraServices: (serviceIds: string[]) => void; // ✅ NUEVO: Callback para actualizar extra services
}

function TravelersStep({
  product,
  selectedSeasonId,
  selectedRoomType,
  adults,
  kids,
  babys,
  basePrice,
  companions,
  selectedExtraServices,
  onSelect,
  onBack,
  onUpdateCompanions,
  onUpdateExtraServices
}: TravelersStepProps) {
  const [formData, setFormData] = useState({ adults, kids, babys });

  // ✅ Extraer datos de la temporada y habitación seleccionadas
  const selectedSeason = product.seasons?.find(s => s.id === selectedSeasonId);
  const roomPrice = selectedSeason?.prices?.find(p => p.room_name === selectedRoomType);
  const childrenRanges = roomPrice?.children || [];

  console.log('🧒 [TravelersStep] Children ranges:', {
    seasonId: selectedSeasonId,
    roomType: selectedRoomType,
    childrenRanges
  });

  const handleContinue = () => {
    if (formData.adults < 1) {
      toastManager.error('Debe haber al menos 1 adulto');
      return;
    }

    // ✅ Validar que todos los companions estén completos
    if (companions.length !== formData.adults) {
      toastManager.error(`Por favor completa la información de los ${formData.adults} adultos`);
      return;
    }

    // ✅ Validar que todos los companions tengan datos obligatorios
    const incompleteCompanion = companions.find(c =>
      !c.name || !c.family_name || !c.birthday
    );
    if (incompleteCompanion) {
      toastManager.error('Por favor completa todos los campos obligatorios de los viajeros');
      return;
    }

    // ✅ Validar que haya exactamente un lead passenger
    const leadPassengers = companions.filter(c => c.isLeadPassenger);
    if (leadPassengers.length === 0) {
      toastManager.error('Por favor selecciona un viajero principal');
      return;
    }
    if (leadPassengers.length > 1) {
      toastManager.error('Solo puede haber un viajero principal');
      return;
    }

    onSelect(formData.adults, formData.kids, formData.babys);
  };

  // ❌ ELIMINADO: calculatePreview - Backend calcula precios con Secure Pricing System
  // El precio final se obtendrá después de createReservation en formData.paymentPlan

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Número de viajeros</h2>
        <p className="text-gray-600">¿Cuántas personas viajan contigo?</p>
      </div>

      {/* Travelers inputs */}
      <div className="space-y-4">
        {/* Adults */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Adultos</h3>
              <p className="text-sm text-gray-600">18 años o más</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, adults: Math.max(1, prev.adults - 1) }))}
                className="w-10 h-10 bg-white rounded-lg border-2 border-gray-300 hover:border-purple-600 transition-colors"
              >
                −
              </button>
              <span className="text-xl font-bold text-gray-900 w-8 text-center">{formData.adults}</span>
              <button
                onClick={() => setFormData(prev => ({ ...prev, adults: Math.min(20, prev.adults + 1) }))}
                className="w-10 h-10 bg-white rounded-lg border-2 border-gray-300 hover:border-purple-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Kids */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Niños</h3>
              {/* ✅ Mostrar rangos dinámicos desde children[] */}
              {childrenRanges.length > 0 ? (
                <div className="space-y-1">
                  {childrenRanges
                    .filter(c => c.min_minor_age >= 2) // Excluir bebés (0-2 años)
                    .map((child, idx) => (
                      <p key={idx} className="text-sm text-gray-600">
                        {child.name || `${child.min_minor_age}-${child.max_minor_age} años`}
                        {child.child_price === 0
                          ? ' (gratis)'
                          : child.child_price && roomPrice?.price
                          ? ` (${Math.round((child.child_price / roomPrice.price) * 100)}% descuento)`
                          : ` ($${child.child_price?.toLocaleString()})`}
                      </p>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">2-17 años</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, kids: Math.max(0, prev.kids - 1) }))}
                className="w-10 h-10 bg-white rounded-lg border-2 border-gray-300 hover:border-purple-600 transition-colors"
              >
                −
              </button>
              <span className="text-xl font-bold text-gray-900 w-8 text-center">{formData.kids}</span>
              <button
                onClick={() => setFormData(prev => ({ ...prev, kids: Math.min(20, prev.kids + 1) }))}
                className="w-10 h-10 bg-white rounded-lg border-2 border-gray-300 hover:border-purple-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Babys */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Bebés</h3>
              {/* ✅ Mostrar rangos dinámicos desde children[] */}
              {childrenRanges.length > 0 ? (
                <div className="space-y-1">
                  {childrenRanges
                    .filter(c => c.max_minor_age < 2) // Solo bebés (menores de 2 años)
                    .map((child, idx) => (
                      <p key={idx} className="text-sm text-gray-600">
                        {child.name || `${child.min_minor_age}-${child.max_minor_age} años`}
                        {child.child_price === 0 ? ' (gratis)' : ` ($${child.child_price?.toLocaleString()})`}
                      </p>
                    ))}
                  {childrenRanges.filter(c => c.max_minor_age < 2).length === 0 && (
                    <p className="text-sm text-gray-600">Menores de 2 años (gratis)</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Menores de 2 años (gratis)</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, babys: Math.max(0, prev.babys - 1) }))}
                className="w-10 h-10 bg-white rounded-lg border-2 border-gray-300 hover:border-purple-600 transition-colors"
              >
                −
              </button>
              <span className="text-xl font-bold text-gray-900 w-8 text-center">{formData.babys}</span>
              <button
                onClick={() => setFormData(prev => ({ ...prev, babys: Math.min(10, prev.babys + 1) }))}
                className="w-10 h-10 bg-white rounded-lg border-2 border-gray-300 hover:border-purple-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NUEVO: Companion Details Form */}
      {formData.adults > 0 && (
        <div className="space-y-4">
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Información de los viajeros</h3>
            <p className="text-sm text-gray-600 mb-4">
              Por favor completa la información de todos los adultos que viajarán.
              El viajero principal recibirá todas las notificaciones y será el contacto principal.
            </p>
            <CompanionDetailsForm
              companions={companions}
              onUpdate={onUpdateCompanions}
              totalAdults={formData.adults}
              productType={product.product_type as 'circuit' | 'package'}
            />
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Extra Services Selector */}
      {selectedSeason?.extra_prices && selectedSeason.extra_prices.length > 0 && (
        <div className="space-y-4">
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Servicios adicionales</h3>
            <p className="text-sm text-gray-600 mb-4">
              Mejora tu experiencia con servicios opcionales. Puedes seleccionar los que desees.
            </p>
            <ExtraServicesSelector
              extraServices={selectedSeason.extra_prices.map(extra => ({
                id: extra.id,
                service_name: extra.room_name, // Usando room_name como service_name
                description: undefined, // Backend no provee descripción aún
                price: extra.price,
                currency: extra.currency,
                icon: undefined, // Será inferido por el componente
                recommended: false // Backend no indica recomendados
              }))}
              selected={selectedExtraServices}
              onToggle={(serviceId) => {
                const newSelected = selectedExtraServices.includes(serviceId)
                  ? selectedExtraServices.filter(id => id !== serviceId)
                  : [...selectedExtraServices, serviceId];
                onUpdateExtraServices(newSelected);
              }}
            />
          </div>
        </div>
      )}

      {/* ❌ ELIMINADO: Price preview - Backend calculará precio final con Secure Pricing System
          El precio se mostrará después de createReservation en ReviewStep con PaymentPlan */}

      {/* Actions */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Atrás
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

/**
 * ReviewStep - Paso 3: Revisión y confirmación
 */
interface ReviewStepProps {
  product: MarketplaceProduct;
  formData: BookingFormData;
  onConfirm: () => void;
  onBack: () => void;
  isProcessing: boolean;
  onUpdateFormData: (data: Partial<BookingFormData>) => void; // Nueva función para actualizar paymentType
}

function ReviewStep({ product, formData, onConfirm, onBack, isProcessing, onUpdateFormData }: ReviewStepProps) {
  const selectedSeason = product.seasons?.find(s => s.id === formData.selectedSeasonId);

  // Show processing overlay when creating reservation
  if (isProcessing) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Procesando tu reserva...</h2>
          <p className="text-gray-600">Estamos creando tu reservación y generando el plan de pago</p>
        </div>

        {/* Processing skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-6">
              <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Processing indicator */}
        <div className="flex items-center justify-center gap-3 p-8">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Creando reservación...</p>
        </div>

        {/* Disabled buttons */}
        <div className="flex gap-4 pt-6">
          <button
            disabled
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium opacity-50 cursor-not-allowed"
          >
            Atrás
          </button>
          <button
            disabled
            className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium opacity-50 cursor-not-allowed flex items-center justify-center"
          >
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Procesando...
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu reserva</h2>
        <p className="text-gray-600">Verifica que todos los detalles sean correctos</p>
      </div>

      {/* Booking details */}
      <div className="space-y-4">
        {/* Product info */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Producto</h3>
          <p className="text-gray-700">{product.name}</p>
          <p className="text-sm text-gray-600">{product.product_type === 'circuit' ? 'Circuito' : 'Paquete'}</p>
        </div>

        {/* Season info */}
        {selectedSeason && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Temporada</h3>
            <p className="text-gray-700">
              {new Date(selectedSeason.start_date || '').toLocaleDateString()} - {new Date(selectedSeason.end_date || '').toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">{selectedSeason.number_of_nights} noches</p>
          </div>
        )}

        {/* Travelers info - ✅ Sin texto hardcodeado, solo números */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Viajeros</h3>
          <div className="space-y-2">
            {formData.adults > 0 && <p className="text-gray-700">{formData.adults} Adulto(s)</p>}
            {formData.kids > 0 && <p className="text-gray-700">{formData.kids} Niño(s)</p>}
            {formData.babys > 0 && <p className="text-gray-700">{formData.babys} Bebé(s)</p>}
          </div>
        </div>

        {/* ✅ NUEVO: Companions details */}
        {formData.companions && formData.companions.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Información de viajeros</h3>
            <div className="space-y-4">
              {formData.companions.map((companion, index) => (
                <div key={companion.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {companion.name} {companion.family_name}
                        {companion.isLeadPassenger && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            Viajero Principal
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Adulto {index + 1}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600">Fecha de nacimiento</p>
                      <p className="text-gray-900">{new Date(companion.birthday).toLocaleDateString()}</p>
                    </div>
                    {companion.gender && (
                      <div>
                        <p className="text-gray-600">Género</p>
                        <p className="text-gray-900 capitalize">{companion.gender === 'male' ? 'Masculino' : companion.gender === 'female' ? 'Femenino' : 'Otro'}</p>
                      </div>
                    )}
                    {companion.country && (
                      <div>
                        <p className="text-gray-600">País</p>
                        <p className="text-gray-900">{companion.country}</p>
                      </div>
                    )}
                    {companion.passport_number && (
                      <div>
                        <p className="text-gray-600">Pasaporte</p>
                        <p className="text-gray-900">{companion.passport_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ NUEVO: Extra services */}
        {formData.selectedExtraServices && formData.selectedExtraServices.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Servicios adicionales</h3>
            <div className="space-y-3">
              {formData.selectedExtraServices.map((serviceId) => {
                const extraService = selectedSeason?.extra_prices?.find(e => e.id === serviceId);
                if (!extraService) return null;
                return (
                  <div key={serviceId} className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🎫</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{extraService.room_name}</p>
                        <p className="text-sm text-gray-600">Servicio adicional</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${extraService.price.toLocaleString()} {extraService.currency}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ✅ PaymentPlan Summary - Backend-calculated secure pricing */}
        {formData.paymentPlan ? (
          <PaymentPlanSummary
            paymentPlan={formData.paymentPlan}
            selectedType={formData.paymentType}
          />
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ Plan de pago no disponible. Por favor, intenta nuevamente o contacta a soporte.
              </p>
            </div>
          </div>
        )}

        {/* Payment Type Selector */}
        <div>
          <PaymentTypeSelector
            selected={formData.paymentType}
            onChange={(type) => onUpdateFormData({ paymentType: type })}
            paymentPolicy={product.payment_policy} // ✅ AÑADIDO: Pasar payment_policy del producto
          />
        </div>

        {/* Policies - ✅ Mostrar desde payment_policy estructura correcta */}
        {product.payment_policy && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Políticas de Pago
            </h3>

            {/* Mostrar benefits_or_legal del tipo de pago seleccionado */}
            {product.payment_policy.options?.find(opt => opt.type === formData.paymentType)?.benefits_or_legal && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-purple-700 mb-2">
                  {formData.paymentType === 'CONTADO' ? '💵 Pago de Contado' : '💳 Pago en Plazos'}
                </h4>
                <ul className="space-y-1">
                  {product.payment_policy.options
                    .find(opt => opt.type === formData.paymentType)
                    ?.benefits_or_legal?.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{item.stated}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Política de cambios */}
            {product.payment_policy.general_policies?.change_policy && (
              <div className="border-t border-gray-200 pt-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">📅 Política de Cambios</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    {product.payment_policy.general_policies.change_policy.allows_date_change
                      ? `✓ Se permiten cambios de fecha hasta ${product.payment_policy.general_policies.change_policy.deadline_days_to_make_change} días antes`
                      : '✗ No se permiten cambios de fecha'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Atrás
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Procesando...
            </span>
          ) : (
            'Confirmar y pagar'
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * CompletedStep - Paso 4: Reserva completada con redirect a MIT Payment Gateway
 * ✅ Inicia pago con MIT automáticamente al cargar este step
 */
interface CompletedStepProps {
  product: MarketplaceProduct;
  formData: BookingFormData;
}

function CompletedStep({ product, formData }: CompletedStepProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // ✅ Iniciar pago con MIT automáticamente al cargar
  React.useEffect(() => {
    const initiatePayment = async () => {
      if (!formData.paymentPlan) {
        setPaymentError('Plan de pago no encontrado');
        setIsInitiatingPayment(false);
        return;
      }

      try {
        console.log('[CompletedStep] 💳 Iniciando pago con MIT Gateway...');

        const { initiateMITPaymentAction } = await import('@/lib/server/reservation-actions');
        const result = await initiateMITPaymentAction(formData.paymentPlan.id);

        if (!result.success || !result.data?.checkoutUrl) {
          throw new Error(result.error || 'Error al iniciar el pago');
        }

        console.log('[CompletedStep] ✅ Checkout URL obtenida, redirigiendo a MIT:', result.data.checkoutUrl);

        // Redirigir al checkout de MIT
        window.location.href = result.data.checkoutUrl;

      } catch (error) {
        console.error('[CompletedStep] ❌ Error iniciando pago con MIT:', error);
        setPaymentError(error instanceof Error ? error.message : 'Error desconocido');
        setIsInitiatingPayment(false);

        toastManager.error('❌ Error al iniciar el pago. Por favor intenta de nuevo.', {
          trackingContext: {
            feature: 'booking_wizard',
            error: error instanceof Error ? error.message : 'Unknown error',
            productId: product.id,
            category: 'payment_initiation_error',
          },
        });
      }
    };

    // Iniciar pago después de un pequeño delay para mostrar feedback visual
    const timer = setTimeout(() => {
      startTransition(() => {
        initiatePayment();
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.paymentPlan, product.id]);

  // Renderizar estado de carga mientras se inicia el pago
  if (isInitiatingPayment) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Reserva confirmada!</h2>
        <p className="text-gray-600 mb-8">
          Redirigiendo al sistema de pagos seguro...
        </p>

        <div className="bg-purple-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Resumen de tu reserva</h3>
          <div className="text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Producto:</span>
              <span className="font-medium text-gray-900">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Viajeros:</span>
              <span className="font-medium text-gray-900">
                {formData.adults + formData.kids + formData.babys} personas
              </span>
            </div>
            {formData.paymentPlan && (
              <div className="flex justify-between border-t border-purple-200 pt-2 mt-2">
                <span className="text-gray-900 font-semibold">Total a pagar:</span>
                <span className="font-bold text-purple-600">
                  ${(formData.paymentType === 'CONTADO'
                    ? formData.paymentPlan.cash_final_amount
                    : formData.paymentPlan.installment_total_amount
                  ).toLocaleString()} {formData.paymentPlan.currency}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Pago seguro con cifrado SSL</span>
        </div>
      </div>
    );
  }

  // Renderizar error si hubo problema al iniciar pago
  if (paymentError) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">Error al procesar el pago</h2>
        <p className="text-gray-600 mb-8">
          {paymentError}
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 max-w-md mx-auto">
          <h3 className="font-semibold text-amber-900 mb-2">Tu reserva fue creada</h3>
          <p className="text-sm text-amber-800">
            La reserva #{formData.reservationId} fue creada exitosamente, pero hubo un problema al iniciar el pago.
            Por favor, contacta a soporte o intenta de nuevo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/marketplace')}
            className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Volver al marketplace
          </button>
          <button
            onClick={() => router.push('/traveler/reservations')}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
          >
            Ver mis reservas
          </button>
        </div>
      </div>
    );
  }

  // Este estado normalmente no se alcanza porque hay redirect a MIT
  return null;
}

/**
 * BookingWizardSkeleton - Loading skeleton for booking wizard
 *
 * Provides visual feedback while booking data is loading
 */
function BookingWizardSkeleton() {
  return (
    <div className="bg-gray-50 -mt-8 relative z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal: Wizard skeleton */}
          <div className="lg:col-span-2">
            {/* Progress indicator skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step content skeleton */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="space-y-6">
                {/* Title skeleton */}
                <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse"></div>

                {/* Content skeleton */}
                <div className="space-y-4">
                  <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>

                {/* Button skeleton */}
                <div className="flex justify-end gap-3 mt-6">
                  <div className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna lateral: Product summary skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              {/* Image skeleton */}
              <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse mb-4"></div>

              {/* Title skeleton */}
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>

              {/* Details skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
