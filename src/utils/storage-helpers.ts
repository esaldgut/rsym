import { getUrl, uploadData, remove } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import { withCredentialCheck } from './credential-manager';

/**
 * Utilidades para manejo de archivos usando AWS Amplify Storage
 * Usa APIs client-side nativas de Amplify Gen 2 con CookieStorage
 *
 * IMPORTANTE: Con CookieStorage nativo (NO HTTP-Only), estas APIs funcionan correctamente
 * porque el client puede acceder a tokens e Identity Pool credentials.
 *
 * Patrón: Client Components → Amplify Storage APIs → Identity Pool → S3
 *
 * ACTUALIZACIÓN: Ahora incluye verificación automática de credenciales para prevenir
 * el error "Credentials should not be empty" que ocurre durante token refresh.
 */

export interface StorageImageOptions {
  accessLevel?: 'guest' | 'private' | 'protected';
  expiresIn?: number; // segundos hasta expiración
  validateObjectExistence?: boolean;
}

/**
 * Obtiene una URL firmada de S3 usando Amplify Storage client-side
 * Funciona con CookieStorage nativo y credenciales de Identity Pool
 *
 * NOTA: Esta función es principalmente un FALLBACK para componentes que
 * no reciben URLs pre-firmadas del servidor. El patrón óptimo es usar
 * getSignedUrlServer() en Server Components y pasar URLs a Client Components.
 *
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

    console.log('🔐 [storage-helpers] Obteniendo URL firmada client-side (fallback):', path);

    // Obtener URL firmada usando Amplify Storage client-side
    // Sin withCredentialCheck porque:
    // 1. Es usado como fallback, no en el flujo principal
    // 2. El componente ProfileImage maneja errores gracefully
    // 3. El warmup inicial debería tener credenciales disponibles
    const result = await getUrl({
      path: path,
      options: {
        expiresIn: options.expiresIn || 3600, // 1 hora por defecto
        validateObjectExistence: options.validateObjectExistence ?? false
      }
    });

    console.log('✅ [storage-helpers] URL firmada obtenida exitosamente');
    return result.url.toString();

  } catch (error) {
    console.error('❌ [storage-helpers] Error obteniendo URL de imagen:', error);
    return null;
  }
}

/**
 * Sube una imagen de perfil a S3 usando Amplify Storage client-side
 * Funciona con CookieStorage nativo y getCurrentUser() client-side
 *
 * ACTUALIZACIÓN: Ahora verifica credenciales antes de intentar subir
 * para prevenir errores "Credentials should not be empty"
 *
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
  console.log('📤 [storage-helpers] Iniciando upload de imagen de perfil...');

  // Usar withCredentialCheck para asegurar que las credenciales estén disponibles
  const result = await withCredentialCheck(
    async () => {
      // Obtener usuario actual (funciona con CookieStorage nativo)
      const currentUser = await getCurrentUser();

      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();

      // Estructura: public/users/{username}/profile-images/{timestamp}.{ext}
      const path = `public/users/${currentUser.username}/profile-images/${timestamp}.${fileExtension}`;

      console.log(`📁 [storage-helpers] Subiendo a: ${path}`);

      // Subir archivo usando Amplify Storage client-side
      const uploadResult = await uploadData({
        path,
        data: file,
        options: {
          contentType: file.type,
          onProgress: options.onProgress
        }
      }).result;

      console.log('✅ [storage-helpers] Upload completado:', uploadResult.path);

      // IMPORTANTE: Refrescar tokens DESPUÉS del upload, NO durante
      // Esto previene race conditions con credenciales
      if (typeof window !== 'undefined') {
        import('@/lib/auth/token-interceptor').then(({ TokenInterceptor }) => {
          console.log('🔄 Imagen de perfil actualizada, refrescando tokens silenciosamente...');
          setTimeout(() => {
            TokenInterceptor.performSilentRefresh();
          }, 500);
        });
      }

      return uploadResult.path;
    },
    'uploadProfileImage'
  );

  return result;
}

/**
 * Elimina una imagen de S3 usando Amplify Storage client-side
 * Funciona con CookieStorage nativo y credenciales de Identity Pool
 *
 * ACTUALIZACIÓN: Ahora verifica credenciales antes de intentar eliminar
 * para prevenir errores "Credentials should not be empty"
 *
 * @param path - Path del archivo a eliminar
 * @param accessLevel - Nivel de acceso (no usado actualmente)
 * @returns true si se eliminó correctamente
 */
export async function deleteProfileImage(
  path: string,
  accessLevel: 'guest' | 'private' | 'protected' = 'protected'
): Promise<boolean> {
  console.log(`🗑️ [storage-helpers] Eliminando imagen: ${path}`);

  // Usar withCredentialCheck para asegurar que las credenciales estén disponibles
  const result = await withCredentialCheck(
    async () => {
      // Eliminar archivo usando Amplify Storage client-side
      await remove({
        path
      });

      console.log('✅ [storage-helpers] Imagen eliminada exitosamente');
      return true;
    },
    `deleteProfileImage(${path})`
  );

  return result !== null;
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