'use client';

import { useState, useRef, useCallback } from 'react';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { MediaPlayer } from '@/components/media/MediaPlayer';
import { SocialInteractions } from '@/components/social/SocialInteractions';
import { formatDistanceToNow } from '@/utils/date-helpers';
import { deleteMomentAction } from '@/lib/server/moments-actions';
import { toastManager } from '@/components/ui/Toast';
import type { Moment } from '@/lib/graphql/types';

interface FeedPostProps {
  post: Moment;
  onDeleted?: (postId: string) => void;
  onLikeUpdated?: (postId: string, liked: boolean, likeCount: number) => void;
}

export function FeedPost({ post, onDeleted, onLikeUpdated }: FeedPostProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Manejar eliminación - paso 1: mostrar confirmación
  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
    setShowMenu(false);
  }, []);

  // Manejar eliminación - paso 2: ejecutar eliminación
  const handleConfirmDelete = useCallback(async () => {
    if (!post.id) return;
    
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    
    try {
      const result = await deleteMomentAction(post.id);
      if (result.success) {
        onDeleted?.(post.id);
        toastManager.success('✅ Momento eliminado exitosamente', {
          trackingContext: {
            feature: 'moment_deletion',
            momentId: post.id,
            category: 'content_management'
          }
        });
      } else {
        toastManager.error(`❌ ${result.error || 'Error al eliminar el momento'}`, {
          trackingContext: {
            feature: 'moment_deletion',
            error: result.error,
            momentId: post.id,
            category: 'error_handling'
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toastManager.error('❌ Error al eliminar el momento', {
        trackingContext: {
          feature: 'moment_deletion',
          error: error instanceof Error ? error.message : 'Unknown error',
          momentId: post.id,
          category: 'error_handling'
        }
      });
    } finally {
      setIsDeleting(false);
    }
  }, [post.id, onDeleted]);

  // Determinar tipo de media
  const mediaType = post.resourceType === 'video' ? 'video' : 
                    post.resourceType === 'image' ? 'image' : null;

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header del post */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <ProfileImage
            path={post.user_data?.avatar_url}
            alt={post.user_data?.name || 'Usuario'}
            fallbackText={post.user_data?.username?.substring(0, 2).toUpperCase() || 'U'}
            size="md"
          />
          <div>
            <h3 className="font-semibold text-gray-900">
              {post.user_data?.name || post.user_data?.username}
            </h3>
            <p className="text-sm text-gray-500">
              {post.created_at ? formatDistanceToNow(post.created_at) : 'Hace un momento'}
            </p>
          </div>
        </div>

        {/* Menu de opciones */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isDeleting}
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={handleDeleteClick}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  // TODO: Implementar reportar
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
              >
                Reportar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido multimedia */}
      {mediaType && post.resourceUrl?.[0] && (
        <div className="relative bg-black">
          <MediaPlayer
            src={post.resourceUrl[0]}
            type={mediaType}
            alt={post.description || 'Contenido del momento'}
            className="w-full max-h-[600px] object-contain"
          />
        </div>
      )}

      {/* Interacciones sociales */}
      <SocialInteractions
        itemId={post.id!}
        itemType="Moment"
        likeCount={post.likeCount || 0}
        viewerHasLiked={post.viewerHasLiked || false}
        onLikeUpdated={(liked, count) => onLikeUpdated?.(post.id!, liked, count)}
      />

      {/* Descripción */}
      {post.description && (
        <div className="px-4 pb-4">
          <p className="text-gray-800 whitespace-pre-wrap">
            <span className="font-semibold mr-2">
              {post.user_data?.username || 'usuario'}
            </span>
            {post.description}
          </p>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ¿Eliminar momento?
            </h3>
            <p className="text-gray-600 mb-6">
              Esta acción no se puede deshacer. El momento se eliminará permanentemente.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}