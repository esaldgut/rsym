'use client';

import { useMemo } from 'react';
import { CognitoLocationMap } from './CognitoLocationMap';
import { ProductMap } from '../ProductMap';
import outputs from '../../../../amplify/outputs.json';

/**
 * Hybrid Map Component - Estrategia Híbrida para Mapas
 *
 * Este componente detecta automáticamente si AWS Location Service está configurado
 * y renderiza el componente de mapa apropiado:
 *
 * - CON Cognito Identity Pool configurado: CognitoLocationMap (mapa interactivo con autenticación)
 * - SIN configuración: ProductMap (mapa decorativo)
 *
 * Ventajas:
 * - Funciona inmediatamente sin configuración externa
 * - Usa autenticación Cognito en lugar de API keys (más seguro)
 * - Maneja conversión de datos entre formatos
 * - Fallback automático a mapa decorativo
 */

interface Destination {
  id?: string;
  place?: string;
  placeSub?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  complementary_description?: string;
}

interface HybridProductMapProps {
  destinations: Destination[];
  productType: 'circuit' | 'package';
  productName: string;
}

export function HybridProductMap({ destinations, productType, productName }: HybridProductMapProps) {
  // Detectar si AWS Location Service está configurado con Cognito Identity Pool
  const hasAwsLocationService = useMemo(() => {
    // Verificar que tengamos Identity Pool configurado
    return !!(
      outputs?.auth?.identity_pool_id &&
      outputs?.auth?.user_pool_id &&
      outputs?.auth?.aws_region
    );
  }, []);

  // Convertir Point objects {latitude, longitude} a arrays [lng, lat] para ProductMap
  const destinationsForDecorativeMap = useMemo(() => {
    return destinations.map(dest => ({
      place: dest.place,
      placeSub: dest.placeSub,
      complementaryDescription: dest.complementary_description,
      coordinates: dest.coordinates
        ? [dest.coordinates.longitude, dest.coordinates.latitude] as [number, number]
        : undefined
    }));
  }, [destinations]);

  // Log para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🗺️ [HybridProductMap] Configuración:', {
      hasAwsLocationService,
      componentToRender: hasAwsLocationService ? 'CognitoLocationMap (interactivo con Cognito)' : 'ProductMap (decorativo)',
      destinationsCount: destinations.length,
      productType,
      identityPoolId: outputs?.auth?.identity_pool_id || 'NO CONFIGURADO'
    });
  }

  // Renderizar mapa interactivo si AWS está configurado con Cognito
  if (hasAwsLocationService) {
    return (
      <CognitoLocationMap
        destinations={destinations}
        productType={productType}
        productName={productName}
      />
    );
  }

  // Fallback: renderizar mapa decorativo (no requiere AWS ni autenticación)
  return (
    <ProductMap
      destinations={destinationsForDecorativeMap}
      productType={productType}
      productName={productName}
    />
  );
}
