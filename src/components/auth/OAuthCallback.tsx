'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

interface OAuthCallbackProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function OAuthCallback({ onSuccess, onError }: OAuthCallbackProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Verificar si tenemos parámetros de OAuth
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || `OAuth error: ${error}`);
        }

        if (!code) {
          // No es un callback de OAuth, no hacer nada
          return;
        }

        setMessage('Verificando autenticación...');

        // Esperar un poco para que Amplify procese el callback
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verificar si el usuario está autenticado
        const user = await getCurrentUser();
        console.log('OAuth callback - User authenticated:', user.username);

        setMessage('Obteniendo información del perfil...');
        
        // Obtener atributos del usuario
        const attributes = await fetchUserAttributes();
        console.log('OAuth callback - User attributes:', attributes);

        setStatus('success');
        setMessage('¡Autenticación exitosa! Redirigiendo...');
        
        onSuccess?.();

        // Redirigir después de un breve delay
        setTimeout(() => {
          const redirectUrl = searchParams.get('redirect') || '/profile';
          router.push(redirectUrl);
        }, 1500);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Error en la autenticación social';
        
        setMessage(errorMessage);
        onError?.(errorMessage);
      }
    };

    // Manejar eventos de Hub
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log('OAuth Callback - Auth event:', payload.event);
      
      if (payload.event === 'signInWithRedirect') {
        handleOAuthCallback();
      } else if (payload.event === 'signInWithRedirect_failure') {
        setStatus('error');
        setMessage('Error en la autenticación social');
        onError?.('Error en la autenticación social');
      }
    });

    // También intentar manejar inmediatamente si ya hay parámetros
    if (searchParams.get('code')) {
      handleOAuthCallback();
    }

    return () => {
      unsubscribe();
    };
  }, [searchParams, router, onSuccess, onError]);

  // No renderizar nada si no hay parámetros de OAuth
  if (!searchParams.get('code') && !searchParams.get('error')) {
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
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
            >
              Intentar nuevamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}