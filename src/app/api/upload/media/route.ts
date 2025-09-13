import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { getAuthenticatedUser, getIdTokenServer } from '@/utils/amplify-server-utils';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../../../amplify/outputs.json';

// Configuración según AWS best practices
export const maxDuration = 300; // 5 minutos para archivos grandes
export const dynamic = 'force-dynamic';

/**
 * Route Handler para Upload de Archivos Grandes
 * Siguiendo AWS Best Practices para multimedia
 */
export async function POST(request: NextRequest) {
  console.log('📤 [AWS Route Handler] Procesando archivo multimedia...');
  
  try {
    // 1. Verificar autenticación (reutilizando lógica existente)
    const user = await getAuthenticatedUser();
    if (!user || user.userType !== 'provider') {
      return NextResponse.json(
        { error: 'Solo providers autenticados pueden subir archivos' },
        { status: 401 }
      );
    }

    // 1.5 Verificar que el provider esté completamente aprobado
    if (!user.isFullyApprovedProvider) {
      return NextResponse.json(
        { 
          error: 'Provider no aprobado. Se requiere aprobación del equipo YAAN y asignación al grupo providers.',
          details: {
            isApproved: user.isProviderApproved,
            inGroup: user.cognitoGroups?.includes('providers')
          }
        },
        { status: 403 }
      );
    }

    // 2. Obtener archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'images';
    const productId = formData.get('productId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // 3. Validaciones según AWS recommendations
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB límite S3
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Archivo excede límite de 5GB de AWS S3' },
        { status: 413 }
      );
    }

    // 4. Validar tipos de archivo - Política completa para multimedia
    const allowedImageTypes = [
      // Formatos web optimizados (recomendados)
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      // Formatos de compatibilidad
      'image/gif', 'image/bmp', 'image/tiff', 'image/tif',
      // Formatos RAW (para profesionales)
      'image/x-canon-cr2', 'image/x-canon-crw', 'image/x-nikon-nef',
      'image/x-sony-arw', 'image/x-adobe-dng'
    ];
    
    const allowedVideoTypes = [
      // Formatos web optimizados (recomendados)
      'video/mp4', 'video/webm', 'video/ogg',
      // Formatos móviles y profesionales
      'video/quicktime', 'video/x-msvideo', 'video/avi',
      // Formatos de redes sociales y streaming
      'video/x-flv', 'video/x-ms-wmv', 'video/mkv', 'video/x-matroska',
      // Formatos específicos
      'video/3gpp', 'video/3gpp2', 'video/x-ms-asf'
    ];
    
    const isVideoFile = file.type.startsWith('video/');
    const allowedTypes = isVideoFile ? allowedVideoTypes : allowedImageTypes;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido para ${folder}` },
        { status: 400 }
      );
    }

    // 5. Generar path S3 según estructura definida en prompt-2
    // Estructura: /products/{product_id}/main-image.jpg o /products/{product_id}/gallery/
    const targetId = productId || user.sub || user.userId;
    const fileExtension = file.name.split('.').pop();
    
    // Generar nombre según tipo y estructura definida en prompt-2
    let s3Key: string;
    if (folder === 'covers') {
      // Para covers: /products/{product_id}/main-image.jpg
      s3Key = `public/products/${targetId}/main-image.${fileExtension}`;
    } else {
      // Para gallery y videos: /products/{product_id}/gallery/
      // Determinar tipo por contenido del archivo, no solo por folder
      const isVideo = file.type.startsWith('video/');
      const prefix = isVideo ? 'video' : 'image';
      const uniqueFileName = `${prefix}_${Date.now()}_${uuidv4().slice(0, 8)}.${fileExtension}`;
      s3Key = `public/products/${targetId}/gallery/${uniqueFileName}`;
    }

    console.log('📍 [AWS Route Handler] Subiendo a:', s3Key);

    // 6. Configurar cliente S3 con credenciales autenticadas
    const idToken = await getIdTokenServer();
    if (!idToken) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const s3Client = new S3Client({
      region: config.storage.aws_region,
      credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: config.storage.aws_region }),
        identityPoolId: config.auth.identity_pool_id,
        logins: {
          [`cognito-idp.${config.auth.aws_region}.amazonaws.com/${config.auth.user_pool_id}`]: idToken
        }
      })
    });

    // 7. Preparar comando de upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const putCommand = new PutObjectCommand({
      Bucket: config.storage.bucket_name,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: file.type,
      Metadata: {
        'uploaded-by': user.sub || user.userId,
        'product-id': productId || 'temp',
        'original-filename': file.name,
        'upload-timestamp': new Date().toISOString(),
        'content-type': folder,
        'file-size': file.size.toString()
      }
    });

    // 8. Subir a S3
    await s3Client.send(putCommand);

    // 9. Generar URL pública
    const publicUrl = `https://${config.storage.bucket_name}.s3.${config.storage.aws_region}.amazonaws.com/${s3Key}`;

    console.log('✅ [AWS Route Handler] Archivo subido exitosamente:', publicUrl);

    // 10. Respuesta según formato AWS
    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: s3Key,
      fileSize: file.size,
      contentType: file.type,
      uploadMethod: file.size > 100 * 1024 * 1024 ? 'large-file' : 'standard',
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [AWS Route Handler] Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando archivo',
        errorType: 'upload_failed'
      },
      { status: 500 }
    );
  }
}

// GET para verificar estado del servicio
export async function GET() {
  return NextResponse.json({
    service: 'AWS Media Upload Handler',
    status: 'active',
    maxFileSize: '5GB',
    supportedFormats: {
      images: {
        recommended: ['jpg', 'jpeg', 'png', 'webp'],
        supported: ['gif', 'bmp', 'tiff', 'tif'],
        professional: ['cr2', 'crw', 'nef', 'arw', 'dng']
      },
      videos: {
        recommended: ['mp4', 'webm', 'ogg'],
        supported: ['mov', 'avi', 'flv', 'wmv', 'mkv', '3gp']
      }
    },
    policies: {
      maxSizes: {
        cover: '10MB',
        gallery: '50MB', 
        video: '5GB'
      },
      notes: 'RAW formats and professional codecs supported for providers'
    }
  });
}