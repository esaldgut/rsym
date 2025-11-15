// src/types/wizard.ts - Tipos centralizados del wizard
import { z } from 'zod';
import type {
  CreateProductOfTypeCircuitInput,
  CreateProductOfTypePackageInput,
  LocationInput,
  ProductSeasonInput,
  PaymentPolicyInput,
  GuaranteedDeparturesInput,
  Product
} from '@/generated/graphql';

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
  onCancelClick?: () => void;
  isValid: boolean;
  resetUnsavedChanges?: () => void; // Callback para resetear estado de cambios no guardados antes de salir
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
  departures?: GuaranteedDeparturesInput[];

  // Temporadas (dinámicas según tipo)
  seasons?: ProductSeasonInput[];
  planned_hotels_or_similar?: string[];

  // Campos específicos de paquetes
  origin?: LocationInput[];

  // Política de pago
  payment_policy?: PaymentPolicyInput;

  // Estado de publicación y metadatos
  published?: boolean;
  is_foreign?: boolean;

  // Metadatos del wizard
  productType: 'circuit' | 'package';
  currentStep: number;
  isSubmitting: boolean;

  // Metadata para recovery system
  _savedAt?: string; // ISO timestamp del último save
  _savedBy?: 'auto-save' | 'manual' | 'recovery'; // Origen del save
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

// Datos de recovery con metadata
export interface ProductFormDataWithRecovery extends ProductFormData {
  _savedAt: string;
  _savedBy: 'auto-save' | 'manual' | 'recovery';
}

// Props para ProductWizard con soporte de edición
export interface ProductWizardProps {
  userId: string;
  productType: 'circuit' | 'package';
  editMode?: boolean;
  initialProduct?: Product;
}
