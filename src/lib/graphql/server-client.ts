import { generateClient } from 'aws-amplify/api';
import { cookies } from 'next/headers';
import outputs from '../../../amplify/outputs.json';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { runWithAmplifyServerContext } from '@/app/amplify-config-ssr';
import { fetchAuthSession } from 'aws-amplify/auth/server';


/**
 * Interfaz para operaciones GraphQL genéricas
 */
interface GraphQLOperationOptions {
  query: string;
  variables?: Record<string, any>;
}

/**
 * Resultado de operación GraphQL con éxito/error
 */
interface GraphQLOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Función genérica para ejecutar operaciones GraphQL (queries y mutations)
 * Compatible con Amplify Gen 2 v6 usando fetchAuthSession y ID token correcto
 */
export async function executeGraphQLOperation<T = any>(
  options: GraphQLOperationOptions
): Promise<GraphQLOperationResult<T>> {
  try {
    const { cookies: cookieStore } = await import('next/headers');
    
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies: cookieStore },
      operation: async (contextSpec) => {
        // 1. Configurar Amplify con la configuración correcta
        const { Amplify } = await import('aws-amplify');
        Amplify.configure(outputs, { ssr: true });

        // 2. Obtener la sesión de autenticación con ID token
        const session = await fetchAuthSession(contextSpec);
        
        if (!session.tokens?.idToken) {
          throw new Error('No se encontró ID token en la sesión');
        }

        // 3. Generar cliente con el ID token correcto
        const client = generateClient({
          authMode: 'userPool',
          authToken: session.tokens.idToken.toString()
        });

        // 4. Ejecutar operación GraphQL
        const response = await client.graphql({
          query: options.query,
          variables: options.variables
        });

        return response;
      }
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'GraphQL error',
        data: result.data
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Error ejecutando operación GraphQL en servidor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}