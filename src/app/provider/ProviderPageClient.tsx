'use client';

import { useAmplifyAuth } from '../../hooks/useAmplifyAuth';
import { AuthSecurityWrapper } from '../../components/auth/AuthSecurityWrapper';
import { HeroSection } from '../../components/ui/HeroSection';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProviderPageClient() {
  const { isAuthenticated, isLoading, user, signOut, userType } = useAmplifyAuth();
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

  return (
    <AuthSecurityWrapper>
      <div className="min-h-screen">
        {/* Hero Section consistente con YAAN */}
        <HeroSection
          title={
            <div className="flex items-center justify-center gap-3">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span>Panel de Proveedor</span>
            </div>
          }
          subtitle="Gestiona tus experiencias turísticas y conecta con viajeros de todo el mundo"
          size="md"
          showShapes={true}
        >
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <span className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20">
              ✅ Proveedor Aprobado
            </span>
            <span className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20">
              {user?.username}
            </span>
            <Link
              href="/moments"
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              Momentos
            </Link>
            <button
              onClick={signOut}
              className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-red-400/50 hover:bg-red-600/90 transition-all duration-200"
            >
              Cerrar sesión
            </button>
          </div>
        </HeroSection>
        
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Alerta de error si existe */}
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-red-700 font-medium">{authError}</p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setAuthError(null)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tarjeta principal de bienvenida */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-6 shadow-lg">
                  <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  Bienvenido al Panel de Proveedor
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
                  Como proveedor verificado de YAAN, tienes acceso a herramientas exclusivas para gestionar tus servicios, 
                  crear circuitos y paquetes turísticos, y administrar tus reservaciones.
                </p>
              </div>
            </div>

            {/* Grid de acciones principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Mis Circuitos</h3>
                  <p className="text-gray-600 text-sm mb-6">Gestiona tus rutas y experiencias turísticas con múltiples destinos</p>
                  <Link 
                    href="/provider/products"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ver Circuitos
                  </Link>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Mis Paquetes</h3>
                  <p className="text-gray-600 text-sm mb-6">Administra tus ofertas y promociones completas</p>
                  <Link 
                    href="/provider/products"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ver Paquetes
                  </Link>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v10m-4-6h8" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Reservaciones</h3>
                  <p className="text-gray-600 text-sm mb-6">Revisa y gestiona todas tus reservaciones</p>
                  <button className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Ver Reservaciones
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.464 15.536a5 5 0 010-7.072m-2.828 9.9a9 9 0 010-12.728" />
                      <circle cx="12" cy="12" r="3" strokeWidth={2} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Mis Anuncios</h3>
                  <p className="text-gray-600 text-sm mb-6">Administra tu contenido de ofertas, promociones y alertas</p>
                  <Link 
                    href="/moments"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ver Anuncios
                  </Link>
                </div>
              </div>
            </div>

            {/* CTA para crear nuevo producto */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white mt-8">
              <h3 className="text-2xl font-bold mb-4">¿Listo para crear una nueva experiencia?</h3>
              <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                Comparte tu conocimiento local y crea experiencias únicas que los viajeros recordarán para siempre.
              </p>
              <Link
                href="/provider/products/create"
                className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Nueva Experiencia
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthSecurityWrapper>
  );
}
