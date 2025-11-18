/**
 * Browser Detection Utilities for CE.SDK Video Editing Support
 *
 * CE.SDK video editing requires WebCodecs API which is only available in:
 * - Chrome Desktop 114+
 * - Edge Desktop 114+
 * - Safari Desktop 26.0+ (macOS Sequoia 15.3+)
 *
 * NOT supported in:
 * - Firefox (any version)
 * - Mobile browsers (iOS, Android)
 * - Chrome on Linux (lacks AAC encoder)
 * - Safari < 26.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BrowserInfo {
  name: string;
  version: string;
  majorVersion: number;
  os: string;
  isMobile: boolean;
  supportsVideoEditing: boolean;
  reason?: string; // Why video editing is not supported
}

// ============================================================================
// BROWSER DETECTION
// ============================================================================

/**
 * Detects browser information and WebCodecs API support
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      name: 'Unknown',
      version: '0.0',
      majorVersion: 0,
      os: 'Unknown',
      isMobile: false,
      supportsVideoEditing: false,
      reason: 'Running on server-side'
    };
  }

  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const os = getOperatingSystem(ua);

  // Detect browser name and version
  let name = 'Unknown';
  let version = '0.0';
  let majorVersion = 0;

  if (ua.includes('Edg/')) {
    // Microsoft Edge (Chromium-based)
    name = 'Edge';
    version = ua.match(/Edg\/([\d.]+)/)?.[1] || '0.0';
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    // Google Chrome
    name = 'Chrome';
    version = ua.match(/Chrome\/([\d.]+)/)?.[1] || '0.0';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    // Safari
    name = 'Safari';
    version = ua.match(/Version\/([\d.]+)/)?.[1] || '0.0';
  } else if (ua.includes('Firefox/')) {
    // Firefox
    name = 'Firefox';
    version = ua.match(/Firefox\/([\d.]+)/)?.[1] || '0.0';
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    // Opera
    name = 'Opera';
    version = ua.match(/(Opera|OPR)\/([\d.]+)/)?.[2] || '0.0';
  }

  majorVersion = parseInt(version.split('.')[0], 10) || 0;

  // Check if browser supports video editing
  const { supportsVideoEditing, reason } = checkVideoEditingSupport(
    name,
    majorVersion,
    os,
    isMobile
  );

  return {
    name,
    version,
    majorVersion,
    os,
    isMobile,
    supportsVideoEditing,
    reason
  };
}

/**
 * Detects operating system from user agent
 */
function getOperatingSystem(ua: string): string {
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

/**
 * Checks if browser supports video editing based on CE.SDK requirements
 */
function checkVideoEditingSupport(
  name: string,
  majorVersion: number,
  os: string,
  isMobile: boolean
): { supportsVideoEditing: boolean; reason?: string } {
  // Mobile browsers never support video editing
  if (isMobile) {
    return {
      supportsVideoEditing: false,
      reason: 'Los navegadores móviles no soportan edición de video debido a limitaciones técnicas'
    };
  }

  // Firefox doesn't support WebCodecs API
  if (name === 'Firefox') {
    return {
      supportsVideoEditing: false,
      reason: 'Firefox no soporta WebCodecs API (requerida para edición de video)'
    };
  }

  // Chrome on Linux lacks AAC encoder
  if (name === 'Chrome' && os === 'Linux') {
    return {
      supportsVideoEditing: false,
      reason: 'Chrome en Linux carece de encoder AAC debido a licenciamiento'
    };
  }

  // Chrome Desktop 114+
  if (name === 'Chrome' && majorVersion >= 114) {
    return { supportsVideoEditing: true };
  }

  // Edge Desktop 114+
  if (name === 'Edge' && majorVersion >= 114) {
    return { supportsVideoEditing: true };
  }

  // Safari Desktop 26.0+ (macOS Sequoia 15.3+)
  if (name === 'Safari' && majorVersion >= 26) {
    return { supportsVideoEditing: true };
  }

  // Safari < 26.0
  if (name === 'Safari' && majorVersion < 26) {
    return {
      supportsVideoEditing: false,
      reason: `Safari ${majorVersion} no soporta WebCodecs API. Requiere Safari 26.0+ (macOS Sequoia 15.3+)`
    };
  }

  // Chrome/Edge < 114
  if ((name === 'Chrome' || name === 'Edge') && majorVersion < 114) {
    return {
      supportsVideoEditing: false,
      reason: `${name} ${majorVersion} no soporta WebCodecs API. Requiere ${name} 114+`
    };
  }

  // Unknown browser
  return {
    supportsVideoEditing: false,
    reason: 'Navegador no reconocido o no soportado para edición de video'
  };
}

// ============================================================================
// RUNTIME WEBCODECS API CHECK
// ============================================================================

/**
 * Checks if WebCodecs API is actually available in the browser
 * More reliable than user agent detection
 */
export function hasWebCodecsAPI(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'VideoEncoder' in window &&
    'VideoDecoder' in window &&
    'AudioEncoder' in window &&
    'AudioDecoder' in window
  );
}

/**
 * Checks if a specific audio codec is supported
 * @param codec - Codec string (e.g., 'mp4a.40.02' for AAC)
 */
export async function isAudioCodecSupported(codec: string): Promise<boolean> {
  if (!hasWebCodecsAPI()) return false;

  try {
    const config = {
      codec,
      sampleRate: 48000,
      numberOfChannels: 2,
      bitrate: 128000
    };

    console.log('[browser-detection] 🔍 Validando soporte de audio codec:', {
      codec,
      config
    });

    const result = await (window as any).AudioEncoder.isConfigSupported(config);

    console.log('[browser-detection] ✅ Resultado de validación de audio:', {
      codec,
      supported: result.supported,
      fullResult: result
    });

    return result.supported === true;
  } catch (error) {
    // Log detailed error information
    console.error('[browser-detection] ❌ Error crítico validando audio codec:', {
      codec,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    return false;
  }
}

/**
 * Checks if a specific video codec is supported
 * @param codec - Codec string (e.g., 'avc1.42001E' for H.264)
 */
export async function isVideoCodecSupported(codec: string): Promise<boolean> {
  if (!hasWebCodecsAPI()) return false;

  try {
    const config = {
      codec,
      width: 1920,
      height: 1080,
      bitrate: 5000000,
      framerate: 30,
      hardwareAcceleration: 'prefer-hardware' as 'prefer-hardware', // Try to use HW acceleration
      latencyMode: 'quality' as 'quality' // Prioritize quality over latency
    };

    console.log('[browser-detection] 🔍 Validando soporte de video codec:', {
      codec,
      config
    });

    const result = await (window as any).VideoEncoder.isConfigSupported(config);

    console.log('[browser-detection] ✅ Resultado de validación de video:', {
      codec,
      supported: result.supported,
      fullResult: result
    });

    return result.supported === true;
  } catch (error) {
    // Log detailed error information
    console.error('[browser-detection] ❌ Error crítico validando video codec:', {
      codec,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    return false;
  }
}

/**
 * Comprehensive check for CE.SDK video editing support
 * Combines user agent detection with runtime WebCodecs API check
 *
 * @deprecated Since v2.7.0 - For CE.SDK video validation, use the official function instead:
 *
 * ```typescript
 * import { supportsVideo } from '@cesdk/cesdk-js';
 *
 * const videoSupported = supportsVideo(); // Official CE.SDK function (recommended)
 * ```
 *
 * **Why deprecated:**
 * - CE.SDK provides official `supportsVideo()` function (lines 12823, 29311, 54777 in docs)
 * - Custom validation is more strict than necessary
 * - `hardwareAcceleration: 'prefer-hardware'` causes false negatives
 * - CE.SDK supports multiple codecs (VP8, VP9, AV1, H.264, H.265), not just H.264/AAC
 *
 * **This function can still be used for:**
 * - Proactive UX warnings (show message before user tries to upload)
 * - Browser information display (name, version, OS)
 * - Non-CE.SDK contexts where you need detailed codec validation
 *
 * **Do NOT use for:**
 * - CE.SDK editor initialization (use `supportsVideo()` from '@cesdk/cesdk-js')
 * - Production validation logic (too strict, causes false negatives in Chrome 142+)
 *
 * See: CHANGELOG.md [2.7.0] for details on the production fix.
 */
export async function canEditVideos(): Promise<{
  supported: boolean;
  reason?: string;
  browserInfo: BrowserInfo;
}> {
  const browserInfo = detectBrowser();

  // First check: User agent detection
  if (!browserInfo.supportsVideoEditing) {
    return {
      supported: false,
      reason: browserInfo.reason,
      browserInfo
    };
  }

  // Second check: WebCodecs API availability
  if (!hasWebCodecsAPI()) {
    return {
      supported: false,
      reason: 'WebCodecs API no disponible en este navegador',
      browserInfo
    };
  }

  // Third check: Specific codec support (AAC for audio, H.264 for video)
  // Try multiple H.264 profiles for maximum compatibility
  const h264Profiles = [
    'avc1.42001E', // H.264 Baseline Profile (nivel 3.0) - Most compatible
    'avc1.4D001E', // H.264 Main Profile (nivel 3.0)
    'avc1.64001F'  // H.264 High Profile (nivel 3.1) - Highest quality
  ];

  console.log('[browser-detection] 🔍 Iniciando validación completa de codecs...');

  const aacSupported = await isAudioCodecSupported('mp4a.40.02'); // AAC
  console.log('[browser-detection] AAC support:', aacSupported ? '✅' : '❌');

  // Try all H.264 profiles until one succeeds
  let h264Supported = false;
  let supportedProfile = '';

  for (const profile of h264Profiles) {
    const supported = await isVideoCodecSupported(profile);
    if (supported) {
      h264Supported = true;
      supportedProfile = profile;
      console.log(`[browser-detection] ✅ H.264 profile ${profile} soportado`);
      break;
    } else {
      console.log(`[browser-detection] ❌ H.264 profile ${profile} NO soportado`);
    }
  }

  if (!aacSupported || !h264Supported) {
    const reason = `Codecs no soportados: ${!aacSupported ? 'AAC' : ''} ${!h264Supported ? 'H.264' : ''}`.trim();

    console.error('[browser-detection] ❌ Validación completa falló:', {
      aacSupported,
      h264Supported,
      testedProfiles: h264Profiles,
      reason
    });

    return {
      supported: false,
      reason,
      browserInfo
    };
  }

  console.log('[browser-detection] ✅ Validación completa exitosa:', {
    aac: 'mp4a.40.02',
    h264: supportedProfile
  });

  return {
    supported: true,
    browserInfo
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Returns a user-friendly error message for unsupported browsers
 */
export function getUnsupportedBrowserMessage(browserInfo?: BrowserInfo): string {
  if (!browserInfo) {
    browserInfo = detectBrowser();
  }

  const { name, version, reason } = browserInfo;

  let message = `⚠️ Edición de video no disponible\n\n`;

  if (reason) {
    message += `${reason}\n\n`;
  } else {
    message += `Tu navegador (${name} ${version}) no soporta las tecnologías necesarias para editar videos.\n\n`;
  }

  message += `Navegadores compatibles:\n`;
  message += `• Google Chrome 114+ (Windows, macOS)\n`;
  message += `• Microsoft Edge 114+\n`;
  message += `• Safari 26.0+ (macOS Sequoia 15.3+)\n\n`;
  message += `Alternativa: Puedes crear momentos con imágenes.`;

  return message;
}

/**
 * Logs browser information for debugging
 */
export function logBrowserInfo(): void {
  const info = detectBrowser();
  const hasAPI = hasWebCodecsAPI();

  console.log('[browser-detection] 🌐 Browser Information:', {
    name: info.name,
    version: info.version,
    os: info.os,
    isMobile: info.isMobile,
    supportsVideoEditing: info.supportsVideoEditing,
    hasWebCodecsAPI: hasAPI,
    reason: info.reason
  });
}

/**
 * Runs comprehensive diagnostics and outputs detailed report to console
 *
 * Usage in browser console:
 * ```javascript
 * import('@/utils/browser-detection').then(m => m.runWebCodecsDiagnostics())
 * ```
 *
 * This function tests all video and audio codecs and provides a complete
 * report of what's supported in the current browser.
 */
export async function runWebCodecsDiagnostics(): Promise<void> {
  console.log('\n🏥 ===== WebCodecs Diagnostics =====\n');

  // 1. Browser Info
  const browserInfo = detectBrowser();
  console.log('📊 Browser Information:');
  console.log(`  Name: ${browserInfo.name} ${browserInfo.version}`);
  console.log(`  OS: ${browserInfo.os}`);
  console.log(`  Mobile: ${browserInfo.isMobile ? 'Yes' : 'No'}`);
  console.log(`  Supports Video Editing (UA): ${browserInfo.supportsVideoEditing ? '✅' : '❌'}`);
  if (browserInfo.reason) {
    console.log(`  Reason: ${browserInfo.reason}`);
  }

  // 2. API Availability
  console.log('\n🔧 WebCodecs API Availability:');
  console.log(`  VideoEncoder: ${'VideoEncoder' in window ? '✅ Available' : '❌ Not Available'}`);
  console.log(`  VideoDecoder: ${'VideoDecoder' in window ? '✅ Available' : '❌ Not Available'}`);
  console.log(`  AudioEncoder: ${'AudioEncoder' in window ? '✅ Available' : '❌ Not Available'}`);
  console.log(`  AudioDecoder: ${'AudioDecoder' in window ? '✅ Available' : '❌ Not Available'}`);

  // 3. Video Codec Support
  console.log('\n🎬 Video Codec Support:');
  const videoCodecs = [
    { name: 'H.264 Baseline Profile', codec: 'avc1.42001E' },
    { name: 'H.264 Main Profile', codec: 'avc1.4D001E' },
    { name: 'H.264 High Profile', codec: 'avc1.64001F' },
    { name: 'VP8', codec: 'vp8' },
    { name: 'VP9', codec: 'vp09.00.10.08' },
    { name: 'AV1', codec: 'av01.0.05M.08' }
  ];

  for (const { name, codec } of videoCodecs) {
    const supported = await isVideoCodecSupported(codec);
    console.log(`  ${name} (${codec}): ${supported ? '✅ Supported' : '❌ Not Supported'}`);
  }

  // 4. Audio Codec Support
  console.log('\n🎵 Audio Codec Support:');
  const audioCodecs = [
    { name: 'AAC (CE.SDK Required)', codec: 'mp4a.40.02' },
    { name: 'AAC Low Complexity', codec: 'mp4a.40.2' },
    { name: 'Opus', codec: 'opus' },
    { name: 'Vorbis', codec: 'vorbis' }
  ];

  for (const { name, codec } of audioCodecs) {
    const supported = await isAudioCodecSupported(codec);
    console.log(`  ${name} (${codec}): ${supported ? '✅ Supported' : '❌ Not Supported'}`);
  }

  // 5. Final Result (CE.SDK Compatibility)
  console.log('\n🎯 CE.SDK Video Editing Compatibility:');
  const result = await canEditVideos();
  console.log(`  Can Edit Videos: ${result.supported ? '✅ YES' : '❌ NO'}`);
  if (result.reason) {
    console.log(`  Reason: ${result.reason}`);
  }

  // 6. Recommendations
  console.log('\n💡 Recommendations:');
  if (!result.supported) {
    console.log('  • Use a compatible browser:');
    console.log('    - Google Chrome 114+ (Windows, macOS)');
    console.log('    - Microsoft Edge 114+');
    console.log('    - Safari 26.0+ (macOS Sequoia 15.3+)');
    console.log('  • Check Chrome flags: chrome://flags/#enable-webcodecs should be "Default" or "Enabled"');
    console.log('  • Check hardware acceleration: chrome://gpu/ should show "Hardware accelerated" for video decode');
    console.log('  • Try restarting the browser');
  } else {
    console.log('  ✅ Your browser is fully compatible with CE.SDK video editing!');
    console.log('  • Video editing features are available');
    console.log('  • Hardware acceleration is recommended for best performance');
  }

  console.log('\n🏥 ===== End Diagnostics =====\n');
}
