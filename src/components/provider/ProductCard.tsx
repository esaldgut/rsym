'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProfileImage } from '@/components/ui/ProfileImage';

interface Product {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  status: string;
  published: boolean;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
  seasons?: Array<{
    id: string;
    start_date: string;
    end_date: string;
    category: string;
    allotment: number;
    allotment_remain: number;
  }>;
  destination?: Array<{
    place: string;
    placeSub: string;
  }>;
  min_product_price?: number;
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusBadge = () => {
    if (product.published) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Publicado
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Borrador
        </span>
      );
    }
  };

  const getTypeBadge = () => {
    const isCircuit = product.product_type === 'circuit';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isCircuit 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-purple-100 text-purple-800'
      }`}>
        {isCircuit ? '🗺️ Circuito' : '📦 Paquete'}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDestinationText = () => {
    if (!product.destination || product.destination.length === 0) {
      return 'Sin destino definido';
    }
    
    const firstDestination = product.destination[0];
    const additional = product.destination.length > 1 ? ` +${product.destination.length - 1} más` : '';
    return `${firstDestination.place}${additional}`;
  };

  const getCurrentSeason = () => {
    if (!product.seasons || product.seasons.length === 0) return null;
    
    const now = new Date();
    return product.seasons.find(season => {
      const start = new Date(season.start_date);
      const end = new Date(season.end_date);
      return now >= start && now <= end;
    });
  };

  const currentSeason = getCurrentSeason();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
        <ProfileImage
          path={product.cover_image_url}
          alt={product.name}
          fallbackText=""
          size="lg"
          className="w-full h-full rounded-none object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Status badges overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          {getStatusBadge()}
          {getTypeBadge()}
        </div>

        {/* Menu button */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white/90 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <Link
                  href={`/provider/products/${product.id}/edit`}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  ✏️ Editar
                </Link>
                <Link
                  href={`/provider/products/${product.id}`}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                  onClick={() => setShowMenu(false)}
                >
                  👁️ Ver detalles
                </Link>
                {product.published && (
                  <Link
                    href={`/marketplace/products/${product.id}`}
                    target="_blank"
                    className="block w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
                    onClick={() => setShowMenu(false)}
                  >
                    🚀 Ver en marketplace
                  </Link>
                )}
                <button
                  onClick={() => {
                    onDelete?.(product);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                >
                  🗑️ Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center mb-3 text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {getDestinationText()}
        </div>

        {/* Current season info */}
        {currentSeason && (
          <div className="flex items-center justify-between mb-3 p-2 bg-green-50 rounded-lg">
            <div className="text-sm text-green-800">
              <span className="font-medium">Temporada activa:</span> {currentSeason.category}
            </div>
            <div className="text-xs text-green-600">
              {currentSeason.allotment_remain || 0} / {currentSeason.allotment || 0} disponibles
            </div>
          </div>
        )}

        {/* Price */}
        {product.min_product_price && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm text-gray-500">Desde</span>
              <div className="text-xl font-bold text-gray-900">
                ${product.min_product_price.toLocaleString()} <span className="text-sm font-normal text-gray-500">MXN</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-400">
            Creado: {formatDate(product.created_at)}
          </div>
          <Link
            href={`/provider/products/${product.id}/edit`}
            className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
          >
            Gestionar
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}