'use client';

import { useAuth } from '../../hooks/useAuth';
import { DashboardContent } from '../../components/dashboard/DashboardContent';
import { AuthSecurityWrapper } from '../../components/auth/AuthSecurityWrapper';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user, signOut, userType } = useAuth();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  // Manejar errores de autenticación del middleware
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'email_verification_required':
          setAuthError('Debes verificar tu correo electrónico antes de continuar.');
          break;
        case 'session_expired':
          setAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          break;
        case 'middleware_error':
          setAuthError('Error de autenticación. Por favor, intenta nuevamente.');
          break;
        default:
          setAuthError('Error de autenticación desconocido.');
      }
    }
  }, [searchParams]);

  // El middleware ya maneja la redirección, pero mantenemos esto como fallback
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Este caso no debería ocurrir con el middleware, pero es un fallback de seguridad
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Redirigiendo a inicio de sesión...</p>
          <div className="animate-pulse bg-gray-300 h-4 w-32 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthSecurityWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Mostrar error de autenticación si existe */}
        {authError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{authError}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setAuthError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                YAAN Dashboard
              </h1>
              {/* Indicador de seguridad - solo visible en desarrollo */}
              {process.env.NODE_ENV === 'development' && (
                <span className="ml-4 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                  🛡️ Protegido por Middleware
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {userType === 'provider' && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Proveedor
                </span>
              )}
              <span className="text-sm text-gray-700">
                Hola, {user?.username}
              </span>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors duration-200"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DashboardContent userType={userType} />
          </div>
        </main>
      </div>
    </AuthSecurityWrapper>
  );
}
