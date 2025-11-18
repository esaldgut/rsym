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

    const result = await (window as any).AudioEncoder.isConfigSupported(config);
    return result.supported === true;
  } catch (error) {
    console.warn('[browser-detection] Error checking audio codec support:', error);
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
      framerate: 30
    };

    const result = await (window as any).VideoEncoder.isConfigSupported(config);
    return result.supported === true;
  } catch (error) {
    console.warn('[browser-detection] Error checking video codec support:', error);
    return false;
  }
}

/**
 * Comprehensive check for CE.SDK video editing support
 * Combines user agent detection with runtime WebCodecs API check
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
  const [aacSupported, h264Supported] = await Promise.all([
    isAudioCodecSupported('mp4a.40.02'), // AAC
    isVideoCodecSupported('avc1.42001E')  // H.264
  ]);

  if (!aacSupported || !h264Supported) {
    return {
      supported: false,
      reason: `Codecs no soportados: ${!aacSupported ? 'AAC' : ''} ${!h264Supported ? 'H.264' : ''}`,
      browserInfo
    };
  }

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
