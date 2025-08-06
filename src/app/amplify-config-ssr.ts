import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { ResourcesConfig } from 'aws-amplify';
import outputs from '../../amplify/outputs.json';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs
});

// CRÍTICO: Configuración completa para cookies HTTP-Only
// Esta configuración DEBE incluir el tokenProvider para funcionar correctamente
export const amplifyConfig: ResourcesConfig = {
  ...outputs,
  Auth: {
    ...outputs.auth,
    Cognito: {
      ...outputs.auth,
      // CRÍTICO: Habilitar cookie storage para tokens
      tokenProvider: {
        setItem: () => {},
        getItem: () => null,
        removeItem: () => {},
        clear: () => {}
      },
      cookieStorage: {
        domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 'localhost',
        path: '/',
        expires: 7, // días
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true // CRÍTICO: Forzar HTTP-Only
      }
    }
  }
};