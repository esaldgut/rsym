'use server';

import { getGraphQLClientWithCookies } from './amplify-graphql-client';
import type {
  GetUserStatsQuery,
  GetUserStatsQueryVariables,
  GetAllMomentsByUserQuery
} from '@/generated/graphql';

/**
 * Server Action para obtener las estadísticas del usuario
 * Utiliza el cliente GraphQL con cookies para autenticación
 */
export async function getUserStats(userId: string): Promise<GetUserStatsQuery['getUserStats'] | null> {
  try {
    const client = await getGraphQLClientWithCookies();

    // Query GraphQL para obtener estadísticas
    const getUserStatsQuery = /* GraphQL */ `
      query getUserStats($userId: ID!) {
        getUserStats(userId: $userId) {
          blockedUsersCount
          connectionsCount
          followersCount
          followingCount
          pendingRequestsReceived
          pendingRequestsSent
          userId
        }
      }
    `;

    const variables: GetUserStatsQueryVariables = {
      userId
    };

    const result = await client.graphql({
      query: getUserStatsQuery,
      variables
    });

    if ('data' in result && result.data?.getUserStats) {
      return result.data.getUserStats;
    }

    console.warn('No se pudieron obtener las estadísticas del usuario:', userId);
    return null;
  } catch (error) {
    console.error('Error obteniendo estadísticas del usuario:', error);
    return null;
  }
}

/**
 * Server Action para obtener los momentos del usuario actual
 * Devuelve el conteo de publicaciones (momentos)
 */
export async function getUserMomentsCount(): Promise<number> {
  try {
    const client = await getGraphQLClientWithCookies();

    // Query GraphQL para obtener momentos del usuario
    const getAllMomentsByUserQuery = /* GraphQL */ `
      query getAllMomentsByUser {
        getAllMomentsByUser {
          id
        }
      }
    `;

    const result = await client.graphql({
      query: getAllMomentsByUserQuery
    });

    // Verificar si hay errores en la respuesta GraphQL
    if ('errors' in result && result.errors && result.errors.length > 0) {
      // Log detallado solo del primer error para debugging
      const firstError = result.errors[0];
      console.warn('⚠️ GraphQL error al obtener momentos:', {
        message: firstError.message,
        errorType: firstError.errorType,
        path: firstError.path
      });

      // Si es un error de MappingTemplate, es un problema del backend
      if (firstError.errorType === 'MappingTemplate') {
        console.log('ℹ️ Error de configuración en el backend, retornando 0 momentos');
        return 0;
      }

      return 0;
    }

    // Verificar si hay datos
    if ('data' in result && result.data) {
      const moments = result.data.getAllMomentsByUser;

      if (Array.isArray(moments)) {
        const momentsCount = moments.length;
        console.log(`✅ Momentos del usuario obtenidos: ${momentsCount}`);
        return momentsCount;
      }

      // Si es null (no hay momentos pero la query fue exitosa)
      if (moments === null) {
        console.log('ℹ️ El usuario no tiene momentos publicados aún');
        return 0;
      }
    }

    console.log('ℹ️ Respuesta vacía al obtener momentos');
    return 0;
  } catch (error) {
    // Solo loguear errores reales de JavaScript/Network
    console.error('❌ Error inesperado obteniendo momentos:', error);
    return 0;
  }
}

/**
 * Server Action para obtener estadísticas completas del perfil
 * Combina getUserStats con el conteo de momentos
 */
export async function getProfileStats(userId: string) {
  try {
    // Ejecutar ambas queries en paralelo para mejor performance
    const [userStats, momentsCount] = await Promise.all([
      getUserStats(userId),
      getUserMomentsCount()
    ]);

    if (!userStats) {
      // Si no hay stats, devolver valores por defecto
      return {
        posts: momentsCount,
        followers: 0,
        following: 0,
        likes: 0, // TODO: Implementar cuando esté disponible en el schema
        connections: 0
      };
    }

    // Combinar estadísticas
    return {
      posts: momentsCount,
      followers: userStats.followersCount || 0,
      following: userStats.followingCount || 0,
      likes: 0, // TODO: Implementar conteo de likes cuando esté disponible
      connections: userStats.connectionsCount || 0,
      // Datos adicionales por si se necesitan
      pendingRequests: {
        received: userStats.pendingRequestsReceived || 0,
        sent: userStats.pendingRequestsSent || 0
      },
      blockedUsers: userStats.blockedUsersCount || 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del perfil:', error);
    // Devolver estadísticas por defecto en caso de error
    return {
      posts: 0,
      followers: 0,
      following: 0,
      likes: 0,
      connections: 0
    };
  }
}

/**
 * Server Action para obtener momentos completos del usuario
 * Útil para renderizar la grid de publicaciones
 */
export async function getUserMoments(): Promise<GetAllMomentsByUserQuery['getAllMomentsByUser']> {
  try {
    const client = await getGraphQLClientWithCookies();

    // Query GraphQL completa para momentos
    const getAllMomentsByUserQuery = /* GraphQL */ `
      query getAllMomentsByUser {
        getAllMomentsByUser {
          id
          description
          resourceUrl
          resourceType
          audioUrl
          tags
          preferences
          created_at
          updated_at
          likeCount
          saveCount
          viewerHasLiked
          viewerHasSaved
          destination {
            place
            placeSub
            complementary_description
            coordinates {
              latitude
              longitude
            }
          }
          user_data {
            sub
            username
            name
            email
            avatar_url
          }
        }
      }
    `;

    const result = await client.graphql({
      query: getAllMomentsByUserQuery
    });

    if ('data' in result && result.data?.getAllMomentsByUser) {
      return result.data.getAllMomentsByUser;
    }

    return [];
  } catch (error) {
    console.error('Error obteniendo momentos completos del usuario:', error);
    return [];
  }
}