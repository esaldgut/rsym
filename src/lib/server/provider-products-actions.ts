'use server';

import { getIdTokenServer, getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { getAllActiveProductsByProvider } from '@/lib/graphql/operations';
import { runWithAmplifyServerContext } from '@/app/amplify-config-ssr';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import outputs from '../../../amplify/outputs.json';

// SIGUIENDO EXACTAMENTE EL PATTERN DE product-creation-actions.ts
interface ServerActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  status: string;
  published: boolean;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
  seasons?: Array<{
    id: string;
    start_date: string;
    end_date: string;
    category: string;
    allotment: number;
    allotment_remain: number;
  }>;
  destination?: Array<{
    place: string;
    placeSub: string;
  }>;
  min_product_price?: number;
}

interface ProductConnection {
  items: Product[];
  nextToken?: string;
  total: number;
}

interface ProductMetrics {
  total: number;
  published: number;
  drafts: number;
  circuits: number;
  packages: number;
  totalViews: number;
}

interface GetProductsParams {
  pagination?: {
    limit?: number;
    nextToken?: string;
  };
  filter?: {
    product_type?: string;
    status?: string;
    published?: boolean;
  };
}

/**
 * Server Action para obtener productos del proveedor con paginación
 * SIGUIENDO EL PATRÓN ESTABLECIDO DE product-creation-actions.ts
 */
export async function getProviderProductsAction(params: GetProductsParams = {}): Promise<ServerActionResponse<ProductConnection>> {
  try {
    // 1. Validar autenticación (EXACTO COMO product-creation-actions.ts)
    const idToken = await getIdTokenServer();
    if (!idToken) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario'
      };
    }

    // 2. Validar permisos de proveedor (EXACTO COMO product-creation-actions.ts)
    const userType = user.attributes?.['custom:user_type'];
    if (userType !== 'provider') {
      console.log('❌ [Server Action] Usuario no es provider:', userType, 'User:', user.username);
      return {
        success: false,
        error: 'Solo los proveedores pueden acceder a esta información'
      };
    }

    console.log('🚀 [Server Action] Obteniendo productos del proveedor:', user.sub);

    // 3. Ejecutar GraphQL usando el patrón establecido
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        // 1. Obtener la sesión de autenticación con ID token
        const session = await fetchAuthSession(contextSpec);
        
        if (!session.tokens?.idToken) {
          throw new Error('No se encontró ID token en la sesión');
        }

        const idToken = session.tokens.idToken.toString();
        console.log('🔑 ID Token obtenido:', idToken.substring(0, 50) + '...');
        console.log('🚀 AppSync URL:', outputs.data.url);

        // 2. Preparar variables para GraphQL
        const variables: any = {};
        
        if (params.pagination) {
          variables.pagination = {
            limit: params.pagination.limit || 12,
            ...(params.pagination.nextToken && { nextToken: params.pagination.nextToken })
          };
        } else {
          variables.pagination = { limit: 12 };
        }

        // Solo incluir filtro si hay parámetros de filtro
        if (params.filter && Object.keys(params.filter).length > 0) {
          variables.filter = params.filter;
        }

        console.log('📋 Variables para GraphQL:', JSON.stringify(variables, null, 2));

        // 3. Ejecutar GraphQL directamente con fetch - SIN generateClient
        const response = await fetch(outputs.data.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken,
            'x-api-key': outputs.data.api_key || ''
          },
          body: JSON.stringify({
            query: getAllActiveProductsByProvider,
            variables
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const graphqlResult = await response.json();
        console.log('📤 GraphQL Response:', graphqlResult);

        return graphqlResult;
      }
    });

    if (result.errors) {
      console.error('❌ [Server Action] Error en GraphQL:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al ejecutar la operación GraphQL'
      };
    }

    const productConnection = result.data?.getAllActiveProductsByProvider;

    if (productConnection) {
      console.log('✅ [Server Action] Productos obtenidos:', productConnection.items?.length || 0);
      return {
        success: true,
        data: productConnection
      };
    } else {
      return {
        success: false,
        error: 'No se pudieron obtener los productos'
      };
    }

  } catch (error: any) {
    console.error('❌ [Server Action] Error obteniendo productos:', error);
    return {
      success: false,
      error: error.message || 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para obtener métricas del proveedor
 * SIGUIENDO EL PATRÓN ESTABLECIDO
 */
export async function getProviderMetricsAction(): Promise<ServerActionResponse<ProductMetrics>> {
  try {
    // Usar la misma función pero con límite alto para obtener todos los productos
    const result = await getProviderProductsAction({
      pagination: { limit: 1000 }
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'No se pudieron obtener las métricas'
      };
    }

    const products = result.data.items;
    const total = result.data.total || products.length;

    // Calcular métricas
    const metrics: ProductMetrics = {
      total,
      published: products.filter((p: Product) => p.published).length,
      drafts: products.filter((p: Product) => !p.published).length,
      circuits: products.filter((p: Product) => p.product_type === 'circuit').length,
      packages: products.filter((p: Product) => p.product_type === 'package').length,
      totalViews: 0 // Placeholder - integrar con analytics más adelante
    };

    return {
      success: true,
      data: metrics
    };

  } catch (error: any) {
    console.error('❌ [Server Action] Error obteniendo métricas:', error);
    return {
      success: false,
      error: error.message || 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para eliminar un producto
 * SIGUIENDO EL PATRÓN ESTABLECIDO
 */
export async function deleteProductAction(productId: string): Promise<ServerActionResponse<{ productId: string }>> {
  try {
    // 1. Validar autenticación
    const idToken = await getIdTokenServer();
    if (!idToken) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario'
      };
    }

    // 2. Validar permisos de proveedor
    const userType = user.attributes?.['custom:user_type'];
    if (userType !== 'provider') {
      return {
        success: false,
        error: 'Solo los proveedores pueden eliminar productos'
      };
    }

    // 3. Validar entrada
    if (!productId?.trim()) {
      return {
        success: false,
        error: 'El ID del producto es requerido'
      };
    }

    console.log('🗑️ [Server Action] Eliminando producto:', productId, 'Usuario:', user.sub);

    // 4. Ejecutar GraphQL siguiendo el patrón establecido
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        const session = await fetchAuthSession(contextSpec);
        
        if (!session.tokens?.idToken) {
          throw new Error('No se encontró ID token en la sesión');
        }

        const idToken = session.tokens.idToken.toString();

        // GraphQL mutation para eliminar producto
        const deleteProductMutation = `
          mutation DeleteProduct($id: ID!) {
            deleteProduct(id: $id)
          }
        `;

        const response = await fetch(outputs.data.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken,
            'x-api-key': outputs.data.api_key || ''
          },
          body: JSON.stringify({
            query: deleteProductMutation,
            variables: { id: productId }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const graphqlResult = await response.json();
        console.log('📤 Delete GraphQL Response:', graphqlResult);

        return graphqlResult;
      }
    });

    if (result.errors) {
      console.error('❌ [Server Action] Error en GraphQL delete:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al eliminar el producto'
      };
    }

    if (result.data?.deleteProduct) {
      console.log('✅ [Server Action] Producto eliminado:', productId);
      return {
        success: true,
        data: { productId }
      };
    } else {
      return {
        success: false,
        error: 'No se pudo confirmar la eliminación del producto'
      };
    }

  } catch (error: any) {
    console.error('❌ [Server Action] Error eliminando producto:', error);
    return {
      success: false,
      error: error.message || 'Error interno del servidor'
    };
  }
}
