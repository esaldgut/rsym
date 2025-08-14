'use client';

import { generateClient } from 'aws-amplify/api';
import type { GraphQLResult } from '@aws-amplify/api-graphql';

/**
 * Cliente GraphQL configurado con AWS Amplify v6
 * Usa autenticación automática de Cognito
 */
const client = generateClient();

/**
 * Ejecuta una query GraphQL con manejo de errores
 */
export async function executeQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T | null> {
  try {
    const result = await client.graphql({
      query,
      variables
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
 */
export async function executeMutation<T = any>(
  mutation: string,
  variables?: Record<string, any>
): Promise<T | null> {
  try {
    const result = await client.graphql({
      query: mutation,
      variables
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