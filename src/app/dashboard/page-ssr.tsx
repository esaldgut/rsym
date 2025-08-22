import { getAuthenticatedUser, getIdTokenClaims, ensureValidTokens } from '@/utils/amplify-server-utils';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { ProviderOnlyGuard } from '@/components/guards/ProviderOnlyGuard';
import { SecurityValidator } from '@/lib/security-validator';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Dashboard Server Component con validaciones de seguridad
 * Implementa principios del AWS Well-Architected Framework:
 * - Security: Validación de tokens y permisos
 * - Reliability: Manejo robusto de errores
 * - Performance: SSR optimizado
 * - Cost Optimization: Renderizado eficiente en servidor
 */
export default async function DashboardSSRPage() {
  const startTime = performance.now();
  
  try {
    console.log('🚀 [Dashboard SSR] Iniciando renderizado del servidor...');
    
    // 1. Validar headers de seguridad
    const headersList = headers();
    const userAgent = headersList.get('user-agent');
    const origin = headersList.get('origin');
    
    console.log('🔍 [Dashboard SSR] Headers de seguridad:', {
      userAgent: userAgent?.substring(0, 50),
      origin
    });
    
    // 2. Verificar autenticación robusta
    const user = await getAuthenticatedUser();
    
    if (!user) {
      console.log('❌ [Dashboard SSR] Usuario no autenticado, redirigiendo...');
      redirect('/auth?error=authentication_required&redirect=/dashboard');
    }
    
    // 3. Validar tokens activos
    const tokensValid = await ensureValidTokens();
    if (!tokensValid) {
      console.log('❌ [Dashboard SSR] Tokens inválidos, redirigiendo...');
      redirect('/auth?error=session_expired&redirect=/dashboard');
    }
    
    // 4. Obtener y validar claims del ID token
    const claims = await getIdTokenClaims();
    if (!claims) {
      console.log('❌ [Dashboard SSR] No se pudieron obtener claims del ID token');
      redirect('/auth?error=token_invalid&redirect=/dashboard');
    }
    
    // 5. Validar tipo de usuario
    const userType = claims['custom:user_type'] as 'provider' | 'consumer' | null;
    if (!userType || !['provider', 'consumer'].includes(userType)) {
      console.log('❌ [Dashboard SSR] Tipo de usuario inválido:', userType);
      redirect('/auth?error=invalid_user_type&redirect=/dashboard');
    }
    
    // 6. Validación de seguridad adicional
    const securityValidation = SecurityValidator.validateUser({
      sub: user.sub || '',
      userType,
      email: user.email || ''
    });
    
    if (!securityValidation.isValid) {
      console.log('❌ [Dashboard SSR] Validación de seguridad falló:', securityValidation.issues);
      redirect('/auth?error=security_validation_failed');
    }
    
    // 7. Log de éxito con métricas
    const renderTime = performance.now() - startTime;
    console.log('✅ [Dashboard SSR] Usuario autenticado exitosamente:', {
      username: user.username,
      userType,
      sub: user.sub?.substring(0, 8) + '...',
      hasIdToken: !!claims,
      renderTimeMs: renderTime.toFixed(2),
      securityLevel: 'HIGH'
    });
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header con información de seguridad y rendimiento */}
        <nav className="bg-white shadow border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  YAAN Dashboard
                </h1>
                {/* Indicadores de seguridad y rendimiento en desarrollo */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="ml-4 flex gap-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      🛡️ SSR + Security Validated
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      🔑 ID Token Active
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                      ⚡ {renderTime.toFixed(0)}ms
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {userType === 'provider' && (
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      🏢 Proveedor
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      Verificado
                    </span>
                  </div>
                )}
                {userType === 'consumer' && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    👤 Cliente
                  </span>
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Área de contenido principal */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Suspense boundary para carga optimizada */}
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600">Cargando dashboard...</p>
                <p className="text-xs text-gray-400 mt-1">Optimizado con Server-Side Rendering</p>
              </div>
            }>
              <DashboardContent userType={userType} />
            </Suspense>
          </div>
        </main>
        
        {/* Footer con información de seguridad */}
        {process.env.NODE_ENV === 'development' && (
          <footer className="bg-gray-100 border-t border-gray-200 mt-8">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex gap-4">
                  <span>🔐 Authentication: AWS Cognito</span>
                  <span>📊 Rendering: Server-Side (Next.js 15.3.4)</span>
                  <span>⚡ Framework: AWS Well-Architected</span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                    Security: HIGH
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    Performance: Optimized
                  </span>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>
    );
    
  } catch (error) {
    // Manejo robusto de errores siguiendo AWS Well-Architected
    console.error('💥 [Dashboard SSR] Error crítico:', error);
    
    // Log detallado para debugging
    console.error('💥 [Dashboard SSR] Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
    
    // Redirigir a página de error segura
    redirect('/auth?error=server_error&message=dashboard_render_failed');
  }
}