'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import outputs from '../../../amplify/outputs.json';
import type { Schema } from '@/amplify/data/resource';
import * as mutations from '@/lib/graphql/operations';
import * as queries from '@/lib/graphql/operations';
import type {
  Friendship,
  Follow,
  UserStats,
  RelationshipStatus,
  ConnectionsResponse,
  FollowsResponse
} from '@/lib/graphql/types';

// ==================== QUERY ACTIONS ====================

/**
 * Obtener mis conexiones (amistades aceptadas)
 * @param limit - Límite de resultados (default: 20)
 * @param nextToken - Token de paginación
 */
export async function getMyConnectionsAction(
  limit: number = 20,
  nextToken?: string
) {
  console.log('[getMyConnectionsAction] 🔍 Obteniendo conexiones...');

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      console.error('[getMyConnectionsAction] ❌ Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getMyConnections,
      variables: { limit, next_token: nextToken }
    });

    if (errors || !data?.getMyConnections) {
      console.error('[getMyConnectionsAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch connections');
    }

    const response = data.getMyConnections as unknown as ConnectionsResponse;

    console.log('[getMyConnectionsAction] ✅ Conexiones obtenidas:', response.items?.length || 0);

    return {
      success: true,
      connections: response.items || [],
      nextToken: response.next_token,
      totalCount: response.total_count
    };
  } catch (error) {
    console.error('[getMyConnectionsAction] ❌ Error:', error);
    return {
      success: false,
      connections: [],
      error: error instanceof Error ? error.message : 'Error al obtener conexiones'
    };
  }
}

/**
 * Obtener solicitudes de conexión pendientes (recibidas)
 */
export async function getPendingConnectionRequestsAction(
  limit: number = 20,
  nextToken?: string
) {
  console.log('[getPendingConnectionRequestsAction] 🔍 Obteniendo solicitudes pendientes...');

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getPendingConnectionRequests,
      variables: { limit, next_token: nextToken }
    });

    if (errors || !data?.getPendingConnectionRequests) {
      console.error('[getPendingConnectionRequestsAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch pending requests');
    }

    const response = data.getPendingConnectionRequests as unknown as ConnectionsResponse;

    console.log('[getPendingConnectionRequestsAction] ✅ Solicitudes obtenidas:', response.items?.length || 0);

    return {
      success: true,
      requests: response.items || [],
      nextToken: response.next_token,
      totalCount: response.total_count
    };
  } catch (error) {
    console.error('[getPendingConnectionRequestsAction] ❌ Error:', error);
    return {
      success: false,
      requests: [],
      error: error instanceof Error ? error.message : 'Error al obtener solicitudes'
    };
  }
}

/**
 * Obtener solicitudes de conexión enviadas
 */
export async function getSentConnectionRequestsAction(
  limit: number = 20,
  nextToken?: string
) {
  console.log('[getSentConnectionRequestsAction] 🔍 Obteniendo solicitudes enviadas...');

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getSentConnectionRequests,
      variables: { limit, next_token: nextToken }
    });

    if (errors || !data?.getSentConnectionRequests) {
      console.error('[getSentConnectionRequestsAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch sent requests');
    }

    const response = data.getSentConnectionRequests as unknown as ConnectionsResponse;

    console.log('[getSentConnectionRequestsAction] ✅ Solicitudes obtenidas:', response.items?.length || 0);

    return {
      success: true,
      requests: response.items || [],
      nextToken: response.next_token,
      totalCount: response.total_count
    };
  } catch (error) {
    console.error('[getSentConnectionRequestsAction] ❌ Error:', error);
    return {
      success: false,
      requests: [],
      error: error instanceof Error ? error.message : 'Error al obtener solicitudes'
    };
  }
}

/**
 * Obtener mis seguidores
 */
export async function getMyFollowersAction(
  limit: number = 20,
  nextToken?: string
) {
  console.log('[getMyFollowersAction] 🔍 Obteniendo seguidores...');

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getMyFollowers,
      variables: { limit, next_token: nextToken }
    });

    if (errors || !data?.getMyFollowers) {
      console.error('[getMyFollowersAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch followers');
    }

    const response = data.getMyFollowers as unknown as FollowsResponse;

    console.log('[getMyFollowersAction] ✅ Seguidores obtenidos:', response.items?.length || 0);

    return {
      success: true,
      followers: response.items || [],
      nextToken: response.next_token,
      totalCount: response.total_count
    };
  } catch (error) {
    console.error('[getMyFollowersAction] ❌ Error:', error);
    return {
      success: false,
      followers: [],
      error: error instanceof Error ? error.message : 'Error al obtener seguidores'
    };
  }
}

/**
 * Obtener usuarios que sigo
 */
export async function getMyFollowingAction(
  limit: number = 20,
  nextToken?: string
) {
  console.log('[getMyFollowingAction] 🔍 Obteniendo following...');

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getMyFollowing,
      variables: { limit, next_token: nextToken }
    });

    if (errors || !data?.getMyFollowing) {
      console.error('[getMyFollowingAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch following');
    }

    const response = data.getMyFollowing as unknown as FollowsResponse;

    console.log('[getMyFollowingAction] ✅ Following obtenidos:', response.items?.length || 0);

    return {
      success: true,
      following: response.items || [],
      nextToken: response.next_token,
      totalCount: response.total_count
    };
  } catch (error) {
    console.error('[getMyFollowingAction] ❌ Error:', error);
    return {
      success: false,
      following: [],
      error: error instanceof Error ? error.message : 'Error al obtener following'
    };
  }
}

/**
 * Obtener estado de relación con otro usuario
 * @param targetUserId - ID del usuario objetivo
 */
export async function getRelationshipStatusAction(targetUserId: string) {
  console.log('[getRelationshipStatusAction] 🔍 Obteniendo estado de relación con:', targetUserId);

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getRelationshipStatus,
      variables: { target_user_id: targetUserId }
    });

    if (errors || !data?.getRelationshipStatus) {
      console.error('[getRelationshipStatusAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch relationship status');
    }

    const status = data.getRelationshipStatus as unknown as RelationshipStatus;

    console.log('[getRelationshipStatusAction] ✅ Estado obtenido:', {
      connectionStatus: status.connection_status,
      isFollowing: status.is_following,
      isBlocked: status.is_blocked
    });

    return {
      success: true,
      status
    };
  } catch (error) {
    console.error('[getRelationshipStatusAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estado de relación'
    };
  }
}

/**
 * Obtener mis estadísticas
 */
export async function getMyStatsAction() {
  console.log('[getMyStatsAction] 🔍 Obteniendo mis estadísticas...');

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getMyStats
    });

    if (errors || !data?.getMyStats) {
      console.error('[getMyStatsAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch stats');
    }

    const stats = data.getMyStats as unknown as UserStats;

    console.log('[getMyStatsAction] ✅ Estadísticas obtenidas:', {
      connections: stats.connectionsCount,
      followers: stats.followersCount,
      following: stats.followingCount,
      pendingReceived: stats.pendingRequestsReceived,
      pendingSent: stats.pendingRequestsSent
    });

    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error('[getMyStatsAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas'
    };
  }
}

/**
 * Obtener estadísticas de otro usuario
 * @param userId - ID del usuario
 */
export async function getUserStatsAction(userId: string) {
  console.log('[getUserStatsAction] 🔍 Obteniendo estadísticas de usuario:', userId);

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getUserStats,
      variables: { user_id: userId }
    });

    if (errors || !data?.getUserStats) {
      console.error('[getUserStatsAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch user stats');
    }

    const stats = data.getUserStats as unknown as UserStats;

    console.log('[getUserStatsAction] ✅ Estadísticas obtenidas');

    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error('[getUserStatsAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas'
    };
  }
}

/**
 * Obtener usuarios bloqueados
 */
export async function getBlockedUsersAction(
  limit: number = 20,
  nextToken?: string
) {
  console.log('[getBlockedUsersAction] 🔍 Obteniendo usuarios bloqueados...');

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getBlockedUsers,
      variables: { limit, next_token: nextToken }
    });

    if (errors || !data?.getBlockedUsers) {
      console.error('[getBlockedUsersAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch blocked users');
    }

    const response = data.getBlockedUsers as unknown as ConnectionsResponse;

    console.log('[getBlockedUsersAction] ✅ Usuarios bloqueados obtenidos:', response.items?.length || 0);

    return {
      success: true,
      blockedUsers: response.items || [],
      nextToken: response.next_token,
      totalCount: response.total_count
    };
  } catch (error) {
    console.error('[getBlockedUsersAction] ❌ Error:', error);
    return {
      success: false,
      blockedUsers: [],
      error: error instanceof Error ? error.message : 'Error al obtener usuarios bloqueados'
    };
  }
}

// ==================== MUTATION ACTIONS ====================

/**
 * Enviar solicitud de conexión
 * @param targetUserId - ID del usuario al que se envía la solicitud
 * @param targetUserType - Tipo de usuario (traveler/provider)
 */
export async function sendConnectionRequestAction(
  targetUserId: string,
  targetUserType: string = 'traveler'
) {
  console.log('[sendConnectionRequestAction] 📤 Enviando solicitud de conexión a:', targetUserId);

  try {
    // Validar parámetros
    if (!targetUserId || targetUserId.trim() === '') {
      throw new Error('ID de usuario objetivo es requerido');
    }

    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.sendConnectionRequest,
      variables: {
        target_user_id: targetUserId,
        target_user_type: targetUserType
      }
    });

    if (errors || !data?.sendConnectionRequest) {
      console.error('[sendConnectionRequestAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to send connection request');
    }

    const friendship = data.sendConnectionRequest as unknown as Friendship;

    console.log('[sendConnectionRequestAction] ✅ Solicitud enviada:', {
      id: friendship.id,
      status: friendship.status
    });

    // Revalidar cache
    revalidateTag(`relationship-${targetUserId}`);
    revalidateTag('my-stats');
    revalidatePath('/friends');

    return {
      success: true,
      friendship,
      message: 'Solicitud de conexión enviada'
    };
  } catch (error) {
    console.error('[sendConnectionRequestAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar solicitud'
    };
  }
}

/**
 * Aceptar solicitud de conexión
 * @param requestId - ID de la solicitud (Friendship ID)
 */
export async function acceptConnectionRequestAction(requestId: string) {
  console.log('[acceptConnectionRequestAction] ✅ Aceptando solicitud:', requestId);

  try {
    // Validar parámetros
    if (!requestId || requestId.trim() === '') {
      throw new Error('ID de solicitud es requerido');
    }

    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.acceptConnectionRequest,
      variables: { request_id: requestId }
    });

    if (errors || !data?.acceptConnectionRequest) {
      console.error('[acceptConnectionRequestAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to accept connection request');
    }

    const friendship = data.acceptConnectionRequest as unknown as Friendship;

    console.log('[acceptConnectionRequestAction] ✅ Solicitud aceptada');

    // Revalidar cache
    revalidateTag('pending-requests');
    revalidateTag('my-connections');
    revalidateTag('my-stats');
    revalidatePath('/friends');

    return {
      success: true,
      friendship,
      message: 'Conexión aceptada'
    };
  } catch (error) {
    console.error('[acceptConnectionRequestAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al aceptar solicitud'
    };
  }
}

/**
 * Rechazar solicitud de conexión
 * @param requestId - ID de la solicitud (Friendship ID)
 */
export async function rejectConnectionRequestAction(requestId: string) {
  console.log('[rejectConnectionRequestAction] ❌ Rechazando solicitud:', requestId);

  try {
    // Validar parámetros
    if (!requestId || requestId.trim() === '') {
      throw new Error('ID de solicitud es requerido');
    }

    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.rejectConnectionRequest,
      variables: { request_id: requestId }
    });

    if (errors || !data?.rejectConnectionRequest) {
      console.error('[rejectConnectionRequestAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to reject connection request');
    }

    const friendship = data.rejectConnectionRequest as unknown as Friendship;

    console.log('[rejectConnectionRequestAction] ✅ Solicitud rechazada');

    // Revalidar cache
    revalidateTag('pending-requests');
    revalidateTag('my-stats');
    revalidatePath('/friends');

    return {
      success: true,
      friendship,
      message: 'Solicitud rechazada'
    };
  } catch (error) {
    console.error('[rejectConnectionRequestAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al rechazar solicitud'
    };
  }
}

/**
 * Cancelar solicitud de conexión enviada
 * @param requestId - ID de la solicitud (Friendship ID)
 */
export async function cancelConnectionRequestAction(requestId: string) {
  console.log('[cancelConnectionRequestAction] 🚫 Cancelando solicitud:', requestId);

  try {
    // Validar parámetros
    if (!requestId || requestId.trim() === '') {
      throw new Error('ID de solicitud es requerido');
    }

    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.cancelConnectionRequest,
      variables: { request_id: requestId }
    });

    if (errors || !data?.cancelConnectionRequest) {
      console.error('[cancelConnectionRequestAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to cancel connection request');
    }

    const friendship = data.cancelConnectionRequest as unknown as Friendship;

    console.log('[cancelConnectionRequestAction] ✅ Solicitud cancelada');

    // Revalidar cache
    revalidateTag('sent-requests');
    revalidateTag('my-stats');
    revalidatePath('/friends');

    return {
      success: true,
      friendship,
      message: 'Solicitud cancelada'
    };
  } catch (error) {
    console.error('[cancelConnectionRequestAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cancelar solicitud'
    };
  }
}

/**
 * Eliminar conexión (amistad aceptada)
 * @param connectionId - ID de la conexión (Friendship ID)
 */
export async function removeConnectionAction(connectionId: string) {
  console.log('[removeConnectionAction] 🗑️ Eliminando conexión:', connectionId);

  try {
    // Validar parámetros
    if (!connectionId || connectionId.trim() === '') {
      throw new Error('ID de conexión es requerido');
    }

    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.removeConnection,
      variables: { connection_id: connectionId }
    });

    if (errors || !data?.removeConnection) {
      console.error('[removeConnectionAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to remove connection');
    }

    console.log('[removeConnectionAction] ✅ Conexión eliminada');

    // Revalidar cache
    revalidateTag('my-connections');
    revalidateTag('my-stats');
    revalidatePath('/friends');

    return {
      success: true,
      message: 'Conexión eliminada'
    };
  } catch (error) {
    console.error('[removeConnectionAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar conexión'
    };
  }
}

/**
 * Seguir a un usuario
 * @param targetUserId - ID del usuario a seguir
 * @param targetUserType - Tipo de usuario (traveler/provider)
 */
export async function followUserAction(
  targetUserId: string,
  targetUserType: string = 'traveler'
) {
  console.log('[followUserAction] 👤 Siguiendo usuario:', targetUserId);

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.followUser,
      variables: {
        target_user_id: targetUserId,
        target_user_type: targetUserType
      }
    });

    if (errors || !data?.followUser) {
      console.error('[followUserAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to follow user');
    }

    const follow = data.followUser as unknown as Follow;

    console.log('[followUserAction] ✅ Usuario seguido');

    // Revalidar cache
    revalidateTag(`relationship-${targetUserId}`);
    revalidateTag('my-following');
    revalidateTag('my-stats');

    return {
      success: true,
      follow,
      message: 'Ahora sigues a este usuario'
    };
  } catch (error) {
    console.error('[followUserAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al seguir usuario'
    };
  }
}

/**
 * Dejar de seguir a un usuario
 * @param targetUserId - ID del usuario a dejar de seguir
 */
export async function unfollowUserAction(targetUserId: string) {
  console.log('[unfollowUserAction] 👤 Dejando de seguir usuario:', targetUserId);

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.unfollowUser,
      variables: { target_user_id: targetUserId }
    });

    if (errors || !data?.unfollowUser) {
      console.error('[unfollowUserAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to unfollow user');
    }

    console.log('[unfollowUserAction] ✅ Usuario dejado de seguir');

    // Revalidar cache
    revalidateTag(`relationship-${targetUserId}`);
    revalidateTag('my-following');
    revalidateTag('my-stats');

    return {
      success: true,
      message: 'Dejaste de seguir a este usuario'
    };
  } catch (error) {
    console.error('[unfollowUserAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al dejar de seguir'
    };
  }
}

/**
 * Bloquear usuario (elimina toda relación y previene futuras interacciones)
 * @param targetUserId - ID del usuario a bloquear
 */
export async function blockUserAction(targetUserId: string) {
  console.log('[blockUserAction] 🚫 Bloqueando usuario:', targetUserId);

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.blockUser,
      variables: { target_user_id: targetUserId }
    });

    if (errors || !data?.blockUser) {
      console.error('[blockUserAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to block user');
    }

    const friendship = data.blockUser as unknown as Friendship;

    console.log('[blockUserAction] ✅ Usuario bloqueado');

    // Revalidar cache - bloquear limpia todas las relaciones
    revalidateTag(`relationship-${targetUserId}`);
    revalidateTag('my-connections');
    revalidateTag('my-following');
    revalidateTag('my-followers');
    revalidateTag('my-stats');
    revalidateTag('blocked-users');
    revalidatePath('/friends');

    return {
      success: true,
      friendship,
      message: 'Usuario bloqueado'
    };
  } catch (error) {
    console.error('[blockUserAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al bloquear usuario'
    };
  }
}

/**
 * Desbloquear usuario
 * @param targetUserId - ID del usuario a desbloquear
 */
export async function unblockUserAction(targetUserId: string) {
  console.log('[unblockUserAction] ✅ Desbloqueando usuario:', targetUserId);

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.unblockUser,
      variables: { target_user_id: targetUserId }
    });

    if (errors || !data?.unblockUser) {
      console.error('[unblockUserAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to unblock user');
    }

    console.log('[unblockUserAction] ✅ Usuario desbloqueado');

    // Revalidar cache
    revalidateTag(`relationship-${targetUserId}`);
    revalidateTag('blocked-users');
    revalidateTag('my-stats');

    return {
      success: true,
      message: 'Usuario desbloqueado'
    };
  } catch (error) {
    console.error('[unblockUserAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al desbloquear usuario'
    };
  }
}
