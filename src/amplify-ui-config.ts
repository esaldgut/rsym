/**
 * Configuración personalizada para el componente Authenticator de AWS Amplify UI
 * Resuelve el problema de mapeo de atributos entre Amplify UI y Cognito
 */

import { signUp } from 'aws-amplify/auth';

// Mapeo de atributos de Amplify UI a los nombres esperados por Cognito
const attributeMapping: Record<string, string> = {
  'custom:given_name': 'given_name',
  'custom:family_name': 'family_name',
  'name.givenName': 'given_name',
  'name.familyName': 'family_name',
  'name': 'name',
};

/**
 * Transforma los atributos del formato de Amplify UI al formato de Cognito
 */
export function transformAuthAttributes(attributes: Record<string, string>): Record<string, string> {
  const transformed: Record<string, string> = {};
  
  // Copiar todos los atributos existentes
  Object.keys(attributes).forEach(key => {
    const value = attributes[key];
    if (value && value.trim() !== '') {
      // Si existe un mapeo, usar el nombre mapeado
      const mappedKey = attributeMapping[key] || key;
      transformed[mappedKey] = value;
    }
  });
  
  // Asegurar que los atributos requeridos estén presentes
  if (!transformed.given_name && (attributes['custom:given_name'] || attributes['name.givenName'])) {
    transformed.given_name = attributes['custom:given_name'] || attributes['name.givenName'];
  }
  
  if (!transformed.family_name && (attributes['custom:family_name'] || attributes['name.familyName'])) {
    transformed.family_name = attributes['custom:family_name'] || attributes['name.familyName'];
  }
  
  return transformed;
}

/**
 * Servicio personalizado de signup que transforma los atributos antes de enviarlos
 */
export const customAuthServices = {
  async handleSignUp(formData: {
    username: string;
    password: string;
    attributes: Record<string, string>;
  }) {
    const { username, password, attributes } = formData;
    
    console.log('Atributos recibidos del formulario:', attributes);
    
    const transformedAttributes = transformAuthAttributes(attributes);
    
    console.log('Atributos transformados para Cognito:', transformedAttributes);
    
    // Validar que los atributos requeridos estén presentes
    if (!transformedAttributes.email) {
      throw new Error('El correo electrónico es requerido');
    }
    if (!transformedAttributes.given_name) {
      throw new Error('El nombre es requerido');
    }
    if (!transformedAttributes.family_name) {
      throw new Error('El apellido es requerido');
    }
    
    return signUp({
      username,
      password,
      options: {
        userAttributes: transformedAttributes,
      },
    });
  },
};

/**
 * Configuración de campos del formulario para Amplify UI Authenticator
 */
export const amplifyFormFields = {
  signUp: {
    given_name: {
      label: 'Nombre *',
      placeholder: 'Ingresa tu nombre',
      isRequired: true,
      order: 1,
    },
    family_name: {
      label: 'Apellido *',
      placeholder: 'Ingresa tu apellido',
      isRequired: true,
      order: 2,
    },
    email: {
      label: 'Correo electrónico *',
      placeholder: 'ejemplo@correo.com',
      isRequired: true,
      order: 3,
    },
    password: {
      label: 'Contraseña *',
      placeholder: 'Mínimo 8 caracteres',
      isRequired: true,
      order: 4,
    },
    confirm_password: {
      label: 'Confirmar contraseña *',
      placeholder: 'Confirma tu contraseña',
      isRequired: true,
      order: 5,
    },
  },
  signIn: {
    email: {
      label: 'Correo electrónico',
      placeholder: 'ejemplo@correo.com',
    },
    password: {
      label: 'Contraseña',
      placeholder: 'Ingresa tu contraseña',
    },
  },
  forceNewPassword: {
    password: {
      label: 'Nueva contraseña',
      placeholder: 'Ingresa tu nueva contraseña',
    },
  },
  forgotPassword: {
    email: {
      label: 'Correo electrónico',
      placeholder: 'ejemplo@correo.com',
    },
  },
  confirmResetPassword: {
    confirmation_code: {
      label: 'Código de confirmación',
      placeholder: 'Ingresa el código que recibiste',
    },
    confirm_password: {
      label: 'Nueva contraseña',
      placeholder: 'Ingresa tu nueva contraseña',
    },
  },
};