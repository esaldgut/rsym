'use client';

/**
 * Analytics Service - Fase 1
 * Implementación básica de tracking con AWS CloudWatch
 * Siguiendo la arquitectura de Analytics Paralelos
 */

export interface TrackingContext {
  // Feature Tracking
  feature: string;
  category: string;
  subcategory?: string;
  
  // User Journey (básico para Fase 1)
  userFlow?: {
    previousAction?: string;
    currentAction: string;
    flowId?: string;
  };
  
  // Error Context (cuando aplique)
  error?: {
    message: string;
    code?: string;
    correlationId?: string;
  };
  
  // Performance Metrics
  performance?: {
    operationTime?: number;
    apiResponseTime?: number;
  };
  
  // Business Context
  metadata?: Record<string, any>;
}

export interface AnalyticsEvent {
  eventType: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  context: TrackingContext;
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private isEnabled: boolean = true;
  private batchSize: number = 20;
  private batchInterval: number = 5000; // 5 segundos
  
  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Flush cuando el usuario cierra la página
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }
  
  /**
   * Track un evento con contexto completo
   */
  track(eventType: string, context: TrackingContext): void {
    if (!this.isEnabled) return;
    
    try {
      const event: AnalyticsEvent = {
        eventType,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userId: this.getCurrentUserId(),
        context
      };
      
      this.queue.push(event);
      
      // Log local en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Analytics Event:', {
          type: eventType,
          ...context
        });
      }
      
      // Iniciar batch timer si no está activo
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.flush();
        }, this.batchInterval);
      }
      
      // Flush inmediato si alcanzamos el batch size
      if (this.queue.length >= this.batchSize) {
        this.flush();
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // No interrumpir UX por errores de analytics
    }
  }
  
  /**
   * Track evento de éxito
   */
  trackSuccess(feature: string, action: string, metadata?: Record<string, any>): void {
    this.track(`${feature}_success`, {
      feature,
      category: 'user_action',
      userFlow: {
        currentAction: action
      },
      metadata
    });
  }
  
  /**
   * Track evento de error
   */
  trackError(feature: string, error: Error | string, metadata?: Record<string, any>): void {
    const errorMessage = error instanceof Error ? error.message : error;
    
    this.track(`${feature}_error`, {
      feature,
      category: 'error',
      error: {
        message: errorMessage,
        correlationId: this.generateCorrelationId()
      },
      metadata
    });
  }
  
  /**
   * Track performance metrics
   */
  trackPerformance(feature: string, action: string, duration: number, metadata?: Record<string, any>): void {
    this.track(`${feature}_performance`, {
      feature,
      category: 'performance',
      userFlow: {
        currentAction: action
      },
      performance: {
        operationTime: duration
      },
      metadata
    });
  }
  
  /**
   * Track user journey/flow
   */
  trackUserFlow(feature: string, currentAction: string, previousAction?: string, metadata?: Record<string, any>): void {
    this.track(`${feature}_flow`, {
      feature,
      category: 'user_journey',
      userFlow: {
        previousAction,
        currentAction,
        flowId: this.generateFlowId()
      },
      metadata
    });
  }
  
  /**
   * Flush eventos pendientes a CloudWatch
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    
    // Limpiar timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Copiar y limpiar queue
    const events = [...this.queue];
    this.queue = [];
    
    try {
      // En Fase 1: Enviar a un endpoint que maneje CloudWatch
      // En desarrollo: Solo log
      if (process.env.NODE_ENV === 'production') {
        await this.sendToCloudWatch(events);
      } else {
        console.log('📤 Analytics Batch:', events);
      }
    } catch (error) {
      console.error('Analytics flush error:', error);
      // En caso de error, podríamos reintentar o guardar localmente
      this.handleFlushError(events);
    }
  }
  
  /**
   * Enviar eventos a CloudWatch (implementación básica Fase 1)
   */
  private async sendToCloudWatch(events: AnalyticsEvent[]): Promise<void> {
    // Fase 1: Endpoint simple que recibe eventos y los envía a CloudWatch
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        events,
        source: 'web-client',
        environment: process.env.NODE_ENV
      })
    });
    
    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }
  
  /**
   * Manejar errores de flush (guardar localmente para retry)
   */
  private handleFlushError(events: AnalyticsEvent[]): void {
    try {
      // Guardar en localStorage para retry posterior
      const stored = localStorage.getItem('analytics_failed_events');
      const failedEvents = stored ? JSON.parse(stored) : [];
      
      // Limitar a últimos 100 eventos para no llenar localStorage
      const newEvents = [...failedEvents, ...events].slice(-100);
      localStorage.setItem('analytics_failed_events', JSON.stringify(newEvents));
    } catch (error) {
      console.error('Failed to store analytics events:', error);
    }
  }
  
  /**
   * Retry eventos fallidos (llamar en app init)
   */
  retryFailedEvents(): void {
    try {
      const stored = localStorage.getItem('analytics_failed_events');
      if (stored) {
        const events = JSON.parse(stored);
        if (events.length > 0) {
          this.queue.push(...events);
          localStorage.removeItem('analytics_failed_events');
          this.flush();
        }
      }
    } catch (error) {
      console.error('Failed to retry analytics events:', error);
    }
  }
  
  /**
   * Helpers
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateFlowId(): string {
    return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getCurrentUserId(): string | undefined {
    // Obtener de contexto de autenticación
    // Por ahora retornamos undefined
    return undefined;
  }
  
  /**
   * Control methods
   */
  enable(): void {
    this.isEnabled = true;
  }
  
  disable(): void {
    this.isEnabled = false;
    this.flush(); // Flush pendientes antes de desactivar
  }
  
  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(100, size));
  }
  
  setBatchInterval(interval: number): void {
    this.batchInterval = Math.max(1000, Math.min(60000, interval));
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Hook para React components
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackSuccess: analytics.trackSuccess.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackUserFlow: analytics.trackUserFlow.bind(analytics)
  };
}