'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { HeroSection } from '@/components/ui/HeroSection';

interface MarketplaceGuardProps {
  children: React.ReactNode;
}

export default function MarketplaceGuard({ children }: MarketplaceGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <HeroSection
          title="Validando acceso..."
          subtitle="Verificando permisos para el marketplace"
          size="md"
          showShapes={true}
        />
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access denied states
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <HeroSection
          title="Acceso Restringido"
          subtitle="Necesitas iniciar sesión para acceder al marketplace"
          size="md"
          showShapes={true}
        />
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h3>
                <p className="text-gray-600 mb-6">Necesitas iniciar sesión para acceder al marketplace</p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/auth')}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Volver al Inicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Access granted - render children
  return <>{children}</>;
}