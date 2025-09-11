'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileUpload } from '@/components/ui/FileUpload';
import { LocationSelector } from '@/components/location/LocationSelector';
import { useProductForm } from '@/context/ProductFormContext';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { Preferences } from '@/utils/preferences';
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
  const { uploadFile, isUploading } = useMediaUpload();
  
  const schema = formData.productType === 'circuit' 
    ? generalInfoCircuitSchema 
    : generalInfoPackageSchema;

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

  const onSubmit = (data: GeneralInfoFormData) => {
    updateFormData(data);
    onNext();
  };

  // Sincronizar cambios específicos del formulario con el contexto global
  const name = watch('name');
  const description = watch('description');
  const preferences = watch('preferences');
  const languages = watch('languages');

  useEffect(() => {
    if (name !== formData.name) {
      updateFormData({ name });
    }
  }, [name]);

  useEffect(() => {
    if (description !== formData.description) {
      updateFormData({ description });
    }
  }, [description]);

  useEffect(() => {
    if (JSON.stringify(preferences) !== JSON.stringify(formData.preferences)) {
      updateFormData({ preferences });
    }
  }, [preferences]);

  useEffect(() => {
    if (JSON.stringify(languages) !== JSON.stringify(formData.languages)) {
      updateFormData({ languages });
    }
  }, [languages]);

  const handleImageUpload = async (file: File, type: 'cover' | 'gallery' | 'video') => {
    try {
      const result = await uploadFile(file, `products/${formData.productId || 'temp'}`);
      
      if (result.success && result.url) {
        if (type === 'cover') {
          setValue('cover_image_url', result.url);
          updateFormData({ cover_image_url: result.url });
        } else if (type === 'gallery') {
          const currentImages = watch('image_url') || [];
          const newImages = [...currentImages, result.url];
          setValue('image_url', newImages);
          updateFormData({ image_url: newImages });
        } else if (type === 'video') {
          const currentVideos = watch('video_url') || [];
          const newVideos = [...currentVideos, result.url];
          setValue('video_url', newVideos);
          updateFormData({ video_url: newVideos });
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

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

        {/* Tipo de Interés */}
        <PreferencesSelector 
          selectedPreferences={watch('preferences') || []}
          onChange={(preferences) => {
            setValue('preferences', preferences);
            updateFormData({ preferences });
          }}
          error={errors.preferences?.message}
        />

        {/* Idiomas */}
        <LanguageSelector
          selectedLanguages={watch('languages') || []}
          onChange={(languages) => {
            setValue('languages', languages);
            updateFormData({ languages });
          }}
          error={errors.languages?.message}
        />

        {/* Solo para circuitos: Destinos */}
        {formData.productType === 'circuit' && (
          <MultiLocationSelector
            locations={watch('destination') || []}
            onChange={(destinations) => {
              setValue('destination', destinations);
              updateFormData({ destination: destinations });
            }}
            label="Destinos de la experiencia *"
            error={errors.destination?.message}
          />
        )}

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

        {/* Galería Multimedia */}
        <div className="space-y-6">
          <label className="block text-sm font-medium text-gray-800">
            Galería de medios
          </label>
          
          {/* Imagen de portada */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Imagen de portada</h4>
            
            {watch('cover_image_url') ? (
              <div className="relative border-2 border-green-200 rounded-lg overflow-hidden">
                <img 
                  src={watch('cover_image_url')} 
                  alt="Portada" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Subida
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('cover_image_url', '');
                      updateFormData({ cover_image_url: '' });
                    }}
                    className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-center">
                  <FileUpload
                    accept=".jpg,.jpeg,.png,.webp"
                    onUploadSuccess={(url, fileName) => {
                      setValue('cover_image_url', url);
                      updateFormData({ cover_image_url: url });
                    }}
                    onUploadError={(error) => console.error(error)}
                    buttonText="Subir Imagen de Portada"
                    buttonClassName="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600"
                    maxSizeMB={10}
                    disabled={isUploading}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    JPG, PNG o WebP. Máximo 10MB.
                  </p>
                </div>
              </div>
            )}
            {errors.cover_image_url && (
              <p className="text-sm text-red-600">{errors.cover_image_url.message}</p>
            )}
          </div>

          {/* Galería de imágenes */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">Galería de imágenes</h4>
              <span className="text-xs text-gray-500">
                {watch('image_url')?.length || 0} imagen{(watch('image_url')?.length || 0) === 1 ? '' : 'es'} subida{(watch('image_url')?.length || 0) === 1 ? '' : 's'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Imágenes existentes */}
              {(watch('image_url') || []).map((url, index) => (
                <div key={index} className="relative group border-2 border-green-200 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`Galería ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const currentImages = watch('image_url') || [];
                        const newImages = currentImages.filter((_, i) => i !== index);
                        setValue('image_url', newImages);
                        updateFormData({ image_url: newImages });
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200"
                    >
                      ×
                    </button>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-green-500 text-white px-1 py-0.5 rounded text-xs">
                    {index + 1}
                  </div>
                </div>
              ))}
              
              {/* Botón para agregar más imágenes */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center hover:border-pink-300 transition-colors">
                <FileUpload
                  accept=".jpg,.jpeg,.png,.webp"
                  onUploadSuccess={(url, fileName) => {
                    const currentImages = watch('image_url') || [];
                    const newImages = [...currentImages, url];
                    setValue('image_url', newImages);
                    updateFormData({ image_url: newImages });
                  }}
                  onUploadError={(error) => console.error(error)}
                  buttonText="+"
                  buttonClassName="text-gray-400 text-3xl hover:text-pink-500 transition-colors"
                  maxSizeMB={10}
                  disabled={isUploading}
                />
              </div>
            </div>
            {errors.image_url && (
              <p className="text-sm text-red-600">{errors.image_url.message}</p>
            )}
          </div>

          {/* Videos */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">Videos (Opcional)</h4>
              <span className="text-xs text-gray-500">
                {watch('video_url')?.length || 0} video{(watch('video_url')?.length || 0) === 1 ? '' : 's'} subido{(watch('video_url')?.length || 0) === 1 ? '' : 's'}
              </span>
            </div>
            
            <div className="space-y-3">
              {/* Videos existentes */}
              {(watch('video_url') || []).map((url, index) => (
                <div key={index} className="flex items-center justify-between p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 5v10l8-5-8-5z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Video {index + 1}</p>
                      <p className="text-xs text-gray-500">Subido correctamente</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentVideos = watch('video_url') || [];
                      const newVideos = currentVideos.filter((_, i) => i !== index);
                      setValue('video_url', newVideos);
                      updateFormData({ video_url: newVideos });
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {/* Botón para agregar videos */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-300 transition-colors">
                <FileUpload
                  accept=".mp4,.mov,.webm"
                  onUploadSuccess={(url, fileName) => {
                    const currentVideos = watch('video_url') || [];
                    const newVideos = [...currentVideos, url];
                    setValue('video_url', newVideos);
                    updateFormData({ video_url: newVideos });
                  }}
                  onUploadError={(error) => console.error(error)}
                  buttonText="Subir Video"
                  buttonClassName="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-pink-100 hover:text-pink-700 transition-all"
                  maxSizeMB={500}
                  disabled={isUploading}
                />
                <p className="text-sm text-gray-500 mt-2">
                  MP4, MOV o WebM. Máximo 500MB.
                </p>
              </div>
            </div>
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

// Componente para selección de preferencias
function PreferencesSelector({ 
  selectedPreferences, 
  onChange, 
  error 
}: {
  selectedPreferences: string[];
  onChange: (preferences: string[]) => void;
  error?: string;
}) {
  const togglePreference = (prefId: string) => {
    const newPreferences = selectedPreferences.includes(prefId)
      ? selectedPreferences.filter(id => id !== prefId)
      : [...selectedPreferences, prefId];
    onChange(newPreferences);
  };

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
}

// Componente para selección de idiomas
function LanguageSelector({ 
  selectedLanguages, 
  onChange, 
  error 
}: {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
  error?: string;
}) {
  const toggleLanguage = (langId: string) => {
    const newLanguages = selectedLanguages.includes(langId)
      ? selectedLanguages.filter(id => id !== langId)
      : [...selectedLanguages, langId];
    onChange(newLanguages);
  };

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
}

// Componente para múltiples ubicaciones (solo circuitos)
function MultiLocationSelector({
  locations,
  onChange,
  label,
  error
}: {
  locations: CircuitLocation[];
  onChange: (locations: CircuitLocation[]) => void;
  label: string;
  error?: string;
}) {
  const addLocation = (location: CircuitLocation) => {
    onChange([...locations, location]);
  };

  const removeLocation = (index: number) => {
    onChange(locations.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-800">
        {label}
      </label>
      
      {locations.map((location, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50">
            <span className="font-medium">{location.place}</span>
            {location.placeSub && (
              <span className="text-sm text-gray-500 ml-2">{location.placeSub}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeLocation(index)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}

      <LocationSelector
        onLocationSelect={addLocation}
        placeholder="Agregar nuevo destino..."
        className="mt-2"
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

