import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';

/**
 * Layout para el Marketplace
 * Requiere solo autenticación básica (tener cuenta en YAAN)
 * Las interacciones (reservas) requieren perfil completo
 */
export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validar autenticación básica (solo tener cuenta)
  await RouteProtectionWrapper.protectMarketplace();
  
  return (
    <div className="marketplace-layout">
      {children}
    </div>
  );
}