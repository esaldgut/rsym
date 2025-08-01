# 🔐 Sistema de Validación de Tokens - YAAN Web App

## ✅ **IMPLEMENTACIÓN COMPLETA**

Sistema robusto de validación y refresh de tokens JWT implementado con AWS Amplify v6.15.1 y Next.js 15.3.4.

---

## 🏗️ **Arquitectura del Sistema**

### **1. Token Manager (`src/lib/token-manager.ts`)**
Clase singleton que gestiona todos los aspectos de validación y refresh de tokens:

```typescript
// Inicializar el token manager
import { tokenManager } from '../lib/token-manager';

// Obtener información de tokens
const tokenInfo = await tokenManager.getTokenInfo();
console.log(tokenInfo.timeUntilExpiry); // segundos hasta expiración
console.log(tokenInfo.isExpiringSoon); // true si expira en < 5 min
```

**Características:**
- ✅ Monitoreo automático cada 30 segundos
- ✅ Auto-refresh 1 minuto antes de expirar
- ✅ Advertencias 5 minutos antes de expirar
- ✅ Detección de tokens expirados
- ✅ Eventos Hub para notificaciones
- ✅ Singleton pattern para eficiencia

### **2. Hooks de React**

#### **useTokenManager** (`src/hooks/useTokenManager.ts`)
```typescript
const { 
  tokenInfo, 
  isLoading, 
  error, 
  refreshTokens, 
  timeUntilExpiryFormatted 
} = useTokenManager();
```

#### **useSessionTimeout** (`src/hooks/useSessionTimeout.ts`)
```typescript
const { 
  remainingTime, 
  isWarning, 
  extendSession, 
  signOutNow 
} = useSessionTimeout({
  timeoutDuration: 30, // minutos
  warningDuration: 5   // minutos de advertencia
});
```

### **3. Componentes de UI**

#### **TokenExpiryWarning** - Advertencia de expiración de tokens
```tsx
<TokenExpiryWarning className="mb-4" />
```

#### **SessionTimeoutWarning** - Advertencia de timeout por inactividad
```tsx
<SessionTimeoutWarning 
  timeoutDuration={30}
  warningDuration={5}
/>
```

#### **TokenDebugInfo** - Información de debug (solo desarrollo)
```tsx
<TokenDebugInfo className="mb-4" />
```

#### **AuthSecurityWrapper** - Wrapper integral de seguridad
```tsx
<AuthSecurityWrapper 
  sessionTimeout={30}
  sessionWarning={5}
>
  {children}
</AuthSecurityWrapper>
```

---

## 🔒 **Validación en Servidor**

### **Middleware** (`middleware.ts`)
- ✅ Validación JWT en cada request
- ✅ Verificación de email confirmado
- ✅ Control de acceso por tipo de usuario
- ✅ Margen de seguridad de 30 segundos para expiración
- ✅ Headers de seguridad automáticos

### **Auth Server Utils** (`src/lib/auth-server.ts`)
```typescript
// Validar autenticación del servidor
const result = await validateServerAuth(request, {
  requireEmailVerified: true,
  requiredUserType: 'provider'
});

// Solo para proveedores
const providerResult = await validateProviderAuth(request);
```

---

## ⚡ **Flujo de Funcionamiento**

### **1. Inicio de Sesión**
```
User Login → Token Manager Start → Auto-monitoring Begin
```

### **2. Monitoreo Continuo**
```
Every 30s → Check Expiry → Auto-refresh if needed → Hub Events
```

### **3. Advertencias de Usuario**
```
5 min before expiry → TokenExpiryWarning → User Action Required
```

### **4. Timeout por Inactividad**
```
30 min inactive → SessionTimeoutWarning → Auto Sign Out
```

### **5. Validación de Servidor**
```
Request → Middleware → JWT Validation → Route Access
```

---

## 🎯 **Configuración y Parámetros**

### **Tiempos por Defecto**
```typescript
const EXPIRY_WARNING_THRESHOLD = 300; // 5 minutos
const REFRESH_BUFFER = 60;           // 1 minuto
const CHECK_INTERVAL = 30000;        // 30 segundos
const SESSION_TIMEOUT = 1800000;     // 30 minutos
const BUFFER_TIME = 30;              // 30 segundos servidor
```

### **Eventos Hub Disponibles**
```typescript
// Eventos estándar de Amplify
'signIn' | 'signOut' | 'tokenRefresh' | 'tokenRefresh_failure'

// Eventos personalizados
'tokenExpiry_warning'      // Token por expirar
'sessionExpired_custom'    // Sesión expirada
```

---

## 🚨 **Manejo de Errores**

### **Tipos de Error**
```typescript
type AuthError = 
  | 'no_tokens'                 // No hay tokens
  | 'email_not_verified'        // Email no verificado
  | 'token_expired'             // Token expirado
  | 'session_error'             // Error de sesión
  | 'insufficient_permissions'; // Sin permisos
```

### **Rutas de Redirección**
```typescript
// Errores de autenticación
/auth?error=session_expired&redirect=/dashboard

// Timeout de sesión
/auth?reason=session_timeout

// Acceso denegado
/dashboard?error=insufficient_permissions
```

---

## 🔧 **Implementación en Páginas**

### **Página con Seguridad Completa**
```tsx
export default function SecurePage() {
  return (
    <AuthSecurityWrapper>
      <div>
        {/* Tu contenido aquí */}
      </div>
    </AuthSecurityWrapper>
  );
}
```

### **Hook useAuth Extendido**
```tsx
const { 
  user, 
  isAuthenticated, 
  userType, 
  signOut, 
  refreshTokens // ← Nuevo método
} = useAuth();
```

---

## 📊 **Debug y Monitoreo**

### **En Desarrollo**
- Token debug info visible automáticamente
- Badges de protección de middleware
- Console logs detallados
- Información de claims de JWT

### **En Producción**
- Solo advertencias de usuario
- Logs de errores críticos
- Eventos Hub para analytics
- Headers de seguridad

---

## 🔄 **Estados de Token**

| Estado | Descripción | Acción |
|--------|-------------|--------|
| `✅ Válido` | Token válido, > 5 min para expirar | Ninguna |
| `⚠️ Por expirar` | < 5 min para expirar | Mostrar advertencia |
| `🔄 Refrescando` | Auto-refresh en progreso | Mostrar loading |
| `❌ Expirado` | Token expirado | Redirigir a /auth |
| `⏱️ Timeout` | Inactividad > 30 min | Auto sign out |

---

## 🛡️ **Seguridad Implementada**

- ✅ **Validación JWT en servidor y cliente**
- ✅ **Auto-refresh de tokens**
- ✅ **Timeout por inactividad**
- ✅ **Control de acceso por roles**
- ✅ **Headers de seguridad**
- ✅ **Protección CSRF**
- ✅ **Prevención de session hijacking**
- ✅ **Logs de seguridad**

---

## 🎉 **¡Sistema Completo y Funcional!**

El sistema de validación de tokens está **100% implementado** y listo para producción con:

- 🔒 Seguridad robusta multi-capa
- ⚡ Performance optimizada
- 🎨 UX fluida con advertencias contextuales
- 🐛 Debug tools para desarrollo
- 📚 Documentación completa
- ✅ Compatibilidad AWS Amplify v6 + Next.js 15

**Próximos pasos sugeridos:**
- Implementar analytics de seguridad
- Configurar alertas de monitoring
- Añadir rate limiting
- Tests de seguridad automatizados