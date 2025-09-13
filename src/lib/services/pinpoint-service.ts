/**
 * Amazon Pinpoint Integration Service
 * Gestiona notificaciones push, in-app messages y analytics
 */

import { Amplify } from 'aws-amplify';
import { 
  record as pinpointRecord,
  recordEvent,
  flushEvents,
  initializePushNotifications,
  identifyUser,
  updateEndpoint
} from 'aws-amplify/in-app-messaging';
import { PushNotification } from '@aws-amplify/pushnotification';
import type { ToastType } from '@/components/ui/Toast';

/**
 * Configuración de Amazon Pinpoint
 */
export interface PinpointConfig {
  appId: string;
  region: string;
  environment: 'development' | 'staging' | 'production';
}

/**
 * Tipos de eventos para tracking
 */
export enum PinpointEventType {
  // Eventos de Productos
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_PUBLISHED = 'product.published',
  PRODUCT_DRAFT_SAVED = 'product.draft_saved',
  PRODUCT_ERROR = 'product.error',
  
  // Eventos de UI
  TOAST_SHOWN = 'ui.toast_shown',
  MODAL_OPENED = 'ui.modal_opened',
  MODAL_CLOSED = 'ui.modal_closed',
  
  // Eventos de Usuario
  USER_ACTION = 'user.action',
  USER_ERROR = 'user.error',
  
  // Eventos de Navegación
  PAGE_VIEW = 'navigation.page_view',
  FEATURE_USED = 'navigation.feature_used'
}

/**
 * Atributos de evento para Pinpoint
 */
export interface PinpointEventAttributes {
  category?: string;
  label?: string;
  value?: string | number;
  userId?: string;
  productId?: string;
  productType?: 'circuit' | 'package';
  errorMessage?: string;
  toastType?: ToastType;
  duration?: number;
  [key: string]: any;
}

/**
 * Métricas de evento para Pinpoint
 */
export interface PinpointEventMetrics {
  duration?: number;
  count?: number;
  value?: number;
  [key: string]: number | undefined;
}

/**
 * Servicio principal de Amazon Pinpoint
 */
class PinpointService {
  private initialized = false;
  private config: PinpointConfig | null = null;
  private userId: string | null = null;
  private sessionId: string = this.generateSessionId();
  private eventQueue: Array<{
    eventType: string;
    attributes?: PinpointEventAttributes;
    metrics?: PinpointEventMetrics;
  }> = [];
  
  /**
   * Inicializa Amazon Pinpoint
   */
  async initialize(config: PinpointConfig, userId?: string) {
    try {
      this.config = config;
      
      // Configurar Amplify para Pinpoint
      const pinpointConfig = {
        appId: config.appId,
        region: config.region,
        bufferSize: 1000,
        flushInterval: 5000, // 5 segundos
        resendLimit: 5,
        environment: config.environment
      };
      
      // Actualizar configuración de Amplify
      Amplify.configure({
        Analytics: {
          Pinpoint: pinpointConfig
        }
      });
      
      // Identificar usuario si está autenticado
      if (userId) {
        await this.identifyUser(userId);
      }
      
      // Inicializar push notifications si está soportado
      if (this.isPushNotificationSupported()) {
        await this.initializePushNotifications();
      }
      
      this.initialized = true;
      console.log('✅ Amazon Pinpoint initialized successfully');
      
      // Procesar eventos encolados
      await this.processQueuedEvents();
      
    } catch (error) {
      console.error('❌ Error initializing Amazon Pinpoint:', error);
      this.initialized = false;
    }
  }
  
  /**
   * Identifica al usuario actual
   */
  async identifyUser(userId: string, attributes?: Record<string, any>) {
    try {
      this.userId = userId;
      
      await identifyUser({
        userId,
        userProfile: {
          ...attributes,
          environment: this.config?.environment
        }
      });
      
      // Actualizar endpoint con información del dispositivo
      await this.updateEndpointInfo();
      
    } catch (error) {
      console.error('Error identifying user in Pinpoint:', error);
    }
  }
  
  /**
   * Actualiza información del endpoint
   */
  private async updateEndpointInfo() {
    try {
      const deviceInfo = this.getDeviceInfo();
      
      await updateEndpoint({
        address: this.userId || 'anonymous',
        channelType: 'IN_APP',
        optOut: 'NONE',
        attributes: {
          browser: deviceInfo.browser,
          platform: deviceInfo.platform,
          language: deviceInfo.language,
          timezone: deviceInfo.timezone
        },
        metrics: {
          screenWidth: deviceInfo.screenWidth,
          screenHeight: deviceInfo.screenHeight
        }
      });
    } catch (error) {
      console.error('Error updating endpoint:', error);
    }
  }
  
  /**
   * Registra un evento de notificación Toast
   */
  async recordToastEvent(
    message: string, 
    type: ToastType, 
    duration: number,
    context?: PinpointEventAttributes
  ) {
    await this.recordEvent(PinpointEventType.TOAST_SHOWN, {
      ...context,
      toastType: type,
      message: message.substring(0, 100), // Limitar longitud
      duration
    }, {
      duration
    });
  }
  
  /**
   * Registra un evento genérico
   */
  async recordEvent(
    eventType: PinpointEventType | string,
    attributes?: PinpointEventAttributes,
    metrics?: PinpointEventMetrics
  ) {
    // Si no está inicializado, encolar evento
    if (!this.initialized) {
      this.eventQueue.push({ eventType, attributes, metrics });
      return;
    }
    
    try {
      await pinpointRecord({
        name: eventType,
        attributes: {
          ...attributes,
          sessionId: this.sessionId,
          userId: this.userId || 'anonymous',
          timestamp: new Date().toISOString(),
          environment: this.config?.environment
        },
        metrics
      });
      
      // Auto-flush en eventos críticos
      if (this.isCriticalEvent(eventType)) {
        await this.flushEvents();
      }
      
    } catch (error) {
      console.error('Error recording Pinpoint event:', error);
    }
  }
  
  /**
   * Registra evento de creación de producto
   */
  async recordProductCreated(
    productId: string,
    productType: 'circuit' | 'package',
    productName: string
  ) {
    await this.recordEvent(PinpointEventType.PRODUCT_CREATED, {
      productId,
      productType,
      productName,
      category: 'product_management'
    });
  }
  
  /**
   * Registra evento de guardado de borrador
   */
  async recordDraftSaved(
    productType: 'circuit' | 'package',
    productName?: string
  ) {
    await this.recordEvent(PinpointEventType.PRODUCT_DRAFT_SAVED, {
      productType,
      productName,
      category: 'product_management'
    });
  }
  
  /**
   * Registra evento de error
   */
  async recordError(
    errorMessage: string,
    errorContext: PinpointEventAttributes
  ) {
    await this.recordEvent(PinpointEventType.PRODUCT_ERROR, {
      ...errorContext,
      errorMessage,
      category: 'error'
    });
  }
  
  /**
   * Registra vista de página
   */
  async recordPageView(pagePath: string, pageTitle?: string) {
    await this.recordEvent(PinpointEventType.PAGE_VIEW, {
      pagePath,
      pageTitle,
      category: 'navigation'
    });
  }
  
  /**
   * Envía todos los eventos pendientes
   */
  async flushEvents() {
    try {
      await flushEvents();
    } catch (error) {
      console.error('Error flushing Pinpoint events:', error);
    }
  }
  
  /**
   * Inicializa notificaciones push
   */
  private async initializePushNotifications() {
    try {
      // Solicitar permisos
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await initializePushNotifications();
        
        // Registrar token de dispositivo
        PushNotification.onRegister((token) => {
          console.log('Push notification token:', token);
          this.updatePushToken(token);
        });
        
        // Manejar notificaciones recibidas
        PushNotification.onNotification((notification) => {
          console.log('Push notification received:', notification);
          this.handlePushNotification(notification);
        });
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }
  
  /**
   * Actualiza el token de push
   */
  private async updatePushToken(token: string) {
    try {
      await updateEndpoint({
        address: token,
        channelType: 'GCM', // o 'APNS' para iOS
        optOut: 'NONE'
      });
    } catch (error) {
      console.error('Error updating push token:', error);
    }
  }
  
  /**
   * Maneja notificación push recibida
   */
  private handlePushNotification(notification: any) {
    // Lógica personalizada para manejar notificaciones
    console.log('Handling push notification:', notification);
  }
  
  /**
   * Procesa eventos encolados
   */
  private async processQueuedEvents() {
    if (this.eventQueue.length === 0) return;
    
    const queue = [...this.eventQueue];
    this.eventQueue = [];
    
    for (const event of queue) {
      await this.recordEvent(event.eventType, event.attributes, event.metrics);
    }
  }
  
  /**
   * Verifica si es un evento crítico
   */
  private isCriticalEvent(eventType: string): boolean {
    const criticalEvents = [
      PinpointEventType.PRODUCT_CREATED,
      PinpointEventType.PRODUCT_PUBLISHED,
      PinpointEventType.PRODUCT_ERROR,
      PinpointEventType.USER_ERROR
    ];
    
    return criticalEvents.includes(eventType as PinpointEventType);
  }
  
  /**
   * Verifica soporte de push notifications
   */
  private isPushNotificationSupported(): boolean {
    return 'Notification' in window && 
           'serviceWorker' in navigator &&
           'PushManager' in window;
  }
  
  /**
   * Obtiene información del dispositivo
   */
  private getDeviceInfo() {
    return {
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
  }
  
  /**
   * Genera ID de sesión único
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Obtiene el estado de inicialización
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Limpia recursos
   */
  async cleanup() {
    await this.flushEvents();
    this.initialized = false;
    this.userId = null;
    this.sessionId = this.generateSessionId();
  }
}

// Singleton instance
export const pinpointService = new PinpointService();

// Re-export types
export type { PinpointConfig, PinpointEventAttributes, PinpointEventMetrics };