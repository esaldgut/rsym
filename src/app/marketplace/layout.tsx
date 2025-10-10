import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import MarketplaceGuard from '@/components/guards/MarketplaceGuard';

/**
 * Layout para el Marketplace - Enhanced Security
 * Protección multi-capa:
 * 1. Server-side: RouteProtectionWrapper.protectMarketplace()
 * 2. Client-side: MarketplaceGuard con validación de sesión real-time
 * 3. Feature-level: Profile completion para reservas
 */
export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side protection (primera capa)
  await RouteProtectionWrapper.protectMarketplace();

  return (
    <MarketplaceGuard>
      <div className="marketplace-layout">
        {children}
      </div>
    </MarketplaceGuard>
  );
}