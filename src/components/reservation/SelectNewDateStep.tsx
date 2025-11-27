'use client';

/**
 * Select New Date Step
 *
 * First step of Change Date Wizard.
 * Displays available seasons with pricing and allows user to select a new travel date.
 *
 * Features:
 * - Shows all active seasons for the product
 * - Displays season price ranges
 * - Calendar picker for date selection
 * - Calculates new total price based on season
 * - Validates selected date is in future
 */

import { useState, useEffect } from 'react';
import { getProductSeasonsAction } from '@/lib/server/marketplace-product-actions';

/**
 * Reservation Data (minimal required)
 */
interface ReservationData {
  id: string;
  experience_id: string;
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
 * Product Data (minimal required)
 */
interface ProductData {
  id: string;
  name: string;
  product_type: string;
}

/**
 * Season Data from Backend
 */
interface SeasonPrice {
  id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  adult_base_price: number;
  child_ranges?: Array<{
    name: string;
    min_minor_age: number;
    max_minor_age: number;
    child_price: number;
  }>;
}

/**
 * Selected Date Data
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
 * SelectNewDateStep Props
 */
interface SelectNewDateStepProps {
  reservation: ReservationData;
  product: ProductData;
  onDateSelected: (dateData: SelectedDateData) => void;
  onCancel: () => void;
}

export default function SelectNewDateStep({
  reservation,
  product,
  onDateSelected,
  onCancel
}: SelectNewDateStepProps) {
  const [seasons, setSeasons] = useState<SeasonPrice[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load seasons on mount
  useEffect(() => {
    loadSeasons();
  }, [product.id]);

  const loadSeasons = async () => {
    console.log('[SelectNewDateStep] 📦 Cargando seasons para producto:', product.id);
    setIsLoading(true);
    setError(null);

    try {
      const result = await getProductSeasonsAction(product.id);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'No se pudieron cargar las temporadas');
      }

      const activeSeasons = result.data.filter((s: SeasonPrice) => s.is_active);

      console.log('[SelectNewDateStep] ✅ Seasons cargadas:', activeSeasons.length);
      setSeasons(activeSeasons);

    } catch (err) {
      console.error('[SelectNewDateStep] ❌ Error cargando seasons:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar temporadas');
    } finally {
      setIsLoading(false);
    }
  };

  // Get selected season data
  const selectedSeason = seasons.find(s => s.id === selectedSeasonId);

  // Calculate new total price
  const calculateNewTotalPrice = (): SelectedDateData | null => {
    if (!selectedSeason || !selectedDate) return null;

    const adultPrice = selectedSeason.adult_base_price;

    // Find child price range (simplified - using first range if exists)
    const childPrice = selectedSeason.child_ranges && selectedSeason.child_ranges.length > 0
      ? selectedSeason.child_ranges[0].child_price
      : adultPrice * 0.5; // Fallback: 50% of adult price

    const newTotalPrice = (reservation.adults * adultPrice) + (reservation.kids * childPrice);

    return {
      newDate: selectedDate,
      newPricePerPerson: adultPrice,
      newPricePerKid: childPrice,
      newTotalPrice,
      seasonName: selectedSeason.season_name,
      seasonId: selectedSeason.id,
      priceId: selectedSeason.id // Assuming season ID is same as price ID
    };
  };

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
  };

  // Handle season selection
  const handleSeasonSelect = (seasonId: string) => {
    console.log('[SelectNewDateStep] 🗓️ Temporada seleccionada:', seasonId);
    setSelectedSeasonId(seasonId);
    setSelectedDate(''); // Reset date when changing season
  };

  // Handle continue
  const handleContinue = () => {
    const newDateData = calculateNewTotalPrice();

    if (!newDateData) {
      alert('Por favor selecciona una fecha válida');
      return;
    }

    // Validate date is in future
    const selectedDateObj = new Date(newDateData.newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    if (selectedDateObj <= today) {
      alert('La fecha seleccionada debe ser en el futuro');
      return;
    }

    // Validate date is within season range
    if (selectedSeason) {
      const startDate = new Date(selectedSeason.start_date);
      const endDate = new Date(selectedSeason.end_date);

      if (selectedDateObj < startDate || selectedDateObj > endDate) {
        alert(`La fecha debe estar entre ${startDate.toLocaleDateString('es-MX')} y ${endDate.toLocaleDateString('es-MX')}`);
        return;
      }
    }

    console.log('[SelectNewDateStep] ✅ Fecha válida, continuando...', newDateData);
    onDateSelected(newDateData);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Cargando temporadas disponibles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadSeasons}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (seasons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">No hay temporadas disponibles en este momento</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cerrar
        </button>
      </div>
    );
  }

  const newPriceData = calculateNewTotalPrice();

  return (
    <div className="space-y-6">
      {/* Current Date Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Fecha Actual de Viaje</h3>
        <p className="text-base text-gray-900">{formatDate(reservation.reservation_date)}</p>
        <p className="text-sm text-gray-600 mt-1">
          Total actual: {formatCurrency(reservation.total_price)}
        </p>
      </div>

      {/* Seasons Selection */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Selecciona una Temporada
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasons.map((season) => {
            const isSelected = selectedSeasonId === season.id;

            return (
              <button
                key={season.id}
                onClick={() => handleSeasonSelect(season.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{season.season_name}</h4>
                  {isSelected && (
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {formatDate(season.start_date)} - {formatDate(season.end_date)}
                </p>

                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Adultos:</span> {formatCurrency(season.adult_base_price)}
                  </p>
                  {season.child_ranges && season.child_ranges.length > 0 && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Niños:</span> {formatCurrency(season.child_ranges[0].child_price)}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Picker (only show when season selected) */}
      {selectedSeason && (
        <div>
          <label htmlFor="travel-date" className="block text-base font-semibold text-gray-900 mb-2">
            Selecciona Nueva Fecha de Viaje
          </label>
          <input
            type="date"
            id="travel-date"
            value={selectedDate}
            onChange={handleDateChange}
            min={selectedSeason.start_date}
            max={selectedSeason.end_date}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-2">
            Rango disponible: {formatDate(selectedSeason.start_date)} - {formatDate(selectedSeason.end_date)}
          </p>
        </div>
      )}

      {/* New Price Preview */}
      {newPriceData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Nuevo Precio Estimado</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-800">Adultos ({reservation.adults}):</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(newPriceData.newPricePerPerson * reservation.adults)}
              </span>
            </div>
            {reservation.kids > 0 && newPriceData.newPricePerKid && (
              <div className="flex justify-between">
                <span className="text-blue-800">Niños ({reservation.kids}):</span>
                <span className="font-medium text-blue-900">
                  {formatCurrency(newPriceData.newPricePerKid * reservation.kids)}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-blue-300 flex justify-between">
              <span className="font-semibold text-blue-900">Total:</span>
              <span className="font-bold text-lg text-blue-900">
                {formatCurrency(newPriceData.newTotalPrice)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
        >
          Cancelar
        </button>

        <button
          onClick={handleContinue}
          disabled={!newPriceData}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
