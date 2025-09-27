'use client';

import { useState, useEffect } from 'react';
import { useAmplifyAuth } from '@/hooks/useAmplifyAuth';
import { GraphQLAuthInspector } from '@/utils/graphql-auth-inspector';
import { useMarketplaceFeed } from '@/hooks/useAmplifyData';
import { toastManager } from '@/components/ui/Toast';

export default function GraphQLAuthTestPage() {
  const { isAuthenticated, userType } = useAmplifyAuth();
  const [authInspection, setAuthInspection] = useState<any>(null);
  const [appSyncConfig, setAppSyncConfig] = useState<any>(null);
  const marketplaceFeed = useMarketplaceFeed();

  useEffect(() => {
    // Verificar configuración de AppSync
    const config = GraphQLAuthInspector.verifyAppSyncConfiguration();
    setAppSyncConfig(config);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Inspeccionar autenticación cuando el usuario esté autenticado
      GraphQLAuthInspector.inspectAuthConfig().then(setAuthInspection);
    }
  }, [isAuthenticated]);

  const handleTestQuery = async () => {
    if (!isAuthenticated) {
      toastManager.error('🔐 Debes estar autenticado para probar queries GraphQL', {
        trackingContext: {
          feature: 'graphql_testing',
          error: 'unauthenticated_user',
          category: 'authentication_error'
        }
      });
      return;
    }
    
    try {
      // Refrescar datos del marketplace
      await marketplaceFeed.refetch();
      toastManager.success('✅ Query ejecutada exitosamente. Revisa la consola para detalles.', {
        trackingContext: {
          feature: 'graphql_testing',
          queryType: 'marketplace_feed',
          category: 'testing_success'
        }
      });
    } catch (error) {
      console.error('Error en query:', error);
      toastManager.error(`❌ Error en query: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        trackingContext: {
          feature: 'graphql_testing',
          error: error instanceof Error ? error.message : 'Unknown error',
          queryType: 'marketplace_feed',
          category: 'error_handling'
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test de Autenticación GraphQL
        </h1>

        {/* Estado de autenticación */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado de Autenticación</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium w-32">Autenticado:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isAuthenticated ? 'SÍ' : 'NO'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-32">Tipo de Usuario:</span>
              <span className="text-gray-700">{userType || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Configuración de AppSync */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuración de AppSync</h2>
          {appSyncConfig ? (
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="font-medium w-40">URL:</span>
                <span className="text-gray-700 break-all">{appSyncConfig.url}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-40">Región:</span>
                <span className="text-gray-700">{appSyncConfig.region}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-40">Tipo de Auth:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  appSyncConfig.defaultAuthType === 'AMAZON_COGNITO_USER_POOLS' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {appSyncConfig.defaultAuthType}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium w-40">Usa ID Token:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  appSyncConfig.usesIdToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {appSyncConfig.usesIdToken ? 'SÍ' : 'NO'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No se pudo cargar la configuración</p>
          )}
        </div>

        {/* Inspección de tokens */}
        {isAuthenticated && authInspection && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Inspección de Tokens</h2>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="font-medium w-32">ID Token:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  authInspection.hasIdToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {authInspection.hasIdToken ? 'PRESENTE' : 'AUSENTE'}
                </span>
              </div>
              
              {authInspection.claims && (
                <>
                  <div className="flex">
                    <span className="font-medium w-32">Sub:</span>
                    <span className="text-gray-700 font-mono text-xs">{authInspection.claims.sub?.substring(0, 20)}...</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-32">Email:</span>
                    <span className="text-gray-700">{authInspection.claims.email}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-32">User Type:</span>
                    <span className="text-gray-700">{authInspection.claims.userType || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-32">Token Use:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      authInspection.claims.tokenUse === 'id' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {authInspection.claims.tokenUse}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-32">Expira:</span>
                    <span className="text-gray-700">
                      {new Date((authInspection.idTokenExpiry || 0) * 1000).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Test de Query */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test de Query GraphQL</h2>
          <div className="space-y-4">
            <button
              onClick={handleTestQuery}
              disabled={!isAuthenticated || marketplaceFeed.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {marketplaceFeed.isLoading ? 'Cargando...' : 'Ejecutar Query Marketplace'}
            </button>
            
            <div className="text-sm">
              <div className="flex">
                <span className="font-medium w-32">Estado:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  marketplaceFeed.isSuccess ? 'bg-green-100 text-green-800' :
                  marketplaceFeed.isError ? 'bg-red-100 text-red-800' :
                  marketplaceFeed.isLoading ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {marketplaceFeed.isSuccess ? 'ÉXITO' :
                   marketplaceFeed.isError ? 'ERROR' :
                   marketplaceFeed.isLoading ? 'CARGANDO' : 'INACTIVO'}
                </span>
              </div>
              
              {marketplaceFeed.data && (
                <div className="flex mt-2">
                  <span className="font-medium w-32">Registros:</span>
                  <span className="text-gray-700">{marketplaceFeed.data.length}</span>
                </div>
              )}
              
              {marketplaceFeed.error && (
                <div className="mt-2">
                  <span className="font-medium">Error:</span>
                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-1">
                    <span className="text-red-700 text-xs">
                      {marketplaceFeed.error instanceof Error ? marketplaceFeed.error.message : 'Error desconocido'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Instrucciones</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>1. <strong>Inicia sesión</strong> si no lo has hecho</li>
            <li>2. <strong>Verifica</strong> que "Usa ID Token" esté en "SÍ"</li>
            <li>3. <strong>Confirma</strong> que el Token Use sea "id"</li>
            <li>4. <strong>Ejecuta</strong> el test de query</li>
            <li>5. <strong>Revisa</strong> la consola del navegador para logs detallados</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
