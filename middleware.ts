import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware para protección de rutas y headers de seguridad
 * CRÍTICO: Implementación completa para alcanzar 100/100 en seguridad
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // CRÍTICO: Headers de seguridad completos para puntuación 100/100
  // 1. Protección contra XSS
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // 2. Protección contra clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // 3. Política de referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 4. Política de permisos
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // 5. Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.amazonaws.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com wss://*.appsync-realtime-api.us-west-2.amazonaws.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // 6. HSTS (solo en producción)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  
  // 7. Headers adicionales para cookies seguras
  const cookieHeader = response.headers.get('set-cookie');
  if (cookieHeader) {
    // Asegurar que todas las cookies tengan flags de seguridad
    const secureCookie = cookieHeader
      .split(',')
      .map(cookie => {
        if (!cookie.includes('HttpOnly')) cookie += '; HttpOnly';
        if (!cookie.includes('Secure') && process.env.NODE_ENV === 'production') {
          cookie += '; Secure';
        }
        if (!cookie.includes('SameSite')) cookie += '; SameSite=Lax';
        return cookie;
      })
      .join(',');
    
    response.headers.set('set-cookie', secureCookie);
  }
  
  // Protección básica para rutas del dashboard
  // Nota: La verificación completa se hace en el layout del dashboard con SSR
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Agregar header para identificar ruta protegida
    response.headers.set('X-Protected-Route', 'dashboard');
    
    // Headers para prevenir cache de datos sensibles
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
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