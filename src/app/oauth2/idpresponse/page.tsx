'use client';

import { useEffect } from 'react';

/**
 * Página de callback OAuth para Cognito
 * Según docs oficiales Amplify v6, esta página solo debe existir para recibir el callback.
 * Hub.listen en OAuthHandler se encarga de procesar la autenticación.
 */
export default function OAuth2IdpResponse() {
  useEffect(() => {
    // NO hacer redirects aquí - dejar que Hub.listen maneje todo
    console.log('📍 OAuth callback received at /oauth2/idpresponse');
    console.log('🔄 Waiting for Hub events to process authentication...');
    
    // Los parámetros code y state son procesados automáticamente por Amplify
    // cuando detecta la URL con el import 'aws-amplify/auth/enable-oauth-listener'
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Completando autenticación</h2>
        <p className="text-gray-600">Por favor espera mientras procesamos tu inicio de sesión...</p>
      </div>
    </div>
  );
}