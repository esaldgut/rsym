'use client';

import { useState, useCallback, useOptimistic } from 'react';
import { toggleLikeAction } from '@/lib/server/moments-actions';
import { toastManager } from '@/components/ui/ToastWithPinpoint';

interface SocialInteractionsProps {
  itemId: string;
  itemType: 'Moment' | 'MarketplaceFeed';
  likeCount: number;
  viewerHasLiked: boolean;
  commentCount?: number;
  shareCount?: number;
  onLikeUpdated?: (liked: boolean, count: number) => void;
}

export function SocialInteractions({
  itemId,
  itemType,
  likeCount: initialLikeCount,
  viewerHasLiked: initialViewerHasLiked,
  commentCount = 0,
  shareCount = 0,
  onLikeUpdated
}: SocialInteractionsProps) {
  const [isLiking, setIsLiking] = useState(false);
  
  // Optimistic UI para likes
  const [optimisticLikeState, updateOptimisticLike] = useOptimistic(
    { liked: initialViewerHasLiked, count: initialLikeCount },
    (state, liked: boolean) => ({
      liked,
      count: liked ? state.count + 1 : Math.max(0, state.count - 1)
    })
  );

  // Toggle like con optimistic update
  const handleLike = useCallback(async () => {
    if (isLiking) return;

    // Update optimista inmediato
    const newLikedState = !optimisticLikeState.liked;
    updateOptimisticLike(newLikedState);

    setIsLiking(true);
    try {
      const result = await toggleLikeAction(itemId, itemType);
      
      if (result.success) {
        // Actualizar con valores reales del servidor
        onLikeUpdated?.(result.liked!, result.likeCount!);
      } else {
        // Revertir en caso de error
        updateOptimisticLike(!newLikedState);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revertir en caso de error
      updateOptimisticLike(!newLikedState);
    } finally {
      setIsLiking(false);
    }
  }, [itemId, itemType, optimisticLikeState.liked, onLikeUpdated, updateOptimisticLike, isLiking]);

  // Manejar comentario (placeholder)
  const handleComment = useCallback(() => {
    console.log('Abrir comentarios para:', itemId);
    // TODO: Implementar modal de comentarios
  }, [itemId]);

  // Manejar compartir
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mira este momento en YAAN',
          text: 'Te comparto este increíble momento',
          url: `${window.location.origin}/moments/${itemId}`
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error compartiendo:', error);
        }
      }
    } else {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/moments/${itemId}`);
        toastManager.success('🔗 Enlace copiado al portapapeles', {
          trackingContext: {
            feature: 'share_content',
            shareMethod: 'clipboard',
            itemId,
            itemType: itemType.toLowerCase(),
            category: 'social_interaction'
          }
        });
      } catch (error) {
        toastManager.error('❌ No se pudo copiar el enlace', {
          trackingContext: {
            feature: 'share_content',
            error: error instanceof Error ? error.message : 'Unknown error',
            itemId,
            itemType: itemType.toLowerCase(),
            category: 'error_handling'
          }
        });
      }
    }
  }, [itemId]);

  // Manejar guardar (placeholder)
  const handleSave = useCallback(() => {
    console.log('Guardar momento:', itemId);
    // TODO: Implementar guardar en colección
  }, [itemId]);

  return (
    <div className="p-4 border-t border-gray-100">
      {/* Botones de interacción */}
      <div className="flex justify-between mb-3">
        <div className="flex space-x-4">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-1 transition-all duration-200 ${
              optimisticLikeState.liked 
                ? 'text-red-500 scale-110' 
                : 'text-gray-700 hover:text-red-500 hover:scale-110'
            }`}
          >
            <svg 
              className={`w-6 h-6 ${optimisticLikeState.liked ? 'fill-current' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          </button>

          {/* Comentar */}
          <button
            onClick={handleComment}
            className="text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </button>

          {/* Compartir */}
          <button
            onClick={handleShare}
            className="text-gray-700 hover:text-green-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.464 0m5.464 0a3 3 0 00-5.464 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </button>
        </div>

        {/* Guardar */}
        <button
          onClick={handleSave}
          className="text-gray-700 hover:text-purple-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
            />
          </svg>
        </button>
      </div>

      {/* Contadores */}
      <div className="flex items-center space-x-4 text-sm">
        <button className="font-semibold text-gray-900 hover:underline">
          {optimisticLikeState.count} {optimisticLikeState.count === 1 ? 'Me gusta' : 'Me gusta'}
        </button>
        
        {commentCount > 0 && (
          <button 
            onClick={handleComment}
            className="text-gray-600 hover:underline"
          >
            {commentCount} {commentCount === 1 ? 'comentario' : 'comentarios'}
          </button>
        )}
        
        {shareCount > 0 && (
          <span className="text-gray-600">
            {shareCount} veces compartido
          </span>
        )}
      </div>
    </div>
  );
}