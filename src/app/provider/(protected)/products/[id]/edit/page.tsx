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
  console.log('🔍 EditProductPage - Obteniendo producto con ID:', id);
  const productResult = await getProviderProductByIdAction(id);

  console.log('📊 EditProductPage - Resultado:', {
    success: productResult.success,
    hasData: !!productResult.data,
    error: productResult.error
  });

  if (!productResult.success || !productResult.data) {
    console.log('❌ EditProductPage - Producto no encontrado, llamando notFound()');
    notFound();
  }

  const product = productResult.data;

  console.log('✅ EditProductPage - Producto obtenido:', {
    id: product.id,
    name: product.name,
    provider_id: product.provider_id,
    current_user: auth.user.id
  });

  // Verificar que el producto pertenece al provider actual
  if (product.provider_id !== auth.user.id) {
    console.log('❌ EditProductPage - Producto no pertenece al usuario, llamando notFound()');
    notFound();
  }

  console.log('🎯 EditProductPage - Renderizando EditProductWrapper');
  
  return (
    <EditProductWrapper
      product={product}
      userId={auth.user.id}
    />
  );
}