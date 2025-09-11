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
 * Obtiene el usuario autenticado y sus atributos incluye userType
 * Para usar en Server Components
 */
export async function getAuthenticatedUser() {
  return await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        const user = await getCurrentUser(contextSpec);
        const attributes = await fetchUserAttributes(contextSpec);
        const session = await fetchAuthSession(contextSpec);
        
        // Extraer userType del atributo personalizado
        const userType = (attributes['custom:user_type'] as 'provider' | 'consumer') || null;
        
        // Extraer estado de aprobación del provider
        const providerIsApproved = attributes['custom:provider_is_approved'] === 'true' || 
                                   attributes['custom:provider_is_approved'] === true;
        
        // Obtener grupos de Cognito del ID token
        const idToken = session.tokens?.idToken;
        const cognitoGroups = (idToken?.payload?.['cognito:groups'] as string[]) || [];
        
        // Obtener sub del ID token (más confiable)
        const idTokenSub = session.tokens?.idToken?.payload?.sub as string;
        
        return { 
          user, 
          attributes, 
          userType,
          userId: user.userId,
          username: user.username,
          sub: idTokenSub || attributes.sub || user.userId, // Prioridad: token -> attributes -> userId
          // Información específica de providers
          isProviderApproved: userType === 'provider' ? providerIsApproved : null,
          cognitoGroups,
          isFullyApprovedProvider: userType === 'provider' && 
                                   providerIsApproved && 
                                   cognitoGroups.includes('providers')
        };
      } catch (error) {
        console.error('Error getting authenticated user:', error);
        return null;
      }
    }
  });
}

/**
 * Valida si un usuario es un provider completamente aprobado
 * Requiere: tipo provider, aprobación del equipo, y membresía en grupo
 */
export async function validateProviderAccess(): Promise<{
  isValid: boolean;
  isApproved: boolean;
  inProvidersGroup: boolean;
  errors: string[];
}> {
  const session = await getServerSession();
  const idToken = session?.tokens?.idToken;
  
  if (!idToken) {
    return {
      isValid: false,
      isApproved: false,
      inProvidersGroup: false,
      errors: ['No authenticated']
    };
  }

  const payload = idToken.payload;
  const result = {
    isValid: false,
    isApproved: false,
    inProvidersGroup: false,
    errors: [] as string[]
  };

  // 1. Verificar que sea tipo provider
  if (payload['custom:user_type'] !== 'provider') {
    result.errors.push('Usuario no es tipo provider');
    return result;
  }

  // 2. Verificar aprobación del equipo YAAN
  const providerApproved = payload['custom:provider_is_approved'];
  if (providerApproved === 'true' || providerApproved === true) {
    result.isApproved = true;
  } else {
    result.errors.push('Provider pendiente de aprobación por el equipo YAAN');
  }

  // 3. Verificar membresía en grupo 'providers' de Cognito
  const cognitoGroups = (payload['cognito:groups'] as string[]) || [];
  if (cognitoGroups.includes('providers')) {
    result.inProvidersGroup = true;
  } else {
    result.errors.push('Provider no asignado al grupo providers en Cognito');
  }

  // El acceso es válido solo si ambas condiciones se cumplen
  result.isValid = result.isApproved && result.inProvidersGroup;

  return result;
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