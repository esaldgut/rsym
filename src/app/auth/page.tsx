'use client';

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { AuthErrorBoundary } from '../../components/auth/AuthErrorBoundary'
import { AuthForm } from '../../components/auth/AuthForm'
import { HeroSection } from '../../components/ui/HeroSection'

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/marketplace');
    }
  }, [isAuthenticated, router]);

  // If already authenticated, don't show the auth form
  if (isAuthenticated) {
    return null;
  }

  // Mostrar errores OAuth si existen
  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');
  
  // Detectar si es signup mode
  const mode = searchParams.get('mode');
  const isSignupMode = mode === 'signup';

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen">
        {/* Hero Section consistente con YAAN */}
        <HeroSection
          title={
            <div className="flex items-center justify-center gap-3">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span>{isSignupMode ? 'Crear cuenta' : 'Iniciar sesión'}</span>
            </div>
          }
          subtitle={isSignupMode ? 'Únete a YAAN y descubre experiencias turísticas únicas' : 'Accede a tu cuenta y continúa tu aventura'}
          size="sm"
          showShapes={true}
        />
        
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Mostrar errores OAuth si existen */}
            {oauthError && (
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
                    <h3 className="text-sm font-bold text-red-800 mb-2">
                      Error de autenticación social
                    </h3>
                    <p className="text-sm text-red-700">
                      {oauthErrorDescription || 'Error en la autenticación con el proveedor social'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <AuthForm />
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
