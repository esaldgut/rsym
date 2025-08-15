'use client';

import { useState } from 'react';
import { uploadAndUpdateProfileImage } from '@/utils/storage-helpers';
import { useAmplifyAuth } from './useAmplifyAuth';

/**
 * Hook personalizado para manejar la carga de imágenes de perfil
 * Incluye actualización automática de Cognito y refresh del ID token
 */
export function useProfileImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAmplifyAuth();

  const uploadImage = async (
    file: File,
    options?: {
      onSuccess?: (imagePath: string) => void;
      onError?: (error: string) => void;
      forceReload?: boolean;
    }
  ): Promise<string | null> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      console.log('🖼️ Iniciando carga de imagen de perfil con hook personalizado...');

      const imagePath = await uploadAndUpdateProfileImage(file, user?.userId, {
        onProgress: (progress) => {
          const percentage = progress.totalBytes 
            ? Math.round((progress.transferredBytes / progress.totalBytes) * 100)
            : 0;
          setUploadProgress(percentage);
          console.log(`📊 Progreso: ${percentage}%`);
        },
        onCognitoUpdate: () => {
          console.log('✅ Cognito actualizado - atributo profilePhotoPath guardado');
        },
        onTokenRefresh: () => {
          console.log('✅ ID token refrescado - nuevos datos disponibles en la aplicación');
        }
      });

      if (imagePath) {
        console.log('🎉 Proceso completo exitoso - imagen, Cognito y token actualizados');
        options?.onSuccess?.(imagePath);
        
        // Si se requiere, recargar la página para reflejar cambios inmediatamente
        if (options?.forceReload) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
        
        return imagePath;
      } else {
        throw new Error('No se pudo completar el proceso de carga');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error en hook de carga de imagen:', errorMessage);
      setError(errorMessage);
      options?.onError?.(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetError = () => setError(null);

  return {
    uploadImage,
    isUploading,
    uploadProgress,
    error,
    resetError
  };
}