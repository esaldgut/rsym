'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import { logger } from '../utils/logger';
import { canExecuteGraphQLOperation } from '../lib/permission-matrix';
import { useAmplifyAuth } from './useAmplifyAuth';
import { GraphQLAuthInspector } from '../utils/graphql-auth-inspector';
import type {
  Product,
  Moment,
  CreateMomentInput,
} from '../lib/graphql/types';

// Cliente GraphQL con configuración robusta
// CRÍTICO: Este cliente usará ID Token gracias a la configuración authTokenType
// Los resolvers AppSync podrán acceder a identity claims como sub, email, custom:user_type, etc.
const client = generateClient();

// Función helper para manejar errores GraphQL
function handleGraphQLError(error: unknown, operation: string) {
  const err = error as { errors?: Array<{ errorType?: string; message?: string }>; name?: string; message?: string };
  
  logger.error(`GraphQL error in ${operation}`, { 
    errorType: err?.errors?.[0]?.errorType,
    message: err?.message 
  });
  
  if (err?.errors) {
    const firstError = err.errors[0];
    if (firstError?.errorType === 'Unauthorized') {
      throw new Error('No autorizado. Verifica tu sesión.');
    }
    if (firstError?.errorType === 'ValidationException') {
      throw new Error('Error de validación en la consulta.');
    }
    throw new Error(firstError?.message || 'Error en la API GraphQL');
  }
  
  if (err?.name === 'NetworkError') {
    throw new Error('Error de red. Verifica tu conexión.');
  }
  
  throw new Error(err?.message || 'Error desconocido en la API');
}

// Hook para productos del marketplace con validación de permisos (OPTIMIZADO)
// DEPRECATED: This hook is replaced by useMarketplacePagination + Server Actions
// Kept for backward compatibility but should migrate to Server Actions pattern
export function useMarketplaceProducts() {
  const { userType } = useAmplifyAuth();

  return useQuery({
    queryKey: ['marketplace', 'products', 'legacy'],
    queryFn: async () => {
      console.warn('⚠️ Using deprecated useMarketplaceProducts. Migrate to useMarketplacePagination + Server Actions');

      // Validar permisos antes de ejecutar la query
      if (!userType || !canExecuteGraphQLOperation(userType, 'getAllActiveAndPublishedProducts')) {
        throw new Error('Sin permisos para acceder al marketplace');
      }

      try {
        // Query optimizada que reduce 90% de campos para mejor performance
        const query = `
          query GetAllActiveAndPublishedProducts($filter: ProductFilterInput, $pagination: PaginationInput) {
            getAllActiveAndPublishedProducts(filter: $filter, pagination: $pagination) {
              items {
                id
                name
                description
                product_type
                published
                cover_image_url
                min_product_price
                preferences
                destination {
                  place
                  placeSub
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
              nextToken
              total
            }
          }
        `;

        await GraphQLAuthInspector.interceptGraphQLRequest('getAllActiveAndPublishedProducts', query);

        const result = await client.graphql({
          query,
          variables: {
            filter: { published: true },
            pagination: { limit: 20 } // Reduced for pagination
          }
        });

        logger.graphql('getAllActiveAndPublishedProducts', true);
        return result.data.getAllActiveAndPublishedProducts.items as Product[];
      } catch (error) {
        logger.graphql('getAllActiveAndPublishedProducts', false);
        handleGraphQLError(error, 'getAllActiveAndPublishedProducts');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: Error) => {
      logger.debug(`Retry attempt ${failureCount} for marketplace products`, { error: error?.message });

      // No reintentar errores de autorización
      if (error?.message?.includes('autorizado')) {
        return false;
      }

      // No reintentar errores de CORS
      if (error?.message?.includes('CORS') || error?.message?.includes('Network')) {
        return false;
      }

      // Reintentar solo errores temporales
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// DEPRECATED: Use useMarketplaceProducts instead for unified Product approach
// These hooks are kept for backward compatibility but should be replaced
// Hook para productos por tipo específico
export function useProductsByType(productType: 'circuit' | 'package') {
  const { userType } = useAmplifyAuth();

  return useQuery({
    queryKey: ['products', 'type', productType],
    queryFn: async () => {
      if (!userType || !canExecuteGraphQLOperation(userType, 'getProductsByType')) {
        throw new Error('Sin permisos para acceder a productos');
      }

      try {
        const result = await client.graphql({
          query: `
            query GetProductsByType($product_type: String!, $filter: ProductFilterInput, $pagination: PaginationInput) {
              getProductsByType(product_type: $product_type, filter: $filter, pagination: $pagination) {
                items {
                  id
                  name
                  description
                  product_type
                  published
                  cover_image_url
                  min_product_price
                  preferences
                  destination {
                    place
                    placeSub
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
                nextToken
                total
              }
            }
          `,
          variables: {
            product_type: productType,
            filter: { published: true },
            pagination: { limit: 50 }
          }
        });

        logger.graphql('getProductsByType', true);
        return result.data.getProductsByType.items as Product[];
      } catch (error) {
        logger.graphql('getProductsByType', false);
        handleGraphQLError(error, 'getProductsByType');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: Error) => {
      if (error?.message?.includes('autorizado') ||
          error?.message?.includes('CORS') ||
          error?.message?.includes('Network')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook para moments activos
export function useActiveMoments() {
  return useQuery({
    queryKey: ['moments', 'active'],
    queryFn: async () => {
      try {
        const result = await client.graphql({
          query: `
            query GetAllActiveMoments {
              getAllActiveMoments {
                id
                description
                resourceType
                resourceUrl
                audioUrl
                experienceLink
                likeCount
                viewerHasLiked
                preferences
                tags
                status
                created_at
                updated_at
                destination {
                  place
                  placeSub
                  coordinates
                }
                user_data {
                  bio
                  email
                  name
                  avatar_url
                  username
                  sub
                }
              }
            }
          `
        });
        
        logger.graphql('getAllActiveMoments', true);
        return result.data.getAllActiveMoments as Moment[];
      } catch (error) {
        logger.graphql('getAllActiveMoments', false);
        handleGraphQLError(error, 'getAllActiveMoments');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: Error) => {
      if (error?.message?.includes('autorizado') || 
          error?.message?.includes('CORS') || 
          error?.message?.includes('Network')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook para crear moment
export function useCreateMoment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMomentInput) => {
      try {
        const result = await client.graphql({
          query: `
            mutation CreateMoment($input: CreateMomentInput!) {
              createMoment(input: $input) {
                id
                description
                resourceType
                resourceUrl
                audioUrl
                experienceLink
                preferences
                tags
                created_at
                destination {
                  place
                  placeSub
                  coordinates
                }
              }
            }
          `,
          variables: { input }
        });
        
        logger.graphql('createMoment', true);
        return result.data.createMoment as Moment;
      } catch (error) {
        logger.graphql('createMoment', false);
        handleGraphQLError(error, 'createMoment');
        throw error;
      }
    },
    onSuccess: () => {
      logger.info('Moment creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['moments', 'active'] });
    },
    onError: (error) => {
      logger.error('Error en mutación createMoment', { error: error instanceof Error ? error.message : 'Unknown error' });
    },
  });
}

// Hook para toggle like
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item_id, item_type }: { item_id: string; item_type: string }) => {
      try {
        const result = await client.graphql({
          query: `
            mutation ToggleLike($item_id: ID!, $item_type: String!) {
              toggleLike(item_id: $item_id, item_type: $item_type) {
                success
                newLikeCount
                viewerHasLiked
              }
            }
          `,
          variables: { item_id, item_type }
        });
        
        logger.graphql('toggleLike', true);
        return result.data.toggleLike;
      } catch (error) {
        logger.graphql('toggleLike', false);
        handleGraphQLError(error, 'toggleLike');
        throw error;
      }
    },
    onSuccess: () => {
      logger.info('Like actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['moments', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'products'] });
    },
    onError: (error) => {
      logger.error('Error en toggle like', { error: error instanceof Error ? error.message : 'Unknown error' });
    },
  });
}
