'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAmplifyAuth } from '../../hooks/useAmplifyAuth';
import { AuthForm } from '../../components/auth/AuthForm';
import { AuthErrorBoundary } from '../../components/auth/AuthErrorBoundary';
import { useSearchParams } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAmplifyAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // If already authenticated, don't show the auth form
  if (isAuthenticated) {
    return null;
  }

  // Mostrar errores OAuth si existen
  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Mostrar errores OAuth si existen */}
          {oauthError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error de autenticación social
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{oauthErrorDescription || 'Error en la autenticación con el proveedor social'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <AuthForm />
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
