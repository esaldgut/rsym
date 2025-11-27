'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductGalleryHeader, ProductGalleryHeaderHandle } from '@/components/marketplace/ProductGalleryHeader';
import { FullscreenGallery } from '@/components/marketplace/FullscreenGallery';
import { ItineraryCard } from '@/components/marketplace/ItineraryCard';
import { SeasonCard } from '@/components/booking/SeasonCard';
import { HybridProductMap } from '@/components/marketplace/maps/HybridProductMap';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { cn } from '@/lib/utils';
import { encryptProductUrlAction } from '@/lib/server/url-encryption-actions';
import type { Product } from '@/generated/graphql';

/**
 * Product Detail Client Component
 *
 * Interactive product detail page with sections and CTAs.
 * Reuses existing components for consistency.
 */

interface ProductDetailClientProps {
  product: Product;
}

type SectionId = 'descripcion' | 'itinerario' | 'temporadas' | 'alojamiento' | 'mapa';

const SECTIONS: Array<{ id: SectionId; label: string; icon: string }> = [
  { id: 'descripcion', label: 'Descripción', icon: '📝' },
  { id: 'itinerario', label: 'Itinerario', icon: '🗺️' },
  { id: 'temporadas', label: 'Temporadas', icon: '📅' },
  { id: 'alojamiento', label: 'Alojamiento', icon: '🏨' },
  { id: 'mapa', label: 'Mapa', icon: '🌍' }
];

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('descripcion');
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const galleryRef = useRef<ProductGalleryHeaderHandle>(null);

  // Section refs for smooth scrolling
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    descripcion: null,
    itinerario: null,
    temporadas: null,
    alojamiento: null,
    mapa: null
  });

  // Prepare gallery data
  const coverImage = product.cover_image_url ? [product.cover_image_url] : [];
  const additionalImages = Array.isArray(product.image_url) ? product.image_url : [];
  const allImages = [...coverImage, ...additionalImages].filter((url): url is string => !!url);
  const allVideos = Array.isArray(product.video_url) ? product.video_url.filter((url): url is string => !!url) : [];

  // Format destinations for display
  const destinations = product.destination?.map(d => d.place).filter(Boolean).join(', ') || 'Destinos múltiples';

  // Get min price from seasons
  const minPrice = product.seasons && product.seasons.length > 0
    ? Math.min(...product.seasons.map(s => s.prices?.[0]?.price || 0).filter(p => p > 0))
    : product.min_product_price || 0;

  const currency = product.seasons?.[0]?.prices?.[0]?.currency || 'MXN';

  // Handle fullscreen gallery
  const handleOpenFullscreenGallery = () => {
    console.log('[ProductDetailClient] 🖼️ Abriendo galería fullscreen');
    galleryRef.current?.pause();
    setShowFullscreenGallery(true);
  };

  const handleCloseFullscreenGallery = () => {
    console.log('[ProductDetailClient] 🔙 Cerrando galería fullscreen');
    galleryRef.current?.resume();
    setShowFullscreenGallery(false);
  };

  // Scroll to section
  const scrollToSection = (sectionId: SectionId) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  // Handle reserve button
  const handleReserve = async () => {
    console.log('[ProductDetailClient] 🎫 Iniciando proceso de reserva');

    // Cifrar parámetros de URL usando Server Action
    console.log('[ProductDetailClient] 🔐 Cifrando parámetros de URL...');
    const encryptionResult = await encryptProductUrlAction(
      product.id,
      product.name,
      product.product_type as 'circuit' | 'package'
    );

    if (!encryptionResult.success || !encryptionResult.encrypted) {
      console.error('[ProductDetailClient] ❌ Error al cifrar parámetros:', encryptionResult.error);
      alert('Error al generar el enlace de reservación. Por favor intenta nuevamente.');
      return;
    }

    const bookingUrl = `/marketplace/booking?product=${encryptionResult.encrypted}`;
    console.log('[ProductDetailClient] ✅ Navegando a booking con URL cifrada');
    router.push(bookingUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gallery Header */}
      <div className="relative">
        <ProductGalleryHeader
          ref={galleryRef}
          images={allImages}
          videos={allVideos}
          alt={product.name}
          onOpenFullscreen={handleOpenFullscreenGallery}
        />

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-24 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
          aria-label="Volver atrás"
        >
          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Fullscreen Gallery */}
      <FullscreenGallery
        images={allImages}
        videos={allVideos}
        alt={product.name}
        isOpen={showFullscreenGallery}
        onClose={handleCloseFullscreenGallery}
        initialIndex={0}
      />

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-black text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-lg text-gray-600 flex items-center gap-2">
                <span>📍</span>
                {destinations}
              </p>
            </div>

            {/* Provider Info */}
            {product.user_data && (
              <div className="flex items-center gap-3">
                <ProfileImage
                  path={product.user_data.avatar_url}
                  alt={product.user_data.name || 'Provider'}
                  size="md"
                />
                <div>
                  <p className="text-sm text-gray-500">Ofrecido por</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {product.user_data.name || product.user_data.username}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Price and CTA (Mobile) */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 lg:hidden">
            <div>
              <p className="text-sm text-gray-600">Desde</p>
              <p className="text-2xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                ${minPrice.toLocaleString()} {currency}
              </p>
              <p className="text-xs text-gray-500">por persona</p>
            </div>
            <button
              onClick={handleReserve}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Reservar Ahora
            </button>
          </div>

          {/* Preferences Tags */}
          {product.preferences && product.preferences.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {product.preferences.map((pref, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {pref}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-2xl shadow-sm mb-6 sticky top-16 z-20">
          <div className="flex overflow-x-auto no-scrollbar">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "flex-shrink-0 px-6 py-4 font-semibold transition-all border-b-2",
                  activeSection === section.id
                    ? "text-pink-600 border-pink-600"
                    : "text-gray-600 border-transparent hover:text-pink-600 hover:border-pink-300"
                )}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Descripción Section */}
          <div
            ref={(el) => { sectionRefs.current.descripcion = el; }}
            data-section-id="descripcion"
            className="bg-white rounded-2xl shadow-sm p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Descripción</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {product.description || 'No hay descripción disponible para este producto.'}
              </p>
            </div>
          </div>

          {/* Itinerario Section */}
          {product.itinerary && (
            <div
              ref={(el) => { sectionRefs.current.itinerario = el; }}
              data-section-id="itinerario"
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🗺️ Itinerario</h2>
              <ItineraryCard
                itinerary={product.itinerary}
                productType={product.product_type as 'circuit' | 'package'}
              />
            </div>
          )}

          {/* Temporadas Section */}
          {product.seasons && product.seasons.length > 0 && (
            <div
              ref={(el) => { sectionRefs.current.temporadas = el; }}
              data-section-id="temporadas"
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 Temporadas y Precios</h2>

              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                  {product.seasons.map((season, index) => (
                    <SeasonCard
                      key={season.id}
                      season={{
                        id: season.id,
                        start_date: season.start_date || '',
                        end_date: season.end_date || '',
                        number_of_nights: season.number_of_nights || '0',
                        category: season.season_name,
                        allotment: season.allotment || 0,
                        allotment_remain: season.allotment_remain || 0,
                        prices: season.prices || []
                      }}
                      index={index}
                      isSelected={selectedSeasonIndex === index}
                      onSelect={() => setSelectedSeasonIndex(index)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Nota:</strong> Los precios pueden variar según la temporada y el tipo de habitación seleccionada.
                  Haz clic en una temporada para ver más detalles.
                </p>
              </div>
            </div>
          )}

          {/* Alojamiento Section */}
          {product.planned_hotels_or_similar && product.planned_hotels_or_similar.length > 0 && (
            <div
              ref={(el) => { sectionRefs.current.alojamiento = el; }}
              data-section-id="alojamiento"
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏨 Alojamiento</h2>
              <div className="space-y-3">
                {product.planned_hotels_or_similar.map((hotel, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"
                  >
                    <span className="text-2xl">🏨</span>
                    <p className="text-gray-800 font-medium">{hotel}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ℹ️ <strong>Hoteles planificados o similares:</strong> En caso de no disponibilidad,
                  se asignarán hoteles de categoría similar o superior.
                </p>
              </div>
            </div>
          )}

          {/* Mapa Section */}
          {product.destination && product.destination.length > 0 && (
            <div
              ref={(el) => { sectionRefs.current.mapa = el; }}
              data-section-id="mapa"
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🌍 Ruta del Viaje</h2>
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <HybridProductMap
                  destinations={product.destination}
                  productType={product.product_type}
                  productName={product.name}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer (Desktop) */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Desde</p>
              <p className="text-3xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                ${minPrice.toLocaleString()} {currency}
              </p>
              <p className="text-xs text-gray-500">por persona</p>
            </div>

            <button
              onClick={handleReserve}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
            >
              Reservar Ahora →
            </button>
          </div>
        </div>
      </div>

      {/* Spacing for sticky footer */}
      <div className="hidden lg:block h-24" />
    </div>
  );
}
