'use server';

import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { Amplify } from 'aws-amplify';
import { cookies } from 'next/headers';
import { getIdTokenServer } from '@/utils/amplify-server-utils';
import outputs from '../../../amplify/outputs.json';
import type { Schema } from '@/amplify/data/resource';

// Configurar Amplify una sola vez
Amplify.configure(outputs, { ssr: true });

/**
 * Cliente GraphQL para Server Actions que requieren autenticación básica
 * Usa accessToken (comportamiento por defecto)
 * Para: queries públicas, marketplace, etc.
 */
export async function getGraphQLClientWithCookies() {
  const cookiesStore = await cookies();
  return generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies: () => cookiesStore
  });
}

/**
 * Cliente GraphQL para Server Actions que requieren idToken con claims completos
 * Usa idToken explícitamente (necesario para validación de grupos y custom attributes)
 * Para: provider routes, admin routes, operaciones que validan permisos en AppSync
 *
 * IMPORTANTE: AppSync valida los siguientes claims del idToken:
 * - cognito:groups (ej: ['providers', 'admins'])
 * - custom:user_type (ej: 'provider', 'consumer')
 * - custom:provider_is_approved (para providers)
 *
 * SOLUCIÓN: Wrapper personalizado que inyecta idToken en cada operación GraphQL
 * Basado en el patrón recomendado de AWS para Next.js 15 con Server Actions
 */
export async function getGraphQLClientWithIdToken() {
  const idToken = await getIdTokenServer();

  if (!idToken) {
    throw new Error('No se pudo obtener el token de autenticación (idToken)');
  }

  // Crear cliente base con cookies (usa accessToken por defecto)
  const cookiesStore = await cookies();
  const baseClient = generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies: () => cookiesStore
  });

  // PATRÓN WRAPPER: Retornar un objeto que simula el cliente pero
  // inyecta el idToken en cada operación GraphQL
  return {
    graphql: async (options: {
      query: any;
      variables?: any;
      authMode?: string;
      authToken?: string;
    }) => {
      // CRÍTICO: Pasar el idToken en cada operación individual
      // No en la configuración del cliente
      const optionsWithIdToken = {
        ...options,
        authMode: 'userPool' as const,
        authToken: idToken.toString()
      };

      try {
        // Ejecutar la operación con el idToken
        const result = await baseClient.graphql(optionsWithIdToken);
        return result;
      } catch (error) {
        console.error('❌ GraphQL operation with idToken failed:', error);
        throw error;
      }
    }
  };
}

/**
 * Helper para debugging: Decodifica y loguea los claims del idToken
 * Útil para verificar qué información está disponible en el token
 */
export async function debugIdTokenClaims() {
  const idToken = await getIdTokenServer();

  if (!idToken) {
    console.log('❌ No hay idToken disponible');
    return null;
  }

  const parts = idToken.toString().split('.');
  if (parts.length !== 3) {
    console.log('❌ idToken malformado');
    return null;
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

  const claims = {
    sub: payload.sub,
    username: payload['cognito:username'],
    email: payload.email,
    groups: payload['cognito:groups'],
    userType: payload['custom:user_type'],
    providerApproved: payload['custom:provider_is_approved'],
    exp: new Date(payload.exp * 1000).toISOString(),
    iat: new Date(payload.iat * 1000).toISOString()
  };

  console.log('🔍 [DEBUG] idToken claims:', claims);
  return claims;
}

/**
 * Determina automáticamente qué cliente usar basado en el tipo de query
 * @param requiresPermissionValidation - Si la query valida permisos en AppSync
 */
export async function getSmartGraphQLClient(requiresPermissionValidation: boolean = false) {
  if (requiresPermissionValidation) {
    return getGraphQLClientWithIdToken();
  }
  return getGraphQLClientWithCookies();
}