'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProfileImage } from '@/components/ui/ProfileImage';

/**
 * Provider Info Card Component
 *
 * Displays provider information including:
 * - Avatar and name
 * - Rating (if available)
 * - Contact button
 * - Link to provider profile
 * - Response time (future)
 *
 * Part of Sprint 1: Fundamentos del Detalle de Viaje
 */

interface ProviderData {
  id: string;
  full_name?: string;
  profile_image?: string;
  rating?: number;
  total_reviews?: number;
  response_time?: string; // e.g., "2 hours", "1 day"
}

interface ProviderInfoCardProps {
  provider: ProviderData;
  onContactClick?: () => void; // For future chat functionality
}

export default function ProviderInfoCard({ provider, onContactClick }: ProviderInfoCardProps) {
  const [imageError, setImageError] = useState(false);

  // Format provider name
  const providerName = provider.full_name || 'Proveedor';

  // Has rating data
  const hasRating = typeof provider.rating === 'number' && provider.rating > 0;

  // Generate star rating array
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <svg
            key={i}
            className="w-5 h-5 text-yellow-400 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        // Half star
        stars.push(
          <svg
            key={i}
            className="w-5 h-5 text-yellow-400"
            viewBox="0 0 24 24"
          >
            <defs>
              <linearGradient id="half-star-gradient">
                <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              fill="url(#half-star-gradient)"
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
        );
      } else {
        // Empty star
        stars.push(
          <svg
            key={i}
            className="w-5 h-5 text-gray-300 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      }
    }

    return stars;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tu Proveedor</h2>

        {/* Provider Profile */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <ProfileImage
              path={provider.profile_image}
              alt={providerName}
              size="2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {providerName}
            </h3>

            {/* Rating */}
            {hasRating && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {renderStars(provider.rating!)}
                </div>
                <span className="text-sm text-gray-600">
                  {provider.rating?.toFixed(1)}
                  {provider.total_reviews && (
                    <span className="text-gray-400"> ({provider.total_reviews})</span>
                  )}
                </span>
              </div>
            )}

            {/* Response Time */}
            {provider.response_time && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Responde en {provider.response_time}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 space-y-3">
        {/* Contact Button */}
        <button
          onClick={onContactClick}
          disabled={!onContactClick}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            onContactClick
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title={!onContactClick ? 'Chat disponible en próxima versión' : 'Enviar mensaje'}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {onContactClick ? 'Enviar mensaje' : 'Chat (próximamente)'}
        </button>

        {/* View Profile Link */}
        <Link
          href={`/provider/${provider.id}`}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Ver perfil del proveedor
        </Link>
      </div>

      {/* Info Cards */}
      <div className="px-6 pb-6 space-y-3">
        {/* Verified Badge */}
        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
          <svg
            className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-900">Proveedor Verificado</p>
            <p className="text-xs text-green-700 mt-1">
              Este proveedor ha sido verificado por YAAN
            </p>
          </div>
        </div>

        {/* Support Info */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">¿Necesitas ayuda?</p>
            <p className="text-xs text-blue-700 mt-1">
              Contacta al proveedor para dudas sobre tu reservación
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
