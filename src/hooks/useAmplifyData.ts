'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type {
  MarketplaceFeed,
  Circuit,
  Package,
  Moment,
  CreateMomentInput,
} from '../types/graphql';

// Cliente GraphQL con configuración robusta
const client = generateClient();

// Función helper para manejar errores GraphQL
function handleGraphQLError(error: any) {
  console.error('GraphQL Error Details:', error);
  
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

// Hook para marketplace feed con manejo robusto de errores
export function useMarketplaceFeed() {
  return useQuery({
    queryKey: ['marketplace', 'feed'],
    queryFn: async () => {
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
        
        console.log('Marketplace data received:', result.data);
        return result.data.getAllMarketplaceFeed as MarketplaceFeed[];
      } catch (error) {
        handleGraphQLError(error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      console.log(`Retry attempt ${failureCount} for marketplace feed:`, error);
      
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
        
        console.log('Circuits data received:', result.data);
        return result.data.getAllActiveCircuits as Circuit[];
      } catch (error) {
        handleGraphQLError(error);
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
        
        console.log('Packages data received:', result.data);
        return result.data.getAllActivePackages as Package[];
      } catch (error) {
        handleGraphQLError(error);
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
        
        console.log('Moments data received:', result.data);
        return result.data.getAllActiveMoments as Moment[];
      } catch (error) {
        handleGraphQLError(error);
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
        
        console.log('Moment created:', result.data);
        return result.data.createMoment as Moment;
      } catch (error) {
        handleGraphQLError(error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Moment creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['moments', 'active'] });
    },
    onError: (error) => {
      console.error('Error en mutación createMoment:', error);
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
        
        console.log('Like toggled:', result.data);
        return result.data.toggleLike;
      } catch (error) {
        handleGraphQLError(error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Like actualizado:', data);
      queryClient.invalidateQueries({ queryKey: ['moments', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'feed'] });
    },
    onError: (error) => {
      console.error('Error en like:', error);
    },
  });
}
