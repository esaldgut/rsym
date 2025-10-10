/**
 * Amazon Pinpoint Integration Service
 * Gestiona notificaciones push, in-app messages y analytics
 */

import { Amplify } from 'aws-amplify';
// Analytics para eventos y tracking
import {
  record as pinpointRecord,
  flushEvents
} from 'aws-amplify/analytics';
// In-App Messaging para notificaciones en la app
import {
  initializeInAppMessaging,
  identifyUser as identifyUserInApp,
  syncMessages,
  clearMessages
} from 'aws-amplify/in-app-messaging';
// Push Notifications para notificaciones push
import {
  initializePushNotifications,
  onTokenReceived,
  onNotificationReceivedInForeground,
  onNotificationReceivedInBackground,
  requestPermissions,
  identifyUser as identifyUserPush
} from 'aws-amplify/push-notifications';
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
      
      // Inicializar In-App Messaging
      initializeInAppMessaging();

      // Identificar usuario si está autenticado
      if (userId) {
        await this.identifyUser(userId);
      }

      // Inicializar push notifications si está soportado
      if (this.isPushNotificationSupported()) {
        await this.initializePushNotifications();
      }

      // Sync messages para in-app messaging
      await syncMessages();

      this.initialized = true;
      console.log('✅ Amazon Pinpoint initialized successfully (In-App Messaging + Push Notifications + Analytics)');
      
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

      // Identify user for in-app messaging
      await identifyUserInApp({
        userId,
        userProfile: {
          ...attributes,
          environment: this.config?.environment
        }
      });

      // Identify user for push notifications (si están habilitadas)
      if (this.isPushNotificationSupported()) {
        await identifyUserPush({
          userId,
          userProfile: {
            ...attributes,
            environment: this.config?.environment
          }
        });
      }

    } catch (error) {
      console.error('Error identifying user in Pinpoint:', error);
    }
  }
  
  /**
   * Actualiza información del endpoint
   * NOTA: En Amplify v6, el endpoint se actualiza automáticamente al identificar al usuario
   */
  private async updateEndpointInfo() {
    // En Amplify Gen 2 v6, no hay updateEndpoint() standalone
    // El endpoint se actualiza automáticamente con identifyUser()
    try {
      const deviceInfo = this.getDeviceInfo();
      console.log('📱 Device info:', deviceInfo);
      // El dispositivo info se puede enviar como atributos en identifyUser()
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
      const permissions = await requestPermissions();

      if (permissions) {
        await initializePushNotifications();

        // Registrar listener para token de dispositivo
        onTokenReceived((token) => {
          console.log('✅ Push notification token received:', token);
          this.updatePushToken(token);
        });

        // Manejar notificaciones en primer plano
        onNotificationReceivedInForeground((notification) => {
          console.log('📨 Push notification received (foreground):', notification);
          this.handlePushNotification(notification);
        });

        // Manejar notificaciones en segundo plano
        onNotificationReceivedInBackground((notification) => {
          console.log('📨 Push notification received (background):', notification);
          this.handlePushNotification(notification);
        });
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  }
  
  /**
   * Actualiza el token de push
   * NOTA: En Amplify v6, el token se registra automáticamente
   */
  private async updatePushToken(token: string) {
    try {
      console.log('📱 Push token registered:', token.substring(0, 20) + '...');
      // En Amplify Gen 2 v6, el token se registra automáticamente
      // cuando se llama a initializePushNotifications() y onTokenReceived()
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