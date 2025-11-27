/**
 * Video Transcoding API Route
 *
 * Server-side video transcoding endpoint that converts MP4 videos to WebM format
 * using FFmpeg. CE.SDK only supports MP4 export natively, so this endpoint
 * provides WebM support through server-side transcoding.
 *
 * Features:
 * - Accepts multipart/form-data with video file
 * - Transcodes to WebM (VP9 video + Opus audio)
 * - Supports quality presets (low, medium, high)
 * - Streams result back to client
 * - Automatic temp file cleanup
 * - JWT authentication required
 *
 * POST /api/transcode-video
 * Body: FormData
 *   - video: File (MP4)
 *   - format: 'webm' | 'mkv' (optional, default: 'webm')
 *   - quality: 'low' | 'medium' | 'high' (optional, default: 'medium')
 *
 * Response: Video file blob (WebM/MKV)
 *
 * Requirements:
 * - FFmpeg installed on server
 * - Adequate disk space for temp files
 * - Adequate memory for video processing
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('video', mp4Blob, 'video.mp4');
 * formData.append('format', 'webm');
 * formData.append('quality', 'high');
 *
 * const response = await fetch('/api/transcode-video', {
 *   method: 'POST',
 *   body: formData
 * });
 *
 * const webmBlob = await response.blob();
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { transcodeVideo, type TranscodeOptions, type TranscodeResult } from '@/lib/server/video-transcode-actions';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Maximum file size: 500MB
 * Adjust based on server capabilities and expected use cases
 */
const MAX_FILE_SIZE = 500 * 1024 * 1024;

/**
 * Allowed input MIME types
 */
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/webm',
  'video/x-matroska' // .mkv
];

/**
 * Output format configurations
 */
const OUTPUT_FORMATS = {
  webm: {
    mimeType: 'video/webm',
    extension: 'webm'
  },
  mkv: {
    mimeType: 'video/x-matroska',
    extension: 'mkv'
  }
} as const;

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[API /api/transcode-video] 🎬 Transcoding request received');

  try {
    // ========================================================================
    // STEP 1: Authentication
    // ========================================================================

    const user = await getAuthenticatedUser();

    if (!user) {
      console.log('[API /api/transcode-video] ❌ Not authenticated');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[API /api/transcode-video] ✅ User authenticated:', user.userId);

    // ========================================================================
    // STEP 2: Parse FormData
    // ========================================================================

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid form data' },
        { status: 400 }
      );
    }

    // Get video file
    const videoFile = formData.get('video') as File | null;

    if (!videoFile) {
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Get options
    const format = (formData.get('format') as string || 'webm') as 'webm' | 'mkv';
    const quality = (formData.get('quality') as string || 'medium') as 'low' | 'medium' | 'high';

    console.log('[API /api/transcode-video] 📹 Request details:', {
      filename: videoFile.name,
      size: `${(videoFile.size / 1024 / 1024).toFixed(2)} MB`,
      type: videoFile.type,
      format,
      quality
    });

    // ========================================================================
    // STEP 3: Validate Input
    // ========================================================================

    // Check file size
    if (videoFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 400 }
      );
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(videoFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: ${videoFile.type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Check output format
    if (!OUTPUT_FORMATS[format]) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid output format: ${format}. Allowed: webm, mkv`
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // STEP 4: Transcode Video
    // ========================================================================

    console.log('[API /api/transcode-video] ⚙️ Starting transcoding...');

    const transcodeOptions: TranscodeOptions = {
      format,
      quality,
      maxWidth: 1920,
      maxHeight: 1080
    };

    // Convert File to Buffer
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());

    const result: TranscodeResult = await transcodeVideo(
      videoBuffer,
      videoFile.name,
      transcodeOptions
    );

    if (!result.success || !result.outputBuffer) {
      console.error('[API /api/transcode-video] ❌ Transcoding failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Transcoding failed'
        },
        { status: 500 }
      );
    }

    console.log('[API /api/transcode-video] ✅ Transcoding complete:', {
      outputSize: `${(result.outputBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      duration: result.duration ? `${result.duration.toFixed(2)}s` : 'N/A'
    });

    // ========================================================================
    // STEP 5: Return Transcoded Video
    // ========================================================================

    const outputFormat = OUTPUT_FORMATS[format];
    const outputFilename = videoFile.name.replace(/\.[^.]+$/, `.${outputFormat.extension}`);

    return new NextResponse(result.outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': outputFormat.mimeType,
        'Content-Disposition': `attachment; filename="${outputFilename}"`,
        'Content-Length': result.outputBuffer.length.toString(),
        'X-Transcode-Duration': result.duration?.toString() || '0'
      }
    });

  } catch (error) {
    console.error('[API /api/transcode-video] ❌ Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS HANDLER (CORS)
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
