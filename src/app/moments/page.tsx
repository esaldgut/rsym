/**
 * Página de Momentos - Feed de red social estilo Instagram
 *
 * Características:
 * - SSR con autenticación usando UnifiedAuthSystem
 * - Video autoplay con Intersection Observer
 * - Snap scrolling vertical para mobile
 * - useOptimistic para feedback inmediato
 *
 * Patrones: Next.js 15 + Server Components + Client Components optimizados
 */

import { Suspense } from 'react';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import { MomentsFeed } from '@/components/moments/MomentsFeed';
import Link from 'next/link';

// ✅ Server Component - No 'use client'
export default async function MomentsPage() {
  // ✅ Autenticación con método estático (solo requiere estar autenticado)
  await RouteProtectionWrapper.protectMoments();

  // Obtener usuario autenticado con UnifiedAuthSystem
  const user = await getAuthenticatedUser();

  // Verificar que el usuario existe (redundante con RouteProtectionWrapper, pero necesario para TypeScript)
  if (!user) {
    // Este caso no debería ocurrir porque RouteProtectionWrapper ya validó la autenticación
    throw new Error('Usuario no autenticado después de protección de ruta');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        {/* Header fijo */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Momentos
            </h1>

            <Link
              href="/moments/create"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-semibold">Crear</span>
            </Link>
          </div>
        </header>

        {/* Feed con Suspense boundary */}
        <Suspense fallback={<LoadingFeed />}>
          <MomentsFeed userId={user.userId} feedType="all" />
        </Suspense>
      </div>
  );
}

/**
 * Loading skeleton optimizado para el feed
 */
function LoadingFeed() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 min-h-screen">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse"
          aria-busy="true"
          aria-label="Cargando momento"
        >
          {/* Header skeleton */}
          <div className="flex items-center p-4 space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>

          {/* Image/Video skeleton */}
          <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>

          {/* Actions skeleton */}
          <div className="p-4 space-y-3">
            <div className="flex space-x-4">
              <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
              <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
              <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}