'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useTokenManager } from './useTokenManager';

interface UseSessionTimeoutOptions {
  timeoutDuration?: number; // en minutos
  warningDuration?: number; // minutos antes de timeout para mostrar advertencia
  checkInterval?: number; // milisegundos entre verificaciones
  onTimeout?: () => void;
  onWarning?: (minutesLeft: number) => void;
  autoSignOut?: boolean; // cerrar sesión automáticamente al timeout
}

interface UseSessionTimeoutReturn {
  remainingTime: number; // minutos restantes
  isWarning: boolean;
  isIdle: boolean;
  resetTimer: () => void;
  extendSession: () => Promise<boolean>;
  signOutNow: () => Promise<void>;
}

/**
 * Hook para manejar timeout de sesión por inactividad
 */
export function useSessionTimeout(options: UseSessionTimeoutOptions = {}): UseSessionTimeoutReturn {
  const {
    timeoutDuration = 30, // 30 minutos por defecto
    warningDuration = 5, // 5 minutos de advertencia
    checkInterval = 30000, // revisar cada 30 segundos
    onTimeout,
    onWarning,
    autoSignOut = true
  } = options;
  
  const router = useRouter();
  const { refreshTokens, tokenInfo } = useTokenManager();
  
  const [remainingTime, setRemainingTime] = useState(timeoutDuration);
  const [isWarning, setIsWarning] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef<boolean>(false);
  
  // Actualizar tiempo de última actividad
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsIdle(false);
    setIsWarning(false);
    warningShownRef.current = false;
  }, []);
  
  // Resetear timer de inactividad
  const resetTimer = useCallback(() => {
    updateLastActivity();
    setRemainingTime(timeoutDuration);
  }, [timeoutDuration, updateLastActivity]);
  
  // Extender sesión refrescando tokens
  const extendSession = useCallback(async (): Promise<boolean> => {
    try {
      const success = await refreshTokens();
      if (success) {
        resetTimer();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  }, [refreshTokens, resetTimer]);
  
  // Cerrar sesión inmediatamente
  const signOutNow = useCallback(async () => {
    try {
      await signOut();
      router.push('/auth?reason=session_timeout');
    } catch (error) {
      console.error('Error signing out:', error);
      // Forzar redirección aún si hay error
      router.push('/auth?reason=session_timeout');
    }
  }, [router]);
  
  // Verificar inactividad
  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const remainingMs = (timeoutDuration * 60 * 1000) - timeSinceLastActivity;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    
    setRemainingTime(Math.max(0, remainingMinutes));
    
    // Verificar si está en período de advertencia
    const isInWarningPeriod = remainingMinutes <= warningDuration && remainingMinutes > 0;
    setIsWarning(isInWarningPeriod);
    
    // Llamar callback de advertencia solo una vez
    if (isInWarningPeriod && !warningShownRef.current) {
      warningShownRef.current = true;
      onWarning?.(remainingMinutes);
    }
    
    // Verificar timeout
    if (remainingMinutes <= 0) {
      setIsIdle(true);
      onTimeout?.();
      
      if (autoSignOut) {
        signOutNow();
      }
    }
  }, [timeoutDuration, warningDuration, onTimeout, onWarning, autoSignOut, signOutNow]);
  
  // Configurar listeners de actividad
  useEffect(() => {
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];
    
    const handleActivity = () => {
      updateLastActivity();
    };
    
    // Agregar listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    
    // Listener para cambios de visibilidad
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateLastActivity();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      // Limpiar listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateLastActivity]);
  
  // Configurar timer de verificación
  useEffect(() => {
    // Limpiar timer anterior
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Inicializar
    resetTimer();
    
    // Configurar nuevo timer
    timerRef.current = setInterval(checkInactivity, checkInterval);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [checkInterval, checkInactivity, resetTimer]);
  
  // Resetear cuando el token cambie (nuevo login)
  useEffect(() => {
    if (tokenInfo?.accessToken) {
      resetTimer();
    }
  }, [tokenInfo?.accessToken, resetTimer]);
  
  // Parar timer cuando no hay token
  useEffect(() => {
    if (!tokenInfo?.accessToken && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [tokenInfo?.accessToken]);
  
  return {
    remainingTime,
    isWarning,
    isIdle,
    resetTimer,
    extendSession,
    signOutNow
  };
}