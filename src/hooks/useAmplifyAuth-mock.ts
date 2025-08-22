'use client';

import { useState, useEffect } from 'react';

export type UserType = 'provider' | 'consumer';

export interface AmplifyAuthUser {
  userId: string;
  username: string;
  email?: string;
  name?: string;
  profilePhotoPath?: string;
  userType: UserType;
  signInDetails: Record<string, unknown>;
  securityValidation: {
    isValid: boolean;
    score: number;
    issues: string[];
  };
}

export interface UseAmplifyAuthReturn {
  user: AmplifyAuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: UserType | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (operation: string, resource: string) => boolean;
}

/**
 * Mock temporal del hook useAmplifyAuth mientras se resuelven problemas de dependencias
 */
export function useAmplifyAuth(): UseAmplifyAuthReturn {
  const [user, setUser] = useState<AmplifyAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simular usuario autenticado para desarrollo
    setUser({
      userId: 'mock-user-123',
      username: 'developer',
      email: 'developer@yaan.com',
      name: 'Developer User',
      userType: 'consumer',
      signInDetails: {},
      securityValidation: {
        isValid: true,
        score: 100,
        issues: []
      }
    });
    setIsLoading(false);
  }, []);

  const signOut = async () => {
    setUser(null);
  };

  const refreshUser = async () => {
    // Mock refresh
  };

  const hasPermission = (operation: string, resource: string) => {
    // Mock permissions - always return true for development
    return true;
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    userType: user?.userType || null,
    signOut,
    refreshUser,
    hasPermission,
  };
}