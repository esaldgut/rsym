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
        // CRÍTICO: 'none' necesario para OAuth cross-origin con Cognito
        sameSite: process.env.NEXT_PUBLIC_CROSS_ORIGIN === 'true'
          ? 'none' as const
          : 'lax' as const,
        // CRÍTICO: secure=true requerido cuando sameSite='none'
        secure: process.env.NODE_ENV === 'production' ||
                process.env.NEXT_PUBLIC_FORCE_SECURE === 'true',
        httpOnly: true // CRÍTICO: Forzar HTTP-Only
      }
    }
  }
};