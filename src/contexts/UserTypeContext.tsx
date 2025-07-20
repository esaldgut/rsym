'use client';

import React, { createContext, useContext } from 'react';
import { useAuth, UserType } from '../hooks/useAuth';

interface UserTypeContextType {
  userType: UserType | null;
  isProvider: boolean;
  isConsumer: boolean;
  isLoading: boolean;
}

const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

export function UserTypeProvider({ children }: { children: React.ReactNode }) {
  const { userType, isLoading } = useAuth();

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