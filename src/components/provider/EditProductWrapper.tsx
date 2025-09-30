'use client';

import { useEffect } from 'react';
import ProductWizard from '@/components/product-wizard/ProductWizard';
import { analytics } from '@/lib/services/analytics-service';

interface Product {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  status: string;
  published: boolean;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  created_at: string;
  updated_at: string;
  provider_id: string;
  preferences?: string[];
  languages?: string[];
  seasons?: Array<{
    id: string;
    start_date: string;
    end_date: string;
    category: string;
    allotment: number;
    allotment_remain: number;
    schedules?: string;
    number_of_nights?: string;
    aditional_services?: string;
    prices?: Array<{
      id: string;
      currency: string;
      price: number;
      room_name: string;
      max_adult: number;
      max_minor: number;
      children: Array<{
        name: string;
        min_minor_age: number;
        max_minor_age: number;
        child_price: number;
      }>;
    }>;
    extra_prices?: Array<{
      id: string;
      currency: string;
      price: number;
      room_name: string;
      max_adult: number;
      max_minor: number;
      children: Array<{
        name: string;
        min_minor_age: number;
        max_minor_age: number;
        child_price: number;
      }>;
    }>;
  }>;
  destination?: Array<{
    id?: string;
    place: string;
    placeSub: string;
    complementary_description?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }>;
  departures?: Array<{
    specific_dates?: string[];
    days?: string[];
    origin?: Array<{
      id?: string;
      place: string;
      placeSub: string;
      complementary_description?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    }>;
  }>;
  itinerary?: string;
  planned_hotels_or_similar?: string[];
  payment_policy?: {
    id: string;
    product_id: string;
    provider_id: string;
    status: string;
    version: number;
    created_at: string;
    updated_at: string;
    options: Array<{
      type: string;
      description: string;
      config: {
        cash?: {
          discount: number;
          discount_type: string;
          deadline_days_to_pay: number;
          payment_methods: string[];
        };
        installments?: {
          down_payment_before: number;
          down_payment_type: string;
          down_payment_after: number;
          installment_intervals: string;
          days_before_must_be_settled: number;
          deadline_days_to_pay: number;
          payment_methods: string[];
        };
      };
      requirements: {
        deadline_days_to_pay: number;
      };
      benefits_or_legal?: Array<{
        stated: string;
      }>;
    }>;
    general_policies: {
      change_policy: {
        allows_date_chage: boolean;
        deadline_days_to_make_change: number;
      };
    };
  };
  min_product_price?: number;
  is_foreign?: boolean;
}

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
      departures: product.departures || [],
      origin: product.origin || [],
      itinerary: product.itinerary || '',  // Corregido: itinerary es string, no array
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
