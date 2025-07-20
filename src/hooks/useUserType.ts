'use client';

import { useAuth } from './useAuth';

export function useUserType() {
  const { userType, isLoading } = useAuth();

  return {
    userType,
    isProvider: userType === 'provider',
    isConsumer: userType === 'consumer' || userType === null,
    isLoading,
  };
}