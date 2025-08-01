'use client';

import { useTokenManager } from '../../hooks/useTokenManager';

interface TokenDebugInfoProps {
  className?: string;
}

export function TokenDebugInfo({ className = '' }: TokenDebugInfoProps) {
  const { tokenInfo, isLoading, error, refreshTokens, timeUntilExpiryFormatted } = useTokenManager();
  
  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <h3 className="text-sm font-medium text-gray-700 mb-2">🔧 Token Debug Info</h3>
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <h3 className="text-sm font-medium text-red-700 mb-2">🔧 Token Debug Info</h3>
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    );
  }
  
  if (!tokenInfo) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <h3 className="text-sm font-medium text-gray-700 mb-2">🔧 Token Debug Info</h3>
        <p className="text-sm text-gray-600">No token information available</p>
      </div>
    );
  }
  
  const getTokenStatus = () => {
    if (tokenInfo.isExpired) return { text: 'Expirado', color: 'text-red-600 bg-red-100' };
    if (tokenInfo.isExpiringSoon) return { text: 'Por expirar', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'Válido', color: 'text-green-600 bg-green-100' };
  };
  
  const status = getTokenStatus();
  
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">🔧 Token Debug Info</h3>
        <button
          onClick={refreshTokens}
          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors duration-200"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Estado del token */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Estado:</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
            {status.text}
          </span>
        </div>
        
        {/* Tiempo hasta expiración */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Expira en:</span>
          <span className="text-sm font-mono text-gray-800">
            {timeUntilExpiryFormatted}
          </span>
        </div>
        
        {/* Fecha de expiración */}
        {tokenInfo.expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Fecha expiración:</span>
            <span className="text-xs font-mono text-gray-700">
              {tokenInfo.expiresAt.toLocaleString()}
            </span>
          </div>
        )}
        
        {/* Presencia de tokens */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto ${
              tokenInfo.accessToken ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <div className="text-gray-600 mt-1">Access</div>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto ${
              tokenInfo.idToken ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <div className="text-gray-600 mt-1">ID</div>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto ${
              tokenInfo.refreshToken ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <div className="text-gray-600 mt-1">Refresh</div>
          </div>
        </div>
        
        {/* Claims del ID token (seleccionados) */}
        {tokenInfo.idToken?.payload && (
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="text-xs text-gray-600 mb-1">ID Token Claims:</div>
            <div className="text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">sub:</span>
                <span className="text-gray-700 truncate ml-2 max-w-24">
                  {tokenInfo.idToken.payload.sub as string}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">email:</span>
                <span className="text-gray-700 truncate ml-2">
                  {tokenInfo.idToken.payload.email as string}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">user_type:</span>
                <span className="text-gray-700">
                  {tokenInfo.idToken.payload['custom:user_type'] as string || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">email_verified:</span>
                <span className="text-gray-700">
                  {tokenInfo.idToken.payload.email_verified ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}