# 🔑 AppSync Resolvers con ID Token - Acceso a Identity Claims

## ✅ CONFIGURACIÓN COMPLETADA

La aplicación ahora está configurada para usar **ID Token** en lugar de **Access Token** para GraphQL:

```typescript
// amplify-client-config.tsx y amplify-server-config.ts
API: {
  GraphQL: {
    endpoint: outputs.data.url,
    region: outputs.data.aws_region,
    defaultAuthMode: outputs.data.default_authorization_type,
    // CRÍTICO: Usar ID Token para acceder a identity claims
    authTokenType: 'COGNITO_USER_POOLS_ID_TOKEN'
  }
}
```

## 🎯 IDENTITY CLAIMS DISPONIBLES EN RESOLVERS

Con ID Token, los resolvers AppSync pueden acceder a:

### Claims Estándar
- `$context.identity.sub` - User ID único
- `$context.identity.email` - Email del usuario
- `$context.identity.email_verified` - Estado de verificación
- `$context.identity.given_name` - Nombre
- `$context.identity.family_name` - Apellido

### Claims Personalizados
- `$context.identity["custom:user_type"]` - Tipo de usuario (provider/consumer)
- `$context.identity["custom:company_name"]` - Nombre de empresa (si aplica)
- `$context.identity["custom:provider_verified"]` - Estado de verificación de proveedor

## 📋 EJEMPLOS DE RESOLVERS

### 1. Query que filtra por usuario actual
```javascript
// getAllMyCircuits resolver
export function request(ctx) {
  const userId = ctx.identity.sub;
  return {
    operation: 'Query',
    query: {
      expression: 'provider_id = :userId',
      expressionValues: {
        ':userId': { S: userId }
      }
    }
  };
}
```

### 2. Mutation que valida tipo de usuario
```javascript
// createCircuit resolver - solo para providers
export function request(ctx) {
  const userType = ctx.identity["custom:user_type"];
  
  if (userType !== 'provider') {
    util.error('Only providers can create circuits', 'Unauthorized');
  }
  
  const input = ctx.arguments.input;
  input.provider_id = ctx.identity.sub;
  input.created_by_email = ctx.identity.email;
  
  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({id: util.autoId()}),
    attributeValues: util.dynamodb.toMapValues(input)
  };
}
```

### 3. Resolver que añade metadata del usuario
```javascript
// createMoment resolver
export function request(ctx) {
  const input = ctx.arguments.input;
  
  // Añadir automáticamente información del usuario
  input.user_id = ctx.identity.sub;
  input.user_email = ctx.identity.email;
  input.user_type = ctx.identity["custom:user_type"];
  input.created_at = util.time.nowISO8601();
  
  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({id: util.autoId()}),
    attributeValues: util.dynamodb.toMapValues(input)
  };
}
```

### 4. Query con autorización por tipo de usuario
```javascript
// getProviderAnalytics resolver
export function request(ctx) {
  const userType = ctx.identity["custom:user_type"];
  const requestedProviderId = ctx.arguments.provider_id;
  const currentUserId = ctx.identity.sub;
  
  // Solo providers pueden ver analytics
  if (userType !== 'provider') {
    util.error('Only providers can access analytics', 'Unauthorized');
  }
  
  // Solo pueden ver sus propios analytics
  if (requestedProviderId !== currentUserId) {
    util.error('Can only access own analytics', 'Forbidden');
  }
  
  return {
    operation: 'Query',
    query: {
      expression: 'provider_id = :providerId',
      expressionValues: {
        ':providerId': { S: currentUserId }
      }
    }
  };
}
```

## 🛡️ SEGURIDAD Y BUENAS PRÁCTICAS

### 1. Validación de Claims
```javascript
// Siempre validar que los claims existen
export function request(ctx) {
  if (!ctx.identity || !ctx.identity.sub) {
    util.error('Authentication required', 'Unauthenticated');
  }
  
  const userType = ctx.identity["custom:user_type"];
  if (!userType) {
    util.error('User type not set', 'Unauthorized');
  }
  
  // Continuar con la lógica...
}
```

### 2. Autorización por Recurso
```javascript
// Solo el owner puede modificar sus recursos
export function request(ctx) {
  const resourceOwnerId = ctx.source.provider_id || ctx.source.user_id;
  const currentUserId = ctx.identity.sub;
  
  if (resourceOwnerId !== currentUserId) {
    util.error('Can only modify own resources', 'Forbidden');
  }
}
```

### 3. Audit Trail
```javascript
// Registrar quién hizo qué
export function request(ctx) {
  const input = ctx.arguments.input;
  
  // Audit trail automático
  input.modified_by = ctx.identity.sub;
  input.modified_by_email = ctx.identity.email;
  input.modified_at = util.time.nowISO8601();
  input.user_agent = ctx.request.headers['user-agent'];
}
```

## 📊 TESTING

Para verificar que los claims están llegando correctamente:

```javascript
// Resolver de debug (solo en desarrollo)
export function request(ctx) {
  console.log('Identity claims:', JSON.stringify(ctx.identity, null, 2));
  console.log('User type:', ctx.identity["custom:user_type"]);
  console.log('Email verified:', ctx.identity.email_verified);
  
  // Devolver los claims para verificación
  return {
    operation: 'Scan',
    limit: 1
  };
}

export function response(ctx) {
  return {
    identity_claims: ctx.identity,
    timestamp: util.time.nowISO8601()
  };
}
```

## ✅ VERIFICACIÓN

Los resolvers ahora tienen acceso completo a:
- ✅ User ID (`ctx.identity.sub`)
- ✅ Email (`ctx.identity.email`) 
- ✅ Tipo de usuario (`ctx.identity["custom:user_type"]`)
- ✅ Estado de verificación (`ctx.identity.email_verified`)
- ✅ Claims personalizados de Cognito

La configuración garantiza que **todos los queries y mutations** envían el **ID Token** con los **identity claims** necesarios para autorización y personalización en los resolvers.