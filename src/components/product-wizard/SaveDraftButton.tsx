'use client';

import { useState } from 'react';
import { useProductForm } from '@/context/ProductFormContext';
import { updateProductAction } from '@/lib/server/product-creation-actions';
import { toastManager } from '@/components/ui/Toast';

interface SaveDraftButtonProps {
  className?: string;
  variant?: 'outline' | 'solid';
}

/**
 * Botón universal para guardar progreso del wizard
 * - Guarda en localStorage (recovery inmediato)
 * - Guarda en MongoDB vía updateProductAction (persistencia)
 * - Detecta modo EDIT/CREATE y estado publicado/borrador
 * - Labels contextuales según estado
 */
export function SaveDraftButton({ className, variant = 'outline' }: SaveDraftButtonProps) {
  const { formData } = useProductForm();
  const [isSaving, setIsSaving] = useState(false);

  // Detectar contexto
  const isEditMode = !!formData.productId;
  const isPublished = formData.published === true;

  // Label dinámico según contexto
  const buttonLabel = isEditMode && isPublished
    ? '💾 Guardar Cambios'      // Producto publicado - no despublicar
    : '💾 Guardar Borrador';     // CREATE o borrador

  const handleSave = async () => {
    if (!formData.productId) {
      toastManager.show('⚠️ No se puede guardar sin un producto creado', 'warning', 3000);
      return;
    }

    console.log('💾 [SAVE] ========== INICIO DE GUARDADO ==========');
    console.log('💾 [SAVE] ProductId:', formData.productId);
    console.log('💾 [SAVE] ProductType:', formData.productType);
    console.log('💾 [SAVE] FormData COMPLETO antes de guardar:', JSON.stringify(formData, null, 2));
    console.log('💾 [SAVE] Departures en formData:', JSON.stringify(formData.departures, null, 2));
    console.log('💾 [SAVE] Payment_policy en formData:', JSON.stringify(formData.payment_policy, null, 2));
    console.log('💾 [SAVE] Seasons en formData:', JSON.stringify(formData.seasons, null, 2));

    setIsSaving(true);

    try {
      // 1. Guardar en localStorage (recovery rápido, offline-first)
      if (typeof window !== 'undefined') {
        const saveData = {
          ...formData,
          _savedAt: new Date().toISOString(),
          _savedBy: 'save-draft-button' as const
        };

        localStorage.setItem(`yaan-wizard-${formData.productType}`, JSON.stringify(saveData));
        localStorage.setItem('yaan-product-form-data', JSON.stringify(saveData));
        console.log('💾 [SAVE] Guardado en localStorage:', saveData._savedAt);
      }

      // 2. Preparar datos para MongoDB (sin id, se pasa por separado)
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

        // CRÍTICO: Mantener estado de publicación actual
        // Si está publicado, no despublicar; si es borrador, mantener como borrador
        published: isPublished ? true : false,
        is_foreign: formData.is_foreign || false,

        // Campos específicos según tipo de producto
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

      console.log('📤 [SAVE] UpdateData preparado para enviar:', JSON.stringify(updateData, null, 2));
      console.log('📤 [SAVE] Departures en updateData:', JSON.stringify(updateData.departures, null, 2));
      console.log('📤 [SAVE] Payment_policy en updateData:', JSON.stringify(updateData.payment_policy, null, 2));
      console.log('📤 [SAVE] Seasons en updateData:', JSON.stringify(updateData.seasons, null, 2));

      // 3. Guardar en MongoDB
      console.log('🔄 [SAVE] Enviando a MongoDB - ProductId:', formData.productId);
      const result = await updateProductAction(formData.productId, updateData);

      console.log('📥 [SAVE] Resultado recibido de updateProductAction:', JSON.stringify(result, null, 2));
      console.log('📥 [SAVE] Success:', result.success);
      if (result.data) {
        console.log('📥 [SAVE] Data devuelta:', JSON.stringify(result.data, null, 2));
      }
      if (result.error) {
        console.log('📥 [SAVE] Error recibido:', result.error);
      }

      if (result.success) {
        const actionMessage = isPublished ? 'Cambios guardados' : 'Borrador guardado';
        console.log('✅ [SAVE] Guardado exitoso:', actionMessage);
        toastManager.show(`✅ ${actionMessage} exitosamente`, 'success', 3000);
      } else {
        console.log('❌ [SAVE] Guardado falló:', result.error);
        throw new Error(result.error || 'Error al guardar');
      }

    } catch (error) {
      console.error('❌ [SAVE] Excepción capturada:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toastManager.show(`❌ Error al guardar: ${errorMessage}`, 'error', 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Estilos por variante
  const variantStyles = variant === 'solid'
    ? 'bg-purple-600 text-white hover:bg-purple-700'
    : 'border border-purple-600 text-purple-600 hover:bg-purple-50';

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={isSaving || !formData.productId}
      className={`
        px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles}
        ${className || ''}
      `}
      title={isPublished ? 'Guardar cambios sin despublicar' : 'Guardar como borrador'}
    >
      {isSaving ? (
        <>
          <svg className="inline w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Guardando...
        </>
      ) : buttonLabel}
    </button>
  );
}
