'use server';

import { getIdTokenServer, getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { getAllActiveProductsByProvider } from '@/lib/graphql/operations';
import { runWithAmplifyServerContext } from '@/app/amplify-config-ssr';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import outputs from '../../../amplify/outputs.json';
import type {
  Product,
  ProductConnection,
  ProductMetrics,
  ApiResponse
} from '@/types';

// SIGUIENDO EXACTAMENTE EL PATTERN DE product-creation-actions.ts
type ServerActionResponse<T = unknown> = ApiResponse<T>;

// Las interfaces Product ya vienen de @/types
// Si necesitamos extender con user_data, lo haremos cuando sea necesario

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
        const variables: Record<string, string | number | boolean | Record<string, unknown> | undefined> = {};
        
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

  } catch (error) {
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

  } catch (error) {
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

    // 4. Ejecutar GraphQL siguiendo el patrón establecido
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        const session = await fetchAuthSession(contextSpec);
        
        if (!session.tokens?.idToken) {
          throw new Error('No se encontró ID token en la sesión');
        }

        const idToken = session.tokens.idToken.toString();

        // GraphQL query para obtener producto por ID (según schema correcto)
        const getProductByIdQuery = `
          query GetProductById($id: ID!) {
            getProductById(id: $id) {
              id
              name
              description
              product_type
              status
              published
              cover_image_url
              image_url
              video_url
              created_at
              updated_at
              provider_id
              preferences
              languages
              seasons {
                id
                start_date
                end_date
                category
                allotment
                allotment_remain
                schedules
                number_of_nights
                aditional_services
                prices {
                  id
                  currency
                  price
                  room_name
                  max_adult
                  max_minor
                  children {
                    name
                    min_minor_age
                    max_minor_age
                    child_price
                  }
                }
                extra_prices {
                  id
                  currency
                  price
                  room_name
                  max_adult
                  max_minor
                  children {
                    name
                    min_minor_age
                    max_minor_age
                    child_price
                  }
                }
              }
              destination {
                id
                place
                placeSub
                complementary_description
                coordinates {
                  latitude
                  longitude
                }
              }
              departures {
                specific_dates
                days
                origin {
                  id
                  place
                  placeSub
                  complementary_description
                  coordinates {
                    latitude
                    longitude
                  }
                }
              }
              itinerary
              planned_hotels_or_similar
              payment_policy {
                id
                product_id
                provider_id
                status
                version
                created_at
                updated_at
                options {
                  type
                  description
                  config {
                    cash {
                      discount
                      discount_type
                      deadline_days_to_pay
                      payment_methods
                    }
                    installments {
                      down_payment_before
                      down_payment_type
                      down_payment_after
                      installment_intervals
                      days_before_must_be_settled
                      deadline_days_to_pay
                      payment_methods
                    }
                  }
                  requirements {
                    deadline_days_to_pay
                  }
                  benefits_or_legal {
                    stated
                  }
                }
                general_policies {
                  change_policy {
                    allows_date_chage
                    deadline_days_to_make_change
                  }
                }
              }
              min_product_price
              is_foreign
              user_data {
                sub
                username
                name
                avatar_url
                email
                user_type
              }
            }
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
            query: getProductByIdQuery,
            variables: { id: productId }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const graphqlResult = await response.json();
        console.log('📤 Get Product GraphQL Response:', graphqlResult);

        return graphqlResult;
      }
    });

    if (result.errors) {
      console.error('❌ [Server Action] Error en GraphQL get product:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al obtener el producto'
      };
    }

    const product = result.data?.getProductById;

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

  } catch (error) {
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

  } catch (error) {
    console.error('❌ [Server Action] Error eliminando producto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}
