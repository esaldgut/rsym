'use client';

import { useState, useEffect } from 'react';
import {
  isMobileDevice,
  isIOS,
  isAndroid,
  generateDeepLink,
  attemptDeepLink,
  getAppStoreUrl,
  isFromMobileApp
} from '@/utils/deep-link-utils';
import { logger } from '@/utils/logger';

// Iconos SVG inline
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

interface SmartAppBannerProps {
  /** Ruta actual para deep linking */
  currentPath?: string;
  /** Parámetros adicionales para el deep link */
  deepLinkParams?: Record<string, string>;
  /** Mostrar solo en páginas específicas */
  showOnPaths?: string[];
  /** Ocultar en páginas específicas */
  hideOnPaths?: string[];
}

/**
 * Smart App Banner
 *
 * Muestra un banner inteligente en dispositivos móviles para:
 * 1. Invitar a descargar la app si no está instalada
 * 2. Abrir contenido directamente en la app si está instalada
 * 3. Recordar la preferencia del usuario
 */
export function SmartAppBanner({
  currentPath,
  deepLinkParams,
  showOnPaths,
  hideOnPaths
}: SmartAppBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasBeenShownBefore, setHasBeenShownBefore] = useState(false);

  useEffect(() => {
    // Solo mostrar en dispositivos móviles
    if (!isMobileDevice()) return;

    // No mostrar si viene desde la app
    if (isFromMobileApp()) return;

    // Verificar si ya se mostró antes (en esta sesión)
    const shownInSession = sessionStorage.getItem('yaan_banner_shown');
    if (shownInSession === 'true') {
      setHasBeenShownBefore(true);
    }

    // Verificar si el usuario ya descartó el banner permanentemente
    const dismissed = localStorage.getItem('yaan_app_banner_dismissed');
    const dismissedTime = localStorage.getItem('yaan_app_banner_dismissed_time');

    if (dismissed === 'true' && dismissedTime) {
      // Si han pasado más de 7 días, volver a mostrar
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (parseInt(dismissedTime) > sevenDaysAgo) {
        setIsDismissed(true);
        return;
      } else {
        // Limpiar la preferencia antigua
        localStorage.removeItem('yaan_app_banner_dismissed');
        localStorage.removeItem('yaan_app_banner_dismissed_time');
      }
    }

    // Verificar restricciones de rutas
    const path = currentPath || window.location.pathname;

    if (hideOnPaths && hideOnPaths.some(p => path.startsWith(p))) {
      return;
    }

    if (showOnPaths && !showOnPaths.some(p => path.startsWith(p))) {
      return;
    }

    // Delay más largo: 5 segundos para primera vez, 10 segundos si ya se mostró antes
    const delay = hasBeenShownBefore ? 10000 : 5000;

    const timer = setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem('yaan_banner_shown', 'true');
      logger.deepLink('SmartAppBanner mostrado', { path, delay });
    }, delay);

    return () => clearTimeout(timer);
  }, [currentPath, showOnPaths, hideOnPaths, hasBeenShownBefore]);

  const handleOpenInApp = () => {
    const path = currentPath || window.location.pathname;
    const deepLink = generateDeepLink(path, deepLinkParams);

    logger.deepLink('Intentando abrir en app', { deepLink });

    // Intentar abrir la app, con fallback a la tienda
    attemptDeepLink(deepLink, getAppStoreUrl());

    // Ocultar el banner después del intento
    setIsVisible(false);
  };

  const handleDownloadApp = () => {
    logger.deepLink('Redirigiendo a tienda de apps', {
      platform: isIOS() ? 'iOS' : isAndroid() ? 'Android' : 'Unknown'
    });
    window.location.href = getAppStoreUrl();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('yaan_app_banner_dismissed', 'true');
    localStorage.setItem('yaan_app_banner_dismissed_time', Date.now().toString());
    logger.deepLink('Banner descartado por el usuario');
  };

  // No renderizar si no es visible o fue descartado
  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg transform transition-transform duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* App Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">Y</span>
            </div>

            {/* App Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">YAAN</h3>
                {isIOS() && (
                  <span className="text-xs text-gray-500">App Store</span>
                )}
                {isAndroid() && (
                  <span className="text-xs text-gray-500">Google Play</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Mejor experiencia en nuestra app
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Botón principal */}
            <button
              onClick={handleOpenInApp}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:from-pink-600 hover:to-purple-700 transition-all flex items-center space-x-1"
            >
              <ExternalLinkIcon />
              <span>Abrir</span>
            </button>

            {/* Botón secundario (descargar) */}
            <button
              onClick={handleDownloadApp}
              className="text-purple-600 px-3 py-2 rounded-lg font-medium text-sm hover:bg-purple-50 transition-all flex items-center space-x-1"
            >
              <DownloadIcon />
              <span className="hidden sm:inline">Instalar</span>
            </button>

            {/* Botón cerrar */}
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-2"
              aria-label="Cerrar banner"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* Mensaje contextual basado en el contenido */}
        {currentPath && (
          <div className="mt-2 text-xs text-gray-500">
            {currentPath.includes('/marketplace') && '🛍️ Explora productos en la app'}
            {currentPath.includes('/moments') && '📸 Ve momentos en pantalla completa'}
            {currentPath.includes('/provider') && '💼 Gestiona tu negocio desde la app'}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook para usar el Smart App Banner programáticamente
 */
export function useSmartAppBanner() {
  const [shouldShowBanner, setShouldShowBanner] = useState(false);

  useEffect(() => {
    setShouldShowBanner(isMobileDevice() && !isFromMobileApp());
  }, []);

  const openInApp = (path: string, params?: Record<string, string>) => {
    const deepLink = generateDeepLink(path, params);
    attemptDeepLink(deepLink);
  };

  const downloadApp = () => {
    window.location.href = getAppStoreUrl();
  };

  return {
    shouldShowBanner,
    openInApp,
    downloadApp,
    isIOS: isIOS(),
    isAndroid: isAndroid()
  };
}