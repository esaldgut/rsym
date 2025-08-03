import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware simplificado para logging básico
 * Amplify v6 gestiona completamente la autenticación
 */
export async function middleware(request: NextRequest) {
  // Sin logging en producción por seguridad
  return NextResponse.next();
}

/**
 * TEMPORALMENTE DESHABILITADO - Dejando que Amplify gestione completamente el ciclo de autenticación
 * Middleware será reactivado una vez que Amplify funcione correctamente
 */
export const config = {
  matcher: [
    // Temporalmente vacío - sin protección de middleware
    // '/((?!api/public|_next/static|_next/image|favicon.ico|logo-showcase|auth|oauth2|$).*)'
  ]
};