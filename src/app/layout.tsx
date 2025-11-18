import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'maplibre-gl/dist/maplibre-gl.css';
// CRÍTICO: Import obligatorio para OAuth en Next.js según docs oficiales Amplify v6
import 'aws-amplify/auth/enable-oauth-listener';
import { ConfigureAmplifyClientSide } from './amplify-client-config';
import { QueryProvider } from '../components/providers/QueryProvider';
import { NavbarImproved } from '@/components';
import { MainContentWrapper } from '@/components/layout/MainContentWrapper';
import { OAuthHandler } from '../components/auth/OAuthHandler';
import { ToastContainer } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';
import type { InitialAuthData, AmplifyAuthUser } from '@/hooks/useAmplifyAuth';
import { SmartAppBanner } from '@/components/ui/SmartAppBanner';

// IMPORTANTE: Forzar dynamic rendering para toda la aplicación
// Next.js 16 intenta static rendering por defecto, pero esta app usa cookies()
// para autenticación en múltiples rutas, requiriendo dynamic rendering
export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YAAN",
  description: "YAAN Web Application",
};

/**
 * Root Layout - Async Server Component
 * Obtiene sesión inicial para hidratación sin flash de contenido
 * Patrón: SSR + Client Components con interleaving pattern
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Obtener sesión inicial desde servidor (SSR)
  // Este código SOLO se ejecuta en el servidor
  let initialAuth: InitialAuthData | undefined;

  try {
    const validation = await UnifiedAuthSystem.getValidatedSession();

    if (validation.isAuthenticated && validation.user) {
      // Construir AmplifyAuthUser desde la validación del servidor
      const amplifyUser: AmplifyAuthUser = {
        userId: validation.user.id,
        username: validation.user.username,
        email: validation.user.email,
        userType: validation.user.userType,
        signInDetails: {}, // No disponible en server-side
        securityValidation: {
          isValid: true,
          userType: validation.user.userType,
          userId: validation.user.id,
          errors: [],
          warnings: []
        }
      };

      initialAuth = {
        user: amplifyUser,
        isAuthenticated: true
      };
    }
  } catch (error) {
    // Usuario no autenticado o error - initialAuth quedará undefined
    // El cliente manejará el estado no autenticado
    console.log('[Server] Layout SSR: Usuario no autenticado o error en validación');
    console.error('[Server] Error detalle:', error instanceof Error ? error.message : 'Error desconocido');
  }

  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}>
        <ConfigureAmplifyClientSide />
        <OAuthHandler />
        <AuthProvider initialAuth={initialAuth}>
          <QueryProvider>
            <NavbarImproved initialUserType={initialAuth?.user.userType} />
            <MainContentWrapper>
              {children}
            </MainContentWrapper>
            <ToastContainer />
            <SmartAppBanner
              showOnPaths={['/marketplace', '/moments', '/provider']}
              hideOnPaths={['/auth', '/admin']}
            />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
