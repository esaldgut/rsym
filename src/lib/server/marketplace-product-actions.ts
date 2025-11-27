/**
 * Marketplace Product Actions - Server Actions for Product Queries
 *
 * ARQUITECTURA (Migrado a GraphQL Code Generator):
 * ✅ Usa tipos generados desde @/generated/graphql.ts (ÚNICA FUENTE DE VERDAD)
 * ✅ Importa query desde @/graphql/operations.ts (CORRECTO - exports .graphql files)
 * ✅ Type-safe end-to-end: Variables → Query → Response
 * ✅ No usa `any` types - strict TypeScript mode
 * ✅ Alineado con MIGRATION-GRAPHQL-CODEGEN.md
 *
 * PATRÓN:
 * 1. Definir variables tipadas: GetProductByIdQueryVariables
 * 2. Ejecutar query con tipo genérico: client.graphql<GetProductByIdQuery>()
 * 3. Retornar tipo derivado: NonNullable<GetProductByIdQuery['getProductById']>
 *
 * Ver: docs/MIGRATION-GRAPHQL-CODEGEN.md para pipeline completo
 */
'use server';

import { getGraphQLClientWithIdToken } from './amplify-graphql-client';
import { logger } from '@/utils/logger';
import { isValidProductId } from '@/utils/validators';
// ✅ Usar imports desde GraphQL Code Generator (fuente única de verdad)
import { getProductById } from '@/graphql/operations';
import type {
  GetProductByIdQuery,
  GetProductByIdQueryVariables,
  Product
} from '@/generated/graphql';

// Action result type with strict typing (no any)
interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Type alias for Product from generated GraphQL types
 * Ensures type safety and alignment with GraphQL schema
 */
type ProductData = NonNullable<GetProductByIdQuery['getProductById']>;

/**
 * Obtiene un producto individual por ID
 * Usado principalmente para deep linking cuando el producto no está en la lista cargada
 *
 * @param productId - UUID del producto en formato válido
 * @returns ActionResult con ProductData tipado desde GraphQL Code Generator
 *
 * @example
 * ```typescript
 * const result = await getProductByIdAction('550e8400-e29b-41d4-a716-446655440000');
 * if (result.success && result.data?.product) {
 *   console.log(result.data.product.name); // TypeScript sabe todos los campos
 * }
 * ```
 */
export async function getProductByIdAction(
  productId: string
): Promise<ActionResult<{ product: ProductData | null }>> {
  try {
    // Validar el ID del producto
    if (!isValidProductId(productId)) {
      logger.warn('ID de producto inválido', { productId });
      return {
        success: false,
        error: 'ID de producto inválido'
      };
    }

    logger.info('Obteniendo producto por ID', { productId });

    // Obtener cliente GraphQL con autenticación
    const client = await getGraphQLClientWithIdToken();

    // Definir variables tipadas con GraphQL Code Generator
    const variables: GetProductByIdQueryVariables = {
      id: productId
    };

    // Ejecutar query con tipos generados
    const result = await client.graphql<GetProductByIdQuery>({
      query: getProductById,
      variables
    });

    // Verificar si hay errores de GraphQL
    if (result.errors && result.errors.length > 0) {
      logger.error('Error GraphQL al obtener producto', {
        errors: result.errors,
        productId
      });

      // Si hay data parcial, usarla (tipo ya inferido por GraphQL Code Generator)
      if (result.data?.getProductById) {
        return {
          success: true,
          data: { product: result.data.getProductById }
        };
      }

      return {
        success: false,
        error: result.errors[0].message || 'Error al obtener el producto'
      };
    }

    // Verificar si el producto existe
    if (!result.data?.getProductById) {
      logger.info('Producto no encontrado', { productId });
      return {
        success: false,
        error: 'Producto no encontrado'
      };
    }

    // Producto tipado automáticamente por GraphQL Code Generator
    const product = result.data.getProductById;

    // Solo devolver productos publicados (a menos que sea el owner)
    if (!product.published) {
      // TODO: Verificar si el usuario actual es el owner
      logger.info('Producto no publicado', { productId });
      return {
        success: false,
        error: 'Este producto no está disponible'
      };
    }

    logger.info('Producto obtenido exitosamente', {
      productId,
      productName: product.name
    });

    return {
      success: true,
      data: { product }
    };
  } catch (error) {
    logger.error('Error al obtener producto por ID', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      productId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener el producto'
    };
  }
}

/**
 * Obtiene múltiples productos por sus IDs
 * Útil para precargar productos desde deep links
 *
 * @param productIds - Array de UUIDs de productos
 * @returns ActionResult con array de ProductData tipados desde GraphQL Code Generator
 */
export async function getProductsByIdsAction(
  productIds: string[]
): Promise<ActionResult<{ products: ProductData[] }>> {
  try {
    // Validar todos los IDs
    const validIds = productIds.filter(isValidProductId);

    if (validIds.length === 0) {
      return {
        success: false,
        error: 'No se proporcionaron IDs válidos'
      };
    }

    logger.info('Obteniendo múltiples productos', {
      count: validIds.length,
      ids: validIds
    });

    // Obtener productos en paralelo
    const promises = validIds.map(id => getProductByIdAction(id));
    const results = await Promise.allSettled(promises);

    // Extraer productos exitosos (tipados por GraphQL Code Generator)
    const products: ProductData[] = [];
    let errors = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success && result.value.data?.product) {
        products.push(result.value.data.product);
      } else {
        errors++;
        logger.warn('Fallo al obtener producto', {
          productId: validIds[index],
          reason: result.status === 'rejected' ? result.reason : 'No encontrado'
        });
      }
    });

    logger.info('Productos obtenidos', {
      requested: validIds.length,
      found: products.length,
      errors
    });

    return {
      success: true,
      data: { products }
    };
  } catch (error) {
    logger.error('Error al obtener múltiples productos', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      productIds
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener los productos'
    };
  }
}

/**
 * Valida si un producto es accesible para deep linking
 * Verifica que esté publicado y disponible
 */
export async function validateProductAccessAction(
  productId: string
): Promise<ActionResult<{ isAccessible: boolean; productType?: string }>> {
  try {
    if (!isValidProductId(productId)) {
      return {
        success: true,
        data: { isAccessible: false }
      };
    }

    const result = await getProductByIdAction(productId);

    if (result.success && result.data?.product) {
      return {
        success: true,
        data: {
          isAccessible: true,
          productType: result.data.product.product_type
        }
      };
    }

    return {
      success: true,
      data: { isAccessible: false }
    };
  } catch (error) {
    logger.error('Error al validar acceso a producto', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      productId
    });

    return {
      success: true,
      data: { isAccessible: false }
    };
  }
}

/**
 * Get Product Seasons (Active Pricing Periods)
 *
 * Retrieves all active seasons/pricing periods for a product.
 * Used for change date functionality to show available date ranges and prices.
 *
 * @param productId - Product ID
 * @returns List of active seasons with pricing information
 */
export async function getProductSeasonsAction(
  productId: string
): Promise<ServerActionResponse<Array<{
  id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  adult_base_price: number;
  child_ranges?: Array<{
    name: string;
    min_minor_age: number;
    max_minor_age: number;
    child_price: number;
  }>;
}>>> {
  console.log('[getProductSeasonsAction] 📦 Obteniendo seasons para producto:', productId);

  try {
    // Get GraphQL client
    const client = await getGraphQLClientWithIdToken();

    // GraphQL query to get product with seasons
    const getProductWithSeasons = /* GraphQL */ `
      query GetProductWithSeasons($id: ID!) {
        getProduct(id: $id) {
          id
          name
          product_type
          seasons {
            id
            season_name
            start_date
            end_date
            is_active
            adult_base_price
            child_ranges {
              name
              min_minor_age
              max_minor_age
              child_price
            }
          }
        }
      }
    `;

    const result = await client.graphql({
      query: getProductWithSeasons,
      variables: { id: productId }
    });

    if (!result.data?.getProduct) {
      console.error('[getProductSeasonsAction] ❌ Producto no encontrado');
      return {
        success: false,
        error: 'Producto no encontrado'
      };
    }

    const seasons = result.data.getProduct.seasons || [];

    console.log('[getProductSeasonsAction] ✅ Seasons obtenidas:', seasons.length);

    return {
      success: true,
      data: seasons
    };

  } catch (error) {
    console.error('[getProductSeasonsAction] ❌ Error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener temporadas'
    };
  }
}