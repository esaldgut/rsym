import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware para protección de rutas y headers de seguridad
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Headers de seguridad adicionales
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // En producción, forzar HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
  
  // Protección básica para rutas del dashboard
  // Nota: La verificación completa se hace en el layout del dashboard con SSR
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Agregar header para identificar ruta protegida
    response.headers.set('X-Protected-Route', 'dashboard');
    
    // En desarrollo, agregar logs
    if (process.env.NODE_ENV === 'development') {
      console.log(`🛡️ Accessing protected route: ${request.nextUrl.pathname}`);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};