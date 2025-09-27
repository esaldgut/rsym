import { UnifiedAuthSystem } from './unified-auth-system';

/**
 * Interceptor de tokens para auto-refresh inteligente
 * Estrategias de producción para manejo de tokens
 */
export class TokenInterceptor {
  private static readonly REFRESH_THRESHOLD = 300; // 5 minutos antes de expirar
  private static lastRefreshTime = 0;
  private static readonly MIN_REFRESH_INTERVAL = 30000; // 30 segundos mínimo entre refreshes

  /**
   * Interceptor para fetch requests que auto-refresca tokens
   */
  static async interceptFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Verificar si necesitamos refresh antes de hacer la request
    const shouldRefresh = await this.shouldRefreshToken();
    
    if (shouldRefresh) {
      await this.performSilentRefresh();
    }

    // Realizar el fetch original
    const response = await fetch(url, options);

    // Si obtenemos 401, intentar refresh una vez más
    if (response.status === 401 && !options.headers?.['X-Retry-After-Refresh']) {
      const refreshed = await this.performSilentRefresh();
      
      if (refreshed) {
        // Reintentar la request con headers actualizados
        const retryOptions = {
          ...options,
          headers: {
            ...options.headers,
            'X-Retry-After-Refresh': 'true'
          }
        };
        return fetch(url, retryOptions);
      }
    }

    return response;
  }

  /**
   * Determina si necesitamos refresh del token
   */
  private static async shouldRefreshToken(): Promise<boolean> {
    try {
      const session = await UnifiedAuthSystem.getValidatedSession(false);
      
      if (!session.isAuthenticated) {
        return false;
      }

      // Si el sistema ya detectó que necesita refresh
      if (session.needsRefresh) {
        return true;
      }

      // Verificar tiempo desde último refresh
      const timeSinceLastRefresh = Date.now() - this.lastRefreshTime;
      return timeSinceLastRefresh > this.MIN_REFRESH_INTERVAL;
      
    } catch (error) {
      console.warn('Error checking token refresh status:', error);
      return false;
    }
  }

  /**
   * Realiza refresh silencioso en background
   */
  static async performSilentRefresh(): Promise<boolean> {
    try {
      const now = Date.now();
      
      // Evitar múltiples refreshes simultáneos
      if (now - this.lastRefreshTime < this.MIN_REFRESH_INTERVAL) {
        return true;
      }

      this.lastRefreshTime = now;
      
      const success = await UnifiedAuthSystem.forceTokenRefresh();
      
      if (success) {
        console.log('🔄 Token refreshed silently');
      } else {
        console.warn('⚠️ Silent token refresh failed');
      }
      
      return success;
      
    } catch (error) {
      console.error('Error during silent token refresh:', error);
      return false;
    }
  }

  /**
   * Hook para componentes React que necesitan auto-refresh
   */
  static async ensureValidToken(): Promise<boolean> {
    const shouldRefresh = await this.shouldRefreshToken();
    
    if (shouldRefresh) {
      return await this.performSilentRefresh();
    }
    
    return true;
  }

  /**
   * Inicializar interceptor global para fetch
   */
  static initializeGlobalInterceptor() {
    // Solo en el cliente
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      // Solo interceptar requests a nuestra API
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url.startsWith('/api/') || url.includes(window.location.origin)) {
        return this.interceptFetch(url, init);
      }
      
      // Para otras URLs, usar fetch original
      return originalFetch(input, init);
    };
  }

  /**
   * Programar refresh automático basado en tiempo de expiración
   */
  static scheduleTokenRefresh() {
    if (typeof window === 'undefined') return;

    // Verificar cada 5 minutos si necesitamos refresh
    setInterval(async () => {
      const shouldRefresh = await this.shouldRefreshToken();
      if (shouldRefresh) {
        await this.performSilentRefresh();
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Refresh inmediato después de actualización de perfil
   */
  static async refreshAfterProfileUpdate(): Promise<void> {
    try {
      console.log('🔄 Refreshing tokens after profile update...');
      await this.performSilentRefresh();
      
      // Esperar un poco para que los cambios se propaguen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recargar la página para reflejar cambios
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error refreshing after profile update:', error);
    }
  }

  /**
   * Manejo de cambios de atributos críticos
   */
  static async handleCriticalAttributeChange(attributeName: string): Promise<void> {
    const criticalAttributes = [
      'custom:user_type',
      'custom:provider_is_approved',
      'custom:influencer_is_approved'
    ];

    if (criticalAttributes.includes(attributeName)) {
      console.log(`🔄 Critical attribute changed: ${attributeName}, forcing token refresh...`);
      await this.refreshAfterProfileUpdate();
    }
  }
}
