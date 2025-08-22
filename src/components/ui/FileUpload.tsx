'use client';

import { useState, useCallback } from 'react';
import { useMediaUpload } from '@/hooks/useMediaUpload';

interface FileUploadProps {
  /** Tipo de archivo que se puede subir */
  accept: string;
  /** Función callback cuando se sube un archivo exitosamente */
  onUploadSuccess: (url: string, fileName: string) => void;
  /** Función callback cuando ocurre un error */
  onUploadError?: (error: string) => void;
  /** Texto del botón */
  buttonText?: string;
  /** Clases CSS adicionales para el botón */
  buttonClassName?: string;
  /** Tamaño máximo de archivo en MB */
  maxSizeMB?: number;
  /** Si está deshabilitado */
  disabled?: boolean;
}

export function FileUpload({
  accept,
  onUploadSuccess,
  onUploadError,
  buttonText = 'Subir Archivo',
  buttonClassName = 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400',
  maxSizeMB = 10,
  disabled = false
}: FileUploadProps) {
  const { uploadFile, isUploading, progress } = useMediaUpload();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño de archivo
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      const error = `El archivo es demasiado grande. Máximo permitido: ${maxSizeMB}MB`;
      onUploadError?.(error);
      return;
    }

    // Validar tipo de archivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = accept.split(',').map(ext => ext.trim().replace('.', ''));
    
    if (fileExtension && !acceptedExtensions.includes(fileExtension)) {
      const error = `Tipo de archivo no permitido. Formatos aceptados: ${accept}`;
      onUploadError?.(error);
      return;
    }

    try {
      const result = await uploadFile(file);
      if (result.success && result.url) {
        onUploadSuccess(result.url, file.name);
      }
    } catch (error) {
      // Error handling ya está en el hook
    } finally {
      // Limpiar el input
      event.target.value = '';
    }
  }, [accept, maxSizeMB, onUploadSuccess, onUploadError, uploadFile]);

  const inputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative">
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
        id={inputId}
      />
      <label
        htmlFor={inputId}
        className={`cursor-pointer inline-block ${buttonClassName} ${
          (disabled || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isUploading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Subiendo... {progress}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {buttonText}
          </div>
        )}
      </label>
      
      {/* Barra de progreso */}
      {isUploading && (
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente específico para subir imágenes
 */
export function ImageUpload({ onUploadSuccess, onUploadError, disabled = false }: {
  onUploadSuccess: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}) {
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validación específica para imágenes
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      onUploadError?.('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onUploadError?.('La imagen no puede ser mayor a 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'images'); // Forzar carpeta de imágenes
      
      const result = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData
      });
      
      const uploadResult = await result.json();
      
      if (uploadResult.success && uploadResult.url) {
        onUploadSuccess(uploadResult.url, file.name);
      } else {
        onUploadError?.(uploadResult.error || 'Error al subir la imagen');
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      event.target.value = '';
    }
  }, [onUploadSuccess, onUploadError]);

  // Evitar warning
  void handleImageUpload;

  return (
    <FileUpload
      accept=".jpg,.jpeg,.png,.webp,.gif"
      onUploadSuccess={onUploadSuccess}
      onUploadError={onUploadError}
      buttonText="Seleccionar Imagen"
      buttonClassName="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
      maxSizeMB={10}
      disabled={disabled}
    />
  );
}

/**
 * Componente específico para subir videos
 */
export function VideoUpload({ onUploadSuccess, onUploadError, disabled = false }: {
  onUploadSuccess: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}) {
  const handleVideoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validación específica para videos
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
    if (!validVideoTypes.includes(file.type)) {
      onUploadError?.('Por favor selecciona un archivo de video válido (MP4, MOV, AVI, MKV, WEBM)');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      onUploadError?.('El video no puede ser mayor a 100MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'videos'); // Forzar carpeta de videos
      
      const result = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData
      });
      
      const uploadResult = await result.json();
      
      if (uploadResult.success && uploadResult.url) {
        onUploadSuccess(uploadResult.url, file.name);
      } else {
        onUploadError?.(uploadResult.error || 'Error al subir el video');
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      event.target.value = '';
    }
  }, [onUploadSuccess, onUploadError]);

  // Evitar warning
  void handleVideoUpload;

  return (
    <FileUpload
      accept=".mp4,.mov,.avi,.mkv,.webm"
      onUploadSuccess={onUploadSuccess}
      onUploadError={onUploadError}
      buttonText="Seleccionar Video"
      buttonClassName="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      maxSizeMB={100}
      disabled={disabled}
    />
  );
}