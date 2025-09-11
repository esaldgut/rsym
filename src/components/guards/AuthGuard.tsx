'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAmplifyAuth } from '@/hooks/useAmplifyAuth';
//import { useAmplifyAuth } from '@/hooks/useAmplifyAuth-mock';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * Guard de autenticación compatible con cookies HTTP-only
 * Funciona tanto con localStorage como con cookies
 */
export function AuthGuard({ 
  children, 
  redirectTo = '/auth',
  fallback
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAmplifyAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  if (isLoading) {
    return fallback || (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
