'use server';

import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListPartsCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { getAuthenticatedUser, getIdTokenServer } from '@/utils/amplify-server-utils';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../amplify/outputs.json';

/**
 * Server Actions para Multipart Upload de Archivos Grandes
 * Siguiendo AWS Best Practices y patrón SSR/Server Actions
 */

// Cache temporal para gestionar uploads en progreso (en producción usar Redis/DynamoDB)
const uploadSessions = new Map<string, {
  uploadId: string;
  key: string;
  parts: Array<{ ETag: string; PartNumber: number }>;
  userId: string;
  createdAt: Date;
}>();

// Configuración de S3 Client reutilizable
async function getS3Client() {
  const idToken = await getIdTokenServer();
  if (!idToken) {
    throw new Error('Usuario no autenticado');
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
 * Server Action: Inicializar upload multipart
 * @param fileName Nombre del archivo
 * @param fileType Tipo MIME del archivo
 * @param fileSize Tamaño en bytes
 * @param folder Carpeta destino (images/videos/documents)
 * @returns Session ID y configuración del upload
 */
export async function initializeMultipartUpload(
  fileName: string,
  fileType: string,
  fileSize: number,
  folder: string = 'uploads'
) {
  console.log('🚀 [Server Action] Iniciando multipart upload para:', fileName);

  try {
    // Verificar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const userId = user.sub || user.userId || 'anonymous';
    
    // Validar tipo de archivo según carpeta
    const allowedTypes: Record<string, string[]> = {
      images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      videos: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
      documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    const allowed = allowedTypes[folder] || [...allowedTypes.images, ...allowedTypes.videos, ...allowedTypes.documents];
    
    if (!allowed.includes(fileType)) {
      throw new Error(`Tipo de archivo no permitido: ${fileType}`);
    }

    // Validar tamaño (máximo 5GB para S3)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (fileSize > maxSize) {
      throw new Error('Archivo excede el límite de 5GB');
    }

    // Generar path único en S3
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `public/products/${userId}/${folder}/${uniqueFileName}`;

    // Obtener cliente S3
    const s3Client = await getS3Client();

    // Iniciar multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: config.storage.bucket_name,
      Key: s3Key,
      ContentType: fileType,
      Metadata: {
        'original-filename': fileName,
        'uploaded-by': userId,
        'upload-timestamp': new Date().toISOString(),
        'file-size': fileSize.toString()
      }
    });

    const { UploadId } = await s3Client.send(createCommand);
    
    if (!UploadId) {
      throw new Error('No se pudo inicializar el upload');
    }

    // Crear sesión de upload
    const sessionId = uuidv4();
    uploadSessions.set(sessionId, {
      uploadId: UploadId,
      key: s3Key,
      parts: [],
      userId,
      createdAt: new Date()
    });

    // Calcular configuración de chunks
    const chunkSize = calculateOptimalChunkSize(fileSize);
    const totalChunks = Math.ceil(fileSize / chunkSize);

    console.log('✅ [Server Action] Upload inicializado:', {
      sessionId,
      key: s3Key,
      totalChunks,
      chunkSize
    });

    // Limpiar sesiones antiguas (más de 24 horas)
    cleanupOldSessions();

    return {
      success: true,
      sessionId,
      uploadId: UploadId,
      key: s3Key,
      chunkSize,
      totalChunks,
      bucketName: config.storage.bucket_name,
      region: config.storage.aws_region
    };

  } catch (error) {
    console.error('❌ [Server Action] Error iniciando upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error iniciando upload'
    };
  }
}

/**
 * Server Action: Subir un chunk del archivo
 * @param sessionId ID de la sesión de upload
 * @param chunkData Datos del chunk en base64
 * @param chunkNumber Número del chunk (1-based)
 * @returns Confirmación del chunk subido
 */
export async function uploadChunk(
  sessionId: string,
  chunkData: string, // Base64 encoded
  chunkNumber: number
) {
  console.log(`📤 [Server Action] Subiendo chunk ${chunkNumber} para sesión ${sessionId}`);

  try {
    // Obtener sesión
    const session = uploadSessions.get(sessionId);
    if (!session) {
      throw new Error('Sesión de upload no encontrada o expirada');
    }

    // Verificar autenticación
    const user = await getAuthenticatedUser();
    if (!user || (user.sub || user.userId) !== session.userId) {
      throw new Error('Usuario no autorizado para este upload');
    }

    // Convertir base64 a Buffer
    const buffer = Buffer.from(chunkData, 'base64');
    
    // Validar tamaño del chunk (mínimo 5MB excepto el último)
    if (buffer.length < 5 * 1024 * 1024 && chunkNumber < session.parts.length) {
      console.warn('⚠️ Chunk menor a 5MB detectado (no es el último)');
    }

    // Obtener cliente S3
    const s3Client = await getS3Client();

    // Subir parte
    const uploadPartCommand = new UploadPartCommand({
      Bucket: config.storage.bucket_name,
      Key: session.key,
      UploadId: session.uploadId,
      PartNumber: chunkNumber,
      Body: buffer
    });

    const { ETag } = await s3Client.send(uploadPartCommand);
    
    if (!ETag) {
      throw new Error('No se pudo subir el chunk');
    }

    // Guardar información de la parte
    session.parts[chunkNumber - 1] = {
      ETag,
      PartNumber: chunkNumber
    };

    console.log(`✅ [Server Action] Chunk ${chunkNumber} subido exitosamente`);

    return {
      success: true,
      chunkNumber,
      etag: ETag,
      partsUploaded: session.parts.filter(p => p).length
    };

  } catch (error) {
    console.error(`❌ [Server Action] Error subiendo chunk ${chunkNumber}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error subiendo chunk'
    };
  }
}

/**
 * Server Action: Completar upload multipart
 * @param sessionId ID de la sesión de upload
 * @returns URL final del archivo subido
 */
export async function completeMultipartUpload(sessionId: string) {
  console.log('🏁 [Server Action] Completando multipart upload:', sessionId);

  try {
    // Obtener sesión
    const session = uploadSessions.get(sessionId);
    if (!session) {
      throw new Error('Sesión de upload no encontrada');
    }

    // Verificar autenticación
    const user = await getAuthenticatedUser();
    if (!user || (user.sub || user.userId) !== session.userId) {
      throw new Error('Usuario no autorizado');
    }

    // Verificar que todas las partes estén subidas
    const validParts = session.parts.filter(p => p && p.ETag);
    if (validParts.length === 0) {
      throw new Error('No hay partes subidas');
    }

    // Ordenar partes por número
    validParts.sort((a, b) => a.PartNumber - b.PartNumber);

    // Obtener cliente S3
    const s3Client = await getS3Client();

    // Completar multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: config.storage.bucket_name,
      Key: session.key,
      UploadId: session.uploadId,
      MultipartUpload: {
        Parts: validParts
      }
    });

    const result = await s3Client.send(completeCommand);

    // Generar URL pública
    const publicUrl = `https://${config.storage.bucket_name}.s3.${config.storage.aws_region}.amazonaws.com/${session.key}`;

    // Limpiar sesión
    uploadSessions.delete(sessionId);

    console.log('✅ [Server Action] Upload completado:', publicUrl);

    return {
      success: true,
      url: publicUrl,
      key: session.key,
      location: result.Location
    };

  } catch (error) {
    console.error('❌ [Server Action] Error completando upload:', error);
    
    // Intentar abortar el upload en caso de error
    try {
      await abortMultipartUpload(sessionId);
    } catch (abortError) {
      console.error('Error abortando upload:', abortError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error completando upload'
    };
  }
}

/**
 * Server Action: Abortar upload multipart
 * @param sessionId ID de la sesión de upload
 */
export async function abortMultipartUpload(sessionId: string) {
  console.log('🛑 [Server Action] Abortando multipart upload:', sessionId);

  try {
    const session = uploadSessions.get(sessionId);
    if (!session) {
      return { success: true, message: 'Sesión no encontrada' };
    }

    const s3Client = await getS3Client();

    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: config.storage.bucket_name,
      Key: session.key,
      UploadId: session.uploadId
    });

    await s3Client.send(abortCommand);
    uploadSessions.delete(sessionId);

    console.log('✅ [Server Action] Upload abortado exitosamente');
    return { success: true };

  } catch (error) {
    console.error('❌ [Server Action] Error abortando upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error abortando upload'
    };
  }
}

/**
 * Server Action: Obtener estado del upload
 * @param sessionId ID de la sesión de upload
 */
export async function getUploadStatus(sessionId: string) {
  try {
    const session = uploadSessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const s3Client = await getS3Client();

    // Listar partes subidas en S3
    const listCommand = new ListPartsCommand({
      Bucket: config.storage.bucket_name,
      Key: session.key,
      UploadId: session.uploadId
    });

    const { Parts = [] } = await s3Client.send(listCommand);

    return {
      success: true,
      uploadId: session.uploadId,
      key: session.key,
      partsUploaded: Parts.length,
      parts: Parts.map(p => ({
        partNumber: p.PartNumber,
        size: p.Size,
        etag: p.ETag
      }))
    };

  } catch (error) {
    console.error('❌ [Server Action] Error obteniendo estado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo estado'
    };
  }
}

/**
 * Calcular tamaño óptimo de chunk basado en el tamaño del archivo
 * AWS recomienda chunks de 5-100MB
 */
function calculateOptimalChunkSize(fileSize: number): number {
  const MB = 1024 * 1024;
  
  if (fileSize <= 100 * MB) {
    return 5 * MB; // 5MB chunks para archivos < 100MB
  } else if (fileSize <= 500 * MB) {
    return 10 * MB; // 10MB chunks para archivos 100-500MB
  } else if (fileSize <= 1024 * MB) {
    return 25 * MB; // 25MB chunks para archivos 500MB-1GB
  } else {
    return 50 * MB; // 50MB chunks para archivos > 1GB
  }
}

/**
 * Limpiar sesiones antiguas (más de 24 horas)
 */
function cleanupOldSessions() {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas

  uploadSessions.forEach((session, sessionId) => {
    if (now.getTime() - session.createdAt.getTime() > maxAge) {
      uploadSessions.delete(sessionId);
      console.log('🗑️ Sesión antigua eliminada:', sessionId);
    }
  });
}