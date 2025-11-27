'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
// ✅ Usar imports desde GraphQL Code Generator (fuente única de verdad)
import {
  createProductOfTypeCircuit,
  createProductOfTypePackage,
  updateProduct
} from '@/graphql/operations';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { SecurityValidator } from '@/lib/security-validator';
import { canExecuteGraphQLOperation } from '@/lib/permission-matrix';
import { transformProductUrlsToPaths } from '@/lib/utils/s3-url-transformer';
import type {
  CreateProductOfTypeCircuitInput,
  CreateProductOfTypePackageInput,
  UpdateProductInput,
  Product
} from '@/generated/graphql';

export interface ProductActionResponse {
  success: boolean;
  data?: Product;
  error?: string;
  errors?: Record<string, string>;
  redirectTo?: string;
}

// Crear producto tipo circuito
export async function createCircuitProductAction(
  input: CreateProductOfTypeCircuitInput
): Promise<ProductActionResponse> {
  try {
    // 1. Autenticación
    const user = await getAuthenticatedUser();
    if (!user || !user.userId) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // 2. Validación de permisos
    if (!canExecuteGraphQLOperation(user, 'createProductOfTypeCircuit')) {
      return {
        success: false,
        error: 'No tienes permisos para crear productos'
      };
    }

    // 3. Validación de seguridad
    const securityCheck = SecurityValidator.validateProductInput(input);
    if (!securityCheck.isValid) {
      return {
        success: false,
        error: 'Datos del producto inválidos',
        errors: securityCheck.errors
      };
    }

    // 4. Transformar URLs a paths antes de enviar a GraphQL
    const transformedInput = transformProductUrlsToPaths({
      ...input,
      user_id: user.userId
    });

    // 5. Crear el producto
    const result = await createProductOfTypeCircuit(transformedInput);

    if (!result.data?.createProductOfTypeCircuit) {
      return {
        success: false,
        error: 'Error al crear el producto'
      };
    }

    // 5. Revalidar cache y redireccionar
    revalidateTag(`user-products-${user.userId}`);
    revalidatePath('/provider/products');

    return {
      success: true,
      data: result.data.createProductOfTypeCircuit,
      redirectTo: `/provider/products/${result.data.createProductOfTypeCircuit.id}`
    };

  } catch (error: unknown) {
    console.error('Error creating circuit product:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

// Crear producto tipo paquete
export async function createPackageProductAction(
  input: CreateProductOfTypePackageInput
): Promise<ProductActionResponse> {
  try {
    // 1. Autenticación
    const user = await getAuthenticatedUser();
    if (!user || !user.userId) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // 2. Validación de permisos
    if (!canExecuteGraphQLOperation(user, 'createProductOfTypePackage')) {
      return {
        success: false,
        error: 'No tienes permisos para crear productos'
      };
    }

    // 3. Validación de seguridad
    const securityCheck = SecurityValidator.validateProductInput(input);
    if (!securityCheck.isValid) {
      return {
        success: false,
        error: 'Datos del producto inválidos',
        errors: securityCheck.errors
      };
    }

    // 4. Transformar URLs a paths antes de enviar a GraphQL
    const transformedInput = transformProductUrlsToPaths({
      ...input,
      user_id: user.userId
    });

    // 5. Crear el producto
    const result = await createProductOfTypePackage(transformedInput);

    if (!result.data?.createProductOfTypePackage) {
      return {
        success: false,
        error: 'Error al crear el producto'
      };
    }

    // 5. Revalidar cache y redireccionar
    revalidateTag(`user-products-${user.userId}`);
    revalidatePath('/provider/products');

    return {
      success: true,
      data: result.data.createProductOfTypePackage,
      redirectTo: `/provider/products/${result.data.createProductOfTypePackage.id}`
    };

  } catch (error: unknown) {
    console.error('Error creating package product:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

// Actualizar producto existente
export async function updateProductAction(
  productId: string,
  input: UpdateProductInput
): Promise<ProductActionResponse> {
  try {
    // 1. Autenticación
    const user = await getAuthenticatedUser();
    if (!user || !user.userId) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // 2. Validación de permisos
    if (!canExecuteGraphQLOperation(user, 'updateProduct')) {
      return {
        success: false,
        error: 'No tienes permisos para actualizar productos'
      };
    }

    // 3. Validación de seguridad
    const securityCheck = SecurityValidator.validateProductUpdate(input);
    if (!securityCheck.isValid) {
      return {
        success: false,
        error: 'Datos de actualización inválidos',
        errors: securityCheck.errors
      };
    }

    // 4. Transformar URLs a paths antes de enviar a GraphQL
    const transformedInput = transformProductUrlsToPaths({
      id: productId,
      ...input
    });

    // 5. Actualizar el producto
    const result = await updateProduct({
      input: transformedInput
    });

    if (!result.data?.updateProduct) {
      return {
        success: false,
        error: 'Error al actualizar el producto'
      };
    }

    // 6. Revalidar cache
    revalidateTag(`product-${productId}`);
    revalidateTag(`user-products-${user.userId}`);
    revalidatePath('/provider/products');
    revalidatePath(`/provider/products/${productId}`);

    return {
      success: true,
      data: result.data.updateProduct
    };

  } catch (error: unknown) {
    console.error('Error updating product:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

// Crear borrador temporal del producto (autosave)
export async function saveDraftProductAction(
  productType: 'circuit' | 'package',
  formData: Record<string, unknown>
): Promise<ProductActionResponse> {
  try {
    // 1. Autenticación
    const user = await getAuthenticatedUser();
    if (!user || !user.userId) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // 2. Guardar en localStorage del navegador o en cache temporal
    // Por ahora, solo retornamos éxito sin persistir
    // En una implementación completa, se podría usar un storage temporal
    
    return {
      success: true,
      data: undefined
    };

  } catch (error: unknown) {
    console.error('Error saving draft:', error);
    return {
      success: false,
      error: error.message || 'Error guardando borrador'
    };
  }
}

// Validar datos del paso actual
export async function validateStepDataAction(
  stepId: string,
  data: Record<string, unknown>,
  productType: 'circuit' | 'package'
): Promise<{
  success: boolean;
  errors?: Record<string, string>;
}> {
  try {
    // Validar según el tipo de paso
    const validationErrors: Record<string, string> = {};

    switch (stepId) {
      case 'general-info':
        if (!data.name || data.name.length < 3) {
          validationErrors.name = 'El nombre debe tener al menos 3 caracteres';
        }
        if (!data.preferences || data.preferences.length === 0) {
          validationErrors.preferences = 'Selecciona al menos un tipo de interés';
        }
        if (!data.languages || data.languages.length === 0) {
          validationErrors.languages = 'Selecciona al menos un idioma';
        }
        if (!data.description || data.description.length < 20) {
          validationErrors.description = 'La descripción debe tener al menos 20 caracteres';
        }
        if (productType === 'circuit' && (!data.destination || data.destination.length === 0)) {
          validationErrors.destination = 'Agrega al menos un destino';
        }
        break;

      case 'tour-details':
        if (!data.itinerary || data.itinerary.length < 50) {
          validationErrors.itinerary = 'El itinerario debe tener al menos 50 caracteres';
        }
        if (!data.seasons || data.seasons.length === 0) {
          validationErrors.seasons = 'Agrega al menos una temporada';
        }
        break;

      case 'package-details':
        if (!data.origin || data.origin.length !== 1) {
          validationErrors.origin = 'Selecciona exactamente un origen';
        }
        if (!data.destination || data.destination.length !== 1) {
          validationErrors.destination = 'Selecciona exactamente un destino';
        }
        if (!data.seasons || data.seasons.length !== 1) {
          validationErrors.seasons = 'Configura exactamente una temporada';
        }
        break;

      case 'policies':
        if (!data.payment_policy || !data.payment_policy.options || data.payment_policy.options.length === 0) {
          validationErrors.payment_policy = 'Configura al menos una opción de pago';
        }
        break;
    }

    return {
      success: Object.keys(validationErrors).length === 0,
      errors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined
    };

  } catch (error: unknown) {
    console.error('Error validating step data:', error);
    return {
      success: false,
      errors: {
        general: 'Error de validación'
      }
    };
  }
}
