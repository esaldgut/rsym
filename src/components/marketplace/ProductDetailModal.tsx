'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProductGalleryHeader, ProductGalleryHeaderHandle } from './ProductGalleryHeader';
import { FullscreenGallery } from './FullscreenGallery';
import { SeasonCard } from './SeasonCard';
import { ProductReviews } from './ProductReviews';
import { HybridProductMap } from './maps/HybridProductMap';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { ItineraryCard } from './ItineraryCard';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { encryptProductUrlAction } from '@/lib/server/url-encryption-actions';

interface MarketplaceProduct {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  published: boolean;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  min_product_price?: number;
  preferences?: string[];
  destination?: Array<{
    id?: string;
    place?: string;
    placeSub?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
    complementary_description?: string;
  }>;
  departures?: Array<{
    id?: string;
    days?: string[];
    specific_dates?: string[];
    origin?: Array<{
      id?: string;
      place?: string;
      placeSub?: string;
      coordinates?: {
        latitude?: number;
        longitude?: number;
      };
      complementary_description?: string;
    }>;
  }>;
  origin?: Array<{
    place?: string;
    placeSub?: string;
  }>;
  seasons?: Array<{
    id: string;
    start_date?: string;
    end_date?: string;
    number_of_nights?: string;
    product_pricing?: number;
  }>;
  itinerary?: string;
  planned_hotels_or_similar?: string[];
  user_data?: {
    username?: string;
    name?: string;
    avatar_url?: string;
  };
}

interface ProductDetailModalProps {
  product: MarketplaceProduct;
  onClose: () => void;
  onReserve: () => void;
}

type SectionId = 'descripcion' | 'itinerario' | 'temporadas' | 'alojamiento' | 'resenas' | 'mapa';

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'descripcion', label: 'Descripción' },
  { id: 'itinerario', label: 'Itinerario' },
  { id: 'temporadas', label: 'Temporadas' },
  { id: 'alojamiento', label: 'Alojamiento' },
  { id: 'resenas', label: 'Reseñas' },
  { id: 'mapa', label: 'Mapa' }
];

export function ProductDetailModal({ product, onClose, onReserve }: ProductDetailModalProps) {
  const router = useRouter();
  const { isComplete, isLoading, userType, requireProfileCompletion } = useProfileCompletion();
  const [isVisible, setIsVisible] = useState(false);
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>('descripcion');
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<ProductGalleryHeaderHandle>(null);

  // Section refs for intersection observer
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    descripcion: null,
    itinerario: null,
    temporadas: null,
    alojamiento: null,
    resenas: null,
    mapa: null
  });

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Track scroll for parallax effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollY(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for active section tracking
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observerOptions = {
      root: container,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section-id') as SectionId;
          if (sectionId) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleOpenFullscreenGallery = () => {
    console.log('[ProductDetailModal] 🖼️ Abriendo galería fullscreen');
    // Pause the ProductGalleryHeader carousel when opening fullscreen
    galleryRef.current?.pause();
    setShowFullscreenGallery(true);
  };

  const handleCloseFullscreenGallery = () => {
    console.log('[ProductDetailModal] 🔙 Cerrando galería fullscreen');
    // Resume the ProductGalleryHeader carousel when closing fullscreen
    galleryRef.current?.resume();
    setShowFullscreenGallery(false);
  };

  const scrollToSection = useCallback((sectionId: SectionId) => {
    const section = sectionRefs.current[sectionId];
    if (section && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const sectionTop = section.offsetTop;
      const headerHeight = 400; // Gallery header height

      container.scrollTo({
        top: sectionTop - headerHeight - 20,
        behavior: 'smooth'
      });
    }
  }, []);

  /**
   * Handler para el botón "Reservar ahora"
   *
   * Flujo:
   * 1. Valida que el perfil esté completo
   * 2. Si incompleto, redirige a /settings/profile con callback
   * 3. Si completo, cifra productId + productName + productType (Server Action)
   * 4. Navega a /marketplace/booking?product=[encrypted]
   */
  const handleReserveClick = useCallback(async () => {
    console.log('[ProductDetailModal] 🎯 Botón "Reservar ahora" clickeado');

    // Validar que el userType esté configurado (traveler, influencer, o provider)
    if (!userType) {
      console.warn('[ProductDetailModal] ⚠️ Usuario sin user_type definido, requiere completar perfil');
    }

    // Validar que sea uno de los user_types permitidos para hacer reservaciones
    const allowedUserTypes = ['traveler', 'influencer', 'provider'];
    if (userType && !allowedUserTypes.includes(userType)) {
      console.error('[ProductDetailModal] ❌ User type no permitido para reservar:', userType);
      alert('Tu tipo de usuario no tiene permisos para realizar reservaciones.');
      return;
    }

    // Cifrar parámetros de URL usando Server Action
    console.log('[ProductDetailModal] 🔐 Llamando Server Action para cifrar URL...');
    const encryptionResult = await encryptProductUrlAction(
      product.id,
      product.name,
      product.product_type as 'circuit' | 'package'
    );

    if (!encryptionResult.success || !encryptionResult.encrypted) {
      console.error('[ProductDetailModal] ❌ Error al cifrar parámetros:', encryptionResult.error);
      alert('Error al generar el enlace de reservación. Por favor intenta nuevamente.');
      return;
    }

    const bookingUrl = `/marketplace/booking?product=${encryptionResult.encrypted}`;
    console.log('[ProductDetailModal] 🔐 URL de booking cifrada generada');

    // Verificar si el perfil está completo
    const needsCompletion = requireProfileCompletion({
      returnUrl: bookingUrl,
      action: 'reserve_product',
      data: {
        productId: product.id,
        productName: product.name,
        productType: product.product_type
      }
    });

    if (needsCompletion) {
      console.log('[ProductDetailModal] 📝 Perfil incompleto, redirigiendo a /settings/profile');
      // requireProfileCompletion ya maneja la redirección
      return;
    }

    // Perfil completo, navegar a booking
    console.log('[ProductDetailModal] ✅ Perfil completo, navegando a booking:', bookingUrl);
    router.push(bookingUrl);

    // Opcional: Ejecutar callback original si existe
    if (onReserve) {
      onReserve();
    }
  }, [product, userType, requireProfileCompletion, router, onReserve]);

  // Prepare media for gallery
  const allImages = [product.cover_image_url, ...(product.image_url || [])];
  const allVideos = product.video_url || [];

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 pt-24 pb-8 sm:pt-28 sm:pb-12 md:pt-32 md:pb-16 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Backdrop with blur */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={handleClose}
        />

        {/* Modal container - Compacto max-w-3xl */}
        <div
          className={`relative w-full max-w-3xl max-h-[88vh] sm:max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-400 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-50 w-11 h-11 bg-white/15 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Scrollable content */}
          <div
            ref={scrollContainerRef}
            className="overflow-y-auto max-h-[88vh] sm:max-h-[85vh] scroll-smooth"
            style={{ paddingBottom: '80px' }}
          >
            {/* Gallery Header - Compacta y profesional */}
            <div className="relative h-72 sm:h-80 md:h-96">
              <ProductGalleryHeader
                ref={galleryRef}
                images={allImages}
                videos={allVideos}
                alt={product.name}
                onOpenFullscreen={handleOpenFullscreenGallery}
              />

              {/* Floating badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold shadow-sm flex items-center gap-2 text-white">
                  {product.product_type === 'circuit' ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Circuito
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                      </svg>
                      Paquete
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Product header info with parallax background */}
            <div className="relative">
              {/* Parallax background */}
              <div
                className="absolute inset-0 -z-10 opacity-20"
                style={{
                  transform: `translateY(${scrollY * 0.3}px)`
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {/* Title and provider */}
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-3 mb-4">
                    <ProfileImage
                      path={product.user_data?.avatar_url}
                      alt={product.user_data?.name || 'Proveedor'}
                      fallbackText={product.user_data?.username?.substring(0, 2).toUpperCase() || 'P'}
                      size="md"
                    />
                    <div>
                      <p className="text-sm text-gray-600">
                        por{' '}
                        <span className="font-semibold text-gray-900">
                          {product.user_data?.name || product.user_data?.username || 'Proveedor'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Preferences tags */}
                  {product.preferences && product.preferences.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {product.preferences.map((pref, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs font-medium rounded-full"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scroll sections */}
                <div className="space-y-8">
                  {/* Description Section */}
                  <section
                    ref={(el) => (sectionRefs.current.descripcion = el)}
                    data-section-id="descripcion"
                    className="scroll-mt-96"
                  >
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Descripción</h2>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                        {product.description || 'No hay descripción disponible para este producto.'}
                      </p>

                      {/* Origin */}
                      {product.origin && product.origin.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                            </svg>
                            Punto de Partida
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {product.origin.map((orig, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 px-4 py-3 rounded-xl"
                              >
                                <p className="text-sm font-semibold text-gray-900">{orig.place}</p>
                                {orig.placeSub && <p className="text-xs text-gray-600 mt-1">{orig.placeSub}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Itinerary Section */}
                  {product.itinerary && product.itinerary.trim() !== '' && (
                    <section
                      ref={(el) => (sectionRefs.current.itinerario = el)}
                      data-section-id="itinerario"
                      className="scroll-mt-96"
                    >
                      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {product.product_type === 'circuit' ? 'Itinerario Día a Día' : 'Actividades Incluidas'}
                          </h2>
                        </div>
                        <ItineraryCard
                          itinerary={product.itinerary}
                          productType={product.product_type}
                        />
                      </div>
                    </section>
                  )}

                  {/* Seasons Section with Horizontal Scroll */}
                  {product.seasons && product.seasons.length > 0 && (
                    <section
                      ref={(el) => (sectionRefs.current.temporadas = el)}
                      data-section-id="temporadas"
                      className="scroll-mt-96"
                    >
                      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900">Temporadas y Precios</h2>
                        </div>

                        {/* Horizontal scrolling season cards */}
                        <div className="relative -mx-6 sm:-mx-8 px-6 sm:px-8">
                          <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 h-80">
                            {product.seasons.map((season, index) => (
                              <SeasonCard
                                key={season.id}
                                season={season}
                                index={index}
                                isSelected={selectedSeasonIndex === index}
                                onSelect={() => setSelectedSeasonIndex(index)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Info hint */}
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm text-blue-800">
                                <strong>Desliza horizontalmente</strong> para ver todas las temporadas disponibles. Los precios pueden variar según la temporada seleccionada.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Accommodation Section */}
                  {product.planned_hotels_or_similar && product.planned_hotels_or_similar.length > 0 && (
                    <section
                      ref={(el) => (sectionRefs.current.alojamiento = el)}
                      data-section-id="alojamiento"
                      className="scroll-mt-96"
                    >
                      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900">Hoteles Planificados</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {product.planned_hotels_or_similar.map((hotel, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                  <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-semibold text-gray-900">{hotel}</p>
                                  <p className="text-xs text-gray-600 mt-1">O similar</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Reviews Section - Reseñas y Testimonios */}
                  <section
                    ref={(el) => (sectionRefs.current.resenas = el)}
                    data-section-id="resenas"
                    className="scroll-mt-96"
                  >
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Reseñas y Testimonios</h2>
                      </div>
                      <ProductReviews
                        productId={product.id}
                        reviews={[]}
                      />
                    </div>
                  </section>

                  {/* Map Section */}
                  {product.destination && product.destination.length > 0 && (
                    <section
                      ref={(el) => (sectionRefs.current.mapa = el)}
                      data-section-id="mapa"
                      className="scroll-mt-96"
                    >
                      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900">Mapa de Ruta</h2>
                        </div>
                        <HybridProductMap
                          destinations={product.destination}
                          productType={product.product_type as 'circuit' | 'package'}
                          productName={product.name}
                        />
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky lateral navigation (desktop only) */}
          <div className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 z-40">
            <div className="flex flex-col gap-4 bg-white/90 backdrop-blur-sm rounded-full py-4 px-2 shadow-sm border border-gray-200/50">
              {SECTIONS.map((section) => {
                // Only show section nav if that section exists in the product
                const shouldShow =
                  section.id === 'descripcion' ||
                  (section.id === 'itinerario' && product.itinerary && product.itinerary.trim() !== '') ||
                  (section.id === 'temporadas' && product.seasons && product.seasons.length > 0) ||
                  (section.id === 'alojamiento' &&
                    product.planned_hotels_or_similar &&
                    product.planned_hotels_or_similar.length > 0) ||
                  section.id === 'resenas' ||
                  (section.id === 'mapa' && product.destination && product.destination.length > 0);

                if (!shouldShow) return null;

                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="group relative"
                    aria-label={`Ir a ${section.label}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 scale-125 shadow-lg'
                          : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                      }`}
                    />

                    {/* Tooltip */}
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      <div className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-medium px-3 py-2 rounded-lg shadow-sm border border-gray-200/50">
                        {section.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-2 h-2 bg-white/90 backdrop-blur-sm border-l border-b border-gray-200/50 transform rotate-45"></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sticky footer with reserve button - Compacto y profesional */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md border-t-2 border-pink-200 p-3 sm:p-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Desde</p>
                  {product.seasons && product.seasons.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {product.seasons.length} temporada{product.seasons.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                    ${product.min_product_price?.toLocaleString() || '0'}
                  </p>
                  <span className="text-base font-semibold text-gray-600">MXN</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">*Precio por persona</p>
              </div>
              <button
                onClick={handleReserveClick}
                disabled={isLoading}
                className="w-full sm:w-auto flex-shrink-0 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 shadow-lg text-base flex items-center justify-center gap-2 relative overflow-hidden group animate-pulse-soft disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="relative z-10">Reservar ahora</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom scrollbar styles */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>

      {/* Fullscreen Gallery */}
      <FullscreenGallery
        images={allImages}
        videos={allVideos}
        alt={product.name}
        isOpen={showFullscreenGallery}
        onClose={handleCloseFullscreenGallery}
      />
    </>
  );
}
