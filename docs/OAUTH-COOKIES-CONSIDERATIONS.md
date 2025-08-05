# Consideraciones de OAuth con Cookies HTTP-only

## Resumen
Al migrar a cookies HTTP-only, el flujo OAuth con proveedores externos (Google, Apple, Facebook) requiere consideraciones especiales.

## Flujo OAuth con Cookies

### 1. Proceso de Autenticación
```
Usuario → Click "Login con Google" → Redirect a Google → 
Google → Callback a /oauth2/idpresponse → 
Amplify → Establece cookies HTTP-only → 
App → Usuario autenticado
```

### 2. Configuración Necesaria

#### En amplify/outputs.json:
```json
{
  "oauth": {
    "domain": "auth.yaan.com.mx",
    "redirect_sign_in": "https://yaan.com.mx/oauth2/idpresponse",
    "redirect_sign_out": "https://yaan.com.mx/",
    "response_type": "code"
  }
}
```

#### En el componente OAuthHandler:
```typescript
// src/components/auth/OAuthHandler.tsx
'use client';

import { useEffect } from 'react';
import { Hub } from 'aws-amplify/utils';
import { useRouter } from 'next/navigation';

export function OAuthHandler() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signInWithRedirect':
          // OAuth iniciado
          break;
        case 'signInWithRedirect_success':
          // OAuth exitoso - cookies ya establecidas
          router.push('/dashboard');
          break;
        case 'signInWithRedirect_failure':
          // OAuth falló
          router.push('/auth/login?error=oauth_failed');
          break;
        case 'customOAuthState':
          // Estado personalizado del OAuth
          const state = payload.data;
          // Manejar estado si es necesario
          break;
      }
    });

    return unsubscribe;
  }, [router]);

  return null;
}
```

## Consideraciones de Seguridad

### 1. Dominios de Cookies
- **Desarrollo**: `domain: 'localhost'`
- **Producción**: `domain: '.yaan.com.mx'` (con punto para subdominios)

### 2. SameSite Policy
```typescript
cookieStorage: {
  sameSite: 'lax', // Permite OAuth redirects
  secure: true,    // HTTPS obligatorio en producción
}
```

### 3. CORS y Redirects
El dominio OAuth debe estar en la lista blanca:
- `https://auth.yaan.com.mx` (Cognito hosted UI)
- `https://yaan.com.mx` (Tu aplicación)

## Problemas Comunes y Soluciones

### 1. "Cookie not set after OAuth"
**Causa**: El dominio de la cookie no coincide con el dominio de la app
**Solución**: Verificar `NEXT_PUBLIC_COOKIE_DOMAIN`

### 2. "OAuth loop infinito"
**Causa**: Las cookies se están bloqueando por SameSite
**Solución**: Usar `sameSite: 'lax'` en lugar de 'strict'

### 3. "Session lost after redirect"
**Causa**: HTTPS/HTTP mismatch
**Solución**: Asegurar que todo use HTTPS en producción

## Testing OAuth con Cookies

### Desarrollo Local
1. Configurar OAuth callback a `http://localhost:3000/oauth2/idpresponse`
2. Usar `secure: false` en cookieStorage
3. Verificar en DevTools > Application > Cookies

### Producción
1. Verificar certificados SSL
2. Confirmar dominios en Cognito User Pool
3. Monitorear logs de autenticación

## Migración Gradual

### Fase 1: Desarrollo
```typescript
const USE_HTTP_ONLY_COOKIES = process.env.NODE_ENV === 'development';
```

### Fase 2: Staging
```typescript
const USE_HTTP_ONLY_COOKIES = process.env.NEXT_PUBLIC_ENABLE_SECURE_COOKIES === 'true';
```

### Fase 3: Producción
```typescript
const USE_HTTP_ONLY_COOKIES = true;
```

## Checklist Pre-Producción

- [ ] OAuth callbacks actualizados en proveedores
- [ ] Dominio de cookies configurado correctamente
- [ ] HTTPS habilitado en todos los endpoints
- [ ] SameSite policy probada con OAuth
- [ ] Logs de autenticación monitoreados
- [ ] Plan de rollback preparado