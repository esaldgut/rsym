import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import ProviderPageClient from './ProviderPageClient';

/**
 * Página principal del área de provider - Server Component
 * Valida acceso completo antes de renderizar
 */
export default async function ProviderPage() {
  // Validar que el provider esté completamente aprobado
  await RouteProtectionWrapper.protectProvider(true);
  
  return <ProviderPageClient />;
}