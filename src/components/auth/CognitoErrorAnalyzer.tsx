'use client';

import { useState, useEffect } from 'react';
import { decodeCognitoError, analyzeError, getCloudWatchUrl, generateDebugInfo, CognitoError } from '../../utils/cognito-error-decoder';

export function CognitoErrorAnalyzer() {
  const [errorUrl, setErrorUrl] = useState('');
  const [analysis, setAnalysis] = useState<CognitoError | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const analyzeErrorUrl = () => {
    if (!errorUrl) return;
    
    try {
      const result = decodeCognitoError(errorUrl);
      setAnalysis(result);
    } catch (e) {
      console.error('Error analyzing URL:', e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Auto-analizar si estamos en una página de error
  useEffect(() => {
    if (window.location.href.includes('auth.yaan.com.mx/error')) {
      setErrorUrl(window.location.href);
      const result = decodeCognitoError(window.location.href);
      setAnalysis(result);
    }
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-red-300 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold text-red-800 mb-3">🔍 Analizador de Errores Cognito</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL de Error de Cognito:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={errorUrl}
              onChange={(e) => setErrorUrl(e.target.value)}
              placeholder="https://auth.yaan.com.mx/error?..."
              className="flex-1 px-3 py-1 border border-gray-300 rounded text-xs"
            />
            <button
              onClick={analyzeErrorUrl}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              Analizar
            </button>
          </div>
        </div>

        {analysis && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h4 className="font-medium text-red-800 mb-2">Análisis del Error:</h4>
              <p className="text-sm text-red-700">{analyzeError(analysis)}</p>
            </div>

            <div className="space-y-2">
              {analysis.code && (
                <div>
                  <strong className="text-xs">Error Code:</strong>
                  <span className="ml-2 text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {analysis.code}
                  </span>
                </div>
              )}

              {analysis.error && (
                <div>
                  <strong className="text-xs">Error Type:</strong>
                  <span className="ml-2 text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {analysis.error}
                  </span>
                </div>
              )}

              {analysis.error_description && (
                <div>
                  <strong className="text-xs">Description:</strong>
                  <p className="text-xs mt-1 bg-gray-100 p-2 rounded">
                    {decodeURIComponent(analysis.error_description)}
                  </p>
                </div>
              )}

              {analysis.decodedState && (
                <div>
                  <strong className="text-xs">State Decodificado:</strong>
                  <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(analysis.decodedState, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
              >
                {showDebugInfo ? 'Ocultar' : 'Mostrar'} Info Debug
              </button>

              <a
                href={getCloudWatchUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
              >
                Ver CloudWatch Logs
              </a>

              <button
                onClick={() => copyToClipboard(JSON.stringify(analysis, null, 2))}
                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Copiar Análisis
              </button>
            </div>

            {showDebugInfo && (
              <div>
                <strong className="text-xs">Debug Info:</strong>
                <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                  {generateDebugInfo()}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-gray-200">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Acciones Rápidas:</h5>
          <div className="space-y-1">
            <button
              onClick={() => window.location.href = 'https://auth.yaan.com.mx/login?client_id=pi3jecnooc25adjrdrj5m80it&response_type=code&scope=email+openid+profile&redirect_uri=' + encodeURIComponent(window.location.origin + '/auth')}
              className="block w-full text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
            >
              Ir a Cognito Hosted UI
            </button>
            <button
              onClick={() => window.location.href = '/auth'}
              className="block w-full text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Volver a /auth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}