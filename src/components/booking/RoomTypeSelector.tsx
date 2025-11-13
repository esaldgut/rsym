'use client';

import { cn } from '@/lib/utils';

/**
 * RoomTypeSelector Component
 *
 * Displays available room types with capacity and pricing information.
 * Validates that selected room can accommodate the number of travelers.
 *
 * @example
 * ```tsx
 * <RoomTypeSelector
 *   prices={season.prices}
 *   selected={formData.selectedRoomTypeId}
 *   onSelect={(priceId) => updateFormData({ selectedRoomTypeId: priceId })}
 *   adults={2}
 *   kids={1}
 * />
 * ```
 */

export interface RoomTypeSelectorProps {
  prices: Array<{
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
  selected: string | null;  // price.id
  onSelect: (priceId: string) => void;
  adults: number;
  kids: number;
  babys?: number;
}

export function RoomTypeSelector({
  prices,
  selected,
  onSelect,
  adults,
  kids,
  babys = 0
}: RoomTypeSelectorProps) {
  // Calculate if room can accommodate travelers
  const canAccommodate = (price: typeof prices[0]) => {
    const totalAdults = adults;
    const totalKids = kids + babys;  // Babies count toward kid capacity

    return totalAdults <= price.max_adult && totalKids <= price.max_minor;
  };

  // Get bed icon based on room name
  const getRoomIcon = (roomName: string) => {
    const lowerName = roomName.toLowerCase();

    if (lowerName.includes('suite') || lowerName.includes('presidencial')) {
      return '🛏️🛏️🛏️';
    }
    if (lowerName.includes('triple') || lowerName.includes('familiar')) {
      return '🛏️🛏️';
    }
    if (lowerName.includes('doble') || lowerName.includes('matrimonial')) {
      return '🛏️';
    }

    return '🛏️';  // Default single bed icon
  };

  if (prices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay tipos de habitación disponibles para esta temporada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Selecciona el tipo de habitación
        </h3>
        <p className="text-sm text-gray-600">
          Viajeros: {adults} {adults === 1 ? 'adulto' : 'adultos'}
          {kids > 0 && `, ${kids} ${kids === 1 ? 'niño' : 'niños'}`}
          {babys > 0 && `, ${babys} ${babys === 1 ? 'bebé' : 'bebés'}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prices.map((price) => {
          const isCompatible = canAccommodate(price);
          const isSelected = selected === price.id;
          const isDisabled = !isCompatible;

          const roomIcon = getRoomIcon(price.room_name);

          return (
            <div
              key={price.id}
              onClick={() => {
                if (!isDisabled) {
                  onSelect(price.id);
                }
              }}
              className={cn(
                "relative p-6 rounded-2xl border-2 transition-all duration-300",
                isDisabled
                  ? "opacity-50 cursor-not-allowed border-gray-300 bg-gray-50"
                  : "cursor-pointer",
                !isDisabled && isSelected
                  ? "border-pink-500 bg-pink-50 shadow-xl"
                  : "",
                !isDisabled && !isSelected
                  ? "border-gray-200 hover:border-pink-300 hover:shadow-lg"
                  : ""
              )}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-label={`${price.room_name} - $${price.price.toLocaleString()} ${price.currency}`}
              aria-selected={isSelected}
              aria-disabled={isDisabled}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                  e.preventDefault();
                  onSelect(price.id);
                }
              }}
            >
              {/* Room Icon */}
              <div className="text-4xl mb-3 text-center">
                {roomIcon}
              </div>

              {/* Room Name */}
              <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">
                {price.room_name}
              </h4>

              {/* Capacity */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <span>👥</span>
                    Adultos
                  </span>
                  <span className={cn(
                    "font-semibold",
                    adults > price.max_adult ? "text-red-600" : "text-gray-900"
                  )}>
                    Hasta {price.max_adult}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <span>👶</span>
                    Niños
                  </span>
                  <span className={cn(
                    "font-semibold",
                    (kids + babys) > price.max_minor ? "text-red-600" : "text-gray-900"
                  )}>
                    Hasta {price.max_minor}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <p className="text-sm text-gray-600 text-center">Precio por habitación</p>
                <p className={cn(
                  "text-2xl font-black text-center",
                  isDisabled
                    ? "text-gray-500"
                    : "bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
                )}>
                  ${price.price.toLocaleString()} {price.currency}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {isCompatible ? (
                  <>
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-700">
                      Compatible
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium text-red-700">
                      {adults > price.max_adult
                        ? 'Excede adultos'
                        : 'Excede niños'}
                    </span>
                  </>
                )}
              </div>

              {/* Selected Indicator */}
              {isSelected && !isDisabled && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-label="Seleccionado"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Children Pricing Tooltip (if available) */}
              {price.children && price.children.length > 0 && !isDisabled && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-2">
                    Precios para niños:
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    {price.children.map((child, idx) => (
                      <li key={idx}>
                        {child.name}: ${child.child_price.toLocaleString()} {price.currency}
                        <span className="text-blue-600">
                          {' '}({child.min_minor_age}-{child.max_minor_age} años)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Helper Text */}
      {prices.some(p => !canAccommodate(p)) && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex gap-2">
            <svg
              className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Algunas habitaciones no están disponibles
              </p>
              <p className="text-xs text-amber-800 mt-1">
                El número de viajeros excede la capacidad de algunas habitaciones.
                Ajusta el número de viajeros o selecciona una habitación compatible.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
