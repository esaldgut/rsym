'use client';

import { Amplify } from 'aws-amplify';
import outputs from '../../amplify/outputs.json';

// Configuración única de Amplify usando outputs.json generado por CDK
Amplify.configure(outputs);

export function ConfigureAmplifyClientSide() {
  return null;
}
