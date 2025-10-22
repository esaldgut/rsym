'use client';

import { useState, useTransition } from 'react';
import { ProfileImage } from '../../components/ui/ProfileImage';
import { useRequireCompleteProfile } from '../../components/guards/ProfileCompletionGuard';
import { createReservationWithPaymentAction, checkAvailabilityAction } from '@/lib/server/reservation-actions';
import type { ReservationInput } from '@/lib/graphql/types';
import { toastManager } from '@/components/ui/ToastWithPinpoint';
import { useMarketplacePagination } from '@/hooks/useMarketplacePagination';
import { ProductDetailModal } from '@/components/marketplace/ProductDetailModal';

// REPLICANDO LOS PATTERNS DE ProviderProductsDashboard.tsx + FeedGrid.tsx

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
    place?: string;
    placeSub?: string;
  }>;
  seasons?: Array<{
    id: string;
    start_date?: string;
    end_date?: string;
    number_of_nights?: string;
  }>;
  user_data?: {
    username?: string;
    name?: string;
    avatar_url?: string;
  };
}

interface MarketplaceMetrics {
  total: number;
  circuits: number;
  packages: number;
  avgPrice: number;
  topDestinations: string[];
}

interface MarketplaceClientProps {
  initialProducts: MarketplaceProduct[];
  initialNextToken?: string;
  initialMetrics?: MarketplaceMetrics;
}

export function MarketplaceClient({
  initialProducts,
  initialNextToken,
  initialMetrics
}: MarketplaceClientProps) {
  console.log('🖥️ [CLIENT COMPONENT] MarketplaceClient hydrating with:', {
    products: initialProducts.length,
    hasNextToken: !!initialNextToken,
    hasMetrics: !!initialMetrics
  });

  const { checkProfile } = useRequireCompleteProfile();

  // Estado para el modal de reserva (PATRÓN DEL CÓDIGO ORIGINAL)
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<MarketplaceProduct | null>(null);
  const [reservationForm, setReservationForm] = useState({
    adults: 1,
    kids: 0,
    babys: 0
  });
  const [isProcessingReservation, setIsProcessingReservation] = useState(false);
  const [isPending, startTransition] = useTransition(); // Next.js 15 pattern para Server Actions

  // Estado para el modal de detalle de producto (NUEVO)
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);

  // Estado para filtros avanzados
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    maxPrice: ''
  });

  // Hook de paginación optimizado (NUEVO PATTERN)
  const {
    products,
    metrics,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    currentFilter,
    activeFilters,
    searchTerm,
    loadMore,
    changeFilter,
    applyFilters,
    searchProducts,
    clearFilters,
    refresh,
    loadMoreRef
  } = useMarketplacePagination({
    initialProducts,
    initialNextToken,
    initialMetrics
  });

  // Manejar apertura de detalle de producto (NUEVO)
  const handleOpenProductDetail = (product: MarketplaceProduct) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  // Manejar cierre de detalle de producto (NUEVO)
  const handleCloseProductDetail = () => {
    setShowProductDetail(false);
    setTimeout(() => setSelectedProduct(null), 300); // Delay para animación
  };

  // Manejar inicio de reserva (PATRÓN ORIGINAL MANTENIDO)
  const handleReserveExperience = async (experience: MarketplaceProduct) => {
    checkProfile('reserve_experience', {
      experienceId: experience.id,
      title: experience.name
    }, () => {
      setSelectedExperience(experience);
      setReservationForm({ adults: 1, kids: 0, babys: 0 });
      setShowReservationModal(true);
    });
  };

  // Manejar envío de reserva (ARQUITECTURA CORRECTA: Server Actions)
  const handleSubmitReservation = async () => {
    if (!selectedExperience) return;

    // Validación
    if (reservationForm.adults < 1) {
      toastManager.error('❌ Número de adultos inválido', {
        trackingContext: {
          feature: 'reservation_creation',
          error: 'invalid_adults_count',
          adults: reservationForm.adults,
          category: 'validation_error'
        }
      });
      return;
    }

    setIsProcessingReservation(true);

    // Use startTransition for better UX with Server Actions
    startTransition(async () => {
      try {
        const basePrice = selectedExperience.min_product_price || 0;
        const totalPrice = basePrice * reservationForm.adults +
                          basePrice * 0.5 * reservationForm.kids; // 50% descuento niños

        // First check availability (optional pre-validation)
        const availabilityResult = await checkAvailabilityAction(
          selectedExperience.id,
          reservationForm.adults,
          reservationForm.kids
        );

        if (!availabilityResult.data?.available) {
          toastManager.error('❌ ' + (availabilityResult.data?.message || 'No hay disponibilidad'), {
            trackingContext: {
              feature: 'reservation_creation',
              error: 'no_availability',
              experienceId: selectedExperience.id,
              category: 'availability_check'
            }
          });
          setIsProcessingReservation(false);
          return;
        }

        const reservationInput: ReservationInput = {
          adults: reservationForm.adults,
          kids: reservationForm.kids,
          babys: reservationForm.babys,
          price_per_person: selectedExperience.min_product_price || 0,
          price_per_kid: (selectedExperience.min_product_price || 0) * 0.5,
          total_price: totalPrice,
          experience_id: selectedExperience.id,
          collection_type: selectedExperience.product_type || 'product',
          reservationDate: new Date().toISOString(),
          status: 'pending'
        };

        // SERVER ACTION: Create reservation with payment in one transaction
        const result = await createReservationWithPaymentAction(reservationInput, 'stripe');

        if (result.success && result.data) {
          const { reservation, payment } = result.data;

          if (payment?.payment_url) {
            // Redirigir al link de pago
            window.open(payment.payment_url, '_blank');

            toastManager.success('🎯 Redirigiendo al sistema de pago...', {
              trackingContext: {
                feature: 'reservation_creation',
                reservationId: reservation.id,
                experienceId: selectedExperience.id,
                totalPrice,
                category: 'payment_redirect'
              }
            });
          } else {
            toastManager.success(`✅ Reserva creada exitosamente. ID: ${reservation.id}`, {
              trackingContext: {
                feature: 'reservation_creation',
                reservationId: reservation.id,
                experienceId: selectedExperience.id,
                totalPrice,
                category: 'reservation_success'
              }
            });
          }

          // Cerrar modal
          setShowReservationModal(false);
          setSelectedExperience(null);

          // Refresh data if needed
          refresh();
        } else {
          throw new Error(result.error || 'Error al procesar la reserva');
        }
      } catch (error) {
        console.error('Error creando reserva:', error);
        toastManager.error('❌ Error al procesar la reserva. Por favor intenta de nuevo.', {
          trackingContext: {
            feature: 'reservation_creation',
            error: error instanceof Error ? error.message : 'Unknown error',
            experienceId: selectedExperience.id,
            category: 'error_handling'
          }
        });
      } finally {
        setIsProcessingReservation(false);
      }
    });
  };

  // Aplicar filtros locales (bridging legacy UI to new hook)
  const handleFiltersApply = () => {
    const newFilters: any = {};

    if (filters.category) {
      newFilters.category = filters.category;
    }

    if (filters.maxPrice) {
      newFilters.maxPrice = parseFloat(filters.maxPrice);
    }

    applyFilters(newFilters);
  };

  // Aplicar búsqueda por ubicación
  const handleLocationSearch = (location: string) => {
    if (location.trim()) {
      searchProducts(location);
    } else {
      clearFilters();
    }
  };

  return (
    <div className="bg-gray-50 -mt-8 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Métricas del marketplace (NUEVO) */}
        {metrics && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Marketplace</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.total}</div>
                <div className="text-sm text-gray-500">Total Productos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.circuits}</div>
                <div className="text-sm text-gray-500">Circuitos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.packages}</div>
                <div className="text-sm text-gray-500">Paquetes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">${metrics.avgPrice.toFixed(0)}</div>
                <div className="text-sm text-gray-500">Precio Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-pink-600">{metrics.topDestinations[0] || 'N/A'}</div>
                <div className="text-sm text-gray-500">Destino Top</div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros rápidos por tipo (NUEVO PATTERN) */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'circuit', 'package', 'adventure', 'gastronomic', 'cultural', 'relax'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => changeFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                currentFilter === filter
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {filter === 'all' ? 'Todos' :
               filter === 'circuit' ? 'Circuitos' :
               filter === 'package' ? 'Paquetes' :
               filter === 'adventure' ? 'Aventura' :
               filter === 'gastronomic' ? 'Gastronomía' :
               filter === 'cultural' ? 'Cultural' : 'Relax'}
            </button>
          ))}
        </div>

        {/* Filtros avanzados (PATRÓN ORIGINAL MEJORADO) */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                <option value="ADVENTURE">Aventura</option>
                <option value="GASTRONOMIC">Gastronomía</option>
                <option value="CULTURAL">Cultural</option>
                <option value="RELAX">Relax</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(filters.location)}
                placeholder="Buscar por ubicación"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio máximo
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                placeholder="Sin límite"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleFiltersApply}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
              >
                Aplicar
              </button>
              <button
                onClick={() => {
                  setFilters({ category: '', location: '', maxPrice: '' });
                  clearFilters();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-red-600 text-sm underline hover:no-underline"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Loading State inicial */}
        {isLoading && products.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        )}

        {/* Grid de Experiencias con paginación infinita */}
        {!isLoading || products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {products.map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  onReserve={() => handleReserveExperience(experience)}
                  onOpenDetail={() => handleOpenProductDetail(experience)}
                />
              ))}
            </div>

            {/* Infinite scroll trigger (PATRÓN DE FeedGrid.tsx) */}
            <div ref={loadMoreRef} className="py-8">
              {isLoadingMore && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
                </div>
              )}

              {!hasMore && products.length > 0 && !searchTerm && (
                <div className="text-center text-gray-500">
                  <p className="text-sm">Has llegado al final del marketplace</p>
                </div>
              )}

              {/* Load more button como fallback */}
              {hasMore && !isLoadingMore && !searchTerm && (
                <div className="text-center">
                  <button
                    onClick={loadMore}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
                  >
                    Cargar más experiencias
                  </button>
                </div>
              )}
            </div>

            {/* Empty State */}
            {products.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron experiencias</h3>
                <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}

            {/* Call to Action para Proveedores (MANTENIDO) */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-4">
                ¿Tienes una experiencia que ofrecer?
              </h2>
              <p className="text-purple-100 mb-6">
                Únete a nuestra comunidad de proveedores y comparte tus experiencias únicas con viajeros de todo el mundo.
              </p>
              <button
                onClick={() => {
                  checkProfile('become_provider', {}, () => {
                    // Redirigir a proceso de registro como proveedor
                    console.log('Iniciando proceso para convertirse en proveedor');
                  });
                }}
                className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors duration-300"
              >
                Convertirme en proveedor
              </button>
            </div>
          </>
        ) : null}

        {/* Modal de detalle de producto (NUEVO) */}
        {showProductDetail && selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={handleCloseProductDetail}
            onReserve={() => {
              handleCloseProductDetail();
              handleReserveExperience(selectedProduct);
            }}
          />
        )}

        {/* Modal de reserva (PATRÓN ORIGINAL MANTENIDO) */}
        {showReservationModal && selectedExperience && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    Reservar experiencia
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedExperience.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReservationModal(false);
                    setSelectedExperience(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  disabled={isProcessingReservation}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Adultos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de adultos *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={reservationForm.adults}
                    onChange={(e) => setReservationForm(prev => ({
                      ...prev,
                      adults: parseInt(e.target.value) || 1
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isProcessingReservation}
                  />
                </div>

                {/* Niños */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de niños
                    <span className="text-sm text-gray-500 ml-1">(50% descuento)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={reservationForm.kids}
                    onChange={(e) => setReservationForm(prev => ({
                      ...prev,
                      kids: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isProcessingReservation}
                  />
                </div>

                {/* Bebés */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de bebés
                    <span className="text-sm text-gray-500 ml-1">(gratis)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={reservationForm.babys}
                    onChange={(e) => setReservationForm(prev => ({
                      ...prev,
                      babys: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isProcessingReservation}
                  />
                </div>
              </div>

              {/* Resumen de precio */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Resumen de precios</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{reservationForm.adults} adulto(s)</span>
                    <span>${((selectedExperience.min_product_price || 0) * reservationForm.adults).toLocaleString()}</span>
                  </div>
                  {reservationForm.kids > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{reservationForm.kids} niño(s) (50% desc.)</span>
                      <span>${((selectedExperience.min_product_price || 0) * 0.5 * reservationForm.kids).toLocaleString()}</span>
                    </div>
                  )}
                  {reservationForm.babys > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{reservationForm.babys} bebé(s) (gratis)</span>
                      <span>$0</span>
                    </div>
                  )}
                  <div className="border-t pt-2 font-semibold flex justify-between">
                    <span>Total</span>
                    <span>${((selectedExperience.min_product_price || 0) * reservationForm.adults + (selectedExperience.min_product_price || 0) * 0.5 * reservationForm.kids).toLocaleString()} MXN</span>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReservationModal(false);
                    setSelectedExperience(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isProcessingReservation}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitReservation}
                  className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg transition-all duration-300"
                  disabled={isProcessingReservation}
                >
                  {isProcessingReservation ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Procesando...
                    </span>
                  ) : (
                    'Confirmar reserva'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de experiencia (MEJORADO CON HOVER Y MODAL)
interface ExperienceCardProps {
  experience: MarketplaceProduct;
  onReserve: () => void;
  onOpenDetail?: () => void;
}

function ExperienceCard({ experience, onReserve, onOpenDetail }: ExperienceCardProps) {
  return (
    <div
      onClick={onOpenDetail}
      className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-110 hover:z-10"
    >
      {/* Imagen de portada con hover profesional: zoom + sombra + overlay */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden rounded-t-2xl">
        {/* Imagen principal con zoom en hover */}
        <ProfileImage
          path={experience.cover_image_url}
          alt={experience.name || 'Experiencia'}
          fallbackText=""
          size="lg"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
        />

        {/* Overlay oscuro sutil en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Product type badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full shadow-lg">
            {experience.product_type === 'circuit' ? 'Circuito' : 'Paquete'}
          </span>
        </div>

        {/* Overlay con CTA en hover (mobile-first) */}
        <div className="absolute inset-0 flex items-end justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <p className="text-sm font-semibold text-gray-900">Ver detalles</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {experience.name}
          </h3>
          <div className="flex items-center mb-2">
            <ProfileImage
              path={experience.user_data?.avatar_url}
              alt={experience.user_data?.name || 'Proveedor'}
              fallbackText={experience.user_data?.username?.substring(0, 2).toUpperCase() || 'P'}
              size="md"
            />
            <p className="text-sm text-gray-600 ml-3">
              por {experience.user_data?.name || experience.user_data?.username || 'Proveedor'}
            </p>
          </div>
        </div>

        {/* Descripción */}
        {experience.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {experience.description}
          </p>
        )}

        {/* Destinos */}
        {experience.destination && experience.destination.length > 0 && (
          <div className="flex items-center mb-3 text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {experience.destination.map(dest => dest.place).filter(Boolean).join(', ')}
          </div>
        )}

        {/* Fechas de temporadas disponibles */}
        {experience.seasons && experience.seasons.length > 0 && (
          <div className="flex items-center mb-3 text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {experience.seasons.length} temporada{experience.seasons.length > 1 ? 's' : ''} disponible{experience.seasons.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Tipo de producto */}
        {experience.product_type && (
          <div className="flex items-center mb-4 text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {experience.product_type === 'circuit' ? 'Circuito' : 'Paquete'}
          </div>
        )}

        {/* Precio y botón de reserva */}
        <div className="flex items-center justify-between">
          <div>
            {experience.min_product_price && (
              <>
                <span className="text-2xl font-bold text-gray-900">
                  ${experience.min_product_price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 ml-1">MXN</span>
                <p className="text-xs text-gray-500">desde</p>
              </>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevenir que se abra el modal al hacer clic en reservar
              onReserve();
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02]"
          >
            Reservar ahora
          </button>
        </div>
      </div>
    </div>
  );
}