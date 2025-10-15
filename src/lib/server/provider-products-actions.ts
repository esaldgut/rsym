'use server';

import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { getAllActiveProductsByProvider, getProductById } from '@/lib/graphql/operations';
import { getGraphQLClientWithIdToken, debugIdTokenClaims } from './amplify-graphql-client';
import type {
  Product,
  GetAllActiveProductsByProviderQuery,
  GetAllActiveProductsByProviderQueryVariables,
  GetProductByIdQuery
} from '@/generated/graphql';

// SIGUIENDO EXACTAMENTE EL PATTERN DE product-creation-actions.ts
// EXTENDED: Soporte para errores parciales de GraphQL
interface ServerActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  // Warnings para errores parciales de GraphQL (data exists pero con errores)
  warnings?: Array<{
    message: string;
    path?: readonly (string | number)[];
    extensions?: Record<string, unknown>;
  }>;
  hasPartialData?: boolean;
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
    // 1. Validar autenticación
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

    // 3. Debug de claims del idToken (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await debugIdTokenClaims();
    }

    // 4. Crear cliente GraphQL con idToken (necesario para validación de permisos en AppSync)
    // IMPORTANTE: Las queries de provider requieren idToken porque AppSync valida:
    // - cognito:groups debe incluir 'providers'
    // - custom:user_type debe ser 'provider'
    // - custom:provider_is_approved debe ser true
    const client = await getGraphQLClientWithIdToken();

    // 4. Preparar variables para GraphQL
    const variables: GetAllActiveProductsByProviderQueryVariables = {};

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

    // 5. Ejecutar query GraphQL (el idToken ya está configurado en el cliente)
    const result = await client.graphql({
      query: getAllActiveProductsByProvider,
      variables
    });

    // ⚡ MANEJO ROBUSTO DE ERRORES PARCIALES DE GRAPHQL
    // GraphQL puede retornar data + errors simultáneamente (datos parciales)
    // El backend es nuestra fuente de verdad - NUNCA descartamos datos disponibles
    const productConnection = result.data?.getAllActiveProductsByProvider;

    if (result.errors && result.errors.length > 0) {
      // Log detallado de errores para debugging
      console.warn('⚠️ [Server Action] GraphQL retornó errores parciales:',
        result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      );

      // Si tenemos datos parciales, retornarlos con warnings
      if (productConnection && productConnection.items && productConnection.items.length > 0) {
        console.log('✅ [Server Action] Productos obtenidos con warnings:', productConnection.items.length);
        return {
          success: true,
          data: productConnection,
          hasPartialData: true,
          warnings: result.errors.map(e => ({
            message: e.message,
            path: e.path,
            extensions: e.extensions
          }))
        };
      }

      // Si NO hay datos, entonces sí es un error completo
      console.error('❌ [Server Action] Error en GraphQL sin datos:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al ejecutar la operación GraphQL'
      };
    }

    // Caso normal: datos sin errores
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

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error obteniendo productos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
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

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error obteniendo métricas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para obtener un producto específico por ID
 * SIGUIENDO EL PATRÓN ESTABLECIDO
 */
export async function getProviderProductByIdAction(productId: string): Promise<ServerActionResponse<Product>> {
  try {
    // 1. Validar autenticación
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
        error: 'Solo los proveedores pueden acceder a esta información'
      };
    }

    // 3. Validar entrada
    if (!productId?.trim()) {
      return {
        success: false,
        error: 'El ID del producto es requerido'
      };
    }

    console.log('🔍 [Server Action] Obteniendo producto:', productId, 'Usuario:', user.sub);

    // 4. Crear cliente GraphQL con idToken (necesario para validación de permisos en AppSync)
    const client = await getGraphQLClientWithIdToken();

    // 5. Ejecutar query GraphQL (el idToken ya está configurado en el cliente)
    const result = await client.graphql({
      query: getProductById,
      variables: { id: productId }
    });

    // ⚡ MANEJO ROBUSTO DE ERRORES PARCIALES DE GRAPHQL
    const product = result.data?.getProductById;

    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ [Server Action] GraphQL retornó errores parciales al obtener producto:',
        result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      );

      // Si tenemos datos parciales del producto, retornarlos con warnings
      if (product && product.id) {
        console.log('✅ [Server Action] Producto obtenido con warnings:', product.id);
        return {
          success: true,
          data: product,
          hasPartialData: true,
          warnings: result.errors.map(e => ({
            message: e.message,
            path: e.path,
            extensions: e.extensions
          }))
        };
      }

      // Si NO hay datos, entonces sí es un error completo
      console.error('❌ [Server Action] Error en GraphQL get product sin datos:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al obtener el producto'
      };
    }

    // Caso normal: datos sin errores
    if (product) {
      console.log('✅ [Server Action] Producto obtenido:', product.id);
      return {
        success: true,
        data: product
      };
    } else {
      return {
        success: false,
        error: 'Producto no encontrado'
      };
    }

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error obteniendo producto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
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

    // 4. Crear cliente GraphQL con idToken (necesario para validación de permisos en AppSync)
    const client = await getGraphQLClientWithIdToken();

    // 5. GraphQL mutation para eliminar producto
    const deleteProductMutation = `
      mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id)
      }
    `;

    // 6. Ejecutar mutación GraphQL (el idToken ya está configurado en el cliente)
    const result = await client.graphql({
      query: deleteProductMutation,
      variables: { id: productId }
    });

    // ⚡ MANEJO ROBUSTO DE ERRORES PARCIALES DE GRAPHQL
    // Para mutaciones, si hay errores, logueamos pero verificamos si la operación se completó
    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ [Server Action] GraphQL retornó errores en delete:',
        result.errors.map(e => ({
          message: e.message,
          path: e.path
        }))
      );

      // Si la mutación se completó (deleteProduct retorna true), es éxito con warnings
      if (result.data?.deleteProduct) {
        console.log('✅ [Server Action] Producto eliminado con warnings:', productId);
        return {
          success: true,
          data: { productId },
          hasPartialData: true,
          warnings: result.errors.map(e => ({
            message: e.message,
            path: e.path,
            extensions: e.extensions
          }))
        };
      }

      // Si la mutación NO se completó, es un error real
      console.error('❌ [Server Action] Error en GraphQL delete sin confirmación:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al eliminar el producto'
      };
    }

    // Caso normal: mutación sin errores
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

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error eliminando producto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}
