'use client';

/**
 * CESDKEditorWrapper - Creative Editor SDK Integration for YAAN
 *
 * Integrates IMG.LY's CE.SDK for professional image and video editing with YAAN branding.
 * Provides a complete editing experience for Moments creation with YAAN's visual identity.
 *
 * Features:
 * - Image editing (crop, filters, adjustments, text, stickers)
 * - Video editing (trim, filters, effects) - Desktop only
 * - YAAN branded theme (pink-500 to purple-600 gradient)
 * - Export to various formats
 * - S3 upload integration
 *
 * @example
 * ```tsx
 * <CESDKEditorWrapper
 *   initialMediaUrl="https://..."
 *   mediaType="image"
 *   onExport={async (blob) => {
 *     // Upload to S3 and create moment
 *   }}
 *   onClose={() => router.back()}
 * />
 * ```
 */

import { EyeDropperButton } from '@/components/cesdk/EyeDropperButton'
import { ExportFormatSelector, type ExportFormat } from '@/components/cesdk/ExportFormatSelector'
import { RecoveryDialog } from '@/components/cesdk/RecoveryDialog'
import { TimelineGroupPanel } from '@/components/cesdk/TimelineGroupPanel'
import { UndoRedoControls } from '@/components/cesdk/UndoRedoControls'
import { useVideoTranscode, type TranscodeQuality, type TranscodeFormat } from '@/hooks/useVideoTranscode'
import { applyYaanTheme } from '@/config/cesdk/ThemeConfigYAAN'
import type { SaveMetadata } from '@/hooks/useAutoSave'
import { useAutoSave } from '@/hooks/useAutoSave'
import { createYaanAssetSource } from '@/lib/cesdk/yaan-asset-source'
import { detectBrowser } from '@/utils/browser-detection'
import type { Configuration, DesignBlockTypeLonghand, ImageMimeType } from '@cesdk/cesdk-js'
import CreativeEditorSDK, { supportsVideo } from '@cesdk/cesdk-js'
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web'
import { useCallback, useEffect, useRef, useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface CESDKEditorWrapperProps {
  /** User ID for CE.SDK licensing and tracking */
  userId: string;

  /** Initial media URL to load (image or video) */
  initialMediaUrl?: string;

  /** Media type */
  mediaType: 'image' | 'video';

  /** Callback when user exports edited media */
  onExport: (blob: Blob, metadata: ExportMetadata) => Promise<void>;

  /** Callback when user closes editor */
  onClose: () => void;

  /** Show loading state */
  loading?: boolean;

  /** Custom CSS class */
  className?: string;
}

export interface ExportMetadata {
  /** Original filename */
  filename: string;

  /** MIME type */
  mimeType: string;

  /** File size in bytes */
  size: number;

  /** Export format used */
  format: 'image/png' | 'image/jpeg' | 'video/mp4' | 'video/webm' | 'video/x-matroska';

  /** Export quality (if applicable) */
  quality?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CESDKEditorWrapper({
  userId,
  initialMediaUrl,
  mediaType,
  onExport,
  onClose,
  loading = false,
  className = ''
}: CESDKEditorWrapperProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const containerRef = useRef<HTMLDivElement>(null);
  const cesdkRef = useRef<CreativeEditorSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // NOTE: isExporting state removed - Actions API handles loading states via Utils API

  // FASE 2.2: Auto-save and Recovery state
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [draftMetadata, setDraftMetadata] = useState<SaveMetadata | null>(null);
  const hasCheckedDraft = useRef(false);

  // FASE 3: Export Format Selector state (WebM/MKV transcoding)
  const [showExportModal, setShowExportModal] = useState(false);
  const [pendingExportBlob, setPendingExportBlob] = useState<Blob | null>(null);
  const [pendingExportFilename, setPendingExportFilename] = useState<string>('');

  // ============================================================================
  // AUTO-SAVE HOOK (FASE 2.2)
  // ============================================================================

  const {
    saveNow,
    hasUnsavedChanges,
    lastSaved,
    isSaving,
    clearDrafts,
    loadDraft
  } = useAutoSave({
    cesdk: cesdkRef.current,
    userId: userId,
    enabled: isInitialized, // Only enable after CE.SDK is ready
    interval: 30000, // 30 seconds
    onSave: (metadata) => {
      console.log('[CESDKEditorWrapper] 💾 Auto-save completed:', metadata);
    },
    onError: (error) => {
      console.error('[CESDKEditorWrapper] ❌ Auto-save error:', error);
    }
  });

  // ============================================================================
  // VIDEO TRANSCODING HOOK (FASE 3 - WebM/MKV Export)
  // ============================================================================

  const {
    transcode,
    isTranscoding,
    error: transcodeError,
    clearError: clearTranscodeError
  } = useVideoTranscode();

  // ============================================================================
  // RECOVERY HANDLERS (FASE 2.2)
  // ============================================================================

  /**
   * Check for existing draft on mount
   */
  useEffect(() => {
    if (hasCheckedDraft.current || !userId) return;

    const draftKey = `moment-draft-${userId}-latest`;
    const timestampKey = `${draftKey}-timestamp`;
    const hashKey = `${draftKey}-hash`;
    const sizeKey = `${draftKey}-size`;
    const savedByKey = `${draftKey}-savedBy`;

    const sceneString = localStorage.getItem(draftKey);
    const timestamp = localStorage.getItem(timestampKey);

    if (sceneString && timestamp) {
      // Check if draft is less than 24 hours old
      const savedDate = new Date(timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        // Show recovery dialog
        const metadata: SaveMetadata = {
          timestamp,
          savedBy: localStorage.getItem(savedByKey) as 'auto-save' | 'manual' | 'recovery' || 'auto-save',
          hash: localStorage.getItem(hashKey) || '',
          size: parseInt(localStorage.getItem(sizeKey) || '0', 10)
        };

        setDraftMetadata(metadata);
        setShowRecoveryDialog(true);

        console.log('[CESDKEditorWrapper] 🔁 Draft found:', {
          age: `${hoursDiff.toFixed(1)} hours`,
          size: `${(metadata.size / 1024).toFixed(2)} KB`
        });
      } else {
        // Draft too old, cleanup
        console.log('[CESDKEditorWrapper] 🧹 Draft older than 24h, cleaning up');
        clearDrafts();
      }
    }

    hasCheckedDraft.current = true;
  }, [userId, clearDrafts]);

  /**
   * Handle draft recovery
   */
  const handleRecoverDraft = useCallback(async () => {
    console.log('[CESDKEditorWrapper] 🔁 Recovering draft...');
    const success = await loadDraft();

    if (success) {
      setShowRecoveryDialog(false);
      console.log('[CESDKEditorWrapper] ✅ Draft recovered successfully');
    } else {
      console.error('[CESDKEditorWrapper] ❌ Failed to recover draft');
      setError('Failed to load draft');
    }
  }, [loadDraft]);

  /**
   * Handle draft discard
   */
  const handleDiscardDraft = useCallback(() => {
    console.log('[CESDKEditorWrapper] 🗑️ Discarding draft...');
    clearDrafts();
    setShowRecoveryDialog(false);
    console.log('[CESDKEditorWrapper] ✅ Draft discarded');
  }, [clearDrafts]);

  // ============================================================================
  // VIDEO FORMAT EXPORT HANDLER (FASE 3 - WebM/MKV Transcoding)
  // ============================================================================
  // Handles export format selection from ExportFormatSelector modal
  // - MP4: Uses pending blob directly (native CE.SDK export)
  // - WebM/MKV: Transcodes via /api/transcode-video endpoint
  // ============================================================================

  const handleFormatExport = useCallback(async (format: ExportFormat, quality: TranscodeQuality) => {
    console.log('[CESDKEditorWrapper] 🎬 handleFormatExport:', { format, quality });

    if (!pendingExportBlob) {
      console.error('[CESDKEditorWrapper] ❌ No pending export blob');
      setError('No hay video pendiente para exportar');
      return;
    }

    try {
      let finalBlob: Blob = pendingExportBlob;
      let finalFilename = `${pendingExportFilename}.mp4`;
      let finalMimeType: ExportMetadata['format'] = 'video/mp4';

      // ========================================================================
      // TRANSCODING (WebM/MKV)
      // ========================================================================
      if (format === 'webm' || format === 'mkv') {
        console.log('[CESDKEditorWrapper] 🔄 Transcoding to', format.toUpperCase());

        const transcodeResult = await transcode(
          pendingExportBlob,
          `${pendingExportFilename}.mp4`,
          {
            format: format as TranscodeFormat,
            quality
          }
        );

        if (!transcodeResult) {
          // Error is already set by useVideoTranscode hook
          console.error('[CESDKEditorWrapper] ❌ Transcoding failed');
          return;
        }

        finalBlob = transcodeResult.blob;
        finalFilename = transcodeResult.filename;
        finalMimeType = transcodeResult.mimeType as ExportMetadata['format'];

        console.log('[CESDKEditorWrapper] ✅ Transcoding complete:', {
          filename: finalFilename,
          size: `${(finalBlob.size / 1024 / 1024).toFixed(2)} MB`
        });
      }

      // ========================================================================
      // BUILD METADATA AND CALL PARENT EXPORT
      // ========================================================================
      const metadata: ExportMetadata = {
        filename: finalFilename,
        mimeType: finalMimeType,
        size: finalBlob.size,
        format: finalMimeType,
        quality: format === 'mp4' ? 0.95 : undefined
      };

      console.log('[CESDKEditorWrapper] 📤 Calling onExport with:', {
        filename: metadata.filename,
        format: metadata.format,
        size: `${(metadata.size / 1024 / 1024).toFixed(2)} MB`
      });

      await onExport(finalBlob, metadata);

      // ========================================================================
      // CLEANUP
      // ========================================================================
      setShowExportModal(false);
      setPendingExportBlob(null);
      setPendingExportFilename('');
      clearTranscodeError();

      console.log('[CESDKEditorWrapper] ✅ Export complete');

    } catch (err) {
      console.error('[CESDKEditorWrapper] ❌ Export error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al exportar video';
      setError(errorMessage);
    }
  }, [pendingExportBlob, pendingExportFilename, transcode, onExport, clearTranscodeError]);

  /**
   * Handle export modal close
   */
  const handleCloseExportModal = useCallback(() => {
    console.log('[CESDKEditorWrapper] 🔙 Closing export modal');
    setShowExportModal(false);
    setPendingExportBlob(null);
    setPendingExportFilename('');
    clearTranscodeError();
  }, [clearTranscodeError]);

  // ============================================================================
  // LOAD INITIAL MEDIA FUNCTION
  // ============================================================================
  // FIX v2.13.0: Moved BEFORE main useEffect so it can be called synchronously
  // - Called immediately after createVideoScene/createDesignScene
  // - No longer depends on separate useEffect with race condition
  // - Executes in same execution context as scene creation (eliminates destruction window)
  //
  // Previous issues fixed:
  // - v2.7.1: Added retry logic (over-engineered, removed in v2.7.2)
  // - v2.7.2: Moved to execute immediately after createScene (caused re-initialization bug)
  // - v2.7.3: Separated to dedicated useEffect (correct React pattern, but had race condition)
  // - v2.12.0: Added isInitialized to dependencies (fixed race condition, but scene was still destroyed)
  // - v2.13.0: Moved back to synchronous execution in main useEffect (eliminates destruction window)
  // ============================================================================

  const loadInitialMedia = async (
    cesdk: CreativeEditorSDK,
    mediaUrl: string,
    type: 'image' | 'video'
  ) => {
    try {
      console.log('[CESDKEditorWrapper] 📥 Loading initial media:', mediaUrl);
      console.log('[CESDKEditorWrapper] 📝 Media type:', type);

      const engine = cesdk.engine;

      // FIX v2.13.0: Scene is ready because we're calling this IMMEDIATELY after createScene
      // No time window for scene to be destroyed/null
      const scene = engine.scene.get();

      if (!scene) {
        console.error('[CESDKEditorWrapper] ❌ No active scene found');
        console.error('[CESDKEditorWrapper] 💡 Scene should exist - CE.SDK was initialized');
        console.error('[CESDKEditorWrapper] 🔍 Debug info:', {
          hasEngine: !!engine,
          mediaType: type
        });
        return;
      }

      console.log('[CESDKEditorWrapper] ✅ Scene ready:', scene);

      // Get all pages in the scene
      const pages = engine.block.findByType('page');

      if (pages.length === 0) {
        console.error('[CESDKEditorWrapper] ❌ No pages found in scene');
        return;
      }

      const pageId = pages[0]; // Use first page
      console.log('[CESDKEditorWrapper] 📄 Using page:', pageId);

      // Get page dimensions for sizing
      const pageWidth = engine.block.getWidth(pageId);
      const pageHeight = engine.block.getHeight(pageId);
      console.log('[CESDKEditorWrapper] 📐 Page dimensions:', { width: pageWidth, height: pageHeight });

      // Create and add media block based on type
      let blockId: number;

      if (type === 'video') {
        // RECOMMENDED APPROACH: Use official addVideo() API (CE.SDK docs lines 43477-43506)
        console.log('[CESDKEditorWrapper] 🎬 Adding video using official addVideo() API...');

        blockId = await engine.block.addVideo(
          mediaUrl,
          pageWidth,
          pageHeight,
          {
            sizeMode: 'Absolute',
            positionMode: 'Absolute',
            x: pageWidth / 2,
            y: pageHeight / 2
          }
        );

        console.log('[CESDKEditorWrapper] ✅ Video block created and added:', blockId);
      } else {
        // ✅ FIX v2.11.0: Use official addImage() API instead of manual pattern
        // RECOMMENDED APPROACH: Use official addImage() API (CE.SDK docs line 8270)
        // This ensures CE.SDK's automatic rendering logic is triggered
        console.log('[CESDKEditorWrapper] 🖼️ Adding image using official addImage() API...');

        blockId = await engine.block.addImage(mediaUrl, {
          size: { width: pageWidth, height: pageHeight }
        });

        engine.block.appendChild(pageId, blockId);
        engine.block.setPositionX(blockId, pageWidth / 2);
        engine.block.setPositionY(blockId, pageHeight / 2);

        // Set as background or main content layer
        engine.block.sendToBack(blockId);

        console.log('[CESDKEditorWrapper] ✅ Image block created and added using addImage() API:', blockId);
      }

      console.log('[CESDKEditorWrapper] 🎉 Initial media loaded successfully');

    } catch (err) {
      console.error('[CESDKEditorWrapper] ❌ Failed to load initial media:', err);
      console.error('[CESDKEditorWrapper] 📋 Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      // Non-critical - user can still add media manually through CE.SDK UI
    }
  };

  // ============================================================================
  // CESDK INITIALIZATION
  // ============================================================================

  useEffect(() => {
    let mounted = true;
    let cesdkInstance: CreativeEditorSDK | null = null;
    let cleanupEvents: (() => void) | null = null; // Store event cleanup function

    const initializeEditor = async () => {
      if (!containerRef.current) {
        console.warn('[CESDKEditorWrapper] Container ref not available');
        return;
      }

      try {
        console.log('[CESDKEditorWrapper] 🎨 Initializing CE.SDK...');

        // Get configuration from environment
        const licenseKey = process.env.NEXT_PUBLIC_CESDK_LICENSE_KEY || '';
        // CRITICAL FIX (2025-11-18): Use local assets instead of CDN to avoid WASM loading errors
        // CDN was returning 500 errors and incorrect MIME types for WASM files
        const baseURL = '/cesdk-assets/'; // Local assets copied to public/cesdk-assets/

        if (!licenseKey) {
          console.warn('[CESDKEditorWrapper] ⚠️ No license key found - watermark will be shown on exports');
        }

        console.log('[CESDKEditorWrapper] 📦 Using local assets from:', baseURL);

        // ========================================================================
        // FASE B.2: DEVICE-BASED PERFORMANCE OPTIMIZATION (2025-11-18)
        // ========================================================================
        // Detect device type and adjust maxImageSize to prevent memory issues
        //
        // Mobile devices have limited memory (~2GB browser tab cap) and should
        // use lower resolution limits to prevent crashes and improve performance.
        //
        // Desktop can handle higher resolution for professional editing quality.
        //
        // Reference: docs/CESDK_NEXTJS_LLMS_FULL.txt (Performance Best Practices)
        // ========================================================================

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const maxImageSize = isMobile ? 2048 : 4096;

        console.log('[CESDKEditorWrapper] 📱 Device detected:', {
          isMobile,
          maxImageSize: `${maxImageSize}x${maxImageSize}`,
          userAgent: navigator.userAgent.substring(0, 50) + '...'
        });

        // CE.SDK configuration with YAAN theming
        const config: Configuration = {
          license: licenseKey,
          userId: userId, // User ID from props for licensing and tracking
          baseURL: baseURL, // Always use local assets
          role: 'Creator', // Full editing capabilities
          editor: {
            maxImageSize: maxImageSize // Device-optimized image size limit
          }
        };

        // Initialize CE.SDK
        cesdkInstance = await CreativeEditorSDK.create(containerRef.current, config);

        if (!mounted) {
          console.log('[CESDKEditorWrapper] Component unmounted during initialization');
          await cesdkInstance?.dispose();
          return;
        }

        console.log('[CESDKEditorWrapper] ✅ CE.SDK initialized successfully');

        // Apply YAAN theme customization
        await applyYaanTheme(cesdkInstance);

        // ========================================================================
        // FIX v2.14.0: LAZY ASSET LOADING PATTERN
        // ========================================================================
        //
        // ROOT CAUSE DISCOVERY (2025-10-23):
        // v2.7.4 loaded assets BEFORE creating scene, but CE.SDK needs the scene
        // to exist first to properly configure Video vs Design mode asset sources.
        //
        // PROBLEM:
        // - addDemoAssetSources({ sceneMode: 'Video' }) executed BEFORE createVideoScene()
        // - CE.SDK looks for ly.img.page.presets.video when creating scene
        // - Presets don't exist yet → scene creation FAILS → scene = null
        //
        // EVIDENCE:
        // [UBQ] No default page format could be found.
        // Make sure the asset sources listed in the config (ly.img.page.presets.video)
        // are available before creating the scene.
        //
        // SOLUTION:
        // 1. Create scene FIRST (with minimal config, no asset dependencies)
        // 2. Load initial media IMMEDIATELY (renders user content fast)
        // 3. Load asset sources PROGRESSIVELY in background (non-blocking)
        //
        // BENEFITS:
        // - Scene always succeeds (no external dependencies)
        // - User sees their content immediately
        // - Assets load progressively without blocking UX
        // - Graceful degradation if asset loading fails
        //
        // References:
        // - UBQ Warning: docs/CESDK_NEXTJS_LLMS_FULL.txt lines 721-723
        // - Root Cause Analysis: docs/ROOT-CAUSE-ANALYSIS-v2.14.0.md
        // ========================================================================

        // ========================================================================
        // PHASE 1: CREATE SCENE (Minimal Config - No Asset Dependencies)
        // ========================================================================

        console.log('[CESDKEditorWrapper] 🎬 Creating scene with minimal configuration...');
        if (mediaType === 'video') {
          // CRITICAL: Use CE.SDK official supportsVideo() function
          const videoSupported = supportsVideo();
          const browserInfo = detectBrowser(); // For error messaging only

          if (videoSupported) {
            console.log('[CESDKEditorWrapper] ✅ Video editing supported (CE.SDK official check)');
            console.log(`[CESDKEditorWrapper] Browser: ${browserInfo.name} ${browserInfo.version} on ${browserInfo.os}`);

            // Create video scene WITHOUT waiting for assets
            await cesdkInstance.createVideoScene();
            console.log('[CESDKEditorWrapper] ✅ Video scene created successfully');

            // Register custom handler for unsupported browsers (fallback safety)
            cesdkInstance.actions.register('onUnsupportedBrowser', () => {
              console.warn('[CESDKEditorWrapper] ⚠️ Video editing no soportado en este navegador');
              setError(
                `⚠️ Edición de video no disponible\n\n` +
                `Tu navegador no soporta las tecnologías necesarias para editar videos (WebCodecs API).\n\n` +
                `Navegadores compatibles:\n` +
                `• Google Chrome 114+ (Windows, macOS)\n` +
                `• Microsoft Edge 114+\n` +
                `• Safari 26.0+ (macOS Sequoia 15.3+)\n\n` +
                `Razones comunes:\n` +
                `• Navegador móvil (no soportados)\n` +
                `• Firefox (no soportado)\n` +
                `• Chrome en Linux (carece de encoder AAC)\n` +
                `• Safari anterior a 26.0\n\n` +
                `Alternativa: Puedes crear momentos con imágenes.`
              );
            });
          } else {
            // Browser doesn't support video editing
            console.warn('[CESDKEditorWrapper] ❌ Video not supported (CE.SDK official check)');
            console.warn(`[CESDKEditorWrapper] Browser: ${browserInfo.name} ${browserInfo.version} on ${browserInfo.os}`);

            setError(
              `⚠️ Edición de video no disponible\n\n` +
              `Tu navegador no soporta las tecnologías necesarias para editar videos (WebCodecs API).\n\n` +
              `Navegador detectado: ${browserInfo.name} ${browserInfo.version} (${browserInfo.os})\n\n` +
              `Navegadores compatibles:\n` +
              `• Google Chrome 114+ (Windows, macOS)\n` +
              `• Microsoft Edge 114+\n` +
              `• Safari 26.0+ (macOS Sequoia 15.3+)\n\n` +
              `Razones comunes:\n` +
              `• Navegador móvil (no soportados)\n` +
              `• Firefox (no soportado)\n` +
              `• Chrome en Linux (carece de encoder AAC)\n` +
              `• Safari anterior a 26.0\n\n` +
              `Alternativa: Puedes crear momentos con imágenes.`
            );

            // Fallback to design scene (image editing)
            await cesdkInstance.createDesignScene();
            console.log('[CESDKEditorWrapper] ✅ Design scene created (video fallback)');
          }
        } else {
          // Create design scene (image editing)
          await cesdkInstance.createDesignScene();
          console.log('[CESDKEditorWrapper] ✅ Design scene created successfully');
        }

        // ========================================================================
        // PHASE 2: LOAD INITIAL MEDIA (Fast User Content Rendering)
        // ========================================================================

        // FIX v2.14.0: Load media IMMEDIATELY after scene creation
        // Scene is guaranteed to exist at this point
        if (initialMediaUrl) {
          console.log('[CESDKEditorWrapper] 📥 Loading initial media immediately after scene creation...');
          await loadInitialMedia(cesdkInstance, initialMediaUrl, mediaType);
        }

        // ========================================================================
        // PHASE 3: LOAD ASSET SOURCES PROGRESSIVELY (Non-Blocking)
        // ========================================================================
        //
        // Now that scene exists, we can safely load asset sources in background.
        // These will populate the asset library UI without blocking user's media.
        //
        // Asset Sources:
        // - Default: Stickers, shapes, filters (LUT/duotone), effects, fonts, colors
        // - Demo: Templates, upload sources, sample images/videos
        //
        // This runs asynchronously and doesn't block the UI initialization.
        // ========================================================================

        console.log('[CESDKEditorWrapper] 📚 Loading asset sources progressively...');

        // Load assets in background (don't await)
        Promise.all([
          cesdkInstance.addDefaultAssetSources({
            baseURL: 'https://cdn.img.ly/assets/v4'
          }).then(() => {
            console.log('[CESDKEditorWrapper] ✅ Default asset sources loaded from CDN');
          }),

          cesdkInstance.addDemoAssetSources({
            sceneMode: mediaType === 'video' ? 'Video' : 'Design',
            withUploadAssetSources: true,
            baseURL: 'https://cdn.img.ly/assets/demo/v1'
          }).then(() => {
            console.log('[CESDKEditorWrapper] ✅ Demo asset sources loaded from CDN');
          })
        ]).then(() => {
          console.log('[CESDKEditorWrapper] 🎉 All asset sources loaded successfully');
        }).catch(assetError => {
          console.warn('[CESDKEditorWrapper] ⚠️ Asset source loading failed:', assetError);
          console.warn('[CESDKEditorWrapper] Editor will continue with limited assets');
        });

        // ========================================================================
        // PHASE 4: YAAN CUSTOM ASSETS & PLUGINS (Progressive Enhancement)
        // ========================================================================

        // YAAN Custom Asset Source (progressive, non-blocking)
        cesdkInstance.engine.asset.addSource(
          createYaanAssetSource()
        ).then(() => {
          console.log('[CESDKEditorWrapper] ✅ YAAN asset source registered');

          cesdkInstance.ui.addAssetLibraryEntry({
            id: 'yaan-stickers-entry',
            sourceIds: ['yaan-travel-stickers'],
            sceneMode: mediaType === 'video' ? 'Video' : 'Design',
            previewLength: 8,
            previewBackgroundType: 'cover',
            gridBackgroundType: 'cover',
            gridColumns: 4
          });

          console.log('[CESDKEditorWrapper] ✅ YAAN asset library entry added');

          // Personalize dock order (YAAN first)
          const currentDock = cesdkInstance.ui.getDockOrder();
          const yaanEntry = currentDock.find((item: any) => item.key === 'yaan-stickers-entry');
          const stickerEntry = currentDock.find((item: any) => item.key === 'ly.img.sticker');
          const otherEntries = currentDock.filter((item: any) =>
            item.key !== 'yaan-stickers-entry' && item.key !== 'ly.img.sticker'
          );

          cesdkInstance.ui.setDockOrder([yaanEntry, stickerEntry, ...otherEntries].filter(Boolean));
          console.log('[CESDKEditorWrapper] ✅ Dock order personalized (YAAN first)');
        }).catch(yaanError => {
          console.warn('[CESDKEditorWrapper] ⚠️ YAAN asset source integration failed:', yaanError);
        });

        // Background Removal Plugin (progressive, non-blocking)
        cesdkInstance.addPlugin(BackgroundRemovalPlugin()).then(() => {
          console.log('[CESDKEditorWrapper] ✅ Background Removal plugin registered');

          const currentCanvasMenu = cesdkInstance.ui.getCanvasMenuOrder();
          cesdkInstance.ui.setCanvasMenuOrder([
            'ly.img.background-removal.canvasMenu',
            ...currentCanvasMenu
          ]);

          const currentInspectorBar = cesdkInstance.ui.getInspectorBar();
          cesdkInstance.ui.setInspectorBar([
            'ly.img.background-removal.inspectorBar',
            ...currentInspectorBar
          ]);

          console.log('[CESDKEditorWrapper] ✅ Background Removal integrated');
        }).catch(bgRemovalError => {
          console.warn('[CESDKEditorWrapper] ⚠️ Background Removal plugin failed:', bgRemovalError);
          cesdkInstance.ui.showNotification({
            type: 'info',
            message: 'Algunas funciones avanzadas no están disponibles en este navegador.',
            duration: 'short'
          });
        });

        // ============================================================================
        // ACTIONS API REGISTRATION (FASE 1 - 2025-11-18)
        // ============================================================================
        // Register official CE.SDK actions for export and save functionality
        // Uses Utils API for native loading dialogs and success/error states

        console.log('[CESDKEditorWrapper] 📝 Registering Actions API...');

        // Export Action - Handles export with Notification System (FASE 2.3)
        cesdkInstance.actions.register('ly.img.export', async () => {
          console.log('[CESDKEditorWrapper] 🚀 Export action triggered');

          // Safety check - should never be null here but TypeScript requires it
          if (!cesdkInstance) {
            console.error('[CESDKEditorWrapper] ❌ CE.SDK instance is null');
            return;
          }

          // FASE 2.3: Use Notification System instead of Loading Dialog
          const notificationId = cesdkInstance.ui.showNotification({
            type: 'loading',
            message: 'Exportando tu momento...',
            duration: 'infinite'
          });

          try {
            const scene = cesdkInstance.engine.scene.get();
            if (!scene) {
              throw new Error('No active scene found for export');
            }

            // Determine export format and options based on media type
            const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
            const fileExtension = mediaType === 'video' ? 'mp4' : 'jpg';

            // FASE 2.5: Use cesdk.utils.export() with onProgress callback for video tracking
            const { blobs } = await cesdkInstance.utils.export({
              mimeType: mimeType as ImageMimeType,
              jpegQuality: 0.95,
              targetWidth: mediaType === 'video' ? 1920 : 2048,
              targetHeight: mediaType === 'video' ? 1080 : 2048,

              // Progress tracking for videos (frame-by-frame)
              onProgress: (rendered: number, encoded: number, total: number) => {
                // Only show progress for videos (images export instantly)
                if (mediaType === 'video') {
                  const progress = Math.round((encoded / total) * 100);
                  console.log(`[CESDKEditorWrapper] 🎬 Video export progress: ${progress}% (${encoded}/${total} frames)`);

                  // Update notification with progress percentage
                  cesdkInstance.ui.updateNotification(notificationId, {
                    type: 'loading',
                    message: `Exportando video: ${progress}%`,
                    duration: 'infinite'
                  });
                }
              }
            });

            // Extract first blob from result array
            const exportBlob = blobs[0];

            if (!exportBlob) {
              throw new Error('Export failed: No blob generated');
            }

            console.log('[CESDKEditorWrapper] ✅ Export completed:', {
              size: exportBlob.size,
              type: exportBlob.type
            });

            // ============================================================================
            // FASE 3: VIDEO FORMAT SELECTION (WebM/MKV Transcoding)
            // ============================================================================
            // For videos, show format selector modal before final export
            // This allows users to choose MP4 (native), WebM, or MKV format
            // WebM/MKV are transcoded server-side via /api/transcode-video

            if (mediaType === 'video') {
              console.log('[CESDKEditorWrapper] 🎬 Video mode - showing format selector');

              // Store blob and filename for later use by handleFormatExport
              setPendingExportBlob(exportBlob);
              setPendingExportFilename(`yaan-moment-${Date.now()}`);

              // Close loading notification
              cesdkInstance.ui.updateNotification(notificationId, {
                type: 'success',
                message: 'Video listo - Selecciona el formato',
                duration: 'short'
              });

              // Show format selector modal
              setShowExportModal(true);
              return; // Don't call onExport yet - handleFormatExport will do it
            }

            // ============================================================================
            // IMAGE EXPORT (Direct - no format selection needed)
            // ============================================================================

            // Build metadata for images
            const metadata: ExportMetadata = {
              filename: `yaan-moment-${Date.now()}.${fileExtension}`,
              mimeType: mimeType,
              size: exportBlob.size,
              format: mimeType as ExportMetadata['format'],
              quality: 0.95
            };

            // Call parent's export handler (images only)
            await onExport(exportBlob, metadata);

            // Update notification to success (auto-dismiss after 3s)
            cesdkInstance.ui.updateNotification(notificationId, {
              type: 'success',
              message: '¡Momento listo para publicar!',
              duration: 'short'
            });

          } catch (err) {
            console.error('[CESDKEditorWrapper] ❌ Export failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error al exportar';

            // Update notification to error (auto-dismiss after 5s)
            cesdkInstance.ui.updateNotification(notificationId, {
              type: 'error',
              message: `Error: ${errorMessage}`,
              duration: 'long'
            });

            setError(errorMessage);
          }
        });

        // Save Draft Action - Manual save with Notification System (FASE 2.3)
        // Note: Auto-save is handled by useAutoSave hook (FASE 2.2)
        // This action allows manual saves via Ctrl+S or custom UI
        cesdkInstance.actions.register('ly.img.save', async () => {
          console.log('[CESDKEditorWrapper] 💾 Manual save action triggered');

          // Safety check
          if (!cesdkInstance) {
            console.error('[CESDKEditorWrapper] ❌ CE.SDK instance is null');
            return;
          }

          try {
            // Trigger manual save via useAutoSave hook
            // This ensures consistency with auto-save (hash comparison, metadata, etc.)
            await saveNow();

            console.log('[CESDKEditorWrapper] ✅ Manual save completed');

            // FASE 2.3: Use Notification System instead of Loading Dialog
            cesdkInstance.ui.showNotification({
              type: 'success',
              message: 'Borrador guardado localmente',
              duration: 'short' // Auto-dismiss after 3s
            });

          } catch (err) {
            console.error('[CESDKEditorWrapper] ❌ Manual save failed:', err);

            // Show error notification
            cesdkInstance.ui.showNotification({
              type: 'error',
              message: 'Error al guardar borrador',
              duration: 'long' // Auto-dismiss after 5s
            });
          }
        });

        // ============================================================================
        // ADDITIONAL ACTIONS (FASE 2.4 - 2025-11-18)
        // ============================================================================
        // Implementing 5 additional actions recommended by IMG.LY documentation
        // Reference: docs/CESDK_NEXTJS_LLMS_FULL.txt (Actions API Overview)

        // 1. saveScene - Download scene as JSON file
        cesdkInstance.actions.register('saveScene', async () => {
          console.log('[CESDKEditorWrapper] 💾 saveScene action triggered');

          if (!cesdkInstance) return;

          try {
            const scene = await cesdkInstance.engine.scene.saveToString();
            const blob = new Blob([scene], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `momento-${Date.now()}.scene.json`;
            a.click();
            URL.revokeObjectURL(url);

            cesdkInstance.ui.showNotification({
              type: 'success',
              message: 'Escena guardada como archivo',
              duration: 'short'
            });
          } catch (err) {
            console.error('[CESDKEditorWrapper] ❌ saveScene failed:', err);
            cesdkInstance.ui.showNotification({
              type: 'error',
              message: 'Error al guardar escena',
              duration: 'long'
            });
          }
        });

        // 2. shareScene - Share moment via Web Share API
        cesdkInstance.actions.register('shareScene', async () => {
          console.log('[CESDKEditorWrapper] 🔗 shareScene action triggered');

          if (!cesdkInstance) return;

          try {
            // Check if Web Share API is supported
            if (!navigator.share) {
              throw new Error('Web Share API no soportada en este navegador');
            }

            // Export current scene as image
            const scene = cesdkInstance.engine.scene.get();
            if (!scene) throw new Error('No active scene');

            const exportBlob = await cesdkInstance.engine.block.export(
              scene,
              'image/jpeg' as ImageMimeType,
              { jpegQuality: 0.9 }
            );

            const file = new File([exportBlob], `momento-yaan-${Date.now()}.jpg`, {
              type: 'image/jpeg'
            });

            await navigator.share({
              files: [file],
              title: 'Mi Momento YAAN',
              text: 'Mira mi momento creado con YAAN'
            });

            cesdkInstance.ui.showNotification({
              type: 'success',
              message: 'Momento compartido',
              duration: 'short'
            });
          } catch (err) {
            console.error('[CESDKEditorWrapper] ❌ shareScene failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error al compartir';
            cesdkInstance.ui.showNotification({
              type: 'error',
              message: errorMessage,
              duration: 'long'
            });
          }
        });

        // 3. importScene - Load scene from JSON file
        cesdkInstance.actions.register('importScene', async () => {
          console.log('[CESDKEditorWrapper] 📥 importScene action triggered');

          if (!cesdkInstance) return;

          try {
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.scene.json,application/json';

            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;

              const notificationId = cesdkInstance.ui.showNotification({
                type: 'loading',
                message: 'Cargando escena...',
                duration: 'infinite'
              });

              try {
                const sceneString = await file.text();
                await cesdkInstance.engine.scene.loadFromString(sceneString);

                cesdkInstance.ui.updateNotification(notificationId, {
                  type: 'success',
                  message: 'Escena cargada exitosamente',
                  duration: 'short'
                });
              } catch (loadErr) {
                console.error('[CESDKEditorWrapper] ❌ Scene load failed:', loadErr);
                cesdkInstance.ui.updateNotification(notificationId, {
                  type: 'error',
                  message: 'Error al cargar escena',
                  duration: 'long'
                });
              }
            };

            input.click();
          } catch (err) {
            console.error('[CESDKEditorWrapper] ❌ importScene failed:', err);
          }
        });

        // 4. exportScene - Download scene as .scene file (alias for saveScene)
        cesdkInstance.actions.register('exportScene', async () => {
          console.log('[CESDKEditorWrapper] 📤 exportScene action triggered');
          // Reuse saveScene logic
          await cesdkInstance.actions.run('saveScene');
        });

        // 5. uploadFile - Upload local image/video for editing
        cesdkInstance.actions.register('uploadFile', async () => {
          console.log('[CESDKEditorWrapper] 📤 uploadFile action triggered');

          if (!cesdkInstance) return;

          try {
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,video/*';

            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;

              const notificationId = cesdkInstance.ui.showNotification({
                type: 'loading',
                message: 'Subiendo archivo...',
                duration: 'infinite'
              });

              try {
                // Create object URL for the file
                const fileUrl = URL.createObjectURL(file);

                // Get current scene
                const engine = cesdkInstance.engine;
                const scene = engine.scene.get();
                if (!scene) throw new Error('No active scene');

                // Get first page
                const pages = engine.block.findByType('page');
                if (pages.length === 0) throw new Error('No page found');
                const pageId = pages[0];

                // Determine if file is video or image
                const isVideo = file.type.startsWith('video/');

                // Create block based on type
                let blockId: number;

                if (isVideo) {
                  blockId = engine.block.create('//ly.img.ubq/video' as DesignBlockTypeLonghand);
                  engine.block.setString(blockId, 'video/fileURI', fileUrl);
                } else {
                  blockId = engine.block.create('//ly.img.ubq/graphic');
                  const imageFill = engine.block.createFill('//ly.img.ubq/fill/image');
                  engine.block.setString(imageFill, 'fill/image/imageFileURI', fileUrl);
                  engine.block.setFill(blockId, imageFill);
                }

                // Add to page
                engine.block.appendChild(pageId, blockId);

                // Fit to page
                const pageWidth = engine.block.getWidth(pageId);
                const pageHeight = engine.block.getHeight(pageId);
                engine.block.setWidth(blockId, pageWidth / 2);
                engine.block.setHeight(blockId, pageHeight / 2);
                engine.block.setPositionX(blockId, pageWidth / 2);
                engine.block.setPositionY(blockId, pageHeight / 2);

                cesdkInstance.ui.updateNotification(notificationId, {
                  type: 'success',
                  message: `${isVideo ? 'Video' : 'Imagen'} agregado a la escena`,
                  duration: 'short'
                });
              } catch (uploadErr) {
                console.error('[CESDKEditorWrapper] ❌ File upload failed:', uploadErr);
                cesdkInstance.ui.updateNotification(notificationId, {
                  type: 'error',
                  message: 'Error al subir archivo',
                  duration: 'long'
                });
              }
            };

            input.click();
          } catch (err) {
            console.error('[CESDKEditorWrapper] ❌ uploadFile failed:', err);
          }
        });

        console.log('[CESDKEditorWrapper] ✅ Actions registered successfully (7 total)');

        // ============================================================================
        // EVENT API SUBSCRIPTIONS (FASE 2.2 - 2025-11-18)
        // ============================================================================
        // Subscribe to history and block events for reactive auto-save
        // Reference: docs/CESDK_NEXTJS_LLMS_FULL.txt (Event API patterns)

        console.log('[CESDKEditorWrapper] 📡 Subscribing to Event API...');

        // History events (undo/redo tracking)
        const unsubscribeHistory = cesdkInstance.engine.editor.onHistoryUpdated(() => {
          const canUndo = cesdkInstance.engine.editor.canUndo();
          const canRedo = cesdkInstance.engine.editor.canRedo();
          console.log('[CESDKEditorWrapper] 📚 History updated:', { canUndo, canRedo });
          // Note: Auto-save is handled by useAutoSave hook interval
          // This event is logged for future undo/redo UI implementation (FASE 2.6)
        });

        // Block events (create/update/destroy)
        const unsubscribeEvents = cesdkInstance.engine.event.subscribe([], (events) => {
          events.forEach(event => {
            if (event.type === 'Created' || event.type === 'Updated' || event.type === 'Destroyed') {
              console.log('[CESDKEditorWrapper] 🔄 Block event:', event.type);
              // Note: Auto-save is handled by useAutoSave hook interval
              // These events are logged for potential future optimization
            }
          });
        });

        console.log('[CESDKEditorWrapper] ✅ Event API subscriptions active');

        // ========================================================================
        // FASE B.3: SCENE COMPLEXITY MONITORING (2025-11-18)
        // ========================================================================
        // Monitor scene complexity and warn users when approaching limits
        //
        // CE.SDK performs well with up to 200 blocks, but complex blocks (text,
        // high-res images) may affect performance negatively. Mobile devices are
        // more constrained.
        //
        // Thresholds:
        // - Desktop: 50 blocks (warning), 100 blocks (strong warning)
        // - Mobile: 30 blocks (warning), 50 blocks (strong warning)
        //
        // Reference: docs/CESDK_NEXTJS_LLMS_FULL.txt (Performance Guidelines)
        // ========================================================================

        let lastWarningLevel = 0; // Track warning level to avoid spam

        const checkSceneComplexity = () => {
          try {
            const allBlocks = cesdkInstance!.engine.block.findAll();
            const blockCount = allBlocks.length;

            const warningThreshold = isMobile ? 30 : 50;
            const criticalThreshold = isMobile ? 50 : 100;

            // Show warning only when crossing thresholds (avoid spam)
            if (blockCount >= criticalThreshold && lastWarningLevel < 2) {
              lastWarningLevel = 2;
              console.warn(`[CESDKEditorWrapper] 🚨 CRITICAL: Scene has ${blockCount} blocks (limit: ${criticalThreshold})`);

              cesdkInstance!.ui.showNotification({
                type: 'warning',
                message: `⚠️ Tu momento tiene ${blockCount} elementos. Considera simplificar para mejor rendimiento.`,
                duration: 'long'
              });
            } else if (blockCount >= warningThreshold && blockCount < criticalThreshold && lastWarningLevel < 1) {
              lastWarningLevel = 1;
              console.warn(`[CESDKEditorWrapper] ⚠️ WARNING: Scene has ${blockCount} blocks (threshold: ${warningThreshold})`);

              cesdkInstance!.ui.showNotification({
                type: 'info',
                message: `Tu momento tiene ${blockCount} elementos. ${isMobile ? 'En móviles, menos es mejor.' : 'Mantén tu diseño simple para mejor rendimiento.'}`,
                duration: 'short'
              });
            } else if (blockCount < warningThreshold) {
              // Reset warning level if user simplified scene
              lastWarningLevel = 0;
            }

            console.log(`[CESDKEditorWrapper] 📊 Scene complexity: ${blockCount} blocks`);
          } catch (error) {
            console.error('[CESDKEditorWrapper] ❌ Error checking scene complexity:', error);
          }
        };

        // Subscribe to block creation/deletion events
        const unsubscribeComplexity = cesdkInstance.engine.event.subscribe([], (events) => {
          const hasBlockChanges = events.some(e =>
            e.type === 'Created' || e.type === 'Destroyed'
          );

          if (hasBlockChanges) {
            // Debounce complexity check (avoid checking on every single change)
            setTimeout(() => checkSceneComplexity(), 500);
          }
        });

        // Initial complexity check
        checkSceneComplexity();

        console.log('[CESDKEditorWrapper] 📊 Scene complexity monitoring active');

        // Store unsubscribe functions for cleanup
        cleanupEvents = () => {
          unsubscribeHistory();
          unsubscribeEvents();
          unsubscribeComplexity();
          console.log('[CESDKEditorWrapper] 🧹 Event API subscriptions cleaned up');
        };

        // NOTE: loadInitialMedia() was moved to execute IMMEDIATELY after
        // createVideoScene/createDesignScene (lines 494-495, 544-545, 552-553)
        // This fixes scene initialization timing issue where engine.scene.get()
        // was returning null due to code executing between scene creation and media loading

        cesdkRef.current = cesdkInstance;
        setIsInitialized(true);

      } catch (err) {
        console.error('[CESDKEditorWrapper] ❌ Failed to initialize CE.SDK:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize editor');
        }
      }
    };

    initializeEditor();

    // Cleanup
    return () => {
      mounted = false;

      // Clean up event subscriptions
      if (cleanupEvents) {
        cleanupEvents();
      }

      // Dispose CE.SDK instance
      if (cesdkInstance) {
        console.log('[CESDKEditorWrapper] 🧹 Disposing CE.SDK instance');
        cesdkInstance.dispose();
      }
    };
  }, [mediaType, userId, initialMediaUrl]); // FIX v2.14.0: REVERTED v2.13.0 - removed loadInitialMedia to prevent infinite loop

  // ============================================================================
  // RENDER
  // ============================================================================
  // NOTE: Export handler removed - now using Actions API (ly.img.export)
  // See ACTIONS API REGISTRATION section in initialization above

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 max-w-md">
          <h3 className="text-red-500 font-semibold mb-2">Error al cargar el editor</h3>
          <p className="text-gray-300 text-sm">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-screen bg-gray-900 ${className}`}>
      {/* CE.SDK Container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      />

      {/* Loading Overlay */}
      {(loading || !isInitialized) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Cargando editor...</p>
          </div>
        </div>
      )}

      {/* NOTE: Export Overlay removed - CE.SDK Utils API now handles loading dialogs */}

      {/* FASE 2.6: Undo/Redo Controls + Eye Dropper - Top Left Corner */}
      {isInitialized && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <UndoRedoControls
            cesdkInstance={cesdkRef.current}
            showTooltips={true}
          />

          {/* Eye Dropper Color Picker */}
          <EyeDropperButton
            cesdkInstance={cesdkRef.current}
            onColorPicked={(color, hexColor) => {
              console.log('[CESDKEditorWrapper] 🎨 Color picked:', hexColor, color);
            }}
            showTooltip={true}
            size="md"
          />
        </div>
      )}

      {/* Timeline Groups Panel - Only in Video Mode - Top Right Corner */}
      {isInitialized && mediaType === 'video' && (
        <div className="absolute top-4 right-4 z-10">
          <TimelineGroupPanel
            cesdkInstance={cesdkRef.current}
            isVideoMode={mediaType === 'video'}
            defaultCollapsed={true}
            className="w-72"
          />
        </div>
      )}

      {/* Custom Action Bar - Triggers CE.SDK Actions API */}
      {isInitialized && (
        <div className="absolute bottom-4 right-4 flex gap-3 z-10">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              console.log('[CESDKEditorWrapper] 🎯 Executing export action');
              if (cesdkRef.current) {
                try {
                  await cesdkRef.current.actions.run('ly.img.export');
                } catch (err) {
                  console.error('[CESDKEditorWrapper] ❌ Failed to execute export action:', err);
                }
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg"
          >
            Guardar y continuar →
          </button>
        </div>
      )}

      {/* FASE 2.2: Recovery Dialog for abandoned sessions */}
      <RecoveryDialog
        isOpen={showRecoveryDialog}
        draftMetadata={draftMetadata}
        onRecover={handleRecoverDraft}
        onDiscard={handleDiscardDraft}
      />

      {/* FASE 3: Export Format Selector Modal (WebM/MKV Transcoding) */}
      <ExportFormatSelector
        isOpen={showExportModal}
        onClose={handleCloseExportModal}
        onExport={handleFormatExport}
        isVideoMode={mediaType === 'video'}
        videoBlob={pendingExportBlob ?? undefined}
        videoFilename={pendingExportFilename || undefined}
      />
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CESDKEditorWrapper;
