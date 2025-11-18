'use client';

/**
 * UndoRedoControls - Reactive Undo/Redo UI for CE.SDK
 *
 * Provides visual buttons and keyboard shortcuts for undo/redo functionality.
 * Subscribes to CE.SDK's onHistoryUpdated event to reactively update button states.
 *
 * Implements IMG.LY best practices for history management.
 * Reference: docs/CESDK_NEXTJS_LLMS_FULL.txt (Event API - History Events)
 *
 * @example
 * ```tsx
 * <UndoRedoControls
 *   cesdkInstance={cesdkInstance}
 *   className="flex gap-2"
 * />
 * ```
 */

import { useEffect, useState } from 'react';
import type CreativeEditorSDK from '@cesdk/cesdk-js';

// ============================================================================
// TYPES
// ============================================================================

export interface UndoRedoControlsProps {
  /** CE.SDK instance (required) */
  cesdkInstance: CreativeEditorSDK | null;

  /** Optional CSS class for container */
  className?: string;

  /** Show keyboard shortcuts in tooltips (default: true) */
  showTooltips?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UndoRedoControls({
  cesdkInstance,
  className = '',
  showTooltips = true
}: UndoRedoControlsProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Subscribe to history updates and keyboard shortcuts
   */
  useEffect(() => {
    if (!cesdkInstance) return;

    // Initial state
    setCanUndo(cesdkInstance.engine.editor.canUndo());
    setCanRedo(cesdkInstance.engine.editor.canRedo());

    console.log('[UndoRedoControls] 📚 Subscribing to history events');

    // Subscribe to history updates
    const unsubscribe = cesdkInstance.engine.editor.onHistoryUpdated(() => {
      const undoAvailable = cesdkInstance.engine.editor.canUndo();
      const redoAvailable = cesdkInstance.engine.editor.canRedo();

      console.log('[UndoRedoControls] 🔄 History updated:', {
        canUndo: undoAvailable,
        canRedo: redoAvailable
      });

      setCanUndo(undoAvailable);
      setCanRedo(redoAvailable);
    });

    // Keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo: Ctrl+Z (Cmd+Z on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Shift+Z (Cmd+Shift+Z on Mac) OR Ctrl+Y
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    console.log('[UndoRedoControls] ⌨️ Keyboard shortcuts registered (Ctrl+Z, Ctrl+Shift+Z)');

    // Cleanup
    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
      console.log('[UndoRedoControls] 🧹 Unsubscribed from history events');
    };
  }, [cesdkInstance]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleUndo = () => {
    if (!cesdkInstance || !canUndo) return;

    console.log('[UndoRedoControls] ↶ Undo triggered');
    cesdkInstance.engine.editor.undo();

    // Show notification
    cesdkInstance.ui.showNotification({
      type: 'success',
      message: 'Deshacer',
      duration: 'short'
    });
  };

  const handleRedo = () => {
    if (!cesdkInstance || !canRedo) return;

    console.log('[UndoRedoControls] ↷ Redo triggered');
    cesdkInstance.engine.editor.redo();

    // Show notification
    cesdkInstance.ui.showNotification({
      type: 'success',
      message: 'Rehacer',
      duration: 'short'
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!cesdkInstance) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Undo Button */}
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        title={showTooltips ? 'Deshacer (Ctrl+Z)' : undefined}
        className={`
          relative group
          w-10 h-10 rounded-lg
          flex items-center justify-center
          transition-all duration-200
          ${canUndo
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl text-white cursor-pointer'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
          }
        `}
      >
        {/* Undo Icon (↶) */}
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
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>

        {/* Tooltip */}
        {showTooltips && (
          <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Deshacer (Ctrl+Z)
          </span>
        )}
      </button>

      {/* Redo Button */}
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        title={showTooltips ? 'Rehacer (Ctrl+Shift+Z)' : undefined}
        className={`
          relative group
          w-10 h-10 rounded-lg
          flex items-center justify-center
          transition-all duration-200
          ${canRedo
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl text-white cursor-pointer'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
          }
        `}
      >
        {/* Redo Icon (↷) */}
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
            d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
          />
        </svg>

        {/* Tooltip */}
        {showTooltips && (
          <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Rehacer (Ctrl+Shift+Z)
          </span>
        )}
      </button>
    </div>
  );
}
