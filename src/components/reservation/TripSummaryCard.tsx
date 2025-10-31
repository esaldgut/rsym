'use client';

import { useState } from 'react';
import Image from 'next/image';
import { S3GalleryImage } from '@/components/ui/S3GalleryImage';

/**
 * Trip Summary Card Component
 *
 * Displays comprehensive trip information including:
 * - Cover image or gallery
 * - Product name and type
 * - Destination(s)
 * - Itinerary (collapsible)
 * - Hotel information
 * - Pricing summary
 *
 * Part of Sprint 1: Fundamentos del Detalle de Viaje
 */

interface Destination {
  place?: string;
  placeSub?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

interface ProductData {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  itinerary?: string;
  planned_hotels_or_similar?: string[];
  destination?: Destination[];
}

interface ReservationData {
  id: string;
  adults: number;
  kids: number;
  babys: number;
  price_per_person: number;
  price_per_kid?: number;
  total_price: number;
  currency: string;
  reservation_date: string;
  status: string;
  season_id?: string;
}

interface TripSummaryCardProps {
  product: ProductData;
  reservation: ReservationData;
}

export default function TripSummaryCard({ product, reservation }: TripSummaryCardProps) {
  const [showFullItinerary, setShowFullItinerary] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Get all media (cover + additional images)
  const allImages = [
    product.cover_image_url,
    ...(product.image_url || [])
  ].filter((url): url is string => !!url);

  // Format product type
  const productTypeLabel = product.product_type === 'circuit' ? 'Circuito' : 'Paquete';

  // Get destinations string
  const destinationsText = product.destination
    ?.map((dest) => {
      if (dest.placeSub) {
        return `${dest.place}, ${dest.placeSub}`;
      }
      return dest.place;
    })
    .filter(Boolean)
    .join(' → ') || 'Destino no especificado';

  // Calculate travelers
  const totalTravelers = reservation.adults + reservation.kids + reservation.babys;
  const travelersText = [
    reservation.adults > 0 ? `${reservation.adults} adulto${reservation.adults > 1 ? 's' : ''}` : null,
    reservation.kids > 0 ? `${reservation.kids} niño${reservation.kids > 1 ? 's' : ''}` : null,
    reservation.babys > 0 ? `${reservation.babys} bebé${reservation.babys > 1 ? 's' : ''}` : null
  ]
    .filter(Boolean)
    .join(', ');

  // Format reservation date
  const reservationDate = new Date(reservation.reservation_date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Parse and format itinerary
  const itineraryDays = product.itinerary
    ? product.itinerary.split(/Día \d+:/).filter(Boolean)
    : [];

  const previewItinerary = itineraryDays.slice(0, 2);
  const hasMoreDays = itineraryDays.length > 2;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Image Gallery */}
      {allImages.length > 0 && (
        <div className="relative h-64 sm:h-80 bg-gray-100">
          <S3GalleryImage
            path={allImages[selectedImageIndex]}
            alt={product.name}
            objectFit="cover"
            className="w-full h-full"
          />

          {/* Product Type Badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800">
              {productTypeLabel}
            </span>
          </div>

          {/* Image Navigation */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedImageIndex
                      ? 'bg-white w-6'
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Ver imagen ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
          {product.description && (
            <p className="text-gray-600 text-sm">{product.description}</p>
          )}
        </div>

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
          {/* Destination */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Destino</p>
              <p className="text-gray-900">{destinationsText}</p>
            </div>
          </div>

          {/* Travelers */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Viajeros</p>
              <p className="text-gray-900">{travelersText}</p>
            </div>
          </div>

          {/* Reservation Date */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Reservado el</p>
              <p className="text-gray-900">{reservationDate}</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Precio Total</p>
              <p className="text-gray-900 font-semibold">
                ${reservation.total_price.toLocaleString('es-MX')} {reservation.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Itinerary Section */}
        {product.itinerary && itineraryDays.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Itinerario</h3>
            <div className="space-y-3">
              {(showFullItinerary ? itineraryDays : previewItinerary).map((day, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 text-sm whitespace-pre-line">{day.trim()}</p>
                  </div>
                </div>
              ))}
            </div>

            {hasMoreDays && (
              <button
                onClick={() => setShowFullItinerary(!showFullItinerary)}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                {showFullItinerary ? (
                  <>
                    Ver menos
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </>
                ) : (
                  <>
                    Ver {itineraryDays.length - 2} días más
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Hotels Section */}
        {product.planned_hotels_or_similar && product.planned_hotels_or_similar.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Alojamiento</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2">
                {product.planned_hotels_or_similar.map((hotel, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span className="text-sm">{hotel}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
