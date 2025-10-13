'use client';

import { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cancelConnectionRequestAction } from '@/lib/server/friendship-actions';
import type { User } from '@/lib/graphql/types';

interface SentRequestCardProps {
  requestId: string;
  recipient: User;
  createdAt?: string;
}

type RequestState = 'pending' | 'cancelled';

/**
 * Client Component: Tarjeta de Solicitud Enviada
 * Permite cancelar solicitudes con optimistic updates
 */
export function SentRequestCard({
  requestId,
  recipient,
  createdAt
}: SentRequestCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useOptimistic<RequestState>('pending');

  // Handler: Cancelar solicitud
  const handleCancel = async () => {
    if (!requestId) {
      console.error('[SentRequestCard] Missing requestId');
      return;
    }

    if (!confirm('¿Estás seguro de cancelar esta solicitud?')) {
      return;
    }

    // Optimistic update
    setOptimisticState('cancelled');

    startTransition(async () => {
      const result = await cancelConnectionRequestAction(requestId);

      if (!result.success) {
        console.error('[SentRequestCard] Error cancelling request:', result.error);
        alert(result.error || 'Error al cancelar solicitud');
        // Revertir optimistic update
        setOptimisticState('pending');
      }
    });
  };

  // Si ya fue cancelada, ocultar
  if (optimisticState === 'cancelled') {
    return null;
  }

  // Validación de datos requeridos
  if (!recipient || !recipient.sub) {
    console.error('[SentRequestCard] Missing recipient data');
    return null;
  }

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <Link
            href={`/profile/${recipient.username || recipient.sub}`}
            className="flex-shrink-0"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg hover:opacity-80 transition-opacity">
              {recipient.name?.charAt(0) || recipient.username?.charAt(0) || '?'}
            </div>
          </Link>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${recipient.username || recipient.sub}`}
              className="font-semibold text-gray-900 hover:text-blue-600 block truncate"
            >
              {recipient.name || recipient.username || 'Usuario'}
            </Link>
            <p className="text-sm text-gray-600 truncate">
              @{recipient.username || recipient.sub}
            </p>
            {createdAt && (
              <p className="text-xs text-gray-500 mt-1">
                Enviada hace {formatDistanceToNow(new Date(createdAt), { locale: es })}
              </p>
            )}
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-yellow-600 font-medium bg-yellow-50 px-3 py-1 rounded-full">
            Pendiente
          </span>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isPending ? 'Cancelando...' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}
