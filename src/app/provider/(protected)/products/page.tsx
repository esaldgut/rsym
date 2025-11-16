import { Suspense } from 'react';
import Link from 'next/link';
import { HeroSection } from '@/components/ui/HeroSection';
import { ProviderProductsDashboard } from '@/components/provider/ProviderProductsDashboard';
import { getProviderProductsAction, getProviderMetricsAction } from '@/lib/server/provider-products-actions';
import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import { transformPathsToUrls } from '@/lib/utils/s3-url-transformer';

/**
 * Página de listado de productos del provider
 * Versión server-side rendering con server actions siguiendo patrones establecidos
 * SOPORTA filtrado por URL: /provider/products?filter=circuit|package|draft|published
 */
export default async function ProviderProductsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  // Next.js 16: searchParams is now async
  const resolvedParams = await searchParams;

  // Validar que el provider esté completamente aprobado
  const auth = await RouteProtectionWrapper.protectProvider(true);

  // Extract and validate filter from URL query parameters
  const urlFilter = resolvedParams.filter as 'circuit' | 'package' | 'draft' | 'published' | undefined;
  const validFilters = ['circuit', 'package', 'draft', 'published'];
  const initialFilter = urlFilter && validFilters.includes(urlFilter)
    ? urlFilter
    : 'all';

  // Build GraphQL filter based on URL parameter
  let initialGraphqlFilter = {};
  if (initialFilter === 'circuit') {
    initialGraphqlFilter = { product_type: 'circuit' };
  } else if (initialFilter === 'package') {
    initialGraphqlFilter = { product_type: 'package' };
  } else if (initialFilter === 'draft') {
    initialGraphqlFilter = { published: false };
  } else if (initialFilter === 'published') {
    initialGraphqlFilter = { published: true };
  }

  console.log('🔗 [ProviderProductsPage] URL filter:', {
    urlParam: resolvedParams.filter,
    validated: initialFilter,
    graphqlFilter: initialGraphqlFilter
  });

  // Server-side data fetching inicial con filtro aplicado
  const [initialProductsResult, metricsResult] = await Promise.all([
    getProviderProductsAction({
      pagination: { limit: 12 },
      filter: initialGraphqlFilter
    }),
    getProviderMetricsAction()
  ]);

  // Transformar paths a URLs públicas server-side para mejor performance
  // Esto evita que ProfileImage tenga que generar URLs client-side
  const initialProducts = initialProductsResult.success && initialProductsResult.data
    ? {
        ...initialProductsResult.data,
        items: initialProductsResult.data.items.map(product => transformPathsToUrls(product))
      }
    : null;

  const metrics = metricsResult.success ? metricsResult.data : null;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection
        title="Mis Productos Turísticos"
        subtitle="Gestiona tus circuitos y paquetes turísticos, y monitorea su rendimiento"
        size="md"
        showShapes={true}
      >
        <div className="flex gap-4">
          <Link
            href="/provider/products/create"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Nuevo Producto
          </Link>
        </div>
      </HeroSection>
      
      <div className="bg-gray-50 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={<div className="text-center py-8">Cargando productos...</div>}>
            <ProviderProductsDashboard
              initialProducts={initialProducts}
              metrics={metrics}
              initialFilter={initialFilter as 'all' | 'circuit' | 'package' | 'draft' | 'published'}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
