'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { useAmplifyAuth } from '../../hooks/useAmplifyAuth';
import { useProfileCompletion } from '../../hooks/useProfileCompletion';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { ProfileImage } from '../../components/ui/ProfileImage';

// Tipos para los datos del perfil
interface ProfileData {
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  profilePhotoPath?: string; // Path en S3, no URL
  preferredUsername?: string;
  details?: string;
  website?: string;
  userType?: 'traveler' | 'influencer' | 'provider';
  stats: {
    posts: number;
    followers: number;
    following: number;
    likes: number;
  };
}

// Componente para las estadísticas
function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold text-gray-900">{value.toLocaleString()}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAmplifyAuth();
  const { isComplete: isProfileComplete, missingFields } = useProfileCompletion();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      try {
        const attributes = await fetchUserAttributes();
        
        // Construir los datos del perfil desde los atributos de Cognito
        const profilePhotoPath = attributes['custom:profilePhotoPath'];
        
        setProfileData({
          username: user.username || '',
          email: attributes.email || '',
          givenName: attributes.given_name || '',
          familyName: attributes.family_name || '',
          profilePhotoPath: profilePhotoPath || undefined, // Guardamos el path, no la URL
          preferredUsername: attributes.preferred_username || user.username,
          details: attributes['custom:details'] || undefined,
          website: attributes.website || undefined,
          userType: (attributes['custom:user_type'] as 'traveler' | 'influencer' | 'provider') || 'traveler',
          stats: {
            posts: 0, // Por ahora hardcodeado, después se conectará con GraphQL
            followers: 0,
            following: 0,
            likes: 0
          }
        });
      } catch (error) {
        console.error('Error cargando datos del perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  // Función para obtener el badge según el tipo de usuario
  const getUserBadge = (userType?: string) => {
    switch (userType) {
      case 'provider':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Proveedor Verificado
          </span>
        );
      case 'influencer':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
            Influencer
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500"></div>
        </div>
      </AuthGuard>
    );
  }

  if (!profileData) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No se pudo cargar el perfil</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-pink-600 hover:text-pink-500 font-medium"
            >
              Volver al dashboard
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Incomplete Alert */}
          {!isProfileComplete && missingFields.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-orange-800">
                    Completa tu perfil
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p className="mb-3">Para acceder a todas las funciones de YAAN, completa la información faltante de tu perfil.</p>
                    <Link
                      href="/settings/profile"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-500 hover:bg-orange-600 transition-colors duration-200"
                    >
                      Completar perfil
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => {/* TODO: Permitir ocultar alerta temporalmente */}}
                    className="text-orange-400 hover:text-orange-600 transition-colors duration-200"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Profile Picture */}
              <ProfileImage
                path={profileData.profilePhotoPath}
                alt={`${profileData.givenName} ${profileData.familyName}`}
                fallbackText={`${profileData.givenName.charAt(0)}${profileData.familyName.charAt(0)}`}
                size="xl"
                className="flex-shrink-0"
                accessLevel="protected"
              />

              {/* Profile Info and Stats */}
              <div className="flex-grow text-center sm:text-left">
                <div className="mb-4">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {profileData.preferredUsername}
                    </h1>
                    {getUserBadge(profileData.userType)}
                  </div>
                  
                  {/* Stats - Mobile */}
                  <div className="grid grid-cols-4 gap-4 sm:hidden mt-4 mb-4">
                    <StatItem label="Publicaciones" value={profileData.stats.posts} />
                    <StatItem label="Seguidores" value={profileData.stats.followers} />
                    <StatItem label="Siguiendo" value={profileData.stats.following} />
                    <StatItem label="Me gusta" value={profileData.stats.likes} />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center sm:justify-start">
                    <Link
                      href="/settings/profile"
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                    >
                      Editar perfil
                    </Link>
                    <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200">
                      Compartir
                    </button>
                  </div>
                </div>

                {/* Stats - Desktop */}
                <div className="hidden sm:grid grid-cols-4 gap-8 max-w-md">
                  <StatItem label="Publicaciones" value={profileData.stats.posts} />
                  <StatItem label="Seguidores" value={profileData.stats.followers} />
                  <StatItem label="Siguiendo" value={profileData.stats.following} />
                  <StatItem label="Me gusta" value={profileData.stats.likes} />
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="space-y-2">
                <h2 className="font-semibold text-gray-900">
                  {profileData.givenName} {profileData.familyName}
                </h2>
                {profileData.details && (
                  <p className="text-gray-600 whitespace-pre-wrap">{profileData.details}</p>
                )}
                {profileData.website && (
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-500 font-medium inline-flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {profileData.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="bg-white rounded-2xl shadow-sm">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex justify-around sm:justify-start sm:gap-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'posts'
                      ? 'border-pink-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span className="hidden sm:inline">PUBLICACIONES</span>
                    <span className="sm:hidden">Publicaciones</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'saved'
                      ? 'border-pink-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span className="hidden sm:inline">GUARDADOS</span>
                    <span className="sm:hidden">Guardados</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('tagged')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'tagged'
                      ? 'border-pink-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden sm:inline">ETIQUETADOS</span>
                    <span className="sm:hidden">Etiquetas</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Content Grid */}
            <div className="p-6">
              {activeTab === 'posts' && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mb-4">Aún no has publicado nada</p>
                  <button className="text-pink-600 hover:text-pink-500 font-medium">
                    Crear tu primera publicación
                  </button>
                </div>
              )}
              {activeTab === 'saved' && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <p className="text-gray-500">No tienes publicaciones guardadas</p>
                </div>
              )}
              {activeTab === 'tagged' && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-gray-500">No has sido etiquetado en ninguna publicación</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}