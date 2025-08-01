import { NextRequest } from 'next/server';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from './amplify-server-utils';
import { UserType } from '../hooks/useAuth';

/**
 * Tipos para la autenticación del servidor
 */
export interface ServerAuthUser {
  sub: string;
  email: string;
  emailVerified: boolean;
  userType: UserType;
  givenName?: string;
  familyName?: string;
  isProvider: boolean;
  isConsumer: boolean;
}

export interface ServerAuthResult {
  authenticated: boolean;
  user: ServerAuthUser | null;
  error?: string;
  reason?: 'no_tokens' | 'email_not_verified' | 'token_expired' | 'session_error';
}

/**
 * Valida la autenticación en el servidor usando el contexto de Next.js
 */
export async function validateServerAuth(
  request: NextRequest,
  options: {
    requireEmailVerified?: boolean;
    requiredUserType?: UserType;
  } = {}
): Promise<ServerAuthResult> {
  const { requireEmailVerified = true, requiredUserType } = options;
  
  try {
    const authResult = await runWithAmplifyServerContext({
      nextServerContext: { request },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec);
          
          // Verificar que los tokens existan
          if (!session.tokens?.accessToken || !session.tokens?.idToken) {
            return { authenticated: false, user: null, reason: 'no_tokens' };
          }
          
          const idToken = session.tokens.idToken;
          const payload = idToken.payload;
          
          // Extraer información del usuario
          const userType = (payload['custom:user_type'] as UserType) || 'consumer';
          const emailVerified = payload.email_verified as boolean;
          const sub = payload.sub as string;
          const email = payload.email as string;
          const givenName = payload.given_name as string;
          const familyName = payload.family_name as string;
          
          // Validar email verificado si es requerido
          if (requireEmailVerified && !emailVerified) {
            return { 
              authenticated: false, 
              user: null, 
              reason: 'email_not_verified',
              error: 'Email verification required'
            };
          }
          
          // Validar tipo de usuario si es requerido
          if (requiredUserType && userType !== requiredUserType) {
            return { 
              authenticated: false, 
              user: null, 
              error: `User type '${requiredUserType}' required, got '${userType}'`
            };
          }
          
          // Verificar expiración del token
          const now = Math.floor(Date.now() / 1000);
          const tokenExp = payload.exp as number;
          
          if (tokenExp && tokenExp < now) {
            return { 
              authenticated: false, 
              user: null, 
              reason: 'token_expired',
              error: 'Token has expired'
            };
          }
          
          // Crear objeto de usuario
          const user: ServerAuthUser = {
            sub,
            email,
            emailVerified,
            userType,
            givenName,
            familyName,
            isProvider: userType === 'provider',
            isConsumer: userType === 'consumer',
          };
          
          return { authenticated: true, user };
          
        } catch (error) {
          console.error('Server auth validation error:', error);
          return { 
            authenticated: false, 
            user: null, 
            reason: 'session_error',
            error: 'Authentication session error'
          };
        }
      }
    });
    
    return authResult;
    
  } catch (error) {
    console.error('Server auth critical error:', error);
    return { 
      authenticated: false, 
      user: null, 
      error: 'Critical authentication error'
    };
  }
}

/**
 * Valida si el usuario es un proveedor autenticado
 */
export async function validateProviderAuth(request: NextRequest): Promise<ServerAuthResult> {
  return validateServerAuth(request, {
    requireEmailVerified: true,
    requiredUserType: 'provider'
  });
}

/**
 * Obtiene información del usuario autenticado para Server Components
 */
export async function getServerAuthUser(request: NextRequest): Promise<ServerAuthUser | null> {
  const result = await validateServerAuth(request);
  return result.authenticated ? result.user : null;
}

/**
 * Middleware helper para rutas que requieren autenticación específica
 */
export function createAuthMiddleware(options: {
  requiredUserType?: UserType;
  requireEmailVerified?: boolean;
  redirectTo?: string;
} = {}) {
  const { requiredUserType, requireEmailVerified = true, redirectTo = '/auth' } = options;
  
  return async (request: NextRequest) => {
    const result = await validateServerAuth(request, {
      requiredUserType,
      requireEmailVerified
    });
    
    if (!result.authenticated) {
      const url = new URL(redirectTo, request.url);
      
      // Agregar información del error
      if (result.reason) {
        url.searchParams.set('error', result.reason);
      }
      
      // Agregar redirect URL
      if (request.nextUrl.pathname !== redirectTo) {
        url.searchParams.set('redirect', request.nextUrl.pathname);
      }
      
      return { authenticated: false, redirectUrl: url.toString() };
    }
    
    return { authenticated: true, user: result.user };
  };
}

/**
 * Constantes de seguridad
 */
export const AUTH_ERRORS = {
  NO_TOKENS: 'no_tokens',
  EMAIL_NOT_VERIFIED: 'email_not_verified',
  TOKEN_EXPIRED: 'token_expired',
  SESSION_ERROR: 'session_error',
  INSUFFICIENT_PERMISSIONS: 'insufficient_permissions'
} as const;

export const PROTECTED_ROUTES = {
  DASHBOARD: '/dashboard',
  PROVIDER: '/provider',
  CIRCUIT: '/circuit',
  PACKAGE: '/package',
  API_PROTECTED: '/api/protected'
} as const;