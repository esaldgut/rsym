'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';
import outputs from '../../../amplify/outputs.json';

/**
 * Server Actions para uploads de documentos usando presigned URLs
 *
 * ESTRATEGIA HÍBRIDA PARA UPLOADS:
 * - Archivos protected/* → Presigned URL con PUT (sin credenciales client-side)
 * - Server genera URL con permisos PUT temporales (5 min)
 * - Client hace HTTP PUT directo a S3 sin AWS credentials
 *
 * ARQUITECTURA:
 * Server Component/Action → generateDocumentUploadUrl() → presigned URL
 * Client Component → fetch(url, { method: 'PUT', body: file }) → S3 upload
 *
 * BENEFICIOS:
 * - ✅ No requiere Identity Pool credentials en client-side
 * - ✅ No hay errores "Credentials should not be empty"
 * - ✅ Upload directo a S3 (performance óptimo)
 * - ✅ Seguridad: URLs expiran en 5 minutos
 * - ✅ Trazabilidad: Server controla rutas y permisos
 */

export interface DocumentUploadUrlRequest {
  documentType: string;     // Tipo de documento (e.g., "proofOfTaxStatus", "sectur")
  fileName: string;         // Nombre original del archivo
  contentType: string;      // MIME type (e.g., "application/pdf")
  metadata?: Record<string, string>; // Metadata opcional para S3
}

export interface DocumentUploadUrlResult {
  url: string;             // Presigned URL para PUT
  path: string;            // Path final en S3 (para guardar en Cognito)
  expiresIn: number;       // Segundos hasta expiración
}

/**
 * Genera una presigned URL para subir un documento a S3
 *
 * FLUJO:
 * 1. Autentica al usuario con UnifiedAuthSystem
 * 2. Genera path seguro en protected/users/{username}/legal-documents/{type}/
 * 3. Crea comando PUT de S3 con metadata
 * 4. Genera presigned URL con expiración de 5 minutos
 * 5. Retorna URL y path para que client haga PUT directo
 *
 * @param request - Información del documento a subir
 * @returns Presigned URL para upload y path final
 * @throws Error si el usuario no está autenticado o hay error en AWS
 */
export async function generateDocumentUploadUrl(
  request: DocumentUploadUrlRequest
): Promise<DocumentUploadUrlResult> {
  console.log('📤 [Document Upload Actions] Generando presigned URL para upload:', {
    documentType: request.documentType,
    fileName: request.fileName,
    contentType: request.contentType
  });

  try {
    // PASO 1: Autenticar usuario
    // Solo usuarios autenticados pueden subir documentos
    const authResult = await UnifiedAuthSystem.requireAuthentication();

    if (!authResult.user?.username) {
      throw new Error('Username no disponible en sesión');
    }

    const username = authResult.user.username;

    // PASO 2: Sanitizar y validar inputs
    const sanitizedFileName = request.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = sanitizedFileName.split('.').pop()?.toLowerCase() || 'pdf';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);

    // Sanitizar documentType para usar en path (sin espacios ni caracteres especiales)
    const sanitizedDocType = request.documentType.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

    // PASO 3: Generar path seguro en S3
    // Estructura: protected/users/{username}/legal-documents/{documentType}/{timestamp}-{random}.{ext}
    const path = `protected/users/${username}/legal-documents/${sanitizedDocType}/${timestamp}-${randomString}.${fileExtension}`;

    console.log('📁 [Document Upload Actions] Path generado:', path);

    // PASO 4: Configurar cliente S3
    // NOTA: Requiere credenciales del backend (IAM role del ECS task o Lambda)
    // NO usa Identity Pool credentials
    const s3Client = new S3Client({
      region: outputs.storage.aws_region,
      // Usa credenciales del entorno (IAM role)
      // En ECS: Task Role automáticamente disponible
      // En local: AWS CLI credentials
    });

    // PASO 5: Preparar comando PUT con metadata
    const putCommand = new PutObjectCommand({
      Bucket: outputs.storage.bucket_name,
      Key: path,
      ContentType: request.contentType || 'application/octet-stream',
      Metadata: {
        // Metadata S3 (max 2KB, solo ASCII)
        'uploaded-by': username,
        'document-type': sanitizedDocType,
        'original-filename': sanitizedFileName,
        'upload-timestamp': timestamp.toString(),
        ...request.metadata
      },
      // Opcional: Configurar ACL, Storage Class, etc.
      // ACL: 'private', // Ya es default
      // ServerSideEncryption: 'AES256', // Si el bucket lo requiere
    });

    // PASO 6: Generar presigned URL con expiración corta
    const expiresIn = 300; // 5 minutos (300 segundos)
    const presignedUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn,
      // Opcional: Restringir headers que el cliente debe enviar
      // unhoistableHeaders: new Set(['x-amz-server-side-encryption'])
    });

    console.log('✅ [Document Upload Actions] Presigned URL generada exitosamente:', {
      path,
      expiresIn,
      hasUrl: !!presignedUrl,
      strategy: 'presigned-put-url'
    });

    return {
      url: presignedUrl,
      path,
      expiresIn
    };

  } catch (error) {
    console.error('❌ [Document Upload Actions] Error generando presigned URL:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    throw new Error(
      `Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Genera múltiples presigned URLs para batch uploads
 * Útil si necesitas subir varios documentos a la vez
 *
 * @param requests - Array de solicitudes de upload
 * @returns Array de resultados (URLs y paths)
 */
export async function generateDocumentUploadUrls(
  requests: DocumentUploadUrlRequest[]
): Promise<DocumentUploadUrlResult[]> {
  console.log(`📤 [Document Upload Actions] Generando ${requests.length} presigned URLs en paralelo...`);

  const promises = requests.map(request => generateDocumentUploadUrl(request));
  const results = await Promise.all(promises);

  console.log(`✅ [Document Upload Actions] ${results.length} presigned URLs generadas`);

  return results;
}

/**
 * Wrapper de conveniencia para tipos de documentos específicos de provider
 * Valida que el usuario tenga permisos de provider antes de generar URL
 *
 * @param documentType - Tipo de documento legal
 * @param fileName - Nombre del archivo
 * @param contentType - MIME type
 * @returns Presigned URL y path
 */
export async function generateProviderDocumentUploadUrl(
  documentType: 'proofOfTaxStatus' | 'sectur' | 'complianceOpin',
  fileName: string,
  contentType: string
): Promise<DocumentUploadUrlResult> {
  console.log('🏢 [Document Upload Actions] Generando URL para documento de provider:', documentType);

  // Validar que el usuario sea provider
  const authResult = await UnifiedAuthSystem.requireAuthentication();

  if (authResult.user?.userType !== 'provider') {
    throw new Error('User must be a provider to upload legal documents');
  }

  // Generar presigned URL
  return generateDocumentUploadUrl({
    documentType,
    fileName,
    contentType,
    metadata: {
      'user-type': 'provider',
      'requires-approval': 'true'
    }
  });
}
