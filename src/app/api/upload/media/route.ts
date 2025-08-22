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

    // 2. Obtener archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'images';

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

    // 4. Validar tipos de archivo
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const allowedTypes = folder === 'videos' ? allowedVideoTypes : allowedImageTypes;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido para ${folder}` },
        { status: 400 }
      );
    }

    // 5. Generar path S3 según estructura definida
    const userId = user.sub || user.userId;
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `public/products/${userId}/${folder}/${uniqueFileName}`;

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
        'uploaded-by': userId,
        'original-filename': file.name,
        'upload-timestamp': new Date().toISOString(),
        'folder': folder,
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
      images: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      videos: ['mp4', 'mov', 'webm']
    }
  });
}