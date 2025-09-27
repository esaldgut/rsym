import {
  updateUserAttributes,
  fetchUserAttributes,
  type UpdateUserAttributesOutput
} from 'aws-amplify/auth';
import { htmlDateToCognito } from '@/utils/date-format-helpers';

/**
 * Servicio para gestión de atributos de usuario en Cognito
 * Implementa las mejores prácticas de AWS Amplify v6
 */

// Tipos para los atributos personalizados de Cognito
export interface UserProfileAttributes {
  // Atributos estándar
  given_name?: string;
  family_name?: string;
  email?: string;
  phone_number?: string;
  birthdate?: string;
  preferred_username?: string;
  locale?: string;
  name?: string;
  address?: string;
  
  // Atributos personalizados comunes
  'custom:user_type'?: 'traveler' | 'influencer' | 'provider';
  'custom:profilePhotoPath'?: string;
  'custom:details'?: string;
  'custom:have_a_passport'?: string; // Boolean as string
  'custom:have_a_Visa'?: string; // Boolean as string
  
  // Atributos para influencer
  'custom:uniq_influencer_ID'?: string;
  'custom:social_media_plfms'?: string; // JSON stringified
  'custom:profilePreferences'?: string; // Colon-separated IDs
  
  // Atributos para provider
  'custom:company_profile'?: string;
  'custom:days_of_service'?: string; // JSON stringified
  'custom:contact_information'?: string; // JSON stringified
  'custom:emgcy_details'?: string; // JSON stringified
  'custom:proofOfTaxStatusPath'?: string; // JSON stringified
  'custom:secturPath'?: string; // JSON stringified
  'custom:complianceOpinPath'?: string; // JSON stringified
  'custom:provider_is_approved'?: string; // Boolean as string
  
  // Atributos para provider e influencer
  'custom:banking_details'?: string;
  'custom:interest_rate'?: string;
  'custom:req_special_services'?: string; // Boolean as string
  'custom:credentials'?: string;
}

// Tipos para los datos del formulario
export interface ProfileFormData {
  // Campos comunes
  profilePhotoPath?: string;
  phone_number?: string;
  birthdate?: string;
  preferred_username?: string;
  details?: string;
  have_a_passport?: boolean;
  have_a_Visa?: boolean;
  
  // Campos para influencer
  uniq_influencer_ID?: string;
  social_media_plfms?: SocialMediaPlatform[];
  profilePreferences?: string[];
  
  // Campos para provider
  company_profile?: string;
  days_of_service?: ServiceSchedule[];
  locale?: string;
  contact_information?: ContactInfo;
  emgcy_details?: ContactInfo;
  proofOfTaxStatusPath?: DocumentPath;
  secturPath?: DocumentPath;
  complianceOpinPath?: DocumentPath;
  
  // Campos para provider e influencer
  address?: Address;
  name?: string;
  banking_details?: string;
  interest_rate?: string;
  req_special_services?: boolean;
  credentials?: string;
}

export interface SocialMediaPlatform {
  name: string;
  target: string;
  socialMedia: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'linkedin' | 'youtube' | 'twitch';
}

export interface ServiceSchedule {
  day: 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';
  sd: string; // Start time
  ed: string; // End time
}

export interface ContactInfo {
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

export interface DocumentPath {
  uri: string;
  name: string;
}

export interface Address {
  cp: string;  // Código Postal
  c: string;   // Calle
  ne: string;  // Número Exterior
  ni?: string; // Número Interior
  col: string; // Colonia
  mun: string; // Municipio
  est: string; // Estado
}

/**
 * Actualiza los atributos del usuario en Cognito
 * @param userType - Tipo de usuario (traveler, influencer, provider)
 * @param formData - Datos del formulario
 * @returns Resultado de la actualización
 */
export async function updateUserProfile(
  userType: 'traveler' | 'influencer' | 'provider',
  formData: ProfileFormData
): Promise<UpdateUserAttributesOutput> {
  try {
    // Construir los atributos para actualizar
    const attributes: UserProfileAttributes = {
      'custom:user_type': userType,
      // Agregar timestamp de última actualización para detectar cambios
      //'custom:last_updated': Math.floor(Date.now() / 1000).toString(),
    };
    
    // Atributos comunes
    if (formData.phone_number) attributes.phone_number = formData.phone_number;
    // Convertir fecha de formato HTML (YYYY-MM-DD) a formato Cognito (DD/MM/YYYY)
    if (formData.birthdate) attributes.birthdate = htmlDateToCognito(formData.birthdate);
    if (formData.preferred_username) attributes.preferred_username = formData.preferred_username;
    if (formData.profilePhotoPath) attributes['custom:profilePhotoPath'] = formData.profilePhotoPath;
    if (formData.details) attributes['custom:details'] = formData.details;
    
    // Booleanos como strings
    attributes['custom:have_a_passport'] = String(formData.have_a_passport || false);
    attributes['custom:have_a_Visa'] = String(formData.have_a_Visa || false);
    
    // Atributos específicos de influencer
    if (userType === 'influencer') {
      if (formData.uniq_influencer_ID) {
        attributes['custom:uniq_influencer_ID'] = formData.uniq_influencer_ID;
      }
      if (formData.social_media_plfms && formData.social_media_plfms.length > 0) {
        attributes['custom:social_media_plfms'] = JSON.stringify(formData.social_media_plfms);
      }
      if (formData.profilePreferences && formData.profilePreferences.length > 0) {
        attributes['custom:profilePreferences'] = formData.profilePreferences.join(':');
      }
    }
    
    // Atributos específicos de provider
    if (userType === 'provider') {
      if (formData.company_profile) {
        // Guardar como JSON con estructura {description: "..."}
        attributes['custom:company_profile'] = JSON.stringify({
          description: formData.company_profile
        });
      }
      if (formData.days_of_service && formData.days_of_service.length > 0) {
        attributes['custom:days_of_service'] = JSON.stringify(formData.days_of_service);
      }
      if (formData.locale) {
        attributes.locale = formData.locale;
      }
      if (formData.contact_information) {
        attributes['custom:contact_information'] = JSON.stringify(formData.contact_information);
      }
      if (formData.emgcy_details) {
        attributes['custom:emgcy_details'] = JSON.stringify(formData.emgcy_details);
      }
      if (formData.proofOfTaxStatusPath) {
        attributes['custom:proofOfTaxStatusPath'] = JSON.stringify(formData.proofOfTaxStatusPath);
      }
      if (formData.secturPath) {
        attributes['custom:secturPath'] = JSON.stringify(formData.secturPath);
      }
      if (formData.complianceOpinPath) {
        attributes['custom:complianceOpinPath'] = JSON.stringify(formData.complianceOpinPath);
      }
    }
    
    // Atributos para provider e influencer
    if (userType === 'provider' || userType === 'influencer') {
      if (formData.address) {
        attributes.address = JSON.stringify(formData.address);
      }
      if (formData.name) {
        attributes.name = formData.name;
      }
      if (formData.banking_details) {
        attributes['custom:banking_details'] = formData.banking_details;
      }
      if (formData.interest_rate) {
        attributes['custom:interest_rate'] = formData.interest_rate;
      }
      if (formData.req_special_services !== undefined) {
        attributes['custom:req_special_services'] = String(formData.req_special_services);
      }
      if (formData.credentials) {
        attributes['custom:credentials'] = formData.credentials;
      }
    }
    
    // Actualizar atributos en Cognito
    const result = await updateUserAttributes({
      userAttributes: attributes
    });
    
    console.log('Atributos actualizados exitosamente:', result);
    
    // Programar refresh de tokens después de actualización de perfil
    // IMPORTANTE: /settings/profile es una ruta con protección nivel 1
    // TODOS los cambios en esta ruta requieren refresh inmediato del token
    if (typeof window !== 'undefined') {
      // Importar dinámicamente para evitar problemas en SSR
      const { TokenInterceptor } = await import('./token-interceptor');
      
      // Atributos que requieren refresh con recarga de página
      const criticalAttributes = [
        'custom:user_type',
        'custom:provider_is_approved',
        'custom:influencer_is_approved'
      ];
      
      const hasCriticalChanges = Object.keys(attributes).some(attr => 
        criticalAttributes.includes(attr)
      );
      
      console.log('🔄 Actualizando perfil en ruta protegida nivel 1 - Refresh de tokens requerido');
      
      if (hasCriticalChanges) {
        // Refresh inmediato con recarga para cambios críticos de tipo/aprobación
        setTimeout(() => {
          TokenInterceptor.refreshAfterProfileUpdate();
        }, 500);
      } else {
        // Para otros cambios en /settings/profile, refresh inmediato pero sin recarga
        setTimeout(async () => {
          await TokenInterceptor.performSilentRefresh();
          console.log('✅ Tokens actualizados después de cambios en el perfil');
        }, 500);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error actualizando atributos del usuario:', error);
    throw error;
  }
}

/**
 * Obtiene todos los atributos del usuario actual
 * @returns Atributos del usuario
 */
export async function getUserProfile(): Promise<UserProfileAttributes> {
  try {
    const attributes = await fetchUserAttributes();
    return attributes as UserProfileAttributes;
  } catch (error) {
    console.error('Error obteniendo atributos del usuario:', error);
    throw error;
  }
}

/**
 * Verifica si el perfil del usuario está completo
 * @returns true si el perfil está completo
 */
export async function isProfileComplete(): Promise<boolean> {
  try {
    const attributes = await getUserProfile();
    const userType = attributes['custom:user_type'];
    
    if (!userType) {
      return false;
    }
    
    // Verificar campos obligatorios comunes
    const requiredCommon = [
      attributes.phone_number,
      attributes.birthdate,
      attributes.preferred_username,
      attributes['custom:details'],
      attributes['custom:profilePhotoPath']
    ];
    
    if (requiredCommon.some(field => !field)) {
      return false;
    }
    
    // Verificar campos específicos según el tipo
    if (userType === 'influencer') {
      const requiredInfluencer = [
        attributes['custom:uniq_influencer_ID'],
        attributes['custom:social_media_plfms']
      ];
      if (requiredInfluencer.some(field => !field)) {
        return false;
      }
    }
    
    if (userType === 'provider') {
      const requiredProvider = [
        attributes['custom:company_profile'],
        attributes['custom:days_of_service'],
        attributes.locale,
        attributes['custom:contact_information'],
        attributes['custom:emgcy_details'],
        attributes['custom:proofOfTaxStatusPath'],
        attributes['custom:secturPath'],
        attributes['custom:complianceOpinPath']
      ];
      if (requiredProvider.some(field => !field)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error verificando completitud del perfil:', error);
    return false;
  }
}

/**
 * Obtiene los campos faltantes del perfil
 * @returns Lista de campos faltantes
 */
export async function getMissingProfileFields(): Promise<string[]> {
  try {
    const attributes = await getUserProfile();
    const userType = attributes['custom:user_type'];
    const missingFields: string[] = [];
    
    if (!userType) {
      missingFields.push('Tipo de usuario');
      return missingFields;
    }
    
    // Verificar campos comunes
    if (!attributes.phone_number) missingFields.push('Número de teléfono');
    if (!attributes.birthdate) missingFields.push('Fecha de nacimiento');
    if (!attributes.preferred_username) missingFields.push('Nombre de usuario');
    if (!attributes['custom:details']) missingFields.push('Descripción del perfil');
    if (!attributes['custom:profilePhotoPath']) missingFields.push('Foto de perfil');
    
    // Verificar campos específicos según el tipo
    if (userType === 'influencer') {
      if (!attributes['custom:uniq_influencer_ID']) missingFields.push('ID de influencer');
      if (!attributes['custom:social_media_plfms']) missingFields.push('Redes sociales');
    }
    
    if (userType === 'provider') {
      // Verificar company_profile parseando el JSON si es necesario
      const companyProfile = attributes['custom:company_profile'];
      if (!companyProfile) {
        missingFields.push('Perfil de empresa');
      } else {
        try {
          const parsed = JSON.parse(companyProfile);
          if (!parsed.description || parsed.description.trim() === '') {
            missingFields.push('Descripción de empresa');
          }
        } catch {
          // Si no es JSON válido, verificar si es un string no vacío
          if (companyProfile.trim() === '') {
            missingFields.push('Perfil de empresa');
          }
        }
      }
      if (!attributes['custom:days_of_service']) missingFields.push('Horarios de servicio');
      if (!attributes.locale) missingFields.push('País');
      if (!attributes['custom:contact_information']) missingFields.push('Información de contacto');
      if (!attributes['custom:emgcy_details']) missingFields.push('Contacto de emergencia');
      if (!attributes['custom:proofOfTaxStatusPath']) missingFields.push('Constancia de Situación Fiscal (SAT)');
      if (!attributes['custom:secturPath']) missingFields.push('Registro Nacional de Turismo (SECTUR)');
      if (!attributes['custom:complianceOpinPath']) missingFields.push('Opinión de Cumplimiento (32-D)');
    }
    
    return missingFields;
  } catch (error) {
    console.error('Error obteniendo campos faltantes:', error);
    return [];
  }
}

/**
 * Valida y limpia los datos del formulario antes de enviar
 * @param userType - Tipo de usuario
 * @param formData - Datos del formulario
 * @returns Datos validados y limpios
 */
export function validateProfileData(
  userType: 'traveler' | 'influencer' | 'provider',
  formData: ProfileFormData
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Validar campos comunes obligatorios
  if (!formData.phone_number) {
    errors.phone_number = 'El número de teléfono es obligatorio';
  } else if (!/^\+?[\d\s()-]+$/.test(formData.phone_number)) {
    errors.phone_number = 'Formato de teléfono inválido';
  }
  
  if (!formData.birthdate) {
    errors.birthdate = 'La fecha de nacimiento es obligatoria';
  }
  
  if (!formData.preferred_username) {
    errors.preferred_username = 'El nombre de usuario es obligatorio';
  } else if (formData.preferred_username.length < 3) {
    errors.preferred_username = 'El nombre de usuario debe tener al menos 3 caracteres';
  }
  
  if (!formData.details) {
    errors.details = 'La descripción del perfil es obligatoria';
  }
  
  // Validar campos específicos de influencer
  if (userType === 'influencer') {
    if (!formData.uniq_influencer_ID) {
      errors.uniq_influencer_ID = 'El ID de influencer es obligatorio';
    }
    
    if (!formData.social_media_plfms || formData.social_media_plfms.length === 0) {
      errors.social_media_plfms = 'Debes agregar al menos una red social';
    }
  }
  
  // Validar campos específicos de provider
  if (userType === 'provider') {
    if (!formData.company_profile) {
      errors.company_profile = 'El perfil de empresa es obligatorio';
    }
    
    if (!formData.days_of_service || formData.days_of_service.length === 0) {
      errors.days_of_service = 'Los horarios de servicio son obligatorios';
    }
    
    if (!formData.locale) {
      errors.locale = 'El país es obligatorio';
    }
    
    if (!formData.contact_information?.contact_name) {
      errors.contact_name = 'El nombre de contacto es obligatorio';
    }
    
    if (!formData.contact_information?.contact_phone) {
      errors.contact_phone = 'El teléfono de contacto es obligatorio';
    }
    
    if (!formData.contact_information?.contact_email) {
      errors.contact_email = 'El email de contacto es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_information.contact_email)) {
      errors.contact_email = 'Email inválido';
    }
    
    // Validar documentos obligatorios para providers
    if (!formData.proofOfTaxStatusPath) {
      errors.proofOfTaxStatusPath = 'La Constancia de Situación Fiscal (SAT) es obligatoria';
    }
    
    if (!formData.secturPath) {
      errors.secturPath = 'El Registro Nacional de Turismo (SECTUR) es obligatorio';
    }
    
    if (!formData.complianceOpinPath) {
      errors.complianceOpinPath = 'La Opinión de Cumplimiento (32-D) es obligatoria';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
