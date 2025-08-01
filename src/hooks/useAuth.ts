'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, signOut, AuthUser, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export type UserType = 'provider' | 'consumer';

export interface AuthUserWithAttributes extends AuthUser {
  userType?: UserType;
}

export interface UseAuthReturn {
  user: AuthUserWithAttributes | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: UserType | null;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUserWithAttributes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<UserType | null>(null);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      const userTypeValue = attributes['custom:user_type'] as UserType | undefined;
      const enrichedUser: AuthUserWithAttributes = {
        ...currentUser,
        userType: userTypeValue || 'consumer'
      };
      
      setUser(enrichedUser);
      setUserType(userTypeValue || 'consumer');
    } catch {
      // Usuario no autenticado
      setUser(null);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setUserType(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    checkAuthState();

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signIn':
        case 'signedIn':
        case 'autoSignIn':
          checkAuthState();
          break;
        case 'signOut':
        case 'signedOut':
          setUser(null);
          setUserType(null);
          break;
        case 'tokenRefresh':
        case 'tokenRefresh_failure':
          checkAuthState();
          break;
      }
    });

    return unsubscribe;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    userType,
    signOut: handleSignOut,
  };
}
