'use client';

import { Authenticator, Theme } from '@aws-amplify/ui-react';
import { ReactNode } from 'react';

interface CustomAuthenticatorProps {
  children: ReactNode;
}

export function CustomAuthenticator({ children }: CustomAuthenticatorProps) {
  // Configuración de campos del formulario con todos los atributos requeridos
  const formFields = {
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

  // Servicios sociales (deshabilitados por ahora)
  const services = {
    async handleSignUp(formData: Record<string, any>) {
      let { username, password, attributes } = formData;
      // username es típicamente el email en este setup
      username = attributes.email;
      
      // Asegurar que given_name y family_name estén en attributes
      attributes = {
        ...attributes,
        given_name: formData.given_name || attributes.given_name,
        family_name: formData.family_name || attributes.family_name,
      };

      return { username, password, attributes };
    },
  };

  // Tema personalizado para YAAN
  const theme: Theme = {
    name: 'yaan-theme',
    tokens: {
      components: {
        authenticator: {
          router: {
            borderWidth: '0px',
            backgroundColor: 'transparent',
          },
          form: {
            padding: '2rem',
          },
        },
        button: {
          primary: {
            backgroundColor: '#3B82F6',
            _hover: {
              backgroundColor: '#2563EB',
            },
          },
        },
        fieldcontrol: {
          _focus: {
            borderColor: '#3B82F6',
          },
        },
        tabs: {
          item: {
            _active: {
              borderColor: '#3B82F6',
              color: '#3B82F6',
            },
          },
        },
      },
    },
  };

  return (
    <Authenticator
      formFields={formFields}
      services={services}
      theme={theme}
      socialProviders={[]}
      signUpAttributes={['given_name', 'family_name', 'email']}
    >
      {children}
    </Authenticator>
  );
}
