import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import ProviderPageClient from './ProviderPageClient';
import { getProviderProductsAction, getProviderMetricsAction } from '@/lib/server/provider-products-actions';
import {
  getProviderReservationsAction,
  getProviderPoliciesAction
} from '@/lib/server/provider-dashboard-actions';

/**
 * Página principal del área de provider - Server Component
 * Valida acceso y obtiene datos del dashboard antes de renderizar
 * PATRÓN SSR: Server Component fetches data → passes to Client Component
 */
export default async function ProviderPage() {
  // Validar que el provider esté completamente aprobado
  await RouteProtectionWrapper.protectProvider(true);

  // Obtener datos del dashboard en paralelo (SSR eficiente)
  const [productsResult, metricsResult, reservationsResult, policiesResult] = await Promise.all([
    getProviderProductsAction({ pagination: { limit: 6 } }), // Solo primeros 6 productos
    getProviderMetricsAction(),
    getProviderReservationsAction(),
    getProviderPoliciesAction()
  ]);

  // Extraer datos con fallback a valores seguros
  const products = productsResult.success ? productsResult.data : null;
  const metrics = metricsResult.success ? metricsResult.data : null;
  const reservations = reservationsResult.success ? reservationsResult.data : null;
  const policies = policiesResult.success ? policiesResult.data : null;

  // Log warnings si hay datos parciales (debugging en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    if (productsResult.hasPartialData) {
      console.warn('⚠️ [ProviderPage] Productos con datos parciales:', productsResult.warnings);
    }
    if (reservationsResult.hasPartialData) {
      console.warn('⚠️ [ProviderPage] Reservaciones con datos parciales:', reservationsResult.warnings);
    }
  }

  return (
    <ProviderPageClient
      initialProducts={products}
      metrics={metrics}
      reservations={reservations}
      policies={policies}
    />
  );
}