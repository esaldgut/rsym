'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { pinpointService, PinpointEventAttributes } from '@/lib/services/pinpoint-service';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  // Nuevas props para Pinpoint
  trackingContext?: PinpointEventAttributes;
  enableTracking?: boolean;
}

const icons = {
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
};

const styles = {
  success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
  error: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
  warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
  info: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
};

export function Toast({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  trackingContext,
  enableTracking = true 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Registrar evento en Pinpoint si está habilitado
    if (enableTracking && pinpointService.isInitialized()) {
      pinpointService.recordToastEvent(message, type, duration, trackingContext);
    }
    
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, message, type, trackingContext, enableTracking]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div 
      className={`
        fixed top-4 right-4 z-[9999] transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div 
        className={`
          ${styles[type]} 
          rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3 min-w-[320px] max-w-md
          backdrop-blur-sm border border-white/20
        `}
      >
        <div className="flex-shrink-0 animate-pulse">
          {icons[type]}
        </div>
        <p className="flex-1 font-medium text-sm">{message}</p>
        <button
          onClick={handleClose}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Cerrar notificación"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}

// Toast Manager mejorado con soporte para Pinpoint
interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  trackingContext?: PinpointEventAttributes;
  enableTracking?: boolean;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  trackingContext?: PinpointEventAttributes;
  enableTracking?: boolean;
}

class EnhancedToastManager {
  private listeners: ((toasts: ToastData[]) => void)[] = [];
  private toasts: ToastData[] = [];
  private maxToasts = 5; // Límite máximo de toasts simultáneos
  
  subscribe(listener: (toasts: ToastData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.toasts));
  }

  /**
   * Muestra un toast con soporte para tracking
   */
  show(
    message: string, 
    typeOrOptions?: ToastType | ToastOptions, 
    duration?: number
  ) {
    // Normalizar parámetros
    let options: ToastOptions = {};
    
    if (typeof typeOrOptions === 'string') {
      options = {
        type: typeOrOptions,
        duration: duration || 3000,
        enableTracking: true
      };
    } else {
      options = {
        type: 'info',
        duration: 3000,
        enableTracking: true,
        ...typeOrOptions
      };
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastData = { 
      id, 
      message, 
      type: options.type || 'info',
      duration: options.duration,
      trackingContext: options.trackingContext,
      enableTracking: options.enableTracking
    };
    
    // Limitar cantidad de toasts
    if (this.toasts.length >= this.maxToasts) {
      this.toasts = this.toasts.slice(1);
    }
    
    this.toasts = [...this.toasts, toast];
    this.notify();
    
    return id;
  }
  
  /**
   * Muestra toast de éxito
   */
  success(message: string, options?: Omit<ToastOptions, 'type'>) {
    return this.show(message, { ...options, type: 'success' });
  }
  
  /**
   * Muestra toast de error
   */
  error(message: string, options?: Omit<ToastOptions, 'type'>) {
    return this.show(message, { ...options, type: 'error' });
  }
  
  /**
   * Muestra toast de advertencia
   */
  warning(message: string, options?: Omit<ToastOptions, 'type'>) {
    return this.show(message, { ...options, type: 'warning' });
  }
  
  /**
   * Muestra toast informativo
   */
  info(message: string, options?: Omit<ToastOptions, 'type'>) {
    return this.show(message, { ...options, type: 'info' });
  }
  
  /**
   * Muestra toast para operaciones de productos
   */
  productAction(
    message: string, 
    type: ToastType, 
    productData?: {
      productId?: string;
      productType?: 'circuit' | 'package';
      productName?: string;
    }
  ) {
    return this.show(message, {
      type,
      trackingContext: {
        category: 'product_management',
        ...productData
      }
    });
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }
  
  /**
   * Limpia todos los toasts
   */
  clear() {
    this.toasts = [];
    this.notify();
  }
}

// Exportar singleton mejorado
export const toastManager = new EnhancedToastManager();

// Hook para usar el toast manager
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return {
    toasts,
    showToast: toastManager.show.bind(toastManager),
    success: toastManager.success.bind(toastManager),
    error: toastManager.error.bind(toastManager),
    warning: toastManager.warning.bind(toastManager),
    info: toastManager.info.bind(toastManager),
    productAction: toastManager.productAction.bind(toastManager),
    removeToast: toastManager.remove.bind(toastManager),
    clearToasts: toastManager.clear.bind(toastManager)
  };
}

// Componente para renderizar todos los toasts
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: `${(index + 1) * 80}px`,
            right: '16px',
            zIndex: 9999 - index
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
            trackingContext={toast.trackingContext}
            enableTracking={toast.enableTracking}
          />
        </div>
      ))}
    </>
  );
}

// Re-exportar el manager original para compatibilidad
export { toastManager as default } from './Toast';