import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';

/**
 * Layout para la página de aprobación pendiente
 * Solo valida que sea provider, NO requiere aprobación (para evitar loops)
 */
export default async function PendingApprovalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Solo verificar que sea provider, sin validar aprobación
  await RouteProtectionWrapper.protect({
    allowedUserTypes: 'provider',
    requireApproval: false,
    requireGroup: false,
    //redirectTo: '/auth'
   authenticationOnly: true 
  });
  
  return <>{children}</>;
}
