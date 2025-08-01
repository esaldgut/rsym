'use client';

import { useState } from 'react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

interface SessionTimeoutWarningProps {
  className?: string;
  timeoutDuration?: number; // minutos
  warningDuration?: number; // minutos
}

export function SessionTimeoutWarning({ 
  className = '',
  timeoutDuration = 30,
  warningDuration = 5 
}: SessionTimeoutWarningProps) {
  const [isExtending, setIsExtending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  const { 
    remainingTime, 
    isWarning, 
    extendSession, 
    signOutNow,
    resetTimer 
  } = useSessionTimeout({
    timeoutDuration,
    warningDuration,
    onWarning: (minutesLeft) => {
      console.log(`Session warning: ${minutesLeft} minutes remaining`);
      setDismissed(false); // Reset dismissed state when warning triggers
    },
    onTimeout: () => {
      console.log('Session timed out');
    }
  });
  
  const handleExtendSession = async () => {
    setIsExtending(true);
    const success = await extendSession();
    setIsExtending(false);
    
    if (success) {
      setDismissed(true);
    }
  };
  
  const handleStayActive = () => {
    resetTimer();
    setDismissed(true);
  };
  
  const handleSignOutNow = async () => {
    await signOutNow();
  };
  
  const handleDismiss = () => {
    setDismissed(true);
  };
  
  // No mostrar si no está en advertencia o fue dismisseado
  if (!isWarning || dismissed) {
    return null;
  }
  
  const getTimeText = (minutes: number) => {
    if (minutes <= 1) return 'menos de 1 minuto';
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  };
  
  const getUrgencyColor = (minutes: number) => {
    if (minutes <= 1) return 'bg-red-50 border-red-400 text-red-700';
    if (minutes <= 2) return 'bg-orange-50 border-orange-400 text-orange-700';
    return 'bg-yellow-50 border-yellow-400 text-yellow-700';
  };
  
  const urgencyColor = getUrgencyColor(remainingTime);
  
  return (
    <div className={`${urgencyColor} border-l-4 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {remainingTime <= 1 ? 'Su sesión está por expirar' : 'Sesión inactiva'}
          </h3>
          <div className="mt-1">
            <p className="text-sm">
              Su sesión expirará en <strong>{getTimeText(remainingTime)}</strong> por inactividad.
              {remainingTime <= 1 && ' Será desconectado automáticamente.'}
            </p>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleExtendSession}
              disabled={isExtending}
              className="text-sm bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-3 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isExtending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800 inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extendiendo...
                </>
              ) : (
                '🔄 Extender sesión'
              )}
            </button>
            
            <button
              onClick={handleStayActive}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md font-medium transition-colors duration-200 shadow-sm"
            >
              ✓ Mantener activo
            </button>
            
            <button
              onClick={handleSignOutNow}
              className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md font-medium transition-colors duration-200 shadow-sm"
            >
              🚪 Cerrar sesión
            </button>
            
            {remainingTime > 2 && (
              <button
                onClick={handleDismiss}
                className="text-sm hover:underline font-medium transition-colors duration-200"
              >
                Recordar después
              </button>
            )}
          </div>
        </div>
        <div className="ml-auto pl-3">
          {remainingTime > 1 && (
            <button
              onClick={handleDismiss}
              className="hover:opacity-75 transition-opacity duration-200"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}