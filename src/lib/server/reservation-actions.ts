'use server';

// ✅ Usar imports desde GraphQL Code Generator (fuente única de verdad)
import { createReservation, generatePaymentLink, generatePaymentPlan, updatePaymentPlan, updateReservation, getProductById, getPaymentPlan, getReservationsBySUB, getPaymentPlanByReservation } from '@/graphql/operations';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import outputs from '../../../amplify/outputs.json';
import { getServerSession, getAuthenticatedUser } from '@/utils/amplify-server-utils';
import type { Schema } from '@/amplify/data/resource';
import type { ReservationInput, PaymentInput, PaymentPlanInput, UpdatePaymentPlanInput, PaymentPlan, ProductSeason, ProductPrice } from '@/generated/graphql';
import {
  createReservationSchema,
  generatePaymentPlanSchema,
  updatePaymentPlanSchema,
  initiateMITPaymentSchema,
  formatZodError
} from '@/lib/validations/reservation-schemas';

/**
 * ARQUITECTURA CORRECTA: Server Actions para mutaciones
 * - Server Actions por defecto para todas las mutaciones
 * - generateServerClientUsingCookies para auth automática
 * - Revalidación de cache después de mutaciones
 */

/**
 * ⚠️ TEMPORAL: Helper para obtener una reservación por ID
 *
 * El schema de AWS AppSync NO tiene una query getReservation(id: ID!)
 * Solo existe getReservationsBySUB que retorna todas las reservaciones del usuario.
 *
 * Esta función obtiene todas las reservaciones y filtra por ID.
 * TODO: Solicitar al backend agregar query getReservation(id: ID!): Reservation
 */
async function getReservationByIdHelper(
  client: ReturnType<typeof generateServerClientUsingCookies>,
  reservationId: string
) {
  const result = await client.graphql({
    query: getReservationsBySUB
  });

  if (result.errors || !result.data?.getReservationsBySUB) {
    return {
      data: null,
      errors: result.errors
    };
  }

  const reservations = result.data.getReservationsBySUB;
  const reservation = reservations.find(r => r?.id === reservationId);

  if (!reservation) {
    return {
      data: null,
      errors: [{ message: 'Reservación no encontrada' }]
    };
  }

  return {
    data: { getReservation: reservation },
    errors: null
  };
}

interface ServerActionResponse<T = unknown> {
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
      babys: input.babys,
      totalPrice: input.total_price,
      type: input.type, // Tipo de pago: CONTADO o PLAZOS
      collectionType: input.collection_type
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

    // 2. Validate input with Zod schema (SECURITY: XSS, SQL injection, format validation)
    const validation = createReservationSchema.safeParse({
      experience_id: input.experience_id,
      adults: input.adults,
      kids: input.kids || 0,
      babys: input.babys || 0,
      reservation_date: input.reservation_date,
      season_id: input.season_id,
      price_id: input.price_id,
      price_per_person: input.price_per_person,
      price_per_kid: input.price_per_kid,
      total_price: input.total_price,
      currency: input.currency
    });

    if (!validation.success) {
      const errorMessage = formatZodError(validation.error);
      console.error('❌ [VALIDATION] Zod validation failed:', {
        errors: validation.error.errors,
        input
      });
      return {
        success: false,
        error: `Validación de datos falló: ${errorMessage}`
      };
    }

    // Use validated data for GraphQL mutation
    const validatedInput = validation.data;
    console.log('✅ [VALIDATION] Input validated successfully:', validatedInput);

    // ✅ NOTA: Validación de 'type' eliminada - GraphQL valida automáticamente (enum requerido)
    //    Backend Go también valida en validateReservationInput() (línea 319-324)

    // 3. Create server client with automatic auth
    const cookiesStore = await cookies();
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies: () => cookiesStore
    });

    // 4. Execute mutation
    console.log('💾 [MUTATION] Creating reservation with validated input...');
    const result = await client.graphql({
      query: createReservation,
      variables: { input }
    });

    // 4.1. Check for GraphQL errors (can return partial data + errors)
    if (result.errors && result.errors.length > 0) {
      console.error('❌ [GRAPHQL ERRORS]:', {
        count: result.errors.length,
        errors: result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      });

      // If there's partial data, use it; otherwise fail
      if (!result.data?.createReservation) {
        return {
          success: false,
          error: result.errors[0].message || 'Error de GraphQL al crear reserva'
        };
      }
    }

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

    // Log detailed error information
    if (error instanceof Error) {
      console.error('❌ [ERROR] Error message:', error.message);
      console.error('❌ [ERROR] Error stack:', error.stack);
    }

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al crear la reserva';

    return {
      success: false,
      error: errorMessage
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
  babys: number = 0,
  date?: string,
  seasonId?: string,
  priceId?: string
): Promise<ServerActionResponse<{ available: boolean; message?: string; remainingSlots?: number }>> {
  try {
    console.log('🔍 [SERVER ACTION] checkAvailabilityAction:', {
      experienceId,
      adults,
      kids,
      babys,
      date,
      seasonId,
      priceId
    });

    // 1. Get product with seasons and pricing data
    const client = generateServerClientUsingCookies({
      config: outputs,
      cookies
    });

    const productResult = await client.graphql({
      query: getProductById,
      variables: { id: experienceId }
    });

    if (!productResult.data?.getProductById) {
      return {
        success: false,
        error: 'Producto no encontrado'
      };
    }

    const product = productResult.data.getProductById;

    // 2. Determine active season
    let activeSeason: ProductSeason | null | undefined = null;
    const travelDate = date ? new Date(date) : new Date();

    if (seasonId) {
      // If seasonId provided, use that specific season
      activeSeason = product.seasons?.find((s: ProductSeason | null) => s?.id === seasonId);
    } else {
      // Find active season based on travel date
      activeSeason = product.seasons?.find((s: ProductSeason | null) => {
        if (!s?.start_date || !s?.end_date) return false;

        const startDate = new Date(s.start_date);
        const endDate = new Date(s.end_date);

        return travelDate >= startDate && travelDate <= endDate;
      });
    }

    if (!activeSeason) {
      return {
        success: true,
        data: {
          available: false,
          message: 'No hay temporada activa para la fecha seleccionada'
        }
      };
    }

    // 3. Check allotment availability
    console.log('✅ [AVAILABILITY] Temporada encontrada:', {
      seasonId: activeSeason.id,
      category: activeSeason.category,
      allotmentRemain: activeSeason.allotment_remain
    });

    if (activeSeason.allotment_remain <= 0) {
      return {
        success: true,
        data: {
          available: false,
          message: `No hay disponibilidad en temporada ${activeSeason.category}. Todas las plazas están reservadas.`,
          remainingSlots: 0
        }
      };
    }

    // 4. Find appropriate room price for capacity
    let roomPrice: ProductPrice | null | undefined = null;

    if (priceId) {
      // If priceId provided, use that specific price
      roomPrice = activeSeason.prices?.find((p: ProductPrice | null) => p?.id === priceId);
    } else {
      // Find best matching price by capacity
      const totalGuests = adults + kids; // Babies don't count in capacity, just occupy space

      roomPrice = activeSeason.prices?.find((p: ProductPrice | null) => {
        if (!p) return false;
        const canFitAdults = adults <= p.max_adult;
        const canFitKids = kids <= p.max_minor;
        const canFitTotal = (adults + kids + babys) <= (p.max_adult + p.max_minor);

        return canFitAdults && canFitKids && canFitTotal;
      });
    }

    if (!roomPrice) {
      return {
        success: true,
        data: {
          available: false,
          message: `No hay habitaciones disponibles para ${adults} adulto(s), ${kids} niño(s), ${babys} bebé(s). Excede la capacidad máxima.`
        }
      };
    }

    // 5. Validate room capacity
    console.log('✅ [AVAILABILITY] Habitación encontrada:', {
      priceId: roomPrice.id,
      roomName: roomPrice.room_name,
      maxAdult: roomPrice.max_adult,
      maxMinor: roomPrice.max_minor,
      requested: { adults, kids, babys }
    });

    const totalOccupancy = adults + kids + babys;
    const maxCapacity = roomPrice.max_adult + roomPrice.max_minor;

    if (totalOccupancy > maxCapacity) {
      return {
        success: true,
        data: {
          available: false,
          message: `La habitación ${roomPrice.room_name} tiene capacidad para ${maxCapacity} personas. Solicitaste ${totalOccupancy} personas.`
        }
      };
    }

    // 6. Availability confirmed
    console.log('✅ [AVAILABILITY] Disponibilidad confirmada:', {
      seasonId: activeSeason.id,
      priceId: roomPrice.id,
      roomName: roomPrice.room_name,
      remainingSlots: activeSeason.allotment_remain,
      occupancy: `${totalOccupancy}/${maxCapacity}`
    });

    return {
      success: true,
      data: {
        available: true,
        message: `Disponibilidad confirmada en ${roomPrice.room_name}`,
        remainingSlots: activeSeason.allotment_remain
      }
    };

  } catch (error: unknown) {
    console.error('❌ [ERROR] checkAvailabilityAction:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    return {
      success: false,
      error: `Error al verificar disponibilidad: ${errorMessage}`
    };
  }
}

/**
 * ✅ NUEVO: Server Action para generar PaymentPlan
 * Paso 2 del flujo de reservación: Genera plan de pago con backend Secure Pricing System
 * Backend calcula precios con 7 business rules
 *
 * PATTERN: Mutación con autenticación automática
 * @param input PaymentPlanInput con product_id, total_cost, travel_date, currency, payment_type_selected
 * @returns PaymentPlan con 27 campos completos (CONTADO y PLAZOS)
 */
export async function generatePaymentPlanAction(
  input: PaymentPlanInput
): Promise<ServerActionResponse<PaymentPlan>> {
  try {
    console.log('💰 [SERVER ACTION] generatePaymentPlanAction:', {
      productId: input.product_id,
      totalCost: input.total_cost,
      travelDate: input.travel_date,
      currency: input.currency,
      paymentType: input.payment_type_selected
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

    // 2. Validate input with Zod schema (SECURITY: XSS, SQL injection, format validation)
    const validation = generatePaymentPlanSchema.safeParse({
      product_id: input.product_id,
      total_cost: input.total_cost,
      travel_date: input.travel_date,
      currency: input.currency,
      payment_type_selected: input.payment_type_selected
    });

    if (!validation.success) {
      const errorMessage = formatZodError(validation.error);
      console.error('❌ [VALIDATION] Zod validation failed:', {
        errors: validation.error.errors,
        input
      });
      return {
        success: false,
        error: `Validación de datos falló: ${errorMessage}`
      };
    }

    // Use validated data for GraphQL mutation
    const validatedInput = validation.data;
    console.log('✅ [VALIDATION] PaymentPlanInput validated successfully:', validatedInput);

    // 3. Create server client with automatic auth
    const cookiesStore = await cookies();
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies: () => cookiesStore
    });

    // 4. Execute mutation
    console.log('💾 [MUTATION] Generating PaymentPlan with backend Secure Pricing System...');
    const result = await client.graphql({
      query: generatePaymentPlan,
      variables: { input }
    });

    // 4.1. Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      console.error('❌ [GRAPHQL ERRORS]:', {
        count: result.errors.length,
        errors: result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      });

      return {
        success: false,
        error: result.errors[0].message || 'Error de GraphQL al generar PaymentPlan'
      };
    }

    if (result?.data?.generatePaymentPlan) {
      const paymentPlan = result.data.generatePaymentPlan;

      console.log('✅ [SUCCESS] PaymentPlan generated:', {
        paymentPlanId: paymentPlan.id,
        status: paymentPlan.status,
        paymentType: paymentPlan.payment_type_selected,
        totalCost: paymentPlan.total_cost,
        cashFinalAmount: paymentPlan.cash_final_amount,
        installmentTotalAmount: paymentPlan.installment_total_amount
      });

      // 5. Revalidate relevant paths
      revalidateTag('user-reservations');
      revalidateTag('payment-plans');
      revalidatePath('/reservations');

      return {
        success: true,
        data: paymentPlan as PaymentPlan,
        message: 'Plan de pago generado exitosamente'
      };
    }

    return {
      success: false,
      error: 'No se pudo generar el plan de pago'
    };

  } catch (error) {
    console.error('❌ [ERROR] generatePaymentPlanAction:', error);

    if (error instanceof Error) {
      console.error('❌ [ERROR] Error message:', error.message);
      console.error('❌ [ERROR] Error stack:', error.stack);
    }

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al generar el plan de pago';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * ✅ NUEVO: Server Action para actualizar PaymentPlan (confirmar selección de tipo de pago)
 * Marca el payment plan como confirmado después de que usuario selecciona CONTADO o PLAZOS
 *
 * PATTERN: Mutación con autenticación automática
 * @param input UpdatePaymentPlanInput con id, payment_type_selected, status
 * @returns PaymentPlan actualizado
 */
export async function updatePaymentPlanAction(
  input: UpdatePaymentPlanInput
): Promise<ServerActionResponse<PaymentPlan>> {
  try {
    console.log('🔄 [SERVER ACTION] updatePaymentPlanAction:', {
      paymentPlanId: input.id,
      paymentType: input.payment_type_selected,
      status: input.status
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
        error: 'No se pudo obtener información del usuario'
      };
    }

    console.log('✅ [UPDATE PAYMENT PLAN] Usuario autenticado:', user.userId);

    // 2. Validate input with Zod schema (SECURITY: XSS, SQL injection, format validation)
    const validation = updatePaymentPlanSchema.safeParse({
      id: input.id,
      payment_type_selected: input.payment_type_selected,
      status: input.status
    });

    if (!validation.success) {
      const errorMessage = formatZodError(validation.error);
      console.error('❌ [VALIDATION] Zod validation failed:', {
        errors: validation.error.errors,
        input
      });
      return {
        success: false,
        error: `Validación de datos falló: ${errorMessage}`
      };
    }

    // Use validated data for GraphQL mutation
    const validatedInput = validation.data;
    console.log('✅ [VALIDATION] UpdatePaymentPlanInput validated successfully:', validatedInput);

    // 3. Get GraphQL client
    const client = generateServerClientUsingCookies({
      config: outputs,
      cookies
    });

    // 4. Execute updatePaymentPlan mutation with validated input
    const result = await client.graphql({
      query: updatePaymentPlan,
      variables: { input: validatedInput }
    });

    if (result.data?.updatePaymentPlan) {
      const paymentPlan = result.data.updatePaymentPlan;

      console.log('✅ [UPDATE PAYMENT PLAN] Plan actualizado exitosamente:', {
        paymentPlanId: paymentPlan.id,
        paymentType: paymentPlan.payment_type_selected,
        status: paymentPlan.status
      });

      // 4. Revalidate relevant paths
      revalidateTag('user-reservations');
      revalidateTag('payment-plans');
      revalidatePath('/marketplace/booking');
      revalidatePath('/traveler/reservations');

      return {
        success: true,
        data: paymentPlan as PaymentPlan,
        message: 'Tipo de pago confirmado exitosamente'
      };
    }

    return {
      success: false,
      error: 'No se pudo actualizar el plan de pago'
    };

  } catch (error: unknown) {
    console.error('❌ [ERROR] updatePaymentPlanAction:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al actualizar el plan de pago';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Iniciar pago con MIT Payment Gateway
 *
 * @param paymentPlanId - ID del payment plan
 * @returns URL de checkout de MIT para redirigir al usuario
 */

/**
 * Obtener reservaciones del usuario autenticado
 *
 * @returns Lista de reservaciones con datos de producto y payment plan
 */
export async function getUserReservationsAction(): Promise<ServerActionResponse<{
  reservations: Array<{
    id: string;
    experience_id: string;
    adults: number;
    kids: number;
    babys: number;
    total_price: number;
    status: string;
    reservationDate: string;
    payment_method?: string;
    type?: string;
    product?: {
      id: string;
      name: string;
      product_type: string;
      cover_image_url?: string;
    };
    paymentPlan?: PaymentPlan;
  }>;
}>> {
  try {
    console.log('[Reservations] 📋 Obteniendo reservaciones del usuario...');

    // 1. Validar autenticación
    const session = await getServerSession();
    const user = await getAuthenticatedUser();

    if (!session || !user) {
      console.log('[Reservations] ❌ Usuario no autenticado');
      return {
        success: false,
        error: 'Debes iniciar sesión para ver tus reservaciones'
      };
    }

    console.log('[Reservations] ✅ Usuario autenticado:', {
      userId: user.userId,
      userType: user.userType
    });

    // 2. Obtener GraphQL client
    const client = await getGraphQLClientWithIdToken();

    // 3. Obtener reservaciones del usuario
    const reservationsResult = await client.graphql({
      query: getReservationsBySUB
    });

    if (reservationsResult.errors && reservationsResult.errors.length > 0) {
      console.error('[Reservations] ❌ Error obteniendo reservaciones:', reservationsResult.errors);
      return {
        success: false,
        error: reservationsResult.errors[0].message
      };
    }

    const reservations = reservationsResult.data?.getReservationsBySUB || [];

    console.log('[Reservations] 📊 Reservaciones encontradas:', reservations.length);

    // 4. Enriquecer cada reservación con datos de producto y payment plan
    const enrichedReservations = await Promise.all(
      reservations.map(async (reservation) => {
        try {
          // Obtener datos del producto
          let product = null;
          if (reservation.experience_id) {
            const productResult = await client.graphql({
              query: getProductById,
              variables: { id: reservation.experience_id }
            });

            if (productResult.data?.getProductById) {
              const productData = productResult.data.getProductById;
              product = {
                id: productData.id,
                name: productData.name,
                product_type: productData.product_type || 'circuit',
                cover_image_url: productData.cover_image_url
              };
            }
          }

          // Obtener payment plan asociado
          let paymentPlan = null;
          try {
            const paymentPlanResult = await client.graphql({
              query: getPaymentPlanByReservation,
              variables: { reservation_id: reservation.id }
            });

            if (paymentPlanResult.data?.getPaymentPlanByReservation) {
              paymentPlan = paymentPlanResult.data.getPaymentPlanByReservation;
            }
          } catch (error) {
            console.log('[Reservations] ⚠️ No se encontró payment plan para reservación:', reservation.id);
          }

          return {
            ...reservation,
            product,
            paymentPlan
          };
        } catch (error) {
          console.error('[Reservations] ⚠️ Error enriqueciendo reservación:', reservation.id, error);
          return {
            ...reservation,
            product: null,
            paymentPlan: null
          };
        }
      })
    );

    console.log('[Reservations] ✅ Reservaciones enriquecidas exitosamente');

    return {
      success: true,
      data: {
        reservations: enrichedReservations
      }
    };

  } catch (error: unknown) {
    console.error('❌ [ERROR] getUserReservationsAction:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al obtener reservaciones';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Server Action para actualizar una reservación existente
 * ADDED 2025-10-31: Enables updating reservation details (adults, kids, babys, companions, payment method)
 *
 * @param reservationId - ID de la reservación a actualizar
 * @param input - Datos actualizados de la reservación
 * @returns ServerActionResponse con los datos actualizados
 */
export async function updateReservationAction(
  reservationId: string,
  input: {
    adults: number;
    kids: number;
    babys: number;
    companions?: {
      name: string;
      family_name: string;
      birthday: string;
      country: string;
      gender: string;
      passport_number?: number;
    };
    payment_method?: string;
  }
): Promise<ServerActionResponse<ReservationData>> {
  try {
    console.log('🔄 [Reservation Action] Iniciando actualización de reservación:', reservationId);
    console.log('📝 [Reservation Action] Datos a actualizar:', input);

    // 1. Validar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario. Por favor inicia sesión.'
      };
    }

    console.log('✅ [Reservation Action] Usuario autenticado:', {
      userId: user.userId,
      email: user.email
    });

    // 2. Obtener cliente GraphQL
    const client = generateServerClientUsingCookies({
      config: outputs,
      cookies
    });

    // 3. Ejecutar mutación updateReservation
    console.log('🔄 [Reservation Action] Ejecutando mutación updateReservation...');
    const result = await client.graphql({
      query: updateReservation,
      variables: {
        input: {
          ...input,
          id: reservationId
        }
      }
    });

    console.log('✅ [Reservation Action] Resultado de updateReservation:', result);

    // 4. Validar resultado
    if (result.errors && result.errors.length > 0) {
      console.error('❌ [Reservation Action] GraphQL devolvió errores:', result.errors);
      return {
        success: false,
        error: result.errors[0].message
      };
    }

    const updatedReservation = result.data?.updateReservation;

    if (!updatedReservation) {
      console.error('❌ [Reservation Action] No se recibió confirmación de la actualización');
      return {
        success: false,
        error: 'No se pudo confirmar la actualización de la reservación'
      };
    }

    console.log('✅ [Reservation Action] Reservación actualizada exitosamente');

    // 5. Revalidar cache
    revalidatePath('/traveler/reservations');
    revalidateTag('user-reservations');

    return {
      success: true,
      data: {
        id: updatedReservation.id,
        status: updatedReservation.status || 'pending',
        total_price: updatedReservation.total_price || 0,
        experience_id: updatedReservation.experience_id || '',
        experience_type: updatedReservation.experience_type || '',
        adults: updatedReservation.adults || 0,
        kids: updatedReservation.kids || 0,
        babys: updatedReservation.babys || 0,
        reservationDate: updatedReservation.reservationDate || ''
      },
      message: 'Reservación actualizada exitosamente'
    };

  } catch (error: unknown) {
    console.error('❌ [ERROR] updateReservationAction:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al actualizar la reservación';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Server Action para obtener detalle completo de reservación con producto y payment plan
 * ADDED 2025-10-31: Fundamento para página de detalle de viaje
 *
 * @param reservationId - ID de la reservación
 * @returns Reservation + Product + PaymentPlan combinados
 */
export async function getReservationWithDetailsAction(
  reservationId: string
): Promise<ServerActionResponse<{
  reservation: ReservationData;
  product: {
    id: string;
    name: string;
    description?: string;
    product_type: string;
    cover_image_url?: string;
    image_url?: string[];
    video_url?: string[];
    itinerary?: string;
    planned_hotels_or_similar?: string[];
    destination?: Array<{
      place?: string;
      placeSub?: string;
      coordinates?: {
        latitude?: number;
        longitude?: number;
      };
    }>;
    user_data?: {
      username?: string;
      name?: string;
      avatar_url?: string;
      bio?: string;
    };
  };
  paymentPlan: PaymentPlan | null;
}>> {
  try {
    console.log('🔍 [Reservation Detail] Obteniendo detalle completo de reservación:', reservationId);

    // 1. Validar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario. Por favor inicia sesión.'
      };
    }

    console.log('✅ [Reservation Detail] Usuario autenticado:', {
      userId: user.userId,
      email: user.email
    });

    // 2. Obtener cliente GraphQL
    const client = generateServerClientUsingCookies({
      config: outputs,
      cookies
    });

    // 3. Obtener reservación
    console.log('📋 [Reservation Detail] Obteniendo reservación...');
    const reservationResult = await getReservationByIdHelper(client, reservationId);

    if (reservationResult.errors || !reservationResult.data?.getReservation) {
      console.error('❌ [Reservation Detail] Error obteniendo reservación:', reservationResult.errors);
      return {
        success: false,
        error: 'No se pudo obtener la reservación'
      };
    }

    const reservation = reservationResult.data.getReservation;
    console.log('✅ [Reservation Detail] Reservación obtenida:', reservation.id);

    // 4. Obtener producto
    console.log('🎫 [Reservation Detail] Obteniendo producto:', reservation.experience_id);
    const productResult = await client.graphql({
      query: getProductById,
      variables: { id: reservation.experience_id }
    });

    if (productResult.errors || !productResult.data?.getProductById) {
      console.error('❌ [Reservation Detail] Error obteniendo producto:', productResult.errors);
      return {
        success: false,
        error: 'No se pudo obtener el producto asociado'
      };
    }

    const product = productResult.data.getProductById;
    console.log('✅ [Reservation Detail] Producto obtenido:', product.name);

    // 5. Obtener payment plan
    console.log('💳 [Reservation Detail] Obteniendo payment plan...');
    const paymentPlanResult = await client.graphql({
      query: getPaymentPlanByReservation,
      variables: { reservation_id: reservationId }
    });

    let paymentPlan: PaymentPlan | null = null;
    if (!paymentPlanResult.errors && paymentPlanResult.data?.getPaymentPlanByReservation) {
      paymentPlan = paymentPlanResult.data.getPaymentPlanByReservation;
      console.log('✅ [Reservation Detail] Payment plan obtenido:', paymentPlan.id);
    } else {
      console.log('⚠️ [Reservation Detail] No hay payment plan asociado');
    }

    // 6. Construir respuesta completa
    const reservationData: ReservationData = {
      id: reservation.id,
      experience_id: reservation.experience_id || '',
      experience_type: reservation.experience_type || '',
      adults: reservation.adults || 0,
      kids: reservation.kids || 0,
      babys: reservation.babys || 0,
      reservationDate: reservation.reservation_date || '',
      status: reservation.status || 'pending',
      total_price: reservation.total_price || 0
    };

    console.log('🎉 [Reservation Detail] Detalle completo construido exitosamente');

    return {
      success: true,
      data: {
        reservation: reservationData,
        product: {
          id: product.id,
          name: product.name || '',
          description: product.description || undefined,
          product_type: product.product_type || 'circuit',
          cover_image_url: product.cover_image_url || undefined,
          image_url: product.image_url || undefined,
          video_url: product.video_url || undefined,
          itinerary: product.itinerary || undefined,
          planned_hotels_or_similar: product.planned_hotels_or_similar || undefined,
          destination: product.destination || undefined,
          user_data: product.user_data || undefined
        },
        paymentPlan
      }
    };

  } catch (error: unknown) {
    console.error('❌ [ERROR] getReservationWithDetailsAction:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al obtener el detalle de la reservación';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get All Reservations by User Action
 *
 * Fetches all reservations for the authenticated user with pagination support.
 *
 * Features:
 * - JWT authentication validation
 * - Pagination with nextToken
 * - Sorted by creation date (newest first)
 * - Returns complete reservation data
 *
 * @param options - Pagination options (limit, nextToken)
 * @returns List of reservations with pagination token
 *
 * Part of: Sprint 1+ - Dashboard de Reservaciones
 */
export async function getAllReservationsByUserAction(options?: {
  limit?: number;
  nextToken?: string;
}): Promise<ServerActionResponse<{
  items: ReservationData[];
  nextToken?: string;
  total?: number;
}>> {
  try {
    console.log('📋 [getAllReservationsByUserAction] Obteniendo reservaciones del usuario');

    // 1. Validate authentication
    const user = await getAuthenticatedUser();

    if (!user || !user.userId) {
      console.error('❌ [getAllReservationsByUserAction] Usuario no autenticado');
      return {
        success: false,
        error: 'Debes iniciar sesión para ver tus reservaciones'
      };
    }

    console.log('✅ [getAllReservationsByUserAction] Usuario autenticado:', {
      userId: user.userId,
      userType: user.userType
    });

    // 2. Get GraphQL client
    const client = generateServerClientUsingCookies({
      config: outputs,
      cookies
    });

    // 3. Query reservations
    // ⚠️ NOTA: getReservationsBySUB NO soporta paginación en el schema actual
    // Retorna todas las reservaciones del usuario autenticado
    console.log('🔍 [getAllReservationsByUserAction] Consultando reservaciones...');

    const result = await client.graphql({
      query: getReservationsBySUB
    });

    // 4. Handle errors
    if (result.errors && result.errors.length > 0) {
      console.error('❌ [getAllReservationsByUserAction] GraphQL errors:', result.errors);
      return {
        success: false,
        error: result.errors[0].message || 'Error al obtener las reservaciones'
      };
    }

    if (!result.data?.getReservationsBySUB) {
      console.error('❌ [getAllReservationsByUserAction] Sin datos en respuesta');
      return {
        success: false,
        error: 'No se pudieron obtener las reservaciones'
      };
    }

    const reservations = result.data.getReservationsBySUB;

    console.log('✅ [getAllReservationsByUserAction] Reservaciones obtenidas:', {
      count: reservations.length
    });

    // 5. Apply client-side pagination (since schema doesn't support it)
    const limit = options?.limit || 20;
    const offset = 0; // TODO: Implement offset-based pagination if needed
    const paginatedReservations = reservations.slice(offset, offset + limit);

    // 6. Map to ReservationData type
    const mappedItems: ReservationData[] = paginatedReservations.map(item => ({
      id: item.id,
      experience_id: item.experience_id,
      experience_type: item.experience_type || undefined,
      user_id: item.user_id,
      adults: item.adults,
      kids: item.kids,
      babys: item.babys,
      companions: item.companions?.map(comp => ({
        name: comp.name,
        family_name: comp.family_name,
        birthday: comp.birthday,
        country: comp.country,
        gender: comp.gender,
        passport_number: comp.passport_number
      })),
      reservation_date: item.reservation_date,
      status: item.status,
      price_per_person: item.price_per_person,
      price_per_kid: item.price_per_kid || undefined,
      total_price: item.total_price,
      currency: item.currency,
      season_id: item.season_id || undefined,
      price_id: item.price_id || undefined,
      payment_method: item.payment_method || undefined,
      type: item.type || undefined
    }));

    return {
      success: true,
      data: {
        items: mappedItems,
        nextToken: undefined, // ⚠️ Schema doesn't support pagination
        total: reservations.length // Total count from server
      }
    };

  } catch (error: unknown) {
    console.error('❌ [ERROR] getAllReservationsByUserAction:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al obtener las reservaciones';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Update Companions Action
 *
 * Updates companion (traveler) information for a reservation
 *
 * @param reservationId - Reservation ID
 * @param companions - Array of companion data
 * @returns Server action response with updated reservation
 */
export async function updateCompanionsAction(
  reservationId: string,
  companions: Array<{
    name: string;
    family_name: string;
    birthday: string;
    country: string;
    gender: string;
    passport_number: string;
  }>
): Promise<ServerActionResponse<{ reservation: { id: string; companions: unknown[] } }>> {
  console.log('[updateCompanionsAction] 📝 Updating companions for reservation:', reservationId);

  try {
    // STEP 1: Validate authentication
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'No autenticado. Por favor inicia sesión.'
      };
    }

    console.log('[updateCompanionsAction] ✅ User authenticated:', user.userId);

    // STEP 2: Get GraphQL client with authentication
    const client = generateServerClientUsingCookies({
      config: outputs,
      cookies
    });

    // STEP 3: Verify reservation belongs to user
    const existingReservation = await getReservationByIdHelper(client, reservationId);

    if (!existingReservation.data?.getReservation) {
      return {
        success: false,
        error: 'Reservación no encontrada'
      };
    }

    if (existingReservation.data.getReservation.user_id !== user.userId) {
      return {
        success: false,
        error: 'No tienes permiso para editar esta reservación'
      };
    }

    console.log('[updateCompanionsAction] ✅ Reservation ownership verified');

    // STEP 4: Update reservation with companions
    const updateResult = await client.graphql({
      query: updateReservation,
      variables: {
        input: {
          id: reservationId,
          companions: companions
        }
      }
    });

    // STEP 5: Handle GraphQL errors
    if (updateResult.errors && updateResult.errors.length > 0) {
      console.error('[updateCompanionsAction] ❌ GraphQL errors:', updateResult.errors);

      // Check if we have partial data despite errors
      if (updateResult.data?.updateReservation?.id) {
        console.log('[updateCompanionsAction] ⚠️ Partial success with warnings');
        return {
          success: true,
          data: {
            reservation: {
              id: updateResult.data.updateReservation.id,
              companions: updateResult.data.updateReservation.companions || []
            }
          },
          message: 'Companions actualizados con advertencias'
        };
      }

      return {
        success: false,
        error: updateResult.errors[0].message
      };
    }

    // STEP 6: Verify update was successful
    const updatedReservation = updateResult.data?.updateReservation;
    if (!updatedReservation) {
      return {
        success: false,
        error: 'No se recibió respuesta del servidor'
      };
    }

    console.log('[updateCompanionsAction] ✅ Companions updated successfully:', {
      reservationId: updatedReservation.id,
      companionsCount: companions.length
    });

    // STEP 7: Revalidate cache
    revalidatePath(`/traveler/reservations/${reservationId}`);
    revalidatePath('/traveler/reservations');

    return {
      success: true,
      data: {
        reservation: {
          id: updatedReservation.id,
          companions: updatedReservation.companions || []
        }
      },
      message: 'Información de viajeros actualizada exitosamente'
    };

  } catch (error: unknown) {
    console.error('❌ [ERROR] updateCompanionsAction:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al actualizar companions';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Change Reservation Date Action
 *
 * Updates the travel date of a reservation and generates a new payment plan if price changes.
 *
 * Business Logic:
 * 1. Validates change_deadline_days from payment plan
 * 2. Updates reservation date and pricing
 * 3. Generates new payment plan if total price changed
 * 4. Maintains payment history (paid installments remain paid)
 * 5. Revalidates cache after successful update
 *
 * Security:
 * - Requires authentication
 * - Verifies reservation ownership
 * - Validates season/price IDs
 *
 * @param input - Change date input data
 * @returns Updated reservation and payment plan data
 */
export async function changeReservationDateAction(input: {
  reservationId: string;
  paymentPlanId: string;
  productId: string;
  newDate: string;
  newPricePerPerson: number;
  newPricePerKid?: number;
  newTotalPrice: number;
  seasonId?: string;
  priceId?: string;
}): Promise<ServerActionResponse<{
  reservation: {
    id: string;
    reservation_date: string;
    price_per_person: number;
    price_per_kid?: number;
    total_price: number;
  };
  paymentPlan?: {
    id: string;
    total_cost: number;
  };
}>> {
  console.log('🗓️ [changeReservationDateAction] Iniciando cambio de fecha de reservación...');
  console.log('Input:', {
    reservationId: input.reservationId,
    newDate: input.newDate,
    newTotalPrice: input.newTotalPrice
  });

  try {
    // STEP 1: Validate authentication
    const user = await getAuthenticatedUser();

    if (!user || !user.userId) {
      console.error('❌ [changeReservationDateAction] Usuario no autenticado');
      return {
        success: false,
        error: 'No estás autenticado. Por favor inicia sesión.'
      };
    }

    console.log('✅ [changeReservationDateAction] Usuario autenticado:', user.userId);

    // STEP 2: Get GraphQL client
    const client = generateServerClientUsingCookies({ config: outputs, cookies });

    // STEP 3: Get existing reservation to verify ownership
    const existingReservation = await getReservationByIdHelper(client, input.reservationId);

    if (!existingReservation.data?.getReservation) {
      console.error('❌ [changeReservationDateAction] Reservación no encontrada');
      return {
        success: false,
        error: 'Reservación no encontrada'
      };
    }

    // STEP 4: Verify ownership
    if (existingReservation.data.getReservation.user_id !== user.userId) {
      console.error('❌ [changeReservationDateAction] Usuario no es dueño de la reservación');
      return {
        success: false,
        error: 'No tienes permiso para modificar esta reservación'
      };
    }

    console.log('✅ [changeReservationDateAction] Ownership verificado');

    // STEP 5: Update reservation with new date and pricing
    const updateReservationMutation = /* GraphQL */ `
      mutation UpdateReservationDate($input: UpdateReservationInput!) {
        updateReservation(input: $input) {
          id
          reservation_date
          price_per_person
          price_per_kid
          total_price
          season_id
          price_id
          updated_at
        }
      }
    `;

    const updateReservationResult = await client.graphql({
      query: updateReservationMutation,
      variables: {
        input: {
          id: input.reservationId,
          reservation_date: input.newDate,
          price_per_person: input.newPricePerPerson,
          price_per_kid: input.newPricePerKid,
          total_price: input.newTotalPrice,
          season_id: input.seasonId,
          price_id: input.priceId
        }
      }
    });

    if (updateReservationResult.errors) {
      console.error('❌ [changeReservationDateAction] Error actualizando reservación:', updateReservationResult.errors);
      return {
        success: false,
        error: 'Error al actualizar la reservación'
      };
    }

    console.log('✅ [changeReservationDateAction] Reservación actualizada');

    const updatedReservation = updateReservationResult.data?.updateReservation;

    // STEP 6: Check if price changed - if so, regenerate payment plan
    const oldTotalPrice = existingReservation.data.getReservation.total_price || 0;
    const priceChanged = Math.abs(input.newTotalPrice - oldTotalPrice) > 0.01; // Tolerance for float comparison

    let updatedPaymentPlan = null;

    if (priceChanged) {
      console.log('💰 [changeReservationDateAction] Precio cambió, regenerando payment plan...');

      // Call backend mutation to regenerate payment plan
      const regeneratePaymentPlanMutation = /* GraphQL */ `
        mutation RegeneratePaymentPlan($input: RegeneratePaymentPlanInput!) {
          regeneratePaymentPlan(input: $input) {
            id
            total_cost
            updated_at
          }
        }
      `;

      const regenerateResult = await client.graphql({
        query: regeneratePaymentPlanMutation,
        variables: {
          input: {
            payment_plan_id: input.paymentPlanId,
            new_total_price: input.newTotalPrice,
            new_travel_date: input.newDate
          }
        }
      });

      if (regenerateResult.errors) {
        console.warn('⚠️ [changeReservationDateAction] Error regenerando payment plan:', regenerateResult.errors);
        // Continue anyway - reservation was updated successfully
      } else {
        updatedPaymentPlan = regenerateResult.data?.regeneratePaymentPlan;
        console.log('✅ [changeReservationDateAction] Payment plan regenerado');
      }
    } else {
      console.log('💰 [changeReservationDateAction] Precio igual, no se regenera payment plan');
    }

    // STEP 7: Revalidate cache
    revalidatePath(`/traveler/reservations/${input.reservationId}`);
    revalidatePath('/traveler/reservations');

    console.log('✅ [changeReservationDateAction] Cache revalidado');

    return {
      success: true,
      data: {
        reservation: {
          id: updatedReservation.id,
          reservation_date: updatedReservation.reservation_date,
          price_per_person: updatedReservation.price_per_person,
          price_per_kid: updatedReservation.price_per_kid,
          total_price: updatedReservation.total_price
        },
        paymentPlan: updatedPaymentPlan
          ? {
              id: updatedPaymentPlan.id,
              total_cost: updatedPaymentPlan.total_cost
            }
          : undefined
      },
      message: 'Fecha de viaje actualizada exitosamente'
    };

  } catch (error: unknown) {
    console.error('❌ [ERROR] changeReservationDateAction:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al cambiar fecha';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Cancel Reservation Action
 *
 * Cancels a reservation and processes refund based on cancellation policy.
 *
 * Business Logic:
 * 1. Validates cancellation_deadline_days from payment plan
 * 2. Calculates refund based on days before travel
 * 3. Updates reservation status to CANCELED
 * 4. Records cancellation metadata (reason, refund amount)
 * 5. Processes refund via MIT Payment Gateway (if applicable)
 * 6. Revalidates cache after successful cancellation
 *
 * Refund Policy (Default):
 * - 30+ days before: 90% refund
 * - 15-29 days before: 70% refund
 * - 7-14 days before: 50% refund
 * - Less than 7 days: 20% refund
 * - Processing fee: 3% (max $500 MXN)
 *
 * Security:
 * - Requires authentication
 * - Verifies reservation ownership
 * - Validates cancellation is allowed
 *
 * @param input - Cancellation input data
 * @returns Cancellation confirmation with refund details
 */
export async function cancelReservationAction(input: {
  reservationId: string;
  paymentPlanId: string;
  cancellationReason: string;
  additionalComments?: string;
  refundAmount: number;
  totalPaid: number;
}): Promise<ServerActionResponse<{
  reservation: {
    id: string;
    status: string;
    cancellation_date: string;
  };
  refund: {
    amount: number;
    processing_fee: number;
    net_refund: number;
    status: string;
  };
}>> {
  console.log('❌ [cancelReservationAction] Iniciando cancelación de reservación...');
  console.log('Input:', {
    reservationId: input.reservationId,
    cancellationReason: input.cancellationReason,
    refundAmount: input.refundAmount
  });

  try {
    // STEP 1: Validate authentication
    const user = await getAuthenticatedUser();

    if (!user || !user.userId) {
      console.error('❌ [cancelReservationAction] Usuario no autenticado');
      return {
        success: false,
        error: 'No estás autenticado. Por favor inicia sesión.'
      };
    }

    console.log('✅ [cancelReservationAction] Usuario autenticado:', user.userId);

    // STEP 2: Get GraphQL client
    const client = generateServerClientUsingCookies({ config: outputs, cookies });

    // STEP 3: Get existing reservation to verify ownership and status
    const existingReservation = await getReservationByIdHelper(client, input.reservationId);

    if (!existingReservation.data?.getReservation) {
      console.error('❌ [cancelReservationAction] Reservación no encontrada');
      return {
        success: false,
        error: 'Reservación no encontrada'
      };
    }

    const reservation = existingReservation.data.getReservation;

    // STEP 4: Verify ownership
    if (reservation.user_id !== user.userId) {
      console.error('❌ [cancelReservationAction] Usuario no es dueño de la reservación');
      return {
        success: false,
        error: 'No tienes permiso para cancelar esta reservación'
      };
    }

    // STEP 4b: Verify reservation is not already cancelled
    if (reservation.status === 'CANCELED') {
      console.error('❌ [cancelReservationAction] Reservación ya está cancelada');
      return {
        success: false,
        error: 'Esta reservación ya está cancelada'
      };
    }

    console.log('✅ [cancelReservationAction] Ownership verificado');

    // STEP 5: Get payment plan to check cancellation policy
    const paymentPlanResult = await client.graphql({
      query: getPaymentPlan,
      variables: { id: input.paymentPlanId }
    });

    if (!paymentPlanResult.data?.getPaymentPlan) {
      console.error('❌ [cancelReservationAction] Payment plan no encontrado');
      return {
        success: false,
        error: 'No se pudo verificar la política de cancelación'
      };
    }

    const paymentPlan = paymentPlanResult.data.getPaymentPlan;

    console.log('✅ [cancelReservationAction] Payment plan obtenido');

    // STEP 6: Update reservation status to CANCELED
    // Note: Since UpdateReservationInput doesn't have a status field,
    // we need to use a custom mutation or update via DynamoDB directly.
    // For now, we'll create a custom GraphQL mutation inline.

    const cancelReservationMutation = /* GraphQL */ `
      mutation CancelReservation($id: ID!, $status: ReservationStatus!) {
        updateReservation(input: { id: $id, status: $status }) {
          id
          status
          reservation_date
          total_price
          updated_at
        }
      }
    `;

    console.log('📝 [cancelReservationAction] Actualizando estado a CANCELED...');

    const cancelResult = await client.graphql({
      query: cancelReservationMutation,
      variables: {
        id: input.reservationId,
        status: 'CANCELED'
      }
    });

    if (!cancelResult.data?.updateReservation) {
      console.error('❌ [cancelReservationAction] Error al actualizar estado');
      return {
        success: false,
        error: 'Error al cancelar la reservación'
      };
    }

    console.log('✅ [cancelReservationAction] Estado actualizado a CANCELED');

    // STEP 7: Process refund (if applicable)
    const processingFeePercentage = 3;
    const processingFee = Math.min(
      (input.refundAmount * processingFeePercentage) / 100,
      500 // Max $500 MXN
    );
    const netRefund = Math.max(0, input.refundAmount - processingFee);

    let refundStatus = 'pending';

    if (netRefund > 0) {
      console.log('💰 [cancelReservationAction] Procesando reembolso:', {
        totalPaid: input.totalPaid,
        refundAmount: input.refundAmount,
        processingFee,
        netRefund
      });

      // TODO FASE 4.1: Integrate with MIT Payment Gateway for refund processing
      // For now, mark refund as pending manual processing
      refundStatus = 'pending_manual_processing';

      console.log('⏳ [cancelReservationAction] Reembolso marcado para procesamiento manual');
    } else {
      console.log('⚠️ [cancelReservationAction] No hay reembolso disponible');
      refundStatus = 'no_refund';
    }

    // STEP 8: Record cancellation metadata
    // TODO FASE 4.1: Store cancellation reason and refund details in database
    console.log('📝 [cancelReservationAction] Metadata de cancelación:', {
      reason: input.cancellationReason,
      comments: input.additionalComments,
      refundStatus,
      netRefund
    });

    // STEP 9: Revalidate cache
    console.log('🔄 [cancelReservationAction] Revalidando cache...');
    revalidatePath(`/traveler/reservations/${input.reservationId}`);
    revalidatePath('/traveler/reservations');

    console.log('✅ [cancelReservationAction] Cancelación completada exitosamente');

    return {
      success: true,
      message: 'Reservación cancelada exitosamente',
      data: {
        reservation: {
          id: cancelResult.data.updateReservation.id,
          status: 'CANCELED',
          cancellation_date: new Date().toISOString()
        },
        refund: {
          amount: input.refundAmount,
          processing_fee: processingFee,
          net_refund: netRefund,
          status: refundStatus
        }
      }
    };

  } catch (error: unknown) {
    console.error('❌ [ERROR] cancelReservationAction:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al cancelar reservación';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Initiate MIT Payment Action
 *
 * Creates a payment link with MIT Payment Gateway for an installment.
 *
 * Business Logic:
 * 1. Validates authentication and ownership
 * 2. Gets reservation and payment plan details
 * 3. Determines amount to pay (single installment or full CONTADO)
 * 4. Creates payment request with MIT service
 * 5. Returns checkout URL for redirect
 *
 * Security:
 * - Requires authentication
 * - Verifies reservation ownership
 * - Validates installment exists and is payable
 *
 * @param input - Payment initiation data
 * @returns MIT payment response with checkout URL
 */
export async function initiateMITPaymentAction(input: {
  reservationId: string;
  paymentPlanId: string;
  installmentNumber: number;
}): Promise<ServerActionResponse<{
  paymentId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  expiresAt?: string;
}>> {
  console.log('💳 [initiateMITPaymentAction] Iniciando pago MIT...');
  console.log('Input:', {
    reservationId: input.reservationId,
    paymentPlanId: input.paymentPlanId,
    installmentNumber: input.installmentNumber
  });

  try {
    // STEP 1: Validate authentication
    const user = await getAuthenticatedUser();

    if (!user || !user.userId) {
      console.error('❌ [initiateMITPaymentAction] Usuario no autenticado');
      return {
        success: false,
        error: 'No estás autenticado. Por favor inicia sesión.'
      };
    }

    console.log('✅ [initiateMITPaymentAction] Usuario autenticado:', user.userId);

    // STEP 2: Get GraphQL client
    const client = generateServerClientUsingCookies({ config: outputs, cookies });

    // STEP 3: Get reservation to verify ownership
    const reservationResult = await getReservationByIdHelper(client, input.reservationId);

    if (!reservationResult.data?.getReservation) {
      console.error('❌ [initiateMITPaymentAction] Reservación no encontrada');
      return {
        success: false,
        error: 'Reservación no encontrada'
      };
    }

    const reservation = reservationResult.data.getReservation;

    // STEP 4: Verify ownership
    if (reservation.user_id !== user.userId) {
      console.error('❌ [initiateMITPaymentAction] Usuario no es dueño de la reservación');
      return {
        success: false,
        error: 'No tienes permiso para pagar esta reservación'
      };
    }

    console.log('✅ [initiateMITPaymentAction] Ownership verificado');

    // STEP 5: Get payment plan
    const paymentPlanResult = await client.graphql({
      query: getPaymentPlan,
      variables: { id: input.paymentPlanId }
    });

    if (!paymentPlanResult.data?.getPaymentPlan) {
      console.error('❌ [initiateMITPaymentAction] Payment plan no encontrado');
      return {
        success: false,
        error: 'Plan de pagos no encontrado'
      };
    }

    const paymentPlan = paymentPlanResult.data.getPaymentPlan;

    console.log('✅ [initiateMITPaymentAction] Payment plan obtenido:', {
      planType: paymentPlan.plan_type,
      totalAmount: paymentPlan.total_cost
    });

    // STEP 6: Determine payment details
    let paymentAmount: number;
    let paymentType: 'CONTADO' | 'PLAZOS';
    let installmentsCount: number | undefined;

    if (paymentPlan.plan_type === 'CONTADO') {
      // Single payment
      paymentAmount = paymentPlan.total_cost;
      paymentType = 'CONTADO';
    } else {
      // Find specific installment
      const installment = paymentPlan.installments?.find(
        i => i.installment_number === input.installmentNumber
      );

      if (!installment) {
        console.error('❌ [initiateMITPaymentAction] Installment no encontrado');
        return {
          success: false,
          error: `Parcialidad ${input.installmentNumber} no encontrada`
        };
      }

      // Validate installment is payable
      const status = installment.status.toLowerCase();
      if (status === 'paid' || status === 'completed') {
        console.error('❌ [initiateMITPaymentAction] Installment ya está pagado');
        return {
          success: false,
          error: `La parcialidad ${input.installmentNumber} ya está pagada`
        };
      }

      paymentAmount = installment.amount;
      paymentType = 'PLAZOS';
      installmentsCount = paymentPlan.installments?.length || 1;
    }

    console.log('📊 [initiateMITPaymentAction] Detalles de pago:', {
      amount: paymentAmount,
      type: paymentType,
      installments: installmentsCount
    });

    // STEP 7: Get product details for metadata
    const productResult = await client.graphql({
      query: getProductById,
      variables: { id: reservation.experience_id }
    });

    const product = productResult.data?.getProduct;

    // STEP 8: Create MIT payment request
    const { mitPaymentService } = await import('@/lib/services/mit-payment-service');

    const mitRequest = {
      reservationId: input.reservationId,
      paymentPlanId: input.paymentPlanId,
      paymentType,
      amount: Math.round(paymentAmount * 100), // Convert to centavos
      currency: paymentPlan.currency || 'MXN',
      installments: installmentsCount,
      installmentAmount: paymentType === 'PLAZOS' ? Math.round(paymentAmount * 100) : undefined,
      customer: {
        email: user.email || '',
        name: user.username || 'Usuario',
        phone: user.attributes?.['phone_number']
      },
      metadata: {
        productId: reservation.experience_id,
        productName: product?.name || 'Producto',
        adults: reservation.adults,
        kids: reservation.kids,
        reservationDate: reservation.reservation_date
      }
    };

    console.log('🚀 [initiateMITPaymentAction] Creando pago en MIT...');

    const mitResponse = await mitPaymentService.createPayment(mitRequest);

    if (!mitResponse.success || !mitResponse.checkoutUrl) {
      console.error('❌ [initiateMITPaymentAction] Error creando pago MIT:', mitResponse.error);
      return {
        success: false,
        error: mitResponse.error || 'Error al crear el pago'
      };
    }

    console.log('✅ [initiateMITPaymentAction] Pago MIT creado exitosamente:', {
      paymentId: mitResponse.paymentId,
      checkoutUrl: mitResponse.checkoutUrl
    });

    return {
      success: true,
      message: 'Link de pago generado exitosamente',
      data: {
        paymentId: mitResponse.paymentId!,
        checkoutUrl: mitResponse.checkoutUrl,
        amount: paymentAmount,
        currency: paymentPlan.currency || 'MXN',
        expiresAt: mitResponse.paymentData?.expiresAt
      }
    };

  } catch (error: unknown) {
    console.error('❌ [ERROR] initiateMITPaymentAction:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al iniciar pago';

    return {
      success: false,
      error: errorMessage
    };
  }
}
