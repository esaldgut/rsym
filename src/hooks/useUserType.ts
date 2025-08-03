'use client';

import { useAmplifyAuth } from './useAmplifyAuth';

export function useUserType() {
  const { userType, isLoading } = useAmplifyAuth();

  return {
    userType,
    isProvider: userType === 'provider',
    isConsumer: userType === 'consumer' || userType === null,
    isLoading,
  };
}