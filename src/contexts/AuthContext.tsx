'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAmplifyAuth as useAmplifyAuthHook, type InitialAuthData } from '@/hooks/useAmplifyAuth';

// Crear el contexto
const AuthContext = createContext<ReturnType<typeof useAmplifyAuthHook> | undefined>(undefined);

// Props para AuthProvider con soporte SSR
interface AuthProviderProps {
  children: ReactNode;
  initialAuth?: InitialAuthData; // Datos iniciales desde SSR
}

// Provider del contexto
export function AuthProvider({ children, initialAuth }: AuthProviderProps) {
  const auth = useAmplifyAuthHook(initialAuth);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-exportar el hook original para compatibilidad
export const useAmplifyAuth = useAuth;