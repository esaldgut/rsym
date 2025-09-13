# YAAN Notification Patterns & Standards

## Overview

This document establishes comprehensive patterns and standards for implementing user notifications across the YAAN platform. It serves as the definitive guide for developers to ensure consistency, accessibility, and analytics integration.

## Architecture

### Core Components

```
YAAN Notification System
├── Toast Manager (Primary)
│   ├── Success Notifications
│   ├── Error Notifications  
│   ├── Warning Notifications
│   └── Info Notifications
├── Modal Dialogs (Secondary)
│   ├── Confirmation Dialogs
│   ├── Form Dialogs
│   └── Complex Interactions
└── Analytics Integration
    ├── Amazon Pinpoint
    ├── Tracking Context
    └── Event Categories
```

## Implementation Standards

### 1. Toast Notifications

#### Success Notifications
**Use Case**: Positive feedback, completion confirmation
**Pattern**: `✅ [Action completed] [Optional details]`

```typescript
// Standard success pattern
toastManager.success('✅ Producto creado exitosamente', {
  trackingContext: {
    feature: 'product_creation',
    productId: newProduct.id,
    productType: 'circuit',
    category: 'content_creation'
  }
});

// Success with redirect
toastManager.success('🎯 Redirigiendo al sistema de pago...', {
  trackingContext: {
    feature: 'payment_redirect',
    reservationId,
    paymentMethod: 'stripe',
    category: 'payment_flow'
  }
});
```

#### Error Notifications
**Use Case**: Error feedback, validation failures
**Pattern**: `❌ [Error description] [Optional solution hint]`

```typescript
// Validation error
toastManager.error('❌ El nombre del producto es requerido', {
  trackingContext: {
    feature: 'product_creation',
    error: 'missing_required_field',
    field: 'name',
    category: 'validation_error'
  }
});

// System error
toastManager.error('❌ Error del servidor. Por favor intenta de nuevo.', {
  trackingContext: {
    feature: 'api_request',
    error: error.message,
    endpoint: '/api/products',
    category: 'system_error'
  }
});
```

#### Warning Notifications
**Use Case**: Cautionary information, limits reached
**Pattern**: `⚠️ [Warning message] [Suggested action]`

```typescript
toastManager.warning('⚠️ Has alcanzado el límite de productos gratis', {
  trackingContext: {
    feature: 'product_limits',
    currentCount: userProducts.length,
    limit: FREE_PRODUCT_LIMIT,
    category: 'usage_limit'
  }
});
```

#### Info Notifications
**Use Case**: General information, tips, updates
**Pattern**: `ℹ️ [Information] [Optional details]`

```typescript
toastManager.info('ℹ️ Los cambios se guardan automáticamente', {
  trackingContext: {
    feature: 'auto_save',
    context: 'product_editing',
    category: 'user_guidance'
  }
});
```

### 2. Modal Dialog Patterns

#### Confirmation Dialogs
**Use Case**: Destructive actions, irreversible operations

```typescript
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);

const ConfirmationModal = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            ¿Eliminar producto?
          </h3>
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer
          </p>
        </div>
      </div>
      
      <p className="text-gray-600 mb-6">
        El producto "<strong>{productName}</strong>" será eliminado permanentemente 
        junto con todas sus temporadas y precios asociados.
      </p>
      
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setShowConfirmModal(false)}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          disabled={isProcessing}
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmDelete}
          className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center">
              <LoadingSpinner className="mr-2" />
              Eliminando...
            </span>
          ) : (
            'Eliminar'
          )}
        </button>
      </div>
    </div>
  </div>
);
```

#### Form Dialogs
**Use Case**: Complex input, multi-step processes

```typescript
interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  title: string;
  initialData?: Partial<FormData>;
}

const FormDialog = ({ isOpen, onClose, onSubmit, title, initialData }: FormDialogProps) => {
  const [formData, setFormData] = useState(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors = validateForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toastManager.error('❌ Por favor corrige los errores del formulario', {
        trackingContext: {
          feature: 'form_validation',
          errors: Object.keys(newErrors),
          category: 'validation_error'
        }
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      toastManager.error(`❌ Error al guardar: ${error.message}`, {
        trackingContext: {
          feature: 'form_submission',
          error: error.message,
          category: 'system_error'
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields */}
          
          <div className="flex gap-3 justify-end pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

## Analytics Integration

### Tracking Context Standards

#### Required Fields
```typescript
interface BaseTrackingContext {
  feature: string;      // Feature identifier (required)
  category: string;     // Event category (required)
}
```

#### Extended Context Examples
```typescript
interface ContentTrackingContext extends BaseTrackingContext {
  feature: 'content_creation' | 'content_editing' | 'content_deletion';
  contentId?: string;
  contentType?: 'product' | 'moment' | 'comment';
  category: 'content_management';
}

interface ErrorTrackingContext extends BaseTrackingContext {
  error: string;        // Error message or code
  category: 'validation_error' | 'system_error' | 'authentication_error';
  context?: string;     // Additional error context
}

interface UserActionContext extends BaseTrackingContext {
  feature: 'social_interaction' | 'media_upload' | 'payment_flow';
  actionType?: string;  // Specific action taken
  userId?: string;      // User identifier
  category: string;
}
```

### Event Categories

| Category | Use Case | Examples |
|----------|----------|----------|
| `content_management` | Content CRUD operations | Create, edit, delete products/moments |
| `social_interaction` | User social actions | Like, share, comment, follow |
| `media_upload` | File upload operations | Image/video uploads, validation |
| `payment_flow` | Payment and booking | Reservations, payment processing |
| `authentication_error` | Auth-related issues | Login failures, token expiry |
| `validation_error` | Form validation | Required fields, format validation |
| `system_error` | Technical errors | API failures, network issues |
| `user_guidance` | Educational content | Tips, help messages, onboarding |
| `usage_limit` | Limit notifications | Quota reached, upgrade prompts |
| `testing_success` | Development/QA | Test executions, debugging |

## Accessibility Standards

### ARIA Labels and Roles
```typescript
// Toast notifications
<div
  role="alert"
  aria-live="polite"
  aria-describedby="toast-message"
  className="toast-container"
>
  <div id="toast-message">{message}</div>
</div>

// Modal dialogs
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">{title}</h2>
  <p id="modal-description">{description}</p>
</div>
```

### Keyboard Navigation
```typescript
// Modal dialog keyboard handling
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isProcessing) {
      onClose();
    }
  };

  if (isOpen) {
    document.addEventListener('keydown', handleKeyDown);
    // Focus management
    const firstFocusable = modalRef.current?.querySelector(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }
}, [isOpen, isProcessing, onClose]);
```

## Error Handling Patterns

### Graceful Degradation
```typescript
const handleAction = async () => {
  try {
    setIsLoading(true);
    const result = await apiCall();
    
    toastManager.success('✅ Operación completada exitosamente', {
      trackingContext: {
        feature: 'api_action',
        category: 'success'
      }
    });
  } catch (error) {
    // Specific error handling
    if (error.code === 'VALIDATION_ERROR') {
      toastManager.error(`❌ ${error.message}`, {
        trackingContext: {
          feature: 'api_action',
          error: error.code,
          details: error.details,
          category: 'validation_error'
        }
      });
    } else if (error.code === 'NETWORK_ERROR') {
      toastManager.error('❌ Error de conexión. Verifica tu internet.', {
        trackingContext: {
          feature: 'api_action',
          error: 'network_error',
          category: 'system_error'
        }
      });
    } else {
      // Generic error fallback
      toastManager.error('❌ Ocurrió un error inesperado. Intenta de nuevo.', {
        trackingContext: {
          feature: 'api_action',
          error: error.message || 'unknown_error',
          category: 'system_error'
        }
      });
    }
  } finally {
    setIsLoading(false);
  }
};
```

### Retry Mechanisms
```typescript
const handleRetryableAction = async (maxRetries = 3) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        toastManager.error('❌ Error después de múltiples intentos', {
          trackingContext: {
            feature: 'api_retry',
            error: error.message,
            attempts: attempt,
            category: 'system_error'
          }
        });
        throw error;
      }
      
      // Show retry notification
      toastManager.warning(`⚠️ Reintentando... (${attempt}/${maxRetries})`, {
        trackingContext: {
          feature: 'api_retry',
          attempt,
          maxRetries,
          category: 'retry_attempt'
        }
      });
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};
```

## Performance Considerations

### Toast Queue Management
```typescript
// Prevent notification spam
const TOAST_LIMIT = 5;
const TOAST_DURATION = 5000;

class ToastManager {
  private queue: Toast[] = [];
  
  show(toast: Toast) {
    // Prevent duplicates
    const duplicate = this.queue.find(t => 
      t.message === toast.message && t.type === toast.type
    );
    
    if (duplicate && Date.now() - duplicate.timestamp < 1000) {
      return; // Skip duplicate within 1 second
    }
    
    // Enforce limit
    if (this.queue.length >= TOAST_LIMIT) {
      this.queue.shift(); // Remove oldest
    }
    
    this.queue.push({
      ...toast,
      timestamp: Date.now(),
      id: generateId()
    });
  }
}
```

### Modal Performance
```typescript
// Lazy modal loading
const LazyModal = lazy(() => import('./ComplexModal'));

const Component = () => {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Open Modal
      </button>
      
      {showModal && (
        <Suspense fallback={<ModalSkeleton />}>
          <LazyModal onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </>
  );
};
```

## Testing Standards

### Unit Tests
```typescript
describe('ToastManager', () => {
  it('should show success notification with tracking', () => {
    const trackingSpy = jest.spyOn(analytics, 'track');
    
    toastManager.success('Test success', {
      trackingContext: {
        feature: 'test',
        category: 'success'
      }
    });
    
    expect(screen.getByText('Test success')).toBeInTheDocument();
    expect(trackingSpy).toHaveBeenCalledWith('notification_shown', {
      feature: 'test',
      category: 'success',
      type: 'success'
    });
  });
});
```

### Integration Tests
```typescript
describe('Confirmation Modal', () => {
  it('should handle delete confirmation flow', async () => {
    const mockDelete = jest.fn().mockResolvedValue({ success: true });
    
    render(<ComponentWithModal onDelete={mockDelete} />);
    
    // Open modal
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Confirm deletion
    fireEvent.click(screen.getByText('Confirm'));
    
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
      expect(screen.getByText(/deleted successfully/i)).toBeInTheDocument();
    });
  });
});
```

## Migration Checklist

### For Existing Components
- [ ] Identify all `alert()`, `confirm()`, `prompt()` usage
- [ ] Choose appropriate notification pattern
- [ ] Implement with proper tracking context
- [ ] Add accessibility attributes
- [ ] Test keyboard navigation
- [ ] Verify mobile responsiveness
- [ ] Update error handling
- [ ] Add unit/integration tests

### For New Components
- [ ] Use established notification patterns
- [ ] Include comprehensive tracking context
- [ ] Implement proper error handling
- [ ] Follow accessibility guidelines
- [ ] Add appropriate tests
- [ ] Document any custom patterns

## Conclusion

These notification patterns ensure consistency, accessibility, and comprehensive analytics across the YAAN platform. All developers should follow these standards when implementing user notifications, contributing to a cohesive and professional user experience.