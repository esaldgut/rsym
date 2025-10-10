import { getUrl, uploadData, remove } from 'aws-amplify/storage';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

/**
 * Utilidades para manejo de archivos usando AWS Amplify Storage
 * Implementa estrategia dual:
 * - Amplify uploadData: Archivos < 10MB (avatares, thumbnails)
 * - Multipart/Streaming: Archivos > 10MB (videos, paquetes grandes)
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

    // CRÍTICO: Para accessLevel 'protected' o 'private', verificar sesión válida primero
    const accessLevel = options.accessLevel || 'protected';
    if (accessLevel === 'protected' || accessLevel === 'private') {
      try {
        // Verificar que tenemos una sesión válida con identity ID
        const session = await fetchAuthSession();

        if (!session.identityId) {
          console.warn('⚠️ No hay identity ID, intentando refresh de sesión...');
          // Intentar refresh forzado una sola vez
          const refreshedSession = await fetchAuthSession({ forceRefresh: true });

          if (!refreshedSession.identityId) {
            console.error('❌ No se pudo obtener identity ID después del refresh');
            return null;
          }
        }
      } catch (authError) {
        console.error('❌ Error verificando sesión para Storage:', authError);
        return null;
      }
    }

    // Obtener URL firmada usando Amplify Storage
    const result = await getUrl({
      path: path,
      options: {
        accessLevel,
        expiresIn: options.expiresIn || 3600, // 1 hora por defecto
        validateObjectExistence: options.validateObjectExistence ?? false // No validar para evitar errores
      }
    });

    return result.url.toString();
  } catch (error) {
    console.error('Error obteniendo URL de imagen:', error);
    return null;
  }
}

/**
 * Sube una imagen de perfil a S3 siguiendo la estructura establecida
 * Estructura: public/users/{username}/profile-images/{timestamp}.{ext}
 * @param file - Archivo a subir
 * @param options - Opciones de configuración
 * @returns Path del archivo subido o null si falla
 */
export async function uploadProfileImage(
  file: File,
  options: {
    accessLevel?: 'guest' | 'private' | 'protected';
    onProgress?: (progress: { transferredBytes: number; totalBytes?: number }) => void;
  } = {}
): Promise<string | null> {
  try {
    // Obtener el usuario actual para usar su username
    const currentUser = await getCurrentUser();
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    
    // Estructura según prompt-2: public/users/{username}/profile-images/{timestamp}.{ext}
    const path = `public/users/${currentUser.username}/profile-images/${timestamp}.${fileExtension}`;

    const result = await uploadData({
      path,
      data: file,
      options: {
        accessLevel: options.accessLevel || 'protected',
        contentType: file.type,
        onProgress: options.onProgress
      }
    }).result;

    // Refrescar tokens después de actualizar la imagen de perfil
    // La imagen de perfil es considerada un cambio importante que requiere refresh
    if (typeof window !== 'undefined') {
      // Importar dinámicamente para evitar problemas en SSR
      import('@/lib/auth/token-interceptor').then(({ TokenInterceptor }) => {
        console.log('🔄 Imagen de perfil actualizada, refrescando tokens silenciosamente...');
        // Usar refresh silencioso sin recargar la página
        setTimeout(() => {
          TokenInterceptor.performSilentRefresh();
        }, 500);
      });
    }

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