import { fetchAuthSession, JWT } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export interface TokenInfo {
  accessToken: JWT | undefined;
  idToken: JWT | undefined;
  refreshToken: string | undefined;
  isExpired: boolean;
  isExpiringSoon: boolean;
  timeUntilExpiry: number;
  expiresAt: Date | null;
}

export interface TokenValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
}

/**
 * Token Manager para manejar la validación y refresh de tokens JWT
 */
export class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<void> | null = null;
  private tokenCheckInterval: NodeJS.Timeout | null = null;
  
  // Configuración de tiempos (en segundos)
  private readonly EXPIRY_WARNING_THRESHOLD = 300; // 5 minutos antes de expirar
  private readonly REFRESH_BUFFER = 60; // Refresh 1 minuto antes de expirar
  private readonly CHECK_INTERVAL = 30000; // Revisar cada 30 segundos
  
  private constructor() {
    this.setupTokenMonitoring();
    this.setupHubListeners();
  }
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }
  
  /**
   * Obtiene información detallada sobre los tokens actuales
   */
  async getTokenInfo(): Promise<TokenInfo> {
    try {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken;
      const idToken = session.tokens?.idToken;
      const refreshToken = session.tokens?.refreshToken;
      
      const now = Math.floor(Date.now() / 1000);
      const exp = idToken?.payload?.exp as number | undefined;
      
      let isExpired = false;
      let isExpiringSoon = false;
      let timeUntilExpiry = Infinity;
      let expiresAt: Date | null = null;
      
      if (exp) {
        isExpired = exp < now;
        timeUntilExpiry = exp - now;
        isExpiringSoon = timeUntilExpiry < this.EXPIRY_WARNING_THRESHOLD;
        expiresAt = new Date(exp * 1000);
      }
      
      return {
        accessToken,
        idToken,
        refreshToken,
        isExpired,
        isExpiringSoon,
        timeUntilExpiry,
        expiresAt
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return {
        accessToken: undefined,
        idToken: undefined,
        refreshToken: undefined,
        isExpired: true,
        isExpiringSoon: false,
        timeUntilExpiry: 0,
        expiresAt: null
      };
    }
  }
  
  /**
   * Valida el estado actual de los tokens
   */
  async validateTokens(): Promise<TokenValidationResult> {
    try {
      const tokenInfo = await this.getTokenInfo();
      
      if (!tokenInfo.accessToken || !tokenInfo.idToken) {
        return { isValid: false, needsRefresh: false, error: 'No tokens found' };
      }
      
      if (tokenInfo.isExpired) {
        return { isValid: false, needsRefresh: true, error: 'Token expired' };
      }
      
      if (tokenInfo.timeUntilExpiry < this.REFRESH_BUFFER) {
        return { isValid: true, needsRefresh: true };
      }
      
      return { isValid: true, needsRefresh: false };
    } catch (error) {
      console.error('Token validation error:', error);
      return { isValid: false, needsRefresh: false, error: 'Validation error' };
    }
  }
  
  /**
   * Refresca los tokens si es necesario
   */
  async refreshTokensIfNeeded(): Promise<boolean> {
    // Evitar múltiples refresh simultáneos
    if (this.refreshPromise) {
      await this.refreshPromise;
      return true;
    }
    
    try {
      const validation = await this.validateTokens();
      
      if (!validation.needsRefresh) {
        return true;
      }
      
      this.refreshPromise = this.performTokenRefresh();
      await this.refreshPromise;
      this.refreshPromise = null;
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.refreshPromise = null;
      return false;
    }
  }
  
  /**
   * Realiza el refresh de tokens
   */
  private async performTokenRefresh(): Promise<void> {
    try {
      console.log('Refreshing tokens...');
      
      // Forzar refresh de la sesión
      const session = await fetchAuthSession({ forceRefresh: true });
      
      if (!session.tokens?.accessToken) {
        throw new Error('Failed to refresh tokens');
      }
      
      console.log('Tokens refreshed successfully');
      
      // Emitir evento de tokens actualizados
      Hub.dispatch('auth', {
        event: 'tokenRefresh',
        data: { success: true }
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Emitir evento de fallo en refresh
      Hub.dispatch('auth', {
        event: 'tokenRefresh_failure',
        data: { error }
      });
      
      throw error;
    }
  }
  
  /**
   * Configura el monitoreo automático de tokens
   */
  private setupTokenMonitoring(): void {
    // Limpiar interval anterior si existe
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
    
    // Revisar tokens periódicamente
    this.tokenCheckInterval = setInterval(async () => {
      try {
        const tokenInfo = await this.getTokenInfo();
        
        // Emitir advertencia si está por expirar
        if (tokenInfo.isExpiringSoon && !tokenInfo.isExpired) {
          Hub.dispatch('auth', {
            event: 'tokenExpiry_warning',
            data: {
              timeUntilExpiry: tokenInfo.timeUntilExpiry,
              expiresAt: tokenInfo.expiresAt
            }
          });
        }
        
        // Auto-refresh si es necesario
        const validation = await this.validateTokens();
        if (validation.needsRefresh && !tokenInfo.isExpired) {
          await this.refreshTokensIfNeeded();
        }
      } catch (error) {
        console.error('Token monitoring error:', error);
      }
    }, this.CHECK_INTERVAL);
  }
  
  /**
   * Configura listeners para eventos de autenticación
   */
  private setupHubListeners(): void {
    Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signIn':
        case 'autoSignIn':
          console.log('User signed in, starting token monitoring');
          this.setupTokenMonitoring();
          break;
          
        case 'signOut':
          console.log('User signed out, stopping token monitoring');
          this.stopTokenMonitoring();
          break;
          
        case 'sessionExpired':
          console.log('Session expired');
          this.handleSessionExpired();
          break;
      }
    });
  }
  
  /**
   * Maneja la expiración de sesión
   */
  private handleSessionExpired(): void {
    // Emitir evento personalizado
    Hub.dispatch('auth', {
      event: 'sessionExpired_custom',
      data: { timestamp: new Date() }
    });
    
    // Limpiar datos locales si es necesario
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sessionExpired'));
    }
  }
  
  /**
   * Detiene el monitoreo de tokens
   */
  stopTokenMonitoring(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  }
  
  /**
   * Calcula el tiempo restante en formato legible
   */
  getTimeUntilExpiryFormatted(seconds: number): string {
    if (seconds === Infinity) return 'No expira';
    if (seconds <= 0) return 'Expirado';
    
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
  }
}

// Exportar instancia singleton
export const tokenManager = TokenManager.getInstance();