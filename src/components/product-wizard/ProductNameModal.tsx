'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCircuitProductAction, createPackageProductAction } from '@/lib/server/product-creation-actions';
import { toastManager } from '@/components/ui/Toast';

const productNameSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s\-_0-9]+$/, 'Solo se permiten letras, números, espacios, guiones y guiones bajos')
});

type ProductNameFormData = z.infer<typeof productNameSchema>;

interface ProductNameModalProps {
  isOpen: boolean;
  productType: 'circuit' | 'package';
  onProductCreated: (productId: string, name: string) => void;
  onError: (error: string) => void;
  onClose?: () => void;
}

export default function ProductNameModal({
  isOpen,
  productType,
  onProductCreated,
  onError,
  onClose
}: ProductNameModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset
  } = useForm<ProductNameFormData>({
    resolver: zodResolver(productNameSchema),
    mode: 'onChange'
  });

  const nameValue = watch('name');

  const onSubmit = async (data: ProductNameFormData) => {
    setIsSubmitting(true);

    try {
      console.log('🎯 Invocando Server Action para crear producto:', data.name, 'Tipo:', productType);

      let result;
      
      if (productType === 'circuit') {
        result = await createCircuitProductAction(data.name.trim());
      } else {
        result = await createPackageProductAction(data.name.trim());
      }

      if (result.success && result.productId) {
        console.log('✅ Producto creado con ID:', result.productId);
        
        toastManager.show(
          `🎉 ${productType === 'circuit' ? 'Circuito' : 'Paquete'} "${data.name}" creado exitosamente`,
          'success',
          3000
        );

        // Guardar en localStorage para persistencia
        localStorage.setItem('yaan-current-product-id', result.productId);
        localStorage.setItem('yaan-current-product-type', productType);

        onProductCreated(result.productId, data.name.trim());
        reset();
      } else {
        throw new Error(result.error || 'No se recibió confirmación del servidor');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el producto';
      console.error('❌ Error creando producto:', err);
      onError(errorMessage);
      toastManager.show(`❌ Error: ${errorMessage}`, 'error', 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop con blur */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" />
      
      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {productType === 'circuit' ? '🗺️ Nuevo Circuito' : '📦 Nuevo Paquete'}
              </h3>
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
                  disabled={isSubmitting}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-sm text-white/90 mt-1">
              Ingresa el nombre de tu {productType === 'circuit' ? 'circuito' : 'paquete'} para comenzar
            </p>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del {productType === 'circuit' ? 'Circuito' : 'Paquete'} *
                </label>
                <input
                  id="productName"
                  type="text"
                  placeholder={`Ej. ${productType === 'circuit' 
                    ? 'Circuito Mágico por Michoacán' 
                    : 'Paquete Aventura en Oaxaca'}`}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                    errors.name 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={isSubmitting}
                  autoFocus
                  {...register('name')}
                />
                
                {/* Character counter */}
                <div className="flex justify-between items-center mt-1">
                  <div>
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  <span className={`text-xs ${
                    nameValue?.length > 80 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {nameValue?.length || 0}/100
                  </span>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-1">💡 Consejos:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Usa un nombre descriptivo y atractivo</li>
                  <li>• Incluye la ubicación principal</li>
                  <li>• Evita abreviaciones excesivas</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
              )}
              
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando...
                  </>
                ) : (
                  <>
                    🚀 Crear {productType === 'circuit' ? 'Circuito' : 'Paquete'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}