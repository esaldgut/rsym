/**
 * Webhook Server Actions
 *
 * Server actions for handling webhook events from external services
 * (MIT Payment Gateway, etc.)
 */

'use server';

import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import config from '../../../amplify/outputs.json';

/**
 * Payment Webhook Event Input
 */
interface PaymentWebhookInput {
  reservationId: string;
  paymentId: string;
  installmentNumber?: number;
  amount: number;
  currency: string;
  event: 'payment.completed' | 'payment.failed' | 'payment.cancelled';
  paidAt?: string;
  failedReason?: string;
}

/**
 * Server Action Response
 */
interface ServerActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Update Reservation Status Mutation
 *
 * GraphQL mutation to update reservation status
 */
const updateReservationStatus = /* GraphQL */ `
  mutation UpdateReservationStatus($input: UpdateReservationInput!) {
    updateReservation(input: $input) {
      id
      status
      updated_at
    }
  }
`;

/**
 * Update Payment Plan Installment Mutation
 *
 * GraphQL mutation to update installment status
 */
const updatePaymentInstallment = /* GraphQL */ `
  mutation UpdatePaymentInstallment($input: UpdatePaymentInstallmentInput!) {
    updatePaymentInstallment(input: $input) {
      id
      installment_number
      status
      paid_date
      amount
      updated_at
    }
  }
`;

/**
 * Get Payment Plan by Reservation Query
 */
const getPaymentPlanByReservation = /* GraphQL */ `
  query GetPaymentPlanByReservation($reservation_id: ID!) {
    getPaymentPlanByReservation(reservation_id: $reservation_id) {
      id
      reservation_id
      plan_type
      total_amount
      currency
      installments {
        id
        installment_number
        amount
        due_date
        status
        paid_date
      }
    }
  }
`;

/**
 * Confirm Payment Webhook Action
 *
 * Handles payment confirmation/failure/cancellation from MIT webhook
 *
 * @param input - Payment webhook event data
 * @returns Result with updated reservation status
 */
export async function confirmPaymentWebhookAction(
  input: PaymentWebhookInput
): Promise<ServerActionResponse<{ reservationId: string; status: string }>> {
  console.log('[confirmPaymentWebhookAction] 🔔 Processing webhook event:', {
    event: input.event,
    reservationId: input.reservationId,
    installmentNumber: input.installmentNumber
  });

  try {
    // STEP 1: Create GraphQL client (no authentication required for webhooks)
    const client = generateServerClientUsingCookies({
      config,
      cookies
    });

    // STEP 2: Determine new reservation status based on event
    let newStatus: string;

    switch (input.event) {
      case 'payment.completed':
        // If this is the first installment or CONTADO, mark as PROCESSED
        // Otherwise, keep as MIT_PAYMENT_PENDING until all installments paid
        if (!input.installmentNumber || input.installmentNumber === 1) {
          newStatus = 'PROCESSED';
          console.log('[confirmPaymentWebhookAction] ✅ First payment completed, marking as PROCESSED');
        } else {
          // Check if all installments are paid
          const paymentPlanResult = await client.graphql({
            query: getPaymentPlanByReservation,
            variables: { reservation_id: input.reservationId }
          });

          const paymentPlan = paymentPlanResult.data?.getPaymentPlanByReservation;
          if (!paymentPlan) {
            console.error('[confirmPaymentWebhookAction] ❌ Payment plan not found');
            return {
              success: false,
              error: 'Payment plan not found'
            };
          }

          // Count paid installments (including this one)
          const paidCount = (paymentPlan.installments || []).filter(
            i => i.status === 'paid' || i.installment_number === input.installmentNumber
          ).length;

          const totalInstallments = paymentPlan.installments?.length || 0;

          if (paidCount >= totalInstallments) {
            newStatus = 'PROCESSED';
            console.log('[confirmPaymentWebhookAction] ✅ All installments paid, marking as PROCESSED');
          } else {
            newStatus = 'MIT_PAYMENT_PENDING';
            console.log(`[confirmPaymentWebhookAction] 🔄 ${paidCount}/${totalInstallments} installments paid, keeping MIT_PAYMENT_PENDING`);
          }
        }
        break;

      case 'payment.failed':
        newStatus = 'MIT_PAYMENT_PENDING';
        console.log('[confirmPaymentWebhookAction] ❌ Payment failed, keeping MIT_PAYMENT_PENDING');
        break;

      case 'payment.cancelled':
        newStatus = 'AWAITING_MANUAL_PAYMENT';
        console.log('[confirmPaymentWebhookAction] ⚠️ Payment cancelled, marking as AWAITING_MANUAL_PAYMENT');
        break;

      default:
        return {
          success: false,
          error: `Unknown event type: ${input.event}`
        };
    }

    // STEP 3: Update installment status if installment_number is provided
    if (input.installmentNumber) {
      console.log('[confirmPaymentWebhookAction] 📝 Updating installment status...');

      const installmentStatus = input.event === 'payment.completed' ? 'paid' : 'pending';

      try {
        await client.graphql({
          query: updatePaymentInstallment,
          variables: {
            input: {
              reservation_id: input.reservationId,
              installment_number: input.installmentNumber,
              status: installmentStatus,
              paid_date: input.paidAt || (input.event === 'payment.completed' ? new Date().toISOString() : undefined)
            }
          }
        });

        console.log('[confirmPaymentWebhookAction] ✅ Installment updated successfully');
      } catch (installmentError) {
        console.error('[confirmPaymentWebhookAction] ⚠️ Error updating installment:', installmentError);
        // Continue with reservation update even if installment update fails
      }
    }

    // STEP 4: Update reservation status
    console.log('[confirmPaymentWebhookAction] 📝 Updating reservation status to:', newStatus);

    const updateResult = await client.graphql({
      query: updateReservationStatus,
      variables: {
        input: {
          id: input.reservationId,
          status: newStatus
        }
      }
    });

    // STEP 5: Check for errors
    if (updateResult.errors && updateResult.errors.length > 0) {
      console.error('[confirmPaymentWebhookAction] ❌ GraphQL errors:', updateResult.errors);

      // Partial success if we have data despite errors
      if (updateResult.data?.updateReservation?.id) {
        console.log('[confirmPaymentWebhookAction] ⚠️ Partial success with warnings');
        return {
          success: true,
          data: {
            reservationId: updateResult.data.updateReservation.id,
            status: updateResult.data.updateReservation.status
          }
        };
      }

      return {
        success: false,
        error: updateResult.errors[0].message
      };
    }

    // STEP 6: Return success
    const updatedReservation = updateResult.data?.updateReservation;
    if (!updatedReservation) {
      return {
        success: false,
        error: 'No data returned from mutation'
      };
    }

    console.log('[confirmPaymentWebhookAction] ✅ Reservation updated successfully:', {
      reservationId: updatedReservation.id,
      status: updatedReservation.status
    });

    return {
      success: true,
      data: {
        reservationId: updatedReservation.id,
        status: updatedReservation.status
      }
    };

  } catch (error) {
    console.error('[confirmPaymentWebhookAction] ❌ Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage
    };
  }
}
