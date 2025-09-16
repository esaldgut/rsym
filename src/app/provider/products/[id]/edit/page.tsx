import { notFound } from 'next/navigation';
import { getProviderProductByIdAction } from '@/lib/server/provider-products-actions';
import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import { EditProductWrapper } from '@/components/provider/EditProductWrapper';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Página de edición de producto
 * Reutiliza el ProductWizard existente con datos pre-cargados
 */
export default async function EditProductPage({ params }: EditProductPageProps) {
  // Validar que el provider esté completamente aprobado
  const auth = await RouteProtectionWrapper.protectProvider(true);
  
  // Obtener params (Next.js 15)
  const { id } = await params;
  
  // Obtener el producto a editar
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
    <EditProductWrapper 
      product={product}
      userId={auth.user.sub}
    />
  );
}