/**
 * Payment Type Selector Component
 *
 * Permite al usuario seleccionar el tipo de pago para su reservación:
 * - CONTADO: Pago completo por adelantado
 * - PLAZOS: Pago en cuotas (meses sin intereses)
 *
 * @module PaymentTypeSelector
 */
'use client';

import { useState } from 'react';

export type PaymentType = 'CONTADO' | 'PLAZOS';

export interface PaymentTypeOption {
  value: PaymentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
}

// ✅ Tipo extendido de payment_policy para uso en el componente
export interface PaymentPolicy {
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
}

export interface PaymentTypeSelectorProps {
  selected: PaymentType;
  onChange: (type: PaymentType) => void;
  paymentPolicy?: PaymentPolicy; // ✅ AÑADIDO: Política de pago dinámica del producto
  className?: string;
}

// ✅ Opciones FALLBACK si no hay payment_policy disponible
const DEFAULT_PAYMENT_OPTIONS: PaymentTypeOption[] = [
  {
    value: 'CONTADO',
    label: 'Pago de Contado',
    description: 'Paga el monto total ahora',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    benefits: [
      'Pago único y completo',
      'Sin cargos adicionales',
      'Confirmación inmediata'
    ]
  },
  {
    value: 'PLAZOS',
    label: 'Pago en Plazos',
    description: 'Divide tu pago en cuotas mensuales',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    benefits: [
      'Meses sin intereses',
      'Pagos mensuales fijos',
      'Mayor flexibilidad financiera'
    ]
  }
];

/**
 * Componente selector de tipo de pago para reservaciones
 *
 * @example
 * ```tsx
 * <PaymentTypeSelector
 *   selected={formData.paymentType}
 *   onChange={(type) => updateFormData({ paymentType: type })}
 * />
 * ```
 */
export function PaymentTypeSelector({
  selected,
  onChange,
  paymentPolicy,
  className = ''
}: PaymentTypeSelectorProps) {
  const [hoveredOption, setHoveredOption] = useState<PaymentType | null>(null);

  // ✅ Generar opciones dinámicamente desde payment_policy o usar fallback
  const paymentOptions: PaymentTypeOption[] = paymentPolicy?.options.map(policyOption => {
    // Icono según tipo
    const icon = policyOption.type === 'CONTADO' ? (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ) : (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    );

    // Extraer beneficios de múltiples fuentes
    const benefits: string[] = [
      ...(policyOption.benefits_or_legal?.map(b => b.stated) || []),
      ...(policyOption.config.cash?.benefits_or_legal?.map(b => b.stated) || []),
      ...(policyOption.config.installments?.benefits_or_legal?.map(b => b.stated) || [])
    ];

    // Añadir info de descuento si existe
    if (policyOption.config.cash?.discount && policyOption.config.cash.discount > 0) {
      const discountText = policyOption.config.cash.discount_type === 'PERCENTAGE'
        ? `${policyOption.config.cash.discount}% de descuento`
        : `$${policyOption.config.cash.discount} de descuento`;
      benefits.unshift(discountText);
    }

    return {
      value: policyOption.type,
      label: policyOption.type === 'CONTADO' ? 'Pago de Contado' : 'Pago en Plazos',
      description: policyOption.description,
      icon,
      benefits: benefits.length > 0 ? benefits : (policyOption.type === 'CONTADO' ? [
        'Pago único y completo',
        'Sin cargos adicionales',
        'Confirmación inmediata'
      ] : [
        'Meses sin intereses',
        'Pagos mensuales fijos',
        'Mayor flexibilidad financiera'
      ])
    };
  }) || DEFAULT_PAYMENT_OPTIONS;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tipo de Pago
        </h3>
        <p className="text-sm text-gray-600">
          Selecciona cómo deseas realizar el pago de tu reservación
        </p>
      </div>

      {/* Payment Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentOptions.map((option) => {
          const isSelected = selected === option.value;
          const isHovered = hoveredOption === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              onMouseEnter={() => setHoveredOption(option.value)}
              onMouseLeave={() => setHoveredOption(null)}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 text-left
                ${isSelected
                  ? 'border-purple-600 bg-purple-50 shadow-lg scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                }
                ${isHovered && !isSelected ? 'scale-[1.01]' : ''}
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`
                mb-4 inline-flex p-3 rounded-xl transition-colors
                ${isSelected
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {option.icon}
              </div>

              {/* Label */}
              <h4 className={`
                text-lg font-bold mb-2 transition-colors
                ${isSelected ? 'text-purple-900' : 'text-gray-900'}
              `}>
                {option.label}
              </h4>

              {/* Description */}
              <p className={`
                text-sm mb-4 transition-colors
                ${isSelected ? 'text-purple-700' : 'text-gray-600'}
              `}>
                {option.description}
              </p>

              {/* Benefits List */}
              <ul className="space-y-2">
                {option.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg
                      className={`
                        w-5 h-5 flex-shrink-0 mt-0.5 transition-colors
                        ${isSelected ? 'text-purple-600' : 'text-gray-400'}
                      `}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={`
                      text-sm transition-colors
                      ${isSelected ? 'text-purple-800' : 'text-gray-700'}
                    `}>
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Badge for PLAZOS */}
              {option.value === 'PLAZOS' && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs font-semibold rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Meses sin intereses
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info Message */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              <strong className="font-semibold">Nota importante:</strong> {selected === 'CONTADO'
                ? 'Al pagar de contado, tu reservación se confirmará inmediatamente después del pago.'
                : 'El pago en plazos requiere aprobación de crédito. La confirmación de tu reservación puede tardar hasta 24 horas.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
