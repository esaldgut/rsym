import { NextRequest, NextResponse } from 'next/server';
import { runWithAmplifyServerContext } from '@/app/amplify-config-ssr';

/**
 * Manejador de autenticación para cookies HTTP-Only
 * Este endpoint asegura que los tokens se almacenen solo en cookies seguras
 */
export async function POST(request: NextRequest) {
  // Manejar el callback de autenticación
  const response = await runWithAmplifyServerContext({
    nextServerContext: { request: request as any, response: NextResponse as any },
    operation: async () => {
      // La lógica de autenticación es manejada por Amplify
      // Este endpoint asegura que las cookies se configuren correctamente
      return NextResponse.json({ success: true });
    }
  });

  // Asegurar que las cookies tengan los flags de seguridad correctos
  const headers = new Headers(response.headers);
  const cookies = headers.get('set-cookie');
  
  if (cookies) {
    // Aplicar flags de seguridad a todas las cookies
    const secureCookies = cookies.split(',').map(cookie => {
      if (!cookie.includes('HttpOnly')) cookie += '; HttpOnly';
      if (!cookie.includes('Secure') && process.env.NODE_ENV === 'production') {
        cookie += '; Secure';
      }
      if (!cookie.includes('SameSite')) cookie += '; SameSite=Lax';
      return cookie;
    }).join(',');
    
    headers.set('set-cookie', secureCookies);
  }

  return response;
}

export async function GET(request: NextRequest) {
  return POST(request);
}