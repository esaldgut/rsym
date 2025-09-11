import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import { HeroSection } from '@/components/ui/HeroSection';
import Link from 'next/link';

/**
 * Página de listado de productos del provider
 * Requiere provider completamente aprobado
 */
export default async function ProviderProductsPage() {
  // Validar que el provider esté completamente aprobado
  const auth = await RouteProtectionWrapper.protectProvider(true);

  return (
    <div className="min-h-screen">
      {/* Hero Section consistente */}
      <HeroSection
        title="Mis Productos Turísticos"
        subtitle="Gestiona tus circuitos y paquetes turísticos, y monitorea su rendimiento"
        size="md"
        showShapes={true}
      >
        <Link
          href="/provider/products/create"
          className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear Nuevo Producto
        </Link>
      </HeroSection>
      
      <div className="bg-gray-50 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button className="border-b-2 border-pink-500 text-pink-600 whitespace-nowrap py-4 px-1 text-sm font-medium">
                  Todos los productos
                </button>
                <button className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 text-sm font-medium">
                  Circuitos
                </button>
                <button className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 text-sm font-medium">
                  Paquetes
                </button>
                <button className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 text-sm font-medium">
                  Borradores
                </button>
                <button className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 text-sm font-medium">
                  Publicados
                </button>
              </nav>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-pink-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Publicados</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Borradores</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-violet-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Vistas totales</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

          {/* Empty state */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-6 text-2xl font-bold text-gray-900">No tienes productos aún</h3>
              <p className="mt-4 text-gray-600 max-w-lg mx-auto">
                Comienza creando tu primer circuito o paquete turístico y comparte tus experiencias únicas con viajeros de todo el mundo
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link
                  href="/provider/products/create"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear mi primer producto
                </Link>
              </div>
            </div>
          </div>
          </div>

          {/* Product grid would go here when there are products */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div> */}
        </div>
      </div>
    </div>
  );
}