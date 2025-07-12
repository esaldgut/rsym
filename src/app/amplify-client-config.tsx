// src/app/ammplify-client-config.tsx
'use client';

import { Amplify } from 'aws-amplify';
import config from '../../amplify/outputs.json';

Amplify.configure(config, {
  ssr: true
});

export function ConfigureAmplifyClientSide() {
  return null;
}
