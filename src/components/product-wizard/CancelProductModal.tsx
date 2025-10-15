'use client';

interface CancelProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName?: string;
  productType: 'circuit' | 'package';
}

export function CancelProductModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
  productType
}: CancelProductModalProps) {
  if (!isOpen) return null;

  const typeLabel = productType === 'circuit' ? 'Circuito' : 'Paquete';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Cancelar {typeLabel}?
            </h3>
            {productName && (
              <p className="text-sm text-gray-600 line-clamp-1">
                "{productName}"
              </p>
            )}
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-900 font-medium mb-2">
            ⚠️ Acción Irreversible
          </p>
          <p className="text-sm text-red-800">
            Si cancelas ahora, <strong>todos los datos capturados se PERDERÁN permanentemente</strong>.
            No podrás recuperarlos después.
          </p>
        </div>

        {/* Suggestion Box */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-semibold text-yellow-900 mb-1">
                💡 Mejor Opción
              </p>
              <p className="text-xs text-yellow-800">
                Puedes salir de esta página y volver más tarde. Tus datos se guardan automáticamente
                y podrás continuar donde lo dejaste.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-200 active:scale-95"
          >
            Seguir Editando
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 hover:shadow-lg font-medium transition-all duration-200 active:scale-95"
          >
            Sí, Cancelar
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Presiona <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Esc</kbd> para cerrar
        </p>
      </div>

      {/* ESC key handler */}
      <div
        className="hidden"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        tabIndex={-1}
      />
    </div>
  );
}
