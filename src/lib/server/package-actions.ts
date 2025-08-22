'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { createPackage, getAllActivePackagesByProvider } from '@/lib/graphql/operations';
import { getIdTokenServer, getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { SecurityValidator } from '@/lib/security-validator';
import { canExecuteGraphQLOperation } from '@/lib/permission-matrix';
import type { 
  CreatePackageInput, 
  Package, 
  CircuitLocationInput,
  PriceInput
} from '@/lib/graphql/types';

/**
 * Server Action Response Type
 */
export interface PackageActionResponse {
  success: boolean;
  data?: Package;
  error?: string;
  validationErrors?: Record<string, string>;
}

export interface PackageListResponse {
  success: boolean;
  data?: Package[];
  error?: string;
}

/**
 * Validar datos del formulario de Package
 */
function validatePackageInput(input: CreatePackageInput): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validaciones requeridas
  if (!input.name?.trim()) {
    errors.name = 'El nombre del paquete es requerido';
  } else if (input.name.length < 3) {
    errors.name = 'El nombre debe tener al menos 3 caracteres';
  } else if (input.name.length > 100) {
    errors.name = 'El nombre no puede exceder 100 caracteres';
  }

  if (!input.description?.trim()) {
    errors.description = 'La descripción es requerida';
  } else if (input.description.length < 10) {
    errors.description = 'La descripción debe tener al menos 10 caracteres';
  } else if (input.description.length > 1000) {
    errors.description = 'La descripción no puede exceder 1000 caracteres';
  }

  if (!input.capacity || input.capacity < 1) {
    errors.capacity = 'La capacidad debe ser al menos 1 persona';
  } else if (input.capacity > 50) {
    errors.capacity = 'La capacidad no puede exceder 50 personas';
  }

  if (!input.numberOfNights?.trim()) {
    errors.numberOfNights = 'El número de noches es requerido';
  } else {
    const nights = parseInt(input.numberOfNights);
    if (isNaN(nights) || nights < 1) {
      errors.numberOfNights = 'Debe ser un número válido mayor a 0';
    } else if (nights > 365) {
      errors.numberOfNights = 'No puede exceder 365 noches';
    }
  }

  if (!input.included_services?.trim()) {
    errors.included_services = 'Los servicios incluidos son requeridos';
  }

  // Validar ubicaciones
  if (!input.destination || input.destination.length === 0) {
    errors.destination = 'Debe seleccionar al menos una ubicación de destino';
  } else {
    input.destination.forEach((location, index) => {
      if (!location.place?.trim()) {
        errors[`destination_${index}`] = `La ubicación ${index + 1} debe tener un nombre válido`;
      }
      if (!location.coordinates || location.coordinates.length !== 2) {
        errors[`destination_${index}_coords`] = `La ubicación ${index + 1} debe tener coordenadas válidas`;
      }
    });
  }

  // Validar precios
  if (input.prices && input.prices.length > 0) {
    input.prices.forEach((price, index) => {
      if (!price.price || price.price <= 0) {
        errors[`price_${index}`] = `El precio ${index + 1} debe ser mayor a 0`;
      }
      if (!price.currency?.trim()) {
        errors[`price_${index}_currency`] = `El precio ${index + 1} debe tener una moneda válida`;
      }
    });
  }

  // Validar preferencias
  if (input.preferences && input.preferences.length > 10) {
    errors.preferences = 'No puedes agregar más de 10 preferencias';
  }

  // Validar fechas
  if (!input.startDate) {
    errors.startDate = 'La fecha de inicio es requerida';
  } else {
    const startDate = new Date(input.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      errors.startDate = 'La fecha de inicio no puede ser anterior a hoy';
    }
  }

  if (!input.endDate) {
    errors.endDate = 'La fecha de fin es requerida';
  } else if (input.startDate) {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    
    if (endDate <= startDate) {
      errors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
  }

  // Validar imagen de portada
  if (!input.cover_image_url?.trim()) {
    errors.cover_image_url = 'La imagen de portada es requerida';
  } else {
    try {
      new URL(input.cover_image_url);
    } catch {
      errors.cover_image_url = 'La imagen de portada debe ser una URL válida';
    }
  }

  // Validar categoría (solo una permitida)
  const validCategories = ['Primera', 'Primera superior', 'Lujo'];
  if (!input.categories || input.categories.length === 0) {
    errors.categories = 'Debe seleccionar una categoría';
  } else if (input.categories.length > 1) {
    errors.categories = 'Solo puede seleccionar una categoría';
  } else if (!validCategories.includes(input.categories[0])) {
    errors.categories = 'Categoría inválida. Debe ser: Primera, Primera superior o Lujo';
  }

  // Validar idiomas (al menos uno requerido)
  if (!input.language || input.language.length === 0) {
    errors.language = 'Debe seleccionar al menos un idioma para la experiencia';
  }

  // Validar URLs de imágenes adicionales
  if (input.image_url && input.image_url.length > 0) {
    input.image_url.forEach((url, index) => {
      if (url && url.trim()) {
        try {
          new URL(url);
        } catch {
          errors[`image_url_${index}`] = `La imagen ${index + 1} debe ser una URL válida`;
        }
      }
    });
  }

  // Validar URLs de videos
  if (input.video_url && input.video_url.length > 0) {
    input.video_url.forEach((url, index) => {
      if (url && url.trim()) {
        try {
          new URL(url);
        } catch {
          errors[`video_url_${index}`] = `El video ${index + 1} debe ser una URL válida`;
        }
      }
    });
  }

  // Validar precios extra
  if (input.extraPrices && input.extraPrices.length > 0) {
    input.extraPrices.forEach((price, index) => {
      if (!price.price || price.price <= 0) {
        errors[`extraPrice_${index}`] = `El precio extra ${index + 1} debe ser mayor a 0`;
      }
      if (!price.currency?.trim()) {
        errors[`extraPrice_${index}_currency`] = `El precio extra ${index + 1} debe tener una moneda válida`;
      }
    });
  }

  return errors;
}

/**
 * Sanitizar entrada del formulario
 */
function sanitizePackageInput(input: CreatePackageInput): CreatePackageInput {
  // Función helper para limpiar objetos de ubicación
  const cleanLocation = (location: CircuitLocationInput): CircuitLocationInput => {
    const { amazon_location_service_response, ...cleanedLocation } = location as any;
    return cleanedLocation;
  };

  return {
    ...input,
    name: input.name?.trim(),
    description: input.description?.trim(),
    included_services: input.included_services?.trim(),
    aditional_services: input.aditional_services?.trim(),
    numberOfNights: input.numberOfNights?.trim(),
    cover_image_url: input.cover_image_url?.trim(),
    preferences: input.preferences?.map(p => p.trim()).filter(Boolean),
    categories: input.categories?.map(c => c.trim()).filter(Boolean),
    language: input.language?.map(l => l.trim()).filter(Boolean),
    image_url: input.image_url?.map(url => url.trim()).filter(Boolean),
    video_url: input.video_url?.map(url => url.trim()).filter(Boolean),
    // Limpiar ubicaciones removiendo amazon_location_service_response
    destination: input.destination?.map(cleanLocation),
    origin: input.origin?.map(cleanLocation),
    // Las fechas y precios ya vienen en el formato correcto
    startDate: input.startDate,
    endDate: input.endDate,
    prices: input.prices,
    extraPrices: input.extraPrices
  };
}

/**
 * Server Action: Crear Package
 */
export async function createPackageAction(
  formData: FormData
): Promise<PackageActionResponse> {
  try {
    console.log('🚀 [CreatePackage] Iniciando creación de paquete...');

    // 1. Verificar autenticación y obtener usuario
    const user = await getAuthenticatedUser();
    if (!user) {
      console.log('❌ [CreatePackage] Usuario no autenticado');
      redirect('/auth?error=authentication_required');
    }

    // 2. Verificar tipo de usuario (solo providers)
    const userType = user.userType;
    if (userType !== 'provider') {
      console.log('❌ [CreatePackage] Usuario no es provider:', userType);
      return {
        success: false,
        error: 'Solo los proveedores pueden crear paquetes turísticos'
      };
    }

    // 3. Verificar permisos GraphQL
    if (!canExecuteGraphQLOperation(userType, 'createPackage')) {
      console.log('❌ [CreatePackage] Sin permisos para createPackage');
      return {
        success: false,
        error: 'No tienes permisos para crear paquetes'
      };
    }

    // 4. Obtener y validar ID Token
    const idToken = await getIdTokenServer();
    if (!idToken) {
      console.log('❌ [CreatePackage] ID Token no disponible');
      return {
        success: false,
        error: 'Token de autenticación no válido'
      };
    }

    // 5. Extraer datos del formulario
    const rawInput: CreatePackageInput = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      capacity: parseInt(formData.get('capacity') as string),
      numberOfNights: formData.get('numberOfNights') as string,
      included_services: formData.get('included_services') as string,
      aditional_services: formData.get('aditional_services') as string,
      cover_image_url: formData.get('cover_image_url') as string,
      provider_id: user.sub || user.userId,
      
      // Parsear arrays JSON
      destination: JSON.parse(formData.get('destination') as string || '[]') as CircuitLocationInput[],
      origin: JSON.parse(formData.get('origin') as string || '[]') as CircuitLocationInput[],
      prices: JSON.parse(formData.get('prices') as string || '[]') as PriceInput[],
      extraPrices: JSON.parse(formData.get('extraPrices') as string || '[]') as PriceInput[],
      preferences: JSON.parse(formData.get('preferences') as string || '[]') as string[],
      categories: JSON.parse(formData.get('categories') as string || '[]') as string[],
      language: JSON.parse(formData.get('language') as string || '[]') as string[],
      image_url: JSON.parse(formData.get('image_url') as string || '[]') as string[],
      video_url: JSON.parse(formData.get('video_url') as string || '[]') as string[],
      
      // Fechas opcionales
      startDate: formData.get('startDate') as string || undefined,
      endDate: formData.get('endDate') as string || undefined
    };

    console.log('📝 [CreatePackage] Datos extraídos:', {
      name: rawInput.name,
      provider_id: rawInput.provider_id,
      destination_count: rawInput.destination?.length,
      prices_count: rawInput.prices?.length
    });

    // 6. Sanitizar datos
    const sanitizedInput = sanitizePackageInput(rawInput);

    // 7. Validar datos
    const validationErrors = validatePackageInput(sanitizedInput);
    if (Object.keys(validationErrors).length > 0) {
      console.log('❌ [CreatePackage] Errores de validación:', validationErrors);
      return {
        success: false,
        error: 'Datos del formulario inválidos',
        validationErrors
      };
    }

    // 8. Filtrar campos para compatibilidad con esquema GraphQL
    // Removemos campos que podrían no existir en el esquema del backend
    const graphqlInput: any = {
      name: sanitizedInput.name,
      description: sanitizedInput.description,
      provider_id: sanitizedInput.provider_id,
      destination: sanitizedInput.destination,
      origin: sanitizedInput.origin,
      included_services: sanitizedInput.included_services,
      aditional_services: sanitizedInput.aditional_services,
      capacity: sanitizedInput.capacity,
      numberOfNights: sanitizedInput.numberOfNights,
      prices: sanitizedInput.prices,
      preferences: sanitizedInput.preferences,
      categories: sanitizedInput.categories
    };

    // Agregar campos opcionales solo si tienen valor
    if (sanitizedInput.cover_image_url) graphqlInput.cover_image_url = sanitizedInput.cover_image_url;
    
    // Convertir fechas a formato AWSDateTime (ISO 8601 con tiempo)
    if (sanitizedInput.startDate) {
      // Si es solo fecha (YYYY-MM-DD), agregar tiempo por defecto
      const startDate = sanitizedInput.startDate.includes('T') 
        ? sanitizedInput.startDate 
        : `${sanitizedInput.startDate}T00:00:00.000Z`;
      graphqlInput.startDate = startDate;
    }
    
    if (sanitizedInput.endDate) {
      // Si es solo fecha (YYYY-MM-DD), agregar tiempo por defecto
      const endDate = sanitizedInput.endDate.includes('T')
        ? sanitizedInput.endDate
        : `${sanitizedInput.endDate}T23:59:59.999Z`;
      graphqlInput.endDate = endDate;
    }
    
    if (sanitizedInput.language && sanitizedInput.language.length > 0) graphqlInput.language = sanitizedInput.language;
    if (sanitizedInput.image_url && sanitizedInput.image_url.length > 0) graphqlInput.image_url = sanitizedInput.image_url;
    if (sanitizedInput.video_url && sanitizedInput.video_url.length > 0) graphqlInput.video_url = sanitizedInput.video_url;
    if (sanitizedInput.extraPrices && sanitizedInput.extraPrices.length > 0) graphqlInput.extraPrices = sanitizedInput.extraPrices;

    // 9. Ejecutar GraphQL mutation
    console.log('🔄 [CreatePackage] Ejecutando mutación GraphQL...');
    console.log('📦 [CreatePackage] Input a enviar:', JSON.stringify(graphqlInput, null, 2));
    
    // Importar cliente GraphQL server
    const { executeGraphQLOperation } = await import('@/lib/graphql/server-client');
    
    const result = await executeGraphQLOperation({
      query: createPackage,
      variables: { input: graphqlInput }
    });

    if (!result.success || !result.data?.createPackage) {
      console.log('❌ [CreatePackage] Error en GraphQL:', result.error);
      return {
        success: false,
        error: result.error || 'Error al crear el paquete en la base de datos'
      };
    }

    const createdPackage = result.data.createPackage as Package;
    console.log('✅ [CreatePackage] Paquete creado exitosamente:', createdPackage.id);

    // 10. Revalidar cache
    revalidatePath('/dashboard');
    revalidateTag('packages');
    revalidateTag(`provider-packages-${user.sub}`);

    return {
      success: true,
      data: createdPackage
    };

  } catch (error) {
    console.error('💥 [CreatePackage] Error inesperado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action: Obtener packages del provider
 */
export async function getProviderPackagesAction(): Promise<PackageListResponse> {
  try {
    console.log('🔍 [GetProviderPackages] Obteniendo paquetes del provider...');

    // 1. Verificar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      redirect('/auth?error=authentication_required');
    }

    // 2. Verificar que es provider
    if (user.userType !== 'provider') {
      return {
        success: false,
        error: 'Solo los proveedores pueden ver sus paquetes'
      };
    }

    // 3. Verificar permisos
    if (!canExecuteGraphQLOperation(user.userType, 'getMyPackages')) {
      return {
        success: false,
        error: 'No tienes permisos para ver los paquetes'
      };
    }

    // 4. Obtener ID Token
    const idToken = await getIdTokenServer();
    if (!idToken) {
      return {
        success: false,
        error: 'Token de autenticación no válido'
      };
    }

    // 5. Debug user data
    console.log('🔍 [GetProviderPackages] User data:', {
      userId: user.userId,
      username: user.username,
      sub: user.sub,
      userType: user.userType
    });

    // 5. Ejecutar query GraphQL
    const { executeGraphQLOperation } = await import('@/lib/graphql/server-client');
    
    const providerId = user.sub || user.userId;
    console.log('📝 [GetProviderPackages] Using provider_id:', providerId);
    
    const result = await executeGraphQLOperation({
      query: getAllActivePackagesByProvider,
      variables: { provider_id: providerId }
    });

    if (!result.success) {
      console.log('❌ [GetProviderPackages] Error en GraphQL:', result.error);
      return {
        success: false,
        error: result.error || 'Error al obtener los paquetes'
      };
    }

    const packages = result.data?.getAllActivePackagesByProvider as Package[] || [];
    console.log('✅ [GetProviderPackages] Obtenidos', packages.length, 'paquetes');

    return {
      success: true,
      data: packages
    };

  } catch (error) {
    console.error('💥 [GetProviderPackages] Error inesperado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}