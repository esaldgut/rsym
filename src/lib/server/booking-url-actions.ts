/**
 * Server Actions para Booking URLs
 *
 * Proporciona funciones server-side para generar URLs cifradas de booking.
 * Esto mantiene URL_ENCRYPTION_SECRET segura en el servidor, sin exponerla al cliente.
 *
 * @module booking-url-actions
 */

'use server';

import { generateBookingUrl, encryptProductUrlParam } from '@/utils/url-encryption';

/**
 * Server Action: Genera URL completa de booking cifrada
 *
 * Esta función se ejecuta en el servidor, donde tiene acceso a URL_ENCRYPTION_SECRET.
 * Los Client Components pueden llamarla de forma segura sin exponer la secret key.
 *
 * @param productId - ID del producto
 * @param productName - Nombre del producto
 * @param productType - Tipo de producto ('circuit' | 'package')
 * @param baseUrl - URL base opcional (por defecto usa NEXT_PUBLIC_BASE_URL)
 * @returns URL completa cifrada o null si falla
 *
 * @example
 * ```typescript
 * // Desde un Client Component
 * const url = await generateBookingUrlAction(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   'Circuito Mágico por Chiapas',
 *   'circuit'
 * );
 *
 * if (url) {
 *   router.push(url);
 * }
 * ```
 */
export async function generateBookingUrlAction(
  productId: string,
  productName: string,
  productType: 'circuit' | 'package',
  baseUrl?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('🔐 [SERVER ACTION] generateBookingUrlAction:', {
      productId,
      productName,
      productType
    });

    const url = generateBookingUrl(productId, productName, productType, baseUrl);

    if (url) {
      console.log('✅ [SERVER ACTION] URL cifrada generada exitosamente');
      return { success: true, url };
    }

    console.error('❌ [SERVER ACTION] generateBookingUrl retornó null');
    return {
      success: false,
      error: 'Failed to generate booking URL'
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al generar URL de booking';

    console.error('❌ [SERVER ACTION] Error generating booking URL:', errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Server Action: Cifra parámetros de producto para URL
 *
 * Versión más granular que retorna solo el parámetro cifrado.
 *
 * @param productId - ID del producto
 * @param productName - Nombre del producto
 * @param productType - Tipo de producto
 * @returns Parámetro cifrado o null si falla
 *
 * @example
 * ```typescript
 * const encrypted = await encryptProductParamAction(id, name, 'circuit');
 * const url = `/marketplace/booking?product=${encrypted}`;
 * ```
 */
export async function encryptProductParamAction(
  productId: string,
  productName: string,
  productType?: 'circuit' | 'package'
): Promise<{ success: boolean; encrypted?: string; error?: string }> {
  try {
    console.log('🔐 [SERVER ACTION] encryptProductParamAction:', {
      productId,
      productName,
      productType
    });

    const result = encryptProductUrlParam(productId, productName, productType);

    if (result.success && result.encrypted) {
      console.log('✅ [SERVER ACTION] Parámetro cifrado exitosamente');
      return {
        success: true,
        encrypted: result.encrypted
      };
    }

    console.error('❌ [SERVER ACTION] Encryption failed:', result.error);
    return {
      success: false,
      error: result.error || 'Encryption failed'
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al cifrar parámetro';

    console.error('❌ [SERVER ACTION] Error encrypting param:', errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}
