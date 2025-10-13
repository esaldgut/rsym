import { Suspense } from 'react';
import Link from 'next/link';
import { listMyConversationsAction } from '@/lib/server/chat-actions';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Metadata para SEO
export const metadata = {
  title: 'Mensajes | Yaan',
  description: 'Tus conversaciones en Yaan'
};

// No cachear para mostrar mensajes en tiempo real
export const revalidate = 0;

/**
 * Server Component: Lista de Conversaciones
 * Muestra todas las conversaciones del usuario con SSR
 */
export default async function ChatPage() {
  // Verificar autenticación
  const user = await getAuthenticatedUser();

  if (!user?.sub) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>

            {/* New conversation button */}
            <Link
              href="/explore?action=message"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nueva conversación
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Suspense fallback={<ConversationsLoading />}>
          <ConversationsList userId={user.sub} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Server Component: Lista de Conversaciones
 */
async function ConversationsList({ userId }: { userId: string }) {
  const { success, conversations, error } = await listMyConversationsAction(50);

  if (!success) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-red-600">Error al cargar conversaciones: {error}</p>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
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
          No tienes conversaciones
        </h3>
        <p className="text-gray-600 mb-4">
          Comienza a chatear con tus conexiones
        </p>
        <Link
          href="/friends"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Ver mis conexiones
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow divide-y">
      {conversations.map((conversation) => {
        // Determinar el otro participante
        const isParticipant1 = conversation.participant1_id === userId;
        const otherUser = isParticipant1
          ? conversation.participant2_data
          : conversation.participant1_data;

        // Determinar unread count para el usuario actual
        const unreadCount = isParticipant1
          ? conversation.participant1_unread_count
          : conversation.participant2_unread_count;

        if (!otherUser) return null;

        return (
          <Link
            key={conversation.id}
            href={`/chat/${conversation.id}`}
            className="block p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {otherUser.name?.charAt(0) || otherUser.username?.charAt(0) || '?'}
                </div>
                {/* Online indicator (placeholder) */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-300 border-2 border-white rounded-full"></div>
              </div>

              {/* Conversation Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-semibold ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {otherUser.name || otherUser.username || 'Usuario'}
                  </h3>
                  {conversation.last_message_at && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                        locale: es
                      })}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {/* Last message preview */}
                  <p
                    className={`text-sm truncate ${
                      unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                    }`}
                  >
                    {conversation.last_message || 'No hay mensajes aún'}
                  </p>

                  {/* Unread badge */}
                  {unreadCount > 0 && (
                    <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Loading: Conversaciones
 */
function ConversationsLoading() {
  return (
    <div className="bg-white rounded-lg shadow divide-y">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200"></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
