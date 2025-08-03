import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from './src/lib/amplify-server-utils';

/**
 * Middleware de seguridad para proteger rutas autenticadas
 * Basado en AWS Amplify v6 + Next.js 15.3.4 mejores prácticas
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Crear respuesta base
  const response = NextResponse.next();
  
  try {
    // Validar autenticación usando Amplify Server Context con cookies HTTP-only
    // CRÍTICO: En middleware Next.js, pasar request y response según documentación oficial
    const authResult = await runWithAmplifyServerContext({
      nextServerContext: { request, response },
      operation: async (contextSpec) => {
        try {
          // SEGURO: Verificar tokens desde cookies HTTP-only del servidor
          const session = await fetchAuthSession(contextSpec, {
            forceRefresh: false // No forzar refresh en middleware por performance
          });
          
          // Verificar que los tokens existan y sean válidos
          const isAuthenticated = session.tokens?.accessToken !== undefined && 
                                 session.tokens?.idToken !== undefined;
          
          if (!isAuthenticated) {
            return { authenticated: false, userType: null, reason: 'no_tokens' };
          }
          
          // SEGURO: Extraer información del ID token server-side solamente
          const idToken = session.tokens.idToken;
          const userType = idToken.payload['custom:user_type'] as string || 'consumer';
          const emailVerified = idToken.payload.email_verified as boolean;
          
          // Validaciones adicionales de seguridad
          if (!emailVerified) {
            return { authenticated: false, userType: null, reason: 'email_not_verified' };
          }
          
          // Verificar expiración del token con margen de seguridad
          const now = Math.floor(Date.now() / 1000);
          const tokenExp = idToken.payload.exp as number;
          const bufferTime = 60; // 1 minuto de margen por seguridad
          
          if (tokenExp && (tokenExp - bufferTime) < now) {
            return { authenticated: false, userType: null, reason: 'token_expired' };
          }
          
          // NO exponer tokens ni información sensible
          return { 
            authenticated: true, 
            userType,
            // NO incluir tokens, sub, email en headers por seguridad
          };
          
        } catch (error) {
          console.error('Auth session error:', error);
          return { authenticated: false, userType: null, reason: 'session_error' };
        }
      }
    });
    
    // Si no está autenticado, redirigir a auth
    if (!authResult.authenticated) {
      const authUrl = new URL('/auth', request.url);
      
      // Agregar parámetros de contexto para debugging
      if (authResult.reason === 'email_not_verified') {
        authUrl.searchParams.set('error', 'email_verification_required');
      } else if (authResult.reason === 'token_expired') {
        authUrl.searchParams.set('error', 'session_expired');
      }
      
      // Agregar redirect para regresar después del login
      if (pathname !== '/auth') {
        authUrl.searchParams.set('redirect', pathname);
      }
      
      return NextResponse.redirect(authUrl);
    }
    
    // Validaciones específicas por ruta y tipo de usuario
    if (pathname.startsWith('/provider')) {
      if (authResult.userType !== 'provider') {
        // Proveedores no aprobados van al dashboard general
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // Agregar headers de seguridad
    response.headers.set('X-User-Type', authResult.userType || 'consumer');
    response.headers.set('X-Auth-Status', 'authenticated');
    
    // Cache control para páginas autenticadas
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // En caso de error crítico, redirigir a auth
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('error', 'middleware_error');
    return NextResponse.redirect(authUrl);
  }
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