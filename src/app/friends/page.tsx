import { Suspense } from 'react';
import Link from 'next/link';
import {
  getMyConnectionsAction,
  getMyStatsAction
} from '@/lib/server/friendship-actions';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { redirect } from 'next/navigation';

// Metadata para SEO
export const metadata = {
  title: 'Mis Conexiones | Yaan',
  description: 'Gestiona tus conexiones y amistades en Yaan'
};

// Revalidar cada 60 segundos
export const revalidate = 60;

/**
 * Server Component: Lista de Conexiones
 * Muestra las conexiones aceptadas del usuario con SSR
 */
export default async function FriendsPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">Conexiones</h1>

            {/* Navigation tabs */}
            <div className="flex gap-2">
              <Link
                href="/friends"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
              >
                Conexiones
              </Link>
              <Link
                href="/friends/pending"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Solicitudes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Section */}
        <Suspense fallback={<StatsLoading />}>
          <StatsSection userId={user.sub} />
        </Suspense>

        {/* Connections List */}
        <Suspense fallback={<ConnectionsLoading />}>
          <ConnectionsList userId={user.sub} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Server Component: Sección de Estadísticas
 */
async function StatsSection({ userId }: { userId: string }) {
  const { success, stats } = await getMyStatsAction();

  if (!success || !stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Conexiones"
        value={stats.connectionsCount || 0}
        href="/friends"
      />
      <StatCard
        label="Seguidores"
        value={stats.followersCount || 0}
        href="/friends/followers"
      />
      <StatCard
        label="Siguiendo"
        value={stats.followingCount || 0}
        href="/friends/following"
      />
      <StatCard
        label="Pendientes"
        value={stats.pendingRequestsReceived || 0}
        href="/friends/pending"
        highlight={(stats.pendingRequestsReceived || 0) > 0}
      />
    </div>
  );
}

/**
 * Server Component: Lista de Conexiones
 */
async function ConnectionsList({ userId }: { userId: string }) {
  const { success, connections, error } = await getMyConnectionsAction(50);

  if (!success) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-red-600">Error al cargar conexiones: {error}</p>
      </div>
    );
  }

  if (!connections || connections.length === 0) {
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aún no tienes conexiones
        </h3>
        <p className="text-gray-600 mb-4">
          Comienza a conectar con otros viajeros y proveedores
        </p>
        <Link
          href="/explore"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Explorar usuarios
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Mis Conexiones ({connections.length})
      </h2>

      <div className="bg-white rounded-lg shadow divide-y">
        {connections.map((connection) => {
          // Determinar cuál usuario mostrar
          const isUser1 = connection.user1_id === userId;
          const otherUser = isUser1 ? connection.user2_data : connection.user1_data;

          if (!otherUser) return null;

          return (
            <div
              key={connection.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {otherUser.name?.charAt(0) || otherUser.username?.charAt(0) || '?'}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${otherUser.username || otherUser.sub}`}
                      className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {otherUser.name || otherUser.username || 'Usuario'}
                    </Link>
                    <p className="text-sm text-gray-600 truncate">
                      @{otherUser.username || otherUser.sub}
                    </p>
                    {otherUser.bio && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {otherUser.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/chat?user=${otherUser.sub}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
                  >
                    Mensaje
                  </Link>
                  <Link
                    href={`/profile/${otherUser.username || otherUser.sub}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 text-sm"
                  >
                    Ver perfil
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Component: Tarjeta de Estadística
 */
function StatCard({
  label,
  value,
  href,
  highlight = false
}: {
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow ${
        highlight ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </Link>
  );
}

/**
 * Loading: Estadísticas
 */
function StatsLoading() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-12"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading: Conexiones
 */
function ConnectionsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
      <div className="bg-white rounded-lg shadow divide-y">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
