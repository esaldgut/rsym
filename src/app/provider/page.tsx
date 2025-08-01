'use client';

import { useAuth } from '../../hooks/useAuth';
import { AuthSecurityWrapper } from '../../components/auth/AuthSecurityWrapper';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProviderPage() {
  const { isAuthenticated, isLoading, user, signOut, userType } = useAuth();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  // Manejar errores de autenticación del middleware
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'insufficient_permissions':
          setAuthError('No tienes permisos para acceder a esta área. Solo proveedores pueden acceder.');
          break;
        case 'email_verification_required':
          setAuthError('Debes verificar tu correo electrónico antes de continuar.');
          break;
        case 'session_expired':
          setAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          break;
        default:
          setAuthError('Error de autenticación desconocido.');
      }
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando área de proveedor...</p>
        </div>
      </div>
    );
  }

  // Verificación adicional del lado cliente (el middleware ya debe haber validado)
  if (!isAuthenticated || userType !== 'provider') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              Acceso Restringido
            </h3>
            <p className="text-yellow-700 mb-4">
              Esta área está disponible solo para proveedores autorizados.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Volver al Dashboard
            </button>
          </div>
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
                YAAN - Área de Proveedor
              </h1>
              {/* Indicador de seguridad - solo visible en desarrollo */}
              {process.env.NODE_ENV === 'development' && (
                <span className="ml-4 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                  🛡️ Protegido por Middleware (Provider)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                Proveedor Verificado
              </span>
              <span className="text-sm text-gray-700">
                {user?.username}
              </span>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors duration-200 mr-2"
              >
                Dashboard
              </button>
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
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bienvenido al Área de Proveedor
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Como proveedor verificado de YAAN, tienes acceso a herramientas exclusivas para gestionar tus servicios, 
                crear circuitos y paquetes turísticos, y administrar tus reservaciones.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Mis Circuitos</h3>
                  <p className="text-gray-600 text-sm mb-4">Gestiona tus rutas y experiencias turísticas</p>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200">
                    Ver Circuitos
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Mis Paquetes</h3>
                  <p className="text-gray-600 text-sm mb-4">Administra tus ofertas y promociones</p>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200">
                    Ver Paquetes
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Reservaciones</h3>
                  <p className="text-gray-600 text-sm mb-4">Revisa y gestiona las reservaciones</p>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200">
                    Ver Reservaciones
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </AuthSecurityWrapper>
  );
}