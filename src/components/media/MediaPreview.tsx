'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';

// Inline SVG icons - optimizados como componentes memo
const X = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
));
X.displayName = 'XIcon';

const Play = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M8 5v10l8-5-8-5z" />
  </svg>
));
Play.displayName = 'PlayIcon';

const Loader2 = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
));
Loader2.displayName = 'Loader2Icon';

const AlertTriangle = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
));
AlertTriangle.displayName = 'AlertTriangleIcon';

export interface MediaFile {
  file: File;
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  s3Key?: string;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

interface MediaPreviewProps {
  files: MediaFile[];
  onRemove?: (index: number) => void;
  className?: string;
  showProgress?: boolean;
  maxDisplaySize?: 'sm' | 'md' | 'lg';
  layout?: 'list' | 'grid';
}

export const MediaPreview = memo(function MediaPreview({ 
  files, 
  onRemove, 
  className,
  showProgress = true,
  maxDisplaySize = 'md',
  layout = 'list'
}: MediaPreviewProps) {
  if (!files || files.length === 0) return null;

  const containerClasses = cn(
    layout === 'grid' 
      ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
      : "space-y-4",
    className
  );

  return (
    <div className={containerClasses}>
      {files.map((mediaFile, index) => (
        <MediaPreviewItem
          key={`${mediaFile.file.name}-${mediaFile.file.size}-${index}`} // Clave estable
          mediaFile={mediaFile}
          onRemove={onRemove ? () => onRemove(index) : undefined}
          showProgress={showProgress}
          maxDisplaySize={maxDisplaySize}
          layout={layout}
        />
      ))}
    </div>
  );
});

interface MediaPreviewItemProps {
  mediaFile: MediaFile;
  onRemove?: () => void;
  showProgress?: boolean;
  maxDisplaySize?: 'sm' | 'md' | 'lg';
  layout?: 'list' | 'grid';
}

const MediaPreviewItem = memo(function MediaPreviewItem({ 
  mediaFile, 
  onRemove, 
  showProgress = true,
  maxDisplaySize = 'md',
  layout = 'list'
}: MediaPreviewItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { file, uploadProgress = 0, uploadStatus = 'idle', error, url } = mediaFile;
  
  // Usar la URL de S3 si está disponible, sino usar preview local
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    mediaFile.url || mediaFile.preview
  );
  
  // Actualizar preview URL cuando la URL de S3 esté disponible
  useEffect(() => {
    if (url && url !== previewUrl) {
      setPreviewUrl(url);
      // Resetear estado de carga para mostrar transición suave
      setImageLoaded(false);
      setImageError(false);
    }
  }, [url, previewUrl]);
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  // Generar preview URL solo una vez y manejar cleanup
  useEffect(() => {
    // Solo crear object URL si no tenemos preview URL y no hay URL de S3
    if (!previewUrl && !url && (isImage || isVideo)) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [file, isImage, isVideo, previewUrl, url]);

  // Manejar carga de imagen
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const containerClasses = cn(
    "relative rounded-lg overflow-hidden border-2 transition-all duration-200",
    sizeClasses[maxDisplaySize],
    uploadStatus === 'uploading' && "border-blue-300 bg-blue-50",
    uploadStatus === 'complete' && "border-green-300 bg-green-50", 
    uploadStatus === 'error' && "border-red-300 bg-red-50",
    uploadStatus === 'idle' && "border-gray-200 hover:border-gray-300"
  );

  // Determinar la URL de imagen a usar (priorizar S3 URL si existe)
  const displayUrl = url || previewUrl;

  if (layout === 'grid') {
    return (
      <div className="bg-white rounded-lg border p-3 shadow-sm">
        <div className={containerClasses}>
          {isImage && displayUrl && (
            <>
              <img
                src={displayUrl}
                alt={file.name}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-200",
                  !imageLoaded && "opacity-0"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
              )}
            </>
          )}

          {isVideo && displayUrl && (
            <div className="relative w-full h-full bg-black">
              <video
                src={displayUrl}
                className="w-full h-full object-cover"
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-6 w-6 text-white fill-current" />
              </div>
            </div>
          )}

          {/* Upload Status Overlay */}
          {showProgress && uploadStatus !== 'idle' && uploadStatus !== 'complete' && (
            <UploadOverlay uploadStatus={uploadStatus} uploadProgress={uploadProgress} />
          )}

          {/* Remove Button */}
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors duration-200"
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        </div>
      </div>
    );
  }

  // Layout de lista (por defecto)
  return (
    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border shadow-sm">
      {/* Preview Container */}
      <div className={containerClasses}>
        {isImage && displayUrl && (
          <>
            <img
              src={displayUrl}
              alt={file.name}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-200",
                !imageLoaded && "opacity-0"
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
            
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            )}
          </>
        )}

        {isVideo && displayUrl && (
          <div className="relative w-full h-full bg-black">
            <video
              src={displayUrl}
              className="w-full h-full object-cover"
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="h-6 w-6 text-white fill-current" />
            </div>
          </div>
        )}

        {/* Upload Status Overlay */}
        {showProgress && uploadStatus !== 'idle' && uploadStatus !== 'complete' && (
          <UploadOverlay uploadStatus={uploadStatus} uploadProgress={uploadProgress} />
        )}

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors duration-200"
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-2">
            <UploadStatusBadge uploadStatus={uploadStatus} uploadProgress={uploadProgress} />
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && uploadStatus === 'uploading' && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && uploadStatus === 'error' && (
          <p className="mt-1 text-xs text-red-600 truncate">{error}</p>
        )}
      </div>
    </div>
  );
});

// Componentes auxiliares memoizados
const UploadOverlay = memo(({ uploadStatus, uploadProgress }: { 
  uploadStatus: MediaFile['uploadStatus']; 
  uploadProgress: number;
}) => (
  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
    {uploadStatus === 'uploading' && (
      <div className="text-white text-center">
        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
        <div className="text-xs font-medium">{Math.round(uploadProgress)}%</div>
      </div>
    )}
    
    {uploadStatus === 'processing' && (
      <div className="text-white text-center">
        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
        <div className="text-xs font-medium">Procesando</div>
      </div>
    )}
    
    {uploadStatus === 'error' && (
      <div className="text-red-200 text-center">
        <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
        <div className="text-xs font-medium">Error</div>
      </div>
    )}
  </div>
));
UploadOverlay.displayName = 'UploadOverlay';

const UploadStatusBadge = memo(({ uploadStatus, uploadProgress }: { 
  uploadStatus: MediaFile['uploadStatus']; 
  uploadProgress: number;
}) => {
  if (uploadStatus === 'complete') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Subido
      </span>
    );
  }
  
  if (uploadStatus === 'uploading') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {Math.round(uploadProgress)}%
      </span>
    );
  }
  
  if (uploadStatus === 'error') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Error
      </span>
    );
  }
  
  return null;
});
UploadStatusBadge.displayName = 'UploadStatusBadge';

// Utility function
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export default MediaPreview;
