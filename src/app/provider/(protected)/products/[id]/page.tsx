import { notFound } from 'next/navigation';
import { getProviderProductByIdAction } from '@/lib/server/provider-products-actions';
import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import { ProductDetailsView } from '@/components/provider/ProductDetailsView';

interface ProductDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Página de detalles de producto
 * Muestra toda la información del producto en modo solo lectura
 */
export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  // Validar que el provider esté completamente aprobado
  const auth = await RouteProtectionWrapper.protectProvider(true);
  
  // Obtener params (Next.js 15)
  const { id } = await params;
  
  // Obtener el producto
  const productResult = await getProviderProductByIdAction(id);
  
  if (!productResult.success || !productResult.data) {
    notFound();
  }
  
  const product = productResult.data;
  
  // Verificar que el producto pertenece al provider actual
  if (product.provider_id !== auth.user.sub) {
    notFound();
  }
  
  return (
    <ProductDetailsView 
      product={product}
      userId={auth.user.sub}
    />
  );
}