import { redirect } from 'next/navigation';
import { getAuthenticatedUser, getIdTokenClaims } from '@/utils/amplify-server-utils';

/**
 * Ejemplo de página protegida con SSR
 * Los datos del usuario se obtienen en el servidor usando cookies HTTP-only
 */
export default async function DashboardSSRPage() {
  // Verificar autenticación en el servidor
  const authData = await getAuthenticatedUser();
  
  if (!authData) {
    redirect('/auth/login');
  }
  
  // Obtener claims del token de forma segura
  const claims = await getIdTokenClaims();
  const userType = claims?.['custom:user_type'] || 'consumer';
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard SSR (Cookies HTTP-only)</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Información del Usuario (Server Side)</h2>
        <dl className="space-y-2">
          <div>
            <dt className="font-medium text-gray-600">Usuario:</dt>
            <dd>{authData.user.username}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">ID:</dt>
            <dd>{authData.user.userId}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Email:</dt>
            <dd>{authData.attributes.email}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Tipo de Usuario:</dt>
            <dd className="capitalize">{userType}</dd>
          </div>
        </dl>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🔒 Seguridad Mejorada</h3>
        <p className="text-sm text-blue-800">
          Esta página utiliza cookies HTTP-only. Los tokens de sesión no son accesibles 
          desde JavaScript, protegiéndote contra ataques XSS.
        </p>
      </div>
    </div>
  );
}