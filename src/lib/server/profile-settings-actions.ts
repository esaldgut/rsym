'use server';

import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';
import { runWithAmplifyServerContext } from '@/utils/amplify-server-utils';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { YAANUserType } from '@/lib/auth/unified-auth-system';

/**
 * Server Actions para actualización de perfil de usuario
 * Siguiendo el patrón de Next.js 15 Server Actions
 */

export interface ProfileUpdateData {
  phone_number?: string;
  birthdate?: string;
  preferred_username?: string;
  details?: string;
  profilePhotoPath?: string;
  have_a_passport?: boolean;
  have_a_Visa?: boolean;

  // Campos de influencer
  uniq_influencer_ID?: string;
  social_media_plfms?: any[];

  // Campos de provider
  company_profile?: string;
  locale?: string;
  address?: any;
  days_of_service?: any[];
  contact_information?: any;
  emgcy_details?: any;
  proofOfTaxStatusPath?: any;
  secturPath?: any;
  complianceOpinPath?: any;
}

export interface ProfileUpdateResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  attributesToUpdate?: Record<string, string>; // Para patrón híbrido
}

/**
 * Server Action para preparar la actualización del perfil del usuario
 * Usa un patrón híbrido: valida en el servidor, actualiza desde el cliente
 * Esto es necesario porque Amplify v6 requiere el contexto de autenticación del cliente
 *
 * @param userType - Tipo de usuario (traveler, influencer, provider)
 * @param data - Datos del formulario para actualizar
 * @returns Atributos preparados para actualizar desde el cliente
 */
export async function updateUserProfileAction(
  userType: YAANUserType,
  data: ProfileUpdateData
): Promise<ProfileUpdateResult> {
  try {
    // Verificar autenticación
    const auth = await UnifiedAuthSystem.requireAuthentication();

    if (!auth.user) {
      return {
        success: false,
        message: 'No autenticado'
      };
    }

    // Preparar atributos para actualizar en Cognito
    const attributesToUpdate: Record<string, string> = {};

    // Atributos básicos
    if (data.phone_number) attributesToUpdate.phone_number = data.phone_number;
    if (data.birthdate) {
      // Convertir fecha de formato HTML (YYYY-MM-DD) a formato Cognito (DD/MM/YYYY)
      const { htmlDateToCognito } = await import('@/utils/date-format-helpers');
      attributesToUpdate.birthdate = htmlDateToCognito(data.birthdate);
    }
    if (data.preferred_username) attributesToUpdate.preferred_username = data.preferred_username;
    if (data.details !== undefined) {
      // LÍMITE: AWS Cognito permite máximo 255 caracteres en atributos personalizados
      const maxDetailsLength = 250; // Dejar margen de seguridad
      const truncatedDetails = data.details.length > maxDetailsLength
        ? data.details.substring(0, maxDetailsLength)
        : data.details;
      attributesToUpdate['custom:details'] = truncatedDetails;
    }
    if (data.profilePhotoPath !== undefined) attributesToUpdate['custom:profilePhotoPath'] = data.profilePhotoPath;

    // Documentos de viaje
    attributesToUpdate['custom:have_a_passport'] = data.have_a_passport ? 'true' : 'false';
    attributesToUpdate['custom:have_a_Visa'] = data.have_a_Visa ? 'true' : 'false';

    // Tipo de usuario
    attributesToUpdate['custom:user_type'] = userType;

    // Atributos específicos de influencer
    if (userType === 'influencer') {
      if (data.uniq_influencer_ID) {
        attributesToUpdate['custom:uniq_influencer_ID'] = data.uniq_influencer_ID;
      }
      if (data.social_media_plfms) {
        attributesToUpdate['custom:social_media_plfms'] = JSON.stringify(data.social_media_plfms);
      }
    }

    // Atributos específicos de provider
    if (userType === 'provider') {
      if (data.company_profile) {
        // LÍMITE CRÍTICO: AWS Cognito permite máximo 255 caracteres en atributos personalizados
        // Truncar si es necesario y guardar solo el texto plano (sin JSON wrapper)
        const maxLength = 250; // Dejar margen de seguridad
        const truncatedProfile = data.company_profile.length > maxLength
          ? data.company_profile.substring(0, maxLength)
          : data.company_profile;

        attributesToUpdate['custom:company_profile'] = truncatedProfile;
      }
      if (data.locale) {
        attributesToUpdate.locale = data.locale;
      }
      if (data.address) {
        attributesToUpdate.address = JSON.stringify(data.address);
      }
      if (data.days_of_service) {
        attributesToUpdate['custom:days_of_service'] = JSON.stringify(data.days_of_service);
      }
      if (data.contact_information) {
        // Optimizar JSON usando claves cortas para ahorrar espacio
        const optimizedContact = {
          n: data.contact_information.contact_name || '',
          p: data.contact_information.contact_phone || '',
          e: data.contact_information.contact_email || ''
        };
        attributesToUpdate['custom:contact_information'] = JSON.stringify(optimizedContact);
      }
      if (data.emgcy_details) {
        // Optimizar JSON usando claves cortas para ahorrar espacio
        const optimizedEmergency = {
          n: data.emgcy_details.contact_name || '',
          p: data.emgcy_details.contact_phone || '',
          e: data.emgcy_details.contact_email || ''
        };
        attributesToUpdate['custom:emgcy_details'] = JSON.stringify(optimizedEmergency);
      }

      // Documentos
      if (data.proofOfTaxStatusPath !== undefined) {
        attributesToUpdate['custom:proofOfTaxStatusPath'] = JSON.stringify(data.proofOfTaxStatusPath);
      }
      if (data.secturPath !== undefined) {
        attributesToUpdate['custom:secturPath'] = JSON.stringify(data.secturPath);
      }
      if (data.complianceOpinPath !== undefined) {
        attributesToUpdate['custom:complianceOpinPath'] = JSON.stringify(data.complianceOpinPath);
      }
    }

    // PATRÓN HÍBRIDO: Server valida, Cliente actualiza
    // En Amplify Gen 2 v6, updateUserAttributes debe hacerse desde el cliente
    // para mantener el contexto de autenticación con IDToken necesario

    return {
      success: false, // false = necesita procesamiento en cliente
      message: 'client_update_required',
      attributesToUpdate // Atributos validados y preparados
    };

  } catch (error) {
    console.error('Error actualizando perfil:', error);

    return {
      success: false,
      message: 'Error al actualizar el perfil',
      errors: {
        general: error instanceof Error ? error.message : 'Error desconocido'
      }
    };
  }
}

/**
 * Server Action para revalidar páginas después de actualizar perfil
 * Debe ser llamado por el cliente después de actualizar exitosamente los atributos
 *
 * @param userType - Tipo de usuario para revalidar páginas específicas
 */
export async function revalidateProfilePages(userType: YAANUserType): Promise<void> {
  // Forzar refresh del token para obtener atributos actualizados
  await UnifiedAuthSystem.forceTokenRefresh();

  // Revalidar las páginas relacionadas
  revalidatePath('/profile');
  revalidatePath('/settings/profile');
  revalidatePath('/moments');
  revalidatePath('/marketplace');

  // Si es provider, revalidar también las páginas de provider
  if (userType === 'provider') {
    revalidatePath('/provider');
    revalidatePath('/provider/pending-approval');
    revalidatePath('/provider/products');
  }

  // Si es influencer, revalidar sus páginas
  if (userType === 'influencer') {
    revalidatePath('/influencer');
  }

  console.log('✅ Páginas revalidadas después de actualizar perfil');
}

/**
 * Server Action para validar datos del perfil antes de actualizar
 * @param userType - Tipo de usuario
 * @param data - Datos a validar
 * @returns Resultado de la validación
 */
export async function validateProfileDataAction(
  userType: YAANUserType,
  data: ProfileUpdateData
): Promise<{ isValid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};

  // Validaciones básicas
  if (!data.phone_number || data.phone_number.length < 10) {
    errors.phone_number = 'El número de teléfono es requerido (mínimo 10 dígitos)';
  }

  if (!data.birthdate) {
    errors.birthdate = 'La fecha de nacimiento es requerida';
  }

  if (!data.preferred_username || data.preferred_username.length < 3) {
    errors.preferred_username = 'El nombre de usuario debe tener al menos 3 caracteres';
  }

  if (!data.details || data.details.length < 10) {
    errors.details = 'La descripción debe tener al menos 10 caracteres';
  }
  // VALIDACIÓN CRÍTICA: AWS Cognito límite de 255 caracteres
  if (data.details && data.details.length > 250) {
    errors.details = 'La descripción no puede exceder 250 caracteres';
  }

  // Validaciones específicas para influencer
  if (userType === 'influencer') {
    if (!data.uniq_influencer_ID) {
      errors.uniq_influencer_ID = 'El ID de influencer es requerido';
    }
    if (!data.social_media_plfms || data.social_media_plfms.length === 0) {
      errors.social_media_plfms = 'Debes agregar al menos una red social';
    }
  }

  // Validaciones específicas para provider
  if (userType === 'provider') {
    if (!data.company_profile || data.company_profile.length < 20) {
      errors.company_profile = 'El perfil de empresa debe tener al menos 20 caracteres';
    }
    // VALIDACIÓN CRÍTICA: AWS Cognito límite de 255 caracteres
    if (data.company_profile && data.company_profile.length > 250) {
      errors.company_profile = 'El perfil de empresa no puede exceder 250 caracteres';
    }
    if (!data.locale) {
      errors.locale = 'El país de operación es requerido';
    }
    if (!data.contact_information?.contact_name) {
      errors.contact_name = 'El nombre de contacto es requerido';
    }
    if (!data.contact_information?.contact_phone) {
      errors.contact_phone = 'El teléfono de contacto es requerido';
    }
    if (!data.contact_information?.contact_email) {
      errors.contact_email = 'El email de contacto es requerido';
    }

    // Validar documentos requeridos
    if (!data.proofOfTaxStatusPath) {
      errors.proofOfTaxStatus = 'La constancia de situación fiscal es requerida';
    }
    if (!data.secturPath) {
      errors.sectur = 'El registro SECTUR es requerido';
    }
    if (!data.complianceOpinPath) {
      errors.complianceOpin = 'La opinión de cumplimiento es requerida';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Server Action para obtener el estado actual del perfil
 * @returns Estado de completitud del perfil
 */
export async function getProfileCompletionStatus(): Promise<{
  isComplete: boolean;
  missingFields: string[];
  userType?: YAANUserType;
}> {
  try {
    const auth = await UnifiedAuthSystem.getValidatedSession();

    if (!auth.isAuthenticated || !auth.user) {
      return {
        isComplete: false,
        missingFields: ['authentication'],
        userType: undefined
      };
    }

    // Obtener atributos del usuario
    const userAttributes = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        const { fetchUserAttributes } = await import('aws-amplify/auth/server');
        return await fetchUserAttributes(contextSpec);
      }
    });

    const missingFields: string[] = [];

    // Verificar campos básicos
    if (!userAttributes.phone_number) missingFields.push('phone_number');
    if (!userAttributes.birthdate) missingFields.push('birthdate');
    if (!userAttributes.preferred_username) missingFields.push('preferred_username');
    if (!userAttributes['custom:details']) missingFields.push('details');

    const userType = auth.user.userType;

    // Verificar campos específicos según el tipo de usuario
    if (userType === 'influencer') {
      if (!userAttributes['custom:uniq_influencer_ID']) missingFields.push('influencer_id');
      if (!userAttributes['custom:social_media_plfms']) missingFields.push('social_media');
    }

    if (userType === 'provider') {
      if (!userAttributes['custom:company_profile']) missingFields.push('company_profile');
      if (!userAttributes.locale) missingFields.push('locale');
      if (!userAttributes['custom:contact_information']) missingFields.push('contact_information');

      // Documentos requeridos
      if (!userAttributes['custom:proofOfTaxStatusPath']) missingFields.push('tax_document');
      if (!userAttributes['custom:secturPath']) missingFields.push('sectur_document');
      if (!userAttributes['custom:complianceOpinPath']) missingFields.push('compliance_document');
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      userType
    };

  } catch (error) {
    console.error('Error checking profile completion:', error);
    return {
      isComplete: false,
      missingFields: ['error'],
      userType: undefined
    };
  }
}