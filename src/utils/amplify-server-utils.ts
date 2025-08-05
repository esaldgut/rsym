import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/app/amplify-config-ssr';
import { 
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser 
} from 'aws-amplify/auth/server';
import type { JWT } from 'aws-amplify/auth';

/**
 * Obtiene la sesión de autenticación desde el servidor
 * Utiliza cookies HTTP-only para máxima seguridad
 */
export async function getServerSession() {
  return await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec);
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