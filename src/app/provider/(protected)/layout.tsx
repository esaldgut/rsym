import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';

/**
 * Layout para el área de provider
 * Requiere tipo de usuario provider, grupo 'providers' y aprobación del equipo YAAN
 * Las rutas que NO requieren aprobación completa deben tener su propio layout
 */
export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SIEMPRE requiere aprobación completa y pertenencia al grupo
  // Si no está aprobado, será redirigido automáticamente a /provider/pending-approval
  const auth = await RouteProtectionWrapper.protectProvider(true);
  
  return (
    <div className="provider-layout">
      {children}
      {/* Footer de seguridad solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && auth.user && (
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-purple-800 text-sm font-medium">
              🛡️ Área Provider - {auth.user.username}
            </span>
            <span className="text-purple-600 text-xs">
              Tipo: {auth.user.userType} | 
              Aprobado: {auth.permissions?.isApproved ? '✅' : '⏳'} | 
              Grupo: {auth.permissions?.inRequiredGroup ? '✅' : '❌'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
