# Analytics Tracking Guide for YAAN Platform

## Overview

This document provides comprehensive guidelines for implementing analytics tracking across the YAAN platform, with focus on the notification system integration with Amazon Pinpoint and general event tracking patterns.

## Architecture

### Analytics Stack
```
YAAN Analytics Architecture
├── Amazon Pinpoint (Primary)
│   ├── Event Tracking
│   ├── User Segmentation
│   ├── Campaign Management
│   └── Custom Attributes
├── Tracking Context System
│   ├── Structured Event Data
│   ├── Feature Mapping
│   ├── Category Classification
│   └── Error Correlation
└── Local Analytics Utils
    ├── Event Queue
    ├── Batch Processing
    ├── Offline Support
    └── Privacy Compliance
```

## Event Tracking Standards

### Core Event Structure
```typescript
interface AnalyticsEvent {
  name: string;                    // Event name
  timestamp: number;               // Unix timestamp
  userId?: string;                 // User identifier
  sessionId: string;               // Session identifier
  properties: EventProperties;     // Event-specific data
  context: EventContext;          // System context
}

interface EventProperties {
  feature: string;                 // Feature identifier
  category: string;                // Event category
  action?: string;                 // Specific action
  label?: string;                  // Additional label
  value?: number;                  // Numeric value
  [key: string]: any;             // Additional properties
}

interface EventContext {
  platform: 'web' | 'mobile';
  userAgent: string;
  viewport: { width: number; height: number };
  location: { pathname: string; search: string };
  referrer?: string;
}
```

### Notification-Specific Events

#### Success Notifications
```typescript
// Event: notification_success_shown
const trackSuccessNotification = (trackingContext: TrackingContext) => {
  analytics.track('notification_success_shown', {
    feature: trackingContext.feature,
    category: trackingContext.category,
    notification_type: 'toast',
    success_action: trackingContext.action || 'unknown',
    ...trackingContext
  });
};

// Usage example
toastManager.success('✅ Producto creado exitosamente', {
  trackingContext: {
    feature: 'product_creation',
    category: 'content_management',
    productId: 'prod-123',
    productType: 'circuit'
  }
});
// Automatically tracks: notification_success_shown
```

#### Error Notifications
```typescript
// Event: notification_error_shown
const trackErrorNotification = (trackingContext: TrackingContext & { error: string }) => {
  analytics.track('notification_error_shown', {
    feature: trackingContext.feature,
    category: trackingContext.category,
    notification_type: 'toast',
    error_type: categorizeError(trackingContext.error),
    error_message: trackingContext.error,
    ...trackingContext
  });
};

// Error categorization
const categorizeError = (error: string): string => {
  if (error.includes('network') || error.includes('timeout')) return 'network_error';
  if (error.includes('validation') || error.includes('required')) return 'validation_error';
  if (error.includes('auth') || error.includes('token')) return 'auth_error';
  if (error.includes('permission') || error.includes('forbidden')) return 'permission_error';
  return 'system_error';
};
```

#### Modal Interactions
```typescript
// Event: modal_interaction
const trackModalInteraction = (action: 'opened' | 'closed' | 'confirmed' | 'cancelled', context: any) => {
  analytics.track('modal_interaction', {
    modal_action: action,
    modal_type: context.modalType,
    feature: context.feature,
    interaction_method: context.method || 'click', // click, keyboard, programmatic
    time_to_action: context.timeToAction,
    ...context
  });
};

// Usage in modal components
const ConfirmationModal = ({ onConfirm, onCancel, trackingContext }) => {
  const [openTime] = useState(Date.now());

  const handleConfirm = () => {
    trackModalInteraction('confirmed', {
      ...trackingContext,
      timeToAction: Date.now() - openTime
    });
    onConfirm();
  };

  const handleCancel = () => {
    trackModalInteraction('cancelled', {
      ...trackingContext,
      timeToAction: Date.now() - openTime
    });
    onCancel();
  };

  useEffect(() => {
    trackModalInteraction('opened', trackingContext);
  }, []);

  // Component implementation...
};
```

## Feature-Specific Tracking

### Content Management
```typescript
// Product lifecycle events
interface ProductTrackingContext {
  feature: 'product_creation' | 'product_editing' | 'product_deletion' | 'product_publishing';
  category: 'content_management';
  productId: string;
  productType: 'circuit' | 'package';
  providerId: string;
  step?: string;           // For multi-step processes
  duration?: number;       // Time spent on action
}

// Content creation funnel
const trackProductCreationStep = (step: string, context: Partial<ProductTrackingContext>) => {
  analytics.track('product_creation_step', {
    step,
    feature: 'product_creation',
    category: 'content_management',
    funnel_position: getFunnelPosition(step),
    ...context
  });
};

const PRODUCT_CREATION_FUNNEL = [
  'name_selection',
  'general_info',
  'product_details',
  'pricing_setup',
  'review',
  'publish'
];
```

### Social Interactions
```typescript
interface SocialTrackingContext {
  feature: 'social_interaction';
  category: 'engagement';
  actionType: 'like' | 'share' | 'comment' | 'save';
  contentType: 'moment' | 'product' | 'comment';
  contentId: string;
  contentOwnerId?: string;
  shareMethod?: 'clipboard' | 'native' | 'social_media';
}

// Social engagement tracking
const trackSocialInteraction = (context: SocialTrackingContext) => {
  analytics.track('social_interaction', {
    ...context,
    engagement_value: getEngagementValue(context.actionType),
    user_relationship: getUserRelationship(context.contentOwnerId)
  });
};

const getEngagementValue = (action: string): number => {
  const values = {
    'like': 1,
    'share': 3,
    'comment': 5,
    'save': 2
  };
  return values[action] || 0;
};
```

### E-commerce and Reservations
```typescript
interface ReservationTrackingContext {
  feature: 'reservation_creation' | 'payment_processing' | 'booking_management';
  category: 'e_commerce';
  reservationId?: string;
  experienceId: string;
  providerId: string;
  totalPrice: number;
  currency: string;
  adults: number;
  kids: number;
  babies: number;
  paymentMethod?: string;
  step?: 'form_opened' | 'form_completed' | 'payment_initiated' | 'payment_completed';
}

// E-commerce funnel tracking
const trackReservationFunnel = (step: string, context: ReservationTrackingContext) => {
  analytics.track('reservation_funnel', {
    ...context,
    step,
    funnel_stage: getReservationFunnelStage(step),
    conversion_value: context.totalPrice,
    item_category: 'experience',
    item_quantity: context.adults + context.kids + context.babies
  });
};

// Revenue tracking
const trackRevenue = (context: ReservationTrackingContext & { status: 'completed' | 'failed' }) => {
  if (context.status === 'completed') {
    analytics.track('purchase', {
      transaction_id: context.reservationId,
      value: context.totalPrice,
      currency: context.currency,
      items: [{
        item_id: context.experienceId,
        item_name: 'Experience Reservation',
        item_category: 'experience',
        quantity: 1,
        price: context.totalPrice
      }]
    });
  }
};
```

### User Journey Tracking
```typescript
interface UserJourneyEvent {
  feature: string;
  category: 'user_journey';
  journeyStage: 'discovery' | 'consideration' | 'conversion' | 'retention';
  touchpoint: string;
  sessionDuration: number;
  pageViews: number;
  interactions: number;
}

// Page view tracking with context
const trackPageView = (pathname: string, additionalContext?: Record<string, any>) => {
  analytics.track('page_view', {
    page: pathname,
    feature: getFeatureFromPath(pathname),
    category: 'navigation',
    journey_stage: getJourneyStage(pathname),
    session_page_views: getSessionPageViews(),
    time_on_previous_page: getTimeOnPreviousPage(),
    ...additionalContext
  });
};

// Feature detection from path
const getFeatureFromPath = (pathname: string): string => {
  const pathMap = {
    '/marketplace': 'marketplace_browsing',
    '/moments': 'social_feed',
    '/create': 'content_creation',
    '/profile': 'profile_management',
    '/dashboard': 'provider_dashboard'
  };
  
  return pathMap[pathname] || 'general_navigation';
};
```

## Advanced Analytics Patterns

### Cohort Analysis Support
```typescript
interface CohortTrackingContext {
  userCohort: string;        // e.g., "2024-01-week-1"
  userSegment: string;       // e.g., "new_provider", "returning_traveler"
  acquisitionChannel: string; // e.g., "organic", "paid_social", "referral"
  lifetimeValue?: number;
  daysSinceSignup: number;
}

// Add cohort context to events
const enrichEventWithCohort = (baseEvent: AnalyticsEvent): AnalyticsEvent => {
  const user = getCurrentUser();
  const cohortData = calculateUserCohort(user);
  
  return {
    ...baseEvent,
    properties: {
      ...baseEvent.properties,
      user_cohort: cohortData.cohort,
      user_segment: cohortData.segment,
      acquisition_channel: cohortData.acquisitionChannel,
      days_since_signup: cohortData.daysSinceSignup
    }
  };
};
```

### A/B Testing Integration
```typescript
interface ExperimentContext {
  experimentId: string;
  variant: string;
  experimentType: 'ui_test' | 'algorithm_test' | 'feature_flag';
}

const trackExperimentInteraction = (action: string, context: ExperimentContext) => {
  analytics.track('experiment_interaction', {
    experiment_id: context.experimentId,
    experiment_variant: context.variant,
    experiment_type: context.experimentType,
    interaction_type: action,
    feature: getCurrentFeature(),
    category: 'experimentation'
  });
};

// Usage in components
const ExperimentalFeature = () => {
  const experiment = useExperiment('notification_style_test');
  
  const handleInteraction = (action: string) => {
    trackExperimentInteraction(action, experiment);
    // Regular interaction logic...
  };
  
  return experiment.variant === 'new_style' ? 
    <NewNotificationStyle onInteraction={handleInteraction} /> :
    <DefaultNotificationStyle onInteraction={handleInteraction} />;
};
```

### Performance Analytics
```typescript
interface PerformanceMetrics {
  feature: string;
  category: 'performance';
  metric_type: 'load_time' | 'interaction_time' | 'error_rate' | 'success_rate';
  value: number;
  threshold?: number;
  context?: string;
}

// Performance tracking utilities
const trackPerformanceMetric = (metric: PerformanceMetrics) => {
  analytics.track('performance_metric', {
    ...metric,
    is_above_threshold: metric.threshold ? metric.value > metric.threshold : undefined,
    browser: getBrowserInfo(),
    connection_type: getConnectionType(),
    device_type: getDeviceType()
  });
};

// Modal performance tracking
const useModalPerformance = (modalName: string) => {
  const [openTime, setOpenTime] = useState<number>();
  
  const trackModalOpened = () => {
    const startTime = performance.now();
    setOpenTime(startTime);
    
    trackPerformanceMetric({
      feature: modalName,
      category: 'performance',
      metric_type: 'load_time',
      value: startTime,
      context: 'modal_render'
    });
  };
  
  const trackModalInteraction = () => {
    if (openTime) {
      const interactionTime = performance.now() - openTime;
      trackPerformanceMetric({
        feature: modalName,
        category: 'performance',
        metric_type: 'interaction_time',
        value: interactionTime,
        threshold: 500, // 500ms threshold for good UX
        context: 'modal_interaction'
      });
    }
  };
  
  return { trackModalOpened, trackModalInteraction };
};
```

## Privacy and Compliance

### Data Minimization
```typescript
// Sanitize tracking data
const sanitizeTrackingContext = (context: any): any => {
  const sanitized = { ...context };
  
  // Remove PII
  delete sanitized.email;
  delete sanitized.phoneNumber;
  delete sanitized.fullName;
  
  // Hash sensitive identifiers
  if (sanitized.userId) {
    sanitized.userId = hashUserId(sanitized.userId);
  }
  
  // Limit string lengths
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 100) {
      sanitized[key] = sanitized[key].substring(0, 100) + '...';
    }
  });
  
  return sanitized;
};
```

### Consent Management
```typescript
interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  performance: boolean;
}

const trackWithConsent = (eventName: string, properties: any, requiredConsent: keyof ConsentPreferences) => {
  const consent = getUserConsent();
  
  if (consent[requiredConsent]) {
    analytics.track(eventName, sanitizeTrackingContext(properties));
  } else {
    // Log for debugging but don't track
    console.debug(`Analytics event blocked due to consent: ${eventName}`);
  }
};

// Notification tracking with consent
toastManager.success('Success message', {
  trackingContext: {
    feature: 'test_feature',
    category: 'user_action'
  }
}, 'analytics'); // Required consent type
```

## Implementation Best Practices

### Event Batching
```typescript
class AnalyticsBatch {
  private batch: AnalyticsEvent[] = [];
  private batchSize = 50;
  private flushInterval = 30000; // 30 seconds
  
  constructor() {
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  add(event: AnalyticsEvent) {
    this.batch.push(event);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }
  
  private async flush() {
    if (this.batch.length === 0) return;
    
    const events = [...this.batch];
    this.batch = [];
    
    try {
      await analytics.sendBatch(events);
    } catch (error) {
      // Re-queue on failure
      this.batch.unshift(...events);
      console.error('Analytics batch failed:', error);
    }
  }
}
```

### Error Tracking
```typescript
// Comprehensive error tracking
const trackError = (error: Error, context: any) => {
  analytics.track('error_occurred', {
    error_name: error.name,
    error_message: error.message,
    error_stack: error.stack?.substring(0, 500),
    feature: context.feature,
    category: 'error_tracking',
    user_action: context.userAction,
    component: context.component,
    severity: categorizeErrorSeverity(error),
    browser: getBrowserInfo(),
    timestamp: Date.now()
  });
};

const categorizeErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
  if (error.name === 'ChunkLoadError') return 'medium';
  if (error.message.includes('network')) return 'high';
  if (error.message.includes('auth')) return 'critical';
  return 'low';
};
```

### Development Tools
```typescript
// Analytics debugging in development
if (process.env.NODE_ENV === 'development') {
  window.analyticsDebug = {
    events: [],
    logEvent: (event: AnalyticsEvent) => {
      console.group(`📊 Analytics Event: ${event.name}`);
      console.log('Properties:', event.properties);
      console.log('Context:', event.context);
      console.groupEnd();
      
      window.analyticsDebug.events.push(event);
    },
    getEvents: () => window.analyticsDebug.events,
    clearEvents: () => window.analyticsDebug.events = []
  };
}
```

## Testing Analytics

### Unit Testing
```typescript
describe('Analytics Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track notification success with correct context', () => {
    const trackSpy = jest.spyOn(analytics, 'track');
    
    toastManager.success('Test success', {
      trackingContext: {
        feature: 'test_feature',
        category: 'test_category',
        testId: 'test-123'
      }
    });
    
    expect(trackSpy).toHaveBeenCalledWith('notification_success_shown', {
      feature: 'test_feature',
      category: 'test_category',
      testId: 'test-123',
      notification_type: 'toast',
      success_action: 'unknown'
    });
  });
});
```

### Integration Testing
```typescript
// Test analytics flow in user scenarios
describe('User Journey Analytics', () => {
  it('should track complete product creation flow', async () => {
    const trackSpy = jest.spyOn(analytics, 'track');
    
    // Simulate user creating a product
    render(<ProductCreationWizard />);
    
    // Step 1: Name selection
    fireEvent.change(screen.getByLabelText('Product Name'), {
      target: { value: 'Test Product' }
    });
    fireEvent.click(screen.getByText('Next'));
    
    expect(trackSpy).toHaveBeenCalledWith('product_creation_step', {
      step: 'name_selection',
      feature: 'product_creation',
      category: 'content_management'
    });
    
    // Continue through steps...
    // Verify final success tracking
    await waitFor(() => {
      expect(trackSpy).toHaveBeenCalledWith('notification_success_shown', 
        expect.objectContaining({
          feature: 'product_creation',
          category: 'content_management'
        })
      );
    });
  });
});
```

## Monitoring and Alerts

### Key Metrics to Monitor
1. **Event Volume**: Track event throughput and identify anomalies
2. **Error Rates**: Monitor analytics failures and data quality issues
3. **User Engagement**: Track notification interaction rates
4. **Performance Impact**: Monitor analytics overhead on app performance

### Automated Alerts
```typescript
// Analytics health monitoring
const monitorAnalyticsHealth = () => {
  const metrics = {
    eventsSentLastHour: getEventCount('1h'),
    errorRateLastHour: getErrorRate('1h'),
    avgEventSize: getAverageEventSize(),
    failedBatches: getFailedBatches('1h')
  };
  
  // Alert on anomalies
  if (metrics.errorRateLastHour > 0.05) { // 5% error rate threshold
    sendAlert('High analytics error rate detected', metrics);
  }
  
  if (metrics.eventsSentLastHour < getExpectedEventVolume() * 0.5) {
    sendAlert('Low analytics event volume detected', metrics);
  }
};
```

## Conclusion

This analytics tracking guide ensures comprehensive, consistent, and compliant event tracking across the YAAN platform. By following these patterns, we can gain valuable insights into user behavior, system performance, and business metrics while maintaining user privacy and system reliability.

All new features should implement these analytics patterns from the beginning, and existing features should be gradually updated to match these standards.