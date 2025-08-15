import { getUrl, uploadData, remove } from 'aws-amplify/storage';
import { updateUserAttributes, fetchAuthSession } from 'aws-amplify/auth';

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
        accessLevel: options.accessLevel || 'protected',
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
 * Sube una imagen a S3 usando Amplify Storage
 * @param file - Archivo a subir
 * @param path - Path donde guardar en S3
 * @param options - Opciones de configuración
 * @returns Path del archivo subido o null si falla
 */
export async function uploadProfileImage(
  file: File,
  userId?: string,
  options: {
    accessLevel?: 'guest' | 'private' | 'protected';
    onProgress?: (progress: { transferredBytes: number; totalBytes?: number }) => void;
  } = {}
): Promise<string | null> {
  try {
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const path = userId 
      ? `profiles/${userId}/avatar-${timestamp}.${fileExtension}`
      : `profiles/avatar-${timestamp}.${fileExtension}`;

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

/**
 * Sube imagen de perfil, actualiza Cognito y refresca el token ID
 * @param file - Archivo de imagen a subir
 * @param userId - ID del usuario (opcional, se obtiene automáticamente si no se proporciona)
 * @param options - Opciones de configuración
 * @returns Path de la imagen subida o null si falla
 */
export async function uploadAndUpdateProfileImage(
  file: File,
  userId?: string,
  options: {
    accessLevel?: 'guest' | 'private' | 'protected';
    onProgress?: (progress: { transferredBytes: number; totalBytes?: number }) => void;
    onCognitoUpdate?: () => void;
    onTokenRefresh?: () => void;
  } = {}
): Promise<string | null> {
  try {
    console.log('🚀 Iniciando flujo completo de actualización de imagen de perfil');
    
    // 1. Subir imagen a S3
    console.log('📤 Subiendo imagen a S3...');
    const imagePath = await uploadProfileImage(file, userId, {
      accessLevel: options.accessLevel,
      onProgress: options.onProgress
    });
    
    if (!imagePath) {
      console.error('❌ Error: No se pudo subir la imagen a S3');
      return null;
    }
    
    console.log('✅ Imagen subida exitosamente a S3:', imagePath);
    
    // 2. Actualizar atributo en Cognito
    console.log('🔄 Actualizando atributo custom:profilePhotoPath en Cognito...');
    await updateUserAttributes({
      userAttributes: {
        'custom:profilePhotoPath': imagePath
      }
    });
    
    console.log('✅ Atributo custom:profilePhotoPath actualizado en Cognito');
    options.onCognitoUpdate?.();
    
    // 3. Refrescar la sesión para obtener el nuevo ID token
    console.log('🔄 Refrescando ID token con nuevos atributos...');
    await fetchAuthSession({ forceRefresh: true });
    
    console.log('✅ ID token refrescado exitosamente');
    options.onTokenRefresh?.();
    
    console.log('🎉 Flujo completo de actualización completado exitosamente');
    return imagePath;
    
  } catch (error) {
    console.error('❌ Error en el flujo de actualización de imagen de perfil:', error);
    return null;
  }
}