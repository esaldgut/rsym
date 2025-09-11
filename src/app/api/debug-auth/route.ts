import { NextResponse } from 'next/server';
import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';

/**
 * API endpoint para depurar el estado de autenticación
 * GET /api/debug-auth
 */
export async function GET() {
  try {
    console.log('\n🔍 === DEBUG AUTH SESSION ===');
    
    // Obtener sesión validada
    const session = await UnifiedAuthSystem.getValidatedSession();
    
    console.log('📊 Session Result:', {
      isValid: session.isValid,
      isAuthenticated: session.isAuthenticated,
      user: session.user,
      permissions: session.permissions,
      errors: session.errors
    });
    
    // Simular validación de provider
    if (session.user?.userType === 'provider') {
      console.log('\n🧪 Simulando validación de provider:');
      console.log('   - Tipo: provider ✅');
      console.log('   - Aprobado:', session.permissions?.isApproved ? '✅' : '❌');
      console.log('   - En grupo:', session.permissions?.inRequiredGroup ? '✅' : '❌');
      
      const shouldRedirectToPending = 
        !session.permissions?.isApproved || 
        !session.permissions?.inRequiredGroup;
      
      console.log('   - Debería redirigir a pending-approval:', shouldRedirectToPending ? 'SÍ' : 'NO');
      
      if (shouldRedirectToPending) {
        console.log('   - URL destino: /provider/pending-approval');
      }
    }
    
    console.log('=== END DEBUG ===\n');
    
    return NextResponse.json({
      session,
      debug: {
        shouldRedirectToPending: session.user?.userType === 'provider' && 
          (!session.permissions?.isApproved || !session.permissions?.inRequiredGroup),
        redirectUrl: '/provider/pending-approval'
      }
    });
  } catch (error) {
    console.error('Error en debug-auth:', error);
    return NextResponse.json({ 
      error: 'Error obteniendo sesión',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}