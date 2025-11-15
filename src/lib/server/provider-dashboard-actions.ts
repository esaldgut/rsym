'use server';

import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
// ✅ Usar imports desde GraphQL Code Generator (fuente única de verdad)
import {
  getReservationsBySUB,
  getProvidersPoliciesBySub,
  getPaymentPlan,
  getPaymentPlanByReservation
} from '@/graphql/operations';
import { getGraphQLClientWithIdToken, debugIdTokenClaims } from './amplify-graphql-client';
import type {
  Reservation,
  Policy,
  PaymentPlan
} from '@/generated/graphql';

// SIGUIENDO EXACTAMENTE EL PATTERN DE provider-products-actions.ts
// EXTENDED: Soporte para errores parciales de GraphQL
interface ServerActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  // Warnings para errores parciales de GraphQL (data exists pero con errores)
  warnings?: Array<{
    message: string;
    path?: readonly (string | number)[];
    extensions?: Record<string, unknown>;
  }>;
  hasPartialData?: boolean;
}

/**
 * Server Action para obtener reservaciones del proveedor
 * SIGUIENDO EL PATRÓN ESTABLECIDO DE provider-products-actions.ts
 */
export async function getProviderReservationsAction(): Promise<ServerActionResponse<Reservation[]>> {
  try {
    // 1. Validar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario'
      };
    }

    // 2. Validar permisos de proveedor (EXACTO COMO provider-products-actions.ts)
    const userType = user.attributes?.['custom:user_type'];
    if (userType !== 'provider') {
      console.log('❌ [Server Action] Usuario no es provider:', userType, 'User:', user.username);
      return {
        success: false,
        error: 'Solo los proveedores pueden acceder a esta información'
      };
    }

    console.log('🚀 [Server Action] Obteniendo reservaciones del proveedor:', user.sub);

    // 3. Debug de claims del idToken (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await debugIdTokenClaims();
    }

    // 4. Crear cliente GraphQL con idToken (necesario para validación de permisos en AppSync)
    const client = await getGraphQLClientWithIdToken();

    // 5. Ejecutar query GraphQL (el idToken ya está configurado en el cliente)
    const result = await client.graphql({
      query: getReservationsBySUB
    });

    // ⚡ MANEJO ROBUSTO DE ERRORES PARCIALES DE GRAPHQL
    const reservations = result.data?.getReservationsBySUB;

    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ [Server Action] GraphQL retornó errores parciales al obtener reservaciones:',
        result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      );

      // Si tenemos datos parciales, retornarlos con warnings
      if (reservations && reservations.length > 0) {
        console.log('✅ [Server Action] Reservaciones obtenidas con warnings:', reservations.length);
        return {
          success: true,
          data: reservations,
          hasPartialData: true,
          warnings: result.errors.map(e => ({
            message: e.message,
            path: e.path,
            extensions: e.extensions
          }))
        };
      }

      // Si NO hay datos, entonces sí es un error completo
      console.error('❌ [Server Action] Error en GraphQL sin datos:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al obtener las reservaciones'
      };
    }

    // Caso normal: datos sin errores
    if (reservations) {
      console.log('✅ [Server Action] Reservaciones obtenidas:', reservations.length);
      return {
        success: true,
        data: reservations
      };
    } else {
      return {
        success: false,
        error: 'No se pudieron obtener las reservaciones'
      };
    }

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error obteniendo reservaciones:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para obtener políticas del proveedor
 * SIGUIENDO EL PATRÓN ESTABLECIDO
 */
export async function getProviderPoliciesAction(): Promise<ServerActionResponse<Policy[]>> {
  try {
    // 1. Validar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario'
      };
    }

    // 2. Validar permisos de proveedor
    const userType = user.attributes?.['custom:user_type'];
    if (userType !== 'provider') {
      console.log('❌ [Server Action] Usuario no es provider:', userType, 'User:', user.username);
      return {
        success: false,
        error: 'Solo los proveedores pueden acceder a esta información'
      };
    }

    console.log('🚀 [Server Action] Obteniendo políticas del proveedor:', user.sub);

    // 3. Debug de claims del idToken (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await debugIdTokenClaims();
    }

    // 4. Crear cliente GraphQL con idToken
    const client = await getGraphQLClientWithIdToken();

    // 5. Ejecutar query GraphQL
    const result = await client.graphql({
      query: getProvidersPoliciesBySub
    });

    // ⚡ MANEJO ROBUSTO DE ERRORES PARCIALES DE GRAPHQL
    const policies = result.data?.getProvidersPoliciesBySub;

    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ [Server Action] GraphQL retornó errores parciales al obtener políticas:',
        result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      );

      // Si tenemos datos parciales, retornarlos con warnings
      if (policies && policies.length > 0) {
        console.log('✅ [Server Action] Políticas obtenidas con warnings:', policies.length);
        return {
          success: true,
          data: policies,
          hasPartialData: true,
          warnings: result.errors.map(e => ({
            message: e.message,
            path: e.path,
            extensions: e.extensions
          }))
        };
      }

      // Si NO hay datos, entonces sí es un error completo
      console.error('❌ [Server Action] Error en GraphQL sin datos:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al obtener las políticas'
      };
    }

    // Caso normal: datos sin errores
    if (policies) {
      console.log('✅ [Server Action] Políticas obtenidas:', policies.length);
      return {
        success: true,
        data: policies
      };
    } else {
      return {
        success: false,
        error: 'No se pudieron obtener las políticas'
      };
    }

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error obteniendo políticas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para obtener un plan de pago por ID
 * SIGUIENDO EL PATRÓN ESTABLECIDO
 */
export async function getPaymentPlanAction(paymentPlanId: string): Promise<ServerActionResponse<PaymentPlan>> {
  try {
    // 1. Validar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario'
      };
    }

    // 2. Validar permisos de proveedor
    const userType = user.attributes?.['custom:user_type'];
    if (userType !== 'provider') {
      console.log('❌ [Server Action] Usuario no es provider:', userType, 'User:', user.username);
      return {
        success: false,
        error: 'Solo los proveedores pueden acceder a esta información'
      };
    }

    // 3. Validar entrada
    if (!paymentPlanId?.trim()) {
      return {
        success: false,
        error: 'El ID del plan de pago es requerido'
      };
    }

    console.log('🚀 [Server Action] Obteniendo plan de pago:', paymentPlanId, 'Usuario:', user.sub);

    // 4. Debug de claims del idToken (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await debugIdTokenClaims();
    }

    // 5. Crear cliente GraphQL con idToken
    const client = await getGraphQLClientWithIdToken();

    // 6. Ejecutar query GraphQL
    const result = await client.graphql({
      query: getPaymentPlan,
      variables: { id: paymentPlanId }
    });

    // ⚡ MANEJO ROBUSTO DE ERRORES PARCIALES DE GRAPHQL
    const paymentPlan = result.data?.getPaymentPlan;

    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ [Server Action] GraphQL retornó errores parciales al obtener plan de pago:',
        result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      );

      // Si tenemos datos parciales del plan, retornarlos con warnings
      if (paymentPlan && paymentPlan.id) {
        console.log('✅ [Server Action] Plan de pago obtenido con warnings:', paymentPlan.id);
        return {
          success: true,
          data: paymentPlan,
          hasPartialData: true,
          warnings: result.errors.map(e => ({
            message: e.message,
            path: e.path,
            extensions: e.extensions
          }))
        };
      }

      // Si NO hay datos, entonces sí es un error completo
      console.error('❌ [Server Action] Error en GraphQL sin datos:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al obtener el plan de pago'
      };
    }

    // Caso normal: datos sin errores
    if (paymentPlan) {
      console.log('✅ [Server Action] Plan de pago obtenido:', paymentPlan.id);
      return {
        success: true,
        data: paymentPlan
      };
    } else {
      return {
        success: false,
        error: 'Plan de pago no encontrado'
      };
    }

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error obteniendo plan de pago:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para obtener plan de pago por ID de reservación
 * SIGUIENDO EL PATRÓN ESTABLECIDO
 */
export async function getPaymentPlanByReservationAction(reservationId: string): Promise<ServerActionResponse<PaymentPlan>> {
  try {
    // 1. Validar autenticación
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario'
      };
    }

    // 2. Validar permisos de proveedor
    const userType = user.attributes?.['custom:user_type'];
    if (userType !== 'provider') {
      console.log('❌ [Server Action] Usuario no es provider:', userType, 'User:', user.username);
      return {
        success: false,
        error: 'Solo los proveedores pueden acceder a esta información'
      };
    }

    // 3. Validar entrada
    if (!reservationId?.trim()) {
      return {
        success: false,
        error: 'El ID de la reservación es requerido'
      };
    }

    console.log('🚀 [Server Action] Obteniendo plan de pago por reservación:', reservationId, 'Usuario:', user.sub);

    // 4. Debug de claims del idToken (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await debugIdTokenClaims();
    }

    // 5. Crear cliente GraphQL con idToken
    const client = await getGraphQLClientWithIdToken();

    // 6. Ejecutar query GraphQL
    const result = await client.graphql({
      query: getPaymentPlanByReservation,
      variables: { reservation_id: reservationId }
    });

    // ⚡ MANEJO ROBUSTO DE ERRORES PARCIALES DE GRAPHQL
    const paymentPlan = result.data?.getPaymentPlanByReservation;

    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ [Server Action] GraphQL retornó errores parciales al obtener plan de pago por reservación:',
        result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      );

      // Si tenemos datos parciales del plan, retornarlos con warnings
      if (paymentPlan && paymentPlan.id) {
        console.log('✅ [Server Action] Plan de pago obtenido con warnings:', paymentPlan.id);
        return {
          success: true,
          data: paymentPlan,
          hasPartialData: true,
          warnings: result.errors.map(e => ({
            message: e.message,
            path: e.path,
            extensions: e.extensions
          }))
        };
      }

      // Si NO hay datos, entonces sí es un error completo
      console.error('❌ [Server Action] Error en GraphQL sin datos:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al obtener el plan de pago'
      };
    }

    // Caso normal: datos sin errores
    if (paymentPlan) {
      console.log('✅ [Server Action] Plan de pago obtenido:', paymentPlan.id);
      return {
        success: true,
        data: paymentPlan
      };
    } else {
      return {
        success: false,
        error: 'Plan de pago no encontrado para esta reservación'
      };
    }

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error obteniendo plan de pago por reservación:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}
