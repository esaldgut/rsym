'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { useRequireCompleteProfile } from '../../components/guards/ProfileCompletionGuard';
import { useAmplifyAuth } from '../../hooks/useAmplifyAuth';
import { ProfileImage } from '../../components/ui/ProfileImage';
import { HeroSection } from '../../components/ui/HeroSection';
import { uploadData } from 'aws-amplify/storage';
import { executeQuery, executeMutation } from '@/lib/graphql/client';
import { getAllActiveMoments, createMoment, toggleLike } from '@/lib/graphql/operations';
import type { Moment, CreateMomentInput } from '@/lib/graphql/types';

interface MomentFormData {
  description: string;
  selectedImage: File | null;
  tags: string[];
  preferences: string[];
}

export default function MomentsPage() {
  const { user } = useAmplifyAuth();
  const { checkProfile, isComplete, isLoading: profileLoading } = useRequireCompleteProfile();
  
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<MomentFormData>({
    description: '',
    selectedImage: null,
    tags: [],
    preferences: []
  });

  // Cargar momentos al iniciar
  useEffect(() => {
    const loadMoments = async () => {
      setIsLoading(true);
      try {
        const result = await executeQuery(getAllActiveMoments);
        if (result?.getAllActiveMoments) {
          setMoments(result.getAllActiveMoments);
        }
      } catch (error) {
        console.error('Error cargando momentos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoments();
  }, []);

  // Subir imagen a S3
  const uploadMomentImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `moments/${user.userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      
      const result = await uploadData({
        path: fileName,
        data: file,
        options: {
          accessLevel: 'protected',
          contentType: file.type
        }
      }).result;

      return result.path;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      return null;
    }
  };

  // Crear momento
  const handleCreateMoment = async () => {
    if (!formData.description.trim()) return;

    checkProfile('create_moment', { action: 'create_moment' }, async () => {
      setIsCreating(true);
      try {
        let imageUrl: string | null = null;

        // Subir imagen si hay una seleccionada
        if (formData.selectedImage) {
          imageUrl = await uploadMomentImage(formData.selectedImage);
        }

        const input: CreateMomentInput = {
          description: formData.description,
          resourceType: formData.selectedImage ? 'image' : 'text',
          resourceUrl: imageUrl ? [imageUrl] : undefined,
          tags: formData.tags,
          preferences: formData.preferences
        };

        const result = await executeMutation(createMoment, { input });
        
        if (result?.createMoment) {
          // Agregar el nuevo momento al inicio de la lista
          setMoments(prev => [result.createMoment, ...prev]);
          
          // Limpiar formulario
          setFormData({
            description: '',
            selectedImage: null,
            tags: [],
            preferences: []
          });
        }
      } catch (error) {
        console.error('Error creando momento:', error);
      } finally {
        setIsCreating(false);
      }
    });
  };

  // Manejar like
  const handleLike = async (momentId: string) => {
    checkProfile('like_moment', { momentId }, async () => {
      try {
        const result = await executeMutation(toggleLike, {
          item_id: momentId,
          item_type: 'Moment'
        });

        if (result?.toggleLike) {
          // Actualizar el momento en la lista
          setMoments(prev => prev.map(moment => 
            moment.id === momentId 
              ? { 
                  ...moment, 
                  likeCount: result.toggleLike.newLikeCount,
                  viewerHasLiked: result.toggleLike.viewerHasLiked
                }
              : moment
          ));
        }
      } catch (error) {
        console.error('Error al dar like:', error);
      }
    });
  };

  // Manejar envío de mensaje (placeholder)
  const handleSendMessage = (userId: string) => {
    checkProfile('send_message', { userId }, () => {
      console.log('Enviando mensaje a:', userId);
      // TODO: Implementar sistema de mensajería
    });
  };

  // Agregar a red (placeholder)
  const handleRequestNetwork = (userId: string) => {
    checkProfile('request_network', { userId }, () => {
      console.log('Solicitando incluir en red a:', userId);
      // TODO: Implementar sistema de red social
    });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen">
        {/* Hero Section consistente con el branding */}
        <HeroSection
          title="Momentos"
          subtitle="Comparte tus experiencias de viaje y conecta con otros aventureros"
          size="sm"
          showShapes={true}
        />
        
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Create Moment Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Comparte un momento
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen
                </label>
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border border-gray-300 transition-colors duration-200">
                    <span className="text-gray-700">Seleccionar imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData(prev => ({ ...prev, selectedImage: file }));
                        }
                      }}
                      className="hidden"
                      disabled={isCreating}
                    />
                  </label>
                  {formData.selectedImage && (
                    <span className="text-sm text-gray-600">
                      {formData.selectedImage.name}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={4}
                  placeholder="Cuéntanos sobre este momento..."
                  disabled={isCreating}
                />
              </div>

              <button
                onClick={handleCreateMoment}
                disabled={profileLoading || isCreating || !formData.description.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isCreating ? 'Creando momento...' : 'Crear Momento'}
              </button>
            </div>
          </div>

          {/* Moments Feed */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {moments.map((moment) => (
                <div key={moment.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <ProfileImage
                        path={moment.user_data?.avatar_url}
                        alt={moment.user_data?.name || 'Usuario'}
                        fallbackText={moment.user_data?.username?.substring(0, 2).toUpperCase() || 'U'}
                        size="lg"
                      />
                      <div className="ml-4">
                        <h3 className="font-semibold text-gray-900">
                          {moment.user_data?.name || moment.user_data?.username}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {moment.created_at && new Date(moment.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Contenido del momento */}
                    {moment.description && (
                      <p className="text-gray-800 mb-4">{moment.description}</p>
                    )}

                    {/* Imagen del momento si existe */}
                    {moment.resourceUrl && moment.resourceUrl[0] && (
                      <div className="mb-4">
                        <ProfileImage
                          path={moment.resourceUrl[0]}
                          alt="Imagen del momento"
                          fallbackText=""
                          size="lg"
                          className="w-full h-64 rounded-xl object-cover"
                        />
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => moment.id && handleLike(moment.id)}
                        className={`flex items-center space-x-2 transition-colors duration-200 ${
                          moment.viewerHasLiked ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'
                        }`}
                      >
                        <svg className={`w-5 h-5 ${moment.viewerHasLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{moment.likeCount || 0}</span>
                      </button>
                      
                      <button
                        onClick={() => moment.user_data?.sub && handleSendMessage(moment.user_data.sub)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Mensaje</span>
                      </button>
                      
                      <button
                        onClick={() => moment.user_data?.sub && handleRequestNetwork(moment.user_data.sub)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <span>Agregar a red</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {moments.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay momentos aún</h3>
                  <p className="text-gray-500">Sé el primero en compartir un momento increíble</p>
                </div>
              )}
            </div>
          )}

          {/* Profile Complete Status */}
          {!profileLoading && (
            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                <strong>Estado del perfil:</strong>{' '}
                {isComplete ? (
                  <span className="text-green-600">✓ Completo</span>
                ) : (
                  <span className="text-orange-600">⚠ Incompleto</span>
                )}
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
