'use client';

import { Amplify } from 'aws-amplify';
import { CookieStorage } from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { amplifyConfig } from './amplify-config-ssr';

/**
 * Configuración client-side de Amplify Gen 2 para Next.js 15
 *
 * SOLUCIÓN HÍBRIDA para Producción con `yarn dev`:
 * - Detecta HTTPS en runtime (no depende de NODE_ENV)
 * - Garantiza sameSite='none' SOLO con secure=true
 * - Funciona en development (localhost HTTP) y production (HTTPS con yarn dev)
 *
 * Patrón de Seguridad Multi-Layer:
 * Layer 1: Runtime HTTPS detection (window.location.protocol)
 * Layer 2: Environment variable FORCE_SECURE
 * Layer 3: Fallback seguro a sameSite='lax'
 *
 * Cumple con:
 * - Navegadores modernos (Chrome, Firefox, Safari)
 * - AWS Amplify Gen 2 CookieStorage validation
 * - Next.js 15 SSR + Client Components
 * - OAuth cross-origin con Cognito
 */

if (typeof window !== 'undefined') {
  // ========================================
  // DETECCIÓN HÍBRIDA DE SEGURIDAD
  // ========================================

  const isBrowser = typeof window !== 'undefined';
  const isHTTPS = isBrowser && window.location.protocol === 'https:';
  const needsCrossOrigin = process.env.NEXT_PUBLIC_CROSS_ORIGIN === 'true';
  const forceSecureEnv = process.env.NEXT_PUBLIC_FORCE_SECURE === 'true';

  // Layer 1: HTTPS detectado en runtime (producción con yarn dev)
  // Layer 2: FORCE_SECURE explícito (override manual)
  // Resultado: secure=true si CUALQUIERA es verdadero
  const secure = isHTTPS || forceSecureEnv;

  // REGLA CRÍTICA DE SEGURIDAD:
  // sameSite='none' SOLO si secure=true
  // De lo contrario, usar 'lax' (más seguro y compatible)
  // Esto previene el error: "sameSite = None requires the Secure attribute"
  const sameSite = needsCrossOrigin && secure ? 'none' : 'lax';

  // Debug logging para troubleshooting en producción
  console.log('🔐 Amplify Cookie Security Configuration:', {
    protocol: window.location.protocol,
    isHTTPS,
    needsCrossOrigin,
    forceSecureEnv,
    '→ secure': secure,
    '→ sameSite': sameSite,
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 'localhost',
    environment: process.env.NODE_ENV
  });

  // ========================================
  // CONFIGURAR COOKIESTORAGE SEGURO
  // ========================================

  const cookieStorage = new CookieStorage({
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 'localhost',
    path: '/',
    expires: 7, // días
    sameSite,
    secure
  });

  // Configurar el token provider para usar CookieStorage
  cognitoUserPoolsTokenProvider.setKeyValueStorage(cookieStorage);

  // Configurar Amplify con SSR habilitado
  Amplify.configure(amplifyConfig, { ssr: true });

  console.log('✅ Amplify configured client-side with secure cookies');

  // ========================================
  // MONITOREO DE CREDENTIAL LIFECYCLE
  // ========================================

  // Verificar credenciales después de la configuración inicial
  // Esto ayuda a detectar problemas de timing con Identity Pool
  import('aws-amplify/auth').then(({ fetchAuthSession }) => {
    // Esperar un momento para que Amplify termine de inicializarse
    setTimeout(async () => {
      try {
        const session = await fetchAuthSession();
        console.log('🔐 [Amplify Init] Estado de credenciales después de configuración:', {
          hasTokens: !!session.tokens,
          hasIdToken: !!session.tokens?.idToken,
          hasAccessToken: !!session.tokens?.accessToken,
          hasCredentials: !!session.credentials,
          credentialsReady: !!(
            session.credentials?.accessKeyId &&
            session.credentials?.secretAccessKey &&
            session.credentials?.sessionToken
          ),
          identityId: session.identityId
        });

        if (!session.credentials) {
          console.warn('⚠️ [Amplify Init] Credenciales del Identity Pool NO disponibles aún');
          console.warn('   Storage operations pueden fallar hasta que las credenciales estén listas');
        } else {
          console.log('✅ [Amplify Init] Credenciales listas para uso');
        }

        // WARMUP INICIAL: Pre-calentar credenciales en background
        // Esto asegura que las credenciales estén listas para el primer upload
        import('@/utils/credential-manager').then(({ warmupCredentials }) => {
          console.log('🔥 [Amplify Init] Ejecutando warmup inicial de credenciales...');
          warmupCredentials().then(() => {
            console.log('✅ [Amplify Init] Warmup inicial completado');
          });
        });
      } catch (error) {
        console.error('❌ [Amplify Init] Error verificando credenciales iniciales:', error);
      }
    }, 1000);
  });
}

/**
 * Componente que inicializa Amplify en client-side
 * Se monta en layout.tsx para configuración temprana
 */
export function ConfigureAmplifyClientSide() {
  return null;
}
