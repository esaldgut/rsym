'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { getAuthenticatedUser, getIdTokenServer } from '@/utils/amplify-server-utils';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../amplify/outputs.json';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export interface S3UploadResponse {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Generar path S3 según estructura definida
 */
function generateS3Path(userId: string, folder: string, fileName: string): string {
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  
  // Estructura: /public/products/{user_id}/images/ o /public/products/{user_id}/videos/
  return `public/products/${userId}/${folder}/${uniqueFileName}`;
}

/**
 * Validar tipo de archivo
 */
function validateFileType(fileName: string, allowedTypes: string[]): boolean {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  return fileExtension ? allowedTypes.includes(fileExtension) : false;
}

/**
 * Obtener cliente S3 con credenciales autenticadas usando la configuración correcta
 */
async function getS3Client(): Promise<S3Client> {
  const idToken = await getIdTokenServer();
  
  if (!idToken) {
    throw new Error('Token de autenticación requerido');
  }

  return new S3Client({
    region: config.storage.aws_region,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: config.storage.aws_region }),
      identityPoolId: config.auth.identity_pool_id,
      logins: {
        [`cognito-idp.${config.auth.aws_region}.amazonaws.com/${config.auth.user_pool_id}`]: idToken
      }
    })
  });
}

/**
 * Generar URL pública del archivo
 */
function generatePublicUrl(key: string): string {
  return `https://${config.storage.bucket_name}.s3.${config.storage.aws_region}.amazonaws.com/${key}`;
}

/**
 * Server Action: Subir archivo a S3
 */
export async function uploadToS3Action(formData: FormData): Promise<S3UploadResponse> {
  try {
    console.log('📤 [AmplifyS3] Iniciando subida con Amplify v6 Gen 2...');

    // 1. Verificar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      redirect('/auth?error=authentication_required');
    }

    // 2. Verificar que es provider
    if (user.userType !== 'provider') {
      return {
        success: false,
        error: 'Solo los proveedores pueden subir archivos'
      };
    }

    // 3. Obtener archivo del FormData
    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        error: 'No se proporcionó ningún archivo'
      };
    }

    // 4. Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `El archivo es demasiado grande. Máximo permitido: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // 5. Determinar tipo de archivo y carpeta
    const fileName = file.name;
    const folder = formData.get('folder') as string || 'images';
    
    let allowedTypes: string[] = [];
    
    if (folder === 'images') {
      allowedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    } else if (folder === 'videos') {
      allowedTypes = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    } else {
      return {
        success: false,
        error: 'Tipo de carpeta no válido'
      };
    }

    // 6. Validar tipo de archivo
    if (!validateFileType(fileName, allowedTypes)) {
      return {
        success: false,
        error: `Tipo de archivo no permitido. Formatos aceptados: ${allowedTypes.join(', ')}`
      };
    }

    // 7. Generar path S3
    const userId = user.sub || user.userId;
    const s3Key = generateS3Path(userId, folder, fileName);
    
    console.log('📍 [AmplifyS3] Subiendo a:', s3Key);

    // 8. Convertir archivo a buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 9. Determinar Content-Type
    let contentType = file.type;
    if (!contentType) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'mp4':
          contentType = 'video/mp4';
          break;
        case 'mov':
          contentType = 'video/quicktime';
          break;
        case 'avi':
          contentType = 'video/x-msvideo';
          break;
        case 'mkv':
          contentType = 'video/x-matroska';
          break;
        case 'webm':
          contentType = 'video/webm';
          break;
        default:
          contentType = 'application/octet-stream';
      }
    }

    // 10. Configurar comando de S3
    const putCommand = new PutObjectCommand({
      Bucket: config.storage.bucket_name,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        'uploaded-by': userId,
        'original-filename': fileName,
        'upload-timestamp': new Date().toISOString(),
        folder
      }
    });

    // 11. Obtener cliente S3 autenticado y subir archivo
    const s3Client = await getS3Client();
    await s3Client.send(putCommand);

    // 12. Generar URL pública
    const publicUrl = generatePublicUrl(s3Key);
    
    console.log('✅ [AmplifyS3] Archivo subido exitosamente:', publicUrl);

    return {
      success: true,
      url: publicUrl,
      key: s3Key
    };

  } catch (error) {
    console.error('💥 [AmplifyS3] Error inesperado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action: Subir imagen específicamente
 */
export async function uploadImageAction(formData: FormData): Promise<S3UploadResponse> {
  formData.set('folder', 'images');
  return uploadToS3Action(formData);
}

/**
 * Server Action: Subir video específicamente  
 */
export async function uploadVideoAction(formData: FormData): Promise<S3UploadResponse> {
  formData.set('folder', 'videos');
  return uploadToS3Action(formData);
}