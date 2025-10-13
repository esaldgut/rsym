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
  Conversation,
  Message,
  ConversationsResponse,
  MessagesResponse,
  ConversationInput,
  SendMessageInput,
  MarkAsReadInput,
  MarkAsDeliveredInput
} from '@/lib/graphql/types';

// ==================== QUERY ACTIONS ====================

/**
 * Listar mis conversaciones con paginación
 * @param limit - Límite de resultados (default: 20)
 * @param nextToken - Token de paginación
 */
export async function listMyConversationsAction(
  limit: number = 20,
  nextToken?: string
) {
  console.log('[listMyConversationsAction] 💬 Obteniendo conversaciones...');

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      console.error('[listMyConversationsAction] ❌ Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }

    console.log('[listMyConversationsAction] 👤 Usuario:', {
      sub: user.sub,
      userId: user.userId
    });

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.listMyConversations,
      variables: { limit, next_token: nextToken }
    });

    if (errors || !data?.listMyConversations) {
      console.error('[listMyConversationsAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch conversations');
    }

    const response = data.listMyConversations as unknown as ConversationsResponse;

    console.log('[listMyConversationsAction] ✅ Conversaciones obtenidas:', {
      count: response.items?.length || 0,
      totalCount: response.total_count,
      hasNextToken: !!response.next_token
    });

    return {
      success: true,
      conversations: response.items || [],
      nextToken: response.next_token,
      totalCount: response.total_count
    };
  } catch (error) {
    console.error('[listMyConversationsAction] ❌ Error:', error);
    return {
      success: false,
      conversations: [],
      error: error instanceof Error ? error.message : 'Error al obtener conversaciones'
    };
  }
}

/**
 * Obtener mensajes de una conversación con paginación
 * @param conversationId - ID de la conversación
 * @param limit - Límite de mensajes (default: 50)
 * @param nextToken - Token de paginación
 */
export async function getConversationMessagesAction(
  conversationId: string,
  limit: number = 50,
  nextToken?: string
) {
  console.log('[getConversationMessagesAction] 💬 Obteniendo mensajes de conversación:', conversationId);

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
      query: queries.getConversationMessages,
      variables: {
        conversation_id: conversationId,
        limit,
        next_token: nextToken
      }
    });

    if (errors || !data?.getConversationMessages) {
      console.error('[getConversationMessagesAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch messages');
    }

    const response = data.getConversationMessages as unknown as MessagesResponse;

    console.log('[getConversationMessagesAction] ✅ Mensajes obtenidos:', {
      count: response.items?.length || 0,
      totalCount: response.total_count,
      hasNextToken: !!response.next_token
    });

    return {
      success: true,
      messages: response.items || [],
      nextToken: response.next_token,
      totalCount: response.total_count
    };
  } catch (error) {
    console.error('[getConversationMessagesAction] ❌ Error:', error);
    return {
      success: false,
      messages: [],
      error: error instanceof Error ? error.message : 'Error al obtener mensajes'
    };
  }
}

/**
 * Obtener o crear conversación con otro usuario
 * Backend valida automáticamente permisos de chat:
 * - Traveler ↔ Traveler: Requiere friendship ACCEPTED
 * - Traveler ↔ Provider: Requiere reservación activa
 * - Provider ↔ Provider: Requiere friendship ACCEPTED
 *
 * @param participant2Id - ID del otro usuario
 * @param participant2Type - Tipo del otro usuario (traveler/provider)
 */
export async function getOrCreateConversationAction(
  participant2Id: string,
  participant2Type: string = 'traveler'
) {
  console.log('[getOrCreateConversationAction] 💬 Obteniendo/creando conversación con:', participant2Id);

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener userType del usuario actual
    // TODO: Obtener desde user attributes o base de datos
    const currentUserType = 'traveler'; // Default, debería venir de user.userType

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getOrCreateConversation,
      variables: {
        input: {
          participant1_id: user.sub,
          participant1_type: currentUserType,
          participant2_id: participant2Id,
          participant2_type: participant2Type
        }
      }
    });

    if (errors || !data?.getOrCreateConversation) {
      console.error('[getOrCreateConversationAction] ❌ GraphQL errors:', errors);

      // Error común: No tiene permisos para chatear
      const errorMessage = errors?.[0]?.message || '';
      if (errorMessage.includes('no tiene permisos') || errorMessage.includes('requiere')) {
        return {
          success: false,
          error: 'No tienes permisos para chatear con este usuario. Requiere amistad o reservación activa.'
        };
      }

      throw new Error('Failed to get or create conversation');
    }

    const conversation = data.getOrCreateConversation as unknown as Conversation;

    console.log('[getOrCreateConversationAction] ✅ Conversación obtenida/creada:', {
      id: conversation.id,
      unreadCount: conversation.participant1_unread_count
    });

    // Revalidar lista de conversaciones
    revalidateTag('my-conversations');
    revalidatePath('/chat');

    return {
      success: true,
      conversation
    };
  } catch (error) {
    console.error('[getOrCreateConversationAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener conversación'
    };
  }
}

/**
 * Obtener conversación por ID
 * @param conversationId - ID de la conversación
 */
export async function getConversationByIdAction(conversationId: string) {
  console.log('[getConversationByIdAction] 💬 Obteniendo conversación:', conversationId);

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
      query: queries.getConversationById,
      variables: { conversation_id: conversationId }
    });

    if (errors || !data?.getConversationById) {
      console.error('[getConversationByIdAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to fetch conversation');
    }

    const conversation = data.getConversationById as unknown as Conversation;

    console.log('[getConversationByIdAction] ✅ Conversación obtenida');

    return {
      success: true,
      conversation
    };
  } catch (error) {
    console.error('[getConversationByIdAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener conversación'
    };
  }
}

// ==================== MUTATION ACTIONS ====================

/**
 * Enviar mensaje en una conversación
 * Backend valida automáticamente permisos antes de permitir envío
 *
 * @param conversationId - ID de la conversación
 * @param content - Contenido del mensaje
 */
export async function sendMessageAction(
  conversationId: string,
  content: string
) {
  console.log('[sendMessageAction] 📤 Enviando mensaje en conversación:', conversationId);

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    if (!content?.trim()) {
      throw new Error('El mensaje no puede estar vacío');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.sendMessage,
      variables: {
        input: {
          conversation_id: conversationId,
          content: content.trim()
        }
      }
    });

    if (errors || !data?.sendMessage) {
      console.error('[sendMessageAction] ❌ GraphQL errors:', errors);

      // Error común: No tiene permisos para enviar mensaje
      const errorMessage = errors?.[0]?.message || '';
      if (errorMessage.includes('no tiene permisos') || errorMessage.includes('requiere')) {
        return {
          success: false,
          error: 'No tienes permisos para enviar mensajes en este chat'
        };
      }

      throw new Error('Failed to send message');
    }

    const message = data.sendMessage as unknown as Message;

    console.log('[sendMessageAction] ✅ Mensaje enviado:', {
      id: message.id,
      status: message.status
    });

    // Revalidar conversación y lista de conversaciones
    revalidateTag(`conversation-${conversationId}`);
    revalidateTag(`messages-${conversationId}`);
    revalidateTag('my-conversations');
    revalidatePath(`/chat/${conversationId}`);

    return {
      success: true,
      message
    };
  } catch (error) {
    console.error('[sendMessageAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar mensaje'
    };
  }
}

/**
 * Marcar mensajes como leídos
 * Actualiza el unread_count de la conversación para el usuario actual
 *
 * @param conversationId - ID de la conversación
 * @param messageIds - Array de IDs de mensajes a marcar como leídos
 */
export async function markMessagesAsReadAction(
  conversationId: string,
  messageIds: string[]
) {
  console.log('[markMessagesAsReadAction] ✅ Marcando mensajes como leídos:', {
    conversationId,
    count: messageIds.length
  });

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    if (!messageIds || messageIds.length === 0) {
      throw new Error('No hay mensajes para marcar como leídos');
    }

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.markMessagesAsRead,
      variables: {
        input: {
          conversation_id: conversationId,
          message_ids: messageIds
        }
      }
    });

    if (errors || !data?.markMessagesAsRead) {
      console.error('[markMessagesAsReadAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to mark messages as read');
    }

    const updatedConversation = data.markMessagesAsRead as unknown as Conversation;

    console.log('[markMessagesAsReadAction] ✅ Mensajes marcados como leídos:', {
      updatedUnreadCount: updatedConversation.participant1_unread_count
    });

    // Revalidar conversación y lista de conversaciones (para actualizar unread badges)
    revalidateTag(`conversation-${conversationId}`);
    revalidateTag(`messages-${conversationId}`);
    revalidateTag('my-conversations');

    return {
      success: true,
      conversation: updatedConversation,
      message: `${messageIds.length} mensaje(s) marcado(s) como leído(s)`
    };
  } catch (error) {
    console.error('[markMessagesAsReadAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al marcar mensajes como leídos'
    };
  }
}

/**
 * Marcar mensaje como entregado
 * Se llama automáticamente cuando el usuario ve el mensaje
 *
 * @param conversationId - ID de la conversación
 * @param messageId - ID del mensaje
 */
export async function markMessageAsDeliveredAction(
  conversationId: string,
  messageId: string
) {
  console.log('[markMessageAsDeliveredAction] ✅ Marcando mensaje como entregado:', {
    conversationId,
    messageId
  });

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
      query: mutations.markMessageAsDelivered,
      variables: {
        input: {
          conversation_id: conversationId,
          message_id: messageId
        }
      }
    });

    if (errors || !data?.markMessageAsDelivered) {
      console.error('[markMessageAsDeliveredAction] ❌ GraphQL errors:', errors);
      throw new Error('Failed to mark message as delivered');
    }

    const message = data.markMessageAsDelivered as unknown as Message;

    console.log('[markMessageAsDeliveredAction] ✅ Mensaje marcado como entregado:', {
      id: message.id,
      status: message.status
    });

    // Revalidar mensajes de la conversación
    revalidateTag(`messages-${conversationId}`);

    return {
      success: true,
      message
    };
  } catch (error) {
    console.error('[markMessageAsDeliveredAction] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al marcar mensaje como entregado'
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Obtener contador de mensajes no leídos totales
 * Suma todos los unread_count de todas las conversaciones
 */
export async function getTotalUnreadCountAction() {
  console.log('[getTotalUnreadCountAction] 🔢 Obteniendo contador total de no leídos...');

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      return {
        success: true,
        totalUnread: 0
      };
    }

    // Obtener todas las conversaciones (sin paginación, solo primera página)
    const result = await listMyConversationsAction(100);

    if (!result.success || !result.conversations) {
      return {
        success: true,
        totalUnread: 0
      };
    }

    // Sumar todos los unread_count
    const totalUnread = result.conversations.reduce((sum, conv) => {
      // Determinar cuál participante es el usuario actual
      const isParticipant1 = conv.participant1_id === user.sub;
      const unreadCount = isParticipant1
        ? conv.participant1_unread_count
        : conv.participant2_unread_count;

      return sum + (unreadCount || 0);
    }, 0);

    console.log('[getTotalUnreadCountAction] ✅ Total no leídos:', totalUnread);

    return {
      success: true,
      totalUnread
    };
  } catch (error) {
    console.error('[getTotalUnreadCountAction] ❌ Error:', error);
    return {
      success: true,
      totalUnread: 0
    };
  }
}
