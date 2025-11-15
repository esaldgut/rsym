import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  getConversationByIdAction,
  getConversationMessagesAction
} from '@/lib/server/chat-actions';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
// ✅ Migrado de @/lib/graphql/types a @/generated/graphql (GraphQL Code Generator)
import type { Conversation, Message } from '@/generated/graphql';

// No cachear para mostrar mensajes en tiempo real
export const revalidate = 0;

// Generar metadata dinámica
export async function generateMetadata({
  params
}: {
  params: { conversationId: string };
}) {
  const { conversationId } = params;
  const { success, conversation } = await getConversationByIdAction(conversationId);

  if (!success || !conversation) {
    return {
      title: 'Chat | Yaan'
    };
  }

  const user = await getAuthenticatedUser();
  const isParticipant1 = conversation.participant1_id === user?.sub;
  const otherUser = isParticipant1
    ? conversation.participant2_data
    : conversation.participant1_data;

  return {
    title: `Chat con ${otherUser?.name || otherUser?.username || 'Usuario'} | Yaan`,
    description: 'Conversación en Yaan'
  };
}

/**
 * Server Component: Ventana de Chat Individual
 * Muestra la conversación y los mensajes con SSR
 */
export default async function ChatConversationPage({
  params
}: {
  params: { conversationId: string };
}) {
  const { conversationId } = params;

  // Verificar autenticación
  const user = await getAuthenticatedUser();

  if (!user?.sub) {
    redirect('/login');
  }

  // Obtener conversación
  const { success, conversation, error } = await getConversationByIdAction(conversationId);

  if (!success || !conversation) {
    console.error('[ChatConversationPage] Error loading conversation:', error);
    notFound();
  }

  // Verificar que el usuario sea participante de la conversación
  const isParticipant =
    conversation.participant1_id === user.sub ||
    conversation.participant2_id === user.sub;

  if (!isParticipant) {
    console.error('[ChatConversationPage] User is not a participant');
    notFound();
  }

  // Determinar el otro participante
  const isParticipant1 = conversation.participant1_id === user.sub;
  const otherUser = isParticipant1
    ? conversation.participant2_data
    : conversation.participant1_data;

  if (!otherUser) {
    console.error('[ChatConversationPage] Other user data not found');
    notFound();
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Back button */}
            <Link
              href="/chat"
              className="text-gray-600 hover:text-gray-900 p-2 -ml-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>

            {/* User info */}
            <Link
              href={`/profile/${otherUser.username || otherUser.sub}`}
              className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {otherUser.name?.charAt(0) || otherUser.username?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">
                  {otherUser.name || otherUser.username || 'Usuario'}
                </h2>
                <p className="text-sm text-gray-600 truncate">
                  @{otherUser.username || otherUser.sub}
                </p>
              </div>
            </Link>

            {/* Options menu (placeholder) */}
            <button className="text-gray-600 hover:text-gray-900 p-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<MessagesLoading />}>
          <MessagesArea
            conversationId={conversationId}
            currentUserId={user.sub}
            otherUser={otherUser}
          />
        </Suspense>
      </div>

      {/* Input area */}
      <div className="bg-white border-t flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <ChatInput conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}

/**
 * Server Component: Área de Mensajes
 */
async function MessagesArea({
  conversationId,
  currentUserId,
  otherUser
}: {
  conversationId: string;
  currentUserId: string;
  otherUser: { sub?: string; name?: string; username?: string };
}) {
  const { success, messages, error } = await getConversationMessagesAction(
    conversationId,
    100
  );

  if (!success) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600">Error al cargar mensajes: {error}</p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-4">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay mensajes aún
          </h3>
          <p className="text-gray-600">
            Envía el primer mensaje a {otherUser.name || otherUser.username || 'este usuario'}
          </p>
        </div>
      </div>
    );
  }

  // Client Component que maneja scroll, optimistic updates, etc.
  return (
    <ChatWindow
      conversationId={conversationId}
      initialMessages={messages}
      currentUserId={currentUserId}
    />
  );
}

/**
 * Loading: Mensajes
 */
function MessagesLoading() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
              i % 2 === 0 ? 'bg-blue-100' : 'bg-gray-100'
            }`}
          >
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
