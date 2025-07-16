'use client';

import { Authenticator, Theme } from '@aws-amplify/ui-react';
import { ReactNode } from 'react';

interface CustomAuthenticatorProps {
  children: ReactNode;
}

export function CustomAuthenticator({ children }: CustomAuthenticatorProps) {
  // Configuración de campos del formulario - solo campos requeridos, sin email duplicado
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
      theme={theme}
      socialProviders={[]}
      signUpAttributes={['given_name', 'family_name', 'email']}
      hideSignUp={false}
      // Removido services para que Amplify maneje automáticamente el signup
    >
      {children}
    </Authenticator>
  );
}
