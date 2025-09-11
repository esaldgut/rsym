'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProductForm } from '@/context/ProductFormContext';
import { tourDetailsSchema } from '@/lib/validations/product-schemas';
import type { StepProps } from '@/types/wizard';
import type { ProductCircuitSeasonInput } from '@/lib/graphql/types';

interface TourDetailsFormData {
  itinerary: string;
  seasons: ProductCircuitSeasonInput[];
  planned_hotels_or_similar: string[];
}

type TabKey = 'destinations' | 'itinerary' | 'seasons' | 'hotels';

export default function TourDetailsStep({ userId, onNext, onPrevious }: StepProps) {
  const { formData, updateFormData } = useProductForm();
  const [activeTab, setActiveTab] = useState<TabKey>('destinations');
  
  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<TourDetailsFormData>({
    resolver: zodResolver(tourDetailsSchema),
    defaultValues: {
      itinerary: formData.itinerary || '',
      seasons: formData.seasons as ProductCircuitSeasonInput[] || [],
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

  const tabs = [
    {
      key: 'destinations' as TabKey,
      label: '🎯 Destinos',
      description: 'Lugares que visitarán',
      required: true
    },
    {
      key: 'itinerary' as TabKey,
      label: '📋 Itinerario',
      description: 'Programa detallado',
      required: true
    },
    {
      key: 'seasons' as TabKey,
      label: '📅 Temporadas',
      description: 'Fechas y precios',
      required: true
    },
    {
      key: 'hotels' as TabKey,
      label: '🏨 Hoteles',
      description: 'Alojamiento planeado',
      required: false
    }
  ];

  const onSubmit = (data: TourDetailsFormData) => {
    updateFormData({
      itinerary: data.itinerary,
      seasons: data.seasons,
      planned_hotels_or_similar: data.planned_hotels_or_similar
    });
    onNext();
  };

  const generateItinerary = () => {
    if (formData.destination && formData.destination.length > 0) {
      const destinations = formData.destination.map(d => d.place).join(', ');
      const generatedText = `Itinerario sugerido para: ${destinations}\n\nDía 1: Llegada y bienvenida\n- Recepción en el punto de encuentro\n- Orientación del grupo\n\nDía 2: Exploración\n- Visita a ${formData.destination[0]?.place}\n- Actividades programadas\n\n[Continúa completando tu itinerario...]`;
      
      setValue('itinerary', generatedText);
    }
  };

  const addNewSeason = () => {
    appendSeason({
      start_date: '',
      end_date: '',
      category: 'Alta',
      capacity: 10,
      prices: [],
      schedules: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-violet-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Detalles del Circuito</h2>
        <p className="opacity-90">
          Configura los aspectos específicos de tu experiencia turística
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const hasError = {
              destinations: !!errors.itinerary,
              itinerary: !!errors.itinerary,
              seasons: !!errors.seasons,
              hotels: !!errors.planned_hotels_or_similar
            }[tab.key];

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors relative
                  ${activeTab === tab.key
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  ${hasError ? 'text-red-600' : ''}
                `}
              >
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    {tab.label}
                    {tab.required && <span className="text-red-500">*</span>}
                    {hasError && (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="text-xs opacity-75 mt-1">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="min-h-96">
        {/* Tab: Destinos */}
        {activeTab === 'destinations' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-800">
                Destinos configurados
              </label>
              <div className="space-y-2">
                {formData.destination?.map((dest, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{dest.place}</span>
                      {dest.placeSub && (
                        <span className="text-sm text-gray-500 ml-2">{dest.placeSub}</span>
                      )}
                    </div>
                  </div>
                ))}
                {(!formData.destination || formData.destination.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Los destinos se configuran en el paso anterior</p>
                    <button
                      type="button"
                      onClick={onPrevious}
                      className="text-pink-600 hover:text-pink-700 mt-2 text-sm underline"
                    >
                      Volver a configurar destinos
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-800">Consejo para Destinos</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Los destinos ordenados según el flujo natural del recorrido ayudarán a generar un itinerario más lógico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Itinerario */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-800">
                Itinerario del recorrido *
              </label>
              <button
                type="button"
                onClick={generateItinerary}
                disabled={!formData.destination || formData.destination.length === 0}
                className="text-sm bg-pink-100 text-pink-700 px-3 py-1 rounded-lg hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✨ Generar sugerencia
              </button>
            </div>
            <textarea
              {...register('itinerary')}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder="Describe día a día lo que harán los viajeros en tu circuito..."
            />
            {errors.itinerary && (
              <p className="text-sm text-red-600">{errors.itinerary.message}</p>
            )}
          </div>
        )}

        {/* Tab: Temporadas */}
        {activeTab === 'seasons' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-800">
                Temporadas y Precios *
              </label>
              <button
                type="button"
                onClick={addNewSeason}
                className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 text-sm"
              >
                + Agregar Temporada
              </button>
            </div>

            {seasonFields.map((field, index) => (
              <SeasonCard
                key={field.id}
                index={index}
                register={register}
                errors={errors}
                onRemove={() => removeSeason(index)}
              />
            ))}

            {seasonFields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Agrega al menos una temporada para tu circuito</p>
              </div>
            )}

            {errors.seasons && (
              <p className="text-sm text-red-600">{errors.seasons.message}</p>
            )}
          </div>
        )}

        {/* Tab: Hoteles */}
        {activeTab === 'hotels' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-800">
                Hoteles o alojamientos planeados
              </label>
              <button
                type="button"
                onClick={() => appendHotel('')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
              >
                + Agregar Hotel
              </button>
            </div>

            {hotelFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
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
        )}

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

// Componente para cada temporada
function SeasonCard({
  index,
  register,
  errors,
  onRemove
}: {
  index: number;
  register: any;
  errors: any;
  onRemove: () => void;
}) {
  return (
    <div className="border border-gray-300 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-800">Temporada {index + 1}</h4>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
          <select
            {...register(`seasons.${index}.category`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad *</label>
          <input
            type="number"
            min="1"
            {...register(`seasons.${index}.capacity`, { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Horarios</label>
        <textarea
          {...register(`seasons.${index}.schedules`)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
          placeholder="Ej. Salida 8:00 AM, Regreso 6:00 PM"
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