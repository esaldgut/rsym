'use client';

import { Hub } from 'aws-amplify/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Componente para manejar eventos OAuth de Amplify v6
 * Basado en documentación oficial: https://docs.amplify.aws/react/build-a-backend/auth/connect-your-frontend/listen-to-auth-events/
 */
export function OAuthHandler() {
  const router = useRouter();
  
  useEffect(() => {
    console.log('🔐 OAuthHandler: Inicializando listener de eventos OAuth');
    
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log('📡 OAuthHandler: Evento recibido:', payload.event, payload);
      
      switch (payload.event) {
        case 'signInWithRedirect':
          console.log('✅ OAuth sign in successful');
          // Redirigir al dashboard después de autenticación exitosa
          router.push('/dashboard');
          break;
          
        case 'signInWithRedirect_failure':
          console.error('❌ OAuth sign in failed:', payload.data);
          // Redirigir a auth con mensaje de error
          const errorMessage = payload.data?.message || 'Error en autenticación social';
          router.push(`/auth?error=oauth_failed&error_description=${encodeURIComponent(errorMessage)}`);
          break;
          
        case 'customOAuthState':
          console.log('📋 Custom OAuth state received:', payload.data);
          // Manejar estado personalizado si es necesario
          if (payload.data?.redirect) {
            router.push(payload.data.redirect);
          }
          break;
          
        case 'signedIn':
          console.log('✅ User signed in successfully');
          // También manejar el evento signedIn para otros tipos de login
          break;
          
        case 'signedOut':
          console.log('👋 User signed out');
          router.push('/');
          break;
          
        case 'tokenRefresh':
          console.log('🔄 Token refreshed successfully');
          break;
          
        case 'tokenRefresh_failure':
          console.error('❌ Token refresh failed');
          // Opcional: forzar re-login si el token no se puede refrescar
          break;
      }
    });

    // Cleanup: dejar de escuchar cuando el componente se desmonte
    return () => {
      console.log('🔐 OAuthHandler: Removiendo listener de eventos OAuth');
      unsubscribe();
    };
  }, [router]);

  // Este componente no renderiza nada, solo maneja eventos
  return null;
}