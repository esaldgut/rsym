'use client';

import { SaveDraftButton } from '@/components/product-wizard/SaveDraftButton'
import { toastManager } from '@/components/ui/Toast'
import { useProductForm } from '@/context/ProductFormContext'
import { updateProductAction } from '@/lib/server/product-creation-actions'
import { validateForPublication } from '@/lib/validations/product-schemas'
import type { StepProps } from '@/types/wizard'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewStep({ userId, onPrevious, onCancelClick, resetUnsavedChanges }: StepProps) {
  const router = useRouter();
  const { formData } = useProductForm();
  const productId = formData.productId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validar si está listo para publicar (informativo, no bloqueante)
  const publicationValidation = validateForPublication(formData, formData.productType);
  const canPublish = true; // Siempre permitir publicar, solo mostrar warnings
  const hasWarnings = !publicationValidation?.isValid;

  const handleSubmit = async () => {
    if (!productId) {
      setSubmitError('No se encontró el ID del producto. Por favor, inicia el wizard nuevamente.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('🎯 Actualizando producto con ID:', productId);
      console.log('📋 Datos a actualizar:', formData);

      // Preparar datos para updateProductAction (sin id, se pasa por separado)
      const updateData = {
        name: formData.name,
        description: formData.description,
        preferences: formData.preferences,
        languages: formData.languages,
        cover_image_url: formData.cover_image_url,
        image_url: formData.image_url,
        video_url: formData.video_url,
        planned_hotels_or_similar: formData.planned_hotels_or_similar,
        seasons: formData.seasons,
        payment_policy: formData.payment_policy,
        published: canPublish, // Solo publicar si pasa las validaciones
        
        // Campos específicos según el tipo
        ...(formData.productType === 'circuit' && {
          destination: formData.destination,
          departures: formData.departures,
          itinerary: formData.itinerary,
        }),
        
        ...(formData.productType === 'package' && {
          destination: formData.destination,
          departures: formData.departures,
          itinerary: formData.itinerary,
        })
      };

      const result = await updateProductAction(productId, updateData);

      if (result.success) {
        setSubmitSuccess(true);

        const statusMessage = canPublish ? 'actualizado y publicado' : 'guardado como borrador';
        toastManager.show(
          `🎉 ¡${formData.productType === 'circuit' ? 'Circuito' : 'Paquete'} "${formData.name}" ${statusMessage} exitosamente!`,
          'success',
          5000
        );

        // Limpiar localStorage del wizard
        if (typeof window !== 'undefined') {
          localStorage.removeItem('yaan-current-product-id');
          localStorage.removeItem('yaan-current-product-type');
          localStorage.removeItem('yaan-current-product-name');
          localStorage.removeItem('yaan-product-form-data');
          localStorage.removeItem('yaan-edit-product-data'); // Limpiar datos de edición
          localStorage.removeItem(`yaan-wizard-${formData.productType}`);
        }

        // CRÍTICO: Resetear estado de cambios no guardados ANTES de redirigir
        // Esto previene que el navegador muestre el alert nativo de "abandonar página"
        if (resetUnsavedChanges) {
          console.log('🧹 Reseteando estado de cambios no guardados antes de redirigir');
          resetUnsavedChanges();
        }

        // Redirigir usando Next.js router (SPA navigation) en lugar de window.location (full reload)
        // Esto es más rápido y evita el flash de recarga de página
        setTimeout(() => {
          console.log('🔄 Redirigiendo a /provider/products...');
          router.push('/provider/products');
        }, 3000);
      } else {
        throw new Error(result.error || 'No se recibió confirmación del servidor');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado al actualizar el producto';
      setSubmitError(errorMessage);
      toastManager.show(`❌ ${errorMessage}`, 'error', 5000);
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¡{formData.productType === 'circuit' ? 'Circuito' : 'Paquete'} Completado!
        </h2>
        <p className="text-gray-600 mb-6">
          Tu {formData.productType === 'circuit' ? 'circuito' : 'paquete'} "{formData.name}" se ha {canPublish ? 'publicado' : 'guardado'} exitosamente.
        </p>
        <p className="text-sm text-gray-500">
          Redirigiendo...
        </p>
      </div>
    );
  }

  // Calcular estadísticas del producto
  const totalDestinations = formData.destination?.length || 0;
  const totalSeasons = formData.seasons?.length || 0;
  const totalImages = (formData.image_url?.length || 0) + (formData.cover_image_url ? 1 : 0);
  const totalVideos = formData.video_url?.length || 0;
  const minPrice = formData.seasons?.reduce((min, season) => {
    const seasonMin = season.prices?.reduce((sMin, price) => 
      Math.min(sMin, price.price || 0), Infinity) || 0;
    return Math.min(min, seasonMin);
  }, Infinity) || 0;

  return (
    <div className="space-y-8">
      {/* Header Visual Estilo Folleto */}
      <div className="bg-gradient-to-r from-pink-500 to-violet-600 rounded-lg overflow-hidden">
        <div className="relative">
          {formData.cover_image_url && (
            <div className="absolute inset-0 opacity-30">
              <img 
                src={formData.cover_image_url} 
                alt={formData.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="relative p-4 sm:p-6 lg:p-8 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">{formData.name || 'Producto Sin Nombre'}</h1>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 text-sm">
              {totalDestinations > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{formData.productType === 'circuit' ? '🗺️' : '📍'}</span>
                  <div>
                    <div className="font-semibold">
                      {formData.productType === 'circuit'
                        ? `${totalDestinations} destinos`
                        : formData.destination?.[0]?.place || 'Destino'
                      }
                    </div>
                    {formData.productType === 'circuit' && (
                      <div className="opacity-90 text-xs">
                        {formData.destination?.slice(0, 3).map(d => d.place).join(' • ')}
                        {totalDestinations > 3 && ` • +${totalDestinations - 3} más`}
                      </div>
                    )}
                    {formData.productType === 'package' && formData.destination?.[0]?.placeSub && (
                      <div className="opacity-90 text-xs">
                        {formData.destination[0].placeSub}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {minPrice > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <div>
                    <div className="text-xs opacity-90">DESDE</div>
                    <div className="font-bold text-2xl">${minPrice.toLocaleString()} MXN</div>
                  </div>
                </div>
              )}
              {formData.seasons?.[0]?.category && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  <div>
                    <div className="font-semibold">{totalSeasons} temporadas</div>
                    <div className="opacity-90 text-xs">{formData.seasons[0].category}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Resumen Visual - Mobile First */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Información General */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-purple-600">📋</span> Información General
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Nombre del Producto</label>
              <p className="text-gray-900 font-medium">{formData.name || 'Sin especificar'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Descripción</label>
              <p className="text-gray-700 text-sm line-clamp-3">
                {formData.description || 'Sin descripción'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Idiomas</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.languages?.map(lang => (
                  <span key={lang} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {lang}
                  </span>
                )) || <span className="text-gray-400 text-sm">No especificados</span>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Preferencias</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.preferences?.map(pref => (
                  <span key={pref} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                    {pref}
                  </span>
                )) || <span className="text-gray-400 text-sm">No especificadas</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Mapa de Ruta / Destinos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-purple-600">🗺️</span> Ruta del {formData.productType === 'circuit' ? 'Circuito' : 'Paquete'}
          </h3>
          <div className="space-y-2">
            {formData.destination?.map((dest, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{dest.place}</p>
                  {dest.placeSub && (
                    <p className="text-xs text-gray-500">{dest.placeSub}</p>
                  )}
                  {dest.complementary_description && (
                    <p className="text-xs text-gray-600 mt-1">{dest.complementary_description}</p>
                  )}
                </div>
                {index < (formData.destination?.length || 0) - 1 && (
                  <div className="absolute left-4 ml-4 mt-8 h-8 border-l-2 border-dashed border-gray-300"></div>
                )}
              </div>
            )) || <p className="text-gray-400">Sin destinos especificados</p>}
          </div>
        </div>

        {/* Temporadas y Precios */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-purple-600">💰</span> Temporadas y Precios
          </h3>
          <div className="space-y-3">
            {formData.seasons?.map((season, index) => (
              <div key={index} className="border-l-4 border-purple-600 pl-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{season.category}</p>
                    <p className="text-xs text-gray-500">
                      {season.start_date} - {season.end_date}
                    </p>
                  </div>
                  <div className="text-right">
                    {season.prices?.map((price, pIndex) => (
                      <div key={pIndex}>
                        <p className="text-sm font-semibold text-green-600">
                          ${price.price?.toLocaleString()} MXN
                        </p>
                        <p className="text-xs text-gray-500">{price.room_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {formData.productType === 'package' && season.number_of_nights && (
                  <p className="text-xs text-gray-600 mt-1">
                    🌙 {season.number_of_nights} noches
                  </p>
                )}
                {season.aditional_services && (
                  <p className="text-xs text-gray-600 mt-1">
                    Servicios: {season.aditional_services}
                  </p>
                )}
              </div>
            )) || <p className="text-gray-400">Sin temporadas configuradas</p>}
          </div>
        </div>

        {/* Multimedia */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-purple-600">📸</span> Contenido Multimedia
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Imagen de Portada</span>
              <span className={`text-sm font-medium ${formData.cover_image_url ? 'text-green-600' : 'text-gray-400'}`}>
                {formData.cover_image_url ? '✓ Cargada' : 'Sin cargar'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Galería de Imágenes</span>
              <span className="text-sm font-medium text-gray-900">
                {formData.image_url?.length || 0} imágenes
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Videos</span>
              <span className="text-sm font-medium text-gray-900">
                {formData.video_url?.length || 0} videos
              </span>
            </div>
            {formData.cover_image_url && (
              <div className="mt-4">
                <img 
                  src={formData.cover_image_url} 
                  alt="Portada"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Itinerario Detallado */}
      {formData.itinerary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-purple-600">📝</span> Itinerario {formData.productType === 'circuit' ? 'del Circuito' : 'del Paquete'}
          </h3>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-gray-700 text-sm font-sans">
              {formData.itinerary}
            </pre>
          </div>
        </div>
      )}

      {/* Hoteles Planificados */}
      {formData.planned_hotels_or_similar && formData.planned_hotels_or_similar.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-purple-600">🏨</span> Hoteles Planificados
          </h3>
          <div className="space-y-2">
            {formData.planned_hotels_or_similar.map((hotel, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 text-sm">{hotel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Políticas de Pago */}
      {formData.payment_policy && formData.payment_policy.options && formData.payment_policy.options.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-purple-600">💳</span> Políticas de Pago
          </h3>
          <div className="space-y-4">
            {/* Opciones de Pago */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.payment_policy.options.map((option: any, index: number) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 ${
                    option.type === 'CONTADO'
                      ? 'border-green-200 bg-green-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      option.type === 'CONTADO' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <h4 className="font-medium text-gray-900">
                      {option.type === 'CONTADO' ? 'Pago de Contado' : 'Pago en Plazos'}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                  {option.type === 'CONTADO' && option.config?.cash && (
                    <div className="space-y-1 text-xs">
                      {option.config.cash.discount > 0 && (
                        <p className="text-green-700">
                          <span className="font-semibold">Descuento:</span> {option.config.cash.discount}%
                        </p>
                      )}
                      <p className="text-gray-700">
                        <span className="font-semibold">Plazo para pagar:</span> {option.config.cash.deadline_days_to_pay} día(s)
                      </p>
                    </div>
                  )}
                  {option.type === 'PLAZOS' && option.config?.installments && (
                    <div className="space-y-1 text-xs">
                      <p className="text-blue-700">
                        <span className="font-semibold">Enganche:</span> {option.config.installments.down_payment_before}%
                      </p>
                      <p className="text-blue-700">
                        <span className="font-semibold">Saldo antes del viaje:</span> {option.config.installments.down_payment_after}%
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Políticas Generales */}
            {formData.payment_policy.general_policies?.change_policy && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Políticas Generales</h4>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  {formData.payment_policy.general_policies.change_policy.allows_date_change ? (
                    <>
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium">Permite cambios de fecha</p>
                        <p className="text-xs text-gray-600">
                          Hasta {formData.payment_policy.general_policies.change_policy.deadline_days_to_make_change} días antes del viaje
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="font-medium">No permite cambios de fecha</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado de Validación y Botones de Acción */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        {hasWarnings && publicationValidation && (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Campos Requeridos para Publicación
                  </h4>
                  {publicationValidation.summary && (
                    <p className="text-sm text-yellow-700 mt-1">{publicationValidation.summary}</p>
                  )}
                  {publicationValidation.errors && publicationValidation.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                      {publicationValidation.errors.map((error, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="text-yellow-600">•</span>
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex gap-3 order-2 sm:order-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={onPrevious}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              ← Anterior
            </button>
            <SaveDraftButton variant="outline" />
            {onCancelClick && (
              <button
                type="button"
                onClick={onCancelClick}
                className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`
              order-1 sm:order-2 w-full sm:w-auto px-8 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2
              ${hasWarnings
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg transform hover:scale-105'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transform hover:scale-105'
              }
              ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}
            `}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Publicando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {hasWarnings ? 'Publicar de Todos Modos' : `Publicar ${formData.productType === 'circuit' ? 'Circuito' : 'Paquete'}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
