'use client';

import { ProfileImage } from '@/components/ui/ProfileImage';

// Interfaces preparadas para cuando implementes el query en AWS Lambda
interface ProductReview {
  id: string;
  rating: number; // 1-5 estrellas
  comment: string;
  created_at: string;
  user_data?: {
    name?: string;
    avatar_url?: string;
    username?: string;
  };
  helpful_count?: number;
}

interface ProductReviewsProps {
  productId: string;
  reviews?: ProductReview[]; // Opcional - cuando tengas datos reales
  averageRating?: number;
  totalReviews?: number;
}

export function ProductReviews({
  productId,
  reviews = [],
  averageRating,
  totalReviews
}: ProductReviewsProps) {
  // Calcular rating promedio si hay reviews
  const avgRating = averageRating || (reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0);

  const totalCount = totalReviews || reviews.length;

  // Calcular distribución de ratings
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, percentage };
  });

  // Renderizar estrellas
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header con rating general - Mobile-first responsive */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Rating principal */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-black text-gray-900 mb-2">
                {avgRating.toFixed(1)}
              </div>
              {renderStars(Math.round(avgRating), 'lg')}
              <p className="text-sm text-gray-600 mt-2">
                {totalCount} {totalCount === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>

            {/* Distribución de ratings (desktop) */}
            <div className="hidden md:block space-y-2 min-w-[240px]">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-8">{star}★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA para dejar reseña */}
          <button
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            onClick={() => {
              // TODO: Implementar modal para agregar reseña
              console.log('Abrir modal para agregar reseña del producto:', productId);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <span>Escribir reseña</span>
          </button>
        </div>
      </div>

      {/* Lista de reseñas - Mobile-first responsive */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Reseñas de clientes</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                {/* Header de la reseña */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ProfileImage
                      path={review.user_data?.avatar_url}
                      alt={review.user_data?.name || 'Usuario'}
                      fallbackText={review.user_data?.username?.substring(0, 2).toUpperCase() || 'U'}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {review.user_data?.name || review.user_data?.username || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  {renderStars(review.rating, 'sm')}
                </div>

                {/* Comentario */}
                <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>

                {/* Footer con acciones */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-pink-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                    <span>Útil ({review.helpful_count || 0})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Estado vacío - Sin reseñas todavía
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aún no hay reseñas</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Sé el primero en compartir tu experiencia con este producto. Tu opinión ayuda a otros viajeros a tomar mejores decisiones.
          </p>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            onClick={() => {
              // TODO: Implementar modal para agregar reseña
              console.log('Abrir modal para primera reseña del producto:', productId);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Escribir primera reseña</span>
          </button>
        </div>
      )}

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              <strong>Reseñas verificadas:</strong> Solo los clientes que han completado este viaje pueden dejar reseñas. Todas las opiniones son verificadas por nuestro equipo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
