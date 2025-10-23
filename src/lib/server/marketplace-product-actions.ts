'use server';

import { getGraphQLClientWithIdToken } from './amplify-graphql-client';
import { logger } from '@/utils/logger';
import { isValidProductId } from '@/utils/validators';

// GraphQL query for fetching product by ID
const getProduct = `
  query GetProduct($id: ID!) {
    getProduct(id: $id) {
      id
      name
      description
      product_type
      published
      cover_image_url
      image_url
      video_url
      min_product_price
      itinerary
      preferences
      destination {
        place
        placeSub
        coordinates {
          latitude
          longitude
        }
      }
      seasons {
        id
        start_date
        end_date
        number_of_nights
      }
      user_data {
        username
        name
        avatar_url
      }
    }
  }
`;

// Action result type
interface ActionResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  published: boolean;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  min_product_price?: number;
  itinerary?: string;
  preferences?: string[];
  destination?: Array<{
    place?: string;
    placeSub?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  }>;
  seasons?: Array<{
    id: string;
    start_date?: string;
    end_date?: string;
    number_of_nights?: string;
  }>;
  user_data?: {
    username?: string;
    name?: string;
    avatar_url?: string;
  };
}

/**
 * Obtiene un producto individual por ID
 * Usado principalmente para deep linking cuando el producto no está en la lista cargada
 */
export async function getProductByIdAction(
  productId: string
): Promise<ActionResult<{ product: Product | null }>> {
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

    // Ejecutar query
    const result = await client.query({
      query: getProduct,
      variables: {
        id: productId
      }
    });

    // Verificar si hay errores de GraphQL
    if (result.errors && result.errors.length > 0) {
      logger.error('Error GraphQL al obtener producto', {
        errors: result.errors,
        productId
      });

      // Si hay data parcial, usarla
      if (result.data?.getProduct) {
        return {
          success: true,
          data: { product: result.data.getProduct as Product }
        };
      }

      return {
        success: false,
        error: result.errors[0].message || 'Error al obtener el producto'
      };
    }

    // Verificar si el producto existe
    if (!result.data?.getProduct) {
      logger.info('Producto no encontrado', { productId });
      return {
        success: false,
        error: 'Producto no encontrado'
      };
    }

    const product = result.data.getProduct as Product;

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
 */
export async function getProductsByIdsAction(
  productIds: string[]
): Promise<ActionResult<{ products: Product[] }>> {
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

    // Extraer productos exitosos
    const products: Product[] = [];
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