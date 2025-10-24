'use client';

/**
 * Datos de recuperación del wizard con metadata adicional
 */
export interface ProductFormDataWithRecovery {
  name?: string;
  productType?: 'circuit' | 'package';
  description?: string;
  currentStep?: number;
  _savedAt?: string;
  _savedBy?: 'auto-save' | 'manual' | 'recovery';
  [key: string]: unknown;
}

interface RecoveryModalProps {
  isOpen: boolean;
  recoveryData: ProductFormDataWithRecovery | null;
  onRecover: () => void;
  onDiscard: () => void;
}

export function RecoveryModal({
  isOpen,
  recoveryData,
  onRecover,
  onDiscard
}: RecoveryModalProps) {
  if (!isOpen) return null;

  const savedAt = recoveryData?._savedAt
    ? new Date(recoveryData._savedAt).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'desconocida';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Datos Pendientes Detectados
            </h3>
            <p className="text-xs text-gray-500">
              Guardado: {savedAt}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900 mb-3 font-medium">
            📦 Encontramos un borrador guardado de:
          </p>
          <div className="space-y-2 text-sm bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Producto:</span>
              <span className="font-semibold text-gray-900">
                {recoveryData?.name || 'Sin nombre'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tipo:</span>
              <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                {recoveryData?.productType === 'circuit' ? (
                  <>
                    <span>🗺️</span> Circuito
                  </>
                ) : (
                  <>
                    <span>📦</span> Paquete
                  </>
                )}
              </span>
            </div>
            {recoveryData?.description && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-gray-700 text-xs line-clamp-2 italic">
                  "{recoveryData.description}"
                </p>
              </div>
            )}
            {recoveryData?.currentStep !== undefined && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600">Progreso:</span>
                <span className="text-xs font-medium text-purple-600">
                  Paso {recoveryData.currentStep + 1}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-200 active:scale-95"
          >
            Descartar
          </button>
          <button
            onClick={onRecover}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 active:scale-95"
          >
            Recuperar Datos
          </button>
        </div>

        {/* Footer tip */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Los datos se guardan automáticamente mientras trabajas
          </p>
        </div>
      </div>
    </div>
  );
}
