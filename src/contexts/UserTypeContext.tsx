'use client';

import React, { createContext, useContext } from 'react';
import { useAmplifyAuth } from '../hooks/useAmplifyAuth';

export type UserType = 'provider' | 'consumer';

interface UserTypeContextType {
  userType: UserType | null;
  isProvider: boolean;
  isConsumer: boolean;
  isLoading: boolean;
}

const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

export function UserTypeProvider({ children }: { children: React.ReactNode }) {
  const { userType, isLoading } = useAmplifyAuth();

  const value: UserTypeContextType = {
    userType,
    isProvider: userType === 'provider',
    isConsumer: userType === 'consumer' || userType === null,
    isLoading,
  };

  return (
    <UserTypeContext.Provider value={value}>
      {children}
    </UserTypeContext.Provider>
  );
}

export function useUserType() {
  const context = useContext(UserTypeContext);
  if (context === undefined) {
    throw new Error('useUserType must be used within a UserTypeProvider');
  }
  return context;
}