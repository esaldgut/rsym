'use client';

import { Amplify } from 'aws-amplify';
import { amplifyConfig } from './amplify-config-ssr';

// Configuración de Amplify con SSR y cookies HTTP-only
// NOTA: Cookies HTTP-only ACTIVADAS para máxima seguridad
const USE_HTTP_ONLY_COOKIES = true; // ✅ Cookies HTTP-only activadas

if (USE_HTTP_ONLY_COOKIES) {
  Amplify.configure(amplifyConfig, { ssr: true });
} else {
  // Configuración actual (localStorage)
  import('../../amplify/outputs.json').then(outputs => {
    Amplify.configure(outputs.default);
  });
}

export function ConfigureAmplifyClientSide() {
  return null;
}
