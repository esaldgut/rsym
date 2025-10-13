'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import MomentMediaUpload, { useMomentMedia } from '@/components/moments/MomentMediaUpload';
import { toastManager } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

// Schema de validación para Moments
const createMomentSchema = z.object({
  caption: z.string()
    .min(1, 'Escribe algo sobre tu momento')
    .max(500, 'El texto no puede exceder 500 caracteres'),
  hashtags: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const tags = val.split('#').filter(tag => tag.trim());
      return tags.length <= 10;
    }, 'Máximo 10 hashtags permitidos'),
  visibility: z.enum(['public', 'friends', 'private']).default('public'),
  contentType: z.enum(['moment', 'story', 'post']).default('moment'),
  location: z.string().optional()
});

type CreateMomentFormData = z.infer<typeof createMomentSchema>;

interface CreateMomentFormProps {
  userId: string;
  username: string;
}

/**
 * Client Component para creación de Moments
 * Recibe el usuario autenticado desde el Server Component padre
 */
export function CreateMomentForm({ userId, username }: CreateMomentFormProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [momentId, setMomentId] = useState<string>('');

  // Generar momentId solo en el cliente para evitar hydration mismatch
  useEffect(() => {
    setMomentId(`moment_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  }, []);

  const {
    mediaFiles,
    setMediaFiles,
    stats,
    getCompletedFiles,
    clearAll
  } = useMomentMedia(momentId, userId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<CreateMomentFormData>({
    resolver: zodResolver(createMomentSchema),
    defaultValues: {
      caption: '',
      hashtags: '',
      visibility: 'public',
      contentType: 'moment',
      location: ''
    }
  });

  const caption = watch('caption');
  const hashtags = watch('hashtags');
  const visibility = watch('visibility');

  // Publicar momento
  const onSubmit = useCallback(async (data: CreateMomentFormData) => {
    const completedFiles = getCompletedFiles();

    if (completedFiles.length === 0) {
      toastManager.show('Agrega al menos una foto o video a tu momento', 'error', 3000);
      return;
    }

    setIsPublishing(true);

    try {
      // Preparar FormData para el Server Action
      const formData = new FormData();

      // Mapear caption → description
      formData.append('description', data.caption);

      // Agregar tags desde hashtags
      const tags = data.hashtags?.split('#').filter(tag => tag.trim()) || [];
      tags.forEach(tag => formData.append('tags', tag.trim()));

      // Agregar location como preferencia si existe
      if (data.location) {
        formData.append('preferences', data.location);
      }

      // ✅ Usar paths S3 ya subidos (evita doble upload)
      // Los archivos ya fueron subidos a S3 por MomentMediaUpload
      // Usamos s3Key (path relativo) NO url (URL completa)
      completedFiles.forEach(file => {
        if (file.s3Key) {
          // s3Key tiene la estructura: public/users/{username}/social-content/{moment_id}/video.mov
          formData.append('existingMediaUrls', file.s3Key);
        }
      });

      // Llamar al Server Action real
      console.log('[CreateMomentForm] Llamando createMomentAction con:', {
        description: formData.get('description'),
        tags: formData.getAll('tags'),
        existingMediaUrls: formData.getAll('existingMediaUrls'),
        preferences: formData.getAll('preferences')
      });

      const { createMomentAction } = await import('@/lib/server/moments-actions');
      const result = await createMomentAction(formData);

      console.log('[CreateMomentForm] Resultado de createMomentAction:', result);

      if (!result.success) {
        console.error('[CreateMomentForm] Error en createMomentAction:', result.error);
        throw new Error(result.error || 'Error al publicar momento');
      }

      toastManager.show(
        `✅ ¡Tu ${data.contentType} se ha publicado exitosamente!`,
        'success',
        4000
      );

      // Limpiar formulario
      reset();
      clearAll();

      // Redirigir al feed de moments
      router.push('/moments');

    } catch (error) {
      console.error('Error publishing moment:', error);
      toastManager.show(
        `❌ ${error instanceof Error ? error.message : 'Error al publicar tu momento'}`,
        'error',
        4000
      );
    } finally {
      setIsPublishing(false);
    }
  }, [momentId, userId, username, getCompletedFiles, reset, clearAll, router]);

  const canPublish = stats.completed > 0 && caption.trim().length > 0 && !isPublishing;

  // Mostrar loading hasta que se genere el momentId
  if (!momentId) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Header del formulario */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            ¿Qué quieres compartir?
          </h2>
          <div className="flex items-center space-x-2">
            <select
              {...register('contentType')}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="moment">Momento</option>
              <option value="story">Historia</option>
              <option value="post">Post</option>
            </select>
            <select
              {...register('visibility')}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="public">🌍 Público</option>
              <option value="friends">👥 Amigos</option>
              <option value="private">🔒 Privado</option>
            </select>
          </div>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Cuéntanos sobre tu experiencia *
          </label>
          <textarea
            {...register('caption')}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            placeholder="¿Dónde estás? ¿Qué estás haciendo? Comparte tu experiencia..."
          />
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{errors.caption?.message}</span>
            <span>{caption.length}/500</span>
          </div>
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Hashtags (opcional)
          </label>
          <input
            type="text"
            {...register('hashtags')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="#viaje #méxico #aventura #gastronomía"
          />
          {hashtags && (
            <div className="text-xs text-gray-500">
              {hashtags.split('#').filter(tag => tag.trim()).length} hashtags
            </div>
          )}
          {errors.hashtags && (
            <p className="text-xs text-red-600">{errors.hashtags.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Ubicación (opcional)
          </label>
          <input
            type="text"
            {...register('location')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="¿Dónde estás?"
          />
        </div>

        {/* Sistema Multimedia YAAN */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Fotos y videos *
          </label>
          <MomentMediaUpload
            momentId={momentId}
            userId={userId}
            onMediaChange={setMediaFiles}
            maxFiles={10}
            placeholder="Agrega fotos y videos para hacer tu momento más atractivo"
          />
        </div>

        {/* Preview del momento */}
        {stats.completed > 0 && caption.trim() && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
            <h3 className="text-sm font-medium text-gray-800 mb-2">
              📱 Preview de tu momento
            </h3>
            <div className="bg-white rounded-lg p-3 text-sm">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
                <span className="font-medium">{username}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500 text-xs">
                  {visibility === 'public' ? '🌍' : visibility === 'friends' ? '👥' : '🔒'}
                </span>
              </div>
              <p className="text-gray-800 mb-2">{caption}</p>
              <div className="text-xs text-blue-600">
                📷 {stats.completed} archivo{stats.completed !== 1 ? 's' : ''} multimedia
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {stats.completed > 0 ? (
              <span className="text-green-600">
                ✅ {stats.completed} archivo{stats.completed !== 1 ? 's' : ''} listo{stats.completed !== 1 ? 's' : ''}
              </span>
            ) : (
              <span>Agrega fotos o videos para publicar</span>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                reset();
                clearAll();
              }}
              disabled={isPublishing}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!canPublish}
              className="px-8 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isPublishing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Publicando...</span>
                </div>
              ) : (
                '📤 Publicar Momento'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
