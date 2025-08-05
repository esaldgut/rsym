import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';

/**
 * Este archivo no se usa para despliegue ya que los recursos
 * se provisionan con AWS CDK Go v2 en otro repositorio.
 * Solo mantenemos data/resource.ts para referencia del esquema.
 */
defineBackend({
  data,
});
