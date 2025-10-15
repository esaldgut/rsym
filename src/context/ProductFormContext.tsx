'use client';

import { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import type {
  LocationInput,
  ProductCircuitSeasonInput,
  ProductPackageSeasonInput,
  PaymentPolicyInput,
  Product
} from '@/lib/graphql/types';
import type { 
  ProductFormData, 
  ProductFormAction, 
  WizardContextType,
  FormStep 
} from '@/types/wizard';

const initialFormData: ProductFormData = {
  productId: null,
  name: '',
  preferences: [],
  languages: [],
  description: '',
  cover_image_url: '',
  image_url: [],
  video_url: [],
  destination: [],
  departures: { regular_departures: [], specific_departures: [] },
  origin: [],
  itinerary: '',
  seasons: [],
  planned_hotels_or_similar: [],
  payment_policy: null,
  published: false,
  productType: 'circuit',
  currentStep: 0,
  isSubmitting: false
};

export const getInitialFormData = (productType: 'circuit' | 'package', productId?: string | null): ProductFormData => ({
  ...initialFormData,
  productType,
  productId: productId || null
});

function productFormReducer(
  state: ProductFormData, 
  action: ProductFormAction
): ProductFormData {
  switch (action.type) {
    case 'UPDATE_FORM_DATA':
      return { ...state, ...action.payload };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'RESET_FORM':
      return initialFormData;
    default:
      return state;
  }
}

const ProductFormContext = createContext<WizardContextType | null>(null);

export function useProductForm() {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error('useProductForm must be used within ProductFormProvider');
  }
  return context;
}

interface ProductFormProviderProps {
  children: React.ReactNode;
  steps: FormStep[];
  productType: 'circuit' | 'package';
  initialProduct?: Product;
}

export function ProductFormProvider({
  children,
  steps,
  productType,
  initialProduct
}: ProductFormProviderProps) {
  // Load saved form data from localStorage
  const loadSavedFormData = (): ProductFormData => {
    if (typeof window === 'undefined') {
      return { ...initialFormData, productType };
    }

    try {
      // PRIORIDAD 1: Si hay initialProduct prop (edit mode), usarlo directamente
      if (initialProduct) {
        console.log('🎯 Cargando datos desde initialProduct prop:', initialProduct);

        const parsed = initialProduct;
        const departures = parsed.departures || [];

        // Función auxiliar para convertir coordenadas de GraphQL a formato interno
        const convertCoordinates = (origin: any) => {
          if (!origin) return { place: '', placeSub: '', coordinates: undefined };

          let coordinates = undefined;
          if (origin.coordinates) {
            if (typeof origin.coordinates === 'object' && 'latitude' in origin.coordinates && 'longitude' in origin.coordinates) {
              coordinates = [origin.coordinates.longitude, origin.coordinates.latitude];
            } else if (Array.isArray(origin.coordinates)) {
              coordinates = origin.coordinates;
            }
          }

          return {
            place: origin.place || '',
            placeSub: origin.placeSub || '',
            coordinates: coordinates
          };
        };

        const mappedDepartures = {
          regular_departures: departures
            .filter((d: any) => d.days && d.days.length > 0)
            .map((d: any) => ({
              origin: convertCoordinates(d.origin?.[0]),
              days: d.days || []
            })),
          specific_departures: []
        };

        departures
          .filter((d: any) => d.specific_dates && d.specific_dates.length > 0)
          .forEach((d: any) => {
            if (d.origin && Array.isArray(d.origin)) {
              d.origin.forEach((origin: any) => {
                mappedDepartures.specific_departures.push({
                  origin: convertCoordinates(origin),
                  date_ranges: d.specific_dates?.map((date: string) => ({
                    start_datetime: date,
                    end_datetime: date
                  })) || []
                });
              });
            }
          });

        const mappedDestinations = (parsed.destination || []).map((dest: any) => ({
          place: dest.place || '',
          placeSub: dest.placeSub || '',
          complementary_description: dest.complementary_description || '',
          coordinates: dest.coordinates
            ? (typeof dest.coordinates === 'object' && 'latitude' in dest.coordinates && 'longitude' in dest.coordinates
              ? [dest.coordinates.longitude, dest.coordinates.latitude]
              : dest.coordinates)
            : undefined
        }));

        return {
          productId: parsed.id,
          name: parsed.name || '',
          description: parsed.description || '',
          preferences: parsed.preferences || [],
          languages: parsed.languages || [],
          cover_image_url: parsed.cover_image_url || '',
          image_url: parsed.image_url ? [parsed.image_url] : [],
          video_url: parsed.video_url ? [parsed.video_url] : [],
          seasons: parsed.seasons || [],
          planned_hotels_or_similar: parsed.planned_hotels_or_similar || [],
          destination: mappedDestinations,
          departures: mappedDepartures,
          origin: parsed.origin || [],
          itinerary: parsed.itinerary || '',
          payment_policy: parsed.payment_policy || null,
          published: parsed.published || false,
          productType,
          currentStep: 0,
          isSubmitting: false
        };
      }

      // PRIORIDAD 2: Verificar si hay datos de edición en localStorage (legacy)
      const editData = localStorage.getItem('yaan-edit-product-data');
      if (editData) {
        const parsed = JSON.parse(editData);
        console.log('📝 Cargando datos para edición:', parsed);
        
        // Mapear datos del producto existente al formato del form
        // Convertir departures del formato GraphQL al formato interno del frontend
        const departures = parsed.departures || [];

        // Función auxiliar para convertir coordenadas de GraphQL a formato interno
        const convertCoordinates = (origin: any) => {
          if (!origin) return { place: '', placeSub: '', coordinates: undefined };

          // Si las coordenadas vienen como objeto {latitude, longitude}, convertir a array [longitude, latitude]
          let coordinates = undefined;
          if (origin.coordinates) {
            if (typeof origin.coordinates === 'object' && 'latitude' in origin.coordinates && 'longitude' in origin.coordinates) {
              // Formato GraphQL: {latitude: number, longitude: number}
              coordinates = [origin.coordinates.longitude, origin.coordinates.latitude];
            } else if (Array.isArray(origin.coordinates)) {
              // Ya está en formato array
              coordinates = origin.coordinates;
            }
          }

          return {
            place: origin.place || '',
            placeSub: origin.placeSub || '',
            coordinates: coordinates
          };
        };

        // Nueva lógica de mapeo que maneja la estructura del esquema GraphQL real
        const mappedDepartures = {
          regular_departures: departures
            .filter((d: any) => d.days && d.days.length > 0)
            .map((d: any) => ({
              origin: convertCoordinates(d.origin?.[0]),
              days: d.days || []
            })),
          specific_departures: []
        };

        // Manejar salidas específicas - pueden venir agrupadas en un solo objeto con múltiples orígenes
        departures
          .filter((d: any) => d.specific_dates && d.specific_dates.length > 0)
          .forEach((d: any) => {
            // Si hay múltiples orígenes, crear una entrada para cada uno
            if (d.origin && Array.isArray(d.origin)) {
              d.origin.forEach((origin: any) => {
                mappedDepartures.specific_departures.push({
                  origin: convertCoordinates(origin),
                  date_ranges: d.specific_dates?.map((date: string) => ({
                    start_datetime: date,
                    end_datetime: date
                  })) || []
                });
              });
            }
          });

        // Convertir coordenadas en destination también
        const mappedDestinations = (parsed.destination || []).map((dest: any) => ({
          place: dest.place || '',
          placeSub: dest.placeSub || '',
          complementary_description: dest.complementary_description || '',
          coordinates: dest.coordinates
            ? (typeof dest.coordinates === 'object' && 'latitude' in dest.coordinates && 'longitude' in dest.coordinates
              ? [dest.coordinates.longitude, dest.coordinates.latitude]
              : dest.coordinates)
            : undefined
        }));

        return {
          productId: parsed.id,
          name: parsed.name || '',
          description: parsed.description || '',
          preferences: parsed.preferences || [],
          languages: parsed.languages || [],
          cover_image_url: parsed.cover_image_url || '',
          image_url: parsed.image_url ? [parsed.image_url] : [],
          video_url: parsed.video_url ? [parsed.video_url] : [],
          seasons: parsed.seasons || [],
          planned_hotels_or_similar: parsed.planned_hotels_or_similar || [],
          destination: mappedDestinations,
          departures: mappedDepartures,
          origin: parsed.origin || [],
          itinerary: parsed.itinerary || '',
          payment_policy: parsed.payment_policy || null,
          published: parsed.published || false,
          productType,
          currentStep: 0,
          isSubmitting: false
        };
      }
      
      // Intentar primero la nueva clave unificada (modo creación)
      let savedData = localStorage.getItem('yaan-product-form-data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Verificar que corresponde al productType actual
        if (parsed.productType === productType) {
          console.log('📦 FormData recuperado de nueva clave:', parsed);
          return { ...parsed, productType }; // Ensure productType is always current
        }
      }
      
      // Fallback a la clave antigua
      savedData = localStorage.getItem(`yaan-wizard-${productType}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('📦 FormData recuperado de clave legacy:', parsed);
        return { ...parsed, productType }; // Ensure productType is always current
      }
    } catch (error) {
      console.warn('Error loading saved wizard data:', error);
    }
    
    return { ...initialFormData, productType };
  };

  const [formData, dispatch] = useReducer(productFormReducer, loadSavedFormData());

  const updateFormData = (data: Partial<ProductFormData>) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: data });
  };

  // Auto-save form data to localStorage with debounce (reduces write frequency)
  useEffect(() => {
    // Debounce: esperar 500ms después del último cambio antes de guardar
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          // Agregar metadata de recovery
          const saveData = {
            ...formData,
            _savedAt: new Date().toISOString(),
            _savedBy: 'auto-save' as const
          };

          // Guardar con la clave antigua para compatibilidad
          localStorage.setItem(`yaan-wizard-${productType}`, JSON.stringify(saveData));

          // Guardar también con la nueva clave unificada
          if (formData.productId) {
            localStorage.setItem('yaan-product-form-data', JSON.stringify(saveData));
          }

          console.log('💾 Auto-saved at:', saveData._savedAt);
        } catch (error) {
          console.warn('Error saving wizard data:', error);
        }
      }
    }, 500); // 500ms debounce

    // Cleanup: cancelar timer si el componente se desmonta o formData cambia antes
    return () => clearTimeout(timer);
  }, [formData, productType]);

  const navigateToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: step });
    }
  };

  const contextValue = useMemo(() => ({
    formData,
    dispatch,
    updateFormData,
    navigateToStep,
    currentStepIndex: formData.currentStep,
    steps,
    isLastStep: formData.currentStep === steps.length - 1,
    isFirstStep: formData.currentStep === 0,
    canProceed: true, // TODO: Implementar validación en tiempo real
    initialFormData: getInitialFormData(productType)
  }), [formData, steps, productType]);

  return (
    <ProductFormContext.Provider value={contextValue}>
      {children}
    </ProductFormContext.Provider>
  );
}