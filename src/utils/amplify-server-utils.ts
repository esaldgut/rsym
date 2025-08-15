import { cookies } from 'next/headers';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { 
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser 
} from 'aws-amplify/auth/server';
import type { JWT } from 'aws-amplify/auth';
import { type Schema } from '@/amplify/data/resource';
import outputs from '../../amplify/outputs.json';

/**
 * Configuración del servidor de Amplify para Next.js
 * Utiliza HTTP-only cookies para almacenamiento seguro de tokens
 */
export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

/**
 * Cliente GraphQL configurado con cookies para server-side
 * Incluye automáticamente el ID token en todas las peticiones
 */
export const cookiesClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
});

/**
 * Obtiene la sesión de autenticación desde el servidor
 * Utiliza cookies HTTP-only para máxima seguridad
 * @param forceRefresh - Fuerza la actualización de tokens si están próximos a expirar
 */
export async function getServerSession(forceRefresh = false) {
  return await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec, { forceRefresh });
        return session;
      } catch (error) {
        console.error('Failed to get server session:', error);
        return null;
      }
    }
  });
}

/**
 * Obtiene el usuario autenticado y sus atributos
 * Para usar en Server Components
 */
export async function getAuthenticatedUser() {
  return await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        const user = await getCurrentUser(contextSpec);
        const attributes = await fetchUserAttributes(contextSpec);
        return { user, attributes };
      } catch {
        return null;
      }
    }
  });
}

/**
 * Verifica si el usuario tiene un token válido
 * Útil para protección de rutas en middleware
 */
export async function hasValidSession(): Promise<boolean> {
  const session = await getServerSession();
  return !!(session?.tokens?.idToken);
}

/**
 * Obtiene claims del ID token de forma segura
 * Los tokens no son expuestos al cliente
 */
export async function getIdTokenClaims() {
  const session = await getServerSession();
  const idToken = session?.tokens?.idToken as JWT | undefined;
  
  if (!idToken) {
    return null;
  }
  
  return idToken.payload;
}

/**
 * Obtiene el ID Token para usar en peticiones API
 * @returns ID Token string o null si no está disponible
 */
export async function getIdTokenServer(): Promise<string | null> {
  try {
    const session = await getServerSession();
    return session?.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error('Error obteniendo ID token en servidor:', error);
    return null;
  }
}

/**
 * Obtiene el Access Token para usar en peticiones API
 * @returns Access Token string o null si no está disponible
 */
export async function getAccessTokenServer(): Promise<string | null> {
  try {
    const session = await getServerSession();
    return session?.tokens?.accessToken?.toString() || null;
  } catch (error) {
    console.error('Error obteniendo access token en servidor:', error);
    return null;
  }
}

/**
 * Verifica y actualiza tokens si es necesario
 * @returns true si los tokens son válidos o fueron actualizados
 */
export async function ensureValidTokens(): Promise<boolean> {
  try {
    const session = await getServerSession(true); // Fuerza refresh si es necesario
    return !!(session?.tokens?.idToken);
  } catch (error) {
    console.error('Error validando tokens:', error);
    return false;
  }
}