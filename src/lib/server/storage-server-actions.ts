'use server';

import outputs from '../../../amplify/outputs.json';

/**
 * Server Actions para Storage usando estrategia híbrida optimizada
 *
 * ESTRATEGIA:
 * 1. Archivos públicos (public/*) → URL directa del bucket S3 (sin credenciales)
 * 2. Archivos privados → null (client-side maneja con credentials)
 *
 * ARQUITECTURA:
 * - Para public/: Genera URL directa https://bucket.s3.region.amazonaws.com/path
 * - Para private/: Retorna null, delegando a client-side (ya funciona)
 * - No requiere credenciales del Identity Pool en server-side
 *
 * PATRÓN:
 * Server Component → getSignedUrlServer() → URL string o null → Client Component → <Image>
 *
 * BENEFICIOS:
 * - ✅ No requiere credenciales del Identity Pool para archivos públicos
 * - ✅ Funciona durante SSR sin errores
 * - ✅ Performance óptimo (no llamadas a AWS STS)
 * - ✅ Fallback automático a client-side para archivos privados
 */

export interface SignedUrlOptions {
  expiresIn?: number;           // Segundos hasta expiración (default: 3600 = 1h)
  validateObjectExistence?: boolean;  // Validar que el objeto existe en S3
}

export interface SignedUrlResult {
  url: string | null;
  error?: string;
}

/**
 * Genera una URL para un archivo en S3 usando estrategia híbrida
 *
 * ESTRATEGIA:
 * - Archivos public/* → URL pública directa del bucket (sin credenciales)
 * - Archivos privados → null (client-side maneja con Identity Pool)
 *
 * @param path - Path del archivo en S3 (ej: "public/users/username/profile-images/123.jpg")
 * @param options - Opciones de configuración (actualmente no usadas para public/)
 * @returns URL pública directa, o null para que client-side maneje
 */
export async function getSignedUrlServer(
  path: string | undefined | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: SignedUrlOptions = {} // Mantenido para consistencia API, no usado en estrategia actual
): Promise<string | null> {
  if (!path) {
    console.log('🔍 [Storage Server] Path vacío, retornando null');
    return null;
  }

  try {
    // Si ya es una URL HTTP completa, retornarla directamente
    if (path.startsWith('http://') || path.startsWith('https://')) {
      console.log('🔍 [Storage Server] Path ya es URL completa:', path);
      return path;
    }

    console.log('🔐 [Storage Server] Procesando path:', path);

    // ESTRATEGIA 1: Para archivos públicos, usar URL directa del bucket
    if (path.startsWith('public/')) {
      const bucketName = outputs.storage.bucket_name;
      const region = outputs.storage.aws_region;
      const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${path}`;

      console.log('✅ [Storage Server] URL pública directa generada:', {
        path,
        bucketName,
        region,
        strategy: 'public-direct-url'
      });

      return publicUrl;
    }

    // ESTRATEGIA 2: Para archivos privados, retornar null
    // El client-side manejará la generación con credenciales (ya funciona)
    console.log('⚠️ [Storage Server] Archivo privado detectado, delegando a client-side:', {
      path,
      strategy: 'client-side-fallback'
    });

    return null;

  } catch (error) {
    console.error('❌ [Storage Server] Error procesando path:', {
      path,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
    return null;
  }
}

/**
 * Genera múltiples URLs en paralelo usando estrategia híbrida
 * Útil para listas de imágenes (galleries, feeds, etc.)
 *
 * @param paths - Array de paths de archivos
 * @param options - Opciones de configuración compartidas
 * @returns Array de URLs (null para que client-side maneje)
 */
export async function getSignedUrlsServer(
  paths: (string | undefined | null)[],
  options: SignedUrlOptions = {}
): Promise<(string | null)[]> {
  console.log(`🔐 [Storage Server] Procesando ${paths.length} URLs en paralelo...`);

  const promises = paths.map(path => getSignedUrlServer(path, options));
  const results = await Promise.all(promises);

  const successCount = results.filter(url => url !== null).length;
  console.log(`✅ [Storage Server] ${successCount}/${paths.length} URLs públicas generadas`);

  return results;
}

/**
 * Genera URL para imagen de perfil
 * Wrapper de conveniencia para el caso de uso más común
 *
 * NOTA: Las imágenes de perfil están en public/, por lo que retorna URL directa
 *
 * @param path - Path de la imagen de perfil (ej: "public/users/email/profile-images/123.jpg")
 * @returns URL pública directa o null
 */
export async function getProfileImageUrlServer(
  path: string | undefined | null
): Promise<string | null> {
  return getSignedUrlServer(path, {
    // Opciones no usadas para public/, pero mantenidas para consistencia
    expiresIn: 7200,
    validateObjectExistence: false
  });
}
