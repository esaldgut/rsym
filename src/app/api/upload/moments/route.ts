import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { getAuthenticatedUser, getIdTokenServer } from '@/utils/amplify-server-utils';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../../../amplify/outputs.json';

// Configuración específica para Moments
export const maxDuration = 300; // 5 minutos para archivos grandes
export const dynamic = 'force-dynamic';

/**
 * Route Handler especializado para Upload de Multimedia en Moments (Red Social)
 * Extiende el sistema multimedia YAAN con funcionalidades específicas para red social
 */
export async function POST(request: NextRequest) {
  console.log('📱 [Moments Upload] Procesando archivo multimedia para red social...');
  
  try {
    // 1. Verificar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // 2. Obtener datos del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const momentId = formData.get('productId') as string; // Reutilizamos la interfaz
    const contentType = formData.get('contentType') as string || 'moment'; // story, post, comment, etc.
    const visibility = formData.get('visibility') as string || 'public'; // public, friends, private
    const caption = formData.get('caption') as string || '';
    const hashtags = formData.get('hashtags') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // 3. Validaciones específicas para Moments
    const maxSizes = {
      image: 25 * 1024 * 1024,  // 25MB para imágenes
      video: 100 * 1024 * 1024  // 100MB para videos
    };

    const fileCategory = file.type.startsWith('image/') ? 'image' : 'video';
    if (file.size > maxSizes[fileCategory]) {
      return NextResponse.json(
        { error: `Archivo excede límite de ${maxSizes[fileCategory] / (1024 * 1024)}MB para ${fileCategory} en momentos` },
        { status: 413 }
      );
    }

    // 4. Validar tipos específicos para red social
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedTypes = fileCategory === 'image' ? allowedImageTypes : allowedVideoTypes;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido para momentos. Tipos permitidos: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. Generar estructura S3 específica para Moments
    const userId = user.sub || user.userId;
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    
    // Estructura: /moments/{user_id}/{moment_id}/{content_type}/
    const s3Key = `public/moments/${userId}/${momentId}/${contentType}/${uniqueFileName}`;

    console.log('📍 [Moments Upload] Estructura S3:', s3Key);

    // 6. Configurar cliente S3
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

    // 7. Preparar comando de upload con metadata extendida para red social
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Procesar hashtags para metadata
    const hashtagsArray = hashtags ? hashtags.split('#').filter(tag => tag.trim()).map(tag => tag.trim()) : [];

    const putCommand = new PutObjectCommand({
      Bucket: config.storage.bucket_name,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: file.type,
      Metadata: {
        // Metadata básica
        'uploaded-by': userId,
        'moment-id': momentId,
        'original-filename': file.name,
        'upload-timestamp': new Date().toISOString(),
        'file-size': file.size.toString(),
        'content-category': fileCategory,
        
        // Metadata específica para red social
        'content-type': contentType,
        'visibility': visibility,
        'caption': caption ? Buffer.from(caption, 'utf8').toString('base64') : '', // Encoded para caracteres especiales
        'hashtags-count': hashtagsArray.length.toString(),
        'hashtags': hashtagsArray.slice(0, 10).join(','), // Máximo 10 hashtags
        
        // Metadata para analytics
        'user-agent': request.headers.get('user-agent') || '',
        'upload-source': 'web-moments',
        'moment-version': '2.0'
      },
      
      // Tags de S3 para organización y facturación
      Tagging: [
        `Environment=production`,
        `Service=moments`,
        `ContentType=${contentType}`,
        `Visibility=${visibility}`,
        `FileCategory=${fileCategory}`
      ].join('&')
    });

    // 8. Subir a S3
    await s3Client.send(putCommand);

    // 9. Generar URL pública
    const publicUrl = `https://${config.storage.bucket_name}.s3.${config.storage.aws_region}.amazonaws.com/${s3Key}`;

    console.log('✅ [Moments Upload] Archivo subido exitosamente:', publicUrl);

    // 10. Respuesta extendida para Moments
    const response = {
      success: true,
      url: publicUrl,
      key: s3Key,
      fileSize: file.size,
      contentType: file.type,
      
      // Información específica para Moments
      momentMetadata: {
        momentId,
        contentType,
        visibility,
        caption,
        hashtags: hashtagsArray,
        fileCategory,
        uploadMethod: file.size > 50 * 1024 * 1024 ? 'large-file' : 'standard'
      },
      
      // Información para el cliente
      uploadedAt: new Date().toISOString(),
      processingInfo: {
        thumbnailGeneration: fileCategory === 'video' ? 'queued' : 'not-needed',
        contentModeration: 'pending', // Para futuras implementaciones
        optimization: file.size > 10 * 1024 * 1024 ? 'scheduled' : 'not-needed'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [Moments Upload] Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando archivo de momento',
        errorType: 'moments_upload_failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET para obtener información del servicio de Moments
export async function GET() {
  return NextResponse.json({
    service: 'YAAN Moments Media Upload',
    status: 'active',
    version: '2.0.0',
    capabilities: {
      maxFileSizes: {
        images: '25MB',
        videos: '100MB'
      },
      supportedFormats: {
        images: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        videos: ['mp4', 'webm', 'mov']
      },
      features: {
        hashtags: 'supported',
        captions: 'supported',
        visibility: ['public', 'friends', 'private'],
        contentTypes: ['moment', 'story', 'post', 'comment'],
        analytics: 'enabled',
        contentModeration: 'planned'
      }
    },
    s3Structure: 'public/moments/{user_id}/{moment_id}/{content_type}/',
    lastUpdated: new Date().toISOString()
  });
}