'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import { logger } from '../utils/logger';
import { canExecuteGraphQLOperation } from '../lib/permission-matrix';
import { useAmplifyAuth } from './useAmplifyAuth';
import type {
  MarketplaceFeed,
  Circuit,
  Package,
  Moment,
  CreateMomentInput,
} from '../types/graphql';

// Cliente GraphQL con configuración robusta
// CRÍTICO: Este cliente usará ID Token gracias a la configuración authTokenType
// Los resolvers AppSync podrán acceder a identity claims como sub, email, custom:user_type, etc.
const client = generateClient();

// Función helper para manejar errores GraphQL
function handleGraphQLError(error: any, operation: string) {
  logger.error(`GraphQL error in ${operation}`, { 
    errorType: error?.errors?.[0]?.errorType,
    message: error?.message 
  });
  
  if (error?.errors) {
    const firstError = error.errors[0];
    if (firstError?.errorType === 'Unauthorized') {
      throw new Error('No autorizado. Verifica tu sesión.');
    }
    if (firstError?.errorType === 'ValidationException') {
      throw new Error('Error de validación en la consulta.');
    }
    throw new Error(firstError?.message || 'Error en la API GraphQL');
  }
  
  if (error?.name === 'NetworkError') {
    throw new Error('Error de red. Verifica tu conexión.');
  }
  
  throw new Error(error?.message || 'Error desconocido en la API');
}

// Hook para marketplace feed con validación de permisos
export function useMarketplaceFeed() {
  const { userType } = useAmplifyAuth();
  
  return useQuery({
    queryKey: ['marketplace', 'feed'],
    queryFn: async () => {
      // Validar permisos antes de ejecutar la query
      if (!userType || !canExecuteGraphQLOperation(userType, 'getAllMarketplaceFeed')) {
        throw new Error('Sin permisos para acceder al marketplace');
      }
      
      try {
        const result = await client.graphql({
          query: `
            query GetAllMarketplaceFeed {
              getAllMarketplaceFeed {
                id
                name
                description
                cover_image_url
                location
                product_pricing
                startDate
                preferences
                collection_type
                provider_id
                published
                followerNumber
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
        
        logger.graphql('getAllMarketplaceFeed', true);
        return result.data.getAllMarketplaceFeed as MarketplaceFeed[];
      } catch (error) {
        logger.graphql('getAllMarketplaceFeed', false);
        handleGraphQLError(error, 'getAllMarketplaceFeed');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      logger.debug(`Retry attempt ${failureCount} for marketplace feed`, { error: error?.message });
      
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

// Hook para circuitos activos
export function useActiveCircuits() {
  return useQuery({
    queryKey: ['circuits', 'active'],
    queryFn: async () => {
      try {
        const result = await client.graphql({
          query: `
            query GetAllActiveCircuits {
              getAllActiveCircuits {
                id
                name
                description
                cover_image_url
                image_url
                startDate
                endDate
                preferences
                language
                included_services
                provider_id
                published
                status
                created_at
                destination {
                  place
                  placeSub
                  coordinates
                  complementaryDescription
                }
              }
            }
          `
        });
        
        logger.graphql('getAllActiveCircuits', true);
        return result.data.getAllActiveCircuits as Circuit[];
      } catch (error) {
        logger.graphql('getAllActiveCircuits', false);
        handleGraphQLError(error, 'getAllActiveCircuits');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
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

// Hook para packages activos
export function useActivePackages() {
  return useQuery({
    queryKey: ['packages', 'active'],
    queryFn: async () => {
      try {
        const result = await client.graphql({
          query: `
            query GetAllActivePackages {
              getAllActivePackages {
                id
                name
                description
                cover_image_url
                image_url
                startDate
                endDate
                numberOfNights
                capacity
                categories
                preferences
                language
                included_services
                aditional_services
                provider_id
                published
                status
                created_at
                destination {
                  place
                  placeSub
                  coordinates
                  complementaryDescription
                }
                origin {
                  place
                  placeSub
                  coordinates
                }
                prices {
                  id
                  price
                  currency
                  roomName
                }
              }
            }
          `
        });
        
        logger.graphql('getAllActivePackages', true);
        return result.data.getAllActivePackages as Package[];
      } catch (error) {
        logger.graphql('getAllActivePackages', false);
        handleGraphQLError(error, 'getAllActivePackages');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
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
    retry: (failureCount, error: any) => {
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
    onSuccess: (data) => {
      logger.info('Like actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['moments', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'feed'] });
    },
    onError: (error) => {
      logger.error('Error en toggle like', { error: error instanceof Error ? error.message : 'Unknown error' });
    },
  });
}
