'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FeedPost } from './FeedPost';
import { CreatePostCard } from './CreatePostCard';
import { getMomentsAction } from '@/lib/server/moments-actions';
// ✅ Migrado de @/lib/graphql/types a @/generated/graphql (GraphQL Code Generator)
import type { Moment } from '@/generated/graphql';

interface FeedGridProps {
  type: 'moments' | 'marketplace';
  initialPosts: Moment[];
  showCreatePost?: boolean;
}

export function FeedGrid({ 
  initialPosts, 
  showCreatePost = true 
}: FeedGridProps) {
  const [posts, setPosts] = useState<Moment[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Cargar más posts
  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await getMomentsAction(10, nextToken);
      
      if (result.success && result.moments.length > 0) {
        setPosts(prev => [...prev, ...result.moments]);
        setNextToken(result.nextToken);
        setHasMore(!!result.nextToken);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, nextToken]);

  // Configurar Intersection Observer para infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMorePosts, hasMore, isLoading]);

  // Callback para nuevo post creado
  const handlePostCreated = useCallback((newPost: Moment) => {
    setPosts(prev => [newPost, ...prev]);
  }, []);

  // Callback para post eliminado
  const handlePostDeleted = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  // Callback para like actualizado
  const handleLikeUpdated = useCallback((postId: string, liked: boolean, likeCount: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, viewerHasLiked: liked, likeCount }
        : post
    ));
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Crear nuevo post */}
      {showCreatePost && (
        <CreatePostCard onPostCreated={handlePostCreated} />
      )}

      {/* Grid de posts estilo Instagram */}
      <div className="space-y-8">
        {posts.map((post) => (
          <FeedPost
            key={post.id}
            post={post}
            onDeleted={handlePostDeleted}
            onLikeUpdated={handleLikeUpdated}
          />
        ))}
      </div>

      {/* Loading indicator para infinite scroll */}
      <div ref={loadMoreRef} className="py-8">
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
          </div>
        )}
        
        {!hasMore && posts.length > 0 && (
          <div className="text-center text-gray-500">
            <p className="text-sm">Has llegado al final</p>
          </div>
        )}
        
        {posts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay momentos aún</h3>
            <p className="text-gray-500">Sé el primero en compartir un momento increíble</p>
          </div>
        )}
      </div>
    </div>
  );
}