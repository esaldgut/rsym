'use client';

import { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import type { 
  LocationInput,
  ProductCircuitSeasonInput,
  ProductPackageSeasonInput,
  PaymentPolicyInput
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
  seasons: [],
  planned_hotels_or_similar: [],
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
}

export function ProductFormProvider({ 
  children, 
  steps, 
  productType 
}: ProductFormProviderProps) {
  // Load saved form data from localStorage
  const loadSavedFormData = (): ProductFormData => {
    if (typeof window === 'undefined') {
      return { ...initialFormData, productType };
    }
    
    try {
      // Intentar primero la nueva clave unificada
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

  // Auto-save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Guardar con la clave antigua para compatibilidad
        localStorage.setItem(`yaan-wizard-${productType}`, JSON.stringify(formData));
        
        // Guardar también con la nueva clave unificada
        if (formData.productId) {
          localStorage.setItem('yaan-product-form-data', JSON.stringify(formData));
        }
      } catch (error) {
        console.warn('Error saving wizard data:', error);
      }
    }
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