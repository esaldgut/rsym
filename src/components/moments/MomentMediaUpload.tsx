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

  // Configuración para INFLUENCERS PROFESIONALES - iPhone + Cámaras Profesionales
  const momentsConfig = useMemo(() => ({
    // Límites aumentados para contenido profesional
    maxImageSize: 100 * 1024 * 1024,  // 100MB para ProRAW, DNG, fotos profesionales
    maxVideoSize: 1 * 1024 * 1024 * 1024, // 1GB para videos profesionales (ProRes, 4K)

    // Formatos de imagen para influencers profesionales
    allowedImageTypes: [
      // iPhone
      'image/jpeg', 'image/jpg',        // JPEG estándar
      'image/heic', 'image/heif',       // HEIC/HEIF del iPhone (High Efficiency)
      'image/heic-sequence',             // Live Photos
      'image/x-adobe-dng',               // ProRAW del iPhone (DNG)

      // Formatos profesionales y web
      'image/png',                       // PNG con transparencia
      'image/webp',                      // WebP moderno
      'image/gif',                       // GIFs animados

      // Formatos RAW de cámaras profesionales
      'image/x-canon-cr2',               // Canon RAW
      'image/x-nikon-nef',               // Nikon RAW
      'image/x-sony-arw',                // Sony RAW
      'image/tiff',                      // TIFF profesional
    ],

    // Formatos de video para influencers profesionales
    allowedVideoTypes: [
      // iPhone
      'video/quicktime',                 // MOV del iPhone (H.264/HEVC/ProRes)
      'video/x-m4v',                     // M4V de Apple

      // Formatos universales
      'video/mp4',                       // MP4 H.264 - máxima compatibilidad
      'video/webm',                      // WebM para web

      // Formatos profesionales
      'video/x-msvideo',                 // AVI
      'video/x-matroska',                // MKV alta calidad
      'application/mxf',                 // MXF broadcast
      'video/mp2t',                      // MPEG-TS de cámaras profesionales
    ],
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
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const maxMB = Math.round(momentsConfig.maxImageSize / (1024 * 1024));
        return {
          valid: false,
          error: `📸 Foto muy grande (${sizeMB}MB). Límite: ${maxMB}MB para influencers profesionales`
        };
      }

      // Validar por extensión (más confiable que MIME type)
      const fileName = file.name.toLowerCase();
      const isRAW = fileName.endsWith('.dng') || fileName.endsWith('.cr2') ||
                    fileName.endsWith('.nef') || fileName.endsWith('.arw');
      const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');
      const isCommon = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
                       fileName.endsWith('.png') || fileName.endsWith('.webp') ||
                       fileName.endsWith('.gif');

      if (!momentsConfig.allowedImageTypes.includes(file.type) && !isRAW && !isHEIC && !isCommon) {
        return {
          valid: false,
          error: `📷 Formato de foto no soportado. Acepta: JPG, PNG, HEIC, ProRAW (DNG), CR2, NEF, ARW`
        };
      }
    } else if (file.type.startsWith('video/') || file.type === 'video/quicktime' || file.name.toLowerCase().endsWith('.mov')) {
      if (file.size > momentsConfig.maxVideoSize) {
        const sizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
        const maxGB = Math.round(momentsConfig.maxVideoSize / (1024 * 1024 * 1024));
        return {
          valid: false,
          error: `🎬 Video muy grande (${sizeGB}GB). Límite: ${maxGB}GB para contenido profesional`
        };
      }

      // Validar por extensión (más confiable)
      const fileName = file.name.toLowerCase();
      const isProFormat = fileName.endsWith('.mov') || fileName.endsWith('.m4v') ||
                          fileName.endsWith('.mxf') || fileName.endsWith('.mts') || fileName.endsWith('.m2ts');
      const isCommonVideo = fileName.endsWith('.mp4') || fileName.endsWith('.webm') ||
                            fileName.endsWith('.avi') || fileName.endsWith('.mkv');

      if (!momentsConfig.allowedVideoTypes.includes(file.type) && !isProFormat && !isCommonVideo) {
        return {
          valid: false,
          error: `🎥 Formato de video no soportado. Acepta: MOV, MP4, ProRes, MXF, AVI, MKV`
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

      {/* Helper Text - Actualizado para influencers profesionales */}
      <div className="text-center text-xs text-gray-500 space-y-2">
        <p className="font-medium text-gray-700">{placeholder}</p>

        <div className="flex justify-center flex-wrap gap-3">
          <span className="bg-purple-50 px-2 py-1 rounded">📷 Fotos hasta 100MB</span>
          <span className="bg-pink-50 px-2 py-1 rounded">🎬 Videos hasta 1GB</span>
          <span className="bg-blue-50 px-2 py-1 rounded">📱 iPhone ProRes/ProRAW</span>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 mt-2">
          <p className="font-semibold text-gray-800 mb-1">✨ Formatos Profesionales Soportados</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
            <div>
              <span className="font-medium">iPhone:</span> MOV, HEIC, ProRAW (DNG)
            </div>
            <div>
              <span className="font-medium">Cámaras:</span> CR2, NEF, ARW, MXF
            </div>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 italic">
          💡 Optimizado para influencers: Soportamos ProRes 4K, Live Photos y formatos RAW de cámaras profesionales
        </p>
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