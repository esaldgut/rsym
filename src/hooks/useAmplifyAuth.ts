'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, fetchAuthSession, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export type UserType = 'provider' | 'consumer';

export interface AmplifyAuthUser {
  userId: string;
  username: string;
  email?: string;
  userType: UserType;
  signInDetails: any;
}

export interface UseAmplifyAuthReturn {
  user: AmplifyAuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: UserType | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Hook que usa las APIs nativas de Amplify v6 para gestión completa de autenticación
 * Elimina toda gestión manual de tokens y cookies - Amplify maneja TODO el ciclo
 * Basado en: https://docs.amplify.aws/react/build-a-backend/auth/connect-your-frontend/manage-user-sessions/
 */
export function useAmplifyAuth(): UseAmplifyAuthReturn {
  const [user, setUser] = useState<AmplifyAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      
      // 1. Verificar si hay usuario autenticado usando getCurrentUser
      const currentUser = await getCurrentUser();
      console.log('✅ Usuario encontrado:', currentUser);
      
      // 2. Obtener atributos del usuario (incluye email y custom attributes)
      const userAttributes = await fetchUserAttributes();
      console.log('📋 Atributos del usuario:', userAttributes);
      
      // 3. Obtener sesión (incluye tokens) - Amplify maneja refresh automáticamente
      const session = await fetchAuthSession();
      console.log('🔐 Sesión obtenida - tokens:', !!session.tokens);
      
      // 4. Extraer userType de los claims del ID token
      const userType = (session.tokens?.idToken?.payload['custom:user_type'] as UserType) || 'consumer';
      
      // 5. Construir objeto de usuario
      const amplifyUser: AmplifyAuthUser = {
        userId: currentUser.userId,
        username: currentUser.username,
        email: userAttributes.email,
        userType,
        signInDetails: currentUser.signInDetails
      };
      
      setUser(amplifyUser);
      console.log('✅ Usuario configurado:', amplifyUser);
      
    } catch (error) {
      console.log('ℹ️ Usuario no autenticado:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('👋 Cerrando sesión...');
      await signOut();
      setUser(null);
      console.log('✅ Sesión cerrada');
      // No necesitamos hacer redirect manual - Hub events lo manejarán
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  };

  // Escuchar eventos de autenticación - SOLO para sincronizar estado local
  useEffect(() => {
    // Verificar usuario inicial
    refreshUser();

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log('🔔 useAmplifyAuth: Auth event received:', payload.event);
      
      switch (payload.event) {
        case 'signInWithRedirect':
          console.log('✅ OAuth sign-in completed');
          refreshUser();
          break;
          
        case 'signInWithRedirect_failure':
          console.error('❌ OAuth sign-in failed:', payload.data);
          setUser(null);
          setIsLoading(false);
          break;
          
        case 'signedIn':
          console.log('✅ User signed in');
          refreshUser();
          break;
          
        case 'signedOut':
          console.log('👋 User signed out');
          setUser(null);
          setIsLoading(false);
          break;
          
        case 'tokenRefresh':
          console.log('🔄 Tokens refreshed by Amplify');
          // No necesitamos hacer nada - Amplify ya manejó el refresh
          refreshUser();
          break;
          
        case 'tokenRefresh_failure':
          console.warn('❌ Token refresh failed');
          // Amplify manejará esto automáticamente
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    userType: user?.userType || null,
    signOut: handleSignOut,
    refreshUser,
  };
}