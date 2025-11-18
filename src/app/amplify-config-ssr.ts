import { createServerRunner } from '@aws-amplify/adapter-nextjs';
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
 *
 * NOTA: Amplify Gen 2 usa outputs.json directamente
 * No se requiere tipar como ResourcesConfig (Gen 1)
 * TypeScript infiere el tipo correcto automáticamente
 */
export const amplifyConfig = outputs;