import { uploadData } from 'aws-amplify/storage';
import { 
  initializeMultipartUpload, 
  uploadChunk, 
  completeMultipartUpload,
  abortMultipartUpload 
} from '@/lib/server/multipart-upload-actions';

/**
 * Upload Manager - Estrategia Dual Inteligente
 * Decide automáticamente el mejor método de upload según el tamaño del archivo
 */

export interface UploadOptions {
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
  onError?: (error: Error) => void;
  onComplete?: (result: { url: string; key: string }) => void;
  folder?: string;
  accessLevel?: 'guest' | 'private' | 'protected';
  forceMultipart?: boolean; // Forzar multipart incluso para archivos pequeños
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  method?: 'amplify' | 'multipart' | 'streaming';
  duration?: number;
}

// Umbrales de tamaño
const SMALL_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB - Usar Amplify uploadData
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB - Usar multipart
const STREAMING_THRESHOLD = 500 * 1024 * 1024; // 500MB - Usar streaming route

/**
 * Upload Manager Principal
 * Selecciona automáticamente el mejor método según el tamaño del archivo
 */
export class UploadManager {
  private abortController?: AbortController;
  private currentSessionId?: string;

  /**
   * Subir archivo con estrategia inteligente
   */
  async upload(file: File, userId: string, options: UploadOptions = {}): Promise<UploadResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📤 [Upload Manager] Procesando ${file.name} (${this.formatFileSize(file.size)})`);
      
      // Validar archivo
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Decidir estrategia
      const strategy = this.selectStrategy(file, options);
      console.log(`📊 [Upload Manager] Estrategia seleccionada: ${strategy}`);

      let result: UploadResult;

      switch (strategy) {
        case 'amplify':
          result = await this.uploadWithAmplify(file, userId, options);
          break;
        
        case 'multipart':
          result = await this.uploadWithMultipart(file, userId, options);
          break;
        
        case 'streaming':
          result = await this.uploadWithStreaming(file, userId, options);
          break;
        
        default:
          throw new Error(`Estrategia no soportada: ${strategy}`);
      }

      const duration = Date.now() - startTime;
      result.duration = duration;

      if (result.success) {
        console.log(`✅ [Upload Manager] Upload completado en ${duration}ms`);
        options.onComplete?.({ url: result.url!, key: result.key! });
      }

      return result;

    } catch (error) {
      console.error('❌ [Upload Manager] Error:', error);
      const errorObj = error instanceof Error ? error : new Error('Error desconocido');
      options.onError?.(errorObj);
      
      return {
        success: false,
        error: errorObj.message
      };
    }
  }

  /**
   * Estrategia 1: Upload con Amplify (archivos pequeños < 10MB)
   */
  private async uploadWithAmplify(
    file: File, 
    userId: string, 
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const folder = options.folder || 'uploads';
      const path = `${folder}/${userId}/${timestamp}.${fileExtension}`;

      const result = await uploadData({
        path,
        data: file,
        options: {
          accessLevel: options.accessLevel || 'protected',
          contentType: file.type,
          onProgress: (event) => {
            const percentage = event.transferredBytes / (event.totalBytes || 1) * 100;
            options.onProgress?.({
              loaded: event.transferredBytes,
              total: event.totalBytes || file.size,
              percentage
            });
          }
        }
      }).result;

      return {
        success: true,
        url: result.path,
        key: result.path,
        method: 'amplify'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Estrategia 2: Upload con Multipart (archivos medianos 10MB-500MB)
   */
  private async uploadWithMultipart(
    file: File,
    userId: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    let sessionId: string | undefined;

    try {
      // Inicializar multipart upload
      const initResult = await initializeMultipartUpload(
        file.name,
        file.type,
        file.size,
        options.folder || 'uploads'
      );

      if (!initResult.success || !initResult.sessionId) {
        throw new Error(initResult.error || 'No se pudo inicializar multipart upload');
      }

      sessionId = initResult.sessionId;
      this.currentSessionId = sessionId;

      const { chunkSize, totalChunks } = initResult;
      
      // Subir chunks
      const chunks: ArrayBuffer[] = await this.splitFileIntoChunks(file, chunkSize);
      let uploadedChunks = 0;

      for (let i = 0; i < chunks.length; i++) {
        // Convertir chunk a base64
        const chunkBase64 = this.arrayBufferToBase64(chunks[i]);
        
        // Subir chunk
        const chunkResult = await uploadChunk(
          sessionId,
          chunkBase64,
          i + 1 // Part numbers start at 1
        );

        if (!chunkResult.success) {
          throw new Error(`Error subiendo chunk ${i + 1}: ${chunkResult.error}`);
        }

        uploadedChunks++;

        // Reportar progreso
        const percentage = (uploadedChunks / totalChunks) * 100;
        options.onProgress?.({
          loaded: uploadedChunks * chunkSize,
          total: file.size,
          percentage
        });
      }

      // Completar upload
      const completeResult = await completeMultipartUpload(sessionId);
      
      if (!completeResult.success) {
        throw new Error(completeResult.error || 'No se pudo completar multipart upload');
      }

      this.currentSessionId = undefined;

      return {
        success: true,
        url: completeResult.url!,
        key: completeResult.key!,
        method: 'multipart'
      };

    } catch (error) {
      // Abortar upload si falla
      if (sessionId) {
        await abortMultipartUpload(sessionId);
        this.currentSessionId = undefined;
      }
      throw error;
    }
  }

  /**
   * Estrategia 3: Upload con Streaming (archivos grandes > 500MB)
   */
  private async uploadWithStreaming(
    file: File,
    userId: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', options.folder || 'uploads');
      formData.append('useMultipart', 'true');

      // Crear AbortController para cancelación
      this.abortController = new AbortController();

      // Upload con streaming route
      const response = await fetch('/api/upload/media/streaming', {
        method: 'POST',
        body: formData,
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en upload streaming');
      }

      const result = await response.json();

      return {
        success: true,
        url: result.url,
        key: result.key,
        method: 'streaming'
      };

    } catch (error) {
      throw error;
    } finally {
      this.abortController = undefined;
    }
  }

  /**
   * Cancelar upload en progreso
   */
  async cancel(): Promise<void> {
    console.log('🛑 [Upload Manager] Cancelando upload...');

    // Cancelar streaming
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }

    // Abortar multipart
    if (this.currentSessionId) {
      await abortMultipartUpload(this.currentSessionId);
      this.currentSessionId = undefined;
    }
  }

  /**
   * Seleccionar estrategia basada en el tamaño del archivo
   */
  private selectStrategy(file: File, options: UploadOptions): 'amplify' | 'multipart' | 'streaming' {
    // Forzar multipart si se especifica
    if (options.forceMultipart) {
      return 'multipart';
    }

    // Basado en tamaño
    if (file.size < SMALL_FILE_THRESHOLD) {
      return 'amplify'; // < 10MB
    } else if (file.size < STREAMING_THRESHOLD) {
      return 'multipart'; // 10MB - 500MB
    } else {
      return 'streaming'; // > 500MB
    }
  }

  /**
   * Validar archivo antes de subir
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

    if (file.size > MAX_SIZE) {
      return { 
        isValid: false, 
        error: `Archivo excede el límite de 5GB (tamaño: ${this.formatFileSize(file.size)})` 
      };
    }

    // Validar tipos MIME
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: `Tipo de archivo no soportado: ${file.type}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Dividir archivo en chunks
   */
  private async splitFileIntoChunks(file: File, chunkSize: number): Promise<ArrayBuffer[]> {
    const chunks: ArrayBuffer[] = [];
    let offset = 0;

    while (offset < file.size) {
      const end = Math.min(offset + chunkSize, file.size);
      const chunk = file.slice(offset, end);
      const buffer = await chunk.arrayBuffer();
      chunks.push(buffer);
      offset = end;
    }

    return chunks;
  }

  /**
   * Convertir ArrayBuffer a Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  /**
   * Formatear tamaño de archivo
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }
}

// Singleton para uso global
export const uploadManager = new UploadManager();