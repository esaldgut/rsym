'use client';

/**
 * CreateMomentClient - 3-Phase Moment Creation Flow
 *
 * PHASE 1: UPLOAD
 * - User uploads original media (image/video) using MomentMediaUpload
 * - File uploaded to S3 with original quality
 * - Automatically advances to editing phase
 *
 * PHASE 2: EDIT
 * - IMG.LY CE.SDK editor loads original media
 * - User applies filters, stickers, text, YAAN branding
 * - Exports edited blob and uploads to S3
 * - Advances to publishing phase
 *
 * PHASE 3: PUBLISH
 * - MomentPublishScreen with edited media
 * - User adds description, locations, tags, friends, experience
 * - Creates GraphQL moment via createMomentAction
 * - Redirects to /moments on success
 *
 * Features:
 * - Zero code duplication (reuses MomentMediaUpload, CESDKEditorWrapper, MomentPublishScreen)
 * - Support for traveler, influencer, provider users
 * - Complete Epic 1 (CE.SDK) and Epic 2 (Publishing Flow)
 * - Loading states and error handling
 * - Cancel/back navigation between phases
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MomentMediaUpload } from '@/components/moments/MomentMediaUpload';
import { CESDKEditorWrapper, type ExportMetadata } from '@/components/cesdk/CESDKEditorWrapper';
import { MomentPublishScreen } from '@/components/moments/publish/MomentPublishScreen';
import type { MediaFile } from '@/components/media/MediaPreview';
import { toastManager } from '@/components/ui/Toast';

// ============================================================================
// TYPES
// ============================================================================

type Phase = 'upload' | 'edit' | 'publish';

interface CreateMomentClientProps {
  userId: string;
  username: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateMomentClient({ userId, username }: CreateMomentClientProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<Phase>('upload');
  const [momentId] = useState(`moment_${Date.now()}_${Math.random().toString(36).substring(7)}`);

  // Media URLs for each phase
  const [originalMediaUrl, setOriginalMediaUrl] = useState<string | null>(null);
  const [editedMediaUrl, setEditedMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  // Loading states
  const [isUploadingEdited, setIsUploadingEdited] = useState(false);

  // ============================================================================
  // PHASE 1: UPLOAD HANDLERS
  // ============================================================================

  const handleMediaChange = useCallback((mediaFiles: MediaFile[]) => {
    console.log('[CreateMomentClient] 📷 Media changed:', mediaFiles.length);

    // Get first completed file
    const completedFile = mediaFiles.find(file => file.uploadStatus === 'complete');

    if (completedFile && completedFile.url) {
      console.log('[CreateMomentClient] ✅ Original media uploaded:', completedFile.url);

      // Determine media type from file
      const isVideo = completedFile.file.type.startsWith('video/');
      setMediaType(isVideo ? 'video' : 'image');

      // Save original media URL
      setOriginalMediaUrl(completedFile.url);

      // Auto-advance to editing phase
      setCurrentPhase('edit');

      toastManager.show('📸 Media cargado. Ahora edita con CE.SDK', 'success', 3000);
    }
  }, []);

  // ============================================================================
  // PHASE 2: EDIT HANDLERS
  // ============================================================================

  const handleExport = useCallback(async (blob: Blob, metadata: ExportMetadata) => {
    console.log('[CreateMomentClient] 📤 Exporting edited media...', metadata);

    setIsUploadingEdited(true);

    try {
      // Upload edited blob to S3
      const formData = new FormData();
      formData.append('file', blob, metadata.filename);
      formData.append('contentType', 'moment');
      formData.append('momentId', momentId);
      formData.append('userId', userId);

      const response = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir archivo editado');
      }

      const result = await response.json();

      console.log('[CreateMomentClient] ✅ Edited media uploaded:', result.url);

      // Save edited media URL
      setEditedMediaUrl(result.url);

      // Advance to publishing phase
      setCurrentPhase('publish');

      toastManager.show('✨ Edición guardada. Completa tu momento', 'success', 3000);

    } catch (error) {
      console.error('[CreateMomentClient] ❌ Failed to upload edited media:', error);
      toastManager.show(
        error instanceof Error ? error.message : 'Error al guardar edición',
        'error',
        4000
      );
    } finally {
      setIsUploadingEdited(false);
    }
  }, [momentId, userId]);

  const handleCloseEditor = useCallback(() => {
    // User canceled editing - go back to upload phase
    setCurrentPhase('upload');
    setOriginalMediaUrl(null);
    toastManager.show('Edición cancelada', 'info', 2000);
  }, []);

  // ============================================================================
  // PHASE 3: PUBLISH HANDLERS
  // ============================================================================

  const handlePublishSuccess = useCallback(() => {
    console.log('[CreateMomentClient] ✅ Moment published successfully');

    toastManager.show('🎉 Momento publicado exitosamente', 'success', 3000);

    // Redirect to moments feed
    setTimeout(() => {
      router.push('/moments');
    }, 1500);
  }, [router]);

  const handlePublishCancel = useCallback(() => {
    // User canceled publishing - go back to editing phase
    setCurrentPhase('edit');
    toastManager.show('Publicación cancelada', 'info', 2000);
  }, []);

  // ============================================================================
  // PHASE NAVIGATION (BACK BUTTON)
  // ============================================================================

  const handleBack = useCallback(() => {
    if (currentPhase === 'edit') {
      setCurrentPhase('upload');
      setOriginalMediaUrl(null);
    } else if (currentPhase === 'publish') {
      setCurrentPhase('edit');
    }
  }, [currentPhase]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button (only show after upload phase) */}
            {currentPhase !== 'upload' && (
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
            )}

            {/* Phase Indicator */}
            <div className="flex items-center gap-4 flex-1 justify-center">
              {/* Phase 1: Upload */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentPhase === 'upload'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                <span className={`text-sm font-medium ${
                  currentPhase === 'upload' ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  Subir
                </span>
              </div>

              {/* Separator */}
              <div className="w-12 h-0.5 bg-gray-300" />

              {/* Phase 2: Edit */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentPhase === 'edit'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : originalMediaUrl ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {originalMediaUrl && currentPhase !== 'edit' ? '✓' : '2'}
                </div>
                <span className={`text-sm font-medium ${
                  currentPhase === 'edit' ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  Editar
                </span>
              </div>

              {/* Separator */}
              <div className="w-12 h-0.5 bg-gray-300" />

              {/* Phase 3: Publish */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentPhase === 'publish'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  3
                </div>
                <span className={`text-sm font-medium ${
                  currentPhase === 'publish' ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  Publicar
                </span>
              </div>
            </div>

            {/* Spacer for centering */}
            {currentPhase !== 'upload' && <div className="w-20" />}
          </div>
        </div>
      </div>

      {/* Phase Content */}
      {currentPhase === 'upload' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Crear Momento
            </h1>
            <p className="text-gray-600 mb-6">
              Comparte tus experiencias de viaje con fotos y videos profesionales
            </p>

            <MomentMediaUpload
              momentId={momentId}
              userId={userId}
              onMediaChange={handleMediaChange}
              maxFiles={1}
              placeholder="Sube una foto o video para comenzar..."
            />

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>📸 Soporta iPhone ProRAW, ProRes, HEIC y formatos profesionales</p>
              <p className="mt-1">📹 Videos hasta 1GB • Fotos hasta 100MB</p>
            </div>
          </div>
        </div>
      )}

      {currentPhase === 'edit' && originalMediaUrl && (
        <CESDKEditorWrapper
          userId={userId}
          initialMediaUrl={originalMediaUrl}
          mediaType={mediaType}
          onExport={handleExport}
          onClose={handleCloseEditor}
          loading={isUploadingEdited}
        />
      )}

      {currentPhase === 'publish' && editedMediaUrl && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MomentPublishScreen
            userId={userId}
            username={username}
            initialMediaUrl={editedMediaUrl}
            mediaType={mediaType}
            onPublishSuccess={handlePublishSuccess}
            onCancel={handlePublishCancel}
          />
        </div>
      )}
    </div>
  );
}
