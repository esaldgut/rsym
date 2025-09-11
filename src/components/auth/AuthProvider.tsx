'use client';

import { useEffect } from 'react';
import { TokenInterceptor } from '@/lib/auth/token-interceptor';

/**
 * Proveedor de autenticación que inicializa el sistema de tokens automático
 * Se debe incluir en el layout principal de la aplicación
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar interceptor global y programación de refresh automático
    if (typeof window !== 'undefined') {
      console.log('🔧 Inicializando sistema automático de tokens...');
      
      // Inicializar interceptor para fetch requests
      TokenInterceptor.initializeGlobalInterceptor();
      
      // Programar verificación periódica de tokens
      TokenInterceptor.scheduleTokenRefresh();
      
      console.log('✅ Sistema de tokens automático inicializado');
    }
  }, []);

  return <>{children}</>;
}