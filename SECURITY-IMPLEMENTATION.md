# Implementación de Seguridad - AWS Amplify con Next.js

## Resumen de Mejoras Implementadas

### 1. HTTP-Only Cookies ✅
- **Archivo**: `src/utils/amplify-server-utils.ts`
- **Implementación**: Configurado el adaptador de Next.js de Amplify para usar cookies HTTP-only
- **Beneficio**: Los tokens JWT no son accesibles desde JavaScript del cliente, previniendo ataques XSS

### 2. Autenticación Server-Side ✅
- **Archivo**: `middleware.ts`
- **Implementación**: Middleware actualizado para verificar autenticación usando `runWithAmplifyServerContext`
- **Rutas Protegidas**: `/dashboard`, `/profile`, `/settings`, `/moments`, `/marketplace`
- **Beneficio**: Validación de sesión en el servidor antes de renderizar páginas protegidas

### 3. OAuth con Apple Sign-In ✅
- **Archivos**: 
  - `src/lib/auth/oauth-config.ts` - Configuración OAuth
  - `src/components/auth/AppleSignInButton.tsx` - Componente UI
  - `src/app/api/auth/oauth/route.ts` - Handler de callbacks
- **Beneficio**: Autenticación federada segura con proveedores externos

### 4. ID Token en Todas las Peticiones API ✅
- **Archivos**:
  - `src/lib/graphql/client.ts` - Cliente GraphQL actualizado
  - `src/lib/graphql/server-client.ts` - Cliente server-side
- **Implementación**: Todas las peticiones GraphQL incluyen automáticamente el ID token
- **Beneficio**: Autorización consistente en todas las operaciones de API

### 5. Headers de Seguridad ✅
- **Archivo**: `middleware.ts`
- **Headers Implementados**:
  - Content Security Policy (CSP)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security (HSTS)
  - Referrer-Policy
  - Permissions-Policy

## Arquitectura de Seguridad

```
┌─────────────────┐
│   Cliente       │
│  (Next.js App)  │
└────────┬────────┘
         │
         │ HTTPS + HTTP-Only Cookies
         │
┌────────▼────────┐
│   Middleware    │
│  (Auth Check)   │
└────────┬────────┘
         │
         │ ID Token
         │
┌────────▼────────┐
│   API Gateway   │
│   (AppSync)     │
└────────┬────────┘
         │
         │ Authorized
         │
┌────────▼────────┐
│    Backend      │
│   Resources     │
└─────────────────┘
```

## Funciones de Utilidad

### Server-Side Authentication
```typescript
// Obtener sesión del servidor
const session = await getServerSession();

// Verificar autenticación
const isAuth = await hasValidSession();

// Obtener ID token
const idToken = await getIdTokenServer();
```

### Client-Side GraphQL con ID Token
```typescript
// Queries y mutations incluyen automáticamente ID token
const data = await executeQuery(query, variables);
const result = await executeMutation(mutation, variables);
```

## Configuración OAuth

### Proveedores Soportados
- Apple Sign-In ✅
- Google (configurado, requiere setup en Cognito)
- Facebook (configurado, requiere setup en Cognito)

### Flujo OAuth
1. Usuario hace clic en "Sign in with Apple"
2. Redirect a Apple para autenticación
3. Callback a `/api/auth/oauth`
4. Verificación de sesión server-side
5. Establecimiento de cookies HTTP-only
6. Redirect a dashboard o URL de callback

## Mejores Prácticas Aplicadas

1. **Principio de Menor Privilegio**: Tokens con scope mínimo necesario
2. **Defense in Depth**: Múltiples capas de seguridad
3. **Zero Trust**: Verificación en cada petición
4. **Secure by Default**: Configuración segura por defecto
5. **AWS Well-Architected Framework**: Siguiendo pilar de seguridad

## Próximos Pasos Recomendados

1. **Configurar Rate Limiting**: Implementar límites de peticiones
2. **Audit Logging**: Registrar eventos de seguridad
3. **MFA**: Habilitar autenticación multifactor
4. **Rotation de Tokens**: Implementar rotación automática
5. **Monitoreo**: Configurar alertas de seguridad

## Verificación de Seguridad

Para verificar la implementación:

```bash
# Verificar headers de seguridad
curl -I https://tu-dominio.com

# Verificar cookies HTTP-only
# En Chrome DevTools > Application > Cookies
# Las cookies de auth deben tener ✓ HttpOnly

# Verificar ID token en peticiones
# En Network tab, verificar headers Authorization en peticiones GraphQL
```

## Cumplimiento

- ✅ OWASP Top 10 mitigaciones aplicadas
- ✅ AWS Security Best Practices
- ✅ Next.js Security Recommendations
- ✅ HTTP-Only Cookies para tokens sensibles
- ✅ CSP Headers configurados
- ✅ HTTPS enforced en producción