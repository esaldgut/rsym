'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';

interface MediaUploaderProps {
  onFileSelected: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
  maxImageSize?: number; // en MB
  maxVideoSize?: number; // en MB
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function MediaUploader({
  onFileSelected,
  selectedFile,
  disabled = false,
  maxImageSize = 10,
  maxVideoSize = 100
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);

  // Eliminar archivo
  const handleRemoveFile = useCallback(() => {
    setPreview(null);
    setError(null);
    setFileType(null);
    onFileSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelected]);

  // Validar y procesar archivo
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      handleRemoveFile();
      return;
    }

    // Validar tipo de archivo
    let isImage = false;
    
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      isImage = true;
      if (file.size > maxImageSize * 1024 * 1024) {
        setError(`La imagen no puede superar ${maxImageSize}MB`);
        return;
      }
    } else if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
      if (file.size > maxVideoSize * 1024 * 1024) {
        setError(`El video no puede superar ${maxVideoSize}MB`);
        return;
      }
    } else {
      setError('Tipo de archivo no permitido. Usa JPG, PNG, GIF, WEBP, MP4, WEBM o MOV');
      return;
    }

    setError(null);
    setFileType(isImage ? 'image' : 'video');
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    onFileSelected(file);
  }, [maxImageSize, maxVideoSize, onFileSelected, handleRemoveFile]);

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Área de carga */}
      {!selectedFile ? (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-pink-500 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="flex space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Arrastra y suelta una imagen o video</p>
              <p className="text-gray-500 text-sm mt-1">o haz clic para seleccionar</p>
            </div>
            <div className="text-xs text-gray-400">
              <p>Imágenes: JPG, PNG, GIF, WEBP (máx. {maxImageSize}MB)</p>
              <p>Videos: MP4, WEBM, MOV (máx. {maxVideoSize}MB)</p>
            </div>
          </div>
        </div>
      ) : (
        /* Preview del archivo */
        <div className="relative rounded-xl overflow-hidden bg-gray-100">
          {fileType === 'image' && preview ? (
            <div className="relative aspect-video">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
          ) : fileType === 'video' && preview ? (
            <video
              src={preview}
              className="w-full max-h-96 object-contain"
              controls
              muted
            />
          ) : null}

          {/* Información del archivo */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex justify-between items-center text-white">
              <div>
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs opacity-80">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                disabled={disabled}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Botones adicionales cuando no hay archivo */}
      {!selectedFile && (
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => !disabled && fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Foto</span>
          </button>
          <button
            type="button"
            onClick={() => !disabled && fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Video</span>
          </button>
        </div>
      )}
    </div>
  );
}