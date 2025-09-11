'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LocationSelector } from '@/components/location/LocationSelector';
import { useProductForm } from '@/context/ProductFormContext';
import { packageDetailsSchema } from '@/lib/validations/product-schemas';
import type { StepProps } from '@/types/wizard';
import type { ProductPackageSeasonInput, LocationInput } from '@/lib/graphql/types';
import type { CircuitLocation } from '@/types/location';

interface PackageDetailsFormData {
  origin: LocationInput[];
  destination: LocationInput[];
  seasons: ProductPackageSeasonInput[];
  planned_hotels_or_similar: string[];
}

export default function PackageDetailsStep({ userId, onNext, onPrevious }: StepProps) {
  const { formData, updateFormData } = useProductForm();
  
  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<PackageDetailsFormData>({
    resolver: zodResolver(packageDetailsSchema),
    defaultValues: {
      origin: formData.origin || [],
      destination: formData.destination || [],
      seasons: (formData.seasons as ProductPackageSeasonInput[]) || [],
      planned_hotels_or_similar: formData.planned_hotels_or_similar || []
    }
  });

  const { fields: seasonFields, append: appendSeason, remove: removeSeason } = useFieldArray({
    control,
    name: 'seasons'
  });

  const { fields: hotelFields, append: appendHotel, remove: removeHotel } = useFieldArray({
    control,
    name: 'planned_hotels_or_similar'
  });

  const onSubmit = (data: PackageDetailsFormData) => {
    updateFormData({
      origin: data.origin,
      destination: data.destination,
      seasons: data.seasons,
      planned_hotels_or_similar: data.planned_hotels_or_similar
    });
    onNext();
  };

  // Auto-inicializar temporada si no existe
  useEffect(() => {
    if (seasonFields.length === 0) {
      appendSeason({
        capacity: 4,
        category: 'Estándar',
        start_date: '',
        end_date: '',
        prices: [],
        extra_prices: [],
        aditional_services: '',
        number_of_nights: '3',
        schedules: ''
      });
    }
  }, [seasonFields.length, appendSeason]);

  const handleOriginSelect = (location: CircuitLocation) => {
    const locationInput: LocationInput = {
      place: location.place,
      placeSub: location.placeSub,
      coordinates: location.coordinates ? {
        longitude: location.coordinates[0],
        latitude: location.coordinates[1]
      } : undefined,
      complementary_description: location.complementaryDescription
    };
    
    setValue('origin', [locationInput]);
    updateFormData({ origin: [locationInput] });
  };

  const handleDestinationSelect = (location: CircuitLocation) => {
    const locationInput: LocationInput = {
      place: location.place,
      placeSub: location.placeSub,
      coordinates: location.coordinates ? {
        longitude: location.coordinates[0],
        latitude: location.coordinates[1]
      } : undefined,
      complementary_description: location.complementaryDescription
    };
    
    setValue('destination', [locationInput]);
    updateFormData({ destination: [locationInput] });
  };

  const calculateNights = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-violet-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Detalles del Paquete</h2>
        <p className="opacity-90">
          Define el origen, destino y características de tu experiencia
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Origen y Destino */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Origen */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">
              Origen de la experiencia *
            </label>
            {watch('origin')?.length > 0 ? (
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{watch('origin')[0].place}</span>
                    {watch('origin')[0].placeSub && (
                      <span className="text-sm text-gray-500 ml-2">{watch('origin')[0].placeSub}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('origin', []);
                      updateFormData({ origin: [] });
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <LocationSelector
                onLocationSelect={handleOriginSelect}
                placeholder="Buscar ciudad de origen..."
                countries={['MEX']}
              />
            )}
            {errors.origin && (
              <p className="text-sm text-red-600">{errors.origin.message}</p>
            )}
          </div>

          {/* Destino */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">
              Destino de la experiencia *
            </label>
            {watch('destination')?.length > 0 ? (
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{watch('destination')[0].place}</span>
                    {watch('destination')[0].placeSub && (
                      <span className="text-sm text-gray-500 ml-2">{watch('destination')[0].placeSub}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('destination', []);
                      updateFormData({ destination: [] });
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <LocationSelector
                onLocationSelect={handleDestinationSelect}
                placeholder="Buscar destino turístico..."
                countries={['MEX']}
              />
            )}
            {errors.destination && (
              <p className="text-sm text-red-600">{errors.destination.message}</p>
            )}
          </div>
        </div>

        {/* Temporada única */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-800">
            Categoría, precios, fechas, ocupación
          </h3>

          {seasonFields.map((season, index) => (
            <PackageSeasonCard
              key={season.id}
              index={index}
              register={register}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              canRemove={false} // Solo una temporada para paquetes
            />
          ))}
        </div>

        {/* Hoteles */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-800">
              Hoteles previstos o similares
            </label>
            <button
              type="button"
              onClick={() => appendHotel('')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
            >
              + Agregar Hotel
            </button>
          </div>
          
          <div className="space-y-3">
            {hotelFields.map((hotel, index) => (
              <div key={hotel.id} className="flex gap-3">
                <input
                  type="text"
                  {...register(`planned_hotels_or_similar.${index}` as const)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Nombre del hotel o tipo de alojamiento"
                />
                <button
                  type="button"
                  onClick={() => removeHotel(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-800">Información opcional</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Los hoteles son opcionales. Si no específicas hoteles, los viajeros entenderán que deben buscar su propio alojamiento.
                </p>
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
            className="bg-gradient-to-r from-pink-500 to-violet-600 text-white px-8 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}

// Componente para la temporada del paquete
function PackageSeasonCard({
  index,
  register,
  control,
  errors,
  watch,
  setValue,
  canRemove = false
}: {
  index: number;
  register: any;
  control: any;
  errors: any;
  watch: any;
  setValue: any;
  canRemove?: boolean;
}) {
  const startDate = watch(`seasons.${index}.start_date`);
  const endDate = watch(`seasons.${index}.end_date`);

  const calculateNights = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  return (
    <div className="border border-gray-300 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-800">Configuración del Paquete</h4>
        {canRemove && (
          <button
            type="button"
            className="text-red-600 hover:text-red-700"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
          <input
            type="date"
            {...register(`seasons.${index}.start_date`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin *</label>
          <input
            type="date"
            {...register(`seasons.${index}.end_date`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Noches calculadas</label>
          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
            {nights > 0 ? `${nights} noche${nights > 1 ? 's' : ''}` : 'Selecciona fechas'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
          <select
            {...register(`seasons.${index}.category`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="Estándar">Estándar</option>
            <option value="Superior">Superior</option>
            <option value="Premium">Premium</option>
            <option value="Lujo">Lujo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad máxima</label>
          <input
            type="number"
            min="1"
            max="20"
            {...register(`seasons.${index}.capacity`, { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Ej. 4 personas"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Número de noches *</label>
        <input
          type="text"
          {...register(`seasons.${index}.number_of_nights`)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="Ej. 3 noches"
          defaultValue={nights > 0 ? `${nights}` : ''}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Servicios adicionales</label>
        <textarea
          {...register(`seasons.${index}.aditional_services`)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
          placeholder="Describe servicios extras incluidos en el paquete..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Horarios</label>
        <textarea
          {...register(`seasons.${index}.schedules`)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
          placeholder="Ej. Check-in 3:00 PM, Check-out 12:00 PM"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-700">
          <strong>Nota:</strong> La configuración de precios se realizará en el siguiente paso.
        </p>
      </div>
    </div>
  );
}