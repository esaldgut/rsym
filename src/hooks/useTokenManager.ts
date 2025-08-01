'use client';

import { useState, useEffect, useCallback } from 'react';
import { Hub } from 'aws-amplify/utils';
import { tokenManager, TokenInfo } from '../lib/token-manager';

export interface UseTokenManagerReturn {
  tokenInfo: TokenInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshTokens: () => Promise<boolean>;
  checkTokenStatus: () => Promise<void>;
  timeUntilExpiryFormatted: string;
}

/**
 * Hook para gestionar tokens y su estado
 */
export function useTokenManager(): UseTokenManagerReturn {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Revisar estado de tokens
  const checkTokenStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const info = await tokenManager.getTokenInfo();
      setTokenInfo(info);
    } catch (err) {
      console.error('Error checking token status:', err);
      setError('Error al verificar el estado de los tokens');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Refrescar tokens manualmente
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const success = await tokenManager.refreshTokensIfNeeded();
      if (success) {
        await checkTokenStatus();
      }
      return success;
    } catch (err) {
      console.error('Error refreshing tokens:', err);
      setError('Error al actualizar los tokens');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkTokenStatus]);
  
  // Escuchar eventos de autenticación
  useEffect(() => {
    // Revisar estado inicial
    checkTokenStatus();
    
    // Configurar listeners
    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'tokenRefresh':
        case 'signIn':
        case 'autoSignIn':
          checkTokenStatus();
          break;
          
        case 'tokenRefresh_failure':
          setError('Fallo al actualizar los tokens');
          break;
          
        case 'tokenExpiry_warning':
          console.log('Token expiry warning:', payload.data);
          checkTokenStatus();
          break;
          
        case 'signOut':
          setTokenInfo(null);
          setError(null);
          break;
      }
    });
    
    // Actualizar cada 30 segundos
    const interval = setInterval(checkTokenStatus, 30000);
    
    return () => {
      hubListener();
      clearInterval(interval);
    };
  }, [checkTokenStatus]);
  
  // Formatear tiempo hasta expiración
  const timeUntilExpiryFormatted = tokenInfo
    ? tokenManager.getTimeUntilExpiryFormatted(tokenInfo.timeUntilExpiry)
    : 'Desconocido';
  
  return {
    tokenInfo,
    isLoading,
    error,
    refreshTokens,
    checkTokenStatus,
    timeUntilExpiryFormatted
  };
}