import { NextRequest, NextResponse } from 'next/server';
import { mitPaymentService, type MITWebhookEvent } from '@/lib/services/mit-payment-service';
import { getGraphQLClientWithIdToken } from '@/lib/server/amplify-graphql-client';
import { logger } from '@/utils/logger';

/**
 * MIT Payment Gateway Webhook Handler - FASE 6
 *
 * Receives payment confirmation webhooks from MIT Payment Gateway
 * and updates reservation payment status accordingly.
 *
 * Security:
 * - Verifies HMAC SHA-256 signature
 * - Validates webhook payload structure
 * - Idempotent (handles duplicate events)
 *
 * Events handled:
 * - payment.completed - Payment successful
 * - payment.failed - Payment failed
 * - payment.cancelled - Payment cancelled by user
 *
 * Part of: Sprint 1+ - Sistema de Reservaciones
 */

// GraphQL mutation to update installment status
const updateInstallmentStatusMutation = /* GraphQL */ `
  mutation UpdateInstallmentStatus(
    $paymentPlanId: ID!
    $installmentNumber: Int!
    $status: String!
    $paidDate: AWSDateTime
    $transactionId: String
  ) {
    updatePaymentPlan(
      input: {
        id: $paymentPlanId
        installments: [
          {
            installment_number: $installmentNumber
            status: $status
            paid_date: $paidDate
            transaction_id: $transactionId
          }
        ]
      }
    ) {
      id
      installments {
        installment_number
        status
        paid_date
      }
    }
  }
`;

// GraphQL query to get payment plan
const getPaymentPlanById = /* GraphQL */ `
  query GetPaymentPlan($id: ID!) {
    getPaymentPlan(id: $id) {
      id
      reservation_id
      plan_type
      total_amount
      currency
      installments {
        installment_number
        amount
        due_date
        status
        paid_date
      }
    }
  }
`;

// Using MITWebhookEvent from mit-payment-service (imported above)

export async function POST(request: NextRequest) {
  logger.webhook('Webhook recibido de MIT Payment Gateway');

  try {
    // STEP 1: Get signature from headers
    const signature = request.headers.get('x-mit-signature');

    if (!signature) {
      logger.error('[MIT Webhook] Missing signature header');
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 401 }
      );
    }

    // STEP 2: Parse request body
    const body = await request.text();
    let payload: MITWebhookEvent;

    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('❌ [MIT Webhook] Invalid JSON payload');
      return NextResponse.json(
        { success: false, error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    console.log('📦 [MIT Webhook] Payload:', {
      eventType: payload.eventType,
      paymentId: payload.paymentId,
      amount: payload.amount,
      metadata: payload.metadata
    });

    // STEP 3: Verify signature
    const isValid = await mitPaymentService.verifyWebhookSignature(body, signature);

    if (!isValid) {
      console.error('❌ [MIT Webhook] Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ [MIT Webhook] Signature verified');

    // STEP 4: Validate required metadata
    if (!payload.metadata?.reservationId || !payload.metadata?.paymentPlanId) {
      console.error('❌ [MIT Webhook] Missing required metadata');
      return NextResponse.json(
        { success: false, error: 'Missing metadata' },
        { status: 400 }
      );
    }

    const { reservationId, paymentPlanId, installmentNumber } = payload.metadata;

    // STEP 5: Get GraphQL client (webhooks use system-level access, not user cookies)
    // Note: Webhooks don't have user context, so we use the client without auth
    // The webhook signature verification above provides the security
    const client = await getGraphQLClientWithIdToken().catch(() => {
      // If no auth available (expected for webhooks), we need a different approach
      // For now, we'll skip GraphQL updates and just log
      console.warn('⚠️ [MIT Webhook] No auth context for GraphQL, webhook received but not processed');
      return null;
    });

    if (!client) {
      console.error('❌ [MIT Webhook] Cannot process webhook without GraphQL client');
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    // STEP 6: Get payment plan to verify
    const paymentPlanResult = await client.graphql({
      query: getPaymentPlanById,
      variables: { id: paymentPlanId }
    }) as { data?: { getPaymentPlan?: any }; errors?: any[] };

    if (!paymentPlanResult.data?.getPaymentPlan) {
      console.error('❌ [MIT Webhook] Payment plan not found:', paymentPlanId);
      return NextResponse.json(
        { success: false, error: 'Payment plan not found' },
        { status: 404 }
      );
    }

    const paymentPlan = paymentPlanResult.data.getPaymentPlan;

    console.log('💰 [MIT Webhook] Payment plan found:', {
      id: paymentPlan.id,
      type: paymentPlan.plan_type,
      total: paymentPlan.total_amount
    });

    // STEP 7: Process webhook event
    const result = await mitPaymentService.processWebhookEvent(payload);

    if (!result.success) {
      console.error('❌ [MIT Webhook] Error processing webhook:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // STEP 8: Update installment status based on event
    let newStatus: string;
    let paidDate: string | undefined;

    switch (payload.eventType) {
      case 'payment.completed':
        newStatus = 'PAID';
        paidDate = new Date().toISOString();
        console.log('✅ [MIT Webhook] Payment completed, marking as PAID');
        break;

      case 'payment.failed':
        newStatus = 'FAILED';
        console.log('❌ [MIT Webhook] Payment failed');
        break;

      case 'payment.cancelled':
        newStatus = 'PENDING'; // Keep as pending, user can retry
        console.log('⚠️ [MIT Webhook] Payment cancelled, keeping as PENDING');
        break;

      default:
        console.warn('⚠️ [MIT Webhook] Unknown event type:', payload.eventType);
        return NextResponse.json(
          { success: true, message: 'Event acknowledged but not processed' },
          { status: 200 }
        );
    }

    // STEP 9: Determine which installment to update
    const targetInstallmentNumber = installmentNumber || 1; // Default to 1 for CONTADO

    // STEP 10: Update installment status in GraphQL
    try {
      const updateResult = await client.graphql({
        query: updateInstallmentStatusMutation,
        variables: {
          paymentPlanId,
          installmentNumber: targetInstallmentNumber,
          status: newStatus,
          paidDate,
          transactionId: payload.transactionId
        }
      }) as { data?: { updatePaymentPlan?: { id?: string } }; errors?: any[] };

      if (updateResult.errors && updateResult.errors.length > 0) {
        console.error('❌ [MIT Webhook] GraphQL error updating installment:', updateResult.errors[0].message);

        // If data was still updated despite error, consider it success
        if (updateResult.data?.updatePaymentPlan?.id) {
          console.log('✅ [MIT Webhook] Installment updated despite GraphQL warning');
        } else {
          return NextResponse.json(
            { success: false, error: updateResult.errors[0].message },
            { status: 500 }
          );
        }
      }

      console.log('✅ [MIT Webhook] Installment status updated:', {
        paymentPlanId,
        installmentNumber: targetInstallmentNumber,
        newStatus,
        paidDate
      });

      // STEP 11: TODO (FASE 6.1): Send notification to user
      // - Email confirmation
      // - In-app notification
      // - Update reservation status if all installments paid

      // STEP 12: Return success
      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        data: {
          reservationId,
          paymentPlanId,
          installmentNumber: targetInstallmentNumber,
          newStatus,
          paidDate
        }
      });

    } catch (error) {
      console.error('❌ [MIT Webhook] Error updating installment status:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [MIT Webhook] Unexpected error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'MIT Payment Webhook Handler',
    timestamp: new Date().toISOString()
  });
}
