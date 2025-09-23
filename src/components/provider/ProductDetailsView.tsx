'use client';

import Link from 'next/link';
import { HeroSection } from '@/components/ui/HeroSection';
import { ProfileImage } from '@/components/ui/ProfileImage';
import type { Product, ProductDetailsViewProps } from '@/types';

// Interfaces ahora importadas de @/types

export function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const getStatusBadge = () => {
    if (product.published) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Publicado
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Borrador
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection
        title={product.name}
        subtitle={`${product.product_type === 'circuit' ? 'Circuito' : 'Paquete'} Turístico - Vista Detallada`}
        size="md"
        showShapes={true}
      >
        <div className="flex gap-4 items-center">
          {getStatusBadge()}
          <Link
            href={`/provider/products/${product.id}/edit`}
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            ✏️ Editar Producto
          </Link>
          <Link
            href="/provider/products"
            className="inline-flex items-center gap-2 bg-white/20 text-white border-2 border-white/30 px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-all duration-200"
          >
            ← Volver al Dashboard
          </Link>
        </div>
      </HeroSection>

      {/* Content */}
      <div className="bg-gray-50 -mt-8 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
            <div className="p-8">
              
              {/* Header with image */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-1">
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl overflow-hidden">
                    <ProfileImage
                      path={product.cover_image_url}
                      alt={product.name}
                      fallbackText=""
                      size="lg"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                      <div className="flex gap-3">
                        {getStatusBadge()}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          product.product_type === 'circuit' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {product.product_type === 'circuit' ? '🗺️ Circuito' : '📦 Paquete'}
                        </span>
                      </div>
                    </div>
                    {product.min_product_price && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Desde</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${product.min_product_price.toLocaleString()} <span className="text-sm text-gray-500">MXN</span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {product.description && (
                    <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium">Creado</p>
                      <p className="text-gray-900">{formatDate(product.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Última actualización</p>
                      <p className="text-gray-900">{formatDate(product.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          {/* Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Destinations */}
            {product.destination && product.destination.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Destinos</h3>
                <div className="space-y-2">
                  {product.destination.map((dest, index) => (
                    <div key={index} className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {dest.place}{dest.placeSub && `, ${dest.placeSub}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages & Preferences */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              {product.languages && product.languages.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🌍 Idiomas</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {product.languages.map((lang, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                </>
              )}
              
              {product.preferences && product.preferences.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ Preferencias</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.preferences.map((pref, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                        {pref}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Seasons */}
          {product.seasons && product.seasons.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">🗓️ Temporadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {product.seasons.map((season) => (
                  <div key={season.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{season.category}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        season.allotment_remain > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {season.allotment_remain} / {season.allotment}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(season.start_date).toLocaleDateString('es-ES')} - {' '}
                      {new Date(season.end_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itinerary */}
          {product.itinerary && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">🗺️ Itinerario</h3>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">
                  {product.itinerary}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}