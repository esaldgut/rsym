import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import { type Schema } from '@/amplify/data/resource';
import outputs from '../../../amplify/outputs.json';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { getIdTokenServer } from '@/utils/amplify-server-utils';

/**
 * Cliente GraphQL para uso en Server Components
 * Automáticamente incluye el ID token desde cookies HTTP-only
 */
export const serverClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
  authMode: 'userPool', // Usar autenticación de Cognito User Pool con ID token
});

/**
 * Ejecuta una query GraphQL desde el servidor
 * Incluye automáticamente el ID token en la petición
 */
export async function executeServerQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T | null> {
  try {
    // Verificar que tengamos un ID token válido
    const idToken = await getIdTokenServer();
    if (!idToken) {
      console.error('No ID token disponible para petición GraphQL');
      return null;
    }

    const result = await serverClient.graphql({
      query,
      variables,
      authMode: 'userPool', // Asegurar que use el ID token
    }) as GraphQLResult<T>;

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }

    return result.data;
  } catch (error) {
    console.error('Error ejecutando query en servidor:', error);
    return null;
  }
}

/**
 * Ejecuta una mutation GraphQL desde el servidor
 * Incluye automáticamente el ID token en la petición
 */
export async function executeServerMutation<T = any>(
  mutation: string,
  variables?: Record<string, any>
): Promise<T | null> {
  try {
    // Verificar que tengamos un ID token válido
    const idToken = await getIdTokenServer();
    if (!idToken) {
      console.error('No ID token disponible para petición GraphQL');
      return null;
    }

    const result = await serverClient.graphql({
      query: mutation,
      variables,
      authMode: 'userPool', // Asegurar que use el ID token
    }) as GraphQLResult<T>;

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }

    return result.data;
  } catch (error) {
    console.error('Error ejecutando mutation en servidor:', error);
    return null;
  }
}