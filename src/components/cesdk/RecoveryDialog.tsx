'use client';

/**
 * RecoveryDialog - Draft Recovery Modal for CE.SDK
 *
 * Displays when user reopens editor with abandoned session (<24h old).
 * Offers options to recover draft or start fresh.
 *
 * Implements IMG.LY best practices for auto-save recovery system.
 * Reference: docs/CESDK_NEXTJS_LLMS_FULL.txt (Auto-Save Optimization)
 *
 * @example
 * ```tsx
 * <RecoveryDialog
 *   isOpen={hasDraft}
 *   draftMetadata={metadata}
 *   onRecover={handleRecover}
 *   onDiscard={handleDiscard}
 * />
 * ```
 */

import { useEffect } from 'react';
import type { SaveMetadata } from '@/hooks/useAutoSave';

// ============================================================================
// TYPES
// ============================================================================

export interface RecoveryDialogProps {
  /** Show/hide dialog */
  isOpen: boolean;

  /** Draft metadata from localStorage */
  draftMetadata: SaveMetadata | null;

  /** Callback to recover draft */
  onRecover: () => void;

  /** Callback to discard draft and start fresh */
  onDiscard: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format timestamp to human-readable relative time
 */
function formatRelativeTime(isoTimestamp: string): string {
  const savedDate = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - savedDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return 'Hace un momento';
  }
}

/**
 * Format timestamp to readable date/time
 */
function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
}

/**
 * Get icon for savedBy type
 */
function getSaveTypeIcon(savedBy: 'auto-save' | 'manual' | 'recovery'): string {
  switch (savedBy) {
    case 'auto-save':
      return '🔄';
    case 'manual':
      return '💾';
    case 'recovery':
      return '🔁';
    default:
      return '📝';
  }
}

/**
 * Get label for savedBy type
 */
function getSaveTypeLabel(savedBy: 'auto-save' | 'manual' | 'recovery'): string {
  switch (savedBy) {
    case 'auto-save':
      return 'Auto-guardado';
    case 'manual':
      return 'Guardado manual';
    case 'recovery':
      return 'Recuperación';
    default:
      return 'Guardado';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RecoveryDialog({
  isOpen,
  draftMetadata,
  onRecover,
  onDiscard
}: RecoveryDialogProps) {
  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen || !draftMetadata) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[201]">
        <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-pink-500/20">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  Sesión no guardada encontrada
                </h3>
                <p className="text-gray-400 text-sm">
                  Encontramos un borrador de tu momento anterior. ¿Quieres recuperarlo?
                </p>
              </div>
            </div>
          </div>

          {/* Content - Draft Metadata */}
          <div className="p-6 space-y-4">
            {/* Relative Time */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Última modificación</p>
                <p className="text-white font-medium">
                  {formatRelativeTime(draftMetadata.timestamp)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(draftMetadata.timestamp)}
                </p>
              </div>
            </div>

            {/* Save Type */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{getSaveTypeIcon(draftMetadata.savedBy)}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de guardado</p>
                <p className="text-white font-medium">
                  {getSaveTypeLabel(draftMetadata.savedBy)}
                </p>
              </div>
            </div>

            {/* Size */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tamaño del borrador</p>
                <p className="text-white font-medium">
                  {formatBytes(draftMetadata.size)}
                </p>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-amber-200">
                  Si descartas este borrador, se perderá permanentemente y no podrás recuperarlo.
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-800 flex flex-col sm:flex-row gap-3">
            {/* Discard */}
            <button
              onClick={onDiscard}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
            >
              Descartar
            </button>

            {/* Recover */}
            <button
              onClick={onRecover}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg font-bold"
            >
              Recuperar Borrador →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
