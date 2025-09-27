/**
 * Utilidades para transformar URLs completas de S3 a paths/keys
 * Reutilizable para todos los mutations de GraphQL
 */

import config from '../../../amplify/outputs.json';

/**
 * Extrae el path/key de S3 desde una URL completa
 * @param url URL completa de S3
 * @returns Solo el path/key o null si no es válida
 */
export function extractS3PathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    // Patrón para URLs de S3: https://bucket.s3.region.amazonaws.com/path
    const s3UrlPattern = new RegExp(
      `https://${config.storage.bucket_name}\\.s3\\.${config.storage.aws_region}\\.amazonaws\\.com/(.+)`
    );

    const match = url.match(s3UrlPattern);
    return match ? match[1] : url; // Si no es URL S3, retornar como está (puede ser ya un path)
  } catch (error) {
    console.warn('Error extracting S3 path from URL:', url, error);
    return url; // Fallback: retornar la URL original
  }
}

/**
 * Transforma un array de URLs a paths/keys
 * @param urls Array de URLs completas
 * @returns Array de paths/keys
 */
export function transformUrlArrayToPaths(urls: string[] | null | undefined): string[] {
  if (!urls || !Array.isArray(urls)) return [];

  return urls
    .map(url => extractS3PathFromUrl(url))
    .filter(Boolean) as string[];
}

/**
 * Transforma un objeto de producto de URLs a paths para GraphQL
 * Función principal para usar antes de mutations
 */
export function transformProductUrlsToPaths<T extends Record<string, any>>(input: T): T {
  const transformed = { ...input };

  // Transformar cover_image_url a path
  if (transformed.cover_image_url) {
    const coverPath = extractS3PathFromUrl(transformed.cover_image_url);
    if (coverPath) {
      transformed.cover_image_url = coverPath;
    }
  }

  // Transformar image_url array a paths
  if (transformed.image_url) {
    transformed.image_url = transformUrlArrayToPaths(transformed.image_url);
  }

  // Transformar video_url array a paths
  if (transformed.video_url) {
    transformed.video_url = transformUrlArrayToPaths(transformed.video_url);
  }

  console.log('🔄 URLs transformadas a paths para GraphQL:', {
    original: {
      cover_image_url: input.cover_image_url,
      image_url: input.image_url,
      video_url: input.video_url
    },
    transformed: {
      cover_image_url: transformed.cover_image_url,
      image_url: transformed.image_url,
      video_url: transformed.video_url
    }
  });

  return transformed;
}

/**
 * Función inversa: convierte paths a URLs completas para mostrar en UI
 * Útil cuando se recuperan datos de GraphQL
 */
export function transformPathsToUrls<T extends Record<string, any>>(data: T): T {
  const transformed = { ...data };

  // Transformar cover_image_url path a URL completa
  if (transformed.cover_image_url && !transformed.cover_image_url.startsWith('http')) {
    transformed.cover_image_url = `https://${config.storage.bucket_name}.s3.${config.storage.aws_region}.amazonaws.com/${transformed.cover_image_url}`;
  }

  // Transformar image_url paths a URLs completas
  if (transformed.image_url && Array.isArray(transformed.image_url)) {
    transformed.image_url = transformed.image_url.map((path: string) =>
      path.startsWith('http')
        ? path
        : `https://${config.storage.bucket_name}.s3.${config.storage.aws_region}.amazonaws.com/${path}`
    );
  }

  // Transformar video_url paths a URLs completas
  if (transformed.video_url && Array.isArray(transformed.video_url)) {
    transformed.video_url = transformed.video_url.map((path: string) =>
      path.startsWith('http')
        ? path
        : `https://${config.storage.bucket_name}.s3.${config.storage.aws_region}.amazonaws.com/${path}`
    );
  }

  return transformed;
}

/**
 * Hook para testing y debugging
 */
export function validateS3UrlTransformation(original: string, transformed: string): boolean {
  // Validar que la transformación sea correcta
  const isOriginalUrl = original.includes('amazonaws.com');
  const isTransformedPath = !transformed.includes('amazonaws.com');

  return isOriginalUrl ? isTransformedPath : true;
}