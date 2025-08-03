'use client';

import { redirectToOAuthProvider, getCognitoHostedUIUrl } from '../../utils/oauth-helpers';

export function DirectOAuthButtons() {
  const providers = [
    { name: 'Apple' as const, color: 'bg-black hover:bg-gray-800 text-white' },
    { name: 'Google' as const, color: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300' },
    { name: 'Facebook' as const, color: 'bg-blue-600 hover:bg-blue-700 text-white' }
  ];

  return (
    <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700">Autenticación OAuth Directa (Testing)</h3>
      
      <div className="space-y-2">
        {providers.map((provider) => (
          <button
            key={provider.name}
            onClick={() => redirectToOAuthProvider(provider.name)}
            className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${provider.color}`}
          >
            OAuth directo con {provider.name}
          </button>
        ))}
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => window.location.href = getCognitoHostedUIUrl()}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
        >
          Ir a Cognito Hosted UI
        </button>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Estas opciones usan URLs OAuth directas sin Amplify SDK</p>
        <p>• Útil para debugging cuando hay problemas de configuración</p>
        <p>• Usa el flujo: App → Cognito → Proveedor → Cognito → App</p>
        <p>• Cognito maneja automáticamente el redirect final a tu app</p>
      </div>
    </div>
  );
}