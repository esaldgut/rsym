'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * SeasonCard Component
 *
 * Displays season information in an attractive card format with:
 * - Season dates and duration
 * - Category badge
 * - Base price
 * - Real-time seat availability counter
 * - Visual selection state
 *
 * @example
 * ```tsx
 * <SeasonCard
 *   season={season}
 *   index={0}
 *   isSelected={selectedSeasonIndex === 0}
 *   onSelect={() => setSelectedSeasonIndex(0)}
 * />
 * ```
 */

export interface SeasonCardProps {
  season: {
    id: string;
    start_date: string;
    end_date: string;
    number_of_nights: string;
    category?: string;
    allotment: number;
    allotment_remain: number;
    prices: Array<{
      room_name: string;
      price: number;
      currency: string;
    }>;
  };
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

type AvailabilityStatus = 'available' | 'low-availability' | 'sold-out';

export function SeasonCard({ season, index, isSelected, onSelect }: SeasonCardProps) {
  // Format dates
  const startDate = format(new Date(season.start_date), "MMM dd", { locale: es });
  const endDate = format(new Date(season.end_date), "MMM dd, yyyy", { locale: es });

  // Calculate minimum price from all room types
  const minPrice = season.prices.length > 0
    ? Math.min(...season.prices.map(p => p.price))
    : 0;

  const currency = season.prices[0]?.currency || 'MXN';

  // Determine availability status
  const availabilityStatus: AvailabilityStatus =
    season.allotment_remain <= 0 ? 'sold-out' :
    season.allotment_remain <= 5 ? 'low-availability' :
    'available';

  // Disable interaction if sold out
  const isDisabled = availabilityStatus === 'sold-out';

  const handleClick = () => {
    if (!isDisabled) {
      onSelect();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "min-w-[280px] p-6 rounded-2xl border-2 transition-all duration-300",
        isDisabled
          ? "opacity-50 cursor-not-allowed border-gray-300 bg-gray-50"
          : "cursor-pointer",
        !isDisabled && isSelected
          ? "border-pink-500 bg-pink-50 shadow-xl transform scale-105"
          : "",
        !isDisabled && !isSelected
          ? "border-gray-200 hover:border-pink-300 hover:shadow-lg hover:transform hover:scale-102"
          : ""
      )}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={`Temporada ${index + 1}: ${startDate} - ${endDate}`}
      aria-selected={isSelected}
      aria-disabled={isDisabled}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Category Badge and Status */}
      <div className="flex items-center justify-between mb-4">
        <span className={cn(
          "text-sm font-semibold px-3 py-1 rounded-full",
          isDisabled
            ? "bg-gray-400 text-white"
            : "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
        )}>
          {season.category || 'Temporada'}
        </span>

        {availabilityStatus === 'low-availability' && (
          <span className="text-xs font-semibold text-orange-600 animate-pulse">
            ¡Últimas plazas!
          </span>
        )}
      </div>

      {/* Dates */}
      <div className="mb-2">
        <p className="text-lg font-bold text-gray-900">
          {startDate} - {endDate}
        </p>
        <p className="text-sm text-gray-600">
          {season.number_of_nights} noches
        </p>
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">Desde</p>
        <p className={cn(
          "text-2xl font-black",
          isDisabled
            ? "text-gray-500"
            : "bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
        )}>
          ${minPrice.toLocaleString()} {currency}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          por persona
        </p>
      </div>

      {/* Availability Badge */}
      <div className="flex items-center gap-2">
        {availabilityStatus === 'sold-out' ? (
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
            <span className="text-sm font-medium text-red-700">
              Agotado
            </span>
          </>
        ) : availabilityStatus === 'low-availability' ? (
          <>
            <svg
              className="w-5 h-5 text-orange-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-orange-700">
              {season.allotment_remain} {season.allotment_remain === 1 ? 'plaza disponible' : 'plazas disponibles'}
            </span>
          </>
        ) : (
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
              {season.allotment_remain} {season.allotment_remain === 1 ? 'plaza disponible' : 'plazas disponibles'}
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
    </div>
  );
}
