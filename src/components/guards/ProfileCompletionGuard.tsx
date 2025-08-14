'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

interface ProfileCompletionGuardProps {
  children: ReactNode;
  fallbackUrl?: string;
  action?: string;
  data?: any;
  showLoading?: boolean;
}

/**
 * Guard que verifica si el perfil del usuario está completo
 * Si no lo está, redirige a /settings/profile guardando el contexto
 */
export function ProfileCompletionGuard({
  children,
  fallbackUrl,
  action = 'continue',
  data,
  showLoading = true
}: ProfileCompletionGuardProps) {
  const router = useRouter();
  const { isComplete, isLoading, requireProfileCompletion } = useProfileCompletion();
  
  useEffect(() => {
    if (!isLoading && !isComplete) {
      const currentUrl = fallbackUrl || window.location.pathname;
      requireProfileCompletion({
        returnUrl: currentUrl,
        action,
        data
      });
    }
  }, [isLoading, isComplete, fallbackUrl, action, data, requireProfileCompletion]);

  if (isLoading && showLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!isComplete) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook para usar la verificación de perfil completo de forma programática
 */
export function useRequireCompleteProfile() {
  const router = useRouter();
  const { isComplete, isLoading, requireProfileCompletion } = useProfileCompletion();

  const checkProfile = (
    action: string,
    data?: any,
    onComplete?: () => void
  ) => {
    if (isLoading) return;
    
    if (!isComplete) {
      requireProfileCompletion({
        returnUrl: window.location.pathname,
        action,
        data
      });
    } else if (onComplete) {
      onComplete();
    }
  };

  return { checkProfile, isComplete, isLoading };
}