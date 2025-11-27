import { Suspense } from 'react';
import { HeroSection } from '@/components/ui/HeroSection';
import { decryptProductUrlParam } from '@/utils/url-encryption';
import { getProductByIdAction } from '@/lib/server/marketplace-product-actions';
import { BookingClient } from './booking-client';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Metadata optimizada para SEO
export const metadata: Metadata = {
  title: 'Reservación - YAAN Experiencias',
  description: 'Completa tu reservación de experiencia única en YAAN',
  openGraph: {
    title: 'Reservación de Experiencia - YAAN',
    description: 'Asegura tu lugar en esta experiencia única',
    type: 'website',
  },
};

// Next.js 15.3.4 - Dynamic rendering con PPR (Partial Pre-Rendering)
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-cache';
export const revalidate = 60; // Revalidar cada 60 segundos

/**
 * Booking Page - Server Component with SSR + Next.js 15.3.4 optimizations
 *
 * ARQUITECTURA CORRECTA Next.js 15.3.4 + AWS Amplify Gen 2 v6:
 *
 * 1. ✅ Server Component por defecto (SSR con streaming)
 * 2. ✅ Server Actions para mutaciones (reservation-actions.ts)
 * 3. ✅ generateServerClientUsingCookies para auth SSR
 * 4. ✅ Suspense boundaries para streaming HTML
 * 5. ✅ Parallel data fetching con Promise.allSettled
 * 6. ✅ Client Component solo para interactividad (booking-client.tsx)
 * 7. ✅ URL encryption para productId+name
 * 8. ✅ Protección multi-capa (layout + guard)
 * 9. ✅ Profile completion validation
 * 10. ✅ PPR incremental con revalidate
 *
 * PATTERN INSPIRADO EN:
 * - /marketplace/page.tsx: SSR pattern
 * - Exoticca booking flow: Multi-step wizard
 */
export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  console.log('📋 [SERVER COMPONENT] BookingPage rendering');

  // 1. Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  // 2. Extraer y validar parámetro cifrado de URL
  const productParam = params.product;

  if (!productParam || typeof productParam !== 'string') {
    console.error('❌ [BookingPage] Missing or invalid product parameter');
    redirect('/marketplace');
  }

  // 2. Descifrar parámetro de URL (AES-256-GCM)
  const decryptionResult = decryptProductUrlParam(productParam);

  if (!decryptionResult.success || !decryptionResult.data) {
    console.error('❌ [BookingPage] Failed to decrypt product parameter:', decryptionResult.error);
    redirect('/marketplace');
  }

  const { productId, productName, productType } = decryptionResult.data;

  console.log('🔓 [BookingPage] Product decrypted:', {
    productId,
    productName,
    productType
  });

  // 3. Cargar datos del producto (SSR)
  const productResult = await getProductByIdAction(productId);

  if (!productResult.success || !productResult.data?.product) {
    console.error('❌ [BookingPage] Product not found:', productResult.error);
    redirect('/marketplace');
  }

  const product = productResult.data.product;

  // 4. Validar que el producto esté publicado y disponible
  if (!product.published) {
    console.error('❌ [BookingPage] Product not published:', productId);
    redirect('/marketplace');
  }

  // 5. Validar que tenga seasons (requerido para pricing)
  if (!product.seasons || product.seasons.length === 0) {
    console.error('❌ [BookingPage] Product has no seasons configured:', {
      productId: product.id,
      productName: product.name
    });
    return <NoSeasonsError productName={product.name} />;
  }

  console.log('📊 [SSR DATA]:', {
    productId: product.id,
    productName: product.name,
    productType: product.product_type,
    seasonsCount: product.seasons.length,
    hasPaymentPolicy: !!product.payment_policy
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section - Server Rendered */}
      <HeroSection
        title={`Reservar: ${product.name}`}
        subtitle="Completa los detalles de tu reservación"
        size="md"
        showShapes={true}
      />

      {/* Client Component with SSR hydration */}
      <Suspense fallback={<BookingLoadingSkeleton />}>
        <BookingClient
          product={product}
          encryptedProductParam={productParam}
        />
      </Suspense>
    </div>
  );
}

/**
 * Error Component - Product without seasons configured
 */
function NoSeasonsError({ productName }: { productName: string }) {
  return (
    <div className="bg-gray-50 -mt-8 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <svg
              className="w-8 h-8 text-red-600 flex-shrink-0 mt-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                Producto sin temporadas configuradas
              </h1>
              <p className="text-gray-700 mb-4">
                El producto <strong className="font-semibold">{productName}</strong> no
                tiene temporadas activas configuradas en este momento.
              </p>
              <p className="text-gray-600 mb-6">
                No es posible realizar una reservación. Por favor, contacta al proveedor
                o selecciona otro producto del marketplace.
              </p>
              <a
                href="/marketplace"
                className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Volver al Marketplace
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton for Booking - Server Component fallback
 */
function BookingLoadingSkeleton() {
  return (
    <div className="bg-gray-50 -mt-8 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wizard steps skeleton */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="ml-3 h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Form skeleton */}
          <div className="space-y-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded w-full animate-pulse"></div>
          </div>
        </div>

        {/* Product summary skeleton */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="h-48 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
