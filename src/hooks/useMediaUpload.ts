'use client';

import { useState, useCallback } from 'react';

interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  fileSize?: number;
  contentType?: string;
  uploadMethod?: string;
  uploadedAt?: string;
}

interface UseMediaUploadReturn {
  uploadFile: (file: File) => Promise<UploadResult>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Hook personalizado para upload de archivos multimedia siguiendo AWS best practices
 * - Route Handler para archivos > 1MB (evita límites de Server Actions)
 * - Progreso realista basado en tamaño de archivo
 * - Detección automática de tipo de carpeta (images/videos)
 * - Manejo de errores detallado
 */
export function useMediaUpload(): UseMediaUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    console.log('📤 [useMediaUpload] Iniciando upload:', file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Determinar tipo de carpeta basado en extensión del archivo
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
      
      let folderType = 'images'; // Por defecto
      if (videoExtensions.includes(fileExtension || '')) {
        folderType = 'videos';
      } else if (imageExtensions.includes(fileExtension || '')) {
        folderType = 'images';
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folderType);

      // Simular progreso realista basado en tamaño
      const fileSizeMB = file.size / (1024 * 1024);
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          // Progreso más lento para archivos grandes
          const increment = fileSizeMB > 5 ? 3 : fileSizeMB > 1 ? 8 : 15;
          return Math.min(prev + increment, 85);
        });
      }, fileSizeMB > 10 ? 800 : fileSizeMB > 5 ? 500 : 300);

      // Llamar Route Handler (sin límite de 1MB)
      const response = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: UploadResult = await response.json();
      
      console.log('✅ [useMediaUpload] Upload exitoso:', {
        url: result.url,
        size: result.fileSize,
        method: result.uploadMethod
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado durante el upload';
      console.error('❌ [useMediaUpload] Error:', errorMessage);
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  return {
    uploadFile,
    isUploading,
    progress,
    error
  };
}