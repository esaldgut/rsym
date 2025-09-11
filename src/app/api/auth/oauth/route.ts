import { NextRequest, NextResponse } from 'next/server';
import { runWithAmplifyServerContext } from '@/utils/amplify-server-utils';
import { fetchAuthSession } from 'aws-amplify/auth/server';

/**
 * API Route handler para OAuth callbacks
 * Maneja los callbacks de proveedores OAuth y establece cookies HTTP-only
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Manejar errores de OAuth
    if (error) {
      console.error('OAuth error:', error);
      const errorDescription = searchParams.get('error_description');
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }
    
    // Verificar que tengamos código y estado
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/auth?error=missing_oauth_params', request.url)
      );
    }
    
    // Verificar la sesión después del OAuth
    const authenticated = await runWithAmplifyServerContext({
      nextServerContext: { request, response: NextResponse.next() },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec);
          return session.tokens?.idToken !== undefined;
        } catch (error) {
          console.error('Error verificando sesión OAuth:', error);
          return false;
        }
      },
    });
    
    if (authenticated) {
      // Extraer URL de callback del estado si existe
      let callbackUrl = '/moments';
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        if (stateData.callbackUrl) {
          callbackUrl = stateData.callbackUrl;
        }
      } catch {
        // Si el estado no es JSON, usar moments por defecto
      }
      
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    } else {
      return NextResponse.redirect(
        new URL('/auth?error=oauth_failed', request.url)
      );
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth?error=oauth_error', request.url)
    );
  }
}

export async function POST() {
  // Manejar token exchange para OAuth si es necesario
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}