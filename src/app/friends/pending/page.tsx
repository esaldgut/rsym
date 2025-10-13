import { Suspense } from 'react';
import Link from 'next/link';
import {
  getPendingConnectionRequestsAction,
  getSentConnectionRequestsAction
} from '@/lib/server/friendship-actions';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { redirect } from 'next/navigation';
import { ConnectionRequestCard } from '@/components/friends/ConnectionRequestCard';
import { SentRequestCard } from '@/components/friends/SentRequestCard';

// Metadata para SEO
export const metadata = {
  title: 'Solicitudes Pendientes | Yaan',
  description: 'Gestiona tus solicitudes de conexión pendientes'
};

// No cachear esta página para mostrar solicitudes en tiempo real
export const revalidate = 0;

/**
 * Server Component: Solicitudes de Conexión Pendientes
 * Muestra solicitudes recibidas y enviadas
 */
export default async function PendingRequestsPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>

            {/* Navigation tabs */}
            <div className="flex gap-2">
              <Link
                href="/friends"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Conexiones
              </Link>
              <Link
                href="/friends/pending"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
              >
                Solicitudes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Solicitudes Recibidas */}
        <Suspense fallback={<RequestsLoading title="Solicitudes Recibidas" />}>
          <ReceivedRequests userId={user.sub} />
        </Suspense>

        {/* Solicitudes Enviadas */}
        <Suspense fallback={<RequestsLoading title="Solicitudes Enviadas" />}>
          <SentRequests userId={user.sub} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Server Component: Solicitudes Recibidas
 */
async function ReceivedRequests({ userId }: { userId: string }) {
  const { success, requests, error } = await getPendingConnectionRequestsAction(50);

  if (!success) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Solicitudes Recibidas
        </h2>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-red-600">Error al cargar solicitudes: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Solicitudes Recibidas
          {requests && requests.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({requests.length})
            </span>
          )}
        </h2>
      </div>

      {!requests || requests.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tienes solicitudes pendientes
          </h3>
          <p className="text-gray-600">
            Las solicitudes de conexión aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {requests.map((request) => {
            // Determinar quién envió la solicitud
            const isUser1 = request.user1_id === userId;
            const sender = isUser1 ? request.user2_data : request.user1_data;

            if (!sender) return null;

            return (
              <ConnectionRequestCard
                key={request.id}
                requestId={request.id}
                sender={sender}
                createdAt={request.created_at}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Server Component: Solicitudes Enviadas
 */
async function SentRequests({ userId }: { userId: string }) {
  const { success, requests, error } = await getSentConnectionRequestsAction(50);

  if (!success) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Solicitudes Enviadas
        </h2>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-red-600">Error al cargar solicitudes: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Solicitudes Enviadas
          {requests && requests.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({requests.length})
            </span>
          )}
        </h2>
      </div>

      {!requests || requests.length === 0 ? (
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No has enviado solicitudes
          </h3>
          <p className="text-gray-600 mb-4">
            Las solicitudes que envíes aparecerán aquí
          </p>
          <Link
            href="/explore"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Explorar usuarios
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {requests.map((request) => {
            // Determinar a quién se envió la solicitud
            const isUser1 = request.user1_id === userId;
            const recipient = isUser1 ? request.user2_data : request.user1_data;

            if (!recipient) return null;

            return (
              <SentRequestCard
                key={request.id}
                requestId={request.id}
                recipient={recipient}
                createdAt={request.created_at}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Loading: Solicitudes
 */
function RequestsLoading({ title }: { title: string }) {
  return (
    <div>
      <div className="h-7 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
      <div className="bg-white rounded-lg shadow divide-y">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-20 bg-gray-200 rounded"></div>
                <div className="h-10 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
