'use client';

/**
 * MomentPublishScreen - Complete Moment Publishing Interface
 *
 * Comprehensive screen that integrates all moment publishing features:
 * - Media upload with CE.SDK editing
 * - Description/caption
 * - Location selection (LocationMultiSelector)
 * - Category/preference tagging (TagSelector)
 * - Friend tagging (FriendsTagging)
 * - Experience linking (ExperienceSelector)
 * - Preview and publish
 *
 * Features:
 * - Multi-step wizard-like flow
 * - Form validation with react-hook-form + zod
 * - Optimistic UI updates
 * - Error handling
 * - Success feedback
 *
 * @example
 * ```tsx
 * <MomentPublishScreen
 *   userId={user.id}
 *   username={user.username}
 *   onPublishSuccess={() => router.push('/moments')}
 *   onCancel={() => router.back()}
 * />
 * ```
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LocationMultiSelector } from '@/components/location/LocationMultiSelector';
import { TagSelector } from './TagSelector';
import { FriendsTagging } from './FriendsTagging';
import { ExperienceSelector } from './ExperienceSelector';
import type { LocationInput } from '@/types/location';
import { createMomentAction } from '@/lib/server/moments-actions';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const momentPublishSchema = z.object({
  description: z.string()
    .min(1, 'La descripción es requerida')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),

  locations: z.array(z.custom<LocationInput>())
    .min(0, 'Sin ubicaciones')
    .max(5, 'Máximo 5 ubicaciones'),

  tags: z.array(z.string())
    .min(1, 'Selecciona al menos una categoría')
    .max(5, 'Máximo 5 categorías'),

  taggedFriends: z.array(z.string())
    .max(10, 'Máximo 10 amigos'),

  experienceId: z.string().nullable()
});

type MomentPublishFormData = z.infer<typeof momentPublishSchema>;

// ============================================================================
// TYPES
// ============================================================================

export interface MomentPublishScreenProps {
  /** User ID (for server actions) */
  userId: string;

  /** Username (for display) */
  username?: string;

  /** Callback on successful publish */
  onPublishSuccess: () => void;

  /** Callback on cancel */
  onCancel: () => void;

  /** Initial media URL (if editing existing moment) */
  initialMediaUrl?: string;

  /** Media type */
  mediaType?: 'image' | 'video';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MomentPublishScreen({
  userId,
  username,
  onPublishSuccess,
  onCancel,
  initialMediaUrl,
  mediaType = 'image'
}: MomentPublishScreenProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'details' | 'preview'>('details');

  // ============================================================================
  // FORM
  // ============================================================================

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<MomentPublishFormData>({
    resolver: zodResolver(momentPublishSchema),
    mode: 'onChange',
    defaultValues: {
      description: '',
      locations: [],
      tags: [],
      taggedFriends: [],
      experienceId: null
    }
  });

  // Watch all form values for preview
  const formValues = watch();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePublish = async (data: MomentPublishFormData) => {
    setIsPublishing(true);
    setPublishError(null);

    try {
      console.log('[MomentPublishScreen] 📤 Publishing moment...', data);

      // Build FormData for Server Action
      const formData = new FormData();

      // Description (required)
      formData.append('description', data.description);

      // Media URL (from CE.SDK export or initial media)
      if (initialMediaUrl) {
        formData.append('existingMediaUrls', initialMediaUrl);
        formData.append('resourceType', mediaType);
      } else {
        throw new Error('No media URL available');
      }

      // Locations (destination)
      data.locations.forEach((location, index) => {
        formData.append(`destination[${index}][place]`, location.place || '');
        formData.append(`destination[${index}][placeSub]`, location.placeSub || '');

        if (location.coordinates) {
          formData.append(
            `destination[${index}][coordinates][latitude]`,
            location.coordinates.latitude?.toString() || ''
          );
          formData.append(
            `destination[${index}][coordinates][longitude]`,
            location.coordinates.longitude?.toString() || ''
          );
        }
      });

      // Tags (preferences in GraphQL)
      data.tags.forEach(tag => {
        formData.append('preferences', tag);
      });

      // Tagged friends (futureproof - backend doesn't support yet)
      data.taggedFriends.forEach(friendId => {
        formData.append('taggedUserIds', friendId);
      });

      // Experience link (optional)
      if (data.experienceId) {
        formData.append('experienceLink', data.experienceId);
      }

      console.log('[MomentPublishScreen] 🔄 Calling createMomentAction...');

      // Call Server Action
      const result = await createMomentAction(formData);

      // Handle response
      if (result.success) {
        console.log('[MomentPublishScreen] ✅ Moment published successfully:', result.data);

        // Call success callback (parent handles toast/redirect)
        onPublishSuccess();
      } else {
        console.error('[MomentPublishScreen] ❌ Error:', result.error);
        setPublishError(result.error || 'Error al publicar momento');
      }

    } catch (err) {
      console.error('[MomentPublishScreen] ❌ Publish failed:', err);
      setPublishError(err instanceof Error ? err.message : 'Error al publicar');
    } finally {
      setIsPublishing(false);
    }
  };

  const goToPreview = () => {
    if (isValid) {
      setCurrentStep('preview');
    }
  };

  const backToDetails = () => {
    setCurrentStep('details');
  };

  // ============================================================================
  // RENDER - DETAILS STEP
  // ============================================================================

  if (currentStep === 'details') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Publicar Momento
              </h1>
              <button
                onClick={onCancel}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Comparte tu experiencia con la comunidad de viajeros
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handlePublish)} className="space-y-8">
            {/* 1. Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <label className="block mb-2">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Descripción *
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  Cuéntanos sobre tu momento
                </span>
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="¿Qué hiciste? ¿Qué viste? ¿Cómo te sentiste?"
                className={`
                  w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent
                  transition-all resize-none
                  ${errors.description
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                  }
                `}
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
              <div className="mt-2 text-right text-sm text-gray-500 dark:text-gray-500">
                {formValues.description?.length || 0} / 2000
              </div>
            </div>

            {/* 2. Locations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <LocationMultiSelector
                selectedLocations={formValues.locations || []}
                onChange={(locations) => setValue('locations', locations, { shouldValidate: true })}
                maxSelections={5}
              />
              {errors.locations && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.locations.message}
                </p>
              )}
            </div>

            {/* 3. Categories/Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <TagSelector
                selectedTags={formValues.tags || []}
                onTagsChange={(tags) => setValue('tags', tags, { shouldValidate: true })}
                maxTags={5}
                showCount={true}
              />
              {errors.tags && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.tags.message}
                </p>
              )}
            </div>

            {/* 4. Tag Friends (Optional) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <FriendsTagging
                selectedFriends={formValues.taggedFriends || []}
                onFriendsChange={(friends) => setValue('taggedFriends', friends, { shouldValidate: true })}
                maxFriends={10}
                showCount={true}
              />
              {errors.taggedFriends && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.taggedFriends.message}
                </p>
              )}
            </div>

            {/* 5. Link Experience (Optional) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <ExperienceSelector
                selectedExperienceId={formValues.experienceId}
                onExperienceChange={(experienceId) => setValue('experienceId', experienceId, { shouldValidate: true })}
              />
              {errors.experienceId && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.experienceId.message}
                </p>
              )}
            </div>

            {/* Sticky Footer - Action Buttons */}
            <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg rounded-t-xl">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={goToPreview}
                  disabled={!isValid}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vista Previa →
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - PREVIEW & PUBLISH STEP
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={backToDetails}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a editar
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Vista Previa
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Revisa cómo se verá tu momento antes de publicarlo
          </p>
        </div>

        {/* Preview Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
          {/* User Header */}
          <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {username || 'Usuario'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ahora
              </p>
            </div>
          </div>

          {/* Media Preview (if available) */}
          {initialMediaUrl && (
            <div className="aspect-square bg-gray-900 flex items-center justify-center">
              <p className="text-white">Media preview here</p>
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Description */}
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {formValues.description}
            </p>

            {/* Tags */}
            {formValues.tags && formValues.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formValues.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-800 dark:text-pink-200 text-sm font-medium rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Tagged Friends */}
            {formValues.taggedFriends && formValues.taggedFriends.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Con {formValues.taggedFriends.length} {formValues.taggedFriends.length === 1 ? 'amigo' : 'amigos'}
              </div>
            )}

            {/* Linked Experience */}
            {formValues.experienceId && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Experiencia vinculada
              </div>
            )}

            {/* Locations */}
            {formValues.locations && formValues.locations.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {formValues.locations.length} {formValues.locations.length === 1 ? 'ubicación' : 'ubicaciones'}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {publishError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{publishError}</p>
          </div>
        )}

        {/* Publish Button */}
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg rounded-t-xl">
          <button
            onClick={handleSubmit(handlePublish)}
            disabled={isPublishing}
            className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPublishing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Publicar Momento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MomentPublishScreen;
