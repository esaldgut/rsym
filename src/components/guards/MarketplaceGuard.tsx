'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { HeroSection } from '@/components/ui/HeroSection';

interface MarketplaceGuardProps {
  children: React.ReactNode;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasValidSession: boolean;
  userVerified: boolean;
  error?: string;
}

export default function MarketplaceGuard({ children }: MarketplaceGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    hasValidSession: false,
    userVerified: false
  });

  useEffect(() => {
    const validateMarketplaceAccess = async () => {
      try {
        // 1. Verificar sesión activa
        const session = await fetchAuthSession();
        const hasValidTokens = session.tokens?.idToken && session.tokens?.accessToken;

        if (!hasValidTokens) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            hasValidSession: false,
            userVerified: false,
            error: 'Sesión expirada o inválida'
          });
          return;
        }

        // 2. Verificar usuario actual
        const user = await getCurrentUser();
        const isVerified = user.signInDetails?.loginId && user.userId;

        if (!isVerified) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            hasValidSession: true,
            userVerified: false,
            error: 'Usuario no verificado'
          });
          return;
        }

        // 3. Validar permisos específicos del marketplace
        const userAttributes = session.tokens?.idToken?.payload;
        const userType = userAttributes?.['custom:user_type'];
        const emailVerified = userAttributes?.email_verified;

        if (!emailVerified) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            hasValidSession: true,
            userVerified: false,
            error: 'Email no verificado'
          });
          return;
        }

        // 4. Success - acceso permitido
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          hasValidSession: true,
          userVerified: true
        });

        console.log('✅ Marketplace access granted:', {
          userId: user.userId,
          userType,
          emailVerified,
          sessionValid: true
        });

      } catch (error) {
        console.error('❌ Marketplace access validation failed:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          hasValidSession: false,
          userVerified: false,
          error: error instanceof Error ? error.message : 'Error de validación'
        });
      }
    };

    validateMarketplaceAccess();
  }, [pathname]);

  // Loading state
  if (authState.isLoading) {
    return (
      <div className="min-h-screen">
        <HeroSection
          title="Validando acceso..."
          subtitle="Verificando permisos para el marketplace"
          size="md"
          showShapes={true}
        />
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access denied states
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen">
        <HeroSection
          title="Acceso Restringido"
          subtitle="Necesitas iniciar sesión para acceder al marketplace"
          size="md"
          showShapes={true}
        />
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h3>
                <p className="text-gray-600 mb-6">{authState.error}</p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/auth')}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Volver al Inicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authState.userVerified) {
    return (
      <div className="min-h-screen">
        <HeroSection
          title="Verificación Requerida"
          subtitle="Completa la verificación de tu cuenta para continuar"
          size="md"
          showShapes={true}
        />
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Verificación Pendiente</h3>
                <p className="text-gray-600 mb-6">{authState.error}</p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/dashboard/profile')}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Verificar Cuenta
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Ir al Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access granted - render children
  return <>{children}</>;
}