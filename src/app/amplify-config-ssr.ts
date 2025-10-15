import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { ResourcesConfig } from 'aws-amplify';
import outputs from '../../amplify/outputs.json';

/**
 * Server Runner para operaciones de Amplify en server-side
 * Maneja automáticamente cookies HTTP-Only via @aws-amplify/adapter-nextjs
 * Usado en Server Components, Server Actions, y middleware
 */
export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs
});

/**
 * Configuración de Amplify para client-side y server-side
 * IMPORTANTE: Usar outputs directamente sin modificaciones
 * El Identity Pool requiere esta estructura exacta para funcionar correctamente
 *
 * outputs.json incluye:
 * - auth.user_pool_id
 * - auth.user_pool_client_id
 * - auth.identity_pool_id ← CRÍTICO para Storage operations
 * - storage.bucket_name
 * - data.url (AppSync GraphQL)
 */
export const amplifyConfig: ResourcesConfig = outputs;