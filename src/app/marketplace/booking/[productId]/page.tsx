import { notFound, redirect } from 'next/navigation';
import { getProductByIdAction } from '@/lib/server/marketplace-product-actions';
import { ProductDetailClient } from './product-detail-client';

interface ProductDetailPageProps {
  params: Promise<{
    productId: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

/**
 * Product Detail Page - Server Component
 *
 * Displays full product details before booking wizard.
 * Fetches product data server-side and passes to client component.
 *
 * Route: /marketplace/booking/[productId]
 *
 * Features:
 * - ProductGalleryHeader with fullscreen mode
 * - ItineraryCard with day-by-day timeline
 * - SeasonCard for pricing and availability
 * - HybridProductMap for route visualization
 * - Sticky footer with "Reservar Ahora" CTA
 */
export default async function ProductDetailPage({
  params,
  searchParams
}: ProductDetailPageProps) {
  // Next.js 16: params and searchParams are now async
  const resolvedParams = await params;

  console.log('[ProductDetailPage] 📦 Loading product detail page:', {
    productId: resolvedParams.productId
  });

  // Fetch product data server-side
  const result = await getProductByIdAction(resolvedParams.productId);

  // Handle errors
  if (!result.success || !result.data?.product) {
    console.error('[ProductDetailPage] ❌ Failed to load product:', result.error);
    notFound();
  }

  const product = result.data.product;

  // Additional validation - ensure product is published
  if (!product.published) {
    console.warn('[ProductDetailPage] ⚠️ Product not published:', resolvedParams.productId);
    redirect('/marketplace');
  }

  console.log('[ProductDetailPage] ✅ Product loaded successfully:', {
    productId: product.id,
    productName: product.name,
    productType: product.product_type
  });

  // Pass data to client component for interactivity
  return <ProductDetailClient product={product} />;
}

/**
 * Generate metadata for SEO (Next.js 16 App Router)
 */
export async function generateMetadata({ params }: ProductDetailPageProps) {
  // Next.js 16: params is now async
  const resolvedParams = await params;
  const result = await getProductByIdAction(resolvedParams.productId);

  if (!result.success || !result.data?.product) {
    return {
      title: 'Producto no encontrado | YAAN',
      description: 'El producto que buscas no está disponible.'
    };
  }

  const product = result.data.product;
  const destinations = product.destination?.map(d => d.place).filter(Boolean).join(', ') || '';

  return {
    title: `${product.name} | YAAN`,
    description: product.description || `Descubre ${product.name} - ${destinations}`,
    openGraph: {
      title: product.name,
      description: product.description || '',
      images: product.cover_image_url ? [product.cover_image_url] : []
    }
  };
}
