'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, fetchAuthSession, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { logger } from '../utils/logger';
import { SecurityValidator, type SecurityValidationResult } from '../lib/security-validator';
import { refreshUserSession } from '../lib/server/auth-server-actions';

export type UserType = 'provider' | 'influencer' | 'traveler' | 'admin';

export interface AmplifyAuthUser {
  userId: string;
  username: string;
  email?: string;
  userType: UserType;
  signInDetails: Record<string, unknown>;
  securityValidation: SecurityValidationResult;
}

export interface InitialAuthData {
  user: AmplifyAuthUser;
  isAuthenticated: boolean;
}

export interface UseAmplifyAuthReturn {
  user: AmplifyAuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: UserType | null;
  signOut: () => Promise<void>;
  refreshUser: (forceRefresh?: boolean) => Promise<void>;
  hasPermission: (operation: string, resource: string) => boolean;
}

/**
 * Hook que usa las APIs nativas de Amplify v6 para gestión completa de autenticación
 * Elimina toda gestión manual de tokens y cookies - Amplify maneja TODO el ciclo
 * Basado en: https://docs.amplify.aws/react/build-a-backend/auth/connect-your-frontend/manage-user-sessions/
 *
 * @param initialAuth - Datos iniciales de SSR para hidratación sin flash de contenido
 */
export function useAmplifyAuth(initialAuth?: InitialAuthData): UseAmplifyAuthReturn {
  const [user, setUser] = useState<AmplifyAuthUser | null>(initialAuth?.user || null);
  const [isLoading, setIsLoading] = useState(!initialAuth); // No loading si hay datos SSR

  const refreshUser = async (forceRefresh = false) => {
    try {
      setIsLoading(true);

      // Si forceRefresh=true, usar Server Action para acceso a cookies HTTP-Only
      // Esto es CRÍTICO después de actualizar atributos en Cognito (custom:user_type, etc.)
      if (forceRefresh) {
        console.log('🔄 [Client] Force refresh usando Server Action...');

        const result = await refreshUserSession(true);

        if (!result.success || !result.user) {
          logger.error('Server refresh failed', { error: result.error });
          throw new Error(result.error || 'Error al refrescar sesión');
        }

        console.log('✅ [Client] Token refresh FORZADO completado via Server Action:', {
          userType: result.user.userType,
          timestamp: new Date().toISOString()
        });

        setUser(result.user);
        logger.auth('Usuario configurado exitosamente via Server Action', 'refreshUser');
        return;
      }

      // Si forceRefresh=false, usar client-side APIs normalmente (más rápido para refresh automático)
      // 1. Verificar si hay usuario autenticado usando getCurrentUser
      const currentUser = await getCurrentUser();
      logger.auth('Usuario encontrado', 'getCurrentUser');

      // 2. Obtener atributos del usuario (incluye email y custom attributes)
      const userAttributes = await fetchUserAttributes();
      logger.auth('Atributos obtenidos', 'fetchUserAttributes');

      // 3. Obtener sesión (incluye tokens) sin forceRefresh
      const session = await fetchAuthSession({ forceRefresh: false });
      logger.auth('Sesión obtenida', 'fetchAuthSession');

      // 4. Validar ID Token y extraer claims de forma segura
      const securityValidation = SecurityValidator.validateIdToken(session.tokens?.idToken);

      if (!securityValidation.isValid) {
        logger.error('Token validation failed', {
          errors: securityValidation.errors,
          warnings: securityValidation.warnings
        });
        throw new Error(`Token inválido: ${securityValidation.errors.join(', ')}`);
      }

      // 5. Construir objeto de usuario con validaciones de seguridad
      const amplifyUser: AmplifyAuthUser = {
        userId: securityValidation.userId,
        username: currentUser.username,
        email: userAttributes.email,
        userType: securityValidation.userType,
        signInDetails: currentUser.signInDetails,
        securityValidation
      };

      console.log('🔄 RefreshUser - UserType detectado:', securityValidation.userType);
      console.log('🔄 RefreshUser - Atributos custom:', {
        'custom:user_type': userAttributes['custom:user_type'],
        'custom:provider_is_approved': userAttributes['custom:provider_is_approved']
      });

      setUser(amplifyUser);
      logger.auth('Usuario configurado exitosamente', 'refreshUser');

    } catch {
      logger.auth('Usuario no autenticado', 'refreshUser');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      logger.auth('Cerrando sesión...', 'signOut');
      await signOut();
      setUser(null);
      logger.auth('Sesión cerrada exitosamente', 'signOut');
    } catch (error) {
      logger.error('Error al cerrar sesión', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Escuchar eventos de autenticación - SOLO para sincronizar estado local
  useEffect(() => {
    // Verificar usuario inicial
    refreshUser();

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      logger.auth(`Auth event received: ${payload.event}`, 'HubListener');
      
      switch (payload.event) {
        case 'signInWithRedirect':
          logger.auth('OAuth sign-in completed', 'signInWithRedirect');
          refreshUser();
          break;
          
        case 'signInWithRedirect_failure':
          logger.error('OAuth sign-in failed', { event: payload.event });
          setUser(null);
          setIsLoading(false);
          break;
          
        case 'signedIn':
          logger.auth('User signed in', 'signedIn');
          refreshUser();
          break;
          
        case 'signedOut':
          logger.auth('User signed out', 'signedOut');
          setUser(null);
          setIsLoading(false);
          break;
          
        case 'tokenRefresh':
          logger.auth('Tokens refreshed by Amplify', 'tokenRefresh');
          refreshUser();
          break;
          
        case 'tokenRefresh_failure':
          logger.warn('Token refresh failed', { event: payload.event });
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  // Función para validar permisos usando la matriz de permisos
  const hasPermission = (operation: string, resource: string): boolean => {
    if (!user?.userType) return false;
    return SecurityValidator.validateOperation(user.userType, `${operation}:${resource}`);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && user.securityValidation?.isValid,
    userType: user?.userType || null,
    signOut: handleSignOut,
    refreshUser,
    hasPermission,
  };
}