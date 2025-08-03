# ✅ Implementación OAuth con Amplify v6 + Next.js 15.3.4

## 📚 Basado en Documentación Oficial

- [Listen to Auth events - AWS Amplify Gen 2](https://docs.amplify.aws/react/build-a-backend/auth/connect-your-frontend/listen-to-auth-events/)
- [Server-Side Rendering - Next.js - AWS Amplify Gen 2](https://docs.amplify.aws/nextjs/build-a-backend/server-side-rendering/)

## 🔧 Solución Implementada

### 1. **Import Crítico para OAuth** ⚡

```typescript
// src/app/layout.tsx
import 'aws-amplify/auth/enable-oauth-listener';
```

**IMPORTANTE**: Este import es **obligatorio** para aplicaciones multi-página o SPAs con routing. Sin él, OAuth no funcionará correctamente.

### 2. **OAuthHandler Component** 🎯

Creado componente dedicado para manejar eventos Hub:

```typescript
// src/components/auth/OAuthHandler.tsx
import { Hub } from 'aws-amplify/utils';

export function OAuthHandler() {
  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signInWithRedirect':
          // OAuth exitoso - redirigir a dashboard
          router.push('/dashboard');
          break;
        case 'signInWithRedirect_failure':
          // OAuth falló - redirigir a auth con error
          router.push('/auth?error=oauth_failed');
          break;
        // otros eventos...
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return null;
}
```

### 3. **Configuración OAuth en outputs.json** 📝

```json
{
  "oauth": {
    "identity_providers": ["GOOGLE", "Apple", "Facebook"],
    "domain": "auth.yaan.com.mx",
    "scopes": ["email", "openid", "profile"],
    "redirect_sign_in": "http://localhost:3000/oauth2/idpresponse,https://yaan.com.mx/oauth2/idpresponse",
    "redirect_sign_out": "http://localhost:3000/,https://yaan.com.mx/",
    "response_type": "code"
  }
}
```

### 4. **Página OAuth Callback Simplificada** 🔄

```typescript
// src/app/oauth2/idpresponse/page.tsx
export default function OAuth2IdpResponse() {
  useEffect(() => {
    // NO hacer redirects - Hub.listen maneja todo
    console.log('📍 OAuth callback received');
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600"></div>
      <h2>Completando autenticación</h2>
    </div>
  );
}
```

### 5. **Hook useServerAuth Actualizado** 🔐

```typescript
// src/hooks/useServerAuth.ts
useEffect(() => {
  const hubListener = Hub.listen('auth', ({ payload }) => {
    switch (payload.event) {
      case 'signInWithRedirect':
        // OAuth completado exitosamente
        refreshAuthState();
        break;
      case 'signInWithRedirect_failure':
        // OAuth falló
        setAuthState({ isAuthenticated: false });
        break;
    }
  });
  
  return () => hubListener();
}, []);
```

## 🎯 Flujo OAuth Completo

1. **Usuario hace clic en "Sign in with Apple"**
   - Se ejecuta `signInWithRedirect({ provider: 'Apple' })`
   - Usuario es redirigido a Apple ID

2. **Usuario se autentica en Apple**
   - Apple redirige a `/oauth2/idpresponse?code=XXX&state=YYY`

3. **Amplify procesa automáticamente**
   - El import `enable-oauth-listener` detecta los parámetros
   - Intercambia code por tokens con Cognito

4. **Hub emite evento**
   - `signInWithRedirect` si es exitoso
   - `signInWithRedirect_failure` si falla

5. **OAuthHandler maneja el evento**
   - Redirige a `/dashboard` si es exitoso
   - Redirige a `/auth?error=...` si falla

## 📋 Eventos Hub Disponibles

| Evento | Descripción |
|--------|-------------|
| `signInWithRedirect` | OAuth completado exitosamente |
| `signInWithRedirect_failure` | OAuth falló |
| `customOAuthState` | Estado personalizado recibido |
| `signedIn` | Usuario autenticado (cualquier método) |
| `signedOut` | Usuario cerró sesión |
| `tokenRefresh` | Token renovado exitosamente |
| `tokenRefresh_failure` | Fallo al renovar token |

## ⚠️ Errores Comunes y Soluciones

### 1. **"oauth param not configured"**
- **Causa**: Falta el import `enable-oauth-listener`
- **Solución**: Agregar import en layout.tsx

### 2. **Página queda en "Bienvenido de vuelta"**
- **Causa**: No se están escuchando eventos Hub
- **Solución**: Implementar OAuthHandler

### 3. **AmplifyServerContextError**
- **Causa**: Configuración incorrecta del contexto
- **Solución**: Usar `outputs` directamente

### 4. **No redirect después de OAuth**
- **Causa**: Redirect manual en `/oauth2/idpresponse`
- **Solución**: Dejar que Hub.listen maneje todo

## 🛡️ Mejores Prácticas

1. **No hacer redirects manuales** en `/oauth2/idpresponse`
2. **Centralizar manejo de eventos** en OAuthHandler
3. **Evitar duplicación** de lógica de autenticación
4. **Usar Hub.listen** para todos los eventos de auth
5. **Mantener middleware** como única fuente de autorización

## ✅ Verificación

Para verificar que OAuth funciona:

1. Abrir consola del navegador
2. Hacer clic en "Sign in with Apple"
3. Verificar logs:
   ```
   🔐 OAuthHandler: Inicializando listener
   📍 OAuth callback received
   📡 OAuthHandler: Evento recibido: signInWithRedirect
   ✅ OAuth sign in successful
   ```
4. Usuario debe ser redirigido a `/dashboard`

## 🚀 Resultado

Con esta implementación:
- ✅ OAuth funciona correctamente con todos los providers
- ✅ Hub.listen maneja todos los eventos de autenticación
- ✅ No hay conflictos de redirect
- ✅ Flujo de autenticación es consistente
- ✅ Cumple con las mejores prácticas de AWS Amplify v6