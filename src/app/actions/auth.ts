'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { runWithAmplifyServerContext } from '../../lib/amplify-server-utils';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth/server';

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  userType: string | null;
}

/**
 * Server Action para obtener el estado de autenticación de forma segura
 * Los tokens se manejan server-side, nunca se exponen al cliente
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    const cookieStore = cookies();
    
    const authResult = await runWithAmplifyServerContext({
      nextServerContext: { cookies: cookieStore },
      operation: async (contextSpec) => {
        try {
          // Verificar sesión server-side
          const session = await fetchAuthSession(contextSpec, {
            forceRefresh: false // No forzar refresh desde server por seguridad
          });
          
          if (!session.tokens?.accessToken || !session.tokens?.idToken) {
            return { isAuthenticated: false, user: null, userType: null };
          }
          
          // Obtener usuario actual server-side
          const user = await getCurrentUser(contextSpec);
          
          // Extraer userType del ID token de forma segura
          const idToken = session.tokens.idToken;
          const userType = idToken.payload['custom:user_type'] as string || 'consumer';
          
          return {
            isAuthenticated: true,
            user: {
              userId: user.userId,
              username: user.username,
              // NO exponer tokens al cliente
            },
            userType
          };
          
        } catch (error) {
          console.error('Server-side auth check failed:', error);
          return { isAuthenticated: false, user: null, userType: null };
        }
      }
    });
    
    return authResult;
    
  } catch (error) {
    console.error('Auth state check failed:', error);
    return { isAuthenticated: false, user: null, userType: null };
  }
}

/**
 * Server Action para logout seguro
 * Limpia cookies del servidor
 */
export async function serverSignOut(): Promise<void> {
  try {
    const cookieStore = cookies();
    
    await runWithAmplifyServerContext({
      nextServerContext: { cookies: cookieStore },
      operation: async (contextSpec) => {
        // Amplify maneja la limpieza de cookies server-side automáticamente
        // Al usar el contexto del servidor
      }
    });
    
    // Limpiar cualquier cookie adicional si fuera necesario
    const cookieNames = [
      'CognitoIdentityServiceProvider',
      'amplify-signin-with-hostedUI'
    ];
    
    cookieNames.forEach(name => {
      cookieStore.set(name, '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    });
    
  } catch (error) {
    console.error('Server sign out error:', error);
  }
  
  redirect('/auth');
}

/**
 * Server Action para verificar autorización por rol
 */
export async function checkAuthorization(requiredRole?: string): Promise<boolean> {
  const authState = await getAuthState();
  
  if (!authState.isAuthenticated) {
    return false;
  }
  
  if (requiredRole && authState.userType !== requiredRole) {
    return false;
  }
  
  return true;
}

/**
 * Server Action para middleware de autorización
 */
export async function requireAuth(requiredRole?: string): Promise<void> {
  const isAuthorized = await checkAuthorization(requiredRole);
  
  if (!isAuthorized) {
    redirect('/auth');
  }
}