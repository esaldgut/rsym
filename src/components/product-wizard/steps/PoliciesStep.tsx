'use client';

import { SaveDraftButton } from '@/components/product-wizard/SaveDraftButton'
import { toastManager } from '@/components/ui/Toast'
import { useProductForm } from '@/context/ProductFormContext'
import { policiesSchema, type PoliciesSchemaType } from '@/lib/validations/product-schemas'
import type { StepProps } from '@/types/wizard'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, type Control, type UseFormRegister } from 'react-hook-form'

// ✅ Migrado de @/lib/graphql/types a @/generated/graphql (GraphQL Code Generator)
import type {
  GeneralPoliciesInput,
  PaymentPolicyInput as GraphQLPaymentPolicyInput,
  InputMaybe,
  PaymentOptionInput,
  PaymentType
} from '@/generated/graphql'

// Usar el tipo inferido del schema de Zod
type PoliciesFormData = PoliciesSchemaType;

// Función para convertir de GraphQL (con InputMaybe) a tipo de formulario (sin nullables)
const convertFromGraphQL = (policy?: GraphQLPaymentPolicyInput | null): PoliciesFormData['payment_policy'] => {
  if (!policy) {
    return {
      options: [],
      general_policies: {
        change_policy: {
          allows_date_change: true,
          deadline_days_to_make_change: 15
        }
      }
    };
  }

  // Filtrar nulls/undefined del array de options si existe
  const options = policy.options
    ?.filter((opt): opt is PaymentOptionInput => opt !== null && opt !== undefined)
    ?.map(opt => ({
      ...opt,
      // Asegurar que el tipo es compatible con el schema
      type: opt.type as 'CONTADO' | 'PLAZOS',
      description: opt.description || '',
      config: {
        cash: opt.config?.cash || undefined,
        installments: opt.config?.installments || undefined
      },
      benefits_or_legal: opt.benefits_or_legal?.filter(Boolean) || []
    })) || [];

  // Manejo especial para general_policies que puede venir como null/undefined de GraphQL
  const generalPolicies = policy.general_policies ? {
    change_policy: {
      allows_date_change: policy.general_policies.change_policy?.allows_date_change ?? true,
      deadline_days_to_make_change: policy.general_policies.change_policy?.deadline_days_to_make_change ?? 15
    }
  } : {
    change_policy: {
      allows_date_change: true,
      deadline_days_to_make_change: 15
    }
  };

  return {
    options: options as any, // Cast necesario por la complejidad del tipo
    general_policies: generalPolicies
  } as any; // Cast necesario por la complejidad del tipo con InputMaybe
}

export default function PoliciesStep({ onNext, onPrevious, onCancelClick }: StepProps) {
  const { formData, updateFormData } = useProductForm();
  
  const { register, handleSubmit, control, formState: { errors }, watch } = useForm<PoliciesFormData>({
    resolver: zodResolver(policiesSchema),
    defaultValues: {
      payment_policy: convertFromGraphQL(formData.payment_policy)
    }
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: 'payment_policy.options'
  });

  const onSubmit = (data: PoliciesFormData) => {
    // Logging ANTES de validación
    console.log('📊 [PoliciesStep] Datos pre-validación:', JSON.stringify(data, null, 2));

    data.payment_policy.options?.forEach((option, idx) => {
      console.log(`📋 Opción #${idx + 1}:`, option?.type);
      if (option?.type === 'CONTADO') {
        console.log(`  ├─ cash exists:`, !!option.config.cash);
        console.log(`  ├─ payment_methods:`, option.config.cash?.payment_methods);
        console.log(`  └─ length:`, option.config.cash?.payment_methods?.length);
      } else if (option?.type === 'PLAZOS') {
        console.log(`  ├─ installments exists:`, !!option.config.installments);
        console.log(`  ├─ payment_methods:`, option.config.installments?.payment_methods);
        console.log(`  └─ length:`, option.config.installments?.payment_methods?.length);
      }
    });

    console.log('✅ [PoliciesStep] Validación exitosa, datos:', data);

    // Convertir a tipo GraphQL antes de guardar (compatible con InputMaybe)
    // Necesitamos hacer el cast correcto para que coincida con el tipo GraphQL que incluye InputMaybe
    const graphQLData: GraphQLPaymentPolicyInput = {
      options: data.payment_policy.options as InputMaybe<Array<InputMaybe<PaymentOptionInput>>>,
      general_policies: data.payment_policy.general_policies as InputMaybe<GeneralPoliciesInput>
    };

    updateFormData({ payment_policy: graphQLData });
    onNext();
  };

  const onError = (errors: unknown) => {
    // Validación defensiva: verificar si errors existe y no está vacío
    if (!errors || typeof errors !== 'object') {
      console.warn('⚠️ [PoliciesStep] Objeto de errores inválido');
      return;
    }

    // Verificar si el objeto está vacío
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) {
      console.warn('⚠️ [PoliciesStep] No hay errores específicos de campo');
      return;
    }

    //console.error('❌ [PoliciesStep] Errores de validación:', errors);

    // Navegación segura en el objeto de errores
    try {
      const errorValues = Object.values(errors);
      const firstError = errorValues.find((error: unknown): error is { message: string } =>
        error !== null && typeof error === 'object' && 'message' in error
      );

      if (firstError && typeof firstError === 'object' && 'message' in firstError) {
        toastManager.show(`⚠️ Error de validación: ${firstError.message}`, 'error', 5000);
      }

      // Log detallado de errores en opciones de pago
      const errorsObj = errors as Record<string, unknown>;
      if (errorsObj.payment_policy && typeof errorsObj.payment_policy === 'object') {
        const paymentPolicyErrors = errorsObj.payment_policy as Record<string, unknown>;
        if (paymentPolicyErrors.options && Array.isArray(paymentPolicyErrors.options)) {
          paymentPolicyErrors.options.forEach((optionErrors: unknown, index: number) => {
            if (optionErrors && typeof optionErrors === 'object') {
              Object.entries(optionErrors).forEach(([field, error]) => {
                if (error && typeof error === 'object' && 'message' in error) {
                  const errorWithMessage = error as { message: string };
                  console.error(`❌ Opción #${index + 1} - ${field}:`, errorWithMessage.message);

                  // Errores específicos de payment_methods
                  if (field.includes('payment_methods')) {
                    toastManager.show(
                      `⚠️ Opción #${index + 1}: ${errorWithMessage.message}`,
                      'warning',
                      5000
                    );
                  }
                }
              });
            }
          });
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error procesando errores de validación:', errorMessage);
    }
  };

  const addPaymentOption = (type: PaymentType) => {
    // Contar cuántas opciones del mismo tipo ya existen para numeración automática
    const existingCount = optionFields.filter(field => field.type === type).length;
    const optionNumber = existingCount + 1;

    // Generar descripción con numeración automática
    const defaultDescription = type === 'CONTADO'
      ? `Opción ${optionNumber}: Pago de contado`
      : `Opción ${optionNumber}: Pago en plazos`;

    // Crear la opción siguiendo el tipo del schema de Zod (no el tipo GraphQL)
    const baseOption = {
      type,
      description: defaultDescription,
      config: {
        cash: type === 'CONTADO' ? {
          discount: 0,
          discount_type: 'PERCENTAGE' as const,
          deadline_days_to_pay: 1,
          payment_methods: ['CASH'] as ('CASH' | 'BANK_CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'CODI' | 'CLICK_TO_PAY')[] // Iniciar con efectivo seleccionado por defecto
        } : undefined,
        installments: type === 'PLAZOS' ? {
          down_payment_before: 30,
          down_payment_type: 'PERCENTAGE' as const,
          down_payment_after: 50,
          installment_intervals: 'MENSUAL' as const,
          days_before_must_be_settled: 30,
          deadline_days_to_pay: 3,
          payment_methods: ['BANK_CARD'] as ('CASH' | 'BANK_CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'CODI' | 'CLICK_TO_PAY')[] // Iniciar con tarjeta seleccionada por defecto
        } : undefined
      },
      benefits_or_legal: []
    };

    appendOption(baseOption as any); // Cast necesario por la complejidad del tipo
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-violet-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Políticas de Pago</h2>
        <p className="opacity-90">
          Define cómo y cuándo recibirás el pago por tu {formData.productType === 'circuit' ? 'circuito' : 'paquete'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
        {/* Opciones de pago */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Opciones de Pago</h3>
              <p className="text-sm text-gray-600">Agrega múltiples formas de pago para tu producto</p>
              {optionFields.length > 0 && (
                <div className="flex gap-3 mt-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {optionFields.filter(f => f.type === 'CONTADO').length} Contado
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {optionFields.filter(f => f.type === 'PLAZOS').length} Plazos
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {optionFields.length} Total
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addPaymentOption('CONTADO')}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                + Pago de Contado
              </button>
              <button
                type="button"
                onClick={() => addPaymentOption('PLAZOS')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                + Pago en Plazos
              </button>
            </div>
          </div>

          {optionFields.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="space-y-2">
                <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <p className="text-gray-500">Agrega al menos una opción de pago</p>
              </div>
            </div>
          )}

          {optionFields.map((field, index) => (
            <PaymentOptionCard
              key={field.id}
              index={index}
              register={register}
              control={control}
              onRemove={() => removeOption(index)}
              paymentType={field.type as PaymentType}
              errors={errors}
            />
          ))}

          {errors.payment_policy && (
            <p className="text-sm text-red-600">{errors.payment_policy.message}</p>
          )}
        </div>

        {/* Políticas generales */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-800">Políticas Generales</h3>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                {...register('payment_policy.general_policies.change_policy.allows_date_change')}
                className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
              />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-800">
                  Permitir cambios de fecha
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Los viajeros podrán cambiar las fechas de su reserva bajo ciertas condiciones
                </p>
                
                {watch('payment_policy.general_policies.change_policy.allows_date_change') && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Días límite para cambios
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      {...register('payment_policy.general_policies.change_policy.deadline_days_to_make_change', { valueAsNumber: true })}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="15"
                    />
                    <span className="text-sm text-gray-500 ml-2">días antes del viaje</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-gray-200">
          <div className="flex gap-3 order-2 sm:order-1">
            <button
              type="button"
              onClick={onPrevious}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              ← Anterior
            </button>
            <SaveDraftButton variant="outline" />
            {onCancelClick && (
              <button
                type="button"
                onClick={onCancelClick}
                className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={optionFields.length === 0}
            className="order-1 sm:order-2 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg font-medium transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar →
          </button>
        </div>
      </form>
    </div>
  );
}

// Componente para cada opción de pago
function PaymentOptionCard({
  index,
  register,
  control,
  onRemove,
  paymentType,
  errors
}: {
  index: number;
  register: UseFormRegister<PoliciesFormData>;
  control: Control<PoliciesFormData, any>;
  onRemove: () => void;
  paymentType: PaymentType;
  errors: any;
}) {
  const isContado = paymentType === 'CONTADO';

  // useFieldArray para manejar benefits_or_legal dinámicamente
  const { fields: benefitsFields, append: appendBenefit, remove: removeBenefit } = useFieldArray({
    control,
    name: `payment_policy.options.${index}.benefits_or_legal` as const
  });

  return (
    <div className={`border-2 rounded-lg p-4 space-y-4 ${isContado ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${isContado ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
            #{index + 1}
          </span>
          <div>
            <h4 className="font-semibold text-gray-800">
              {isContado ? 'Pago de Contado' : 'Pago en Plazos'}
            </h4>
            <p className="text-xs text-gray-600">
              {isContado ? 'Pago único con descuento' : 'Pago fraccionado'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-colors"
          title="Eliminar opción"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción personalizada <span className="text-gray-400">(editable)</span>
        </label>
        <input
          type="text"
          {...register(`payment_policy.options.${index}.description`)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder={isContado ? 'Ej: 5% descuento en pagos con tarjeta' : 'Ej: 6 meses sin intereses'}
        />
        <p className="text-xs text-gray-500 mt-1">Esta descripción será visible para los viajeros al seleccionar su método de pago</p>
      </div>

      {isContado && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descuento</label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register(`payment_policy.options.${index}.config.cash.discount`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de descuento</label>
              <select
                {...register(`payment_policy.options.${index}.config.cash.discount_type`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="AMOUNT">Monto (MXN)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Días para pagar</label>
            <input
              type="number"
              min="0"
              {...register(`payment_policy.options.${index}.config.cash.deadline_days_to_pay`, { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Métodos de pago aceptados</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'CASH', label: '💵 Efectivo' },
                { value: 'BANK_CARD', label: '💳 Tarjeta' },
                { value: 'APPLE_PAY', label: ' Apple Pay' },
                { value: 'GOOGLE_PAY', label: '🅖 Google Pay' },
                { value: 'CODI', label: '📱 CoDi' },
                { value: 'CLICK_TO_PAY', label: '🔘 Click to Pay' },
              ].map(method => (
                <label key={method.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    value={method.value}
                    {...register(`payment_policy.options.${index}.config.cash.payment_methods`)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
            {errors?.payment_policy?.options?.[index]?.config?.cash?.payment_methods && (
              <p className="text-sm text-red-600 mt-2">
                {errors.payment_policy.options[index].config.cash.payment_methods.message}
              </p>
            )}
          </div>
        </div>
      )}

      {!isContado && (
        <div className="space-y-4">
          {/* Enganche Inicial */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enganche inicial</label>
              <input
                type="number"
                min="10"
                max="100"
                step="0.01"
                {...register(`payment_policy.options.${index}.config.installments.down_payment_before`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de enganche</label>
              <select
                {...register(`payment_policy.options.${index}.config.installments.down_payment_type`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="AMOUNT">Monto (MXN)</option>
              </select>
            </div>
          </div>

          {/* Saldo y Liquidación */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saldo antes del viaje</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register(`payment_policy.options.${index}.config.installments.down_payment_after`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="50"
              />
              <p className="text-xs text-gray-500 mt-1">% que debe estar pagado antes del viaje</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Días antes para saldar</label>
              <input
                type="number"
                min="1"
                max="365"
                {...register(`payment_policy.options.${index}.config.installments.days_before_must_be_settled`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="30"
              />
              <p className="text-xs text-gray-500 mt-1">Días antes del viaje</p>
            </div>
          </div>

          {/* Configuración de Pagos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia de pagos</label>
              <select
                {...register(`payment_policy.options.${index}.config.installments.installment_intervals`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="MENSUAL">Mensual</option>
                <option value="QUINCENAL">Quincenal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Días para pagar cada cuota</label>
              <input
                type="number"
                min="1"
                {...register(`payment_policy.options.${index}.config.installments.deadline_days_to_pay`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="3"
              />
              <p className="text-xs text-gray-500 mt-1">Después de la fecha de corte</p>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Métodos de pago aceptados</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'CASH', label: '💵 Efectivo' },
                { value: 'BANK_CARD', label: '💳 Tarjeta' },
                { value: 'APPLE_PAY', label: ' Apple Pay' },
                { value: 'GOOGLE_PAY', label: '🅖 Google Pay' },
                { value: 'CODI', label: '📱 CoDi' },
                { value: 'CLICK_TO_PAY', label: '🔘 Click to Pay' },
              ].map(method => (
                <label key={method.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    value={method.value}
                    {...register(`payment_policy.options.${index}.config.installments.payment_methods`)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
            {errors?.payment_policy?.options?.[index]?.config?.installments?.payment_methods && (
              <p className="text-sm text-red-600 mt-2">
                {errors.payment_policy.options[index].config.installments.payment_methods.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Campo dinámico: Beneficios o términos legales */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Beneficios o términos legales <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <button
            type="button"
            onClick={() => appendBenefit({ stated: undefined })} // StatementsInput usa undefined para campos opcionales
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <span className="text-lg">+</span> Agregar Beneficio/Declaración
          </button>
        </div>

        {benefitsFields.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            No hay beneficios o declaraciones agregadas. Haz clic en el botón para agregar.
          </p>
        ) : (
          <div className="space-y-2">
            {benefitsFields.map((field, benefitIndex) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    {...register(`payment_policy.options.${index}.benefits_or_legal.${benefitIndex}.stated`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    placeholder={isContado ?
                      'Ej: Recibe un 5% de descuento adicional en tu próxima reserva' :
                      'Ej: Sin intereses | Términos y condiciones aplican'
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeBenefit(benefitIndex)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500">
          Agrega beneficios adicionales, términos legales o condiciones especiales para esta opción de pago
        </p>
      </div>

      <div className="bg-white bg-opacity-70 border border-gray-200 rounded p-3">
        <p className="text-sm text-gray-600">
          {isContado ?
            '✅ Recibe el pago completo al confirmar la reserva' :
            '📅 Recibe pagos escalonados hasta antes del viaje'
          }
        </p>
      </div>
    </div>
  );
}
