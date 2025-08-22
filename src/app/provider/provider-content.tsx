'use client';

import { useAmplifyAuth } from '../../hooks/useAmplifyAuth';
import { AuthSecurityWrapper } from '../../components/auth/AuthSecurityWrapper';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProviderContent() {
  const { isAuthenticated, isLoading, user, signOut, userType } = useAmplifyAuth();
  const searchParams = useSearchParams();
  const [debugMode, setDebugMode] = useState(false);

  // Activar modo debug si hay parámetro en la URL
  useEffect(() => {
    setDebugMode(searchParams.get('debug') === 'true');
  }, [searchParams]);

  return (
    <AuthSecurityWrapper>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Portal de Proveedor YAAN
                </h1>
                <p className="text-gray-600">
                  Gestiona tus servicios, paquetes y experiencias de viaje
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Info del usuario */}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {(user as any)?.attributes?.name || user?.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    Tipo: {userType || 'No definido'}
                  </p>
                </div>
                
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          {debugMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                🔍 Información de Debug
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Autenticado:</strong> {isAuthenticated ? '✅ Sí' : '❌ No'}</p>
                <p><strong>Cargando:</strong> {isLoading ? '⏳ Sí' : '✅ No'}</p>
                <p><strong>ID Usuario:</strong> {user?.userId || 'N/A'}</p>
                <p><strong>Email:</strong> {(user as any)?.attributes?.email || 'N/A'}</p>
                <p><strong>Tipo de Usuario:</strong> {userType || 'N/A'}</p>
                <p><strong>Nombre:</strong> {(user as any)?.attributes?.name || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Gestión de Paquetes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Paquetes</h3>
              </div>
              <p className="text-gray-600 mb-6">Crea y gestiona tus paquetes de viaje</p>
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Ver Paquetes
              </button>
            </div>

            {/* Gestión de Experiencias */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Experiencias</h3>
              </div>
              <p className="text-gray-600 mb-6">Ofrece experiencias únicas</p>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Ver Experiencias
              </button>
            </div>

            {/* Reservas y Bookings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Reservas</h3>
              </div>
              <p className="text-gray-600 mb-6">Gestiona tus reservas activas</p>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Ver Reservas
              </button>
            </div>

            {/* Análiticas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Análiticas</h3>
              </div>
              <p className="text-gray-600 mb-6">Ve el rendimiento de tus servicios</p>
              <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                Ver Estadísticas
              </button>
            </div>

            {/* Perfil y Configuración */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Mi Perfil</h3>
              </div>
              <p className="text-gray-600 mb-6">Configura tu perfil de proveedor</p>
              <button className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Editar Perfil
              </button>
            </div>

            {/* Soporte */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Soporte</h3>
              </div>
              <p className="text-gray-600 mb-6">Obtén ayuda y soporte técnico</p>
              <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Contactar Soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthSecurityWrapper>
  );
}