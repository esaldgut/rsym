import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';

/**
 * Layout protegido para el dashboard
 * Usa el wrapper centralizado de protección de rutas
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Usar wrapper de protección - redirige a /moments (negocio principal)
  const auth = await RouteProtectionWrapper.protectDashboard();
  
  return (
    <div className="dashboard-layout">
      {/* Header de seguridad solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && auth.user && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-green-800 text-sm font-medium">
              🛡️ Dashboard - Autenticación verificada
            </span>
            <span className="text-green-600 text-xs">
              Usuario: {auth.user.username} | 
              Tipo: {auth.user.userType} | 
              Email: {auth.user.email}
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}