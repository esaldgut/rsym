import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';

/**
 * Página de prueba para verificar el estado de autenticación actual
 * Muestra todos los atributos y permisos del usuario
 */
export default async function TestAuthStatusPage() {
  const auth = await UnifiedAuthSystem.getValidatedSession();
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Estado de Autenticación</h1>
        
        {/* Estado general */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado General</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Autenticado:</span>
              <span className={auth.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {auth.isAuthenticated ? '✅ Sí' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Sesión Válida:</span>
              <span className={auth.isValid ? 'text-green-600' : 'text-red-600'}>
                {auth.isValid ? '✅ Sí' : '❌ No'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Información del usuario */}
        {auth.user && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Usuario</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">ID:</span>
                <span className="font-mono text-sm">{auth.user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Username:</span>
                <span>{auth.user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{auth.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tipo de Usuario:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {auth.user.userType}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Permisos */}
        {auth.permissions && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Permisos</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Aprobado:</span>
                <span className={auth.permissions.isApproved ? 'text-green-600' : 'text-amber-600'}>
                  {auth.permissions.isApproved ? '✅ Sí' : '⏳ Pendiente'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">En Grupo Requerido:</span>
                <span className={auth.permissions.inRequiredGroup ? 'text-green-600' : 'text-amber-600'}>
                  {auth.permissions.inRequiredGroup ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Puede Crear Productos:</span>
                <span className={auth.permissions.canCreateProducts ? 'text-green-600' : 'text-gray-400'}>
                  {auth.permissions.canCreateProducts ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Puede Crear Momentos:</span>
                <span className={auth.permissions.canCreateMoments ? 'text-green-600' : 'text-gray-400'}>
                  {auth.permissions.canCreateMoments ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Puede Administrar Contenido:</span>
                <span className={auth.permissions.canManageContent ? 'text-green-600' : 'text-gray-400'}>
                  {auth.permissions.canManageContent ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Puede Acceder a Admin:</span>
                <span className={auth.permissions.canAccessAdmin ? 'text-green-600' : 'text-gray-400'}>
                  {auth.permissions.canAccessAdmin ? '✅ Sí' : '❌ No'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Acciones de prueba */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Enlaces de Prueba</h2>
          <div className="grid grid-cols-2 gap-4">
            <a href="/moments" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center">
              Ir a Momentos (Solo Auth)
            </a>
            <a href="/marketplace" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-center">
              Ir a Marketplace (Solo Auth)
            </a>
            <a href="/provider" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-center">
              Ir a Provider (Requiere Aprobación)
            </a>
            <a href="/provider/pending-approval" className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 text-center">
              Ver Estado Pendiente
            </a>
          </div>
        </div>
        
        {/* Errores */}
        {auth.errors && auth.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Errores</h2>
            <ul className="list-disc list-inside space-y-1">
              {auth.errors.map((error, index) => (
                <li key={index} className="text-red-600">{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}