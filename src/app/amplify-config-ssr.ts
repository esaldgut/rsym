import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import outputs from '../../amplify/outputs.json';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs
});

// Configuración extendida para el cliente con cookieStorage
export const amplifyConfig = {
  ...outputs,
  ssr: true,
  Auth: {
    ...outputs.auth,
    cookieStorage: {
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 'localhost',
      path: '/',
      expires: 7, // días
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production'
    }
  }
};