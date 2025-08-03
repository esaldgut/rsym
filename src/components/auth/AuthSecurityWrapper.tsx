'use client';

import { ReactNode } from 'react';

interface AuthSecurityWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper simplificado de seguridad siguiendo AWS Amplify v6 best practices
 * Amplify maneja automáticamente el refresh de tokens y expiración
 */
export function AuthSecurityWrapper({
  children,
  className = ''
}: AuthSecurityWrapperProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}