export default function PlaceholdersPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test de Placeholders YAAN</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Placeholder principal */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Placeholder Principal</h2>
            <div className="aspect-[4/3] w-full">
              <img 
                src="/placeholder-image.svg"
                alt="Placeholder principal de YAAN"
                className="w-full h-full rounded-lg border border-gray-200"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">400x300px - Diseño con branding YAAN</p>
          </div>
          
          {/* Placeholder pequeño */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Placeholder Pequeño</h2>
            <div className="aspect-[4/3] w-full">
              <img 
                src="/placeholder-small.svg"
                alt="Placeholder pequeño de YAAN"
                className="w-full h-full rounded-lg border border-gray-200"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">200x150px - Versión compacta</p>
          </div>
          
          {/* Test de fallback */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test de Fallback</h2>
            <div className="aspect-[4/3] w-full">
              <img 
                src="/imagen-inexistente.jpg"
                alt="Test de imagen que no existe"
                className="w-full h-full rounded-lg border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.svg';
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">Imagen rota → Fallback automático</p>
          </div>
          
          {/* Estado de carga simulado */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Estado de Carga</h2>
            <div className="aspect-[4/3] w-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Cargando imagen...</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Animación de carga mejorada</p>
          </div>
        </div>
        
        {/* Información */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">✨ Características de los Placeholders</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Diseño con branding YAAN incluye montañas estilizadas y logo</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Gradientes elegantes en tonos púrpura coherentes con la marca</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Dos tamaños disponibles: principal (400x300) y compacto (200x150)</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>SVG escalable y optimizado para todos los dispositivos</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}