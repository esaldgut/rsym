'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProductForm } from '@/context/ProductFormContext';
import { policiesSchema } from '@/lib/validations/product-schemas';
import type { StepProps } from '@/types/wizard';
import type { PaymentPolicyInput } from '@/lib/graphql/types';

interface PoliciesFormData {
  payment_policy: PaymentPolicyInput;
}

type PaymentType = 'CONTADO' | 'PLAZOS';
type PaymentMethods = 'CASH' | 'BANK_CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'CODI' | 'CLICK_TO_PAY';
type DiscountType = 'PERCENTAGE' | 'AMOUNT';

export default function PoliciesStep({ userId, onNext, onPrevious }: StepProps) {
  const { formData, updateFormData } = useProductForm();
  
  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<PoliciesFormData>({
    resolver: zodResolver(policiesSchema),
    defaultValues: {
      payment_policy: formData.payment_policy || {
        product_id: formData.productId || '',
        options: [],
        general_policies: {
          change_policy: {
            allows_date_chage: true,
            deadline_days_to_make_change: 15
          }
        }
      }
    }
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: 'payment_policy.options'
  });

  const onSubmit = (data: PoliciesFormData) => {
    updateFormData({ payment_policy: data.payment_policy });
    onNext();
  };

  const addPaymentOption = (type: PaymentType) => {
    const baseOption = {
      type,
      description: type === 'CONTADO' ? 'Pago completo al momento de la reserva' : 'Pago en plazos flexibles',
      config: {
        cash: type === 'CONTADO' ? {
          discount: 0,
          discount_type: 'PERCENTAGE' as DiscountType,
          deadline_days_to_pay: 1,
          payment_methods: ['BANK_CARD'] as PaymentMethods[]
        } : undefined,
        installments: type === 'PLAZOS' ? {
          down_payment_before: 30,
          down_payment_type: 'PERCENTAGE' as any,
          down_payment_after: 50,
          installment_intervals: 'MENSUAL' as any,
          days_before_must_be_settled: 30,
          deadline_days_to_pay: 3,
          payment_methods: ['BANK_CARD', 'CASH'] as PaymentMethods[]
        } : undefined
      },
      requirements: {
        deadline_days_to_pay: type === 'CONTADO' ? 1 : 3
      }
    };

    appendOption(baseOption);
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Opciones de pago */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Opciones de Pago</h3>
              <p className="text-sm text-gray-600">Agrega las formas en que los viajeros podrán pagarte</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addPaymentOption('CONTADO')}
                disabled={optionFields.some(field => field.type === 'CONTADO')}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                + Pago de Contado
              </button>
              <button
                type="button"
                onClick={() => addPaymentOption('PLAZOS')}
                disabled={optionFields.some(field => field.type === 'PLAZOS')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
              errors={errors}
              watch={watch}
              setValue={setValue}
              onRemove={() => removeOption(index)}
              paymentType={field.type as PaymentType}
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
                {...register('payment_policy.general_policies.change_policy.allows_date_chage')}
                className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
              />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-800">
                  Permitir cambios de fecha
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Los viajeros podrán cambiar las fechas de su reserva bajo ciertas condiciones
                </p>
                
                {watch('payment_policy.general_policies.change_policy.allows_date_chage') && (
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
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onPrevious}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Anterior
          </button>
          <button
            type="submit"
            disabled={optionFields.length === 0}
            className="bg-gradient-to-r from-pink-500 to-violet-600 text-white px-8 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
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
  errors,
  watch,
  setValue,
  onRemove,
  paymentType
}: {
  index: number;
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  onRemove: () => void;
  paymentType: PaymentType;
}) {
  const isContado = paymentType === 'CONTADO';

  return (
    <div className={`border-2 rounded-lg p-4 space-y-4 ${isContado ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isContado ? 'bg-green-500' : 'bg-blue-500'}`}></div>
          <h4 className="font-medium text-gray-800">
            {isContado ? 'Pago de Contado' : 'Pago en Plazos'}
          </h4>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <input
          type="text"
          {...register(`payment_policy.options.${index}.description`)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder={isContado ? 'Pago completo al reservar' : 'Pago flexible en mensualidades'}
        />
      </div>

      {isContado && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
            <input
              type="number"
              min="0"
              max="50"
              {...register(`payment_policy.options.${index}.config.cash.discount`, { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Días para pagar</label>
            <input
              type="number"
              min="1"
              {...register(`payment_policy.options.${index}.config.cash.deadline_days_to_pay`, { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="1"
            />
          </div>
        </div>
      )}

      {!isContado && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enganche inicial (%)</label>
            <input
              type="number"
              min="10"
              max="70"
              {...register(`payment_policy.options.${index}.config.installments.down_payment_before`, { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo antes del viaje (%)</label>
            <input
              type="number"
              min="30"
              max="90"
              {...register(`payment_policy.options.${index}.config.installments.down_payment_after`, { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="50"
            />
          </div>
        </div>
      )}

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