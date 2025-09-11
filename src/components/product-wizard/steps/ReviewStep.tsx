'use client';

import { useState } from 'react';
import { useProductForm } from '@/context/ProductFormContext';
import { createCircuitProductAction, createPackageProductAction } from '@/lib/server/product-wizard-actions';
import { validateForPublication } from '@/lib/validations/product-schemas';
import type { StepProps } from '@/types/wizard';

export default function ReviewStep({ userId, onPrevious }: StepProps) {
  const { formData } = useProductForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validar si está listo para publicar
  const publicationValidation = validateForPublication(formData, formData.productType);
  const canPublish = publicationValidation.isValid;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let result;
      
      if (formData.productType === 'circuit') {
        result = await createCircuitProductAction({
          name: formData.name,
          preferences: formData.preferences,
          languages: formData.languages,
          description: formData.description,
          cover_image_url: formData.cover_image_url,
          image_url: formData.image_url,
          video_url: formData.video_url,
          destination: formData.destination,
          itinerary: formData.itinerary,
          seasons: formData.seasons,
          planned_hotels_or_similar: formData.planned_hotels_or_similar,
          payment_policy: formData.payment_policy,
          user_id: userId
        } as any);
      } else {
        result = await createPackageProductAction({
          name: formData.name,
          preferences: formData.preferences,
          languages: formData.languages,
          description: formData.description,
          cover_image_url: formData.cover_image_url,
          image_url: formData.image_url,
          video_url: formData.video_url,
          origin: formData.origin,
          destination: formData.destination,
          seasons: formData.seasons,
          planned_hotels_or_similar: formData.planned_hotels_or_similar,
          payment_policy: formData.payment_policy,
          user_id: userId
        } as any);
      }

      if (result.success) {
        setSubmitSuccess(true);
        if (result.redirectTo) {
          window.location.href = result.redirectTo;
        }
      } else {
        setSubmitError(result.error || 'Error al crear el producto');
      }
    } catch (error: any) {
      setSubmitError('Error inesperado al crear el producto');
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
          ¡{formData.productType === 'circuit' ? 'Circuito' : 'Paquete'} Creado!
        </h2>
        <p className="text-gray-600 mb-6">
          Tu {formData.productType === 'circuit' ? 'circuito' : 'paquete'} "{formData.name}" se ha creado exitosamente.
        </p>
        <p className="text-sm text-gray-500">
          Redirigiendo...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-violet-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Revisión Final</h2>
        <p className="opacity-90">
          Revisa todos los detalles antes de crear tu {formData.productType === 'circuit' ? 'circuito' : 'paquete'}
        </p>
      </div>

      {/* Advertencia de publicación */}
      {!canPublish && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-amber-800">Producto en borrador</h4>
              <p className="text-sm text-amber-700 mt-1">
                {publicationValidation.summary}
              </p>
              <div className="mt-2 text-xs text-amber-600">
                <p>Elementos faltantes:</p>
                <ul className="list-disc list-inside mt-1">
                  {publicationValidation.errors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-amber-700 mt-2">
                <strong>Nota:</strong> Podrás completar estos elementos después desde tu panel de productos.
              </p>
            </div>
          </div>
        </div>
      )}

      {canPublish && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-green-800">¡Listo para publicar!</h4>
              <p className="text-sm text-green-700">
                Tu {formData.productType === 'circuit' ? 'circuito' : 'paquete'} cumple con todos los requisitos del marketplace.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Información General */}
        <ReviewSection
          title="Información General"
          items={[
            { label: 'Nombre', value: formData.name },
            { label: 'Tipo', value: formData.productType === 'circuit' ? 'Circuito' : 'Paquete' },
            { label: 'Intereses', value: formData.preferences?.join(', ') || 'No especificado' },
            { label: 'Idiomas', value: formData.languages?.join(', ') || 'No especificado' },
            { label: 'Descripción', value: formData.description || 'No especificado' },
          ]}
        />

        {/* Ubicaciones */}
        {formData.productType === 'circuit' ? (
          <ReviewSection
            title="Destinos"
            items={[
              { 
                label: 'Destinos del circuito', 
                value: formData.destination?.map(d => d.place).join(', ') || 'No especificado'
              }
            ]}
          />
        ) : (
          <ReviewSection
            title="Ubicaciones"
            items={[
              { 
                label: 'Origen', 
                value: formData.origin?.[0]?.place || 'No especificado'
              },
              { 
                label: 'Destino', 
                value: formData.destination?.[0]?.place || 'No especificado'
              }
            ]}
          />
        )}

        {/* Itinerario (solo circuitos) */}
        {formData.productType === 'circuit' && formData.itinerary && (
          <ReviewSection
            title="Itinerario"
            items={[
              { label: 'Programa', value: formData.itinerary, isLong: true }
            ]}
          />
        )}

        {/* Temporadas */}
        <ReviewSection
          title="Temporadas"
          items={[
            { 
              label: 'Temporadas configuradas', 
              value: `${formData.seasons?.length || 0} temporada${(formData.seasons?.length || 0) === 1 ? '' : 's'}`
            }
          ]}
        />

        {/* Hoteles */}
        {formData.planned_hotels_or_similar && formData.planned_hotels_or_similar.length > 0 && (
          <ReviewSection
            title="Hoteles Previstos"
            items={[
              { 
                label: 'Hoteles', 
                value: formData.planned_hotels_or_similar.join(', ')
              }
            ]}
          />
        )}

        {/* Políticas de Pago */}
        <ReviewSection
          title="Políticas de Pago"
          items={[
            { 
              label: 'Opciones de pago', 
              value: `${formData.payment_policy?.options?.length || 0} opción${(formData.payment_policy?.options?.length || 0) === 1 ? '' : 'es'} configurada${(formData.payment_policy?.options?.length || 0) === 1 ? '' : 's'}`
            },
            {
              label: 'Cambios de fecha',
              value: formData.payment_policy?.general_policies?.change_policy?.allows_date_chage 
                ? `Permitidos hasta ${formData.payment_policy.general_policies.change_policy.deadline_days_to_make_change} días antes`
                : 'No permitidos'
            }
          ]}
        />

        {/* Multimedia */}
        <ReviewSection
          title="Galería Multimedia"
          items={[
            { 
              label: 'Imagen de portada', 
              value: formData.cover_image_url ? 'Configurada' : 'No configurada'
            },
            { 
              label: 'Imágenes adicionales', 
              value: `${formData.image_url?.length || 0} imagen${(formData.image_url?.length || 0) === 1 ? '' : 'es'}`
            },
            { 
              label: 'Videos', 
              value: `${formData.video_url?.length || 0} video${(formData.video_url?.length || 0) === 1 ? '' : 's'}`
            }
          ]}
        />
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 font-medium">{submitError}</p>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isSubmitting}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-pink-500 to-violet-600 text-white px-8 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando {formData.productType === 'circuit' ? 'circuito' : 'paquete'}...
            </>
          ) : (
            `Crear ${formData.productType === 'circuit' ? 'Circuito' : 'Paquete'}`
          )}
        </button>
      </div>
    </div>
  );
}

// Componente para cada sección de revisión
function ReviewSection({ 
  title, 
  items 
}: { 
  title: string;
  items: Array<{ label: string; value: string; isLong?: boolean }>;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className={`${item.isLong ? 'block' : 'flex justify-between'} text-sm`}>
            <span className="text-gray-600 font-medium">{item.label}:</span>
            <span className={`text-gray-800 ${item.isLong ? 'mt-1 block' : 'text-right'} max-w-lg`}>
              {item.isLong ? (
                <div className="bg-white border border-gray-300 rounded p-2 text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {item.value}
                </div>
              ) : (
                item.value
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}