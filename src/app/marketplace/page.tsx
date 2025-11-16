import { Suspense } from 'react';
import { HeroSection } from '../../components/ui/HeroSection';
import { getMarketplaceProductsAction, getMarketplaceMetricsAction } from '@/lib/server/marketplace-actions';
import { MarketplaceClient } from './marketplace-client';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';

// Metadata optimizada para SEO
export const metadata: Metadata = {
  title: 'Marketplace - YAAN Experiencias',
  description: 'Descubre experiencias únicas creadas por proveedores locales en YAAN',
  openGraph: {
    title: 'Marketplace de Experiencias - YAAN',
    description: 'Explora circuitos y paquetes turísticos únicos',
    type: 'website',
  },
};

// Next.js 15.3.4 - Dynamic rendering con PPR (Partial Pre-Rendering)
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-cache';
export const revalidate = 60; // Revalidar cada 60 segundos

/**
 * Marketplace Page - Server Component with SSR + Next.js 15.3.4 optimizations
 *
 * ARQUITECTURA CORRECTA Next.js 15.3.4 + AWS Amplify Gen 2 v6:
 *
 * 1. ✅ Server Component por defecto (SSR con streaming)
 * 2. ✅ Server Actions para mutaciones (reservation-actions.ts)
 * 3. ✅ generateServerClientUsingCookies para auth SSR
 * 4. ✅ Suspense boundaries para streaming HTML
 * 5. ✅ Parallel data fetching con Promise.allSettled
 * 6. ✅ Client Component solo para interactividad (marketplace-client.tsx)
 * 7. ✅ nextToken pagination implementada
 * 8. ✅ unstable_cache para métricas (marketplace-actions.ts)
 * 9. ✅ Protección multi-capa (layout + guard)
 * 10. ✅ PPR incremental con revalidate
 */
export default async function MarketplacePage() {
  console.log('🏪 [SERVER COMPONENT] MarketplacePage rendering');

  // 1. Load initial data on server (SSR) - PARALLEL requests
  const [productsResult, metricsResult] = await Promise.allSettled([
    getMarketplaceProductsAction({
      pagination: { limit: 20 } // Initial load (published=true is automatic)
    }),
    getMarketplaceMetricsAction()
  ]);

  // 2. Extract data safely con type narrowing automático
  // ✅ Discriminated union: después de verificar success, TypeScript garantiza que data existe
  const initialProducts =
    productsResult.status === 'fulfilled' && productsResult.value.success
      ? productsResult.value.data.items  // No need for optional chaining - data guaranteed to exist
      : [];

  const initialNextToken =
    productsResult.status === 'fulfilled' && productsResult.value.success
      ? productsResult.value.data.nextToken
      : undefined;

  const initialMetrics =
    metricsResult.status === 'fulfilled' && metricsResult.value.success
      ? metricsResult.value.data
      : undefined;

  console.log('📊 [SSR DATA]:', {
    products: initialProducts.length,
    hasNextToken: !!initialNextToken,
    metricsLoaded: !!initialMetrics
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section - Server Rendered */}
      <HeroSection
        title="Marketplace de Experiencias"
        subtitle="Descubre experiencias únicas creadas por proveedores locales"
        size="md"
        showShapes={true}
      />

      {/* Client Component with SSR hydration */}
      <Suspense fallback={<MarketplaceLoadingSkeleton />}>
        <MarketplaceClient
          initialProducts={initialProducts}
          initialNextToken={initialNextToken}
          initialMetrics={initialMetrics}
        />
      </Suspense>
    </div>
  );
}

/**
 * Loading Skeleton for Marketplace - Server Component fallback
 */
function MarketplaceLoadingSkeleton() {
  return (
    <div className="bg-gray-50 -mt-8 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters skeleton */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Products grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="flex justify-between items-center">
                  <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}