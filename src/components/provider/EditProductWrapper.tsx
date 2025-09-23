'use client';

import { useEffect } from 'react';
import ProductWizard from '@/components/product-wizard/ProductWizard';
import { analytics } from '@/lib/services/analytics-service';
import type { Product, EditProductWrapperProps } from '@/types';

// Interfaces ahora importadas de @/types

/**
 * Wrapper que configura el ProductWizard para modo edición
 * Reutiliza completamente el wizard existente con datos pre-cargados
 */
export function EditProductWrapper({ product, userId }: EditProductWrapperProps) {
  
  useEffect(() => {
    // Track que se inició edición de producto
    analytics.track('product_edit_started', {
      feature: 'product_management',
      category: 'user_action',
      userFlow: {
        currentAction: 'edit_product',
        previousAction: 'view_product_list'
      },
      metadata: {
        productId: product.id,
        productType: product.product_type,
        isPublished: product.published
      }
    });

    // Configurar localStorage para que el ProductWizard cargue el producto existente
    localStorage.setItem('yaan-current-product-id', product.id);
    localStorage.setItem('yaan-current-product-type', product.product_type);
    localStorage.setItem('yaan-current-product-name', product.name);
    
    // Guardar datos completos del producto para pre-llenar el formulario
    localStorage.setItem('yaan-edit-product-data', JSON.stringify({
      id: product.id,
      name: product.name,
      description: product.description || '',
      preferences: product.preferences || [],
      languages: product.languages || [],
      cover_image_url: product.cover_image_url || '',
      image_url: product.image_url || '',
      video_url: product.video_url || '',
      seasons: product.seasons || [],
      destination: product.destination || [],
      origin: product.origin || [],
      itinerary: product.itinerary || [],
      planned_hotels_or_similar: product.planned_hotels_or_similar || [],
      payment_policy: product.payment_policy || null,
      published: product.published
    }));
    
    console.log('📝 Configurando ProductWizard para edición:', {
      productId: product.id,
      productName: product.name,
      productType: product.product_type
    });

    // Cleanup al desmontar - limpiar datos de edición específicamente
    return () => {
      // Limpiar datos de edición cuando el componente se desmonta
      localStorage.removeItem('yaan-edit-product-data');
    };
  }, [product]);

  // Reutilizar ProductWizard completamente
  // El wizard detectará automáticamente que hay un producto existente
  // y entrará en modo edición en lugar de crear uno nuevo
  return (
    <ProductWizard 
      userId={userId}
      productType={product.product_type}
    />
  );
}