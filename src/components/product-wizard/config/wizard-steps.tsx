import { lazy } from 'react';
import { 
  generalInfoCircuitSchema,
  generalInfoPackageSchema,
  productDetailsSchema,
  policiesSchema
} from '@/lib/validations/product-schemas';
import type { FormStep } from '@/types/wizard';
import { z } from 'zod';

// Lazy load components para mejor performance
const GeneralInfoStep = lazy(() => import('../steps/GeneralInfoStep'));
const ProductDetailsStep = lazy(() => import('../steps/ProductDetailsStep'));
const PoliciesStep = lazy(() => import('../steps/PoliciesStep'));
const ReviewStep = lazy(() => import('../steps/ReviewStep'));

// Pasos unificados para ambos tipos de producto
export const PRODUCT_STEPS: FormStep[] = [
  { 
    id: 'general-info', 
    title: 'Información General', 
    component: GeneralInfoStep, 
    validation: generalInfoCircuitSchema, // Se usará dinámicamente
    optional: false 
  },
  { 
    id: 'product-details', 
    title: 'Detalles del Producto', 
    component: ProductDetailsStep, 
    validation: productDetailsSchema, 
    optional: false 
  },
  { 
    id: 'policies', 
    title: 'Políticas de Pago', 
    component: PoliciesStep, 
    validation: policiesSchema, 
    optional: false 
  },
  { 
    id: 'review', 
    title: 'Revisión', 
    component: ReviewStep, 
    validation: z.object({}), 
    optional: false 
  }
];

// Función para obtener los pasos según el tipo de producto
export function getStepsForProductType(productType: 'circuit' | 'package'): FormStep[] {
  const steps = [...PRODUCT_STEPS];
  
  // Ajustar validación del primer paso según el tipo
  steps[0] = {
    ...steps[0],
    validation: productType === 'circuit' ? generalInfoCircuitSchema : generalInfoPackageSchema,
    title: 'Información General'
  };
  
  // Ajustar título del segundo paso dinámicamente
  steps[1] = {
    ...steps[1],
    title: productType === 'circuit' ? 'Detalles del Circuito' : 'Detalles del Paquete'
  };
  
  return steps;
}

// Mantener exports legacy para compatibilidad
export const CIRCUIT_STEPS = getStepsForProductType('circuit');
export const PACKAGE_STEPS = getStepsForProductType('package');