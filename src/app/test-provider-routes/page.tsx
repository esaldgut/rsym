import Link from 'next/link';

/**
 * Test page para verificar las rutas de provider con Route Groups
 * Permite probar que las rutas funcionan correctamente después de la reorganización
 */
export default function TestProviderRoutes() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Test de Rutas Provider con Route Groups
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estructura de Route Groups:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm">
{`src/app/provider/
├── (protected)/           # Requiere aprobación completa
│   ├── layout.tsx        # Aplica protección
│   ├── page.tsx          # Dashboard
│   └── products/         # Gestión de productos
└── (public)/             # Accesible sin aprobación
    └── pending-approval/ # Estado pendiente`}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Enlaces de Prueba:</h2>

          <div className="space-y-4">
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Rutas Públicas (sin aprobación):</h3>
              <Link
                href="/provider/pending-approval"
                className="inline-block bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
              >
                /provider/pending-approval
              </Link>
              <p className="text-sm text-gray-600 mt-2">
                Debería mostrar el estado de aprobación sin redirección infinita
              </p>
            </div>

            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Rutas Protegidas (requieren aprobación):</h3>
              <div className="space-x-2">
                <Link
                  href="/provider"
                  className="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                  /provider
                </Link>
                <Link
                  href="/provider/products"
                  className="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                  /provider/products
                </Link>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Si no estás aprobado, deberían redirigir a /provider/pending-approval
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Notas importantes:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Los Route Groups (protected) y (public) NO aparecen en las URLs</li>
            <li>• El layout.tsx en (protected) aplica protección a todas sus rutas anidadas</li>
            <li>• El pending-approval está en (public) para evitar el loop de redirección</li>
            <li>• UnifiedAuthSystem maneja las redirecciones automáticamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}