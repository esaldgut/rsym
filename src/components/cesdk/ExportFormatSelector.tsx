'use client';

/**
 * ExportFormatSelector - Video Export Format Selection UI
 *
 * Modal/dropdown component for selecting video export format and quality
 * before exporting from CE.SDK. Integrates with useVideoTranscode hook
 * for server-side transcoding.
 *
 * Features:
 * - Format selection (MP4 native, WebM, MKV)
 * - Quality presets with descriptions
 * - File size estimates
 * - Browser compatibility info
 * - Loading states during transcoding
 *
 * @example
 * ```tsx
 * <ExportFormatSelector
 *   isOpen={showExportModal}
 *   onClose={() => setShowExportModal(false)}
 *   onExport={handleExport}
 *   isVideoMode={true}
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import {
  useVideoTranscode,
  downloadTranscodedVideo,
  getFormatDisplayName,
  getQualityDescription,
  type TranscodeFormat,
  type TranscodeQuality
} from '@/hooks/useVideoTranscode';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'mp4' | 'webm' | 'mkv';

export interface ExportFormatSelectorProps {
  /** Whether the selector is open/visible */
  isOpen: boolean;

  /** Callback when selector is closed */
  onClose: () => void;

  /**
   * Callback when user wants to export
   * @param format - Selected format
   * @param quality - Selected quality (for transcoding)
   */
  onExport: (format: ExportFormat, quality: TranscodeQuality) => Promise<void>;

  /** Whether in video mode (enables all formats) */
  isVideoMode: boolean;

  /** Current video blob (for transcoding) */
  videoBlob?: Blob;

  /** Current video filename */
  videoFilename?: string;

  /** Custom class name */
  className?: string;
}

interface FormatOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: string;
  requiresTranscoding: boolean;
  codec: string;
  browserSupport: string;
}

interface QualityOption {
  id: TranscodeQuality;
  name: string;
  description: string;
  icon: string;
  estimatedSize: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'mp4',
    name: 'MP4',
    description: 'Formato universal, máxima compatibilidad',
    icon: '🎬',
    requiresTranscoding: false,
    codec: 'H.264 + AAC',
    browserSupport: 'Todos los navegadores y dispositivos'
  },
  {
    id: 'webm',
    name: 'WebM',
    description: 'Formato web optimizado, mejor compresión',
    icon: '🌐',
    requiresTranscoding: true,
    codec: 'VP9 + Opus',
    browserSupport: 'Chrome, Firefox, Edge'
  },
  {
    id: 'mkv',
    name: 'MKV',
    description: 'Formato profesional, alta calidad',
    icon: '🎥',
    requiresTranscoding: true,
    codec: 'H.264 + AAC',
    browserSupport: 'VLC, reproductores de escritorio'
  }
];

const QUALITY_OPTIONS: QualityOption[] = [
  {
    id: 'low',
    name: 'Baja',
    description: 'Archivo pequeño, carga rápida',
    icon: '📱',
    estimatedSize: '~1 MB/min'
  },
  {
    id: 'medium',
    name: 'Media',
    description: 'Equilibrio entre calidad y tamaño',
    icon: '💻',
    estimatedSize: '~2 MB/min'
  },
  {
    id: 'high',
    name: 'Alta',
    description: 'Máxima calidad, archivo grande',
    icon: '🖥️',
    estimatedSize: '~4 MB/min'
  }
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ExportFormatSelector({
  isOpen,
  onClose,
  onExport,
  isVideoMode,
  videoBlob,
  videoFilename,
  className = ''
}: ExportFormatSelectorProps): React.ReactElement | null {
  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<TranscodeQuality>('medium');
  const [isExporting, setIsExporting] = useState(false);

  // ============================================================================
  // HOOKS
  // ============================================================================

  const { transcode, isTranscoding, error: transcodeError, clearError } = useVideoTranscode();

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const selectedFormatOption = FORMAT_OPTIONS.find(f => f.id === selectedFormat);
  const requiresTranscoding = selectedFormatOption?.requiresTranscoding ?? false;
  const showQualitySelector = requiresTranscoding && isVideoMode;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleExport = useCallback(async () => {
    console.log('[ExportFormatSelector] 🎬 Starting export:', {
      format: selectedFormat,
      quality: selectedQuality,
      requiresTranscoding
    });

    setIsExporting(true);
    clearError();

    try {
      // If format requires transcoding and we have a video blob
      if (requiresTranscoding && videoBlob && videoFilename) {
        console.log('[ExportFormatSelector] 🔄 Transcoding required...');

        const result = await transcode(
          videoBlob,
          videoFilename,
          {
            format: selectedFormat as TranscodeFormat,
            quality: selectedQuality
          }
        );

        if (result) {
          console.log('[ExportFormatSelector] ✅ Transcoding complete, downloading...');
          downloadTranscodedVideo(result);
          onClose();
        }
        // Error is handled by the hook
      } else {
        // Native export (MP4) or no blob provided
        await onExport(selectedFormat, selectedQuality);
        onClose();
      }
    } catch (err) {
      console.error('[ExportFormatSelector] ❌ Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [
    selectedFormat,
    selectedQuality,
    requiresTranscoding,
    videoBlob,
    videoFilename,
    transcode,
    onExport,
    onClose,
    clearError
  ]);

  const handleClose = useCallback(() => {
    if (!isExporting && !isTranscoding) {
      clearError();
      onClose();
    }
  }, [isExporting, isTranscoding, clearError, onClose]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📹</span>
              Exportar Video
            </h2>
            <button
              onClick={handleClose}
              disabled={isExporting || isTranscoding}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Formato de salida
            </h3>
            <div className="space-y-2">
              {FORMAT_OPTIONS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  disabled={isExporting || isTranscoding}
                  className={`
                    w-full p-4 rounded-lg text-left transition-all
                    ${selectedFormat === format.id
                      ? 'bg-purple-600/20 border-2 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{format.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{format.name}</span>
                        {format.requiresTranscoding && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                            Transcoding
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">{format.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format.codec} • {format.browserSupport}
                      </p>
                    </div>
                    {/* Radio indicator */}
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${selectedFormat === format.id
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-600'
                      }
                    `}>
                      {selectedFormat === format.id && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Selection (only for transcoding formats) */}
          {showQualitySelector && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Calidad
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {QUALITY_OPTIONS.map((quality) => (
                  <button
                    key={quality.id}
                    onClick={() => setSelectedQuality(quality.id)}
                    disabled={isExporting || isTranscoding}
                    className={`
                      p-3 rounded-lg text-center transition-all
                      ${selectedQuality === quality.id
                        ? 'bg-purple-600/20 border-2 border-purple-500'
                        : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <span className="text-xl">{quality.icon}</span>
                    <div className="font-medium text-white mt-1">{quality.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{quality.estimatedSize}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {getQualityDescription(selectedQuality)}
              </p>
            </div>
          )}

          {/* Transcoding Info */}
          {requiresTranscoding && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-yellow-500">⚠️</span>
                <div>
                  <p className="text-sm text-yellow-400 font-medium">
                    Requiere procesamiento en servidor
                  </p>
                  <p className="text-xs text-yellow-500/80 mt-1">
                    El video se convertirá a {getFormatDisplayName(selectedFormat as TranscodeFormat)}.
                    Esto puede tomar unos minutos dependiendo de la duración.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {transcodeError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-red-500">❌</span>
                <p className="text-sm text-red-400">{transcodeError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isExporting || isTranscoding}
            className="
              flex-1 px-4 py-2.5 rounded-lg font-medium
              bg-gray-700 text-gray-300 hover:bg-gray-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || isTranscoding}
            className="
              flex-1 px-4 py-2.5 rounded-lg font-medium
              bg-gradient-to-r from-pink-500 to-purple-600
              text-white hover:from-pink-600 hover:to-purple-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
              flex items-center justify-center gap-2
            "
          >
            {(isExporting || isTranscoding) ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{isTranscoding ? 'Transcodificando...' : 'Exportando...'}</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span>Exportar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ExportFormatSelector;
