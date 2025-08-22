'use client';

import { useState, useEffect } from 'react';
import { SecurityAudit } from '@/utils/security-audit';
import { useAmplifyAuth } from '@/hooks/useAmplifyAuth';

interface AuditResult {
  cookieAudit: any;
  headerAudit: any;
  xssAudit: any;
  totalScore: number;
  maxScore: number;
  securityGrade: string;
  isSecure: boolean;
}

export default function SecurityAuditPage() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { isAuthenticated } = useAmplifyAuth();

  const runFullAudit = async () => {
    setIsRunning(true);
    try {
      const result = await SecurityAudit.performFullAudit();
      setAuditResult(result as AuditResult);
    } catch (error) {
      console.error('Error en auditoría:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Ejecutar auditoría automáticamente al cargar
    runFullAudit();
  }, []);

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-green-800 bg-green-200';
      case 'A': return 'text-green-700 bg-green-100';
      case 'B': return 'text-blue-700 bg-blue-100';
      case 'C': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-red-700 bg-red-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔒 Auditoría de Seguridad YAAN
        </h1>

        {/* Puntuación general */}
        {auditResult && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Puntuación de Seguridad</h2>
              <button
                onClick={runFullAudit}
                disabled={isRunning}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700"
              >
                {isRunning ? 'Ejecutando...' : 'Ejecutar Auditoría'}
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`text-4xl font-bold px-4 py-2 rounded-lg ${getScoreColor(auditResult.totalScore, auditResult.maxScore)}`}>
                {auditResult.totalScore}/{auditResult.maxScore}
              </div>
              <div className={`text-2xl font-bold px-3 py-1 rounded ${getGradeColor(auditResult.securityGrade)}`}>
                {auditResult.securityGrade}
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                auditResult.isSecure ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {auditResult.isSecure ? '✅ SEGURO' : '❌ VULNERABLE'}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Auditoría de Cookies */}
          {auditResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                🍪 Cookies HTTP-Only
                {auditResult.cookieAudit.usingHttpOnlyCookies ? (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">ACTIVO</span>
                ) : (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">INACTIVO</span>
                )}
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Configuración SSR:</span>
                  <span className={auditResult.cookieAudit.hasAmplifyConfig ? 'text-green-600' : 'text-red-600'}>
                    {auditResult.cookieAudit.hasAmplifyConfig ? '✅' : '❌'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Usando HTTP-Only:</span>
                  <span className={auditResult.cookieAudit.usingHttpOnlyCookies ? 'text-green-600' : 'text-red-600'}>
                    {auditResult.cookieAudit.usingHttpOnlyCookies ? '✅' : '❌'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tokens en localStorage:</span>
                  <span className={auditResult.cookieAudit.localStorageTokens.length === 0 ? 'text-green-600' : 'text-red-600'}>
                    {auditResult.cookieAudit.localStorageTokens.length === 0 ? '✅ Ninguno' : `❌ ${auditResult.cookieAudit.localStorageTokens.length}`}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tokens en sessionStorage:</span>
                  <span className={auditResult.cookieAudit.sessionStorageTokens.length === 0 ? 'text-green-600' : 'text-red-600'}>
                    {auditResult.cookieAudit.sessionStorageTokens.length === 0 ? '✅ Ninguno' : `❌ ${auditResult.cookieAudit.sessionStorageTokens.length}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Headers de Seguridad */}
          {auditResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                🛡️ Headers de Seguridad
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {auditResult.headerAudit.securityScore}/70
                </span>
              </h3>
              
              <div className="space-y-2 text-sm">
                {Object.entries(auditResult.headerAudit.headers).map(([header, value]) => (
                  <div key={header} className="flex justify-between items-center">
                    <span className="font-mono text-xs">{header}:</span>
                    <span className="text-green-600">✅</span>
                  </div>
                ))}
                
                {auditResult.headerAudit.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-center text-yellow-600">
                    <span className="mr-2">⚠️</span>
                    <span className="text-xs">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pruebas XSS */}
          {auditResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                🎭 Pruebas XSS
                {!auditResult.xssAudit.isVulnerable ? (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">PROTEGIDO</span>
                ) : (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">VULNERABLE</span>
                )}
              </h3>
              
              <div className="space-y-3">
                {auditResult.xssAudit.tests.map((test: any, index: number) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{test.name}</span>
                      <span className={test.passed ? 'text-green-600' : 'text-red-600'}>
                        {test.passed ? '✅' : '❌'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{test.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado de autenticación */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">👤 Estado de Autenticación</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Usuario autenticado:</span>
                <span className={isAuthenticated ? 'text-green-600' : 'text-gray-600'}>
                  {isAuthenticated ? '✅ SÍ' : '⭕ NO'}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 mt-4">
                <p>💡 <strong>Recomendación:</strong> Inicia sesión para probar la seguridad completa de los tokens.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Recomendaciones de Seguridad</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• <strong>Cookies HTTP-Only:</strong> {auditResult?.cookieAudit.usingHttpOnlyCookies ? 'Correctamente implementadas ✅' : 'Activar cookies HTTP-Only para máxima seguridad'}</li>
            <li>• <strong>HTTPS:</strong> Usar siempre HTTPS en producción</li>
            <li>• <strong>CSP:</strong> Implementar Content Security Policy</li>
            <li>• <strong>SameSite:</strong> Configurar cookies con SameSite=Lax o Strict</li>
            <li>• <strong>Tokens:</strong> Nunca exponer tokens en logs o console</li>
          </ul>
        </div>

        {/* Instrucciones */}
        <div className="mt-6 bg-gray-50 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">🔍 Cómo usar esta auditoría</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>1. <strong>Ejecuta la auditoría</strong> con el botón "Ejecutar Auditoría"</li>
            <li>2. <strong>Revisa la puntuación</strong> - debe ser A o A+ para máxima seguridad</li>
            <li>3. <strong>Verifica cookies HTTP-Only</strong> - deben estar activas</li>
            <li>4. <strong>Confirma que no hay tokens</strong> en localStorage/sessionStorage</li>
            <li>5. <strong>Revisa la consola</strong> del navegador para logs detallados</li>
          </ol>
        </div>
      </div>
    </div>
  );
}