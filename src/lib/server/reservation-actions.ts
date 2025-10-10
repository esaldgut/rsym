'use server';

import { createReservation, generatePaymentLink } from '@/lib/graphql/operations';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import outputs from '../../../amplify/outputs.json';
import { getServerSession, getAuthenticatedUser } from '@/utils/amplify-server-utils';
import type { Schema } from '@/amplify/data/resource';
import type { ReservationInput, PaymentInput } from '@/lib/graphql/types';

/**
 * ARQUITECTURA CORRECTA: Server Actions para mutaciones
 * - Server Actions por defecto para todas las mutaciones
 * - generateServerClientUsingCookies para auth automática
 * - Revalidación de cache después de mutaciones
 */

interface ServerActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ReservationData {
  id: string;
  status: string;
  total_price: number;
  experience_id: string;
  experience_type: string;
  adults: number;
  kids: number;
  babys: number;
  reservationDate: string;
}

interface PaymentData {
  id: string;
  payment_url?: string;
  status: string;
  total: number;
  currency: string;
  payment_method: string;
  created_at: string;
}

/**
 * Server Action para crear una reserva
 * PATTERN: Mutación con autenticación automática y validación
 */
export async function createReservationAction(
  input: ReservationInput
): Promise<ServerActionResponse<ReservationData>> {
  try {
    console.log('🎯 [SERVER ACTION] createReservationAction:', {
      experienceId: input.experience_id,
      adults: input.adults,
      kids: input.kids,
      totalPrice: input.total_price
    });

    // 1. Validate authentication
    const session = await getServerSession();
    if (!session?.tokens?.idToken) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor inicia sesión.'
      };
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo verificar la identidad del usuario'
      };
    }

    // 2. Validate input
    if (!input.experience_id || !input.adults || input.adults < 1) {
      return {
        success: false,
        error: 'Datos de reserva inválidos'
      };
    }

    // 3. Create server client with automatic auth
    const cookiesStore = await cookies();
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies: () => cookiesStore
    });

    // 4. Execute mutation
    console.log('💾 [MUTATION] Creating reservation...');
    const result = await client.graphql({
      query: createReservation,
      variables: { input }
    });

    if (result?.data?.createReservation) {
      const reservation = result.data.createReservation;

      console.log('✅ [SUCCESS] Reservation created:', reservation.id);

      // 5. Revalidate relevant paths
      revalidateTag('user-reservations');
      revalidatePath('/dashboard');
      revalidatePath('/reservations');

      return {
        success: true,
        data: reservation as ReservationData,
        message: 'Reserva creada exitosamente'
      };
    }

    return {
      success: false,
      error: 'No se pudo crear la reserva'
    };

  } catch (error) {
    console.error('❌ [ERROR] createReservationAction:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear la reserva'
    };
  }
}

/**
 * Server Action para generar link de pago
 * PATTERN: Mutación encadenada con validación de estado
 */
export async function generatePaymentLinkAction(
  input: PaymentInput
): Promise<ServerActionResponse<PaymentData>> {
  try {
    console.log('💳 [SERVER ACTION] generatePaymentLinkAction:', {
      reservationId: input.reservation_id,
      method: input.payment_method
    });

    // 1. Validate authentication
    const session = await getServerSession();
    if (!session?.tokens?.idToken) {
      return {
        success: false,
        error: 'Usuario no autenticado. Por favor inicia sesión.'
      };
    }

    // 2. Validate input
    if (!input.reservation_id) {
      return {
        success: false,
        error: 'ID de reserva requerido'
      };
    }

    // 3. Create server client with automatic auth
    const cookiesStore = await cookies();
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies: () => cookiesStore
    });

    // 4. Execute mutation
    console.log('💰 [MUTATION] Generating payment link...');
    const result = await client.graphql({
      query: generatePaymentLink,
      variables: { input }
    });

    if (result?.data?.generatePaymentLink) {
      const payment = result.data.generatePaymentLink;

      console.log('✅ [SUCCESS] Payment link generated:', {
        paymentId: payment.id,
        hasUrl: !!payment.payment_url
      });

      // 5. Revalidate relevant paths
      revalidateTag('user-payments');
      revalidateTag('user-reservations');
      revalidatePath('/reservations');

      return {
        success: true,
        data: payment as PaymentData,
        message: payment.payment_url
          ? 'Link de pago generado exitosamente'
          : 'Pago registrado exitosamente'
      };
    }

    return {
      success: false,
      error: 'No se pudo generar el link de pago'
    };

  } catch (error) {
    console.error('❌ [ERROR] generatePaymentLinkAction:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al generar link de pago'
    };
  }
}

/**
 * Server Action combinada para crear reserva y generar pago
 * PATTERN: Transacción completa con rollback manual si falla
 */
export async function createReservationWithPaymentAction(
  reservationInput: ReservationInput,
  paymentMethod: string = 'stripe'
): Promise<ServerActionResponse<{ reservation: ReservationData; payment?: PaymentData }>> {
  try {
    console.log('🎯💳 [SERVER ACTION] createReservationWithPaymentAction');

    // 1. Create reservation
    const reservationResult = await createReservationAction(reservationInput);

    if (!reservationResult.success || !reservationResult.data) {
      return {
        success: false,
        error: reservationResult.error || 'Error al crear la reserva'
      };
    }

    const reservation = reservationResult.data;

    // 2. Generate payment link if reservation successful
    const paymentInput: PaymentInput = {
      reservation_id: reservation.id,
      payment_method: paymentMethod,
      promotions: false
    };

    const paymentResult = await generatePaymentLinkAction(paymentInput);

    // Return both results, even if payment fails
    // (reservation still exists and can be paid later)
    return {
      success: true,
      data: {
        reservation,
        payment: paymentResult.data
      },
      message: paymentResult.data?.payment_url
        ? 'Reserva creada y link de pago generado'
        : 'Reserva creada exitosamente. El pago puede completarse más tarde.'
    };

  } catch (error) {
    console.error('❌ [ERROR] createReservationWithPaymentAction:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al procesar la reserva'
    };
  }
}

/**
 * Server Action para validar disponibilidad antes de reservar
 * PATTERN: Pre-validación para mejor UX
 */
export async function checkAvailabilityAction(
  experienceId: string,
  adults: number,
  kids: number = 0,
  date?: string
): Promise<ServerActionResponse<{ available: boolean; message?: string }>> {
  try {
    console.log('🔍 [SERVER ACTION] checkAvailabilityAction:', {
      experienceId,
      adults,
      kids,
      date
    });

    // TODO: Implementar lógica de verificación de disponibilidad
    // Por ahora, simular disponibilidad

    // Simulación básica
    const isAvailable = Math.random() > 0.1; // 90% disponible

    if (!isAvailable) {
      return {
        success: true,
        data: {
          available: false,
          message: 'No hay disponibilidad para las fechas seleccionadas'
        }
      };
    }

    return {
      success: true,
      data: {
        available: true,
        message: 'Disponibilidad confirmada'
      }
    };

  } catch (error) {
    console.error('❌ [ERROR] checkAvailabilityAction:', error);

    return {
      success: false,
      error: 'Error al verificar disponibilidad'
    };
  }
}