'use client';

import { useAmplifyAuth } from '@/hooks/useAmplifyAuth';
import { ReactNode } from 'react';

interface ProviderOnlyGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * Guard que solo permite el acceso a usuarios con userType 'provider'
 * Aplicando el principio de menor privilegio del AWS Well-Architected Framework
 */
export function ProviderOnlyGuard({ 
  children, 
  fallback,
  showError = true 
}: ProviderOnlyGuardProps) {
  const { userType, isLoading } = useAmplifyAuth();

  // Mostrar loading mientras se verifica el tipo de usuario
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Verificando permisos...</span>
      </div>
    );
  }

  // Si no es provider, mostrar fallback o error
  if (userType !== 'provider') {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-red-600 mb-4">
            Esta funcionalidad está disponible únicamente para proveedores de servicios turísticos.
          </p>
          <p className="text-sm text-red-500">
            Tipo de usuario actual: <span className="font-mono">{userType || 'No identificado'}</span>
          </p>
          <div className="mt-4 p-3 bg-red-100 rounded-lg">
            <p className="text-xs text-red-700">
              <strong>¿Eres un proveedor?</strong> Contacta al administrador para actualizar tu tipo de cuenta.
            </p>
          </div>
        </div>
      );
    }

    return null;
  }

  // Usuario es provider, mostrar contenido
  return <>{children}</>;
}