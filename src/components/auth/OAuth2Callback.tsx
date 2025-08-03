'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Remove unused imports - OAuth handled by Hub events
import { Hub } from 'aws-amplify/utils';

interface OAuth2CallbackProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function OAuth2Callback({ onSuccess, onError }: OAuth2CallbackProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Manejar errores de OAuth primero
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      setStatus('error');
      let errorMessage = errorDescription || `OAuth error: ${error}`;
      
      if (error === 'redirect_mismatch') {
        errorMessage = 'Error de configuración: Las URLs de redirección no coinciden.';
      } else if (error === 'invalid_client') {
        errorMessage = 'Error de cliente: Verifica el client_id.';
      } else if (error === 'access_denied') {
        errorMessage = 'Acceso denegado: El usuario canceló la autenticación.';
      }
      
      setMessage(errorMessage);
      onError?.(errorMessage);
      return;
    }

    // Si tenemos código, escuchar Hub events según documentación oficial
    const code = searchParams.get('code');
    if (!code) {
      return;
    }

    setMessage('Procesando autenticación...');

    // Escuchar eventos de autenticación según Amplify v6 docs
    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signInWithRedirect':
          setStatus('success');
          setMessage('¡Autenticación exitosa!');
          onSuccess?.();
          
          // Redirigir usando router de Next.js
          const redirectUrl = searchParams.get('redirect') || '/dashboard';
          router.push(redirectUrl);
          break;
          
        case 'signInWithRedirect_failure':
          setStatus('error');
          setMessage('Error en la autenticación social');
          onError?.('Error en la autenticación social');
          break;
          
        case 'signedIn':
          // Este evento también puede dispararse para OAuth
          setStatus('success');
          setMessage('¡Autenticación exitosa!');
          onSuccess?.();
          
          const successRedirectUrl = searchParams.get('redirect') || '/dashboard';
          router.push(successRedirectUrl);
          break;
      }
    });

    return () => {
      hubListener(); // Cleanup listener
    };
  }, [searchParams, router, onSuccess, onError]);

  // No renderizar si no hay parámetros de OAuth2
  const hasOAuth2Params = searchParams.get('code') || searchParams.get('error');
  if (!hasOAuth2Params) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Procesando autenticación
            </h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              ¡Bienvenido a YAAN!
            </h2>
            <p className="text-green-700">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Error de autenticación
            </h2>
            <p className="text-red-700 mb-4">{message}</p>
            
            <button
              onClick={() => router.push('/auth')}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
            >
              Intentar nuevamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}