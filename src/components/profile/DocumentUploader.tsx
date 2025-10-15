'use client';

import React, { useState, useRef } from 'react';
import { remove } from 'aws-amplify/storage';
import { DocumentPath } from '@/lib/auth/user-attributes';
import { sanitizeFileName } from '@/utils/storage-upload-sanitizer';
import { generateDocumentUploadUrl } from '@/lib/server/document-upload-actions';

interface DocumentUploaderProps {
  label: string;
  description: string;
  value?: DocumentPath;
  onChange: (document: DocumentPath | undefined) => void;
  accept?: string;
  maxSize?: number; // en MB
  required?: boolean;
}

export function DocumentUploader({
  label,
  description,
  value,
  onChange,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxSize = 10,
  required = false
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapear labels a carpetas específicas según la estructura S3
  const getDocumentFolder = (label: string): string => {
    const labelLower = label.toLowerCase();
    if (labelLower.includes('situación fiscal') || labelLower.includes('sat') || labelLower.includes('tax')) {
      return 'proof-of-tax-status';
    }
    if (labelLower.includes('sectur') || labelLower.includes('turismo')) {
      return 'sectur-registry';
    }
    if (labelLower.includes('cumplimiento') || labelLower.includes('32-d') || labelLower.includes('compliance')) {
      return 'compliance-opinion';
    }
    // Fallback genérico
    return label.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño del archivo
    if (file.size > maxSize * 1024 * 1024) {
      setError(`El archivo no debe superar ${maxSize}MB`);
      return;
    }

    // Validar tipo de archivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = accept.split(',').map(ext => ext.replace('.', '').trim());
    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      setError(`Tipo de archivo no permitido. Formatos válidos: ${accept}`);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // PASO 1: Sanitizar nombre del archivo
      const sanitizedFileName = sanitizeFileName(file.name);
      const documentFolder = getDocumentFolder(label);

      console.log('📤 [DocumentUploader] Solicitando presigned URL para upload:', {
        documentType: documentFolder,
        fileName: sanitizedFileName
      });

      // PASO 2: Solicitar presigned URL al servidor
      // El servidor autentica al usuario, genera path seguro, y crea presigned URL
      // NO requiere credenciales del Identity Pool en el cliente
      const { url, path, expiresIn } = await generateDocumentUploadUrl({
        documentType: documentFolder,
        fileName: sanitizedFileName,
        contentType: file.type || 'application/octet-stream'
      });

      console.log('✅ [DocumentUploader] Presigned URL obtenida, iniciando upload directo a S3:', {
        path,
        expiresIn,
        strategy: 'presigned-put-url'
      });

      // PASO 3: Upload directo a S3 usando HTTP PUT
      // Esto NO requiere AWS credentials, solo la presigned URL
      // Usar XMLHttpRequest para tracking de progreso
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Configurar tracking de progreso
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });

        // Configurar handler de éxito
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('✅ [DocumentUploader] Upload completado exitosamente:', path);
            resolve();
          } else {
            console.error('❌ [DocumentUploader] Upload falló con status:', xhr.status);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        // Configurar handler de error
        xhr.addEventListener('error', () => {
          console.error('❌ [DocumentUploader] Error de red durante upload');
          reject(new Error('Network error during upload'));
        });

        // Configurar handler de timeout
        xhr.addEventListener('timeout', () => {
          console.error('❌ [DocumentUploader] Upload timeout');
          reject(new Error('Upload timeout'));
        });

        // Abrir conexión y enviar archivo
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.timeout = 60000; // 60 segundos timeout
        xhr.send(file);
      });

      // PASO 4: Actualizar estado con la información del documento
      onChange({
        uri: path,
        name: file.name
      });

      console.log('🎉 [DocumentUploader] Documento subido exitosamente:', path);

      // PASO 5: Refrescar tokens después de subir documentos críticos
      // Los documentos legales son considerados cambios críticos que requieren refresh
      if (typeof window !== 'undefined') {
        const { TokenInterceptor } = await import('@/lib/auth/token-interceptor');

        // Determinar si es un documento crítico (todos los documentos legales lo son)
        const isCriticalDocument = documentFolder.includes('proof-of-tax-status') ||
                                  documentFolder.includes('sectur-registry') ||
                                  documentFolder.includes('compliance-opinion');

        if (isCriticalDocument) {
          console.log('🔄 Documento crítico subido, refrescando tokens silenciosamente...');
          setTimeout(() => {
            TokenInterceptor.performSilentRefresh();
          }, 500);
        } else {
          setTimeout(() => {
            TokenInterceptor.performSilentRefresh();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('❌ [DocumentUploader] Error subiendo documento:', error);

      // Mensaje de error específico según el tipo de error
      if (error instanceof Error) {
        if (error.message.includes('authenticate') || error.message.includes('auth')) {
          setError('Error de autenticación. Por favor recarga la página e intenta de nuevo.');
        } else if (error.message.includes('timeout')) {
          setError('El upload tardó demasiado. Por favor verifica tu conexión e intenta de nuevo.');
        } else if (error.message.includes('Network')) {
          setError('Error de conexión. Por favor verifica tu red e intenta de nuevo.');
        } else {
          setError(`Error al subir el archivo: ${error.message}`);
        }
      } else {
        setError('Error al subir el archivo. Por favor intenta de nuevo.');
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Eliminar archivo de S3 usando Amplify Storage client-side
      await remove({
        path: value.uri
      });

      // Actualizar estado
      onChange(undefined);

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      console.log('Documento eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando documento:', error);
      setError('Error al eliminar el archivo');
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v1h1.5v1.5H17.5V7h4v1.5zM9 10.5h1V8.5H9v2zM13.5 10.5h1V8.5h-1v2z"/>
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      {!value ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Subiendo...' : 'Seleccionar archivo'}
              </button>
              <p className="mt-1 text-sm text-gray-500">
                o arrastra y suelta aquí
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Máximo {maxSize}MB • Formatos: {accept}
            </p>
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center">
                Subiendo... {uploadProgress}%
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(value.name)}
              <div>
                <p className="text-sm font-medium text-gray-900">{value.name}</p>
                <p className="text-xs text-gray-500">Subido exitosamente</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
              title="Eliminar archivo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>Información importante:</strong> Este documento será revisado por el equipo de YAAN.
              Asegúrate de que sea legible y esté actualizado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
