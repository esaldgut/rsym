'use client';

import { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  acceptConnectionRequestAction,
  rejectConnectionRequestAction
} from '@/lib/server/friendship-actions';
// ✅ Migrado de @/lib/graphql/types a @/generated/graphql (GraphQL Code Generator)
import type { User } from '@/generated/graphql';

interface ConnectionRequestCardProps {
  requestId: string;
  sender: User;
  createdAt?: string;
}

type RequestState = 'pending' | 'accepted' | 'rejected';

/**
 * Client Component: Tarjeta de Solicitud de Conexión
 * Permite aceptar/rechazar solicitudes con optimistic updates
 */
export function ConnectionRequestCard({
  requestId,
  sender,
  createdAt
}: ConnectionRequestCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useOptimistic<RequestState>('pending');

  // Handler: Aceptar solicitud
  const handleAccept = async () => {
    if (!requestId) {
      console.error('[ConnectionRequestCard] Missing requestId');
      return;
    }

    // Optimistic update
    setOptimisticState('accepted');

    startTransition(async () => {
      const result = await acceptConnectionRequestAction(requestId);

      if (!result.success) {
        console.error('[ConnectionRequestCard] Error accepting request:', result.error);
        alert(result.error || 'Error al aceptar solicitud');
        // Revertir optimistic update
        setOptimisticState('pending');
      }
    });
  };

  // Handler: Rechazar solicitud
  const handleReject = async () => {
    if (!requestId) {
      console.error('[ConnectionRequestCard] Missing requestId');
      return;
    }

    // Optimistic update
    setOptimisticState('rejected');

    startTransition(async () => {
      const result = await rejectConnectionRequestAction(requestId);

      if (!result.success) {
        console.error('[ConnectionRequestCard] Error rejecting request:', result.error);
        alert(result.error || 'Error al rechazar solicitud');
        // Revertir optimistic update
        setOptimisticState('pending');
      }
    });
  };

  // Si ya fue aceptada/rechazada, ocultar
  if (optimisticState !== 'pending') {
    return null;
  }

  // Validación de datos requeridos
  if (!sender || !sender.sub) {
    console.error('[ConnectionRequestCard] Missing sender data');
    return null;
  }

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <Link
            href={`/profile/${sender.username || sender.sub}`}
            className="flex-shrink-0"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg hover:opacity-80 transition-opacity">
              {sender.name?.charAt(0) || sender.username?.charAt(0) || '?'}
            </div>
          </Link>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${sender.username || sender.sub}`}
              className="font-semibold text-gray-900 hover:text-blue-600 block truncate"
            >
              {sender.name || sender.username || 'Usuario'}
            </Link>
            <p className="text-sm text-gray-600 truncate">
              @{sender.username || sender.sub}
            </p>
            {createdAt && (
              <p className="text-xs text-gray-500 mt-1">
                Hace {formatDistanceToNow(new Date(createdAt), { locale: es })}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleAccept}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isPending ? 'Procesando...' : 'Aceptar'}
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}
