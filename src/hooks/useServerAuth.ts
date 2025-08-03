'use client';

import { useState, useEffect, useTransition } from 'react';
import { getAuthState, serverSignOut, type AuthState } from '../app/actions/auth';
import { Hub } from 'aws-amplify/utils';

export interface UseServerAuthReturn {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: string | null;
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

/**
 * Hook seguro que usa Server Actions para gestión de autenticación
 * Los tokens NUNCA se exponen al cliente
 */
export function useServerAuth(): UseServerAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    userType: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Función para refrescar estado desde el servidor
  const refreshAuthState = async () => {
    try {
      setIsLoading(true);
      const newAuthState = await getAuthState();
      setAuthState(newAuthState);
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        userType: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out usando Server Action
  const handleSignOut = async () => {
    startTransition(async () => {
      try {
        await serverSignOut();
        // serverSignOut hace redirect automáticamente
      } catch (error) {
        console.error('Error signing out:', error);
      }
    });
  };

  // Escuchar eventos de Amplify para actualizar estado
  useEffect(() => {
    // Verificar estado inicial
    refreshAuthState();

    // Escuchar cambios de autenticación - actualizado para OAuth según docs oficiales
    const hubListener = Hub.listen('auth', ({ payload }) => {
      console.log('🔔 useServerAuth: Auth event received:', payload.event);
      
      switch (payload.event) {
        case 'signInWithRedirect':
          // CRÍTICO: Este evento se dispara cuando OAuth completa exitosamente
          console.log('✅ OAuth authentication completed successfully');
          refreshAuthState();
          break;
          
        case 'signInWithRedirect_failure':
          // Manejar fallo de OAuth
          console.error('❌ OAuth authentication failed:', payload.data);
          setAuthState({
            isAuthenticated: false,
            user: null,
            userType: null
          });
          break;
          
        case 'signedIn':
        case 'autoSignIn':
          console.log('✅ User signed in, refreshing auth state');
          refreshAuthState();
          break;
          
        case 'signedOut':
        case 'signOut':
          console.log('👋 User signed out');
          setAuthState({
            isAuthenticated: false,
            user: null,
            userType: null
          });
          break;
          
        case 'tokenRefresh':
          // Token refresh es manejado server-side, solo actualizamos estado
          console.log('🔄 Token refreshed');
          refreshAuthState();
          break;
          
        case 'tokenRefresh_failure':
          console.warn('❌ Token refresh failed');
          // En caso de fallo, verificar estado actual
          refreshAuthState();
          break;
          
        case 'customOAuthState':
          // Manejar estado personalizado de OAuth si es necesario
          console.log('📋 Custom OAuth state:', payload.data);
          break;
      }
    });

    return () => {
      hubListener();
    };
  }, []);

  return {
    user: authState.user,
    isLoading: isLoading || isPending,
    isAuthenticated: authState.isAuthenticated,
    userType: authState.userType,
    signOut: handleSignOut,
    refreshAuthState,
  };
}