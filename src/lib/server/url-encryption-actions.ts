/**
 * URL Encryption Server Actions
 *
 * Server Actions para operaciones de cifrado/descifrado de URLs del marketplace.
 * Estas funciones se ejecutan en el servidor y tienen acceso a:
 * - process.env.URL_ENCRYPTION_SECRET
 * - Módulo crypto de Node.js
 * - Sistema de archivos
 *
 * ARQUITECTURA:
 * - Client Components llaman a estas Server Actions
 * - El cifrado AES-256-GCM se ejecuta en servidor
 * - Secretos nunca se exponen al cliente
 *
 * @module url-encryption-actions
 */
'use server';

import {
  encryptProductUrlParam,
  decryptProductUrlParam,
  generateBookingUrl,
  type EncryptionResult,
  type DecryptionResult,
  type ProductUrlData
} from '@/utils/url-encryption';
import { logger } from '@/utils/logger';

/**
 * Server Action: Cifra los datos del producto para generar URL segura
 *
 * Esta función se ejecuta en el servidor y tiene acceso a la clave secreta
 * de cifrado (URL_ENCRYPTION_SECRET) que no está disponible en el cliente.
 *
 * @param productId - ID del producto (UUID o alfanumérico)
 * @param productName - Nombre del producto
 * @param productType - Tipo de producto ('circuit' o 'package')
 * @returns Resultado con string cifrado en Base64 URL-safe
 *
 * @example
 * ```typescript
 * // En Client Component
 * const result = await encryptProductUrlAction(
 *   product.id,
 *   product.name,
 *   'circuit'
 * );
 *
 * if (result.success && result.encrypted) {
 *   router.push(`/marketplace/booking?product=${result.encrypted}`);
 * }
 * ```
 */
export async function encryptProductUrlAction(
  productId: string,
  productName: string,
  productType: 'circuit' | 'package'
): Promise<EncryptionResult> {
  console.log('[Server Action] 🔐 encryptProductUrlAction iniciado:', {
    productId,
    productName,
    productType
  });

  try {
    // Ejecutar función de cifrado (tiene acceso a process.env y crypto)
    const result = encryptProductUrlParam(productId, productName, productType);

    if (result.success && result.encrypted) {
      console.log('[Server Action] ✅ Cifrado exitoso, longitud:', result.encrypted.length);
    } else {
      console.error('[Server Action] ❌ Error al cifrar:', result.error);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Server Action] ❌ Excepción al cifrar:', errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Server Action: Descifra un parámetro URL cifrado
 *
 * Útil para validación server-side o cuando necesitas acceder a los datos
 * del producto desde un Server Component.
 *
 * @param encryptedParam - String cifrado en Base64 URL-safe
 * @returns Resultado con datos del producto descifrados
 *
 * @example
 * ```typescript
 * // En Server Component
 * const result = await decryptProductUrlAction(encryptedParam);
 *
 * if (result.success && result.data) {
 *   const { productId, productName, productType } = result.data;
 * }
 * ```
 */
export async function decryptProductUrlAction(
  encryptedParam: string
): Promise<DecryptionResult> {
  console.log('[Server Action] 🔓 decryptProductUrlAction iniciado');

  try {
    const result = decryptProductUrlParam(encryptedParam);

    if (result.success && result.data) {
      console.log('[Server Action] ✅ Descifrado exitoso:', {
        productId: result.data.productId,
        productType: result.data.productType
      });
    } else {
      console.error('[Server Action] ❌ Error al descifrar:', result.error);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Server Action] ❌ Excepción al descifrar:', errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Server Action: Genera URL completa de booking cifrada
 *
 * Combina cifrado + construcción de URL en una sola operación.
 *
 * @param productId - ID del producto
 * @param productName - Nombre del producto
 * @param productType - Tipo de producto
 * @param baseUrl - URL base opcional (por defecto usa NEXT_PUBLIC_BASE_URL)
 * @returns URL completa o null si falla
 *
 * @example
 * ```typescript
 * const url = await generateBookingUrlAction(
 *   product.id,
 *   product.name,
 *   'package',
 *   'https://yaan.com.mx'
 * );
 *
 * if (url) {
 *   // Share URL o redirect
 * }
 * ```
 */
export async function generateBookingUrlAction(
  productId: string,
  productName: string,
  productType: 'circuit' | 'package',
  baseUrl?: string
): Promise<string | null> {
  console.log('[Server Action] 🔗 generateBookingUrlAction iniciado');

  try {
    const url = generateBookingUrl(productId, productName, productType, baseUrl);

    if (url) {
      console.log('[Server Action] ✅ URL generada exitosamente');
    } else {
      console.error('[Server Action] ❌ Falló generación de URL');
    }

    return url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Server Action] ❌ Excepción al generar URL:', errorMessage);
    return null;
  }
}
