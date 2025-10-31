import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import { ProfileCompletionGuard } from '@/components/guards/ProfileCompletionGuard';

/**
 * Layout para Booking - Multi-layer Security
 *
 * Protección multi-capa siguiendo el patrón de /marketplace:
 * 1. Server-side: RouteProtectionWrapper.protectMarketplace() con authenticationOnly: true
 * 2. Client-side: ProfileCompletionGuard con validación de perfil completo
 *
 * REQUERIMIENTOS:
 * - Usuario autenticado (cualquier user_type: traveler, influencer, provider)
 * - Perfil completo según user_type (validación diferenciada)
 * - Redirección automática a /settings/profile si perfil incompleto
 * - Callback URL guardado en sessionStorage para retorno
 *
 * PATTERNS SEGUIDOS:
 * - marketplace/layout.tsx: Protección multi-capa
 * - ProfileCompletionGuard: Validación de perfil por user_type
 * - RouteProtectionWrapper: SSR auth validation
 */
export default async function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side protection (primera capa)
  // authenticationOnly: true = permite cualquier user_type autenticado
  await RouteProtectionWrapper.protectMarketplace(true);

  return (
    <ProfileCompletionGuard context="booking">
      <div className="booking-layout">
        {children}
      </div>
    </ProfileCompletionGuard>
  );
}
