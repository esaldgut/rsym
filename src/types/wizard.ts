// src/types/wizard.ts - Tipos centralizados del wizard
import { z } from 'zod';
import type { 
  CreateProductOfTypeCircuitInput,
  CreateProductOfTypePackageInput,
  LocationInput,
  ProductCircuitSeasonInput,
  ProductPackageSeasonInput,
  PaymentPolicyInput
} from '@/lib/graphql/types';

export interface FormStep {
  id: string;
  title: string;
  component: React.ComponentType<StepProps>;
  validation: z.ZodSchema;
  optional: boolean;
}

export interface StepProps {
  userId: string;
  onNext: () => void;
  onPrevious: () => void;
  isValid: boolean;
}

export interface ProductFormData {
  // ID del producto (obtenido al crear el esqueleto)
  productId: string | null;
  
  // Campos comunes
  name: string;
  preferences?: string[];
  languages?: string[];
  description?: string;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  
  // Campos específicos de circuitos
  itinerary?: string;
  destination?: LocationInput[];
  
  // Temporadas (dinámicas según tipo)
  seasons?: Array<ProductCircuitSeasonInput | ProductPackageSeasonInput>;
  planned_hotels_or_similar?: string[];
  
  // Campos específicos de paquetes
  origin?: LocationInput[];
  
  // Política de pago
  payment_policy?: PaymentPolicyInput;
  
  // Metadatos del wizard
  productType: 'circuit' | 'package';
  productId?: string;
  currentStep: number;
  isSubmitting: boolean;
}

export type ProductFormAction = 
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<ProductFormData> }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET_FORM' };

// Validación schemas base - serán importados desde donde se implementen
export interface ValidationSchemas {
  generalInfoCircuitSchema: z.ZodSchema;
  generalInfoPackageSchema: z.ZodSchema;
  tourDetailsSchema: z.ZodSchema;
  packageDetailsSchema: z.ZodSchema;
  policiesSchema: z.ZodSchema;
}

// Estados de upload para medios
export interface MediaUploadState {
  images: Array<{
    id: string;
    url: string;
    uploading: boolean;
    progress: number;
    error?: string;
  }>;
  videos: Array<{
    id: string;
    url: string;
    uploading: boolean;
    progress: number;
    error?: string;
  }>;
  coverImage?: {
    url: string;
    uploading: boolean;
    progress: number;
    error?: string;
  };
}

export interface WizardContextType {
  formData: ProductFormData;
  dispatch: React.Dispatch<ProductFormAction>;
  updateFormData: (data: Partial<ProductFormData>) => void;
  navigateToStep: (step: number) => void;
  currentStepIndex: number;
  steps: FormStep[];
  isLastStep: boolean;
  isFirstStep: boolean;
  canProceed: boolean;
  initialFormData: ProductFormData;
}