import { generateClient } from 'aws-amplify/api';
import { GraphQLResult } from '@aws-amplify/api-graphql';

// Cliente GraphQL para operaciones client-side
// CRÍTICO: Este cliente usará ID Token gracias a la configuración authTokenType en amplify-client-config.tsx
// Esto permite que los resolvers AppSync accedan a identity claims del usuario
export const graphqlClient = generateClient();

// Tipo base para operaciones GraphQL
export interface GraphQLOperation {
  query: string;
  variables?: Record<string, any>;
}

// Función helper para ejecutar queries client-side
export async function executeQuery<T = any>(
  operation: GraphQLOperation
): Promise<T> {
  try {
    const result = await graphqlClient.graphql({
      query: operation.query,
      variables: operation.variables,
    }) as GraphQLResult<T>;

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    return result.data as T;
  } catch (error) {
    console.error('GraphQL Error:', error);
    throw error;
  }
}

// Función helper para ejecutar mutations client-side
export async function executeMutation<T = any>(
  operation: GraphQLOperation
): Promise<T> {
  try {
    const result = await graphqlClient.graphql({
      query: operation.query,
      variables: operation.variables,
    }) as GraphQLResult<T>;

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL mutation errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    return result.data as T;
  } catch (error) {
    console.error('GraphQL Mutation Error:', error);
    throw error;
  }
}
