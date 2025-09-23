/**
 * Tipos centralizados para Analytics
 * Fuente única de verdad para eventos y métricas
 */

// ============================================
// Tipos de eventos
// ============================================

export type EventCategory =
  | 'user_interaction'
  | 'navigation'
  | 'form_submission'
  | 'error'
  | 'performance'
  | 'conversion'
  | 'authentication';

export type EventAction =
  | 'click'
  | 'view'
  | 'submit'
  | 'error'
  | 'success'
  | 'cancel'
  | 'timeout'
  | 'load'
  | 'search'
  | 'filter'
  | 'sort'
  | 'paginate';

// ============================================
// Interfaces de eventos
// ============================================

export interface AnalyticsEvent {
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: number;
  timestamp: number;
  sessionId?: string;
  userId?: string;
  properties?: Record<string, string | number | boolean | null>;
}

export interface UserFlowEvent extends AnalyticsEvent {
  flowName: string;
  stepIndex: number;
  stepName: string;
  isComplete?: boolean;
  abandonedAt?: string;
}

export interface PerformanceEvent extends AnalyticsEvent {
  metric: 'page_load' | 'api_call' | 'render' | 'interaction';
  duration: number;
  startTime: number;
  endTime: number;
  success: boolean;
}

export interface ErrorEvent extends AnalyticsEvent {
  errorCode?: string;
  errorMessage: string;
  errorStack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, string | number | boolean | null>;
}

// ============================================
// Interfaces de métricas
// ============================================

export interface PageViewMetrics {
  pageUrl: string;
  pageTitle: string;
  referrer?: string;
  duration?: number;
  scrollDepth?: number;
  exitRate?: number;
}

export interface UserMetrics {
  userId: string;
  sessionCount: number;
  pageViewsPerSession: number;
  averageSessionDuration: number;
  bounceRate: number;
  lastActiveAt: string;
}

export interface ConversionMetrics {
  conversionType: string;
  conversionRate: number;
  totalConversions: number;
  revenue?: number;
  averageOrderValue?: number;
}

// ============================================
// Interfaces de configuración
// ============================================

export interface AnalyticsConfig {
  enabled: boolean;
  debug?: boolean;
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  trackingId?: string;
  customDimensions?: Record<string, string | number | boolean>;
}

export interface TrackingOptions {
  immediate?: boolean;
  batch?: boolean;
  persistent?: boolean;
  retry?: boolean;
  maxRetries?: number;
}

// ============================================
// Interfaces de sesión
// ============================================

export interface SessionData {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: number;
  events: AnalyticsEvent[];
  userId?: string;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os?: string;
  browser?: string;
  screenResolution?: string;
  language?: string;
  timezone?: string;
}

// ============================================
// Interfaces de reporting
// ============================================

export interface AnalyticsReport {
  reportId: string;
  reportType: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: Record<string, number | string>;
  dimensions?: Record<string, string | number | string[]>;
  generatedAt: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{
    url: string;
    views: number;
  }>;
  topEvents: Array<{
    name: string;
    count: number;
  }>;
}

// ============================================
// Tipos de utilidad
// ============================================

export type EventHandler = (event: AnalyticsEvent) => void;
export type MetricsCallback = (metrics: DashboardMetrics) => void;

export interface TrackingResult {
  success: boolean;
  eventId?: string;
  error?: string;
  timestamp: number;
}