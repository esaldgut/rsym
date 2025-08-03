'use client';

import { useState, useEffect } from 'react';
import { signInWithRedirect, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { useRouter, useSearchParams } from 'next/navigation';

export type SocialProvider = 'Google' | 'Apple' | 'Facebook';

interface UseSocialAuthReturn {
  signInWithProvider: (provider: SocialProvider) => Promise<void>;
  isLoading: boolean;
  loadingProvider: SocialProvider | null;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook especializado para manejar autenticación social
 */
export function useSocialAuth(): UseSocialAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const clearError = () => setError(null);

  const signInWithProvider = async (provider: SocialProvider) => {
    try {
      setIsLoading(true);
      setLoadingProvider(provider);
      setError(null);

      // Intentar sign in con redirect directamente
      // Amplify v6 maneja la configuración internamente sin customState
      await signInWithRedirect({ 
        provider
      });

    } catch (err) {
      console.error(`Error with ${provider} sign in:`, err);
      
      let errorMessage = `Error al iniciar sesión con ${provider}`;
      
      if (err instanceof Error) {
        // Manejar errores específicos
        if (err.message.includes('OAuthNotConfigureException')) {
          errorMessage = `OAuth no configurado para ${provider}. Verifica la configuración de Amplify y Cognito.`;
        } else if (err.message.includes('redirect_uri_mismatch') || err.message.includes('redirect_mismatch')) {
          errorMessage = `Error de configuración: Las URLs de redirección no coinciden. Verifica la configuración de Cognito.`;
        } else if (err.message.includes('invalid_client')) {
          errorMessage = `Cliente inválido: Verifica el client_id en la configuración de Cognito.`;
        } else if (err.message.includes('User cancelled')) {
          errorMessage = `Inicio de sesión con ${provider} cancelado`;
        } else if (err.message.includes('Network')) {
          errorMessage = 'Error de conexión. Por favor verifica tu internet.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  // Manejar el retorno de OAuth
  useEffect(() => {
    const handleAuthEvents = ({ payload }: { payload: { event: string; data?: any } }) => {
      
      switch (payload.event) {
        case 'signInWithRedirect':
          setIsLoading(false);
          setLoadingProvider(null);
          
          // Verificar si el usuario se autenticó correctamente
          getCurrentUser()
            .then(() => {
              const redirectUrl = searchParams.get('redirect') || '/dashboard';
              router.push(redirectUrl);
            })
            .catch((error) => {
              setError('Error al completar la autenticación');
            });
          break;
          
        case 'signInWithRedirect_failure':
          setError('Error en la autenticación social');
          setIsLoading(false);
          setLoadingProvider(null);
          break;
      }
    };

    const unsubscribe = Hub.listen('auth', handleAuthEvents);
    
    return () => {
      unsubscribe();
    };
  }, [router, searchParams]);

  // Verificar si estamos regresando de un OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      setIsLoading(true);
      setLoadingProvider(null);
    }
  }, []);

  return {
    signInWithProvider,
    isLoading,
    loadingProvider,
    error,
    clearError
  };
}