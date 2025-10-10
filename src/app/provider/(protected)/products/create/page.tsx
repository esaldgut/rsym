import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import CreateProductClient from './CreateProductClient';

/**
 * Página de creación de productos - Server Component
 * Requiere provider completamente aprobado
 */
export default async function CreateProductPage() {
  // Validar que el provider esté completamente aprobado
  const auth = await RouteProtectionWrapper.protectProvider(true);
  
  if (!auth.user) {
    throw new Error('Usuario no autenticado');
  }

  return <CreateProductClient userId={auth.user.id} />;
}