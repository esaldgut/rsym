// src/app/amplify-client-config.tsx
'use client';

import { Amplify } from 'aws-amplify';
import outputs from '../../amplify/outputs.json';

// CRÍTICO: Usar outputs directamente según documentación oficial Amplify v6
Amplify.configure(outputs, {
  ssr: true
});

// Debug logging para verificar configuración OAuth
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔍 Amplify OAuth Config Debug:', {
    oauth: outputs.auth.oauth,
    identityProviders: outputs.auth.oauth.identity_providers,
    domain: outputs.auth.oauth.domain,
    scopes: outputs.auth.oauth.scopes
  });
}

export function ConfigureAmplifyClientSide() {
  return null;
}
