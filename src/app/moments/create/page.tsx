import { HeroSection } from '@/components/ui/HeroSection';
import { CreateMomentForm } from '@/components/moments/CreateMomentForm';
import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';

/**
 * Server Component para la página de creación de Moments
 * Obtiene el usuario autenticado en el servidor y pasa los datos al Client Component
 *
 * Patrón Next.js 15 + AWS Amplify Gen 2:
 * 1. Server Component obtiene datos en el servidor (sin hidratación)
 * 2. Client Component maneja la interactividad
 * 3. Sin mismatches de hidratación
 */
export default async function CreateMomentPage() {
  // Validar autenticación en el servidor - Sin hydration issues
  const validation = await UnifiedAuthSystem.requireAuthentication('/moments/create');

  // El usuario ya está validado, extraer datos necesarios
  const userId = validation.user?.id || '';
  const username = validation.user?.username || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Server Component */}
      <HeroSection
        title="Crear Momento"
        subtitle={`Comparte tus experiencias turísticas con la comunidad YAAN, ${username}`}
        size="sm"
        showShapes={true}
      />

      <div className="relative -mt-8 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Client Component para el formulario interactivo */}
          <CreateMomentForm
            userId={userId}
            username={username}
          />

          {/* Debug Info (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 bg-gray-800 text-green-400 p-4 rounded-lg text-xs font-mono">
              <h4 className="text-white mb-2">🔧 Debug Info - SSR Pattern</h4>
              <pre>{JSON.stringify({
                userId,
                username,
                userType: validation.user?.userType,
                isAuthenticated: validation.isAuthenticated,
                renderType: 'Server Component → Client Component',
                noHydrationIssues: true
              }, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
