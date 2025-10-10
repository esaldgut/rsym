'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAmplifyAuth as useAmplifyAuthHook } from '@/hooks/useAmplifyAuth';

// Crear el contexto
const AuthContext = createContext<ReturnType<typeof useAmplifyAuthHook> | undefined>(undefined);

// Provider del contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAmplifyAuthHook();

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