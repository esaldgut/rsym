/**
 * URL Encryption Utility para /marketplace/booking
 *
 * Cifra y descifra parámetros de URL (productId + productName) para generar
 * URLs seguras y no predecibles en el marketplace.
 *
 * Patrón: /marketplace/booking?product=[encrypted]
 *
 * @module url-encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { isValidProductId, sanitizeString } from './validators';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Datos del producto para cifrar/descifrar
 */
export interface ProductUrlData {
  productId: string;
  productName: string;
  productType?: 'circuit' | 'package';
}

/**
 * Resultado de operación de cifrado
 */
export interface EncryptionResult {
  success: boolean;
  encrypted?: string;
  error?: string;
}

/**
 * Resultado de operación de descifrado
 */
export interface DecryptionResult {
  success: boolean;
  data?: ProductUrlData;
  error?: string;
}

/**
 * Error específico de cifrado
 */
export class EncryptionError extends Error {
  constructor(
    message: string,
    public readonly code: EncryptionErrorCode,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * Códigos de error de cifrado
 */
export type EncryptionErrorCode =
  | 'INVALID_INPUT'
  | 'ENCRYPTION_FAILED'
  | 'DECRYPTION_FAILED'
  | 'INVALID_ENCRYPTED_DATA'
  | 'MISSING_SECRET_KEY'
  | 'INVALID_SECRET_KEY';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

/**
 * Algoritmo de cifrado AES-256-GCM
 * - AES-256: Cifrado simétrico de grado militar
 * - GCM: Galois/Counter Mode - Proporciona autenticación
 */
const ALGORITHM = 'aes-256-gcm' as const;

/**
 * Longitud del IV (Initialization Vector) en bytes
 * GCM requiere 12 bytes (96 bits)
 */
const IV_LENGTH = 12;

/**
 * Longitud del auth tag en bytes
 * GCM auth tag es de 16 bytes (128 bits)
 */
const AUTH_TAG_LENGTH = 16;

/**
 * Separador para concatenar productId|productName|productType
 */
const SEPARATOR = '|';

/**
 * Obtiene la clave secreta de las variables de entorno
 * En producción, esta debe estar en AWS Secrets Manager o similar
 */
function getSecretKey(): Buffer {
  const secret = process.env.URL_ENCRYPTION_SECRET;

  if (!secret) {
    throw new EncryptionError(
      'URL_ENCRYPTION_SECRET no está configurada en variables de entorno',
      'MISSING_SECRET_KEY'
    );
  }

  // Validar que la clave tenga longitud adecuada
  if (secret.length < 32) {
    throw new EncryptionError(
      'URL_ENCRYPTION_SECRET debe tener al menos 32 caracteres',
      'INVALID_SECRET_KEY'
    );
  }

  // Derivar clave de 256 bits (32 bytes) usando SHA-256
  return createHash('sha256').update(secret).digest();
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Cifra los datos del producto para generar un parámetro URL seguro
 *
 * @param productId - ID del producto (UUID o string alfanumérico)
 * @param productName - Nombre del producto
 * @param productType - Tipo de producto (opcional)
 * @returns Resultado con string cifrado en Base64 URL-safe
 *
 * @example
 * ```typescript
 * const result = encryptProductUrlParam(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   'Circuito Mágico por Chiapas',
 *   'circuit'
 * );
 *
 * if (result.success && result.encrypted) {
 *   const url = `/marketplace/booking?product=${result.encrypted}`;
 * }
 * ```
 */
export function encryptProductUrlParam(
  productId: string,
  productName: string,
  productType?: 'circuit' | 'package'
): EncryptionResult {
  try {
    // 1. Validar inputs
    if (!productId || !productName) {
      return {
        success: false,
        error: 'productId y productName son requeridos'
      };
    }

    if (!isValidProductId(productId)) {
      return {
        success: false,
        error: 'productId no tiene formato válido'
      };
    }

    // 2. Sanitizar productName para evitar XSS
    const sanitizedName = sanitizeString(productName);
    if (!sanitizedName) {
      return {
        success: false,
        error: 'productName inválido después de sanitización'
      };
    }

    // 3. Construir payload: productId|productName|productType
    const payload = productType
      ? `${productId}${SEPARATOR}${sanitizedName}${SEPARATOR}${productType}`
      : `${productId}${SEPARATOR}${sanitizedName}`;

    // 4. Generar IV aleatorio (12 bytes para GCM)
    const iv = randomBytes(IV_LENGTH);

    // 5. Obtener clave secreta
    const key = getSecretKey();

    // 6. Crear cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // 7. Cifrar payload
    let encrypted = cipher.update(payload, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 8. Obtener auth tag (GCM authentication tag)
    const authTag = cipher.getAuthTag();

    // 9. Concatenar: IV + encrypted + authTag
    const combined = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'hex'),
      authTag
    ]);

    // 10. Convertir a Base64 URL-safe
    const base64 = combined
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return {
      success: true,
      encrypted: base64
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al cifrar';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Descifra un parámetro URL cifrado para obtener los datos del producto
 *
 * @param encryptedParam - String cifrado en Base64 URL-safe
 * @returns Resultado con datos del producto descifrados
 *
 * @example
 * ```typescript
 * const result = decryptProductUrlParam(encryptedString);
 *
 * if (result.success && result.data) {
 *   const { productId, productName, productType } = result.data;
 *   // Usar datos...
 * }
 * ```
 */
export function decryptProductUrlParam(
  encryptedParam: string
): DecryptionResult {
  try {
    // 1. Validar input
    if (!encryptedParam || typeof encryptedParam !== 'string') {
      return {
        success: false,
        error: 'Parámetro cifrado inválido'
      };
    }

    // 2. Convertir de Base64 URL-safe a Buffer
    const base64Standard = encryptedParam
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    let combined: Buffer;
    try {
      combined = Buffer.from(base64Standard, 'base64');
    } catch (error: unknown) {
      return {
        success: false,
        error: 'Formato de Base64 inválido'
      };
    }

    // 3. Validar longitud mínima (IV + data + authTag)
    const minLength = IV_LENGTH + AUTH_TAG_LENGTH + 1;
    if (combined.length < minLength) {
      return {
        success: false,
        error: 'Datos cifrados incompletos'
      };
    }

    // 4. Extraer componentes: IV + encrypted + authTag
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

    // 5. Obtener clave secreta
    const key = getSecretKey();

    // 6. Crear decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // 7. Descifrar
    let decrypted: string;
    try {
      decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');
    } catch (error: unknown) {
      return {
        success: false,
        error: 'Descifrado falló - datos corruptos o clave incorrecta'
      };
    }

    // 8. Parsear payload: productId|productName|productType
    const parts = decrypted.split(SEPARATOR);

    if (parts.length < 2) {
      return {
        success: false,
        error: 'Formato de payload inválido'
      };
    }

    const [productId, productName, productType] = parts;

    // 9. Validar productId
    if (!isValidProductId(productId)) {
      return {
        success: false,
        error: 'productId descifrado es inválido'
      };
    }

    // 10. Validar productType si existe
    if (productType && !['circuit', 'package'].includes(productType)) {
      return {
        success: false,
        error: 'productType descifrado es inválido'
      };
    }

    // 11. Construir resultado
    const data: ProductUrlData = {
      productId,
      productName,
      ...(productType && { productType: productType as 'circuit' | 'package' })
    };

    return {
      success: true,
      data
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al descifrar';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Genera una URL completa de booking cifrada
 *
 * @param productId - ID del producto
 * @param productName - Nombre del producto
 * @param productType - Tipo de producto
 * @param baseUrl - URL base (opcional, por defecto usa NEXT_PUBLIC_BASE_URL)
 * @returns URL completa o null si falla
 *
 * @example
 * ```typescript
 * const url = generateBookingUrl(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   'Tour Barrancas del Cobre',
 *   'circuit'
 * );
 * // Returns: "https://yaan.com.mx/marketplace/booking?product=ABC123..."
 * ```
 */
export function generateBookingUrl(
  productId: string,
  productName: string,
  productType: 'circuit' | 'package',
  baseUrl?: string
): string | null {
  const result = encryptProductUrlParam(productId, productName, productType);

  if (!result.success || !result.encrypted) {
    console.error('[url-encryption] Failed to generate booking URL:', result.error);
    return null;
  }

  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://yaan.com.mx';
  return `${base}/marketplace/booking?product=${result.encrypted}`;
}

/**
 * Valida que un parámetro cifrado sea válido sin descifrarlo completamente
 * Útil para validación rápida antes de operaciones costosas
 *
 * @param encryptedParam - String cifrado
 * @returns true si el formato es válido
 */
export function isValidEncryptedParam(encryptedParam: string): boolean {
  if (!encryptedParam || typeof encryptedParam !== 'string') {
    return false;
  }

  // Validar caracteres permitidos en Base64 URL-safe
  const base64UrlSafeRegex = /^[A-Za-z0-9\-_]+$/;
  if (!base64UrlSafeRegex.test(encryptedParam)) {
    return false;
  }

  // Validar longitud mínima razonable
  // IV (12) + min payload (10) + authTag (16) = 38 bytes
  // En Base64: 38 * 4/3 ≈ 51 caracteres
  if (encryptedParam.length < 50) {
    return false;
  }

  return true;
}
