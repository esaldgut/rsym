import { cookies } from 'next/headers';
import outputs from '../../amplify/outputs.json';
import type { JWT } from 'aws-amplify/auth';

/**
 * Utilidad para leer cookies de Amplify CookieStorage en server-side
 *
 * CONTEXTO: Amplify client-side usa CookieStorage que crea cookies con patrón:
 * - CognitoIdentityServiceProvider.{clientId}.LastAuthUser
 * - CognitoIdentityServiceProvider.{clientId}.{username}.idToken
 * - CognitoIdentityServiceProvider.{clientId}.{username}.accessToken
 * - CognitoIdentityServiceProvider.{clientId}.{username}.refreshToken
 *
 * createServerRunner de @aws-amplify/adapter-nextjs NO puede leer estas cookies.
 * Esta utilidad permite a server-side leer las mismas cookies que creó client-side.
 *
 * PATRÓN HÍBRIDO TEMPORAL hasta migración completa a adapter-nextjs.
 */

export interface AmplifyTokens {
  idToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
}

/**
 * Lee tokens de Amplify desde cookies creadas por CookieStorage client-side
 *
 * SOLUCIÓN ROBUSTA:
 * - Maneja username con o sin URL-encoding (ej. @ → %40)
 * - Busca cookies por patrón en lugar de construir nombres exactos
 * - Compatible con cualquier carácter especial en username
 *
 * @returns Tokens extraídos de cookies o null values si no están disponibles
 */
export async function getAmplifyTokensFromCookies(): Promise<AmplifyTokens> {
  try {
    const cookieStore = await cookies();
    const clientId = outputs.auth.user_pool_client_id;

    // ========================================
    // PASO 1: Obtener username del usuario autenticado actual
    // ========================================
    const lastAuthUserKey = `CognitoIdentityServiceProvider.${clientId}.LastAuthUser`;
    const lastAuthUserCookie = cookieStore.get(lastAuthUserKey);

    if (!lastAuthUserCookie?.value) {
      console.log('🔍 [amplify-server-cookies] No se encontró LastAuthUser cookie');
      return {
        idToken: null,
        accessToken: null,
        refreshToken: null,
        username: null
      };
    }

    const username = lastAuthUserCookie.value;
    console.log('🔍 [amplify-server-cookies] Usuario detectado:', username);

    // ========================================
    // PASO 2: Buscar cookies por PATRÓN (robusto a encoding)
    // ========================================
    console.log('🔍 [amplify-server-cookies] Buscando cookies por patrón...');

    // Obtener TODAS las cookies del dominio
    const allCookies = cookieStore.getAll();

    // Filtrar solo cookies de Cognito para este clientId
    const cognitoCookies = allCookies.filter(cookie =>
      cookie.name.startsWith(`CognitoIdentityServiceProvider.${clientId}.`)
    );

    console.log(`🔍 [amplify-server-cookies] Total cookies Cognito encontradas: ${cognitoCookies.length}`);

    // Buscar cookies de tokens por patrón
    // Soporta username tanto encoded (esaldgut%40icloud.com) como no-encoded (esaldgut@icloud.com)
    let idTokenCookie = null;
    let accessTokenCookie = null;
    let refreshTokenCookie = null;

    // Estrategia multi-capa:
    // Capa 1: Intentar con username directo (sin encoding)
    idTokenCookie = cookieStore.get(`CognitoIdentityServiceProvider.${clientId}.${username}.idToken`);
    accessTokenCookie = cookieStore.get(`CognitoIdentityServiceProvider.${clientId}.${username}.accessToken`);
    refreshTokenCookie = cookieStore.get(`CognitoIdentityServiceProvider.${clientId}.${username}.refreshToken`);

    // Capa 2: Si no encontró, intentar con username URL-encoded
    if (!idTokenCookie) {
      const encodedUsername = encodeURIComponent(username);
      console.log('🔍 [amplify-server-cookies] Intentando con username encoded:', encodedUsername);

      idTokenCookie = cookieStore.get(`CognitoIdentityServiceProvider.${clientId}.${encodedUsername}.idToken`);
      accessTokenCookie = cookieStore.get(`CognitoIdentityServiceProvider.${clientId}.${encodedUsername}.accessToken`);
      refreshTokenCookie = cookieStore.get(`CognitoIdentityServiceProvider.${clientId}.${encodedUsername}.refreshToken`);
    }

    // Capa 3: Si aún no encontró, buscar por patrón en todas las cookies
    if (!idTokenCookie) {
      console.log('🔍 [amplify-server-cookies] Buscando por patrón en todas las cookies...');

      idTokenCookie = cognitoCookies.find(c => c.name.endsWith('.idToken'));
      accessTokenCookie = cognitoCookies.find(c => c.name.endsWith('.accessToken'));
      refreshTokenCookie = cognitoCookies.find(c => c.name.endsWith('.refreshToken'));

      if (idTokenCookie) {
        console.log('✅ [amplify-server-cookies] Encontrado por patrón:', idTokenCookie.name);
      }
    }

    // ========================================
    // PASO 3: Logging y retorno de resultados
    // ========================================
    console.log('🔍 [amplify-server-cookies] Tokens encontrados:', {
      hasIdToken: !!idTokenCookie?.value,
      hasAccessToken: !!accessTokenCookie?.value,
      hasRefreshToken: !!refreshTokenCookie?.value
    });

    // Debug: Si NO encontró tokens, mostrar todas las cookies disponibles
    if (!idTokenCookie) {
      console.log('⚠️ [amplify-server-cookies] DEBUG - Cookies Cognito disponibles:');
      cognitoCookies.forEach(c => {
        console.log(`   - ${c.name}`);
      });
    }

    return {
      idToken: idTokenCookie?.value || null,
      accessToken: accessTokenCookie?.value || null,
      refreshToken: refreshTokenCookie?.value || null,
      username
    };
  } catch (error) {
    console.error('❌ [amplify-server-cookies] Error leyendo cookies:', error);
    return {
      idToken: null,
      accessToken: null,
      refreshToken: null,
      username: null
    };
  }
}

/**
 * Parsea un JWT token string a objeto JWT
 * Compatible con el tipo JWT de aws-amplify/auth
 */
export function parseJWT(tokenString: string): JWT | null {
  try {
    // Split token en header.payload.signature
    const parts = tokenString.split('.');
    if (parts.length !== 3) {
      console.error('❌ [amplify-server-cookies] Token JWT inválido: formato incorrecto');
      return null;
    }

    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    // Construir objeto JWT compatible con Amplify
    const jwt: JWT = {
      toString: () => tokenString,
      payload
    };

    return jwt;
  } catch (error) {
    console.error('❌ [amplify-server-cookies] Error parseando JWT:', error);
    return null;
  }
}

/**
 * Obtiene el ID Token parseado desde cookies
 * Helper rápido para casos donde solo necesitas el ID token
 */
export async function getIdTokenFromCookies(): Promise<JWT | null> {
  const tokens = await getAmplifyTokensFromCookies();

  if (!tokens.idToken) {
    return null;
  }

  return parseJWT(tokens.idToken);
}

/**
 * Verifica si hay una sesión válida en cookies (sin parsear tokens)
 * Útil para checks rápidos de autenticación
 */
export async function hasValidCookieSession(): Promise<boolean> {
  const tokens = await getAmplifyTokensFromCookies();
  return !!(tokens.idToken && tokens.username);
}

/**
 * Debug: Lista todas las cookies relacionadas con Cognito
 * Útil para troubleshooting
 */
export async function debugCognitoCookies(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    console.log('🔍 [DEBUG] Todas las cookies de Cognito:');
    allCookies
      .filter(cookie => cookie.name.startsWith('CognitoIdentityServiceProvider'))
      .forEach(cookie => {
        console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
      });
  } catch (error) {
    console.error('❌ [DEBUG] Error listando cookies:', error);
  }
}
