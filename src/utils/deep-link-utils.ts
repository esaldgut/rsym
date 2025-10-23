/**
 * Utilidades para Deep Linking y detección de app móvil
 *
 * Este módulo proporciona funcionalidades para:
 * 1. Detectar si el usuario está en un dispositivo móvil
 * 2. Generar URLs de deep linking para la app móvil
 * 3. Manejar fallbacks cuando la app no está instalada
 */

/**
 * Detecta si el usuario está en un dispositivo móvil
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone'
  ];

  return mobileKeywords.some(keyword => userAgent.includes(keyword));
}

/**
 * Detecta si es un dispositivo iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Detecta si es un dispositivo Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes('android');
}

/**
 * Obtiene la URL base según el environment
 */
function getBaseUrl(): string {
  // En el cliente, usar window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // En el servidor, usar variables de entorno
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Fallbacks por environment
  if (process.env.NODE_ENV === 'production') {
    return 'https://yaan.com.mx';
  }

  return 'http://localhost:3000';
}

/**
 * Genera una URL de deep link para la app móvil
 */
export function generateDeepLink(path: string, params?: Record<string, string>): string {
  const baseUrl = 'yaan://';
  let deepLink = baseUrl + path.replace(/^\//, ''); // Remove leading slash

  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    deepLink += '?' + queryString;
  }

  return deepLink;
}

/**
 * Genera la URL de la tienda de aplicaciones correspondiente
 */
export function getAppStoreUrl(): string {
  if (isIOS()) {
    // TODO: Reemplazar con el ID real de la App Store
    return 'https://apps.apple.com/app/yaan/id[APP_STORE_ID]';
  } else if (isAndroid()) {
    // TODO: Reemplazar con el package name real
    return 'https://play.google.com/store/apps/details?id=com.yaan.app';
  }

  // Fallback: página de landing con ambos enlaces
  return 'https://yaan.com.mx/download-app';
}

/**
 * Intenta abrir la app móvil, con fallback a la tienda si no está instalada
 *
 * @param deepLink - La URL de deep link (yaan://...)
 * @param fallbackUrl - URL de fallback (tienda de apps o web)
 */
export function attemptDeepLink(deepLink: string, fallbackUrl?: string) {
  if (typeof window === 'undefined') return;

  const timeout = 2500; // Tiempo de espera para detectar si la app está instalada
  let timer: NodeJS.Timeout;

  // Handler para limpiar el timer
  const handleVisibilityChange = () => {
    if (document.hidden) {
      clearTimeout(timer);
      // Remover el listener una vez usado
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };

  // Intentar abrir la app
  window.location.href = deepLink;

  // Si después del timeout seguimos en el navegador,
  // significa que la app no está instalada
  timer = setTimeout(() => {
    // Verificar si el documento sigue visible
    // Si la app se abrió, el documento estará oculto
    if (!document.hidden) {
      window.location.href = fallbackUrl || getAppStoreUrl();
    }
    // Limpiar el listener si no se usó
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, timeout);

  // Agregar listener con cleanup
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Genera URLs compartibles con deep linking
 * Incluye tanto la URL web como el deep link para apps
 */
export interface ShareableUrls {
  webUrl: string;
  deepLink: string;
  universalLink: string; // Para iOS Universal Links
}

export function generateShareableUrls(
  path: string,
  params?: Record<string, string>
): ShareableUrls {
  const baseWebUrl = getBaseUrl();

  // Construir URL web
  let webUrl = baseWebUrl + path;
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    webUrl += '?' + queryString;
  }

  // Deep link para apps (esquema personalizado)
  const deepLink = generateDeepLink(path, params);

  // Universal link (mismo que web URL, la app lo interceptará)
  const universalLink = webUrl;

  return {
    webUrl,
    deepLink,
    universalLink
  };
}

/**
 * Detecta si el usuario viene desde la app móvil
 * Busca un query parameter especial que la app puede incluir
 */
export function isFromMobileApp(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.get('from_app') === 'true' || params.get('source') === 'mobile_app';
}

/**
 * Extrae el contexto de deep linking de la URL actual
 * Útil para entender desde dónde llegó el usuario
 */
export interface DeepLinkContext {
  isDeepLink: boolean;
  source?: 'direct' | 'app' | 'social' | 'email' | 'qr';
  campaign?: string;
  referrer?: string;
}

export function getDeepLinkContext(): DeepLinkContext {
  if (typeof window === 'undefined') {
    return { isDeepLink: false };
  }

  const params = new URLSearchParams(window.location.search);

  // Detectar parámetros de deep linking
  const source = params.get('utm_source') || params.get('source');
  const campaign = params.get('utm_campaign') || params.get('campaign');
  const referrer = params.get('referrer');

  // Determinar si es un deep link basado en los parámetros
  const isDeepLink = Boolean(
    params.get('from_app') ||
    params.get('product') ||
    params.get('moment') ||
    source === 'mobile_app'
  );

  return {
    isDeepLink,
    source: (source as DeepLinkContext['source']) || 'direct',
    campaign: campaign || undefined,
    referrer: referrer || undefined
  };
}

/**
 * Guarda el deep link original para uso posterior
 * Útil para deferred deep linking después del onboarding
 */
const DEFERRED_LINK_KEY = 'yaan_deferred_deep_link';

export function saveDeferredDeepLink(url: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(DEFERRED_LINK_KEY, url);
  }
}

export function getDeferredDeepLink(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(DEFERRED_LINK_KEY);
}

export function clearDeferredDeepLink(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(DEFERRED_LINK_KEY);
  }
}