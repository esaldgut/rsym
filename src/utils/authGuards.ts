'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { UserType } from '../hooks/useAuth';

interface UseProviderGuardOptions {
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export function useProviderGuard(options: UseProviderGuardOptions = {}) {
  const { redirectTo = '/dashboard', onUnauthorized } = options;
  const { isAuthenticated, isLoading, userType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth');
      } else if (userType !== 'provider') {
        if (onUnauthorized) {
          onUnauthorized();
        } else {
          router.push(redirectTo);
        }
      }
    }
  }, [isAuthenticated, isLoading, userType, router, redirectTo, onUnauthorized]);

  return {
    isAuthorized: isAuthenticated && userType === 'provider',
    isLoading,
    userType
  };
}

export function useAuthGuard(requiredUserType?: UserType) {
  const { isAuthenticated, isLoading, userType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  const isAuthorized = requiredUserType 
    ? isAuthenticated && userType === requiredUserType
    : isAuthenticated;

  return {
    isAuthorized,
    isLoading,
    userType
  };
}