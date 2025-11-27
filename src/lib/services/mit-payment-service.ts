/**
 * MIT Payment Service
 *
 * Servicio para integración con MIT Payment Gateway
 * API Base: https://sandboxpol.mit.com.mx
 *
 * Soporta dos tipos de pago:
 * 1. CONTADO - Pago único con descuento
 * 2. PLAZOS - Pagos en parcialidades (3, 6, 9, 12 meses)
 */

/**
 * MIT Payment Request - Datos requeridos para crear pago
 */
export interface MITPaymentRequest {
  // Información de la reservación
  reservationId: string;
  paymentPlanId: string;

  // Tipo de pago
  paymentType: 'CONTADO' | 'PLAZOS';

  // Montos
  amount: number;           // Monto total en centavos (e.g., 100000 = $1,000.00 MXN)
  currency: string;         // 'MXN', 'USD'

  // Plan de pagos (solo para PLAZOS)
  installments?: number;    // 3, 6, 9, 12 meses
  installmentAmount?: number; // Monto por parcialidad en centavos

  // Información del cliente
  customer: {
    email: string;
    name: string;
    phone?: string;
  };

  // Metadata adicional
  metadata?: {
    productId?: string;
    productName?: string;
    adults?: number;
    kids?: number;
    reservationDate?: string;
  };
}

/**
 * MIT Payment Response - Respuesta de MIT API
 */
export interface MITPaymentResponse {
  success: boolean;
  paymentId?: string;           // ID del pago en MIT
  checkoutUrl?: string;         // URL para redirigir al cliente
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  error?: string;
  errorCode?: string;

  // Información adicional del pago
  paymentData?: {
    transactionId?: string;
    amount: number;
    currency: string;
    paymentType: 'CONTADO' | 'PLAZOS';
    installments?: number;
    createdAt: string;
    expiresAt?: string;       // Fecha de expiración del checkout
  };
}

/**
 * MIT Payment Status Response - Respuesta de consulta de estado
 */
export interface MITPaymentStatusResponse {
  success: boolean;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentId: string;
  transactionId?: string;
  amount: number;
  currency: string;
  paidAt?: string;
  error?: string;
}

/**
 * MIT Webhook Event - Evento recibido por webhook
 */
export interface MITWebhookEvent {
  eventType: 'payment.completed' | 'payment.failed' | 'payment.cancelled';
  paymentId: string;
  transactionId: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: number;
  currency: string;
  timestamp: string;
  metadata?: Record<string, string | number>;
}

class MITPaymentService {
  private apiUrl: string;
  private apiKey: string;
  private webhookSecret: string;
  private isEnabled: boolean;

  constructor() {
    // Configuración desde environment variables
    this.apiUrl = process.env.MIT_API_URL || 'https://sandboxpol.mit.com.mx/api/v1';
    this.apiKey = process.env.MIT_API_KEY || '';
    this.webhookSecret = process.env.MIT_WEBHOOK_SECRET || '';
    this.isEnabled = !!this.apiKey;

    if (!this.isEnabled && process.env.NODE_ENV !== 'development') {
      console.warn('⚠️ MIT Payment Service: API Key no configurada');
    }
  }

  /**
   * Crear pago en MIT (CONTADO o PLAZOS)
   */
  async createPayment(request: MITPaymentRequest): Promise<MITPaymentResponse> {
    if (!this.isEnabled) {
      return {
        success: false,
        error: 'MIT Payment Service no está configurado',
        errorCode: 'SERVICE_NOT_CONFIGURED'
      };
    }

    try {
      console.log('[MIT Payment] 💳 Creando pago:', {
        type: request.paymentType,
        amount: request.amount / 100,
        currency: request.currency,
        reservationId: request.reservationId
      });

      // Validar request
      const validation = this.validatePaymentRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          errorCode: 'INVALID_REQUEST'
        };
      }

      // Preparar payload según tipo de pago
      const payload = this.preparePaymentPayload(request);

      // Llamar MIT API
      const response = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-MIT-Version': '2024-01'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[MIT Payment] ❌ Error en MIT API:', {
          status: response.status,
          error: errorData
        });

        return {
          success: false,
          error: errorData.message || `MIT API error: ${response.status}`,
          errorCode: errorData.code || 'MIT_API_ERROR'
        };
      }

      const data = await response.json();

      console.log('[MIT Payment] ✅ Pago creado exitosamente:', {
        paymentId: data.id,
        checkoutUrl: data.checkout_url
      });

      return {
        success: true,
        paymentId: data.id,
        checkoutUrl: data.checkout_url,
        status: 'PENDING',
        paymentData: {
          transactionId: data.transaction_id,
          amount: request.amount,
          currency: request.currency,
          paymentType: request.paymentType,
          installments: request.installments,
          createdAt: new Date().toISOString(),
          expiresAt: data.expires_at
        }
      };

    } catch (error) {
      console.error('[MIT Payment] ❌ Error inesperado:', error);

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      return {
        success: false,
        error: errorMessage,
        errorCode: 'UNEXPECTED_ERROR'
      };
    }
  }

  /**
   * Consultar estado de pago
   */
  async getPaymentStatus(paymentId: string): Promise<MITPaymentStatusResponse> {
    if (!this.isEnabled) {
      return {
        success: false,
        status: 'FAILED',
        paymentId,
        amount: 0,
        currency: 'MXN',
        error: 'MIT Payment Service no está configurado'
      };
    }

    try {
      console.log('[MIT Payment] 🔍 Consultando estado de pago:', paymentId);

      const response = await fetch(`${this.apiUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-MIT-Version': '2024-01'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          status: 'FAILED',
          paymentId,
          amount: 0,
          currency: 'MXN',
          error: errorData.message || `MIT API error: ${response.status}`
        };
      }

      const data = await response.json();

      return {
        success: true,
        status: this.mapMITStatus(data.status),
        paymentId: data.id,
        transactionId: data.transaction_id,
        amount: data.amount,
        currency: data.currency,
        paidAt: data.paid_at
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      return {
        success: false,
        status: 'FAILED',
        paymentId,
        amount: 0,
        currency: 'MXN',
        error: errorMessage
      };
    }
  }

  /**
   * Cancelar pago
   */
  async cancelPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isEnabled) {
      return {
        success: false,
        error: 'MIT Payment Service no está configurado'
      };
    }

    try {
      console.log('[MIT Payment] 🚫 Cancelando pago:', paymentId);

      const response = await fetch(`${this.apiUrl}/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-MIT-Version': '2024-01'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `MIT API error: ${response.status}`
        };
      }

      console.log('[MIT Payment] ✅ Pago cancelado exitosamente');

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Verificar firma de webhook
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Implementar verificación HMAC SHA-256
      // La implementación específica depende de cómo MIT firma los webhooks

      // Por ahora, retornar true en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('[MIT Payment] ⚠️ Webhook signature verification skipped (development)');
        return true;
      }

      // TODO: Implementar verificación real con crypto
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      return signature === expectedSignature;

    } catch (error) {
      console.error('[MIT Payment] ❌ Error verificando webhook signature:', error);
      return false;
    }
  }

  /**
   * Procesar evento de webhook
   */
  async processWebhookEvent(event: MITWebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[MIT Payment] 📨 Procesando webhook event:', {
        type: event.eventType,
        paymentId: event.paymentId,
        status: event.status
      });

      // TODO: Actualizar estado de payment plan en base de datos
      // Esto se implementará cuando conectemos con el backend

      switch (event.eventType) {
        case 'payment.completed':
          console.log('[MIT Payment] ✅ Pago completado:', event.paymentId);
          // Actualizar payment plan status a COMPLETED
          break;

        case 'payment.failed':
          console.log('[MIT Payment] ❌ Pago fallido:', event.paymentId);
          // Actualizar payment plan status a FAILED
          break;

        case 'payment.cancelled':
          console.log('[MIT Payment] 🚫 Pago cancelado:', event.paymentId);
          // Actualizar payment plan status a CANCELLED
          break;
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[MIT Payment] ❌ Error procesando webhook:', error);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Helpers privados
   */

  private validatePaymentRequest(request: MITPaymentRequest): { valid: boolean; error?: string } {
    // Validar campos requeridos
    if (!request.reservationId) {
      return { valid: false, error: 'reservationId es requerido' };
    }

    if (!request.paymentPlanId) {
      return { valid: false, error: 'paymentPlanId es requerido' };
    }

    if (!request.amount || request.amount <= 0) {
      return { valid: false, error: 'amount debe ser mayor a 0' };
    }

    if (!request.currency) {
      return { valid: false, error: 'currency es requerido' };
    }

    if (!request.customer || !request.customer.email || !request.customer.name) {
      return { valid: false, error: 'customer.email y customer.name son requeridos' };
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.customer.email)) {
      return { valid: false, error: 'customer.email no es válido' };
    }

    // Validar tipo de pago
    if (request.paymentType !== 'CONTADO' && request.paymentType !== 'PLAZOS') {
      return { valid: false, error: 'paymentType debe ser CONTADO o PLAZOS' };
    }

    // Validar parcialidades (solo para PLAZOS)
    if (request.paymentType === 'PLAZOS') {
      if (!request.installments || ![3, 6, 9, 12].includes(request.installments)) {
        return { valid: false, error: 'installments debe ser 3, 6, 9 o 12 para PLAZOS' };
      }

      if (!request.installmentAmount || request.installmentAmount <= 0) {
        return { valid: false, error: 'installmentAmount es requerido para PLAZOS' };
      }
    }

    return { valid: true };
  }

  private preparePaymentPayload(request: MITPaymentRequest): Record<string, unknown> {
    const basePayload = {
      amount: request.amount,
      currency: request.currency,
      customer: {
        email: request.customer.email,
        name: request.customer.name,
        phone: request.customer.phone
      },
      metadata: {
        reservation_id: request.reservationId,
        payment_plan_id: request.paymentPlanId,
        ...request.metadata
      },
      // URLs de retorno (configurar según environment)
      success_url: `${this.getBaseUrl()}/marketplace/booking/success`,
      cancel_url: `${this.getBaseUrl()}/marketplace/booking/cancel`,
      webhook_url: `${this.getBaseUrl()}/api/webhooks/mit`
    };

    // Agregar información específica según tipo de pago
    if (request.paymentType === 'CONTADO') {
      return {
        ...basePayload,
        payment_method: 'single',
        description: 'Pago de contado con descuento'
      };
    } else {
      return {
        ...basePayload,
        payment_method: 'installments',
        installments: request.installments,
        installment_amount: request.installmentAmount,
        description: `Pago en ${request.installments} parcialidades`
      };
    }
  }

  private mapMITStatus(mitStatus: string): 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
    const statusMap: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'> = {
      'pending': 'PENDING',
      'processing': 'PENDING',
      'succeeded': 'COMPLETED',
      'completed': 'COMPLETED',
      'failed': 'FAILED',
      'cancelled': 'CANCELLED',
      'canceled': 'CANCELLED'
    };

    return statusMap[mitStatus.toLowerCase()] || 'PENDING';
  }

  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    return process.env.NEXT_PUBLIC_BASE_URL || 'https://yaan.com.mx';
  }

  /**
   * Control methods
   */

  isConfigured(): boolean {
    return this.isEnabled;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }
}

// Singleton instance
export const mitPaymentService = new MITPaymentService();

// Export para uso en server actions
export default mitPaymentService;
