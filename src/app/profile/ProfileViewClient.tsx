'use client';

import Link from 'next/link';
import { useState } from 'react';
import { HeroSection } from '@/components/ui/HeroSection';
import { ProfileImage } from '@/components/ui/ProfileImage';

/**
 * ProfileData - Tipos para los datos del perfil
 * Coincide con los atributos de Cognito
 */
interface ProfileData {
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  profilePhotoPath?: string;
  profilePhotoUrl?: string; // URL pre-firmada generada server-side
  preferredUsername?: string;
  details?: string;
  website?: string;
  userType?: 'traveler' | 'influencer' | 'provider';
  isProviderApproved?: boolean;
  isProfileComplete: boolean;
  missingFields: string[];
  stats: {
    posts: number;
    followers: number;
    following: number;
    likes: number;
  };
}

interface ProfileViewClientProps {
  initialData: ProfileData;
}

/**
 * Client Component para la vista del perfil
 * Maneja solo la interactividad (tabs, botones)
 * Los datos vienen del servidor
 */
export default function ProfileViewClient({ initialData }: ProfileViewClientProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');

  // Función para obtener el badge según el tipo de usuario
  const getUserBadge = (userType?: string, isProviderApproved?: boolean) => {
    switch (userType) {
      case 'provider':
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Business
            </span>
            {isProviderApproved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Proveedor Verificado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2a1 1 0 002 0V7zm-1 5.75a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" />
                </svg>
                Pendiente de Aprobación
              </span>
            )}
          </div>
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

  return (
    <div className="min-h-screen">
      {/* Hero Section con identidad YAAN */}
      <HeroSection
        title={
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-xl p-1 border border-white/30 shadow-2xl">
              <ProfileImage
                signedUrl={initialData.profilePhotoUrl}
                path={initialData.profilePhotoPath}
                alt={`${initialData.givenName} ${initialData.familyName}`}
                fallbackText={`${initialData.givenName.charAt(0)}${initialData.familyName.charAt(0)}`}
                size="xl"
                className="w-full h-full"
                accessLevel="protected"
              />
            </div>
            <span className="text-white font-bold">
              {initialData.preferredUsername || 'Mi Perfil'}
            </span>
          </div>
        }
        size="md"
        showShapes={true}
      >
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{initialData.stats.posts}</div>
            <div className="text-white/80 text-sm">Publicaciones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{initialData.stats.followers}</div>
            <div className="text-white/80 text-sm">Seguidores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{initialData.stats.following}</div>
            <div className="text-white/80 text-sm">Siguiendo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{initialData.stats.likes}</div>
            <div className="text-white/80 text-sm">Me gusta</div>
          </div>
        </div>
      </HeroSection>

      {/* Contenido Principal */}
      <div className="bg-gray-50 -mt-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Profile Incomplete Alert */}
          {!initialData.isProfileComplete && initialData.missingFields.length > 0 && (
            <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-200/50 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    🚀 Potencia tu experiencia YAAN
                  </h3>
                  <div className="text-gray-700">
                    <p className="mb-4">Completa tu perfil para desbloquear todas las funciones y conectar mejor con la comunidad.</p>
                    <Link
                      href="/settings/profile"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      Completar perfil
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Info Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-pink-500/5 to-purple-500/5 p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Profile Info */}
                <div className="flex-grow text-center sm:text-left">
                  <div className="mb-6">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {initialData.givenName} {initialData.familyName}
                      </h1>
                      {getUserBadge(initialData.userType, initialData.isProviderApproved)}
                    </div>
                    <p className="text-gray-600 text-lg mb-4">@{initialData.preferredUsername}</p>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center sm:justify-start mb-6">
                      <Link
                        href="/settings/profile"
                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        Editar perfil
                      </Link>
                      <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200">
                        Compartir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {(initialData.details || initialData.website) && (
                <div className="pt-6 border-t border-gray-100">
                  <div className="space-y-3">
                    {initialData.details && (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{initialData.details}</p>
                    )}
                    {initialData.website && (
                      <a
                        href={initialData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-500 font-medium inline-flex items-center gap-2 text-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {initialData.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <nav className="flex justify-around sm:justify-start sm:gap-8 px-6" aria-label="Tabs">
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className={`py-4 px-3 border-b-3 font-semibold text-sm transition-all duration-200 transform ${
                    activeTab === 'posts'
                      ? 'border-pink-500 text-pink-600 scale-105'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:scale-102'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span className="hidden sm:inline">PUBLICACIONES</span>
                    <span className="sm:hidden">Posts</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('saved')}
                  className={`py-4 px-3 border-b-3 font-semibold text-sm transition-all duration-200 transform ${
                    activeTab === 'saved'
                      ? 'border-pink-500 text-pink-600 scale-105'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:scale-102'
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
                  type="button"
                  onClick={() => setActiveTab('tagged')}
                  className={`py-4 px-3 border-b-3 font-semibold text-sm transition-all duration-200 transform ${
                    activeTab === 'tagged'
                      ? 'border-pink-500 text-pink-600 scale-105'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:scale-102'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden sm:inline">ETIQUETADOS</span>
                    <span className="sm:hidden">Tags</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Content Grid */}
            <div className="p-8">
              {activeTab === 'posts' && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">¡Comienza tu aventura visual!</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">Comparte tus experiencias y momentos favoritos con la comunidad YAAN</p>
                  <button className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                    Crear primera publicación
                  </button>
                </div>
              )}
              {activeTab === 'saved' && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Tus publicaciones guardadas</h3>
                  <p className="text-gray-600">Explora y guarda contenido que te inspire para futuras aventuras</p>
                </div>
              )}
              {activeTab === 'tagged' && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Etiquetas y menciones</h3>
                  <p className="text-gray-600">Aquí aparecerán las publicaciones donde otros usuarios te hayan etiquetado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}