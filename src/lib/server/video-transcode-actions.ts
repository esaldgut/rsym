'use server';

/**
 * Video Transcoding Server Actions
 *
 * Server-side video transcoding using FFmpeg. Converts video files to WebM or MKV format
 * with configurable quality settings.
 *
 * Features:
 * - VP9 video codec (WebM) / H.264 (MKV)
 * - Opus audio codec (WebM) / AAC (MKV)
 * - Quality presets (low, medium, high)
 * - Resolution scaling
 * - Automatic temp file management
 *
 * FFmpeg Requirements:
 * - FFmpeg must be installed on the server
 * - libvpx-vp9 encoder for WebM
 * - libopus encoder for WebM audio
 *
 * @example
 * ```typescript
 * import { transcodeVideo } from '@/lib/server/video-transcode-actions';
 *
 * const result = await transcodeVideo(
 *   videoBuffer,
 *   'input.mp4',
 *   { format: 'webm', quality: 'high' }
 * );
 *
 * if (result.success) {
 *   const webmBlob = new Blob([result.outputBuffer], { type: 'video/webm' });
 * }
 * ```
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface TranscodeOptions {
  /** Output format */
  format: 'webm' | 'mkv';

  /** Quality preset */
  quality: 'low' | 'medium' | 'high';

  /** Maximum output width (optional) */
  maxWidth?: number;

  /** Maximum output height (optional) */
  maxHeight?: number;
}

export interface TranscodeResult {
  /** Whether transcoding was successful */
  success: boolean;

  /** Output video buffer (if successful) */
  outputBuffer?: Buffer;

  /** Error message (if failed) */
  error?: string;

  /** Transcoding duration in seconds */
  duration?: number;

  /** Output file info */
  outputInfo?: {
    width: number;
    height: number;
    size: number;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Temp directory for video processing
 * Uses system temp or fallback to /tmp
 */
const TEMP_DIR = process.env.TEMP_DIR || '/tmp/yaan-transcode';

/**
 * FFmpeg quality presets
 *
 * CRF (Constant Rate Factor):
 * - Lower = better quality, larger file
 * - Higher = worse quality, smaller file
 * - WebM VP9: 15-35 typical range
 */
const QUALITY_PRESETS = {
  webm: {
    low: { crf: 35, preset: 'faster', bitrate: '1M' },
    medium: { crf: 28, preset: 'medium', bitrate: '2M' },
    high: { crf: 20, preset: 'slow', bitrate: '4M' }
  },
  mkv: {
    low: { crf: 28, preset: 'faster', bitrate: '1M' },
    medium: { crf: 23, preset: 'medium', bitrate: '2M' },
    high: { crf: 18, preset: 'slow', bitrate: '4M' }
  }
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure temp directory exists
 */
async function ensureTempDir(): Promise<void> {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
    console.log('[video-transcode] 📁 Created temp directory:', TEMP_DIR);
  }
}

/**
 * Clean up temp files
 */
async function cleanupTempFiles(...filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
        console.log('[video-transcode] 🧹 Cleaned up:', filePath);
      }
    } catch (error) {
      console.warn('[video-transcode] ⚠️ Failed to clean up:', filePath, error);
    }
  }
}

/**
 * Check if FFmpeg is available
 */
async function checkFFmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Build FFmpeg command for WebM transcoding
 */
function buildWebMCommand(
  inputPath: string,
  outputPath: string,
  options: TranscodeOptions
): string {
  const preset = QUALITY_PRESETS.webm[options.quality];

  // Build scale filter (optional)
  let scaleFilter = '';
  if (options.maxWidth || options.maxHeight) {
    const width = options.maxWidth || -2;
    const height = options.maxHeight || -2;
    scaleFilter = `-vf "scale='min(${width},iw)':min'(${height},ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2"`;
  }

  // VP9 + Opus for WebM
  return [
    'ffmpeg',
    '-y', // Overwrite output
    '-i', `"${inputPath}"`, // Input file
    '-c:v libvpx-vp9', // VP9 video codec
    `-crf ${preset.crf}`, // Quality
    `-b:v ${preset.bitrate}`, // Target bitrate
    '-c:a libopus', // Opus audio codec
    '-b:a 128k', // Audio bitrate
    scaleFilter, // Scale filter (if any)
    '-deadline good', // Encoding speed
    '-cpu-used 2', // CPU usage (0-8, higher = faster)
    '-row-mt 1', // Multi-threaded row encoding
    `"${outputPath}"` // Output file
  ].filter(Boolean).join(' ');
}

/**
 * Build FFmpeg command for MKV transcoding
 */
function buildMKVCommand(
  inputPath: string,
  outputPath: string,
  options: TranscodeOptions
): string {
  const preset = QUALITY_PRESETS.mkv[options.quality];

  // Build scale filter (optional)
  let scaleFilter = '';
  if (options.maxWidth || options.maxHeight) {
    const width = options.maxWidth || -2;
    const height = options.maxHeight || -2;
    scaleFilter = `-vf "scale='min(${width},iw)':min'(${height},ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2"`;
  }

  // H.264 + AAC for MKV
  return [
    'ffmpeg',
    '-y', // Overwrite output
    '-i', `"${inputPath}"`, // Input file
    '-c:v libx264', // H.264 video codec
    `-preset ${preset.preset}`, // Encoding speed
    `-crf ${preset.crf}`, // Quality
    '-c:a aac', // AAC audio codec
    '-b:a 128k', // Audio bitrate
    scaleFilter, // Scale filter (if any)
    `"${outputPath}"` // Output file
  ].filter(Boolean).join(' ');
}

// ============================================================================
// MAIN TRANSCODE FUNCTION
// ============================================================================

/**
 * Transcode video to WebM or MKV format
 *
 * @param inputBuffer - Input video buffer
 * @param inputFilename - Original filename (for extension detection)
 * @param options - Transcoding options
 * @returns Transcoding result with output buffer
 */
export async function transcodeVideo(
  inputBuffer: Buffer,
  inputFilename: string,
  options: TranscodeOptions
): Promise<TranscodeResult> {
  const startTime = Date.now();
  const jobId = randomUUID().substring(0, 8);

  console.log(`[video-transcode] [${jobId}] 🎬 Starting transcoding job:`, {
    inputSize: `${(inputBuffer.length / 1024 / 1024).toFixed(2)} MB`,
    inputFilename,
    format: options.format,
    quality: options.quality
  });

  // Generate temp file paths
  await ensureTempDir();

  const inputExt = inputFilename.split('.').pop() || 'mp4';
  const outputExt = options.format;

  const inputPath = join(TEMP_DIR, `${jobId}-input.${inputExt}`);
  const outputPath = join(TEMP_DIR, `${jobId}-output.${outputExt}`);

  try {
    // ========================================================================
    // STEP 1: Check FFmpeg availability
    // ========================================================================

    const ffmpegAvailable = await checkFFmpeg();
    if (!ffmpegAvailable) {
      console.error(`[video-transcode] [${jobId}] ❌ FFmpeg not found`);
      return {
        success: false,
        error: 'FFmpeg is not installed on the server. Please contact support.'
      };
    }

    // ========================================================================
    // STEP 2: Write input to temp file
    // ========================================================================

    console.log(`[video-transcode] [${jobId}] 📝 Writing input to temp file...`);
    await writeFile(inputPath, inputBuffer);

    // ========================================================================
    // STEP 3: Build and execute FFmpeg command
    // ========================================================================

    const command = options.format === 'webm'
      ? buildWebMCommand(inputPath, outputPath, options)
      : buildMKVCommand(inputPath, outputPath, options);

    console.log(`[video-transcode] [${jobId}] ⚙️ Executing FFmpeg...`);
    console.log(`[video-transcode] [${jobId}] Command: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for FFmpeg output
        timeout: 600000 // 10 minute timeout
      });

      if (stdout) console.log(`[video-transcode] [${jobId}] stdout:`, stdout);
      if (stderr) console.log(`[video-transcode] [${jobId}] stderr:`, stderr);

    } catch (ffmpegError: unknown) {
      // FFmpeg often writes to stderr even on success
      // Check if output file was created
      if (!existsSync(outputPath)) {
        console.error(`[video-transcode] [${jobId}] ❌ FFmpeg failed:`, ffmpegError);
        throw new Error(`FFmpeg transcoding failed: ${ffmpegError instanceof Error ? ffmpegError.message : 'Unknown error'}`);
      }
    }

    // ========================================================================
    // STEP 4: Read output file
    // ========================================================================

    if (!existsSync(outputPath)) {
      throw new Error('Output file was not created');
    }

    console.log(`[video-transcode] [${jobId}] 📖 Reading output file...`);
    const outputBuffer = await readFile(outputPath);

    const duration = (Date.now() - startTime) / 1000;

    console.log(`[video-transcode] [${jobId}] ✅ Transcoding complete:`, {
      outputSize: `${(outputBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      duration: `${duration.toFixed(2)}s`,
      compression: `${((1 - outputBuffer.length / inputBuffer.length) * 100).toFixed(1)}%`
    });

    return {
      success: true,
      outputBuffer,
      duration,
      outputInfo: {
        width: options.maxWidth || 0,
        height: options.maxHeight || 0,
        size: outputBuffer.length
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown transcoding error';
    console.error(`[video-transcode] [${jobId}] ❌ Error:`, errorMessage);

    return {
      success: false,
      error: errorMessage
    };

  } finally {
    // ========================================================================
    // STEP 5: Cleanup temp files
    // ========================================================================

    await cleanupTempFiles(inputPath, outputPath);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check server transcoding capabilities
 *
 * @returns Object with available formats and limitations
 */
export async function getTranscodeCapabilities(): Promise<{
  available: boolean;
  formats: string[];
  maxFileSize: number;
  error?: string;
}> {
  const ffmpegAvailable = await checkFFmpeg();

  if (!ffmpegAvailable) {
    return {
      available: false,
      formats: [],
      maxFileSize: 0,
      error: 'FFmpeg not installed'
    };
  }

  return {
    available: true,
    formats: ['webm', 'mkv'],
    maxFileSize: 500 * 1024 * 1024 // 500MB
  };
}
