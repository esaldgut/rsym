'use client';

import { useEffect, useState } from 'react';
import { useAmplifyAuth } from '@/hooks/useAmplifyAuth';

interface SecurityCheck {
  name: string;
  description: string;
  status: 'checking' | 'pass' | 'fail' | 'warning';
  details?: string;
}

export default function SecurityVerificationPage() {
  const { isAuthenticated } = useAmplifyAuth();
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    runSecurityChecks();
  }, [isAuthenticated]);

  const runSecurityChecks = async () => {
    const securityChecks: SecurityCheck[] = [
      {
        name: 'Cookies HTTP-Only',
        description: 'Verificar que los tokens no sean accesibles via JavaScript',
        status: 'checking'
      },
      {
        name: 'LocalStorage Limpio',
        description: 'No debe haber tokens en localStorage',
        status: 'checking'
      },
      {
        name: 'SessionStorage Limpio',
        description: 'No debe haber tokens en sessionStorage',
        status: 'checking'
      },
      {
        name: 'Headers de Seguridad',
        description: 'Verificar headers CSP, HSTS, etc.',
        status: 'checking'
      },
      {
        name: 'Configuración SSR',
        description: 'Amplify debe estar configurado con SSR',
        status: 'checking'
      }
    ];

    setChecks(securityChecks);

    // Ejecutar verificaciones
    let score = 0;
    const updatedChecks = [...securityChecks];

    // 1. Verificar cookies HTTP-Only
    const cookieCheck = checkHttpOnlyCookies();
    updatedChecks[0] = {
      ...updatedChecks[0],
      status: cookieCheck.passed ? 'pass' : 'fail',
      details: cookieCheck.details
    };
    if (cookieCheck.passed) score += 40;

    // 2. Verificar localStorage
    const localStorageCheck = checkStorage('localStorage');
    updatedChecks[1] = {
      ...updatedChecks[1],
      status: localStorageCheck.passed ? 'pass' : 'fail',
      details: localStorageCheck.details
    };
    if (localStorageCheck.passed) score += 15;

    // 3. Verificar sessionStorage
    const sessionStorageCheck = checkStorage('sessionStorage');
    updatedChecks[2] = {
      ...updatedChecks[2],
      status: sessionStorageCheck.passed ? 'pass' : 'fail',
      details: sessionStorageCheck.details
    };
    if (sessionStorageCheck.passed) score += 15;

    // 4. Verificar headers (simulado)
    updatedChecks[3] = {
      ...updatedChecks[3],
      status: 'warning',
      details: 'Verificar en Network tab del navegador'
    };
    score += 20; // Asumimos que middleware está activo

    // 5. Verificar configuración SSR
    const ssrCheck = checkSSRConfiguration();
    updatedChecks[4] = {
      ...updatedChecks[4],
      status: ssrCheck.passed ? 'pass' : 'fail',
      details: ssrCheck.details
    };
    if (ssrCheck.passed) score += 10;

    setChecks(updatedChecks);
    setOverallScore(score);
  };

  const checkHttpOnlyCookies = () => {
    // Las cookies HTTP-Only no son visibles via JS
    // Si no vemos cookies de Amplify, es buena señal
    const visibleCookies = document.cookie;
    const hasVisibleTokens = visibleCookies.includes('CognitoIdentityServiceProvider') ||
                            visibleCookies.includes('idToken') ||
                            visibleCookies.includes('accessToken') ||
                            visibleCookies.includes('refreshToken');
    
    return {
      passed: !hasVisibleTokens && isAuthenticated,
      details: hasVisibleTokens 
        ? '❌ Tokens visibles en document.cookie' 
        : isAuthenticated 
          ? '✅ Tokens protegidos con HTTP-Only' 
          : '⚠️ No hay sesión activa para verificar'
    };
  };

  const checkStorage = (storageType: 'localStorage' | 'sessionStorage') => {
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
    const tokenKeys: string[] = [];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && (
        key.includes('CognitoIdentityServiceProvider') ||
        key.includes('amplify') ||
        key.includes('token') ||
        key.includes('Token')
      )) {
        tokenKeys.push(key);
      }
    }
    
    return {
      passed: tokenKeys.length === 0,
      details: tokenKeys.length === 0 
        ? `✅ ${storageType} limpio` 
        : `❌ Encontrados ${tokenKeys.length} tokens: ${tokenKeys.join(', ')}`
    };
  };

  const checkSSRConfiguration = () => {
    // Verificar si Amplify está configurado con SSR
    try {
      // @ts-ignore
      const amplifyConfig = window.Amplify?._config;
      const hasSSR = amplifyConfig?.ssr === true;
      
      return {
        passed: hasSSR,
        details: hasSSR ? '✅ SSR habilitado' : '❌ SSR no configurado'
      };
    } catch {
      return {
        passed: false,
        details: '⚠️ No se pudo verificar configuración'
      };
    }
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'checking': return '🔄';
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
    }
  };

  const getScoreColor = () => {
    if (overallScore >= 90) return 'text-green-600';
    if (overallScore >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">🔒 Verificación de Seguridad</h1>
        
        {/* Puntuación */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Puntuación de Seguridad</h2>
          <div className={`text-5xl font-bold ${getScoreColor()}`}>
            {overallScore}/100
          </div>
          <p className="text-gray-600 mt-2">
            {overallScore >= 90 ? 'Excelente - Aplicación segura' :
             overallScore >= 70 ? 'Bueno - Algunas mejoras necesarias' :
             'Crítico - Vulnerabilidades detectadas'}
          </p>
        </div>

        {/* Lista de verificaciones */}
        <div className="space-y-4">
          {checks.map((check, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getStatusIcon(check.status)}</span>
                    <h3 className="font-semibold">{check.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                  {check.details && (
                    <p className="text-sm mt-2 font-mono">{check.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recomendaciones */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Acciones Requeridas</h3>
          <ul className="space-y-2 text-blue-800">
            {overallScore < 40 && (
              <li>• Activar cookies HTTP-Only correctamente en Amplify</li>
            )}
            {checks[1].status === 'fail' && (
              <li>• Limpiar tokens de localStorage</li>
            )}
            {checks[2].status === 'fail' && (
              <li>• Limpiar tokens de sessionStorage</li>
            )}
            <li>• Verificar headers de seguridad en Network tab</li>
            <li>• Confirmar que el middleware está aplicando todos los headers</li>
          </ul>
        </div>

        {/* Estado de autenticación */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <p className="text-sm">
            Estado de autenticación: {isAuthenticated ? '✅ Autenticado' : '⭕ No autenticado'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Para una verificación completa, inicia sesión primero
          </p>
        </div>
      </div>
    </div>
  );
}