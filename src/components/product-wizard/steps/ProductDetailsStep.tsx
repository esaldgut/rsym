'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useProductForm } from '@/context/ProductFormContext';
import { tourDetailsSchema } from '@/lib/validations/product-schemas';
import { LocationMultiSelector } from '@/components/location/LocationMultiSelector';
import { SeasonConfiguration } from '../components/SeasonConfiguration';
import { GuaranteedDeparturesSelector } from '../components/GuaranteedDeparturesSelector';
import { SaveDraftButton } from '@/components/product-wizard/SaveDraftButton';
import { toastManager } from '@/components/ui/Toast';
import type { StepProps } from '@/types/wizard';
import type { ProductSeasonInput, GuaranteedDeparturesInput, LocationInput, RegularDepartureInput, SpecificDepartureInput } from '@/lib/graphql/types';

// Tipo interno para mantener la compatibilidad con el frontend
interface InternalDeparturesData {
  regular_departures: RegularDepartureInput[];
  specific_departures: SpecificDepartureInput[];
}

interface ProductDetailsFormData {
  destination: LocationInput[];
  departures: InternalDeparturesData;
  itinerary: string;
  seasons: ProductSeasonInput[];
  planned_hotels_or_similar: string; // Textarea provides string, converted to array on submit
}

export default function ProductDetailsStep({ userId, onNext, onPrevious, onCancelClick, isValid }: StepProps) {
  const { formData, updateFormData } = useProductForm();
  const [activeTab, setActiveTab] = useState('destination');

  // Helper: Determinar el primer tab (siempre 'destination')
  const getFirstTab = (): string => {
    return 'destination';
  };

  // Helper: Determinar el último tab según productType
  const getLastTab = (productType: 'circuit' | 'package') => {
    return productType === 'circuit' ? 'hotels' : 'seasons';
  };

  // Helper: Determinar el siguiente tab en el orden
  const getNextTab = (currentTab: string, productType: 'circuit' | 'package'): string | null => {
    const tabOrder = ['destination', 'departures', 'itinerary', 'seasons'];
    if (productType === 'circuit') {
      tabOrder.push('hotels');
    }
    const currentIndex = tabOrder.indexOf(currentTab);
    return currentIndex < tabOrder.length - 1 ? tabOrder[currentIndex + 1] : null;
  };

  // Helper: Determinar el tab anterior en el orden
  const getPreviousTab = (currentTab: string, productType: 'circuit' | 'package'): string | null => {
    const tabOrder = ['destination', 'departures', 'itinerary', 'seasons'];
    if (productType === 'circuit') {
      tabOrder.push('hotels');
    }
    const currentIndex = tabOrder.indexOf(currentTab);
    return currentIndex > 0 ? tabOrder[currentIndex - 1] : null;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors
  } = useForm<ProductDetailsFormData>({
    // Removido zodResolver - validación manual en onSubmit
    defaultValues: {
      destination: formData.destination || [],
      departures: formData.departures || { regular_departures: [], specific_departures: [] },
      itinerary: formData.itinerary || '',
      seasons: formData.seasons || [],
      planned_hotels_or_similar: Array.isArray(formData.planned_hotels_or_similar)
        ? formData.planned_hotels_or_similar.join('\n')
        : formData.planned_hotels_or_similar || ''
    }
  });

  // Usar el tipo de producto predefinido del contexto
  const actualProductType = formData.productType;

  // Sincronizar cambios específicos con el contexto
  const destinationWatch = watch('destination');
  const departuresWatch = watch('departures');
  const itineraryWatch = watch('itinerary');
  const seasonsWatch = watch('seasons');
  const hotelsWatch = watch('planned_hotels_or_similar');

  // Helper: Verificar si un tab está completo
  const checkTabCompletion = (tabId: string): boolean => {
    switch(tabId) {
      case 'destination':
        return destinationWatch && destinationWatch.length > 0;
      case 'departures':
        return departuresWatch &&
          (departuresWatch.regular_departures.length > 0 ||
           departuresWatch.specific_departures.length > 0);
      case 'itinerary':
        return itineraryWatch && itineraryWatch.length >= 20;
      case 'seasons':
        return seasonsWatch && seasonsWatch.length > 0;
      case 'hotels':
        return hotelsWatch && hotelsWatch.length > 0;
      default:
        return false;
    }
  };

  useEffect(() => {
    if (JSON.stringify(destinationWatch) !== JSON.stringify(formData.destination)) {
      updateFormData({ destination: destinationWatch });
    }
  }, [destinationWatch]);

  useEffect(() => {
    if (JSON.stringify(departuresWatch) !== JSON.stringify(formData.departures)) {
      updateFormData({ departures: departuresWatch });
    }
  }, [departuresWatch]);

  useEffect(() => {
    if (itineraryWatch !== formData.itinerary) {
      updateFormData({ itinerary: itineraryWatch });
    }
  }, [itineraryWatch]);

  useEffect(() => {
    if (JSON.stringify(seasonsWatch) !== JSON.stringify(formData.seasons)) {
      updateFormData({ seasons: seasonsWatch });
    }
  }, [seasonsWatch]);

  useEffect(() => {
    // Convertir el string del textarea a array para el contexto
    const hotelsArray = hotelsWatch
      ? hotelsWatch.split('\n').filter(line => line.trim().length > 0)
      : [];

    if (JSON.stringify(hotelsArray) !== JSON.stringify(formData.planned_hotels_or_similar)) {
      updateFormData({ planned_hotels_or_similar: hotelsArray });
    }
  }, [hotelsWatch]);

  const onSubmit = (data: ProductDetailsFormData) => {
    // CRÍTICO: Solo avanzar al siguiente step si estamos en el último tab
    const lastTab = getLastTab(actualProductType);
    if (activeTab !== lastTab) {
      console.warn('⚠️ onSubmit llamado antes del último tab, ignorando');
      return;
    }

    // Limpiar errores previos
    clearErrors();

    // Convertir planned_hotels_or_similar de string a array si es necesario
    const processedData = {
      ...data,
      planned_hotels_or_similar: Array.isArray(data.planned_hotels_or_similar)
        ? data.planned_hotels_or_similar
        : data.planned_hotels_or_similar
          ? data.planned_hotels_or_similar.split('\n').filter(line => line.trim().length > 0)
          : []
    };

    // Validar con el schema de Zod pero no bloquear la navegación
    try {
      tourDetailsSchema.parse(processedData);
      // Validación exitosa - continuar
      updateFormData(processedData);
      onNext();
    } catch (error: unknown) {
      // Mostrar warnings pero permitir continuar
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ path: string[]; message: string }> };
        zodError.errors.forEach((err) => {
          const fieldPath = err.path;
          const fieldName = fieldPath[0];

          // Solo mostrar errores críticos que impiden continuar
          if (fieldName === 'destination' && err.message.includes('al menos un destino')) {
            console.error('Error crítico en destinos:', err.message);
            setError('destination' as any, { message: err.message });
            return; // Bloquear solo para errores críticos
          } else if (fieldName === 'seasons' && err.message.includes('al menos una temporada')) {
            console.error('Error crítico en temporadas:', err.message);
            setError('seasons' as any, { message: err.message });
            return; // Bloquear solo para errores críticos
          } else {
            // Para errores no críticos, solo mostrar warnings y permitir continuar
            console.warn('Warning de validación:', fieldPath.join('.'), err.message);
            if (fieldName === 'itinerary') {
              // Mostrar warning visual pero no bloquear
              toastManager.show(`⚠️ Recomendación: ${err.message}`, 'warning', 4000);
            }
          }
        });
      }

      // Siempre permitir continuar (a menos que haya errores críticos arriba)
      updateFormData(processedData);
      onNext();
    }
  };

  const generateItinerary = async () => {
    if (!destinationWatch || destinationWatch.length === 0) {
      toastManager.show('⚠️ Selecciona al menos un destino primero', 'warning', 3000);
      return;
    }

    try {
      toastManager.show('✨ Generando itinerario automático...', 'info', 2000);
      
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinations: destinationWatch,
          productType: actualProductType
        })
      });

      if (response.ok) {
        const { itinerary } = await response.json();
        setValue('itinerary', itinerary);
        updateFormData({ itinerary });
        toastManager.show('✅ Itinerario generado exitosamente', 'success', 3000);
      } else {
        toastManager.show('❌ Error al generar el itinerario', 'error', 3000);
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toastManager.show('❌ Error al conectar con el servicio de itinerarios', 'error', 3000);
    }
  };

  const tabs = [
    { 
      id: 'destination', 
      name: actualProductType === 'circuit' ? 'Destinos del Circuito' : 'Destino del Paquete',
      icon: '🗺️'
    },
    { 
      id: 'departures', 
      name: 'Salidas Garantizadas',
      icon: '📅'
    },
    { 
      id: 'itinerary', 
      name: 'Itinerario',
      icon: '📋'
    },
    { 
      id: 'seasons', 
      name: 'Temporadas y Precios',
      icon: '💰'
    },
    ...(actualProductType === 'circuit' ? [{
      id: 'hotels',
      name: 'Hoteles Sugeridos',
      icon: '🏨'
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header dinámico basado en tipo pre-seleccionado */}
      <div className="bg-gradient-to-r from-pink-500 to-violet-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {actualProductType === 'circuit' ? 'Configura tu Circuito' : 'Configura tu Paquete'}
        </h2>
        <p className="opacity-90">
          {actualProductType === 'circuit' 
            ? 'Circuito turístico con múltiples destinos conectados'
            : 'Paquete turístico con destino específico'
          }
        </p>
        <div className="mt-2 text-xs bg-white/20 rounded-full px-3 py-1 inline-block">
          {actualProductType === 'circuit' ? '🗺️ Circuito Turístico' : '🎁 Paquete Turístico'}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isCompleted = checkTabCompletion(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.name}
                {isCompleted && (
                  <span className="ml-1 text-green-500" title="Tab completado">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'destination' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Tipo de Producto Seleccionado</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  {actualProductType === 'circuit' 
                    ? '🗺️ Circuito: Requiere mínimo 2 destinos conectados'
                    : '🎁 Paquete: Requiere exactamente 1 destino específico'
                  }
                </p>
              </div>

              <LocationMultiSelector
                selectedLocations={watch('destination') || []}
                onChange={(locations) => {
                  setValue('destination', locations);
                  updateFormData({ destination: locations });
                }}
                allowMultiple={actualProductType === 'circuit'}
                label={actualProductType === 'circuit' 
                  ? 'Destinos del Circuito (mínimo 2)' 
                  : 'Destino del Paquete (exactamente 1)'
                }
                error={errors.destination?.message}
                minSelections={actualProductType === 'circuit' ? 2 : 1}
                maxSelections={actualProductType === 'circuit' ? 30 : 1}
                helpText="Las coordenadas geográficas se mapean automáticamente desde AWS Location Service"
              />
            </div>
          )}

          {activeTab === 'departures' && (
            <GuaranteedDeparturesSelector
              departures={watch('departures') || { regular_departures: [], specific_departures: [] }}
              onChange={(internalDepartures) => {
                console.log('[ProductDetailsStep] Recibido formato interno:', internalDepartures);
                // Actualizar formulario con formato interno (para validación)
                setValue('departures', internalDepartures);
                // Actualizar contexto con formato interno (se mapea a GraphQL al enviar)
                updateFormData({ departures: internalDepartures });
              }}
              error={errors.departures?.message}
            />
          )}

          {activeTab === 'itinerary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Itinerario {actualProductType === 'circuit' ? 'del Circuito' : 'del Paquete'}
                </h3>
                <button
                  type="button"
                  onClick={generateItinerary}
                  disabled={!destinationWatch || destinationWatch.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  ✨ Generar Automáticamente
                </button>
              </div>

              <textarea
                {...register('itinerary')}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={`Describe el itinerario detallado de tu ${actualProductType}...\n\nEjemplo:\nDía 1: Llegada a [destino]\n- Traslado del aeropuerto\n- Check-in en hotel\n- Tarde libre\n\nDía 2: Tour por [actividad]\n- Desayuno incluido\n- Visita a [lugar]\n- Almuerzo típico\n...`}
              />
              {errors.itinerary && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.itinerary.message}
                </p>
              )}
            </div>
          )}

          {activeTab === 'seasons' && (
            <SeasonConfiguration
              seasons={watch('seasons') || []}
              onChange={(seasons) => {
                setValue('seasons', seasons);
                updateFormData({ seasons });
              }}
              productType={actualProductType}
              error={errors.seasons?.message}
            />
          )}

          {activeTab === 'hotels' && actualProductType === 'circuit' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Hoteles Planificados o Similares</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  💡 Lista los hoteles que planeas usar en cada destino. Esto ayuda a los viajeros 
                  a conocer el tipo de alojamiento incluido.
                </p>
              </div>
              
              <textarea
                {...register('planned_hotels_or_similar')}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ejemplo:&#10;&#10;Ciudad de México:&#10;- Hotel Zócalo Central 4* o similar&#10;- Hotel Majestic 4* o similar&#10;&#10;Guadalajara:&#10;- Hotel Morales Historical 4* o similar&#10;- Casa Grande Hotel 4* o similar"
              />
              {errors.planned_hotels_or_similar && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.planned_hotels_or_similar.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-gray-200 mt-8">
          <div className="flex gap-3 order-2 sm:order-1">
            <button
              type="button"
              onClick={() => {
                // Si estamos en el PRIMER tab, regresar al Step anterior
                if (activeTab === getFirstTab()) {
                  onPrevious();
                } else {
                  // Si estamos en otro tab, ir al tab anterior
                  const previousTab = getPreviousTab(activeTab, actualProductType);
                  if (previousTab) {
                    setActiveTab(previousTab);
                  }
                }
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              {activeTab === getFirstTab()
                ? '← Anterior'
                : `← Anterior: ${tabs.find(t => t.id === getPreviousTab(activeTab, actualProductType))?.name || 'Anterior'}`
              }
            </button>
            <SaveDraftButton variant="outline" />
            {onCancelClick && (
              <button
                type="button"
                onClick={onCancelClick}
                className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                title="Cancelar creación del producto"
              >
                Cancelar
              </button>
            )}
          </div>
          <button
            type={activeTab === getLastTab(actualProductType) ? "submit" : "button"}
            onClick={activeTab === getLastTab(actualProductType) ? undefined : (e) => {
              e.preventDefault();
              const nextTab = getNextTab(activeTab, actualProductType);
              if (nextTab) {
                setActiveTab(nextTab);
                // Mostrar toast opcional si el tab no está completo
                if (!checkTabCompletion(activeTab)) {
                  toastManager.show('⚠️ Recomendación: Completa este tab antes de continuar', 'warning', 2000);
                }
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg font-medium transition-shadow order-1 sm:order-2 w-full sm:w-auto"
          >
            {activeTab === getLastTab(actualProductType)
              ? 'Continuar al Siguiente Paso →'
              : `Siguiente: ${tabs.find(t => t.id === getNextTab(activeTab, actualProductType))?.name || 'Continuar'} →`
            }
          </button>
        </div>
      </form>
    </div>
  );
}