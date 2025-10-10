'use client';

import { useState, useCallback } from 'react';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { toastManager } from '@/components/ui/ToastWithPinpoint';

interface UploadedFile {
  id: string;
  url: string;
  fileName: string;
  type: 'image' | 'video';
  uploadProgress?: number;
  isUploading?: boolean;
}

interface MediaGalleryUploadProps {
  /** Archivos ya subidos */
  uploadedFiles: UploadedFile[];
  /** Callback cuando se sube un archivo */
  onFileUploaded: (file: UploadedFile) => void;
  /** Callback cuando se elimina un archivo */
  onFileRemoved: (fileId: string) => void;
  /** Tipo de archivos permitidos */
  mediaType: 'images' | 'videos' | 'mixed';
  /** Máximo número de archivos */
  maxFiles?: number;
  /** Texto del botón */
  addButtonText?: string;
  /** Si permite múltiple selección */
  multiple?: boolean;
}

export function MediaGalleryUpload({
  uploadedFiles = [],
  onFileUploaded,
  onFileRemoved,
  mediaType = 'images',
  maxFiles = 10,
  addButtonText,
  multiple = true
}: MediaGalleryUploadProps) {
  const { uploadFile } = useMediaUpload();
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());

  const getAcceptedFormats = () => {
    switch (mediaType) {
      case 'images':
        return '.jpg,.jpeg,.png,.webp,.gif';
      case 'videos':
        return '.mp4,.mov,.avi,.mkv,.webm';
      case 'mixed':
        return '.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.avi,.mkv,.webm';
      default:
        return '*';
    }
  };

  const getMediaType = (file: File): 'image' | 'video' => {
    return file.type.startsWith('image/') ? 'image' : 'video';
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check max files limit
    if (uploadedFiles.length + files.length > maxFiles) {
      toastManager.error(`📁 Solo puedes subir máximo ${maxFiles} archivos`, {
        trackingContext: {
          feature: 'media_upload',
          error: 'file_limit_exceeded',
          maxFiles,
          attemptedFiles: uploadedFiles.length + files.length,
          currentFiles: uploadedFiles.length,
          category: 'validation_error'
        }
      });
      return;
    }

    // Process each file
    for (const file of files) {
      const fileId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileType = getMediaType(file);
      
      // Add to uploading state
      setUploadingFiles(prev => new Map(prev).set(fileId, 0));

      try {
        const result = await uploadFile(file, (progress) => {
          setUploadingFiles(prev => new Map(prev).set(fileId, progress));
        });

        if (result.success && result.url) {
          // Remove from uploading state
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
          });

          // Add to uploaded files
          onFileUploaded({
            id: fileId,
            url: result.url,
            fileName: file.name,
            type: fileType
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }
    }

    // Clear input
    event.target.value = '';
  }, [uploadFile, onFileUploaded, uploadedFiles.length, maxFiles]);

  const handleRemoveFile = (fileId: string) => {
    onFileRemoved(fileId);
  };

  const inputId = `media-gallery-${Math.random().toString(36).substr(2, 9)}`;
  const canUploadMore = uploadedFiles.length + uploadingFiles.size < maxFiles;

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {canUploadMore && (
        <div>
          <input
            type="file"
            accept={getAcceptedFormats()}
            onChange={handleFileSelect}
            multiple={multiple}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className="cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {addButtonText || `Agregar ${mediaType === 'images' ? 'Imágenes' : mediaType === 'videos' ? 'Videos' : 'Archivos'}`}
          </label>
          <p className="text-xs text-gray-500 mt-1">
            {uploadedFiles.length}/{maxFiles} archivos subidos
          </p>
        </div>
      )}

      {/* Gallery Grid */}
      {(uploadedFiles.length > 0 || uploadingFiles.size > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Uploaded Files */}
          {uploadedFiles.map((file) => (
            <div key={file.id} className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              {file.type === 'image' ? (
                <img
                  src={file.url}
                  alt={file.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
                  <video
                    src={file.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* File Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-medium truncate">
                  {file.fileName}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveFile(file.id)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-xs font-bold"
                title="Eliminar archivo"
              >
                ×
              </button>

              {/* Success Indicator */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          ))}

          {/* Uploading Files */}
          {Array.from(uploadingFiles.entries()).map(([fileId, progress]) => (
            <div key={fileId} className="relative aspect-square bg-gray-200 rounded-xl overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs text-gray-600 font-medium">{progress}%</p>
              </div>
              
              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-300">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {uploadedFiles.length === 0 && uploadingFiles.size === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">
            {mediaType === 'images' ? '🖼️' : mediaType === 'videos' ? '🎥' : '📁'}
          </div>
          <p className="text-gray-600 mb-2">
            No hay {mediaType === 'images' ? 'imágenes' : mediaType === 'videos' ? 'videos' : 'archivos'} subidos aún
          </p>
          <p className="text-sm text-gray-500">
            Haz clic en "Agregar" para comenzar
          </p>
        </div>
      )}
    </div>
  );
}