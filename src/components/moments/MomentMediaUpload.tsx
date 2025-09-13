'use client';

import { useState, useCallback, useMemo } from 'react';
import MediaUploadZone from '@/components/media/MediaUploadZone';
import MediaPreview, { type MediaFile } from '@/components/media/MediaPreview';
import { mediaUploadService } from '@/lib/services/media-upload-service';
import { toastManager } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface MomentMediaUploadProps {
  momentId?: string;
  userId: string;
  onMediaChange?: (mediaFiles: MediaFile[]) => void;
  maxFiles?: number;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Componente especializado para upload de multimedia en Moments
 * Reutiliza el sistema multimedia YAAN con configuración específica para red social
 */
export function MomentMediaUpload({
  momentId = 'temp',
  userId,
  onMediaChange,
  maxFiles = 10,
  className,
  placeholder = "Comparte fotos y videos de tu experiencia...",
  disabled = false
}: MomentMediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // Configuración específica para Moments
  const momentsConfig = useMemo(() => ({
    maxImageSize: 25 * 1024 * 1024,  // 25MB para imágenes en momentos
    maxVideoSize: 100 * 1024 * 1024, // 100MB para videos en momentos
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  }), []);

  // Handler optimizado para cambios de archivos
  const handleMediaChange = useCallback((files: MediaFile[]) => {
    setMediaFiles(files);
    onMediaChange?.(files);
  }, [onMediaChange]);

  // Validación personalizada para Moments
  const validateMomentFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Validar tamaño según tipo
    if (file.type.startsWith('image/')) {
      if (file.size > momentsConfig.maxImageSize) {
        return {
          valid: false,
          error: `Imagen muy grande. Máximo ${Math.round(momentsConfig.maxImageSize / (1024 * 1024))}MB para momentos`
        };
      }
      if (!momentsConfig.allowedImageTypes.includes(file.type)) {
        return {
          valid: false,
          error: 'Tipo de imagen no permitido. Solo JPG, PNG, WebP, GIF'
        };
      }
    } else if (file.type.startsWith('video/')) {
      if (file.size > momentsConfig.maxVideoSize) {
        return {
          valid: false,
          error: `Video muy grande. Máximo ${Math.round(momentsConfig.maxVideoSize / (1024 * 1024))}MB para momentos`
        };
      }
      if (!momentsConfig.allowedVideoTypes.includes(file.type)) {
        return {
          valid: false,
          error: 'Tipo de video no permitido. Solo MP4, WebM, MOV'
        };
      }
    } else {
      return {
        valid: false,
        error: 'Solo se permiten imágenes y videos en los momentos'
      };
    }

    return { valid: true };
  }, [momentsConfig]);

  // Estadísticas de upload para UX
  const uploadStats = useMemo(() => {
    const total = mediaFiles.length;
    const completed = mediaFiles.filter(f => f.uploadStatus === 'complete').length;
    const uploading = mediaFiles.filter(f => f.uploadStatus === 'uploading').length;
    const failed = mediaFiles.filter(f => f.uploadStatus === 'error').length;
    
    return { total, completed, uploading, failed };
  }, [mediaFiles]);

  const isUploading = uploadStats.uploading > 0;
  const hasFiles = mediaFiles.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Statistics - Solo mostrar si hay archivos */}
      {hasFiles && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                📁 {uploadStats.total} archivo{uploadStats.total !== 1 ? 's' : ''}
              </span>
              {uploadStats.completed > 0 && (
                <span className="text-green-700">
                  ✅ {uploadStats.completed} completado{uploadStats.completed !== 1 ? 's' : ''}
                </span>
              )}
              {uploadStats.uploading > 0 && (
                <span className="text-blue-700 flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>⏳ {uploadStats.uploading} subiendo</span>
                </span>
              )}
              {uploadStats.failed > 0 && (
                <span className="text-red-700">
                  ❌ {uploadStats.failed} falló
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              {maxFiles - uploadStats.total} restantes
            </div>
          </div>
        </div>
      )}

      {/* Media Preview - Layout optimizado para momentos */}
      {hasFiles && (
        <div className="bg-white rounded-lg border p-4">
          <MediaPreview 
            files={mediaFiles}
            onRemove={(index) => {
              const updatedFiles = mediaFiles.filter((_, i) => i !== index);
              handleMediaChange(updatedFiles);
            }}
            layout="grid"
            maxDisplaySize="md"
            showProgress={true}
          />
        </div>
      )}

      {/* Upload Zone - Diseño específico para Moments */}
      <div className="bg-white rounded-lg border border-dashed border-gray-300">
        <MediaUploadZone
          files={mediaFiles}
          onFilesChange={handleMediaChange}
          productId={`moment-${momentId}`}
          type="gallery"
          accept="all"
          maxFiles={maxFiles}
          disabled={disabled}
          className="border-0" // Remover border ya que el contenedor ya lo tiene
        />
      </div>

      {/* Helper Text */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>{placeholder}</p>
        <div className="flex justify-center space-x-4">
          <span>🖼️ Imágenes hasta 25MB</span>
          <span>🎥 Videos hasta 100MB</span>
          <span>📱 Formato optimizado para móvil</span>
        </div>
      </div>

      {/* Quick Actions para Moments */}
      {hasFiles && !isUploading && (
        <div className="flex justify-center space-x-3">
          <button
            type="button"
            onClick={() => handleMediaChange([])}
            className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors duration-200"
          >
            🗑️ Limpiar todo
          </button>
          
          <button
            type="button"
            onClick={() => {
              const completedFiles = mediaFiles.filter(f => f.uploadStatus === 'complete');
              if (completedFiles.length > 0) {
                toastManager.show(
                  `✅ ${completedFiles.length} archivo${completedFiles.length !== 1 ? 's' : ''} listo${completedFiles.length !== 1 ? 's' : ''} para publicar`,
                  'success',
                  3000
                );
              }
            }}
            disabled={uploadStats.completed === 0}
            className="px-4 py-2 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            📤 Compartir Momento
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Hook personalizado para gestión de multimedia en Moments
 */
export function useMomentMedia(momentId?: string, userId?: string) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    if (!momentId || !userId) {
      throw new Error('momentId y userId son requeridos para upload');
    }

    setIsUploading(true);
    try {
      const result = await mediaUploadService.uploadFile(
        file,
        `moment-${momentId}`,
        'gallery',
        (progress) => {
          // Actualizar progreso en tiempo real
          console.log(`Moment upload progress: ${progress.percentage}%`);
        }
      );

      if (result.success && result.url) {
        const mediaFile: MediaFile = {
          file,
          url: result.url,
          s3Key: result.key,
          uploadStatus: 'complete',
          uploadProgress: 100
        };
        
        setMediaFiles(prev => [...prev, mediaFile]);
        return mediaFile;
      } else {
        throw new Error(result.error || 'Error uploading file');
      }
    } finally {
      setIsUploading(false);
    }
  }, [momentId, userId]);

  const removeFile = useCallback((index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setMediaFiles([]);
  }, []);

  const getCompletedFiles = useCallback(() => {
    return mediaFiles.filter(f => f.uploadStatus === 'complete');
  }, [mediaFiles]);

  return {
    mediaFiles,
    setMediaFiles,
    isUploading,
    uploadFile,
    removeFile,
    clearAll,
    getCompletedFiles,
    stats: {
      total: mediaFiles.length,
      completed: mediaFiles.filter(f => f.uploadStatus === 'complete').length,
      uploading: mediaFiles.filter(f => f.uploadStatus === 'uploading').length,
      failed: mediaFiles.filter(f => f.uploadStatus === 'error').length
    }
  };
}

export default MomentMediaUpload;