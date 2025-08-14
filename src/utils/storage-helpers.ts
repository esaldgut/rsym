import { getUrl, uploadData, remove } from 'aws-amplify/storage';

/**
 * Utilidades para manejo de imágenes usando AWS Amplify Storage
 * Siguiendo AWS Well-Architected Framework
 */

export interface StorageImageOptions {
  accessLevel?: 'guest' | 'private' | 'protected';
  expiresIn?: number; // segundos hasta expiración
  validateObjectExistence?: boolean;
}

/**
 * Obtiene una URL firmada de S3 usando Amplify Storage
 * @param path - Path del archivo en S3 (key)
 * @param options - Opciones de configuración
 * @returns URL firmada con acceso temporal o null si falla
 */
export async function getSignedImageUrl(
  path: string | undefined | null,
  options: StorageImageOptions = {}
): Promise<string | null> {
  if (!path) return null;

  try {
    // Si ya es una URL HTTP completa, retornarla
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Obtener URL firmada usando Amplify Storage
    const result = await getUrl({
      path: path,
      options: {
        accessLevel: options.accessLevel || 'guest',
        expiresIn: options.expiresIn || 900, // 15 minutos por defecto
        validateObjectExistence: options.validateObjectExistence ?? true
      }
    });

    return result.url.toString();
  } catch (error) {
    console.error('Error obteniendo URL de imagen:', error);
    return null;
  }
}

/**
 * Sube una imagen a S3 usando Amplify Storage
 * @param file - Archivo a subir
 * @param path - Path donde guardar en S3
 * @param options - Opciones de configuración
 * @returns Path del archivo subido o null si falla
 */
export async function uploadProfileImage(
  file: File,
  userId: string,
  options: {
    accessLevel?: 'guest' | 'private' | 'protected';
    onProgress?: (progress: { transferredBytes: number; totalBytes?: number }) => void;
  } = {}
): Promise<string | null> {
  try {
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const path = `profiles/${userId}/avatar-${timestamp}.${fileExtension}`;

    const result = await uploadData({
      path,
      data: file,
      options: {
        accessLevel: options.accessLevel || 'protected',
        contentType: file.type,
        onProgress: options.onProgress
      }
    }).result;

    return result.path;
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    return null;
  }
}

/**
 * Elimina una imagen de S3
 * @param path - Path del archivo a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteProfileImage(
  path: string,
  accessLevel: 'guest' | 'private' | 'protected' = 'protected'
): Promise<boolean> {
  try {
    await remove({
      path,
      options: {
        accessLevel
      }
    });
    return true;
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    return false;
  }
}

/**
 * Genera un path seguro para archivos
 * @param userId - ID del usuario
 * @param type - Tipo de archivo
 * @param fileName - Nombre original del archivo
 * @returns Path seguro para S3
 */
export function generateSecurePath(
  userId: string,
  type: 'profile' | 'document' | 'moment',
  fileName: string
): string {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  return `${type}s/${userId}/${timestamp}-${randomString}-${sanitizedFileName}`;
}