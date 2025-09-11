'use client';

import { useState } from 'react';
import { useAmplifyAuth } from '@/hooks/useAmplifyAuth';
import Link from 'next/link';

export default function RouteProtectionTestPage() {
  const { isAuthenticated, user, userType } = useAmplifyAuth();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    result: string;
    status: 'success' | 'fail' | 'info';
  }>>([]);

  const runProtectionTests = async () => {
    const results = [];
    
    // Test 1: Acceso directo a dashboard
    try {
      const response = await fetch('/dashboard', { method: 'HEAD' });
      results.push({
        test: 'Acceso directo a /dashboard',
        result: `HTTP ${response.status} - ${response.status === 307 ? 'Redirigido correctamente' : 'Posible problema'}`,
        status: response.status === 307 ? 'success' : 'fail'
      });
    } catch (error) {
      results.push({
        test: 'Acceso directo a /dashboard',
        result: 'Error de conexión',
        status: 'fail'
      });
    }

    // Test 2: Headers de protección
    try {
      const response = await fetch('/dashboard', { method: 'HEAD' });
      const protectedHeader = response.headers.get('X-Protected-Route');
      results.push({
        test: 'Header X-Protected-Route',
        result: protectedHeader ? `Presente: ${protectedHeader}` : 'Ausente',
        status: protectedHeader ? 'success' : 'fail'
      });
    } catch (error) {
      results.push({
        test: 'Header X-Protected-Route',
        result: 'No se pudo verificar',
        status: 'fail'
      });
    }

    // Test 3: Estado de autenticación
    results.push({
      test: 'Estado de autenticación actual',
      result: isAuthenticated ? `Autenticado como ${user?.username}` : 'No autenticado',
      status: 'info'
    });

    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🛡️ Test de Protección de Rutas
        </h1>

        {/* Estado actual */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado Actual</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Autenticado:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isAuthenticated ? 'SÍ' : 'NO'}
              </span>
            </div>
            <div>
              <span className="font-medium">Usuario:</span>
              <span className="ml-2 text-gray-700">{user?.username || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium">Tipo:</span>
              <span className="ml-2 text-gray-700">{userType || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Botones de prueba */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Pruebas de Protección</h2>
          <div className="space-y-4">
            <button
              onClick={runProtectionTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ejecutar Tests de Protección
            </button>
            
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-block"
              >
                Intentar acceder al Dashboard
              </Link>
              
              <Link
                href="/auth"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-block"
              >
                Ir a Login
              </Link>
            </div>
          </div>
        </div>

        {/* Resultados de tests */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Resultados de Tests</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{result.test}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.status === 'success' ? 'bg-green-100 text-green-800' :
                      result.status === 'fail' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {result.status === 'success' ? '✅' :
                       result.status === 'fail' ? '❌' : 'ℹ️'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.result}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explicación de la protección */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🔒 Capas de Protección Implementadas</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">1</span>
              <span><strong>Servidor (SSR):</strong> Layout protegido verifica autenticación antes de renderizar</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">2</span>
              <span><strong>Cliente (AuthGuard):</strong> Componente verifica autenticación y redirige si es necesario</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">3</span>
              <span><strong>Middleware:</strong> Headers de seguridad y logs para rutas protegidas</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">4</span>
              <span><strong>Cookies HTTP-Only:</strong> Tokens no accesibles vía JavaScript</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}