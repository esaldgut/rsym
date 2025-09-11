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
    let cognitoProvider = ''; // Mover declaración fuera del try para acceso en catch
    
    try {
      setIsLoading(true);
      setLoadingProvider(provider);
      setError(null);

      // Mapear nombres de providers a los nombres exactos en Cognito
      // Probar diferentes variaciones según documentación de AWS
      const providerMap: Record<SocialProvider, string> = {
        'Google': 'Google',
        'Apple': 'Apple', // Probar con el nombre simple primero
        'Facebook': 'Facebook'
      };

      cognitoProvider = providerMap[provider];
      
      // Debug logging solo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 Iniciando OAuth con ${provider} (provider: ${cognitoProvider})`);
        console.log('📍 Current URL:', window.location.href);
      }
      
      // Implementar timeout para evitar colgado indefinido
      const signInPromise = signInWithRedirect({ 
        provider: cognitoProvider
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout: OAuth redirect para ${provider} tomó más de 10 segundos. Verifica la configuración de AWS Cognito.`));
        }, 10000); // 10 segundos timeout
      });
      
      // Race entre la operación OAuth y el timeout
      await Promise.race([signInPromise, timeoutPromise]);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ signInWithRedirect completed - should redirect to OAuth provider now');
      }

    } catch (err) {
      // Debug detallado del error
      console.error(`❌ ERROR COMPLETO con ${provider}:`, err);
      console.error('📋 Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : err,
        stack: err instanceof Error ? err.stack : null,
        provider: cognitoProvider,
        fullError: JSON.stringify(err, null, 2)
      });
      
      let errorMessage = `Error al iniciar sesión con ${provider}`;
      
      if (err instanceof Error) {
        // Manejar errores específicos
        if (err.message.includes('OAuthNotConfigureException') || err.message.includes('oauth param not configured')) {
          errorMessage = `OAuth no configurado para ${provider}. Verifica: 1) Identity provider configurado en AWS Cognito, 2) App client settings correcto.`;
        } else if (err.message.includes('redirect_uri_mismatch') || err.message.includes('redirect_mismatch') || err.message.includes('no está configurado en el atributo de la sesión')) {
          errorMessage = `URLs de redirección no configuradas. En AWS Cognito agrega: http://localhost:3000/oauth2/idpresponse y http://localhost:3000/auth como Callback URLs.`;
        } else if (err.message.includes('invalid_client')) {
          errorMessage = `Cliente inválido: Verifica el client_id en la configuración de Cognito.`;
        } else if (err.message.includes('User cancelled')) {
          errorMessage = `Inicio de sesión con ${provider} cancelado`;
        } else if (err.message.includes('Network')) {
          errorMessage = 'Error de conexión. Por favor verifica tu internet.';
        } else if (err.message.includes('Timeout')) {
          errorMessage = `${err.message} Verifica: 1) Dominio OAuth configurado, 2) Identity providers activos, 3) URLs de callback correctas.`;
        } else {
          errorMessage = `${err.message} (Provider: ${cognitoProvider})`;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  // Manejar el retorno de OAuth
  useEffect(() => {
    const handleAuthEvents = ({ payload }: { payload: { event: string; data?: unknown } }) => {
      
      switch (payload.event) {
        case 'signInWithRedirect':
          setIsLoading(false);
          setLoadingProvider(null);
          
          // Verificar si el usuario se autenticó correctamente
          getCurrentUser()
            .then(() => {
              const redirectUrl = searchParams.get('redirect') || '/moments';
              router.push(redirectUrl);
            })
            .catch(() => {
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