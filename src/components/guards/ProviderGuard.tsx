'use client';

import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ProviderGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProviderGuard({ children, fallback }: ProviderGuardProps) {
  const { userType, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (userType !== 'provider') {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800 text-sm">
          Esta función está disponible solo para proveedores.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}