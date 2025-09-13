'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LocationSelector } from '@/components/location/LocationSelector';
import { useProductForm } from '@/context/ProductFormContext';
import { Preferences } from '@/utils/preferences';
import { toastManager } from '@/components/ui/Toast';
import MediaPreview, { type MediaFile } from '@/components/media/MediaPreview';
import MediaUploadZone from '@/components/media/MediaUploadZone';
import { 
  generalInfoCircuitSchema, 
  generalInfoPackageSchema 
} from '@/lib/validations/product-schemas';
import type { StepProps } from '@/types/wizard';
import type { CircuitLocation } from '@/types/location';

interface GeneralInfoFormData {
  name: string;
  preferences: string[];
  languages: string[];
  description: string;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  destination?: any[]; // Solo para circuitos
}

// Idiomas disponibles
const LANGUAGES = [
  { id: 'es', name: 'Español' },
  { id: 'en', name: 'Inglés' },
  { id: 'fr', name: 'Francés' },
  { id: 'de', name: 'Alemán' },
  { id: 'it', name: 'Italiano' },
  { id: 'pt', name: 'Portugués' },
];

export default function GeneralInfoStep({ userId, onNext, isValid }: StepProps) {
  const { formData, updateFormData } = useProductForm();
  
  // Estados de archivos multimedia separados para evitar loops
  const [coverFiles, setCoverFiles] = useState<MediaFile[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<MediaFile[]>([]);
  const [videoFiles, setVideoFiles] = useState<MediaFile[]>([]);

  const schema = useMemo(() => 
    formData.productType === 'circuit' 
      ? generalInfoCircuitSchema 
      : generalInfoPackageSchema,
    [formData.productType]
  );

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<GeneralInfoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: formData.name || '',
      preferences: formData.preferences || [],
      languages: formData.languages || [],
      description: formData.description || '',
      cover_image_url: formData.cover_image_url || '',
      image_url: formData.image_url || [],
      video_url: formData.video_url || [],
      ...(formData.productType === 'circuit' && { destination: formData.destination || [] })
    }
  });

  const onSubmit = useCallback((data: GeneralInfoFormData) => {
    updateFormData(data);
    onNext();
  }, [updateFormData, onNext]);

  // Watchers para campos principales (con debounce para evitar updates excesivos)
  const name = watch('name');
  const description = watch('description');
  const preferences = watch('preferences');
  const languages = watch('languages');

  // Sincronizar el valor del nombre desde el contexto cuando cambie
  useEffect(() => {
    if (formData.name && formData.name !== name) {
      setValue('name', formData.name);
    }
  }, [formData.name, name, setValue]);

  // Actualizar nombre en el context cuando cambie (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (name !== formData.name) {
        updateFormData({ name });
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [name, formData.name, updateFormData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (description !== formData.description) {
        updateFormData({ description });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [description, formData.description, updateFormData]);

  // Updates inmediatos para arrays (pero con comparación de referencia)
  useEffect(() => {
    if (preferences !== formData.preferences) {
      updateFormData({ preferences });
    }
  }, [preferences, formData.preferences, updateFormData]);

  useEffect(() => {
    if (languages !== formData.languages) {
      updateFormData({ languages });
    }
  }, [languages, formData.languages, updateFormData]);

  // Sincronizar URLs de archivos cuando cambian los estados
  const handleCoverFilesChange = useCallback((files: MediaFile[]) => {
    setCoverFiles(files);
    const coverUrl = files.find(f => f.uploadStatus === 'complete')?.url || '';
    setValue('cover_image_url', coverUrl);
    updateFormData({ cover_image_url: coverUrl });
  }, [setValue, updateFormData]);

  const handleGalleryFilesChange = useCallback((files: MediaFile[]) => {
    setGalleryFiles(files);
    const galleryUrls = files
      .filter(f => f.uploadStatus === 'complete')
      .map(f => f.url)
      .filter(Boolean) as string[];
    
    setValue('image_url', galleryUrls);
    updateFormData({ image_url: galleryUrls });
  }, [setValue, updateFormData]);

  const handleVideoFilesChange = useCallback((files: MediaFile[]) => {
    setVideoFiles(files);
    const videoUrls = files
      .filter(f => f.uploadStatus === 'complete')
      .map(f => f.url)
      .filter(Boolean) as string[];
    
    setValue('video_url', videoUrls);
    updateFormData({ video_url: videoUrls });
  }, [setValue, updateFormData]);

  // Cargar archivos existentes solo una vez al montar el componente
  useEffect(() => {
    let mounted = true;

    // Cargar imagen de portada existente
    if (formData.cover_image_url && coverFiles.length === 0) {
      const mockFile = new File([''], 'cover-image.jpg', { type: 'image/jpeg' });
      const coverFile: MediaFile = {
        file: mockFile,
        uploadStatus: 'complete',
        url: formData.cover_image_url,
        uploadProgress: 100
      };
      if (mounted) setCoverFiles([coverFile]);
    }
    
    // Cargar galería existente
    if (formData.image_url?.length && galleryFiles.length === 0) {
      const mockFiles: MediaFile[] = formData.image_url.map((url, index) => {
        const mockFile = new File([''], `gallery-${index}.jpg`, { type: 'image/jpeg' });
        return {
          file: mockFile,
          uploadStatus: 'complete' as const,
          url,
          uploadProgress: 100
        };
      });
      if (mounted) setGalleryFiles(mockFiles);
    }
    
    // Cargar videos existentes
    if (formData.video_url?.length && videoFiles.length === 0) {
      const mockFiles: MediaFile[] = formData.video_url.map((url, index) => {
        const mockFile = new File([''], `video-${index}.mp4`, { type: 'video/mp4' });
        return {
          file: mockFile,
          uploadStatus: 'complete' as const,
          url,
          uploadProgress: 100
        };
      });
      if (mounted) setVideoFiles(mockFiles);
    }

    return () => { mounted = false; };
  }, []); // Solo ejecutar una vez al montar

  // Estado de carga para evitar envío mientras se suben archivos
  const isUploading = useMemo(() => 
    coverFiles.some(f => f.uploadStatus === 'uploading') ||
    galleryFiles.some(f => f.uploadStatus === 'uploading') ||
    videoFiles.some(f => f.uploadStatus === 'uploading'),
    [coverFiles, galleryFiles, videoFiles]
  );

  return (
    <div className="space-y-8">
      {/* Header con gradiente YAAN */}
      <div className="bg-gradient-to-r from-pink-500 to-violet-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {formData.productType === 'circuit' ? 'Crea tu Circuito' : 'Crea tu Paquete'}
        </h2>
        <p className="opacity-90">
          Comparte tu experiencia turística única con viajeros de todo el mundo
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nombre del Producto */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800">
            {formData.productType === 'circuit' 
              ? 'Nombra tu circuito *' 
              : 'Nombra tu paquete *'
            }
          </label>
          <input
            type="text"
            {...register('name')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder={formData.productType === 'circuit' 
              ? 'Ej. Gran Tour por los Cenotes de Yucatán'
              : 'Ej. Escapada Romántica a Tulum'
            }
          />
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800">
            {formData.productType === 'circuit'
              ? '¿Qué harán tus viajeros en esta experiencia? *'
              : 'Descripción de la experiencia *'
            }
          </label>
          <textarea
            {...register('description')}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            placeholder="Describe la experiencia única que ofrecerás a tus viajeros..."
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Tipo de Interés */}
        <PreferencesSelector 
          selectedPreferences={watch('preferences') || []}
          onChange={(preferences) => {
            setValue('preferences', preferences);
          }}
          error={errors.preferences?.message}
        />

        {/* Idiomas */}
        <LanguageSelector
          selectedLanguages={watch('languages') || []}
          onChange={(languages) => {
            setValue('languages', languages);
          }}
          error={errors.languages?.message}
        />

        {/* Sistema Multimedia V2 - Optimizado */}
        <div className="space-y-6">
          <label className="block text-sm font-medium text-gray-800">
            Galería de medios
          </label>
          
          {/* Imagen de portada */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Imagen de portada *</h4>
            
            <MediaPreview 
              files={coverFiles}
              onRemove={() => handleCoverFilesChange([])}
              maxDisplaySize="lg"
              className="mb-4"
            />
            
            <MediaUploadZone
              files={coverFiles}
              onFilesChange={handleCoverFilesChange}
              productId={formData.productId || 'temp'}
              type="cover"
              accept="image"
              maxFiles={1}
              disabled={coverFiles.length >= 1}
            />
            
            {errors.cover_image_url && (
              <p className="text-sm text-red-600">{errors.cover_image_url.message}</p>
            )}
          </div>

          {/* Galería de imágenes */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">Galería de imágenes</h4>
              <span className="text-xs text-gray-500">
                {galleryFiles.filter(f => f.uploadStatus === 'complete').length} imagen{galleryFiles.filter(f => f.uploadStatus === 'complete').length === 1 ? '' : 'es'} subida{galleryFiles.filter(f => f.uploadStatus === 'complete').length === 1 ? '' : 's'}
              </span>
            </div>
            
            <MediaPreview 
              files={galleryFiles}
              onRemove={(index) => {
                const updatedFiles = galleryFiles.filter((_, i) => i !== index);
                handleGalleryFilesChange(updatedFiles);
              }}
              layout="grid"
              className="mb-4"
            />
            
            <MediaUploadZone
              files={galleryFiles}
              onFilesChange={handleGalleryFilesChange}
              productId={formData.productId || 'temp'}
              type="gallery"
              accept="image"
              maxFiles={10}
            />
            
            {errors.image_url && (
              <p className="text-sm text-red-600">{errors.image_url.message}</p>
            )}
          </div>

          {/* Videos */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">Videos (Opcional)</h4>
              <span className="text-xs text-gray-500">
                {videoFiles.filter(f => f.uploadStatus === 'complete').length} video{videoFiles.filter(f => f.uploadStatus === 'complete').length === 1 ? '' : 's'} subido{videoFiles.filter(f => f.uploadStatus === 'complete').length === 1 ? '' : 's'}
              </span>
            </div>
            
            <MediaPreview 
              files={videoFiles}
              onRemove={(index) => {
                const updatedFiles = videoFiles.filter((_, i) => i !== index);
                handleVideoFilesChange(updatedFiles);
              }}
              className="mb-4"
            />
            
            <MediaUploadZone
              files={videoFiles}
              onFilesChange={handleVideoFilesChange}
              productId={formData.productId || 'temp'}
              type="gallery"
              accept="video"
              maxFiles={5}
            />
            
            {errors.video_url && (
              <p className="text-sm text-red-600">{errors.video_url.message}</p>
            )}
          </div>
        </div>

        {/* Navegación */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isUploading}
            className="bg-gradient-to-r from-pink-500 to-violet-600 text-white px-8 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isUploading ? 'Subiendo archivos...' : 'Continuar'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Componente para selección de preferencias - memoizado
const PreferencesSelector = ({ 
  selectedPreferences, 
  onChange, 
  error 
}: {
  selectedPreferences: string[];
  onChange: (preferences: string[]) => void;
  error?: string;
}) => {
  const togglePreference = useCallback((prefId: string) => {
    const newPreferences = selectedPreferences.includes(prefId)
      ? selectedPreferences.filter(id => id !== prefId)
      : [...selectedPreferences, prefId];
    onChange(newPreferences);
  }, [selectedPreferences, onChange]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-800">
        Tipo de interés turístico *
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Preferences.map((preference) => (
          <button
            key={preference.id}
            type="button"
            onClick={() => togglePreference(preference.id)}
            className={`p-3 border rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedPreferences.includes(preference.id)
                ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white border-pink-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300 hover:bg-pink-50'
            }`}
          >
            {preference.name}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Componente para selección de idiomas - memoizado
const LanguageSelector = ({ 
  selectedLanguages, 
  onChange, 
  error 
}: {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
  error?: string;
}) => {
  const toggleLanguage = useCallback((langId: string) => {
    const newLanguages = selectedLanguages.includes(langId)
      ? selectedLanguages.filter(id => id !== langId)
      : [...selectedLanguages, langId];
    onChange(newLanguages);
  }, [selectedLanguages, onChange]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-800">
        Idiomas de la experiencia *
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {LANGUAGES.map((language) => (
          <button
            key={language.id}
            type="button"
            onClick={() => toggleLanguage(language.id)}
            className={`p-3 border rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedLanguages.includes(language.id)
                ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white border-pink-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300 hover:bg-pink-50'
            }`}
          >
            {language.name}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};