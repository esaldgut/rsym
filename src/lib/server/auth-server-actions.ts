'use server';

import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/utils/amplify-server-utils';
import { fetchAuthSession, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth/server';
import { SecurityValidator } from '@/lib/security-validator';
import type { AmplifyAuthUser, UserType } from '@/hooks/useAmplifyAuth';

/**
 * Server Actions para autenticación
 * Permiten a Client Components acceder a datos de autenticación desde cookies HTTP-Only
 * Patrón: Next.js 15 Server Actions + AWS Amplify Gen 2 Server Context
 */

export interface RefreshUserResult {
  success: boolean;
  user: AmplifyAuthUser | null;
  error?: string;
}

/**
 * Refresca la sesión del usuario server-side y retorna el estado actualizado
 * Usado por Client Components para obtener tokens actualizados desde cookies HTTP-Only
 *
 * @param forceRefresh - Forzar refresh de tokens en Cognito
 * @returns Usuario actualizado o null si no está autenticado
 */
export async function refreshUserSession(forceRefresh = false): Promise<RefreshUserResult> {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        try {
          // 1. Verificar usuario actual
          const currentUser = await getCurrentUser(contextSpec);

          // 2. Obtener sesión con opción de refresh
          const session = await fetchAuthSession(contextSpec, { forceRefresh });

          // 3. Verificar que hay token válido
          if (!session.tokens?.idToken) {
            return {
              success: false,
              user: null,
              error: 'No hay sesión activa'
            };
          }

          // 4. Obtener atributos del usuario
          const userAttributes = await fetchUserAttributes(contextSpec);

          // 5. Validar token con SecurityValidator
          const securityValidation = SecurityValidator.validateIdToken(session.tokens.idToken);

          if (!securityValidation.isValid) {
            return {
              success: false,
              user: null,
              error: securityValidation.errors.join(', ')
            };
          }

          // 6. Construir AmplifyAuthUser
          const amplifyUser: AmplifyAuthUser = {
            userId: securityValidation.userId,
            username: currentUser.username,
            email: userAttributes.email,
            userType: securityValidation.userType,
            signInDetails: {},
            securityValidation
          };

          console.log('[Server] refreshUserSession:', {
            forceRefresh,
            userType: securityValidation.userType,
            timestamp: new Date().toISOString()
          });

          return {
            success: true,
            user: amplifyUser
          };
        } catch (error) {
          console.error('[Server] Error refreshing user session:', error);
          return {
            success: false,
            user: null,
            error: error instanceof Error ? error.message : 'Error al refrescar sesión'
          };
        }
      }
    });

    return result;
  } catch (error) {
    console.error('[Server] Error en refreshUserSession:', error);
    return {
      success: false,
      user: null,
      error: error instanceof Error ? error.message : 'Error del sistema'
    };
  }
}

/**
 * Obtiene el usuario actual server-side
 * Útil para Client Components que necesitan datos del usuario sin estado local
 */
export async function getCurrentUserServer(): Promise<{
  success: boolean;
  userId?: string;
  username?: string;
  email?: string;
  userType?: UserType;
  error?: string;
}> {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        try {
          const currentUser = await getCurrentUser(contextSpec);
          const userAttributes = await fetchUserAttributes(contextSpec);
          const session = await fetchAuthSession(contextSpec);

          if (!session.tokens?.idToken) {
            return { success: false, error: 'No hay sesión activa' };
          }

          const securityValidation = SecurityValidator.validateIdToken(session.tokens.idToken);

          if (!securityValidation.isValid) {
            return { success: false, error: 'Token inválido' };
          }

          return {
            success: true,
            userId: securityValidation.userId,
            username: currentUser.username,
            email: userAttributes.email,
            userType: securityValidation.userType
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al obtener usuario'
          };
        }
      }
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error del sistema'
    };
  }
}

/**
 * Obtiene el Identity ID del usuario actual server-side
 * Necesario para operaciones de Storage con Identity Pool
 */
export async function getIdentityIdServer(): Promise<{
  success: boolean;
  identityId?: string;
  error?: string;
}> {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec);

          if (!session.identityId) {
            return {
              success: false,
              error: 'No hay identity ID disponible'
            };
          }

          return {
            success: true,
            identityId: session.identityId
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al obtener identity ID'
          };
        }
      }
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error del sistema'
    };
  }
}

/**
 * Obtiene los atributos del usuario actual server-side
 * Útil para obtener custom attributes sin exponer tokens
 */
export async function getUserAttributesServer(): Promise<{
  success: boolean;
  attributes?: Record<string, string>;
  error?: string;
}> {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        try {
          const userAttributes = await fetchUserAttributes(contextSpec);

          return {
            success: true,
            attributes: userAttributes as Record<string, string>
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al obtener atributos'
          };
        }
      }
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error del sistema'
    };
  }
}
