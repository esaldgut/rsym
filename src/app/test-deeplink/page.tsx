'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  isMobileDevice,
  isIOS,
  isAndroid,
  generateDeepLink,
  attemptDeepLink,
  generateShareableUrls,
  getDeepLinkContext,
  isFromMobileApp
} from '@/utils/deep-link-utils';

/**
 * Página de prueba para Deep Linking
 *
 * Esta página permite probar:
 * 1. Generación de URLs de deep linking
 * 2. Detección de dispositivo móvil
 * 3. Apertura de la app con deep links
 * 4. Query parameters para modales
 */
export default function TestDeepLinkPage() {
  const searchParams = useSearchParams();
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isFromApp: false
  });

  const [deepLinkContext, setDeepLinkContext] = useState<ReturnType<typeof getDeepLinkContext>>({
    isDeepLink: false
  });

  useEffect(() => {
    // Obtener información del dispositivo
    setDeviceInfo({
      isMobile: isMobileDevice(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      isFromApp: isFromMobileApp()
    });

    // Obtener contexto de deep linking
    setDeepLinkContext(getDeepLinkContext());
  }, []);

  // Casos de prueba
  const testCases = [
    {
      title: 'Marketplace Home',
      path: '/marketplace',
      params: {}
    },
    {
      title: 'Producto Específico (Modal)',
      path: '/marketplace',
      params: { product: 'test-product-123', type: 'circuit' }
    },
    {
      title: 'Momento Específico',
      path: '/moments',
      params: { moment: 'moment-456' }
    },
    {
      title: 'Perfil de Proveedor',
      path: '/provider/profile',
      params: {}
    },
    {
      title: 'Reserva con Parámetros',
      path: '/booking',
      params: { product: 'abc123', adults: '2', kids: '1' }
    }
  ];

  const handleTestDeepLink = (path: string, params: Record<string, string>) => {
    const deepLink = generateDeepLink(path, params);

    if (deviceInfo.isMobile) {
      attemptDeepLink(deepLink);
    } else {
      // En desktop, mostrar el deep link que se generaría
      const message = `Deep Link generado (requiere dispositivo móvil):\n${deepLink}`;
      alert(message);
    }
  };

  const handleCopyShareableUrls = (path: string, params: Record<string, string>) => {
    const urls = generateShareableUrls(path, params);
    const text = `Web URL: ${urls.webUrl}\nDeep Link: ${urls.deepLink}\nUniversal Link: ${urls.universalLink}`;

    navigator.clipboard.writeText(text).then(() => {
      alert('URLs copiadas al portapapeles');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test de Deep Linking
        </h1>

        {/* Información del Dispositivo */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Información del Dispositivo</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <dt className="font-medium text-gray-600">Dispositivo móvil:</dt>
            <dd className={deviceInfo.isMobile ? 'text-green-600' : 'text-red-600'}>
              {deviceInfo.isMobile ? '✅ Sí' : '❌ No'}
            </dd>

            <dt className="font-medium text-gray-600">iOS:</dt>
            <dd className={deviceInfo.isIOS ? 'text-green-600' : 'text-gray-400'}>
              {deviceInfo.isIOS ? '✅ Sí' : '—'}
            </dd>

            <dt className="font-medium text-gray-600">Android:</dt>
            <dd className={deviceInfo.isAndroid ? 'text-green-600' : 'text-gray-400'}>
              {deviceInfo.isAndroid ? '✅ Sí' : '—'}
            </dd>

            <dt className="font-medium text-gray-600">Desde la app:</dt>
            <dd className={deviceInfo.isFromApp ? 'text-green-600' : 'text-gray-400'}>
              {deviceInfo.isFromApp ? '✅ Sí' : '❌ No'}
            </dd>
          </dl>
        </div>

        {/* Contexto de Deep Linking */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Contexto de Deep Linking</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <dt className="font-medium text-gray-600">Es Deep Link:</dt>
            <dd className={deepLinkContext.isDeepLink ? 'text-green-600' : 'text-gray-400'}>
              {deepLinkContext.isDeepLink ? '✅ Sí' : '❌ No'}
            </dd>

            <dt className="font-medium text-gray-600">Fuente:</dt>
            <dd>{deepLinkContext.source || '—'}</dd>

            <dt className="font-medium text-gray-600">Campaña:</dt>
            <dd>{deepLinkContext.campaign || '—'}</dd>

            <dt className="font-medium text-gray-600">Referrer:</dt>
            <dd>{deepLinkContext.referrer || '—'}</dd>
          </dl>
        </div>

        {/* Query Parameters Actuales */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Query Parameters Actuales</h2>
          {searchParams.toString() ? (
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {Array.from(searchParams.entries()).map(([key, value]) => (
                <div key={key}>
                  <span className="text-purple-600">{key}</span>: {value}
                </div>
              ))}
            </pre>
          ) : (
            <p className="text-gray-500">No hay query parameters</p>
          )}
        </div>

        {/* Casos de Prueba */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Casos de Prueba</h2>
          <div className="space-y-4">
            {testCases.map((testCase, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">{testCase.title}</h3>

                <div className="text-sm text-gray-600 mb-3">
                  <div>Path: <code className="bg-gray-100 px-1">{testCase.path}</code></div>
                  {Object.keys(testCase.params).length > 0 && (
                    <div>
                      Params: <code className="bg-gray-100 px-1">
                        {JSON.stringify(testCase.params)}
                      </code>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleTestDeepLink(testCase.path, testCase.params)}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700"
                  >
                    {deviceInfo.isMobile ? 'Abrir en App' : 'Ver Deep Link'}
                  </button>

                  <button
                    onClick={() => handleCopyShareableUrls(testCase.path, testCase.params)}
                    className="bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700"
                  >
                    Copiar URLs
                  </button>

                  <a
                    href={`/marketplace${testCase.params.product ? `?product=${testCase.params.product}` : ''}`}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 inline-block"
                  >
                    Navegar (Web)
                  </a>
                </div>

                {/* Mostrar URLs generadas */}
                <div className="mt-3 text-xs text-gray-500">
                  {(() => {
                    const urls = generateShareableUrls(testCase.path, testCase.params);
                    return (
                      <details>
                        <summary className="cursor-pointer hover:text-gray-700">
                          Ver URLs generadas
                        </summary>
                        <div className="mt-2 space-y-1 font-mono">
                          <div>
                            <strong>Web:</strong>
                            <div className="break-all">{urls.webUrl}</div>
                          </div>
                          <div>
                            <strong>Deep:</strong>
                            <div className="break-all">{urls.deepLink}</div>
                          </div>
                        </div>
                      </details>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enlaces de Verificación */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Enlaces de Verificación</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Android (assetlinks.json):</strong>
              <a
                href="/.well-known/assetlinks.json"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-2"
              >
                /.well-known/assetlinks.json
              </a>
            </div>
            <div>
              <strong>iOS (apple-app-site-association):</strong>
              <a
                href="/.well-known/apple-app-site-association"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-2"
              >
                /.well-known/apple-app-site-association
              </a>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <p className="text-sm text-gray-700">
              <strong>Nota:</strong> Para que los deep links funcionen completamente:
            </p>
            <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
              <li>Los archivos .well-known deben ser servidos con HTTPS</li>
              <li>El SHA256 fingerprint debe coincidir con el certificado de la app</li>
              <li>El Team ID y Bundle ID deben ser correctos para iOS</li>
              <li>La app móvil debe estar instalada en el dispositivo</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}