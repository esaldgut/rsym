/**
 * Utilidades para manejo de URLs de imágenes de S3
 */

/**
 * Construye una URL completa de S3 a partir de una ruta parcial
 * @param path - Ruta parcial del bucket S3 (ej: "a881c300-b031-7013-61f8-cf200c2b2c38/images/81515821-7DD8-46EA-90AF-E9741BEDD49.jpg")
 * @returns URL completa válida o null si la ruta es inválida
 */
export function buildS3ImageUrl(path?: string): string | null {
  if (!path) return null;

  // Si ya es una URL completa, retornarla
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Configuración del bucket S3 - esto debería venir de variables de entorno
  const S3_BUCKET_DOMAIN = process.env.NEXT_PUBLIC_S3_BUCKET_URL || 'https://yaan-provider-documents.s3.amazonaws.com';
  
  // Limpiar la ruta de posibles barras iniciales
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Construir URL completa
  const fullUrl = `${S3_BUCKET_DOMAIN}/${cleanPath}`;
  
  // Validar que sea una URL válida
  try {
    new URL(fullUrl);
    return fullUrl;
  } catch {
    console.error('URL de imagen inválida:', fullUrl);
    return null;
  }
}

/**
 * Verifica si una URL de imagen es válida
 * @param url - URL a validar
 * @returns true si es válida, false en caso contrario
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    // Verificar que sea HTTP o HTTPS
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}