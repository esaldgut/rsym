import { signInWithRedirect, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

/**
 * Configuración de OAuth para Apple Sign-In
 * Implementa las mejores prácticas de seguridad para autenticación federada
 */

export type OAuthProvider = 'Apple' | 'Google' | 'Facebook';

/**
 * Inicia el flujo de autenticación con un proveedor OAuth
 * @param provider - Proveedor de OAuth (Apple, Google, Facebook)
 * @param customState - Estado personalizado opcional para mantener contexto
 */
export async function signInWithOAuth(
  provider: OAuthProvider, 
  customState?: string
) {
  try {
    await signInWithRedirect({ 
      provider,
      customState,
      options: {
        // Preferir popup en desktop para mejor UX
        preferPrivateSession: true,
      }
    });
  } catch (error) {
    console.error(`Error iniciando OAuth con ${provider}:`, error);
    throw error;
  }
}

/**
 * Configura listeners para eventos de autenticación OAuth
 */
export function setupOAuthListeners(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const unsubscribe = Hub.listen('auth', ({ payload }) => {
    switch (payload.event) {
      case 'signInWithRedirect':
        // Usuario autenticado exitosamente con OAuth
        console.log('OAuth sign-in exitoso:', payload.data);
        onSuccess?.(payload.data);
        break;
        
      case 'signInWithRedirect_failure':
        // Error en el flujo OAuth
        console.error('OAuth sign-in falló:', payload.error);
        onError?.(payload.error);
        break;
        
      case 'customOAuthState':
        // Estado personalizado recibido
        console.log('Estado OAuth personalizado:', payload.data);
        // Manejar estado personalizado (ej. carrito de compras, página de retorno)
        handleCustomState(payload.data);
        break;
        
      case 'signOut':
        // Usuario cerró sesión
        console.log('Usuario cerró sesión');
        break;
    }
  });
  
  return unsubscribe;
}

/**
 * Maneja el estado personalizado después del OAuth
 * @param state - Estado personalizado pasado durante el redirect
 */
function handleCustomState(state: string) {
  // Ejemplos de manejo de estado:
  // - Restaurar carrito de compras
  // - Redirigir a página específica
  // - Completar acción pendiente
  
  if (state === 'complete-profile') {
    window.location.href = '/settings/profile';
  } else if (state === 'create-moment') {
    window.location.href = '/moments';
  } else if (state === 'reserve-experience') {
    window.location.href = '/marketplace';
  }
}

/**
 * Configuración específica para Apple Sign-In
 */
export const appleSignInConfig = {
  // Scopes requeridos para Apple
  scopes: ['email', 'name'],
  
  // Configuración de respuesta
  responseType: 'code',
  
  // Modo de respuesta
  responseMode: 'query',
  
  // Configuración de seguridad
  nonce: true,
  state: true,
};

/**
 * Verifica si el usuario se autenticó con un proveedor OAuth
 * @param session - Sesión de autenticación
 */
export function isOAuthUser(session: any): boolean {
  return session?.tokens?.idToken?.payload?.identities !== undefined;
}

/**
 * Obtiene el proveedor OAuth usado para autenticación
 * @param session - Sesión de autenticación
 */
export function getOAuthProvider(session: any): string | null {
  const identities = session?.tokens?.idToken?.payload?.identities;
  if (identities && identities.length > 0) {
    return identities[0].providerName;
  }
  return null;
}

/**
 * Cierra sesión y limpia cookies
 */
export async function signOutUser() {
  try {
    await signOut({
      global: true, // Cerrar sesión en todos los dispositivos
    });
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    throw error;
  }
}