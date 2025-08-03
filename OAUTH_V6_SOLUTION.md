# 🍎 Solución OAuth AWS Amplify v6 - YAAN Web App

## ✅ **Problema Resuelto**

**Error Original**: `OAuthNotConfigureException: oauth param not configured`

**Causa**: La configuración OAuth no estaba en el formato correcto para AWS Amplify v6

---

## 🔧 **Solución Implementada**

### **1. Configuración Amplify v6 Correcta**

El problema principal era que Amplify v6 requiere una estructura específica para OAuth dentro de `Auth.Cognito.loginWith.oauth`, no como un objeto separado.

**Antes (incorrecto):**
```json
{
  "auth": {
    "oauth": {
      "identity_providers": ["GOOGLE", "Apple", "Facebook"],
      "domain": "auth.yaan.com.mx"
    }
  }
}
```

**Después (correcto para v6):**
```javascript
// src/app/amplify-client-config.tsx
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: outputs.auth.user_pool_id,
      userPoolClientId: outputs.auth.user_pool_client_id,
      identityPoolId: outputs.auth.identity_pool_id,
      loginWith: {
        oauth: {
          domain: 'auth.yaan.com.mx',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['http://localhost:3000/auth', 'https://yaan.com.mx/auth'],
          redirectSignOut: ['http://localhost:3000/', 'https://yaan.com.mx/'],
          responseType: 'code',
          providers: ['Google', 'Facebook', 'Apple']
        },
        email: true,
        username: false
      }
    }
  }
};

Amplify.configure(amplifyConfig, { ssr: true });
```

### **2. Configuración del Servidor**

Actualizada `src/lib/amplify-server-utils.ts` para usar el mismo formato:

```javascript
const serverConfig = {
  Auth: {
    Cognito: {
      userPoolId: outputs.auth.user_pool_id,
      userPoolClientId: outputs.auth.user_pool_client_id,
      identityPoolId: outputs.auth.identity_pool_id,
      loginWith: {
        oauth: {
          domain: 'auth.yaan.com.mx',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['http://localhost:3000/auth', 'https://yaan.com.mx/auth'],
          redirectSignOut: ['http://localhost:3000/', 'https://yaan.com.mx/'],
          responseType: 'code',
          providers: ['Google', 'Facebook', 'Apple']
        }
      }
    }
  }
};

export const { runWithAmplifyServerContext } = createServerRunner({
  config: serverConfig,
});
```

### **3. Componentes Actualizados**

#### **SocialAuthButtons** (usando `useSocialAuth` hook)
```typescript
import { useSocialAuth, SocialProvider } from '../../hooks/useSocialAuth';

const handleSocialSignIn = async (provider: SocialProvider) => {
  await signInWithProvider(provider);
};
```

#### **OAuthCallback** (manejo de returns)
```typescript
// Procesa callbacks de OAuth automáticamente
// Maneja códigos, errores y redirecciones
// Integra con Hub events de Amplify
```

#### **OAuthDiagnostic** (herramienta de debug)
```typescript
// Muestra configuración OAuth en tiempo real
// Panel de debug visible solo en desarrollo
// Verifica que Amplify.getConfig() tenga OAuth
```

---

## 🎯 **Flujo OAuth Correcto**

### **Paso a Paso:**
1. **Usuario hace clic** en "Continuar con Apple"
2. **`signInWithRedirect({ provider: 'Apple' })`** se ejecuta
3. **Amplify v6** usa `Auth.Cognito.loginWith.oauth` para configurar redirect
4. **Usuario va a Apple ID** para autenticarse
5. **Apple redirige** a `https://auth.yaan.com.mx/oauth2/idpresponse`
6. **Cognito procesa** la respuesta de Apple
7. **Cognito redirige** a `http://localhost:3000/auth?code=...`
8. **`OAuthCallback`** detecta el código y procesa
9. **Hub events** notifican `signInWithRedirect` completado
10. **Usuario redirigido** a `/dashboard`

---

## 🛠️ **Herramientas de Debug**

### **1. Panel de Diagnóstico OAuth**
- Ubicación: Botón flotante en `/auth` (solo desarrollo)
- Muestra: Configuración actual de `Amplify.getConfig()`
- Verifica: Estructura correcta de OAuth
- Enlaces: Tests directos a Cognito

### **2. Console Logs**
```javascript
// En desarrollo, verifica que aparezca:
console.log('Amplify v6 Configuration:', {
  userPoolId: amplifyConfig.Auth.Cognito.userPoolId,
  oauth: amplifyConfig.Auth.Cognito.loginWith.oauth
});
```

### **3. URLs de Test Directo**
```
Localhost: https://auth.yaan.com.mx/login?client_id=pi3jecnooc25adjrdrj5m80it&response_type=code&scope=email+openid+profile&redirect_uri=http%3A//localhost%3A3000/auth

Producción: https://auth.yaan.com.mx/login?client_id=pi3jecnooc25adjrdrj5m80it&response_type=code&scope=email+openid+profile&redirect_uri=https%3A//yaan.com.mx/auth
```

---

## ✅ **Verificación de la Solución**

### **1. Test en Desarrollo**
```bash
npm run dev
# Abrir http://localhost:3000/auth
# Hacer clic en botón "OAuth ✓" (esquina inferior derecha)
# Verificar que muestra configuración OAuth
# Probar "Continuar con Apple"
```

### **2. Validación de Configuración**
```javascript
// En DevTools Console:
Amplify.getConfig().Auth.Cognito.loginWith.oauth
// Debe mostrar: { domain: 'auth.yaan.com.mx', providers: [...], ... }
```

### **3. Test de Botones Sociales**
- ✅ No más `OAuthNotConfigureException`
- ✅ Redirect funciona correctamente
- ✅ Callback se procesa automáticamente
- ✅ Usuario termina en `/dashboard`

---

## 🔑 **Puntos Clave de la Solución**

### **Formato v6 vs Formato Legacy**
- **v6**: `Auth.Cognito.loginWith.oauth`
- **Legacy**: `Auth.oauth` o configuración plana

### **Configuración Separada**
- **Cliente**: `amplify-client-config.tsx` 
- **Servidor**: `amplify-server-utils.ts`
- **Ambos** deben usar el mismo formato

### **Compatibilidad SSR**
- Configuración funciona tanto en cliente como servidor
- Middleware usa la misma configuración
- Sin conflictos entre SSR y CSR

---

## 📚 **Referencias**

- [AWS Amplify v6 Auth Documentation](https://docs.amplify.aws/react/build-a-backend/auth/)
- [signInWithRedirect v6](https://docs.amplify.aws/react/build-a-backend/auth/connect-your-frontend/sign-in/#social-sign-in-web-only)
- [OAuth Configuration Schema](https://amplify.aws/2024-02/outputs-schema.json)

---

## 🚀 **Implementación Alternativa: OAuth Directo**

### **Replicación del Flujo OAuth sin Amplify SDK**

Cuando Amplify SDK presenta problemas de configuración, podemos usar URLs OAuth directas que replican el comportamiento exacto de Cognito Hosted UI:

#### **1. Helper Functions** (`src/utils/oauth-helpers.ts`)
```typescript
export function generateOAuthUrl(provider: 'Apple' | 'Google' | 'Facebook') {
  const baseUrl = 'https://auth.yaan.com.mx/oauth2/authorize';
  const clientId = 'pi3jecnooc25adjrdrj5m80it';
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth`);
  const responseType = 'code';
  const scope = encodeURIComponent('email openid profile');
  
  const identityProviderMap = {
    'Apple': 'SignInWithApple',
    'Google': 'Google', 
    'Facebook': 'Facebook'
  };

  const identityProvider = identityProviderMap[provider];

  const oauthUrl = `${baseUrl}?` + 
    `identity_provider=${identityProvider}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=${responseType}&` +
    `client_id=${clientId}&` +
    `scope=${scope}&` +
    `state=${encodeURIComponent(state)}`;

  return oauthUrl;
}
```

#### **2. Componente DirectOAuthButtons**
Permite probar el flujo OAuth directamente sin depender de la configuración de Amplify:
- Genera URLs OAuth correctas para cada proveedor
- Incluye botón directo a Cognito Hosted UI
- Útil para debugging y como fallback

#### **3. URLs Generadas**
Las URLs replican exactamente el flujo de Cognito:
```
https://auth.yaan.com.mx/oauth2/authorize?
  identity_provider=SignInWithApple&
  redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth&
  response_type=code&
  client_id=pi3jecnooc25adjrdrj5m80it&
  scope=email%20openid%20profile&
  state={base64_encoded_state}
```

### **Flujo Completo Replicado**
1. **Click en botón OAuth directo** → Genera URL con parámetros correctos
2. **Redirect a Cognito** → `/oauth2/authorize` con `identity_provider`
3. **Cognito redirect a Apple/Google/Facebook** → Usando configuración del IDP
4. **Proveedor autentica usuario** → En su interfaz nativa
5. **Return a Cognito** → `/oauth2/idpresponse` 
6. **Cognito procesa y redirect a app** → `/auth?code=xxx&state=xxx`
7. **OAuth2Callback procesa** → Detecta código y completa autenticación

---

## 🎉 **Resultado Final**

- ✅ **OAuth completamente funcional** con Apple, Google, Facebook
- ✅ **Amplify v6 configuración correcta** implementada
- ✅ **Implementación alternativa OAuth directo** sin SDK
- ✅ **Herramientas de debug** para futuro mantenimiento
- ✅ **Documentación completa** para referencia
- ✅ **Compatibilidad SSR** garantizada
- ✅ **Fallback robusto** cuando Amplify falla

**El error `OAuthNotConfigureException` está completamente resuelto con múltiples estrategias.**