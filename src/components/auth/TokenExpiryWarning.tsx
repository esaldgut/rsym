'use client';

import { useState, useEffect } from 'react';
import { useTokenManager } from '../../hooks/useTokenManager';

interface TokenExpiryWarningProps {
  className?: string;
}

export function TokenExpiryWarning({ className = '' }: TokenExpiryWarningProps) {
  const { tokenInfo, refreshTokens, timeUntilExpiryFormatted } = useTokenManager();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  // Reset dismissed state when token changes
  useEffect(() => {
    setDismissed(false);
  }, [tokenInfo?.expiresAt]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const success = await refreshTokens();
    setIsRefreshing(false);
    
    if (success) {
      setDismissed(true);
    }
  };
  
  const handleDismiss = () => {
    setDismissed(true);
  };
  
  // No mostrar si no hay token info, no está por expirar, está expirado, o fue dismisseado
  if (!tokenInfo || !tokenInfo.isExpiringSoon || tokenInfo.isExpired || dismissed) {
    return null;
  }
  
  return (
    <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            <strong>Tu sesión expirará pronto.</strong>
            {' '}Tiempo restante: <strong>{timeUntilExpiryFormatted}</strong>
          </p>
          <div className="mt-2 flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-800 inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Actualizando...
                </>
              ) : (
                'Extender sesión'
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="text-sm text-yellow-700 hover:text-yellow-800 font-medium transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={handleDismiss}
            className="text-yellow-400 hover:text-yellow-600 transition-colors duration-200"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}