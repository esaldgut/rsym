/**
 * MIT Payment Gateway Webhook Handler
 *
 * Handles payment status updates from MIT Payment Gateway.
 * Implements HMAC SHA-256 verification for security.
 *
 * Events supported:
 * - payment.completed: Payment successfully processed
 * - payment.failed: Payment failed
 * - payment.cancelled: Payment cancelled by user
 *
 * @see https://docs.mit.com.mx/webhooks (MIT webhook documentation)
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { confirmPaymentWebhookAction } from '@/lib/server/webhook-actions';

// MIT webhook secret (should be in environment variables)
const MIT_WEBHOOK_SECRET = process.env.MIT_WEBHOOK_SECRET || '';

/**
 * Verify HMAC SHA-256 signature from MIT webhook
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Webhook MIT] ❌ Error verifying signature:', error);
    return false;
  }
}

/**
 * MIT Webhook Event Types
 */
type MITWebhookEvent =
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.cancelled';

/**
 * MIT Webhook Payload Structure
 */
interface MITWebhookPayload {
  event: MITWebhookEvent;
  data: {
    payment_id: string;
    reservation_id: string;
    installment_number?: number;
    amount: number;
    currency: string;
    status: string;
    paid_at?: string;
    failed_reason?: string;
    metadata?: Record<string, unknown>;
  };
  timestamp: string;
}

/**
 * POST /api/webhooks/mit
 *
 * Handles webhook events from MIT Payment Gateway
 */
export async function POST(request: NextRequest) {
  console.log('[Webhook MIT] 📨 Webhook recibido');

  try {
    // STEP 1: Verify webhook signature
    const signature = request.headers.get('x-mit-signature');
    if (!signature) {
      console.error('[Webhook MIT] ❌ Missing signature header');
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 401 }
      );
    }

    // STEP 2: Get raw payload for signature verification
    const rawPayload = await request.text();

    if (!MIT_WEBHOOK_SECRET) {
      console.error('[Webhook MIT] ⚠️ MIT_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // STEP 3: Verify signature
    const isValid = verifyWebhookSignature(rawPayload, signature, MIT_WEBHOOK_SECRET);
    if (!isValid) {
      console.error('[Webhook MIT] ❌ Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('[Webhook MIT] ✅ Signature verified');

    // STEP 4: Parse payload
    const payload: MITWebhookPayload = JSON.parse(rawPayload);
    console.log('[Webhook MIT] 📦 Event:', payload.event, 'Reservation:', payload.data.reservation_id);

    // STEP 5: Handle event based on type
    switch (payload.event) {
      case 'payment.completed':
        console.log('[Webhook MIT] ✅ Payment completed, confirming reservation...');

        const confirmResult = await confirmPaymentWebhookAction({
          reservationId: payload.data.reservation_id,
          paymentId: payload.data.payment_id,
          installmentNumber: payload.data.installment_number,
          amount: payload.data.amount,
          currency: payload.data.currency,
          paidAt: payload.data.paid_at || new Date().toISOString(),
          event: 'payment.completed'
        });

        if (!confirmResult.success) {
          console.error('[Webhook MIT] ❌ Error confirming payment:', confirmResult.error);
          return NextResponse.json(
            { success: false, error: confirmResult.error },
            { status: 500 }
          );
        }

        console.log('[Webhook MIT] ✅ Payment confirmed successfully');
        return NextResponse.json({
          success: true,
          message: 'Payment confirmed',
          reservationId: payload.data.reservation_id
        });

      case 'payment.failed':
        console.log('[Webhook MIT] ❌ Payment failed, updating reservation...');

        const failResult = await confirmPaymentWebhookAction({
          reservationId: payload.data.reservation_id,
          paymentId: payload.data.payment_id,
          installmentNumber: payload.data.installment_number,
          amount: payload.data.amount,
          currency: payload.data.currency,
          event: 'payment.failed',
          failedReason: payload.data.failed_reason
        });

        if (!failResult.success) {
          console.error('[Webhook MIT] ❌ Error updating failed payment:', failResult.error);
          return NextResponse.json(
            { success: false, error: failResult.error },
            { status: 500 }
          );
        }

        console.log('[Webhook MIT] ✅ Payment failure recorded');
        return NextResponse.json({
          success: true,
          message: 'Payment failure recorded',
          reservationId: payload.data.reservation_id
        });

      case 'payment.cancelled':
        console.log('[Webhook MIT] ⚠️ Payment cancelled, updating reservation...');

        const cancelResult = await confirmPaymentWebhookAction({
          reservationId: payload.data.reservation_id,
          paymentId: payload.data.payment_id,
          installmentNumber: payload.data.installment_number,
          amount: payload.data.amount,
          currency: payload.data.currency,
          event: 'payment.cancelled'
        });

        if (!cancelResult.success) {
          console.error('[Webhook MIT] ❌ Error recording cancelled payment:', cancelResult.error);
          return NextResponse.json(
            { success: false, error: cancelResult.error },
            { status: 500 }
          );
        }

        console.log('[Webhook MIT] ✅ Payment cancellation recorded');
        return NextResponse.json({
          success: true,
          message: 'Payment cancellation recorded',
          reservationId: payload.data.reservation_id
        });

      default:
        console.warn('[Webhook MIT] ⚠️ Unknown event type:', payload.event);
        return NextResponse.json(
          { success: false, error: 'Unknown event type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[Webhook MIT] ❌ Error processing webhook:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/mit
 *
 * Returns webhook status (for health checks)
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'MIT Webhook endpoint is active',
    configured: !!MIT_WEBHOOK_SECRET
  });
}
