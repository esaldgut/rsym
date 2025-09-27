/**
 * Sanitizer para headers y metadata de uploads
 * Soluciona error: Cannot convert to ByteString
 */

/**
 * Sanitiza strings para ser compatibles con ByteString (ASCII 0-255)
 */
export function sanitizeForByteString(str: string): string {
  if (!str) return '';

  // Remover caracteres fuera del rango ASCII extendido (0-255)
  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code > 255) {
      // Reemplazar caracteres Unicode con su equivalente ASCII o underscore
      return '_';
    }
    return char;
  }).join('');
}

/**
 * Sanitiza el nombre del archivo
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return 'untitled';

  // Extraer extensión
  const lastDot = fileName.lastIndexOf('.');
  const extension = lastDot > 0 ? fileName.slice(lastDot) : '';
  const baseName = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;

  // Sanitizar base name
  const sanitizedBase = baseName
    .normalize('NFD') // Descomponer caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Solo caracteres seguros
    .substring(0, 100); // Limitar longitud

  // Sanitizar extensión
  const sanitizedExt = extension
    .replace(/[^a-zA-Z0-9.]/g, '')
    .substring(0, 10);

  return sanitizedBase + sanitizedExt;
}

/**
 * Sanitiza metadata para headers HTTP
 */
export function sanitizeMetadata(metadata: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Sanitizar key
    const sanitizedKey = sanitizeForByteString(key);

    // Sanitizar value
    let sanitizedValue = '';
    if (value === null || value === undefined) {
      sanitizedValue = '';
    } else if (typeof value === 'string') {
      sanitizedValue = sanitizeForByteString(value);
    } else {
      // Convertir a string y sanitizar
      sanitizedValue = sanitizeForByteString(String(value));
    }

    if (sanitizedKey && sanitizedValue) {
      sanitized[sanitizedKey] = sanitizedValue;
    }
  }

  return sanitized;
}

/**
 * Sanitiza todos los parámetros de upload
 */
export function sanitizeUploadParams(params: {
  key?: string;
  contentType?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}) {
  const sanitized = { ...params };

  if (sanitized.key) {
    sanitized.key = sanitizeFileName(sanitized.key);
  }

  if (sanitized.contentType) {
    sanitized.contentType = sanitizeForByteString(sanitized.contentType);
  }

  if (sanitized.metadata) {
    sanitized.metadata = sanitizeMetadata(sanitized.metadata);
  }

  return sanitized;
}