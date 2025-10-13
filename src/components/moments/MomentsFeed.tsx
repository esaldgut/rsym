/**
 * MomentsFeed - Componente principal del feed de momentos
 *
 * Características:
 * - Snap scrolling vertical estilo Instagram/TikTok
 * - Lazy loading de moments con Server Actions
 * - Infinite scroll con pagination
 * - Error handling y estados de loading
 * - Optimizado para mobile-first
 *
 * Patrones: Next.js 15 + React 19 + AWS Amplify Gen 2 v6
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getMomentsAction } from '@/lib/server/moments-actions';
import { MomentCard, type MomentData } from './MomentCard';
import { cn } from '@/lib/utils';

export interface MomentsFeedProps {
  /**
   * ID del usuario actual (para permisos y acciones)
   */
  userId: string;

  /**
   * Tipo de feed a mostrar
   * - 'all': Todos los moments activos
   * - 'following': Solo de usuarios que sigo
   * - 'preferences': Basado en mis preferencias
   * - 'user': Moments de un usuario específico
   */
  feedType?: 'all' | 'following' | 'preferences' | 'user';

  /**
   * Cantidad inicial de moments a cargar
   */
  initialLimit?: number;

  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Componente MomentsFeed
 *
 * @example
 * ```tsx
 * // En una página Server Component
 * <Suspense fallback={<LoadingFeed />}>
 *   <MomentsFeed userId={user.userId} feedType="all" />
 * </Suspense>
 * ```
 */
export function MomentsFeed({
  userId,
  feedType = 'all',
  initialLimit = 20,
  className
}: MomentsFeedProps) {
  const [moments, setMoments] = useState<MomentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextToken, setNextToken] = useState<string | undefined>();

  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastMomentRef = useRef<HTMLDivElement | null>(null);

  // ✅ Cargar moments iniciales
  const loadMoments = useCallback(async (isInitial = false) => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await getMomentsAction(feedType, initialLimit, nextToken);

      if (result.success && result.moments) {
        setMoments(prev => isInitial ? result.moments : [...prev, ...result.moments]);
        setNextToken(result.nextToken);
        setHasMore(!!result.nextToken);

        if (result.moments.length === 0 && isInitial) {
          setError('No hay momentos para mostrar');
        }
      } else {
        setError(result.error || 'Error al cargar momentos');
      }
    } catch (err) {
      console.error('Error loading moments:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [feedType, initialLimit, nextToken]);

  // ✅ Cargar inicial al montar
  useEffect(() => {
    loadMoments(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedType]); // Solo recargar si cambia el tipo de feed, loadMoments está memoizado con useCallback

  // ✅ Infinite scroll con Intersection Observer
  useEffect(() => {
    if (!hasMore || loading) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current) {
          console.log('[MomentsFeed] Loading more moments...');
          loadMoments(false);
        }
      },
      {
        rootMargin: '100px', // Pre-cargar 100px antes
        threshold: 0.1
      }
    );

    if (lastMomentRef.current) {
      observerRef.current.observe(lastMomentRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loading, loadMoments]);

  // ✅ Loading state inicial
  if (loading && moments.length === 0) {
    return (
      <div className={cn('flex items-center justify-center min-h-screen', className)}>
        <LoadingSpinner />
      </div>
    );
  }

  // ✅ Error state
  if (error && moments.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center min-h-screen p-6', className)}>
        <div className="text-center max-w-md">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error al cargar momentos
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadMoments(true);
            }}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ✅ Empty state
  if (moments.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center min-h-screen p-6', className)}>
        <div className="text-center max-w-md">
          <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay momentos todavía
          </h3>
          <p className="text-gray-600 mb-6">
            Sé el primero en compartir un momento increíble
          </p>
          <a
            href="/moments/create"
            className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all font-semibold"
          >
            Crear Momento
          </a>
        </div>
      </div>
    );
  }

  // ✅ Feed con snap scrolling
  return (
    <div
      className={cn(
        'max-w-2xl mx-auto',
        // Snap scrolling vertical estilo Instagram
        'snap-y snap-mandatory overflow-y-scroll h-screen',
        // Ocultar scrollbar
        'scrollbar-hide',
        className
      )}
      role="feed"
      aria-label="Feed de momentos"
    >
      {moments.map((moment, index) => (
        <div
          key={moment.id || `moment-${index}`}
          ref={index === moments.length - 1 ? lastMomentRef : null}
          className="snap-start snap-always min-h-screen flex items-center justify-center p-4"
        >
          <MomentCard
            moment={moment}
            currentUserId={userId}
            onCommentClick={(momentId) => {
              // TODO: Navegar a página de comments
              console.log('Open comments for:', momentId);
            }}
          />
        </div>
      ))}

      {/* Loading more indicator */}
      {loading && moments.length > 0 && (
        <div className="snap-start flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      )}

      {/* No more moments indicator */}
      {!hasMore && moments.length > 0 && (
        <div className="snap-start flex items-center justify-center min-h-screen p-6">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">¡Ya viste todo!</p>
            <p className="text-sm mt-1">No hay más momentos por ahora</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente Loading Spinner reutilizable
 */
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-pink-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm text-gray-600 font-medium">Cargando momentos...</p>
    </div>
  );
}

export default MomentsFeed;
