# Sistema de Notificaciones YAAN

## Documentación Técnica Completa

### 📍 Descripción General

El **Sistema de Notificaciones YAAN** es una implementación enterprise-grade que combina notificaciones toast elegantes con capacidades avanzadas de analytics y engagement a través de Amazon Pinpoint. Proporciona una experiencia de usuario superior mientras captura métricas valiosas de comportamiento y engagement.

### 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    YAAN Frontend Application               │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                  │
│  ├── ToastContainer                                        │
│  ├── Toast Components                                      │
│  └── UX Interactions                                       │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                      │
│  ├── EnhancedToastManager                                 │
│  ├── Event Tracking Context                               │
│  └── User Experience Optimization                         │
├─────────────────────────────────────────────────────────────┤
│  Analytics & Engagement Layer                             │
│  ├── PinpointService                                      │
│  ├── Event Analytics                                      │
│  ├── Push Notifications                                   │
│  └── Campaign Orchestration                               │
├─────────────────────────────────────────────────────────────┤
│  AWS Services                                             │
│  ├── Amazon Pinpoint                                      │
│  │   ├── Analytics Dashboard                              │
│  │   ├── Push Notification Service                        │
│  │   ├── Email/SMS Campaigns                              │
│  │   └── Journey Orchestration                            │
│  ├── Amazon Cognito (Authentication)                      │
│  └── AWS Amplify (Configuration)                          │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Componentes Principales

#### 1. Toast Component (Enhanced)

**Ubicación**: `/components/ui/ToastWithPinpoint.tsx`

```typescript
interface ToastProps {
  message: string;
  type?: ToastType; // 'success' | 'error' | 'warning' | 'info'
  duration?: number;
  onClose: () => void;
  trackingContext?: PinpointEventAttributes;
  enableTracking?: boolean;
}
```

**Características Principales:**
- ✅ **Diseño YAAN**: Gradientes branded y animaciones suaves
- ✅ **Accesibilidad**: ARIA labels, screen reader support
- ✅ **Responsive**: Mobile-first design
- ✅ **Auto-dismiss**: Configurable timing
- ✅ **Manual dismiss**: Botón de cierre
- ✅ **Tracking automático**: Integración transparente con Pinpoint

**Estados Visuales:**
```css
success: 'bg-gradient-to-r from-green-500 to-emerald-600'
error: 'bg-gradient-to-r from-red-500 to-rose-600'  
warning: 'bg-gradient-to-r from-amber-500 to-orange-600'
info: 'bg-gradient-to-r from-blue-500 to-indigo-600'
```

#### 2. EnhancedToastManager

**Funcionalidades Core:**
```typescript
class EnhancedToastManager {
  // Métodos básicos
  show(message: string, options?: ToastOptions): string
  remove(id: string): void
  clear(): void
  
  // Métodos especializados
  success(message: string, options?: ToastOptions): string
  error(message: string, options?: ToastOptions): string
  warning(message: string, options?: ToastOptions): string
  info(message: string, options?: ToastOptions): string
  
  // Método específico para productos
  productAction(
    message: string, 
    type: ToastType,
    productData?: ProductTrackingData
  ): string
}
```

**Gestión Inteligente:**
- 📊 **Queue Management**: Máximo 5 toasts simultáneos
- 🔄 **Auto-cleanup**: Removes oldest when limit reached
- 📱 **Responsive Stacking**: Vertical stacking with proper spacing
- ⚡ **Performance**: Debounced notifications for rapid calls

#### 3. PinpointService

**Ubicación**: `/lib/services/pinpoint-service.ts`

**Inicialización:**
```typescript
await pinpointService.initialize({
  appId: process.env.NEXT_PUBLIC_PINPOINT_APP_ID,
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  environment: 'production' | 'development'
}, userId);
```

**Funcionalidades Principales:**

##### Event Tracking
```typescript
// Eventos automáticos de toast
recordToastEvent(message, type, duration, context)

// Eventos de productos
recordProductCreated(productId, productType, productName)
recordDraftSaved(productType, productName)
recordError(errorMessage, context)

// Eventos de navegación
recordPageView(pagePath, pageTitle)
```

##### User Management
```typescript
// Identificación de usuarios
identifyUser(userId, attributes)

// Actualización de perfil
updateEndpointInfo()

// Segmentación automática
```

##### Push Notifications
```typescript
// Inicialización automática
initializePushNotifications()

// Token management
updatePushToken(token)

// Manejo de notificaciones entrantes
handlePushNotification(notification)
```

### 📊 Tipos de Eventos Trackables

#### Core Event Types
```typescript
enum PinpointEventType {
  // Eventos de Productos
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated', 
  PRODUCT_PUBLISHED = 'product.published',
  PRODUCT_DRAFT_SAVED = 'product.draft_saved',
  PRODUCT_ERROR = 'product.error',
  
  // Eventos de UI/UX
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
```

#### Event Attributes
```typescript
interface PinpointEventAttributes {
  // Context común
  category?: string;
  label?: string;
  userId?: string;
  sessionId?: string;
  
  // Específico de productos
  productId?: string;
  productType?: 'circuit' | 'package';
  productName?: string;
  
  // Específico de errores
  errorMessage?: string;
  errorCode?: string;
  
  // Específico de toast
  toastType?: ToastType;
  duration?: number;
  
  // Metadata adicional
  [key: string]: any;
}
```

### 🎨 Implementación en ProductWizard

#### ReviewStep Integration
```typescript
// Guardar borrador con tracking
toastManager.productAction(
  `✅ ${productType === 'circuit' ? 'Circuito' : 'Paquete'} guardado como borrador`,
  'success',
  { 
    productType, 
    productName: formData.name,
    category: 'draft_management' 
  }
);

// Publicación exitosa
toastManager.show(
  `🎉 ¡${productType} "${formData.name}" creado exitosamente!`,
  {
    type: 'success',
    duration: 5000,
    trackingContext: {
      productId: result.id,
      productType,
      productName: formData.name,
      category: 'product_publication'
    }
  }
);

// Manejo de errores
toastManager.error(errorMessage, {
  trackingContext: {
    errorType: 'product_creation_failed',
    productType,
    category: 'error_handling'
  }
});
```

#### ProductDetailsStep Integration
```typescript
// Generación de itinerario
toastManager.info('✨ Generando itinerario automático...', {
  duration: 2000,
  trackingContext: {
    feature: 'itinerary_generation',
    productType: actualProductType,
    destinations: destinationWatch.length
  }
});

// Éxito en generación
toastManager.success('✅ Itinerario generado exitosamente', {
  trackingContext: {
    feature: 'itinerary_generation',
    success: true,
    generationTime: Date.now() - startTime
  }
});
```

#### GeneralInfoStep Integration
```typescript
// Upload de archivos
toastManager.info(`📤 Subiendo ${fileTypeText}...`, {
  trackingContext: {
    feature: 'file_upload',
    fileType: type,
    fileSize: file.size
  }
});

// Upload exitoso
toastManager.success(`✅ ${fileTypeText} subida exitosamente`, {
  trackingContext: {
    feature: 'file_upload',
    success: true,
    fileType: type,
    uploadTime: Date.now() - startTime
  }
});
```

### 📈 Analytics y Métricas

#### Dashboard Metrics (Amazon Pinpoint)

**User Engagement:**
- Toast interaction rates por tipo
- Error frequency by feature
- Success rates of operations
- User flow completion rates

**Product Analytics:**
- Circuit vs Package creation patterns
- Draft save frequency
- Publication success rates
- Feature adoption metrics

**Technical Metrics:**
- Error types and frequency
- Performance bottlenecks
- Upload success rates
- API response times

**Business Intelligence:**
- User onboarding completion
- Feature utilization heatmaps
- Conversion funnel analysis
- Retention correlation with notifications

#### Custom Dashboards
```typescript
// Métricas personalizadas para business intelligence
const customMetrics = {
  productCreationSuccess: {
    metric: 'product_creation_rate',
    dimensions: ['productType', 'userSegment', 'timeOfDay']
  },
  errorRecoveryRate: {
    metric: 'error_recovery_success',
    dimensions: ['errorType', 'userExperience', 'deviceType']
  },
  featureAdoption: {
    metric: 'feature_usage_frequency',
    dimensions: ['feature', 'userTier', 'sessionLength']
  }
};
```

### 🚀 Campañas y Automatización

#### Journey Orchestration
```javascript
// Ejemplo de Journey en Pinpoint
const onboardingJourney = {
  name: "ProductWizard_Onboarding",
  triggers: {
    event: "user.first_product_attempt"
  },
  activities: [
    {
      type: "WAIT",
      duration: "PT5M" // 5 minutos
    },
    {
      type: "EMAIL",
      condition: "event.product_created == false",
      template: "onboarding_assistance"
    },
    {
      type: "PUSH",
      condition: "event.draft_saved == true",
      template: "complete_product_creation"
    }
  ]
};
```

#### Segmentación Automática
```typescript
// Segmentos basados en comportamiento
const userSegments = {
  powerUsers: {
    criteria: "event.products_created >= 5"
  },
  strugglingUsers: {
    criteria: "event.errors_encountered >= 3 AND event.products_created < 1"
  },
  draftUsers: {
    criteria: "event.drafts_saved >= 2 AND event.products_published == 0"
  }
};
```

### 🔐 Configuración y Seguridad

#### Environment Variables
```bash
# Amazon Pinpoint Configuration
NEXT_PUBLIC_PINPOINT_APP_ID=your-pinpoint-app-id
NEXT_PUBLIC_AWS_REGION=us-west-2

# Environment
NODE_ENV=production|development|staging

# Optional: Custom Configuration
PINPOINT_CAMPAIGN_AUTO_START=true
PINPOINT_ANALYTICS_SAMPLING_RATE=1.0
NOTIFICATION_MAX_QUEUE_SIZE=5
```

#### IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "mobiletargeting:PutEvents",
        "mobiletargeting:UpdateEndpoint",
        "mobiletargeting:GetEndpoint",
        "mobiletargeting:CreateApp"
      ],
      "Resource": [
        "arn:aws:mobiletargeting:*:*:apps/*"
      ]
    }
  ]
}
```

#### Cognito Integration
```typescript
// Auto-identification cuando usuario se autentica
useEffect(() => {
  const setupPinpoint = async () => {
    const user = await Auth.currentAuthenticatedUser();
    
    await pinpointService.identifyUser(user.attributes.sub, {
      email: user.attributes.email,
      userType: user.attributes['custom:user_type'],
      registrationDate: user.attributes['custom:created_at']
    });
  };
  
  setupPinpoint();
}, []);
```

### 🧪 Testing Strategy

#### Unit Tests
```typescript
describe('EnhancedToastManager', () => {
  test('should track toast events in Pinpoint', async () => {
    const mockPinpoint = jest.spyOn(pinpointService, 'recordToastEvent');
    
    toastManager.success('Test message', {
      trackingContext: { feature: 'test' }
    });
    
    expect(mockPinpoint).toHaveBeenCalledWith(
      'Test message',
      'success',
      3000,
      expect.objectContaining({ feature: 'test' })
    );
  });
  
  test('should limit maximum concurrent toasts', () => {
    // Show 10 toasts rapidly
    for(let i = 0; i < 10; i++) {
      toastManager.show(`Message ${i}`);
    }
    
    expect(toastManager.toasts).toHaveLength(5); // Max limit
  });
});
```

#### Integration Tests
```typescript
describe('Pinpoint Integration', () => {
  test('should initialize Pinpoint successfully', async () => {
    const result = await pinpointService.initialize({
      appId: 'test-app-id',
      region: 'us-west-2',
      environment: 'development'
    });
    
    expect(pinpointService.isInitialized()).toBe(true);
  });
  
  test('should queue events when offline', async () => {
    // Simulate offline scenario
    pinpointService.initialized = false;
    
    await pinpointService.recordEvent('test.event', { test: true });
    
    expect(pinpointService.eventQueue).toHaveLength(1);
  });
});
```

#### E2E Tests (Cypress/Playwright)
```typescript
describe('Notification System E2E', () => {
  test('should show success toast on product creation', () => {
    cy.visit('/provider/products/create');
    
    // Complete form and submit
    cy.fillProductForm({ type: 'circuit', name: 'Test Circuit' });
    cy.get('[data-testid="publish-button"]').click();
    
    // Verify toast appearance
    cy.get('[role="alert"]')
      .should('contain', 'Circuito "Test Circuit" creado exitosamente')
      .should('have.class', 'bg-gradient-to-r from-green-500');
      
    // Verify Pinpoint event was sent
    cy.window().its('pinpointEvents').should('include', 'product.created');
  });
});
```

### 📱 Responsive Design

#### Mobile-First Approach
```css
/* Base (Mobile) */
.toast-container {
  top: 4px;
  right: 4px;
  left: 4px;
  min-width: auto;
  max-width: calc(100vw - 32px);
}

/* Tablet */
@media (min-width: 640px) {
  .toast-container {
    left: auto;
    min-width: 320px;
    max-width: 400px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .toast-container {
    max-width: 500px;
  }
}
```

#### Accessibility Features
```typescript
// ARIA compliance
<div 
  role="alert"
  aria-live={type === 'error' ? 'assertive' : 'polite'}
  aria-describedby={`toast-${id}`}
>
  <p id={`toast-${id}`} className="sr-only">
    {type} notification: {message}
  </p>
</div>
```

### 🔮 Roadmap y Mejoras Futuras

#### Próximas Funcionalidades
1. **Rich Notifications**
   - Botones de acción en toasts
   - Imágenes y multimedia
   - Progress bars para operaciones largas

2. **Advanced Analytics** 
   - Heatmaps de interacción
   - A/B testing de mensajes
   - Predictive analytics

3. **Multi-channel**
   - WhatsApp integration
   - Slack notifications
   - Microsoft Teams webhooks

4. **AI-Powered**
   - Smart notification timing
   - Content optimization
   - Sentiment analysis

#### Optimizaciones Técnicas
1. **Performance**
   - Virtual scrolling para grandes listas
   - Web Workers para heavy computations
   - Service Worker para offline support

2. **Developer Experience**
   - DevTools extension
   - Real-time debugging
   - Performance profiler

### 📋 Checklist de Implementación

#### Para Desarrolladores
- [ ] Instalar dependencias AWS SDK
- [ ] Configurar environment variables
- [ ] Importar ToastContainer en layout principal
- [ ] Inicializar PinpointService en _app.tsx
- [ ] Configurar error boundaries
- [ ] Implementar tests unitarios
- [ ] Configurar E2E tests

#### Para DevOps
- [ ] Configurar IAM roles para Pinpoint
- [ ] Setup Amazon Pinpoint app
- [ ] Configurar push notification certificates
- [ ] Setup monitoring y alertas
- [ ] Configurar CI/CD pipelines
- [ ] Setup staging environment
- [ ] Configurar analytics dashboards

#### Para Product/Marketing
- [ ] Definir eventos de negocio críticos
- [ ] Configurar segmentos de usuarios
- [ ] Crear templates de email/push
- [ ] Setup journeys de onboarding
- [ ] Configurar A/B tests
- [ ] Definir métricas de éxito
- [ ] Crear dashboards ejecutivos

---

## 🏆 Conclusión

El **Sistema de Notificaciones YAAN** representa una implementación enterprise que combina:

- ✅ **Excellent UX**: Notificaciones elegantes y no intrusivas
- ✅ **Advanced Analytics**: Tracking completo con Amazon Pinpoint  
- ✅ **Marketing Automation**: Campaigns y journeys automáticos
- ✅ **Performance**: Optimizado para scale y responsiveness
- ✅ **Accessibility**: WCAG compliant con ARIA support
- ✅ **Developer Experience**: APIs intuitivas y type-safe
- ✅ **Business Intelligence**: Métricas accionables para crecimiento

**El sistema está production-ready y proporciona una base sólida para engagement de usuarios y growth marketing en la plataforma YAAN.**