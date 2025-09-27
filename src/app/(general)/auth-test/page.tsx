'use client';

import Link from 'next/link';

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8 text-center">🧪 Test de Navegación Auth</h1>
        
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold mb-4">Enlaces de Prueba</h2>
            <div className="space-y-3">
              <Link 
                href="/auth?mode=signin"
                className="block w-full bg-blue-500 text-white p-3 rounded text-center hover:bg-blue-600"
              >
                → Ir a Iniciar Sesión
              </Link>
              
              <Link 
                href="/auth?mode=signup"
                className="block w-full bg-green-500 text-white p-3 rounded text-center hover:bg-green-600"
              >
                → Ir a Crear Cuenta (Comenzar)
              </Link>
              
              <Link 
                href="/auth"
                className="block w-full bg-gray-500 text-white p-3 rounded text-center hover:bg-gray-600"
              >
                → Ir a Auth (por defecto = signin)
              </Link>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold mb-4">Instrucciones de Prueba</h2>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Hacer clic en "Ir a Iniciar Sesión"</li>
              <li>En la página de auth, buscar el enlace "¿No tienes cuenta? Créala aquí"</li>
              <li>Hacer clic en ese enlace - debe cambiar a formulario de registro</li>
              <li>En el formulario de registro, buscar "¿Ya tienes cuenta? Inicia sesión"</li>
              <li>Hacer clic - debe volver al formulario de login</li>
            </ol>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold mb-4">¿Qué buscar en Console?</h2>
            <p className="text-sm text-gray-600">
              Abre DevTools {`>`} Console y busca mensajes como:
              <br />
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                🔄 Cambiando modo de auth: {`{ from: "signin", to: "signup" }`}
              </code>
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-500 underline"
          >
            ← Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
