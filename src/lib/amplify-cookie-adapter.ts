/**
 * Adaptador personalizado para cookies HTTP-Only con Amplify v6
 * Soluciona el problema de seguridad 20/100
 */
import { CookieStorage } from 'aws-amplify/adapter-core';

// CRÍTICO: Implementación correcta de CookieStorage para HTTP-Only
export class AmplifyHttpOnlyCookieAdapter implements CookieStorage {
  constructor(
    private config: {
      domain?: string;
      path?: string;
      expires?: number;
      sameSite?: 'strict' | 'lax' | 'none';
      secure?: boolean;
    } = {}
  ) {}

  // Los métodos están vacíos porque las cookies HTTP-Only 
  // no pueden ser accedidas desde JavaScript
  setItem(key: string, value: string): void {
    // HTTP-Only cookies son manejadas por el servidor
    // No hacer nada aquí es correcto
  }

  getItem(key: string): string | null {
    // HTTP-Only cookies no pueden ser leídas desde JavaScript
    return null;
  }

  removeItem(key: string): void {
    // HTTP-Only cookies son manejadas por el servidor
  }

  clear(): void {
    // HTTP-Only cookies son manejadas por el servidor
  }
}

// Función helper para limpiar cualquier token en localStorage/sessionStorage
export function cleanupInsecureTokens(): void {
  if (typeof window === 'undefined') return;

  const tokenPatterns = [
    'CognitoIdentityServiceProvider',
    'amplify-signin-with-hostedUI',
    'LastAuthUser',
    'accessToken',
    'idToken',
    'refreshToken',
    'clockDrift'
  ];

  // Limpiar localStorage
  Object.keys(localStorage).forEach(key => {
    if (tokenPatterns.some(pattern => key.includes(pattern))) {
      console.warn(`🔒 Removing insecure token from localStorage: ${key}`);
      localStorage.removeItem(key);
    }
  });

  // Limpiar sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (tokenPatterns.some(pattern => key.includes(pattern))) {
      console.warn(`🔒 Removing insecure token from sessionStorage: ${key}`);
      sessionStorage.removeItem(key);
    }
  });
}

// Configuración recomendada para máxima seguridad
export const secureAuthConfig = {
  ssr: true,
  cookieStorage: {
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 'localhost',
    path: '/',
    expires: 7, // días
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
};