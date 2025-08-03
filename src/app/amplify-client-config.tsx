// src/app/amplify-client-config.tsx
'use client';

import { Amplify } from 'aws-amplify';
import outputs from '../../amplify/outputs.json';

// CRÍTICO: Usar outputs directamente según documentación oficial Amplify v6
Amplify.configure(outputs, {
  ssr: true
});

// Debug logging removido para producción - información sensible

export function ConfigureAmplifyClientSide() {
  return null;
}
