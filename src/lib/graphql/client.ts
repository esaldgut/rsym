'use client';

import { generateClient } from 'aws-amplify/api';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Cliente GraphQL configurado con AWS Amplify v6
 * Usa autenticación automática de Cognito con ID token
 */
const client = generateClient({
  authMode: 'userPool', // Usar ID token de Cognito User Pool
});

/**
 * Ejecuta una query GraphQL con manejo de errores
 * Verifica automáticamente que el usuario tenga un ID token válido
 */
export async function executeQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T | null> {
  try {
    // Verificar que el usuario tenga una sesión válida con ID token
    const session = await fetchAuthSession();
    if (!session.tokens?.idToken) {
      console.error('No hay ID token disponible. Usuario no autenticado.');
      return null;
    }

    const result = await client.graphql({
      query,
      variables,
      authMode: 'userPool', // Forzar uso de ID token
    }) as GraphQLResult<T>;

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }

    return result.data;
  } catch (error) {
    console.error('Error executing query:', error);
    return null;
  }
}

/**
 * Ejecuta una mutation GraphQL con manejo de errores
 * Verifica automáticamente que el usuario tenga un ID token válido
 */
export async function executeMutation<T = any>(
  mutation: string,
  variables?: Record<string, any>
): Promise<T | null> {
  try {
    // Verificar que el usuario tenga una sesión válida con ID token
    const session = await fetchAuthSession();
    if (!session.tokens?.idToken) {
      console.error('No hay ID token disponible. Usuario no autenticado.');
      return null;
    }

    const result = await client.graphql({
      query: mutation,
      variables,
      authMode: 'userPool', // Forzar uso de ID token
    }) as GraphQLResult<T>;

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }

    return result.data;
  } catch (error) {
    console.error('Error executing mutation:', error);
    return null;
  }
}

export { client };