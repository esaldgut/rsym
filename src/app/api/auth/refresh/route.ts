import { NextResponse } from 'next/server';
import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';

/**
 * API Route para forzar refresh de tokens
 * Útil cuando se actualizan atributos en Cognito (ej: aprobaciones)
 * 
 * Uso: 
 * - Llamar a /api/auth/refresh cuando se necesite actualizar tokens
 * - Automáticamente al detectar cambios en Cognito
 * - Manualmente desde el dashboard del usuario
 */
export async function POST() {
  try {
    // Forzar refresh usando el sistema unificado
    const success = await UnifiedAuthSystem.forceTokenRefresh();
    
    if (success) {
      // Obtener la sesión actualizada
      const session = await UnifiedAuthSystem.getValidatedSession();
      
      return NextResponse.json({
        success: true,
        message: 'Tokens actualizados exitosamente',
        user: session.user,
        permissions: session.permissions,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No se pudieron actualizar los tokens. Por favor, inicia sesión nuevamente.'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Error en refresh route:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar tokens',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint para verificar el estado actual sin refresh
 */
export async function GET() {
  try {
    const session = await UnifiedAuthSystem.getValidatedSession(false);
    
    return NextResponse.json({
      authenticated: session.isAuthenticated,
      user: session.user,
      permissions: session.permissions,
      needsRefresh: session.needsRefresh,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: 'Error verificando sesión'
    }, { status: 500 });
  }
}
