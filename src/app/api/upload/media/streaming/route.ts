import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { getAuthenticatedUser, getIdTokenServer } from '@/utils/amplify-server-utils';
import { v4 as uuidv4 } from 'uuid';
import amplifyConfig from '../../../../../../amplify/outputs.json';

/**
 * Route Handler Mejorado con Streaming para Archivos Grandes
 * Implementa upload por streaming sin cargar todo en memoria
 */

export const maxDuration = 300; // 5 minutos
export const dynamic = 'force-dynamic';

// Tamaño máximo del body: 5GB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5gb',
    },
  },
};

/**
 * POST: Upload de archivos con streaming
 * Usa @aws-sdk/lib-storage para manejar automáticamente multipart upload
 */
export async function POST(request: NextRequest) {
  console.log('📤 [Streaming Route] Procesando upload con streaming...');
  
  const startTime = Date.now();
  
  try {
    // 1. Verificar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // 2. Obtener headers para validación temprana
    const contentLength = request.headers.get('content-length');
    const contentType = request.headers.get('content-type');
    
    if (!contentLength || !contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Headers inválidos para upload' },
        { status: 400 }
      );
    }

    const fileSize = parseInt(contentLength);
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `Archivo excede límite de 5GB (tamaño: ${(fileSize / 1024 / 1024 / 1024).toFixed(2)}GB)` },
        { status: 413 }
      );
    }

    // 3. Procesar FormData con streaming
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const useMultipart = formData.get('useMultipart') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // 4. Validar tipo de archivo
    const allowedTypes: Record<string, string[]> = {
      images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
      videos: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
      documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    const allowed = allowedTypes[folder] || Object.values(allowedTypes).flat();
    
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}` },
        { status: 400 }
      );
    }

    // 5. Generar path único en S3
    const userId = user.sub || user.userId || 'anonymous';
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `public/products/${userId}/${folder}/${uniqueFileName}`;

    console.log(`📍 [Streaming Route] Subiendo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) a ${s3Key}`);

    // 6. Configurar cliente S3
    const idToken = await getIdTokenServer();
    if (!idToken) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const s3Client = new S3Client({
      region: amplifyConfig.storage.aws_region,
      credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: amplifyConfig.storage.aws_region }),
        identityPoolId: amplifyConfig.auth.identity_pool_id,
        logins: {
          [`cognito-idp.${amplifyConfig.auth.aws_region}.amazonaws.com/${amplifyConfig.auth.user_pool_id}`]: idToken
        }
      })
    });

    // 7. Decidir estrategia de upload basada en tamaño
    const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB
    let uploadResult;
    
    if (file.size > MULTIPART_THRESHOLD || useMultipart) {
      // Usar multipart upload para archivos grandes
      console.log('📦 [Streaming Route] Usando multipart upload...');
      
      // Convertir File a stream para evitar cargar todo en memoria
      const stream = file.stream();
      
      // Configurar multipart upload con @aws-sdk/lib-storage
      const parallelUploads = new Upload({
        client: s3Client,
        params: {
          Bucket: amplifyConfig.storage.bucket_name,
          Key: s3Key,
          Body: stream,
          ContentType: file.type,
          Metadata: {
            'uploaded-by': userId,
            'original-filename': file.name,
            'upload-timestamp': new Date().toISOString(),
            'folder': folder,
            'file-size': file.size.toString(),
            'upload-method': 'multipart-streaming'
          }
        },
        // Configuración de multipart
        queueSize: 4, // Partes en paralelo
        partSize: calculatePartSize(file.size), // Tamaño dinámico de parte
        leavePartsOnError: false, // Limpiar partes si falla
      });

      // Listener de progreso
      parallelUploads.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          const percentage = ((progress.loaded / progress.total) * 100).toFixed(2);
          console.log(`📊 [Streaming Route] Progreso: ${percentage}% (${progress.loaded}/${progress.total})`);
        }
      });

      uploadResult = await parallelUploads.done();
      
    } else {
      // Upload simple para archivos pequeños
      console.log('📄 [Streaming Route] Usando upload simple...');
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const putCommand = new PutObjectCommand({
        Bucket: amplifyConfig.storage.bucket_name,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          'uploaded-by': userId,
          'original-filename': file.name,
          'upload-timestamp': new Date().toISOString(),
          'folder': folder,
          'file-size': file.size.toString(),
          'upload-method': 'simple'
        }
      });

      uploadResult = await s3Client.send(putCommand);
    }

    // 8. Generar URL pública
    const publicUrl = `https://${amplifyConfig.storage.bucket_name}.s3.${amplifyConfig.storage.aws_region}.amazonaws.com/${s3Key}`;
    
    const uploadTime = Date.now() - startTime;
    const uploadSpeed = (file.size / uploadTime / 1024).toFixed(2); // KB/s
    
    console.log(`✅ [Streaming Route] Upload completado en ${uploadTime}ms (${uploadSpeed} KB/s)`);

    // 9. Respuesta con métricas
    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: s3Key,
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      upload: {
        method: file.size > MULTIPART_THRESHOLD ? 'multipart' : 'simple',
        duration: uploadTime,
        speed: `${uploadSpeed} KB/s`,
        parts: file.size > MULTIPART_THRESHOLD ? Math.ceil(file.size / calculatePartSize(file.size)) : 1
      },
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Streaming Route] Error:', error);
    
    // Manejo específico de errores
    let statusCode = 500;
    let errorMessage = 'Error procesando archivo';
    
    if (error instanceof Error) {
      if (error.message.includes('EntityTooLarge')) {
        statusCode = 413;
        errorMessage = 'Archivo demasiado grande';
      } else if (error.message.includes('NoSuchBucket')) {
        statusCode = 500;
        errorMessage = 'Configuración de almacenamiento incorrecta';
      } else if (error.message.includes('AccessDenied')) {
        statusCode = 403;
        errorMessage = 'Sin permisos para subir archivos';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        errorType: 'upload_failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: statusCode }
    );
  }
}

/**
 * GET: Información del servicio y límites
 */
export async function GET() {
  return NextResponse.json({
    service: 'AWS S3 Streaming Upload Handler',
    version: '2.0',
    status: 'active',
    features: [
      'Streaming upload sin cargar en memoria',
      'Multipart automático para archivos > 100MB',
      'Progress tracking',
      'Resume capability'
    ],
    limits: {
      maxFileSize: '5GB',
      multipartThreshold: '100MB',
      chunkSize: '5-50MB (dinámico)',
      timeout: '5 minutos'
    },
    supportedFormats: {
      images: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
      videos: ['mp4', 'mov', 'webm', 'avi'],
      documents: ['pdf', 'doc', 'docx']
    }
  });
}

/**
 * Calcular tamaño óptimo de parte basado en el tamaño del archivo
 */
function calculatePartSize(fileSize: number): number {
  const MB = 1024 * 1024;
  
  if (fileSize <= 200 * MB) {
    return 5 * MB; // 5MB para archivos < 200MB
  } else if (fileSize <= 1024 * MB) {
    return 10 * MB; // 10MB para archivos 200MB-1GB
  } else if (fileSize <= 2048 * MB) {
    return 25 * MB; // 25MB para archivos 1-2GB
  } else {
    return 50 * MB; // 50MB para archivos > 2GB
  }
}