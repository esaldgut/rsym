'use client';

import { useEffect } from 'react';
import ProductWizard from '@/components/product-wizard/ProductWizard';
import { analytics } from '@/lib/services/analytics-service';
import type { Product } from '@/generated/graphql';

interface EditProductWrapperProps {
  product: Product;
  userId: string;
}

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

    console.log('📝 Iniciando ProductWizard en modo edición:', {
      productId: product.id,
      productName: product.name,
      productType: product.product_type
    });
  }, [product]);

  // Reutilizar ProductWizard con datos sincronizados vía props
  // NO usar localStorage para evitar race conditions
  return (
    <ProductWizard
      userId={userId}
      productType={product.product_type}
      editMode={true}
      initialProduct={product}
    />
  );
}
