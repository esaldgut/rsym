'use client';

/**
 * Review Change Date Step
 *
 * Second step of Change Date Wizard.
 * Displays comparison between current and new reservation details,
 * including price difference calculation.
 *
 * Features:
 * - Side-by-side comparison of dates and prices
 * - Calculates price difference (refund or additional payment)
 * - Shows impact on payment plan
 * - Displays affected installments
 * - Clear summary of changes
 */

import type { SelectedDateData } from './SelectNewDateStep';

/**
 * Reservation Data (minimal required)
 */
interface ReservationData {
  id: string;
  adults: number;
  kids: number;
  babys: number;
  reservation_date: string;
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
 * ReviewChangeDateStep Props
 */
interface ReviewChangeDateStepProps {
  reservation: ReservationData;
  paymentPlan: PaymentPlanData;
  product: ProductData;
  newDateData: SelectedDateData;
  onBack: () => void;
  onConfirm: () => void;
}

export default function ReviewChangeDateStep({
  reservation,
  paymentPlan,
  product,
  newDateData,
  onBack,
  onConfirm
}: ReviewChangeDateStepProps) {
  // Calculate price difference
  const priceDifference = newDateData.newTotalPrice - reservation.total_price;
  const isPriceIncrease = priceDifference > 0;
  const isPriceDecrease = priceDifference < 0;
  const isPriceSame = priceDifference === 0;

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

  // Calculate payment plan impact
  const isContado = paymentPlan.plan_type === 'CONTADO';
  const hasInstallments = paymentPlan.installments && paymentPlan.installments.length > 0;

  // Count paid/pending installments
  const paidInstallments = paymentPlan.installments?.filter(i =>
    i.status.toLowerCase() === 'paid' || i.status.toLowerCase() === 'completed'
  ) || [];

  const pendingInstallments = paymentPlan.installments?.filter(i =>
    i.status.toLowerCase() === 'pending' || i.status.toLowerCase() === 'due'
  ) || [];

  // Determine payment plan impact message
  const getPaymentImpactMessage = (): {
    title: string;
    description: string;
    color: string;
  } => {
    if (isPriceSame) {
      return {
        title: 'Sin Cambio en el Plan de Pagos',
        description: 'El precio es el mismo, tu plan de pagos permanece sin cambios.',
        color: 'blue'
      };
    }

    if (isContado) {
      if (isPriceIncrease) {
        return {
          title: 'Pago Adicional Requerido',
          description: `Deberás realizar un pago adicional de ${formatCurrency(Math.abs(priceDifference))} para completar el cambio de fecha.`,
          color: 'amber'
        };
      } else {
        return {
          title: 'Reembolso Disponible',
          description: `Recibirás un reembolso de ${formatCurrency(Math.abs(priceDifference))} por la diferencia de precio.`,
          color: 'green'
        };
      }
    }

    // For installments
    if (isPriceIncrease) {
      return {
        title: 'Ajuste al Plan de Pagos',
        description: `Se generará un nuevo plan de pagos con el precio actualizado. La diferencia de ${formatCurrency(Math.abs(priceDifference))} se distribuirá en los pagos pendientes.`,
        color: 'amber'
      };
    } else {
      return {
        title: 'Ajuste al Plan de Pagos',
        description: `Se generará un nuevo plan de pagos con el precio actualizado. La diferencia de ${formatCurrency(Math.abs(priceDifference))} se aplicará como crédito a los pagos pendientes.`,
        color: 'green'
      };
    }
  };

  const paymentImpact = getPaymentImpactMessage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-base font-semibold text-blue-900 mb-1">
              Revisa los Cambios
            </p>
            <p className="text-sm text-blue-800">
              Verifica que toda la información sea correcta antes de confirmar el cambio de fecha.
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

      {/* Date Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Date */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Fecha Actual</h3>
          <div className="space-y-2">
            <p className="text-base font-medium text-gray-900">
              {formatDate(reservation.reservation_date)}
            </p>
            <div className="pt-2 border-t border-gray-300">
              <p className="text-xs text-gray-600 mb-1">Desglose de Precios</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Adultos ({reservation.adults}):</span>
                  <span className="text-gray-900">
                    {formatCurrency(reservation.price_per_person * reservation.adults)}
                  </span>
                </div>
                {reservation.kids > 0 && reservation.price_per_kid && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Niños ({reservation.kids}):</span>
                    <span className="text-gray-900">
                      {formatCurrency(reservation.price_per_kid * reservation.kids)}
                    </span>
                  </div>
                )}
                <div className="pt-1 border-t border-gray-300 flex justify-between font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{formatCurrency(reservation.total_price)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Date */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Nueva Fecha</h3>
          <div className="space-y-2">
            <p className="text-base font-medium text-blue-900">
              {formatDate(newDateData.newDate)}
            </p>
            {newDateData.seasonName && (
              <p className="text-xs text-blue-700">
                Temporada: {newDateData.seasonName}
              </p>
            )}
            <div className="pt-2 border-t border-blue-300">
              <p className="text-xs text-blue-700 mb-1">Desglose de Precios</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Adultos ({reservation.adults}):</span>
                  <span className="text-blue-900">
                    {formatCurrency(newDateData.newPricePerPerson * reservation.adults)}
                  </span>
                </div>
                {reservation.kids > 0 && newDateData.newPricePerKid && (
                  <div className="flex justify-between">
                    <span className="text-blue-800">Niños ({reservation.kids}):</span>
                    <span className="text-blue-900">
                      {formatCurrency(newDateData.newPricePerKid * reservation.kids)}
                    </span>
                  </div>
                )}
                <div className="pt-1 border-t border-blue-300 flex justify-between font-semibold">
                  <span className="text-blue-900">Total:</span>
                  <span className="text-blue-900">{formatCurrency(newDateData.newTotalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Difference */}
      <div className={`border-2 rounded-lg p-4 ${
        isPriceSame
          ? 'bg-blue-50 border-blue-200'
          : isPriceIncrease
          ? 'bg-amber-50 border-amber-200'
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          {isPriceSame && (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {isPriceIncrease && (
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
          {isPriceDecrease && (
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          )}
          <div>
            <h3 className={`text-base font-semibold ${
              isPriceSame
                ? 'text-blue-900'
                : isPriceIncrease
                ? 'text-amber-900'
                : 'text-green-900'
            }`}>
              {isPriceSame && 'Precio Sin Cambios'}
              {isPriceIncrease && `Incremento de ${formatCurrency(Math.abs(priceDifference))}`}
              {isPriceDecrease && `Descuento de ${formatCurrency(Math.abs(priceDifference))}`}
            </h3>
          </div>
        </div>
      </div>

      {/* Payment Plan Impact */}
      <div className={`border-2 rounded-lg p-4 ${
        paymentImpact.color === 'blue'
          ? 'bg-blue-50 border-blue-200'
          : paymentImpact.color === 'amber'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex gap-3">
          <svg className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
            paymentImpact.color === 'blue'
              ? 'text-blue-600'
              : paymentImpact.color === 'amber'
              ? 'text-amber-600'
              : 'text-green-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div>
            <p className={`text-base font-semibold mb-1 ${
              paymentImpact.color === 'blue'
                ? 'text-blue-900'
                : paymentImpact.color === 'amber'
                ? 'text-amber-900'
                : 'text-green-900'
            }`}>
              {paymentImpact.title}
            </p>
            <p className={`text-sm ${
              paymentImpact.color === 'blue'
                ? 'text-blue-800'
                : paymentImpact.color === 'amber'
                ? 'text-amber-800'
                : 'text-green-800'
            }`}>
              {paymentImpact.description}
            </p>

            {/* Show installment details if applicable */}
            {hasInstallments && !isPriceSame && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className={`text-xs font-medium mb-2 ${
                  paymentImpact.color === 'blue'
                    ? 'text-blue-800'
                    : paymentImpact.color === 'amber'
                    ? 'text-amber-800'
                    : 'text-green-800'
                }`}>
                  Estado de Pagos:
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className={paymentImpact.color === 'blue'
                      ? 'text-blue-700'
                      : paymentImpact.color === 'amber'
                      ? 'text-amber-700'
                      : 'text-green-700'
                    }>
                      Pagos completados:
                    </span>
                    <span className={paymentImpact.color === 'blue'
                      ? 'text-blue-900 font-medium'
                      : paymentImpact.color === 'amber'
                      ? 'text-amber-900 font-medium'
                      : 'text-green-900 font-medium'
                    }>
                      {paidInstallments.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={paymentImpact.color === 'blue'
                      ? 'text-blue-700'
                      : paymentImpact.color === 'amber'
                      ? 'text-amber-700'
                      : 'text-green-700'
                    }>
                      Pagos pendientes:
                    </span>
                    <span className={paymentImpact.color === 'blue'
                      ? 'text-blue-900 font-medium'
                      : paymentImpact.color === 'amber'
                      ? 'text-amber-900 font-medium'
                      : 'text-green-900 font-medium'
                    }>
                      {pendingInstallments.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Notas Importantes</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>El cambio de fecha se procesará inmediatamente después de la confirmación</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Recibirás un correo de confirmación con los detalles actualizados</span>
          </li>
          {!isPriceSame && (
            <li className="flex gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                {isPriceIncrease
                  ? 'El pago adicional deberá realizarse dentro de las próximas 48 horas'
                  : 'El reembolso se procesará en un plazo de 5-7 días hábiles'
                }
              </span>
            </li>
          )}
          <li className="flex gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Los datos de los viajeros permanecerán sin cambios</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
        >
          ← Cambiar Fecha
        </button>

        <button
          onClick={onConfirm}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors"
        >
          Confirmar Cambio →
        </button>
      </div>
    </div>
  );
}
