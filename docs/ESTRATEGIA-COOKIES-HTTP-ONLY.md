# Estrategia de Implementación: Cookies HTTP-only con Amplify SSR

## Objetivo
Migrar de localStorage a cookies HTTP-only para almacenar tokens de sesión, mejorando la seguridad contra ataques XSS.

## Arquitectura Actual vs Propuesta

### Estado Actual
- **Almacenamiento**: localStorage (vulnerable a XSS)
- **Configuración**: Client-side only
- **Tokens**: Accesibles vía JavaScript

### Estado Propuesto
- **Almacenamiento**: Cookies HTTP-only
- **Configuración**: SSR con Next.js
- **Tokens**: No accesibles vía JavaScript

## Plan de Implementación

### Fase 1: Configuración Base de SSR

#### 1.1 Actualizar configuración de Amplify
```typescript
// src/app/amplify-config-ssr.ts
import { Amplify } from 'aws-amplify';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import outputs from '../../amplify/outputs.json';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs
});

// Configuración para el cliente con cookieStorage
export const amplifyConfig = {
  ...outputs,
  ssr: true,
  Auth: {
    ...outputs.auth,
    cookieStorage: {
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 'localhost',
      path: '/',
      expires: 7, // días
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production'
    }
  }
};
```

#### 1.2 Crear middleware de Next.js
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { runWithAmplifyServerContext } from './app/amplify-config-ssr';
import { fetchAuthSession } from 'aws-amplify/auth/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    try {
      const authenticated = await runWithAmplifyServerContext({
        nextServerContext: { request, response },
        operation: async (contextSpec) => {
          try {
            const session = await fetchAuthSession(contextSpec);
            return !!session.tokens?.idToken;
          } catch {
            return false;
          }
        }
      });

      if (!authenticated) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    } catch (error) {
      console.error('Middleware auth check failed:', error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
```

### Fase 2: Actualizar Componentes

#### 2.1 Modificar amplify-client-config.tsx
```typescript
// src/app/amplify-client-config.tsx
'use client';

import { Amplify } from 'aws-amplify';
import { amplifyConfig } from './amplify-config-ssr';

Amplify.configure(amplifyConfig, { ssr: true });

export function ConfigureAmplifyClientSide() {
  return null;
}
```

#### 2.2 Crear utilidades para Server Components
```typescript
// src/utils/amplify-server-utils.ts
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/app/amplify-config-ssr';
import { 
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser 
} from 'aws-amplify/auth/server';

export async function getServerSession() {
  return await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec);
        return session;
      } catch (error) {
        console.error('Failed to get server session:', error);
        return null;
      }
    }
  });
}

export async function getAuthenticatedUser() {
  return await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        const user = await getCurrentUser(contextSpec);
        const attributes = await fetchUserAttributes(contextSpec);
        return { user, attributes };
      } catch {
        return null;
      }
    }
  });
}
```

### Fase 3: Migrar Hooks y Componentes

#### 3.1 Actualizar useAmplifyAuth para SSR
```typescript
// src/hooks/useAmplifyAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { 
  getCurrentUser, 
  fetchAuthSession, 
  signOut, 
  fetchUserAttributes 
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

// El hook permanece similar pero ahora funciona con cookies
// Los tokens ya no son accesibles directamente desde JavaScript
export function useAmplifyAuth() {
  // ... implementación existente
  // Amplify automáticamente usa cookies cuando ssr: true
}
```

### Fase 4: Configuración de Seguridad

#### 4.1 Variables de entorno
```env
# .env.local
NEXT_PUBLIC_COOKIE_DOMAIN=yaan.com.mx
NEXT_PUBLIC_APP_ENV=production
```

#### 4.2 Headers de seguridad en next.config.mjs
```javascript
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }
];
```

## Consideraciones de Migración

### 1. Compatibilidad
- Los componentes existentes seguirán funcionando
- La migración es transparente para el código de la aplicación
- Solo cambia el mecanismo de almacenamiento subyacente

### 2. Testing
- Probar en desarrollo con `secure: false`
- Verificar que las cookies se establecen correctamente
- Confirmar que no hay acceso a tokens vía JavaScript

### 3. Despliegue
- Desplegar primero en staging
- Monitorear logs de autenticación
- Tener plan de rollback si es necesario

## Ventajas de la Implementación

1. **Seguridad mejorada**: Tokens no accesibles vía XSS
2. **SSR habilitado**: Mejor SEO y rendimiento inicial
3. **Gestión automática**: Amplify maneja renovación de tokens
4. **Compatibilidad**: Funciona con la infraestructura CDK existente

## Cronograma Sugerido

- **Semana 1**: Implementar Fase 1 y 2 en desarrollo
- **Semana 2**: Fase 3 y testing exhaustivo
- **Semana 3**: Fase 4 y despliegue en staging
- **Semana 4**: Monitoreo y despliegue en producción

## Notas Importantes

1. **No requiere cambios en CDK**: La configuración del User Pool permanece igual
2. **Compatibilidad OAuth**: Los providers externos seguirán funcionando
3. **Sesión compartida**: Las cookies permiten SSO entre subdominios