import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { ResourcesConfig } from 'aws-amplify';
import outputs from '../../amplify/outputs.json';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs
});

// CRÍTICO: Configuración completa para cookies HTTP-Only
// Esta configuración DEBE incluir el tokenProvider para funcionar correctamente
export const amplifyConfig: ResourcesConfig = outputs as ResourcesConfig;