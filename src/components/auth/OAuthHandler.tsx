'use client';

import { Hub } from 'aws-amplify/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { logger } from '../../utils/logger';

/**
 * Componente para manejar eventos OAuth de Amplify v6
 * Basado en documentación oficial: https://docs.amplify.aws/react/build-a-backend/auth/connect-your-frontend/listen-to-auth-events/
 */
export function OAuthHandler() {
  const router = useRouter();
  
  useEffect(() => {
    logger.auth('Inicializando listener de eventos OAuth', 'OAuthHandler');
    
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      logger.auth(`Evento recibido: ${payload.event}`, 'OAuthHandler');
      
      switch (payload.event) {
        case 'signInWithRedirect':
          logger.auth('OAuth sign in successful', 'signInWithRedirect');
          router.push('/dashboard');
          break;
          
        case 'signInWithRedirect_failure':
          logger.error('OAuth sign in failed', { error: payload.data?.message });
          const errorMessage = payload.data?.message || 'Error en autenticación social';
          router.push(`/auth?error=oauth_failed&error_description=${encodeURIComponent(errorMessage)}`);
          break;
          
        case 'customOAuthState':
          logger.auth('Custom OAuth state received', 'customOAuthState');
          if (payload.data?.redirect) {
            router.push(payload.data.redirect);
          }
          break;
          
        case 'signedIn':
          logger.auth('User signed in successfully', 'signedIn');
          break;
          
        case 'signedOut':
          logger.auth('User signed out', 'signedOut');
          router.push('/');
          break;
          
        case 'tokenRefresh':
          logger.auth('Token refreshed successfully', 'tokenRefresh');
          break;
          
        case 'tokenRefresh_failure':
          logger.warn('Token refresh failed', { event: payload.event });
          break;
      }
    });

    return () => {
      logger.auth('Removiendo listener de eventos OAuth', 'OAuthHandler');
      unsubscribe();
    };
  }, [router]);

  // Este componente no renderiza nada, solo maneja eventos
  return null;
}