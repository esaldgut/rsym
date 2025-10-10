'use client';

import { Authenticator, Theme } from '@aws-amplify/ui-react';
import { ReactNode } from 'react';
import { amplifyFormFields, customAuthServices } from '../../amplify-ui-config';

interface CustomAuthenticatorProps {
  children: ReactNode;
}

export function CustomAuthenticator({ children }: CustomAuthenticatorProps) {
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

  // Usar los servicios personalizados del archivo de configuración
  const services = customAuthServices;

  return (
    <Authenticator
      formFields={amplifyFormFields}
      theme={theme}
      socialProviders={['google', 'apple', 'facebook']}
      signUpAttributes={['given_name', 'family_name', 'email']}
      hideSignUp={false}
      services={services}
    >
      {children}
    </Authenticator>
  );
}
