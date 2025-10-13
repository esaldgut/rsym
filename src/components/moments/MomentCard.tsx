/**
 * MomentCard - Componente principal para mostrar un momento en el feed
 *
 * Características:
 * - Video autoplay con Intersection Observer
 * - useOptimistic para likes/saves (feedback inmediato)
 * - Server Actions para mutaciones
 * - Responsive design mobile-first
 * - Accesibilidad completa
 *
 * Patrones: Next.js 15 + React 19 + AWS Amplify Gen 2 v6
 */

'use client';

import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { toggleLikeAction, toggleSaveAction } from '@/lib/server/moments-actions';
import { useOptimistic, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useStorageUrl } from '@/hooks/useStorageUrls';

export interface MomentData {
  id: string;
  description?: string | null;
  resourceUrl?: string[] | null;
  audioUrl?: string | null;
  tags?: string[] | null;
  preferences?: string[] | null;
  created_at?: string | null;
  likeCount?: number | null;
  saveCount?: number | null;
  viewerHasLiked?: boolean | null;
  viewerHasSaved?: boolean | null;
  user_data?: {
    sub?: string;
    username?: string;
    name?: string;
    avatar_url?: string;
  } | null;
  destination?: Array<{
    place?: string;
    placeSub?: string;
  }> | null;
}

export interface MomentCardProps {
  moment: MomentData;
  currentUserId: string;
  className?: string;
  onCommentClick?: (momentId: string) => void;
}

/**
 * Componente MomentCard
 *
 * @example
 * ```tsx
 * <MomentCard
 *   moment={momentData}
 *   currentUserId={user.userId}
 *   onCommentClick={(id) => router.push(`/moments/${id}`)}
 * />
 * ```
 */
export function MomentCard({
  moment,
  currentUserId, // eslint-disable-line @typescript-eslint/no-unused-vars
  className,
  onCommentClick
}: MomentCardProps) {
  console.log('[MomentCard] 🎴 Renderizando momento:', {
    id: moment.id,
    hasResourceUrl: !!moment.resourceUrl,
    resourceUrlLength: moment.resourceUrl?.length,
    resourceUrlFirst: moment.resourceUrl?.[0]?.substring(0, 100)
  });

  // ✅ Estados locales
  const [liked, setLiked] = useState(moment.viewerHasLiked || false);
  const [saved, setSaved] = useState(moment.viewerHasSaved || false);
  const [likeCount, setLikeCount] = useState(moment.likeCount || 0);

  const [isPending, startTransition] = useTransition();

  // ✅ useOptimistic para likes (feedback inmediato)
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(
    liked,
    (_state, newLiked: boolean) => newLiked
  );

  const [optimisticLikeCount, setOptimisticLikeCount] = useOptimistic(
    likeCount,
    (state, delta: number) => Math.max(0, state + delta) // No permitir negativos
  );

  // ✅ useOptimistic para saves
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(
    saved,
    (_state, newSaved: boolean) => newSaved
  );

  // Nota: optimisticSaveCount no se usa en la UI actual, pero podría usarse en el futuro
  // para mostrar el contador de guardados

  // ✅ Detectar si el momento tiene video
  const hasVideo = moment.resourceUrl?.some(url =>
    url.toLowerCase().match(/\.(mp4|webm|mov|ogg)$/i)
  );

  const { videoRef, isPlaying, toggle, isMuted, unmute } = useVideoAutoplay({
    threshold: 0.7,
    enabled: hasVideo,
    onPlay: () => console.log('[MomentCard] Video playing:', moment.id),
    onPause: () => console.log('[MomentCard] Video paused:', moment.id),
    onError: (error) => console.error('[MomentCard] Video error:', error)
  });

  // ✅ Handle Like con useOptimistic
  const handleLike = async () => {
    if (!moment.id) return;

    const newLiked = !liked;
    const delta = newLiked ? 1 : -1;

    // Actualización optimista inmediata
    startTransition(() => {
      setOptimisticLiked(newLiked);
      setOptimisticLikeCount(delta);
    });

    // Server Action - itemType con mayúscula según backend Go
    const result = await toggleLikeAction(moment.id, 'Moment');

    if (result.success && result.data) {
      // Actualizar estado real con respuesta del servidor
      setLiked(result.data.viewerHasLiked);
      setLikeCount(result.data.newLikeCount);
    } else {
      // Revertir si falló
      console.error('Failed to toggle like:', result.error);
      startTransition(() => {
        setOptimisticLiked(liked);
        setOptimisticLikeCount(-delta);
      });
    }
  };

  // ✅ Handle Save con useOptimistic
  const handleSave = async () => {
    if (!moment.id) return;

    const newSaved = !saved;

    // Actualización optimista inmediata
    startTransition(() => {
      setOptimisticSaved(newSaved);
    });

    // Server Action - itemType con mayúscula según backend Go
    const result = await toggleSaveAction(moment.id, 'Moment');

    if (result.success && result.data) {
      // Actualizar estado real
      setSaved(result.data.viewerHasSaved);
      // Nota: saveCount podría mostrarse en futuras versiones
      // setSaveCount(result.data.newSaveCount);
    } else {
      // Revertir si falló
      console.error('Failed to toggle save:', result.error);
      startTransition(() => {
        setOptimisticSaved(saved);
      });
    }
  };

  // ✅ Handle Comment
  const handleComment = () => {
    if (moment.id) {
      onCommentClick?.(moment.id);
    }
  };

  // ✅ Normalizar URL de avatar
  const getAvatarUrl = (avatarUrl: string | undefined): string | null => {
    if (!avatarUrl) return null;

    // Si es una URL completa válida, retornarla
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl;
    }

    // Si empieza con 'public/', convertir a ruta absoluta
    if (avatarUrl.startsWith('public/')) {
      return '/' + avatarUrl.substring(7); // Remover 'public/'
    }

    // Si empieza con '/', ya es válida
    if (avatarUrl.startsWith('/')) {
      return avatarUrl;
    }

    // Si no tiene prefijo, asumir que es path de S3 (se manejará después con signed URL)
    // Por ahora retornar null para usar fallback
    return null;
  };

  // ✅ Formatear fecha relativa
  const getRelativeTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';

    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;

    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  return (
    <article
      className={cn(
        'bg-white rounded-xl shadow-lg overflow-hidden',
        'transition-all duration-300',
        className
      )}
      aria-label={`Momento de ${moment.user_data?.name || 'Usuario'}`}
    >
      {/* Header con info del usuario */}
      <header className="flex items-center justify-between p-4">
        <Link
          href={`/profile/${moment.user_data?.username || moment.user_data?.sub}`}
          className="flex items-center space-x-3 hover:opacity-75 transition-opacity"
        >
          {(() => {
            const avatarUrl = getAvatarUrl(moment.user_data?.avatar_url);
            return avatarUrl ? (
              <img
                src={avatarUrl}
                alt={moment.user_data?.name || 'Avatar'}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  // Si falla la carga, mostrar fallback
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold';
                  fallback.textContent = moment.user_data?.name?.[0]?.toUpperCase() || 'U';
                  target.parentNode?.replaceChild(fallback, target);
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {moment.user_data?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            );
          })()}

          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {moment.user_data?.name || 'Usuario'}
            </span>
            {moment.destination?.[0]?.place && (
              <span className="text-xs text-gray-500 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                {moment.destination[0].place}
              </span>
            )}
          </div>
        </Link>

        <time className="text-xs text-gray-500" dateTime={moment.created_at || undefined}>
          {getRelativeTime(moment.created_at)}
        </time>
      </header>

      {/* Media (imagen o video) */}
      {moment.resourceUrl && moment.resourceUrl.length > 0 && (
        <div className="relative aspect-square bg-black">
          <MomentMedia
            resourceUrl={moment.resourceUrl[0]}
            description={moment.description || ''}
            hasVideo={hasVideo || false}
            videoRef={videoRef}
            isPlaying={isPlaying}
            isMuted={isMuted}
            toggle={toggle}
            unmute={unmute}
          />
        </div>
      )}

      {/* Actions (Like, Comment, Save) */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={isPending}
              className={cn(
                'flex items-center space-x-1 transition-all duration-200',
                'hover:scale-110 active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label={optimisticLiked ? 'Quitar me gusta' : 'Dar me gusta'}
            >
              <svg
                className={cn(
                  'w-6 h-6 transition-colors duration-200',
                  optimisticLiked
                    ? 'text-red-500 fill-current'
                    : 'text-gray-700 hover:text-red-500'
                )}
                fill={optimisticLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={optimisticLiked ? 0 : 2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm font-semibold text-gray-900">
                {optimisticLikeCount}
              </span>
            </button>

            {/* Comment button */}
            <button
              onClick={handleComment}
              className="flex items-center space-x-1 hover:scale-110 active:scale-95 transition-transform"
              aria-label="Comentar"
            >
              <svg className="w-6 h-6 text-gray-700 hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm text-gray-600">
                {/* TODO: Mostrar count de comentarios */}
                0
              </span>
            </button>

            {/* Share button */}
            <button
              className="hover:scale-110 active:scale-95 transition-transform"
              aria-label="Compartir"
            >
              <svg className="w-6 h-6 text-gray-700 hover:text-green-500 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isPending}
            className={cn(
              'transition-all duration-200',
              'hover:scale-110 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label={optimisticSaved ? 'Quitar de guardados' : 'Guardar'}
          >
            <svg
              className={cn(
                'w-6 h-6 transition-colors duration-200',
                optimisticSaved
                  ? 'text-yellow-500 fill-current'
                  : 'text-gray-700 hover:text-yellow-500'
              )}
              fill={optimisticSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={optimisticSaved ? 0 : 2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Description */}
        {moment.description && (
          <div className="text-sm">
            <span className="font-semibold text-gray-900">
              {moment.user_data?.username || 'usuario'}
            </span>{' '}
            <span className="text-gray-700">{moment.description}</span>
          </div>
        )}

        {/* Tags */}
        {moment.tags && moment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {moment.tags.map((tag, index) => (
              <Link
                key={`${tag}-${index}`}
                href={`/explore?tag=${encodeURIComponent(tag)}`}
                className="text-xs text-pink-600 hover:text-pink-700 hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

// ✅ Componente para manejar media de S3 con URLs firmadas
interface MomentMediaProps {
  resourceUrl: string;
  description: string;
  hasVideo: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
  isPlaying?: boolean;
  isMuted?: boolean;
  toggle?: () => void;
  unmute?: () => void;
}

function MomentMedia({
  resourceUrl,
  description,
  hasVideo,
  videoRef,
  isPlaying,
  isMuted,
  toggle,
  unmute
}: MomentMediaProps) {
  console.log('[MomentMedia] 📦 Props recibidas:', {
    resourceUrl,
    hasVideo,
    description: description?.substring(0, 50)
  });

  // Usar hook para obtener URL firmada de S3
  const { url, isLoading, error } = useStorageUrl(resourceUrl);

  console.log('[MomentMedia] 🔗 Estado de useStorageUrl:', {
    url: url?.substring(0, 100),
    isLoading,
    error: error?.message
  });

  // Si está cargando, mostrar skeleton
  if (isLoading) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
        <div className="text-gray-500">
          <svg className="w-12 h-12 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  // Si hay error o no hay URL, mostrar placeholder
  if (error || !url) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center p-4">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500">Error al cargar media</p>
        </div>
      </div>
    );
  }

  // Renderizar video o imagen según el tipo
  if (hasVideo && videoRef) {
    return (
      <>
        <video
          ref={videoRef}
          src={url!} // Non-null assertion porque ya verificamos arriba
          className="w-full h-full object-contain"
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          aria-label="Video del momento"
          onLoadStart={() => console.log('[MomentMedia] 🎬 Video loadstart:', url)}
          onLoadedMetadata={() => console.log('[MomentMedia] ✅ Video metadata loaded')}
          onLoadedData={() => console.log('[MomentMedia] ✅ Video data loaded')}
          onCanPlay={() => console.log('[MomentMedia] ✅ Video can play')}
          onError={(e) => {
            console.error('[MomentMedia] ❌ Video error:', {
              error: e.currentTarget.error,
              code: e.currentTarget.error?.code,
              message: e.currentTarget.error?.message,
              src: url,
              networkState: e.currentTarget.networkState,
              readyState: e.currentTarget.readyState
            });
          }}
          onAbort={() => console.warn('[MomentMedia] ⚠️ Video abort:', url)}
          onStalled={() => console.warn('[MomentMedia] ⚠️ Video stalled:', url)}
        >
          Tu navegador no soporta video HTML5
        </video>

        {/* Play/Pause overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          {!isPlaying && (
            <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          )}
        </div>

        {/* Video controls */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          {toggle && (
            <button
              onClick={toggle}
              className="w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-75 transition-all"
              aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}

          {isMuted && unmute && (
            <button
              onClick={unmute}
              className="w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-75 transition-all"
              aria-label="Activar sonido"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </>
    );
  }

  // Renderizar imagen - usar img nativo para URLs firmadas de S3
  // Next.js Image no funciona bien con URLs firmadas que tienen query parameters
  return (
    <img
      src={url!}
      alt={description || 'Imagen del momento'}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );
}

export default MomentCard;
