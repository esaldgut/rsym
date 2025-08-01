'use client';

import { ReactNode } from 'react';
import { TokenExpiryWarning } from './TokenExpiryWarning';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { TokenDebugInfo } from './TokenDebugInfo';

interface AuthSecurityWrapperProps {
  children: ReactNode;
  showDebugInfo?: boolean;
  sessionTimeout?: number; // minutos
  sessionWarning?: number; // minutos antes del timeout para mostrar advertencia
  className?: string;
}

/**
 * Wrapper que integra todos los componentes de seguridad de autenticación
 */
export function AuthSecurityWrapper({
  children,
  showDebugInfo = process.env.NODE_ENV === 'development',
  sessionTimeout = 30,
  sessionWarning = 5,
  className = ''
}: AuthSecurityWrapperProps) {
  return (
    <div className={className}>
      {/* Advertencias de seguridad */}
      <div className="space-y-2">
        {/* Advertencia de timeout de sesión por inactividad */}
        <SessionTimeoutWarning 
          timeoutDuration={sessionTimeout}
          warningDuration={sessionWarning}
        />
        
        {/* Advertencia de expiración de tokens */}
        <TokenExpiryWarning />
      </div>
      
      {/* Información de debug para desarrollo */}
      {showDebugInfo && (
        <TokenDebugInfo className="mb-4 mt-2" />
      )}
      
      {/* Contenido principal */}
      {children}
    </div>
  );
}