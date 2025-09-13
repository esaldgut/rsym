'use client';

import { useState, useEffect } from 'react';
import { ProfileImage } from '../../components/ui/ProfileImage';
import { HeroSection } from '../../components/ui/HeroSection';
import { useRequireCompleteProfile } from '../../components/guards/ProfileCompletionGuard';
import { executeQuery, executeMutation } from '@/lib/graphql/client';
import { getAllMarketplaceFeed, createReservation, generatePaymentLink } from '@/lib/graphql/operations';
import type { MarketplaceFeed, ReservationInput, PaymentInput } from '@/lib/graphql/types';
import { toastManager } from '@/components/ui/Toast';

export default function MarketplacePage() {
  const { checkProfile } = useRequireCompleteProfile();
  const [experiences, setExperiences] = useState<MarketplaceFeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    maxPrice: ''
  });

  // Estado para el modal de reserva
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<MarketplaceFeed | null>(null);
  const [reservationForm, setReservationForm] = useState({
    adults: 1,
    kids: 0,
    babys: 0
  });
  const [isProcessingReservation, setIsProcessingReservation] = useState(false);

  // Cargar experiencias del marketplace
  useEffect(() => {
    const loadExperiences = async () => {
      setIsLoading(true);
      try {
        const result = await executeQuery(getAllMarketplaceFeed);
        if (result?.getAllMarketplaceFeed) {
          setExperiences(result.getAllMarketplaceFeed.filter(exp => exp.published));
        }
      } catch (error) {
        console.error('Error cargando experiencias:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiences();
  }, []);

  // Manejar inicio de reserva (abrir modal)
  const handleReserveExperience = async (experience: MarketplaceFeed) => {
    checkProfile('reserve_experience', { 
      experienceId: experience.id, 
      title: experience.name 
    }, () => {
      setSelectedExperience(experience);
      setReservationForm({ adults: 1, kids: 0, babys: 0 });
      setShowReservationModal(true);
    });
  };

  // Manejar envío de reserva
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
    try {
      const totalPrice = (selectedExperience.product_pricing || 0) * reservationForm.adults + 
                        (selectedExperience.product_pricing || 0) * 0.5 * reservationForm.kids; // 50% descuento niños

      const reservationInput: ReservationInput = {
        adults: reservationForm.adults,
        kids: reservationForm.kids,
        babys: reservationForm.babys,
        price_per_person: selectedExperience.product_pricing || 0,
        price_per_kid: (selectedExperience.product_pricing || 0) * 0.5,
        total_price: totalPrice,
        experience_id: selectedExperience.id,
        collection_type: selectedExperience.collection_type || 'experience',
        reservationDate: new Date().toISOString(),
        status: 'pending'
      };

      const reservationResult = await executeMutation(createReservation, {
        input: reservationInput
      });

      if (reservationResult?.createReservation) {
        // Generar link de pago
        const paymentInput: PaymentInput = {
          reservation_id: reservationResult.createReservation.id!,
          payment_method: 'stripe',
          promotions: false
        };

        const paymentResult = await executeMutation(generatePaymentLink, {
          input: paymentInput
        });

        if (paymentResult?.generatePaymentLink?.payment_url) {
          // Redirigir al link de pago
          window.open(paymentResult.generatePaymentLink.payment_url, '_blank');
          
          toastManager.success('🎯 Redirigiendo al sistema de pago...', {
            trackingContext: {
              feature: 'reservation_creation',
              reservationId: reservationResult.createReservation.id,
              experienceId: selectedExperience.id,
              totalPrice,
              category: 'payment_redirect'
            }
          });
        } else {
          toastManager.success(`✅ Reserva creada exitosamente. ID: ${reservationResult.createReservation.id}`, {
            trackingContext: {
              feature: 'reservation_creation',
              reservationId: reservationResult.createReservation.id,
              experienceId: selectedExperience.id,
              totalPrice,
              category: 'reservation_success'
            }
          });
        }
        
        // Cerrar modal
        setShowReservationModal(false);
        setSelectedExperience(null);
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
  };

  // Filtrar experiencias
  const filteredExperiences = experiences.filter(experience => {
    if (filters.category && !experience.preferences?.includes(filters.category)) {
      return false;
    }
    if (filters.location && !experience.location?.some(loc => 
      loc.toLowerCase().includes(filters.location.toLowerCase())
    )) {
      return false;
    }
    if (filters.maxPrice && experience.product_pricing && 
        experience.product_pricing > parseFloat(filters.maxPrice)) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section reutilizable con gradiente consistente */}
      <HeroSection
        title="Marketplace de Experiencias"
        subtitle="Descubre experiencias únicas creadas por proveedores locales"
        size="md"
        showShapes={true}
      />
      
      <div className="bg-gray-50 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filtros */}
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
                <option value="GASCTRONOMIC">Gastronomía</option>
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
            
            <div className="flex items-end">
              <button 
                onClick={() => {/* Los filtros se aplican automáticamente */}}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <>
            {/* Grid de Experiencias */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {filteredExperiences.map((experience) => (
                <ExperienceCard 
                  key={experience.id} 
                  experience={experience} 
                  onReserve={() => handleReserveExperience(experience)}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredExperiences.length === 0 && !isLoading && (
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

            {/* Call to Action para Proveedores */}
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
        )}
        </div>
      </div>

      {/* Modal de reserva */}
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
                  <span>${((selectedExperience.product_pricing || 0) * reservationForm.adults).toLocaleString()}</span>
                </div>
                {reservationForm.kids > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{reservationForm.kids} niño(s) (50% desc.)</span>
                    <span>${((selectedExperience.product_pricing || 0) * 0.5 * reservationForm.kids).toLocaleString()}</span>
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
                  <span>${((selectedExperience.product_pricing || 0) * reservationForm.adults + (selectedExperience.product_pricing || 0) * 0.5 * reservationForm.kids).toLocaleString()} MXN</span>
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
  );
}

// Componente de tarjeta de experiencia
interface ExperienceCardProps {
  experience: MarketplaceFeed;
  onReserve: () => void;
}

function ExperienceCard({ experience, onReserve }: ExperienceCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Imagen de portada */}
      <div className="relative h-48">
        <ProfileImage
          path={experience.cover_image_url}
          alt={experience.name || 'Experiencia'}
          fallbackText=""
          size="lg"
          className="w-full h-full rounded-none"
        />
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-white/90 text-gray-700 text-xs font-medium rounded-full">
            {experience.collection_type}
          </span>
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
              por {experience.user_data?.name || experience.user_data?.username}
            </p>
          </div>
        </div>

        {/* Descripción */}
        {experience.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {experience.description}
          </p>
        )}

        {/* Ubicaciones */}
        {experience.location && experience.location.length > 0 && (
          <div className="flex items-center mb-3 text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {experience.location.join(', ')}
          </div>
        )}

        {/* Fecha de inicio si está disponible */}
        {experience.startDate && (
          <div className="flex items-center mb-3 text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Disponible desde: {new Date(experience.startDate).toLocaleDateString('es-ES')}
          </div>
        )}

        {/* Seguidores */}
        {experience.followerNumber && experience.followerNumber > 0 && (
          <div className="flex items-center mb-4 text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {experience.followerNumber} seguidores
          </div>
        )}

        {/* Precio y botón de reserva */}
        <div className="flex items-center justify-between">
          <div>
            {experience.product_pricing && (
              <>
                <span className="text-2xl font-bold text-gray-900">
                  ${experience.product_pricing.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 ml-1">MXN</span>
                <p className="text-xs text-gray-500">por persona</p>
              </>
            )}
          </div>
          
          <button
            onClick={onReserve}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02]"
          >
            Reservar ahora
          </button>
        </div>
      </div>
    </div>
  );
}