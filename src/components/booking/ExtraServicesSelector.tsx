'use client';

import { cn } from '@/lib/utils';

/**
 * ExtraServicesSelector Component
 *
 * Displays optional services that can be added to the booking with:
 * - Service name, description, and price
 * - Checkbox selection
 * - Contextual icons
 * - Total price calculation
 * - Recommended badges
 *
 * @example
 * ```tsx
 * <ExtraServicesSelector
 *   extraServices={product.extra_services}
 *   selected={formData.selectedExtraServices}
 *   onToggle={(serviceId) => toggleService(serviceId)}
 * />
 * ```
 */

export interface ExtraService {
  id: string;
  service_name: string;
  description?: string;
  price: number;
  currency: string;
  icon?: string;
  recommended?: boolean;
}

export interface ExtraServicesSelectorProps {
  extraServices: ExtraService[];
  selected: string[];
  onToggle: (serviceId: string) => void;
}

export function ExtraServicesSelector({
  extraServices,
  selected,
  onToggle
}: ExtraServicesSelectorProps) {
  // Get icon based on service name if not provided
  const getServiceIcon = (service: ExtraService): string => {
    if (service.icon) return service.icon;

    const lowerName = service.service_name.toLowerCase();

    if (lowerName.includes('seguro') || lowerName.includes('insurance')) return '🛡️';
    if (lowerName.includes('tour') || lowerName.includes('excursion')) return '🎫';
    if (lowerName.includes('transfer') || lowerName.includes('transporte')) return '🚌';
    if (lowerName.includes('comida') || lowerName.includes('meal')) return '🍽️';
    if (lowerName.includes('spa') || lowerName.includes('masaje')) return '💆';
    if (lowerName.includes('wifi') || lowerName.includes('internet')) return '📶';
    if (lowerName.includes('foto') || lowerName.includes('photo')) return '📸';
    if (lowerName.includes('guía') || lowerName.includes('guide')) return '👨‍🏫';

    return '✨'; // Default icon
  };

  // Calculate total of selected services
  const calculateTotal = (): number => {
    return extraServices
      .filter(service => selected.includes(service.id))
      .reduce((sum, service) => sum + service.price, 0);
  };

  const total = calculateTotal();
  const currency = extraServices[0]?.currency || 'MXN';
  const hasSelectedServices = selected.length > 0;

  if (extraServices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay servicios adicionales disponibles para este producto.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Servicios adicionales
        </h3>
        <p className="text-sm text-gray-600">
          Mejora tu experiencia con estos servicios opcionales
        </p>
      </div>

      {/* Services Grid */}
      <div className="space-y-3">
        {extraServices.map((service) => {
          const isSelected = selected.includes(service.id);
          const icon = getServiceIcon(service);

          return (
            <div
              key={service.id}
              onClick={() => onToggle(service.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                isSelected
                  ? "border-pink-500 bg-pink-50 shadow-md"
                  : "border-gray-200 hover:border-pink-300 hover:shadow-sm"
              )}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle(service.id);
                }
              }}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 pt-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 border-pink-500"
                        : "border-gray-300 bg-white"
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Icon */}
                <div className="text-3xl flex-shrink-0">
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-gray-900">
                        {service.service_name}
                      </h4>
                      {service.recommended && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          ⭐ Recomendado
                        </span>
                      )}
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-lg font-black",
                      isSelected
                        ? "bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
                        : "text-gray-700"
                    )}>
                      +${service.price.toLocaleString()} {service.currency}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      {hasSelectedServices && (
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 pt-4 mt-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
            <div>
              <p className="text-sm text-gray-600">
                Total servicios adicionales
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selected.length} {selected.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                ${total.toLocaleString()} {currency}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                por persona
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-2">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs text-blue-800">
            Los servicios adicionales son opcionales y se agregan al precio base del viaje.
            Puedes modificar tu selección en cualquier momento antes de confirmar la reserva.
          </p>
        </div>
      </div>
    </div>
  );
}
