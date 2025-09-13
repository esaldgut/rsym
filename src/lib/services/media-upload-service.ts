'use client';

export interface MediaUploadResult {
  success: boolean;
  url?: string;
  key?: string;
  fileSize?: number;
  contentType?: string;
  uploadMethod?: 'standard' | 'large-file';
  uploadedAt?: string;
  error?: string;
  errorType?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'uploading' | 'processing' | 'complete' | 'error';
}

/**
 * Service para subir archivos multimedia usando Route Handler
 * Implementa AWS Best Practices para archivos grandes
 */
export class MediaUploadService {
  private static instance: MediaUploadService;
  private readonly baseUrl = '/api/upload/media';
  
  public static getInstance(): MediaUploadService {
    if (!MediaUploadService.instance) {
      MediaUploadService.instance = new MediaUploadService();
    }
    return MediaUploadService.instance;
  }

  /**
   * Sube un archivo usando el Route Handler optimizado para archivos grandes
   */
  async uploadFile(
    file: File,
    productId: string,
    type: 'cover' | 'gallery' | 'video' = 'gallery',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaUploadResult> {
    try {
      // Determinar folder según tipo y tamaño
      const folder = this.getFolderByType(type, file);
      
      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('productId', productId);

      // Configurar XMLHttpRequest para tracking de progreso
      return new Promise<MediaUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Progress tracking
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              onProgress({
                loaded: event.loaded,
                total: event.total,
                percentage,
                stage: percentage === 100 ? 'processing' : 'uploading'
              });
            }
          });
        }

        // Success handler
        xhr.addEventListener('load', () => {
          try {
            const result: MediaUploadResult = JSON.parse(xhr.responseText);
            
            if (xhr.status === 200 && result.success) {
              onProgress?.({
                loaded: file.size,
                total: file.size,
                percentage: 100,
                stage: 'complete'
              });
              resolve(result);
            } else {
              onProgress?.({
                loaded: 0,
                total: file.size,
                percentage: 0,
                stage: 'error'
              });
              resolve({
                success: false,
                error: result.error || `HTTP ${xhr.status}`,
                errorType: result.errorType || 'upload_failed'
              });
            }
          } catch (parseError) {
            reject(new Error('Error parsing server response'));
          }
        });

        // Error handler
        xhr.addEventListener('error', () => {
          onProgress?.({
            loaded: 0,
            total: file.size,
            percentage: 0,
            stage: 'error'
          });
          reject(new Error('Network error during upload'));
        });

        // Timeout handler
        xhr.addEventListener('timeout', () => {
          onProgress?.({
            loaded: 0,
            total: file.size,
            percentage: 0,
            stage: 'error'
          });
          reject(new Error('Upload timeout'));
        });

        // Configure and send
        xhr.open('POST', this.baseUrl);
        xhr.timeout = this.getTimeoutForFileSize(file.size);
        xhr.send(formData);
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'client_error'
      };
    }
  }

  /**
   * Upload múltiples archivos con control de concurrencia
   */
  async uploadMultiple(
    files: File[],
    productId: string,
    type: 'cover' | 'gallery' | 'video' = 'gallery',
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    maxConcurrent: number = 3
  ): Promise<MediaUploadResult[]> {
    const results: MediaUploadResult[] = [];
    const chunks = this.chunkArray(files, maxConcurrent);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const chunkPromises = chunk.map((file, indexInChunk) => {
        const globalIndex = chunkIndex * maxConcurrent + indexInChunk;
        return this.uploadFile(
          file,
          productId,
          type,
          (progress) => onProgress?.(globalIndex, progress)
        );
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Validar archivo antes del upload
   */
  validateFile(file: File, type: 'cover' | 'gallery' | 'video'): { valid: boolean; error?: string } {
    // Validar tamaño
    const maxSizes = {
      cover: 10 * 1024 * 1024,     // 10MB para imágenes de portada
      gallery: 50 * 1024 * 1024,   // 50MB para galería
      video: 5 * 1024 * 1024 * 1024 // 5GB para videos (límite S3)
    };

    if (file.size > maxSizes[type]) {
      return {
        valid: false,
        error: `Archivo excede límite de ${this.formatFileSize(maxSizes[type])}`
      };
    }

    // Validar tipo - Política completa para multimedia
    const allowedTypes = {
      cover: [
        // Formatos web optimizados para covers
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'image/gif', 'image/bmp'
      ],
      gallery: [
        // Formatos completos para galería
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'image/bmp', 'image/tiff', 'image/tif',
        // Formatos RAW (para proveedores profesionales)
        'image/x-canon-cr2', 'image/x-canon-crw', 'image/x-nikon-nef',
        'image/x-sony-arw', 'image/x-adobe-dng'
      ],
      video: [
        // Formatos completos de video
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
        'video/x-msvideo', 'video/avi', 'video/x-flv', 'video/x-ms-wmv',
        'video/mkv', 'video/x-matroska', 'video/3gpp', 'video/3gpp2'
      ]
    };

    if (!allowedTypes[type].includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido para ${type}`
      };
    }

    return { valid: true };
  }

  // Private helpers
  private getFolderByType(type: 'cover' | 'gallery' | 'video', file: File): string {
    if (file.type.startsWith('video/')) return 'videos';
    if (type === 'cover') return 'covers';
    return 'images';
  }

  private getTimeoutForFileSize(fileSize: number): number {
    // Timeout dinámico basado en el tamaño del archivo
    const baseMB = fileSize / (1024 * 1024);
    if (baseMB < 10) return 30000;      // 30s para archivos pequeños
    if (baseMB < 100) return 120000;    // 2 min para archivos medianos
    if (baseMB < 500) return 300000;    // 5 min para archivos grandes
    return 600000;                      // 10 min para archivos muy grandes
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export singleton instance
export const mediaUploadService = MediaUploadService.getInstance();