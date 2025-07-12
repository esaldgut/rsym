'use client';

import { useState } from 'react';
import {
  useMarketplaceFeed,
  useActiveCircuits,
  useActivePackages,
  useActiveMoments,
  useCreateMoment,
  useToggleLike
} from '../../hooks/useAmplifyData';

type TabType = 'marketplace' | 'circuits' | 'packages' | 'moments';

export function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabType>('marketplace');

  // Queries optimizadas siguiendo patrones de aws-samples
  const { 
    data: marketplaceData = [], 
    isLoading: isLoadingMarketplace,
    error: marketplaceError,
    refetch: refetchMarketplace
  } = useMarketplaceFeed();

  const { 
    data: circuitsData = [], 
    isLoading: isLoadingCircuits,
    refetch: refetchCircuits
  } = useActiveCircuits();

  const { 
    data: packagesData = [], 
    isLoading: isLoadingPackages,
    refetch: refetchPackages
  } = useActivePackages();

  const { 
    data: momentsData = [], 
    isLoading: isLoadingMoments,
    refetch: refetchMoments
  } = useActiveMoments();

  // Mutations
  const createMomentMutation = useCreateMoment();
  const toggleLikeMutation = useToggleLike();

  const handleCreateMoment = () => {
    createMomentMutation.mutate({
      description: `Nuevo momento ${new Date().toLocaleString()}`,
      resourceType: 'text',
      preferences: ['aventura', 'naturaleza'],
      tags: ['viaje', 'experiencia']
    });
  };

  const handleToggleLike = (itemId: string, itemType: string) => {
    toggleLikeMutation.mutate({
      item_id: itemId,
      item_type: itemType
    });
  };

  const tabs = [
    { id: 'marketplace', label: 'Marketplace', count: marketplaceData !== null ? marketplaceData.length : 0 },
    { id: 'circuits', label: 'Circuitos', count: circuitsData !== null ? circuitsData.length : 0 },
    { id: 'packages', label: 'Paquetes', count: packagesData !== null ? packagesData.length : 0 },
    { id: 'moments', label: 'Momentos', count: momentsData !== null ? momentsData.length : 0 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'marketplace':
        if (isLoadingMarketplace) return <LoadingSpinner />;
        if (marketplaceError) return <ErrorMessage error={marketplaceError} onRetry={() => refetchMarketplace()} />;
        
        if (marketplaceData.length === 0) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay elementos en el marketplace</p>
              <p className="text-sm text-gray-400 mt-1">
                Los datos aparecerán aquí cuando estén disponibles en la API
              </p>
            </div>
          );
        }
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketplaceData.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {item.cover_image_url && (
                  <img 
                    src={item.cover_image_url} 
                    alt={item.name || 'Sin título'}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-600 font-bold">
                      ${item.price?.toFixed(2) || 'N/A'}
                    </span>
                    <span className="text-gray-500 text-sm">{item.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>@{item.username}</span>
                    {item.followerNumber && (
                      <span>{item.followerNumber} seguidores</span>
                    )}
                  </div>
                  {item.preferences && item.preferences.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.preferences.slice(0, 3).map((pref, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {pref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'circuits':
        if (isLoadingCircuits) return <LoadingSpinner />;
        
        if (circuitsData.length === 0) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay circuitos disponibles</p>
              <p className="text-sm text-gray-400 mt-1">
                Los circuitos aparecerán aquí cuando estén disponibles en la API
              </p>
            </div>
          );
        }
        
        return (
          <div className="space-y-4">
            {circuitsData.map((circuit) => (
              <div key={circuit.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{circuit.name}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{circuit.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {circuit.preferences?.slice(0, 5).map((pref, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {pref}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span>Inicio: {circuit.startDate ? new Date(circuit.startDate).toLocaleDateString('es-ES') : 'N/A'}</span>
                      <span className="ml-4">Fin: {circuit.endDate ? new Date(circuit.endDate).toLocaleDateString('es-ES') : 'N/A'}</span>
                    </div>
                  </div>
                  {circuit.cover_image_url && (
                    <img 
                      src={circuit.cover_image_url} 
                      alt={circuit.name || 'Circuit'}
                      className="w-24 h-24 object-cover rounded-lg ml-4"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'packages':
        if (isLoadingPackages) return <LoadingSpinner />;
        
        if (packagesData.length === 0) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay paquetes disponibles</p>
              <p className="text-sm text-gray-400 mt-1">
                Los paquetes aparecerán aquí cuando estén disponibles en la API
              </p>
            </div>
          );
        }
        
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {packagesData.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {pkg.cover_image_url && (
                  <img 
                    src={pkg.cover_image_url} 
                    alt={pkg.name || 'Package'}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pkg.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Noches:</span>
                      <span className="ml-1 font-medium">{pkg.numberOfNights || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Capacidad:</span>
                      <span className="ml-1 font-medium">{pkg.capacity || 'N/A'}</span>
                    </div>
                  </div>
                  {pkg.prices && pkg.prices.length > 0 && (
                    <div className="mb-3">
                      <span className="text-green-600 font-bold text-lg">
                        ${pkg.prices[0].price?.toFixed(2)} {pkg.prices[0].currency}
                      </span>
                    </div>
                  )}
                  {pkg.preferences && pkg.preferences.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pkg.preferences.slice(0, 4).map((pref, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {pref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'moments':
        if (isLoadingMoments) return <LoadingSpinner />;
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Momentos Activos</h3>
              <button
                onClick={handleCreateMoment}
                disabled={createMomentMutation.isPending}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
              >
                {createMomentMutation.isPending ? 'Creando...' : 'Crear Momento'}
              </button>
            </div>
            
            {momentsData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay momentos disponibles</p>
                <p className="text-sm text-gray-400 mt-1">
                  Crea tu primer momento usando el botón de arriba
                </p>
              </div>
            ) : (
              momentsData.map((moment) => (
                <div key={moment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    {moment.user_data?.profile_picture && (
                      <img 
                        src={moment.user_data.profile_picture} 
                        alt={moment.user_data.username || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold">
                          {moment.user_data?.username || 'Usuario'}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {moment.created_at ? new Date(moment.created_at).toLocaleDateString('es-ES') : ''}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-3">{moment.description}</p>
                      
                      {moment.tags && moment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {moment.tags.map((tag, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => moment.id && handleToggleLike(moment.id, 'moment')}
                          disabled={toggleLikeMutation.isPending}
                          className={`flex items-center space-x-1 transition-colors ${
                            moment.viewerHasLiked ? 'text-red-500' : 'text-gray-500'
                          } hover:text-red-500 disabled:opacity-50`}
                        >
                          <span>{moment.viewerHasLiked ? '❤️' : '🤍'}</span>
                          <span>{moment.likeCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>

      {/* Estados de mutations */}
      {createMomentMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">
            Error creando momento: {createMomentMutation.error?.message}
          </p>
        </div>
      )}
    </div>
  );
}

// Componentes helper optimizados
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

function ErrorMessage({ error, onRetry }: { error: any; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <h3 className="text-red-800 font-medium">Error cargando datos</h3>
      <p className="text-red-600 text-sm mt-1">
        {error instanceof Error ? error.message : 'Error de conexión con la API'}
      </p>
      <p className="text-red-600 text-xs mt-2">
        Verifica la configuración de AppSync y las credenciales de Cognito
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
