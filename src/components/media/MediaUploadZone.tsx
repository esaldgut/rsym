'use client';

import { useCallback, useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MediaFile } from './MediaPreview';
import { mediaUploadService, type MediaUploadResult } from '@/lib/services/media-upload-service';
import { toastManager } from '@/components/ui/Toast';

// Inline SVG icons
const Upload = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const Image = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Video = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

interface MediaUploadZoneProps {
  files: MediaFile[];
  onFilesChange: (files: MediaFile[]) => void;
  productId: string;
  type?: 'cover' | 'gallery' | 'video';
  accept?: 'image' | 'video' | 'all';
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

export function MediaUploadZone({
  files = [],
  onFilesChange,
  productId,
  type = 'gallery',
  accept = 'all',
  maxFiles = 10,
  className,
  disabled = false
}: MediaUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized values to prevent unnecessary re-renders
  // Incluir extensiones explícitas para influencers y creadores profesionales
  const acceptedTypes = useMemo(() => ({
    image: 'image/*,.heic,.HEIC,.heif,.HEIF,.dng,.DNG,.cr2,.CR2,.nef,.NEF,.arw,.ARW',
    video: 'video/*,.mov,.MOV,.mp4,.MP4,.m4v,.M4V,.webm,.avi,.mkv,.mts,.m2ts,.mxf',
    all: 'image/*,video/*,.mov,.MOV,.mp4,.MP4,.m4v,.M4V,.heic,.HEIC,.heif,.HEIF,.dng,.DNG,.cr2,.CR2,.nef,.NEF,.arw,.ARW,.webm,.avi,.mkv,.mts,.m2ts,.mxf'
  }), []);

  const canAddMore = useMemo(() => 
    files.length < maxFiles && !disabled, 
    [files.length, maxFiles, disabled]
  );

  const isUploading = useMemo(() => 
    uploadingCount > 0 || files.some(f => f.uploadStatus === 'uploading'), 
    [uploadingCount, files]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && canAddMore) {
      setIsDragOver(true);
    }
  }, [disabled, canAddMore]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Validar número máximo de archivos
    if (files.length + fileArray.length > maxFiles) {
      toastManager.show(
        `Solo puedes subir máximo ${maxFiles} archivos`,
        'error',
        3000
      );
      return;
    }

    // Validar y filtrar archivos
    const validFiles: File[] = [];
    for (const file of fileArray) {
      const validation = mediaUploadService.validateFile(file, type);
      
      if (!validation.valid) {
        toastManager.show(validation.error || 'Archivo no válido', 'error', 3000);
        continue;
      }

      // Validar tipo según accept - Detección mejorada para influencers profesionales
      const fileName = file.name.toLowerCase();

      // Extensiones de video profesionales
      const videoExtensions = ['.mov', '.mp4', '.m4v', '.webm', '.avi', '.mkv', '.mts', '.m2ts', '.mxf'];
      const isVideoByExtension = videoExtensions.some(ext => fileName.endsWith(ext));

      // Extensiones de imagen profesionales
      const imageExtensions = ['.heic', '.heif', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.dng', '.cr2', '.nef', '.arw', '.tif', '.tiff'];
      const isImageByExtension = imageExtensions.some(ext => fileName.endsWith(ext));

      // Casos donde el MIME type puede fallar o ser genérico
      const hasNoMimeType = !file.type || file.type === 'application/octet-stream' || file.type === '';
      const hasMimeType = !!file.type && file.type !== 'application/octet-stream';

      const isValidImage = accept !== 'video' && (
        (hasMimeType && file.type.startsWith('image/')) ||
        (hasNoMimeType && isImageByExtension) ||
        isImageByExtension  // Confiar en extensión siempre
      );

      const isValidVideo = accept !== 'image' && (
        (hasMimeType && (file.type.startsWith('video/') || file.type === 'video/quicktime' || file.type.includes('video'))) ||
        (hasNoMimeType && isVideoByExtension) ||
        isVideoByExtension  // Confiar en extensión siempre
      );

      if (!isValidImage && !isValidVideo) {
        console.log(`[MediaUploadZone] ❌ Archivo rechazado: ${file.name}, MIME: "${file.type || 'sin MIME'}", Extensión detectada: video=${isVideoByExtension}, image=${isImageByExtension}`);
        toastManager.show(
          `${file.name} no es un formato soportado. Acepta: MOV, MP4, HEIC, ProRAW y más formatos profesionales`,
          'error',
          4000
        );
        continue;
      }

      console.log(`[MediaUploadZone] ✅ Archivo aceptado: ${file.name}, MIME: "${file.type || 'detectado por extensión'}", Es video: ${isValidVideo}, Es imagen: ${isValidImage}`);

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Crear MediaFile objects con preview optimizados
    const mediaFiles: MediaFile[] = validFiles.map(file => {
      // Detectar tipo por extensión si el MIME no es claro
      const fileName = file.name.toLowerCase();
      const isVideo = file.type.startsWith('video/') ||
        fileName.endsWith('.mov') || fileName.endsWith('.m4v') || fileName.endsWith('.mp4');
      const isImage = file.type.startsWith('image/') ||
        fileName.endsWith('.heic') || fileName.endsWith('.heif') ||
        fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');

      const preview = (isImage || isVideo)
        ? URL.createObjectURL(file)
        : undefined;
      
      return {
        file,
        preview,
        uploadProgress: 0,
        uploadStatus: 'idle'
      };
    });

    // Agregar archivos al estado para preview inmediato
    const updatedFiles = [...files, ...mediaFiles];
    onFilesChange(updatedFiles);

    // Iniciar uploads con control de concurrencia
    setUploadingCount(validFiles.length);
    
    try {
      const results = await mediaUploadService.uploadMultiple(
        validFiles,
        productId,
        type,
        (fileIndex, progress) => {
          // Actualizar progreso del archivo específico
          const actualIndex = files.length + fileIndex;
          const newFiles = [...updatedFiles];
          
          if (newFiles[actualIndex]) {
            newFiles[actualIndex] = {
              ...newFiles[actualIndex],
              uploadProgress: progress.percentage,
              uploadStatus: progress.stage === 'complete' ? 'complete' : 
                           progress.stage === 'error' ? 'error' : 'uploading'
            };
            onFilesChange(newFiles);
          }
        },
        3 // máximo 3 uploads concurrentes
      );

      // Procesar resultados y actualizar estado final
      const finalFiles = [...updatedFiles];
      results.forEach((result, index) => {
        const actualIndex = files.length + index;
        if (finalFiles[actualIndex]) {
          if (result.success && result.url) {
            // Caso 1: Upload exitoso con URL disponible
            finalFiles[actualIndex] = {
              ...finalFiles[actualIndex],
              uploadStatus: 'complete',
              uploadProgress: 100,
              url: result.url,
              s3Key: result.key,
              // IMPORTANTE: Mantener el preview blob local, NO usar la URL de S3
              // porque el bucket es privado y requiere URLs prefirmadas
              // preview: finalFiles[actualIndex].preview // Mantener el blob URL existente
            };

            toastManager.show(
              `${validFiles[index].name} subido exitosamente`,
              'success',
              2000
            );
          } else if (result.success && result.warning) {
            // Caso 2: Timeout client-side pero posiblemente subido en backend
            finalFiles[actualIndex] = {
              ...finalFiles[actualIndex],
              uploadStatus: 'complete',
              uploadProgress: 100,
              url: result.url, // Puede ser undefined
              s3Key: result.key
            };

            toastManager.show(
              `⚠️ ${validFiles[index].name}: El archivo tardó más de lo esperado. Verifica en el servidor si se subió correctamente.`,
              'warning',
              5000
            );
          } else {
            // Caso 3: Error real
            finalFiles[actualIndex] = {
              ...finalFiles[actualIndex],
              uploadStatus: 'error',
              error: result.error || 'Error desconocido'
            };

            toastManager.show(
              `Error al subir ${validFiles[index].name}: ${result.error}`,
              'error',
              4000
            );
          }
        }
      });

      onFilesChange(finalFiles);
      
    } catch (error) {
      console.error('Error in batch upload:', error);
      toastManager.show('Error al procesar archivos', 'error', 3000);
    } finally {
      setUploadingCount(0);
    }
    
  }, [files, maxFiles, type, accept, productId, onFilesChange]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isUploading || !canAddMore) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      await processFiles(droppedFiles);
    }
  }, [disabled, isUploading, canAddMore, processFiles]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      await processFiles(selectedFiles);
    }
    // Limpiar input
    e.target.value = '';
  }, [processFiles]);

  const openFileSelector = useCallback(() => {
    if (!disabled && !isUploading && canAddMore) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading, canAddMore]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone Principal */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={canAddMore && !isUploading ? openFileSelector : undefined}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all duration-200",
          isDragOver && !disabled && "border-blue-400 bg-blue-50",
          !isDragOver && !disabled && canAddMore && "border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer",
          disabled && "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60",
          !canAddMore && "border-gray-200 bg-gray-100 cursor-not-allowed",
          isUploading && "border-blue-300 bg-blue-50"
        )}
      >
        <div className="text-center">
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Subiendo {uploadingCount} archivo{uploadingCount !== 1 ? 's' : ''}...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Usando AWS Route Handler optimizado para archivos grandes
                </p>
              </div>
            </div>
          ) : (
            <>
              {accept === 'image' && <Image className="h-8 w-8 text-gray-400 mx-auto mb-3" />}
              {accept === 'video' && <Video className="h-8 w-8 text-gray-400 mx-auto mb-3" />}
              {accept === 'all' && <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />}
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {canAddMore 
                    ? 'Arrastra archivos aquí o haz clic para seleccionar' 
                    : `Máximo ${maxFiles} archivos alcanzado`
                  }
                </p>
                
                <div className="text-xs text-gray-500 space-y-1">
                  {accept === 'image' && (
                    <p>Solo imágenes • Hasta {type === 'cover' ? '10MB' : '50MB'}</p>
                  )}
                  {accept === 'video' && (
                    <p>Solo videos • Hasta 5GB • Optimizado para archivos grandes</p>
                  )}
                  {accept === 'all' && (
                    <p>Imágenes y videos • Optimizado para archivos grandes</p>
                  )}
                  
                  {files.length > 0 && (
                    <p className="text-gray-400 font-medium">
                      {files.length} de {maxFiles} archivos • {files.filter(f => f.uploadStatus === 'complete').length} completados
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedTypes[accept]}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading || !canAddMore}
        />
      </div>

      {/* Botón Agregar Más (cuando ya hay archivos) */}
      {files.length > 0 && canAddMore && !isUploading && (
        <button
          onClick={openFileSelector}
          className="flex items-center justify-center w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium text-gray-700"
          type="button"
        >
          <Plus className="h-4 w-4 mr-2 text-gray-500" />
          Agregar más archivos
        </button>
      )}
    </div>
  );
}

export default MediaUploadZone;