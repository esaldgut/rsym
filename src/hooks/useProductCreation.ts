'use client';

import { useState, useCallback, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { createProductOfTypeCircuit, createProductOfTypePackage } from '@/lib/graphql/operations';
import { toastManager } from '@/components/ui/Toast';

const client = generateClient();

interface UseProductCreationResult {
  productId: string | null;
  isCreating: boolean;
  error: string | null;
  createProductFromName: (name: string, productType: 'circuit' | 'package') => Promise<string | null>;
}

/**
 * Hook para manejar la creación del producto usando el name del wizard
 * Sigue el flujo correcto: capturar name → crear producto → obtener ID real
 */
export function useProductCreation(): UseProductCreationResult {
  const [productId, setProductId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Intentar recuperar productId de localStorage al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProductId = localStorage.getItem('yaan-current-product-id');
      if (savedProductId) {
        setProductId(savedProductId);
        console.log('📦 ProductId recuperado:', savedProductId);
      }
    }
  }, []);

  const createProductFromName = useCallback(async (
    name: string,
    productType: 'circuit' | 'package'
  ): Promise<string | null> => {
    // Si ya existe un productId, retornarlo
    if (productId) {
      console.log('✅ ProductId existente:', productId);
      return productId;
    }

    setIsCreating(true);
    setError(null);

    try {
      console.log('🚀 Creando producto con nombre:', name, 'tipo:', productType);
      
      let result;
      
      if (productType === 'circuit') {
        result = await client.graphql({
          query: createProductOfTypeCircuit,
          variables: {
            input: { name }
          }
        });
      } else {
        result = await client.graphql({
          query: createProductOfTypePackage,
          variables: {
            input: { name }
          }
        });
      }

      const newProduct = productType === 'circuit' 
        ? result.data?.createProductOfTypeCircuit
        : result.data?.createProductOfTypePackage;

      if (newProduct?.id) {
        const newProductId = newProduct.id;
        setProductId(newProductId);
        
        // Guardar en localStorage para persistencia
        if (typeof window !== 'undefined') {
          localStorage.setItem('yaan-current-product-id', newProductId);
          localStorage.setItem('yaan-current-product-type', productType);
        }
        
        console.log('✅ Producto creado con ID real:', newProductId);
        toastManager.show(`Producto "${name}" inicializado correctamente`, 'success', 3000);
        
        return newProductId;
      } else {
        throw new Error('No se pudo obtener el ID del producto creado');
      }
      
    } catch (err) {
      console.error('❌ Error creando producto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toastManager.show(`Error al crear producto: ${errorMessage}`, 'error', 4000);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [productId]);

  return {
    productId,
    isCreating,
    error,
    createProductFromName
  };
}

/**
 * Hook para limpiar el producto temporal al completar o cancelar
 */
export function useProductCleanup() {
  const cleanupProduct = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('yaan-current-product-id');
      localStorage.removeItem('yaan-current-product-type');
      localStorage.removeItem('yaan-wizard-circuit');
      localStorage.removeItem('yaan-wizard-package');
      console.log('🧹 Limpieza de producto temporal completada');
    }
  }, []);

  return { cleanupProduct };
}