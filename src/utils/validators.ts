/**
 * Validadores de input para seguridad y sanitización
 *
 * Estos validadores previenen XSS, SQL injection y otros ataques
 * al sanitizar y validar todos los inputs del usuario
 */

/**
 * Valida que un string sea un UUID válido
 * Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Valida que un string sea un ID de producto válido
 * Acepta UUIDs y IDs alfanuméricos simples
 */
export function isValidProductId(value: string): boolean {
  if (!value || value.length > 100) return false;

  // UUID format
  if (isValidUUID(value)) return true;

  // Alphanumeric with hyphens and underscores (common ID formats)
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  return idRegex.test(value);
}

/**
 * Valida el tipo de producto
 */
export function isValidProductType(value: string): boolean {
  const validTypes = ['circuit', 'package'];
  return validTypes.includes(value);
}

/**
 * Sanitiza un string para prevenir XSS
 * Remueve caracteres peligrosos y HTML
 */
export function sanitizeString(value: string): string {
  if (!value) return '';

  // Remover tags HTML y scripts
  let sanitized = value.replace(/<[^>]*>/g, '');

  // Escapar caracteres especiales
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Limitar longitud
  return sanitized.substring(0, 1000);
}

/**
 * Valida y sanitiza query parameters para deep linking
 */
export interface ValidatedDeepLinkParams {
  productId?: string;
  productType?: 'circuit' | 'package';
  momentId?: string;
  category?: string;
  location?: string;
  maxPrice?: number;
  adults?: number;
  kids?: number;
  date?: string;
  source?: string;
  campaign?: string;
}

export function validateDeepLinkParams(params: URLSearchParams): ValidatedDeepLinkParams {
  const validated: ValidatedDeepLinkParams = {};

  // Product ID
  const productId = params.get('product');
  if (productId && isValidProductId(productId)) {
    validated.productId = productId;
  }

  // Product Type
  const productType = params.get('type');
  if (productType && isValidProductType(productType)) {
    validated.productType = productType as 'circuit' | 'package';
  }

  // Moment ID
  const momentId = params.get('moment');
  if (momentId && isValidProductId(momentId)) {
    validated.momentId = momentId;
  }

  // Category (sanitized string)
  const category = params.get('category');
  if (category) {
    validated.category = sanitizeString(category);
  }

  // Location (sanitized string)
  const location = params.get('location');
  if (location) {
    validated.location = sanitizeString(location);
  }

  // Max Price (positive number)
  const maxPrice = params.get('maxPrice');
  if (maxPrice) {
    const price = parseFloat(maxPrice);
    if (!isNaN(price) && price > 0 && price < 1000000) {
      validated.maxPrice = price;
    }
  }

  // Adults (positive integer)
  const adults = params.get('adults');
  if (adults) {
    const count = parseInt(adults, 10);
    if (!isNaN(count) && count > 0 && count <= 20) {
      validated.adults = count;
    }
  }

  // Kids (non-negative integer)
  const kids = params.get('kids');
  if (kids) {
    const count = parseInt(kids, 10);
    if (!isNaN(count) && count >= 0 && count <= 20) {
      validated.kids = count;
    }
  }

  // Date (ISO date format)
  const date = params.get('date');
  if (date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(date)) {
      validated.date = date;
    }
  }

  // UTM/Analytics parameters
  const source = params.get('utm_source') || params.get('source');
  if (source) {
    validated.source = sanitizeString(source).substring(0, 50);
  }

  const campaign = params.get('utm_campaign') || params.get('campaign');
  if (campaign) {
    validated.campaign = sanitizeString(campaign).substring(0, 100);
  }

  return validated;
}

/**
 * Valida si una URL es segura para redirección
 * Previene open redirect vulnerabilities
 */
export function isSafeRedirectUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);

    // Solo permitir HTTPS en producción
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return false;
    }

    // Lista blanca de dominios permitidos
    const allowedHosts = [
      'yaan.com.mx',
      'www.yaan.com.mx',
      'localhost:3000',
      'localhost:3001',
      'staging.yaan.com.mx'
    ];

    return allowedHosts.includes(parsed.host);
  } catch {
    // Si no es una URL válida, podría ser una ruta relativa
    // Solo permitir rutas relativas que empiecen con /
    return url.startsWith('/') && !url.startsWith('//');
  }
}

/**
 * Extrae y valida el host de una URL
 */
export function getValidatedHost(url?: string): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return '';
  }
}

/**
 * Crea una URL segura con query parameters validados
 */
export function createSafeUrl(
  basePath: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(basePath, 'https://yaan.com.mx');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Sanitizar key y value
      const safeKey = encodeURIComponent(key.substring(0, 50));
      const safeValue = encodeURIComponent(String(value).substring(0, 200));
      url.searchParams.set(safeKey, safeValue);
    }
  });

  return url.pathname + url.search;
}