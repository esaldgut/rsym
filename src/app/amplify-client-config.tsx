'use client';

import { Amplify } from 'aws-amplify';
import { amplifyConfig } from './amplify-config-ssr';
import { cleanupInsecureTokens, AmplifyHttpOnlyCookieAdapter } from '../lib/amplify-cookie-adapter';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

// CRÍTICO: Limpieza de tokens inseguros al iniciar
if (typeof window !== 'undefined') {
  cleanupInsecureTokens();
}

// CRÍTICO: Configurar el adaptador de cookies HTTP-Only
const cookieAdapter = new AmplifyHttpOnlyCookieAdapter({
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 'localhost',
  path: '/',
  expires: 7,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
});

// CRÍTICO: Configurar el token provider para usar cookies HTTP-Only
cognitoUserPoolsTokenProvider.setKeyValueStorage(cookieAdapter);

// Configurar Amplify con SSR y cookies HTTP-only
Amplify.configure(amplifyConfig, { ssr: true });

// Limpieza periódica de tokens (por si acaso)
if (typeof window !== 'undefined') {
  setInterval(() => {
    cleanupInsecureTokens();
  }, 60000); // Cada minuto
}

export function ConfigureAmplifyClientSide() {
  return null;
}
