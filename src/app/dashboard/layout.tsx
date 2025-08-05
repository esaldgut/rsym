import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';

/**
 * Layout protegido para el dashboard
 * Verifica autenticación en el servidor antes de renderizar
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar autenticación en el servidor
  const authData = await getAuthenticatedUser();
  
  if (!authData) {
    // Redirigir a login si no está autenticado
    redirect('/auth/login?error=authentication_required&redirect=/dashboard');
  }
  
  return (
    <div className="dashboard-layout">
      {/* Header de seguridad solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-green-800 text-sm font-medium">
              🛡️ Ruta protegida - Verificación SSR activa
            </span>
            <span className="text-green-600 text-xs">
              Usuario: {authData.user.username} | Tipo: {authData.attributes.email}
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}