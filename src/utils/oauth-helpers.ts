// src/utils/oauth-helpers.ts
'use client';

/**
 * Genera la URL de autorización OAuth directa para proveedores sociales
 * Útil para debugging y flujos personalizados
 */
export function generateOAuthUrl(provider: 'Apple' | 'Google' | 'Facebook') {
  const baseUrl = 'https://auth.yaan.com.mx/oauth2/authorize';
  const clientId = 'pi3jecnooc25adjrdrj5m80it';
  // CORREGIDO: redirect_uri debe apuntar a nuestra app, no al endpoint interno de Cognito
  const redirectUri = encodeURIComponent('https://auth.yaan.com.mx/oauth2/idpresponse');
  //const redirectUri = encodeURIComponent(`${window.location.origin}/auth`);
  const responseType = 'code';
  const scope = encodeURIComponent('email openid profile');
  
  // Mapear proveedores a sus identity_provider IDs en Cognito
  const identityProviderMap = {
    'Apple': 'SignInWithApple',
    'Google': 'Google', 
    'Facebook': 'Facebook'
  };

  const identityProvider = identityProviderMap[provider];

  // CORREGIDO: SIN state personalizado - deja que Cognito maneje el state internamente
  // Cuando usas identity_provider, Cognito maneja el state automáticamente
  const oauthUrl = `${baseUrl}?` + 
    `identity_provider=${identityProvider}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=${responseType}&` +
    `client_id=${clientId}&` +
    `scope=${scope}`;

  return oauthUrl;
}

/**
 * Redirige directamente al proveedor OAuth sin pasar por Amplify
 * Útil para debugging o cuando Amplify tiene problemas de configuración
 */
export function redirectToOAuthProvider(provider: 'Apple' | 'Google' | 'Facebook') {
  const url = generateOAuthUrl(provider);
  window.location.href = url;
}

/**
 * Genera la URL directa de Cognito Hosted UI para testing
 */
export function getCognitoHostedUIUrl() {
  const domain = 'https://auth.yaan.com.mx';
  const clientId = 'pi3jecnooc25adjrdrj5m80it';
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth`);
  const responseType = 'code';
  const scope = encodeURIComponent('email openid profile');
  
  return `${domain}/login?` +
    `client_id=${clientId}&` +
    `response_type=${responseType}&` +
    `scope=${scope}&` +
    `redirect_uri=${redirectUri}`;
}
