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

import { useEffect, useRef, useState, useCallback } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import type { Configuration, DesignBlockTypeLonghand, ImageMimeType } from '@cesdk/cesdk-js';
import { applyYaanTheme } from '@/config/cesdk/ThemeConfigYAAN';

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
  format: 'image/png' | 'image/jpeg' | 'video/mp4';

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
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // CESDK INITIALIZATION
  // ============================================================================

  useEffect(() => {
    let mounted = true;
    let cesdkInstance: CreativeEditorSDK | null = null;

    const initializeEditor = async () => {
      if (!containerRef.current) {
        console.warn('[CESDKEditorWrapper] Container ref not available');
        return;
      }

      try {
        console.log('[CESDKEditorWrapper] 🎨 Initializing CE.SDK...');

        // Get configuration from environment
        const licenseKey = process.env.NEXT_PUBLIC_CESDK_LICENSE_KEY || '';
        const baseURL = process.env.NEXT_PUBLIC_CESDK_BASE_URL; // Optional - defaults to local assets

        if (!licenseKey) {
          console.warn('[CESDKEditorWrapper] ⚠️ No license key found - watermark will be shown on exports');
        }

        console.log('[CESDKEditorWrapper] 📦 Using assets:', baseURL || 'local (node_modules/@cesdk/cesdk-js/assets/)');

        // CE.SDK configuration with YAAN theming
        const config: Configuration = {
          license: licenseKey,
          userId: userId, // User ID from props for licensing and tracking
          ...(baseURL && { baseURL }), // Only include baseURL if explicitly set
          role: 'Creator' // Full editing capabilities
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

        // Add default asset sources
        cesdkInstance.addDefaultAssetSources();
        cesdkInstance.addDemoAssetSources({
          sceneMode: mediaType === 'video' ? 'Video' : 'Design',
          withUploadAssetSources: true
        });

        // Create scene based on media type
        if (mediaType === 'video') {
          await cesdkInstance.createVideoScene();
        } else {
          await cesdkInstance.createDesignScene();
        }

        // Load initial media if provided
        if (initialMediaUrl) {
          await loadInitialMedia(cesdkInstance, initialMediaUrl, mediaType);
        }

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
      if (cesdkInstance) {
        console.log('[CESDKEditorWrapper] 🧹 Disposing CE.SDK instance');
        cesdkInstance.dispose();
      }
    };
  }, [initialMediaUrl, mediaType]);

  // Note: applyYaanTheme is imported from @/config/cesdk/ThemeConfigYAAN

  // ============================================================================
  // LOAD INITIAL MEDIA
  // ============================================================================

  const loadInitialMedia = async (
    cesdk: CreativeEditorSDK,
    mediaUrl: string,
    type: 'image' | 'video'
  ) => {
    try {
      console.log('[CESDKEditorWrapper] 📥 Loading initial media:', mediaUrl);

      // Get the current page/scene
      const engine = cesdk.engine;
      const scene = engine.scene.get();

      if (!scene) {
        console.warn('[CESDKEditorWrapper] No active scene found');
        return;
      }

      // Get all pages in the scene
      const pages = engine.block.findByType('page');

      if (pages.length === 0) {
        console.warn('[CESDKEditorWrapper] No pages found in scene');
        return;
      }

      const pageId = pages[0]; // Use first page

      // Create and add media block based on type
      let blockId: number;

      if (type === 'video') {
        // Create video block
        blockId = engine.block.create('//ly.img.ubq/video' as DesignBlockTypeLonghand);
        engine.block.setString(blockId, 'video/fileURI', mediaUrl);
        engine.block.appendChild(pageId, blockId);
        console.log('[CESDKEditorWrapper] ✅ Video block created and added to page');
      } else {
        // Create image block (default)
        blockId = engine.block.create('//ly.img.ubq/graphic');
        const imageFill = engine.block.createFill('//ly.img.ubq/fill/image');
        engine.block.setString(imageFill, 'fill/image/imageFileURI', mediaUrl);
        engine.block.setFill(blockId, imageFill);
        engine.block.appendChild(pageId, blockId);
        console.log('[CESDKEditorWrapper] ✅ Image block created and added to page');
      }

      // Fit block to page bounds
      const pageWidth = engine.block.getWidth(pageId);
      const pageHeight = engine.block.getHeight(pageId);

      engine.block.setWidth(blockId, pageWidth);
      engine.block.setHeight(blockId, pageHeight);
      engine.block.setPositionX(blockId, pageWidth / 2);
      engine.block.setPositionY(blockId, pageHeight / 2);

      // Set as background or main content layer
      engine.block.sendToBack(blockId);

      console.log('[CESDKEditorWrapper] ✅ Initial media loaded successfully');

    } catch (err) {
      console.error('[CESDKEditorWrapper] ❌ Failed to load initial media:', err);
      // Non-critical - user can still add media manually through CE.SDK UI
    }
  };

  // ============================================================================
  // EXPORT HANDLER
  // ============================================================================

  const handleExport = useCallback(async () => {
    if (!cesdkRef.current || isExporting) {
      console.warn('[CESDKEditorWrapper] Cannot export - editor not ready or already exporting');
      return;
    }

    setIsExporting(true);

    try {
      console.log('[CESDKEditorWrapper] 📤 Exporting edited media...');

      const cesdk = cesdkRef.current;
      const engine = cesdk.engine;

      // Get the current scene
      const scene = engine.scene.get();

      if (!scene) {
        throw new Error('No active scene found for export');
      }

      // Determine export format and options based on media type
      let exportBlob: Blob;
      let mimeType: string;
      let fileExtension: string;

      if (mediaType === 'video') {
        // Export video
        mimeType = 'video/mp4';
        fileExtension = 'mp4';

        // CE.SDK video export
        exportBlob = await engine.block.export(scene, mimeType as ImageMimeType, {
          targetWidth: 1920,  // Full HD
          targetHeight: 1080,
          jpegQuality: 0.95
        });

        console.log('[CESDKEditorWrapper] ✅ Video exported:', {
          size: exportBlob.size,
          type: exportBlob.type
        });

      } else {
        // Export image (default to JPEG for better file size, can be changed to PNG)
        mimeType = 'image/jpeg';
        fileExtension = 'jpg';

        // CE.SDK image export with high quality
        exportBlob = await engine.block.export(scene, mimeType as ImageMimeType, {
          targetWidth: 2048,   // High resolution for social media
          targetHeight: 2048,
          jpegQuality: 0.95    // 95% quality
        });

        console.log('[CESDKEditorWrapper] ✅ Image exported:', {
          size: exportBlob.size,
          type: exportBlob.type
        });
      }

      // Build metadata
      const metadata: ExportMetadata = {
        filename: `yaan-moment-${Date.now()}.${fileExtension}`,
        mimeType: mimeType,
        size: exportBlob.size,
        format: mimeType as ExportMetadata['format'],
        quality: 0.95
      };

      console.log('[CESDKEditorWrapper] 📦 Export metadata:', metadata);

      // Call parent's export handler with real blob
      await onExport(exportBlob, metadata);

    } catch (err) {
      console.error('[CESDKEditorWrapper] ❌ Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [mediaType, onExport, isExporting]);

  // ============================================================================
  // RENDER
  // ============================================================================

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

      {/* Export Overlay */}
      {isExporting && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Exportando...</p>
          </div>
        </div>
      )}

      {/* Custom Action Bar (Optional - CE.SDK has its own toolbar) */}
      {isInitialized && (
        <div className="absolute bottom-4 right-4 flex gap-3 z-10">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            disabled={isExporting}
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isExporting}
          >
            {isExporting ? 'Exportando...' : 'Guardar y continuar →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CESDKEditorWrapper;
