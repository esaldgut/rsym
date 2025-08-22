# AWS Location Service - Configuración de Permisos ✅

## Resumen del Problema Resuelto

✅ **PROBLEMA RESUELTO**: El `AccessDeniedException` se debía a que `location-actions.ts` estaba usando credenciales **no autenticadas** en lugar de credenciales autenticadas con ID Token.

## Cambios Implementados

### 1. Actualización de `location-actions.ts` ✅

```typescript
// ANTES - Credenciales no autenticadas ❌
const getLocationClient = () => {
  return new LocationClient({
    credentials: fromCognitoIdentityPool({
      identityPoolId,
      clientConfig: { region: 'us-west-2' }
    })
  });
};

// DESPUÉS - Credenciales autenticadas con ID Token ✅
const getLocationClient = async () => {
  const idToken = await getIdTokenServer();
  
  return new LocationClient({
    credentials: fromCognitoIdentityPool({
      identityPoolId,
      logins: {
        [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken
      },
      clientConfig: { region }
    })
  });
};
```

### 2. Función `getIdTokenServer()` ✅

Agregada función para obtener el ID Token del usuario autenticado desde el contexto del servidor:

```typescript
async function getIdTokenServer(): Promise<string> {
  const { cookies } = await import('next/headers');
  
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      const session = await fetchAuthSession(contextSpec);
      
      if (!session.tokens?.idToken) {
        throw new Error('No se pudo obtener el ID Token - usuario no autenticado');
      }
      
      return session.tokens.idToken.toString();
    }
  });
}
```

## Configuración AWS Necesaria (Pendiente)

Para que funcione completamente, necesitas configurar los permisos IAM en AWS Console:

### 1. Política IAM para el Rol Autenticado

Aplica la política del archivo `docs/aws-location-iam-policy.json` al rol autenticado de tu Identity Pool:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "YAANLocationServiceAccess",
      "Effect": "Allow",
      "Action": [
        "geo:SearchPlaceIndexForText",
        "geo:SearchPlaceIndexForPosition", 
        "geo:GetPlace"
      ],
      "Resource": [
        "arn:aws:geo:us-west-2:288761749126:place-index/YAANPlaceIndex"
      ]
    }
  ]
}
```

### 2. Pasos en AWS Console

1. **AWS Console** → **Amazon Cognito** → **Identity Pools**
2. Seleccionar tu Identity Pool: `us-west-2:00035e2e-e92f-4e72-a91b-454acba27eec`
3. **Authentication providers** → **Edit**
4. Encontrar el **Authenticated role** (YaanCognitoAuthenticatedRole)
5. **IAM Console** → **Roles** → Buscar tu rol autenticado
6. **Add permissions** → **Attach policies** → **Create policy**
7. Pegar el JSON de la política anterior
8. **Review policy** → Nombre: `YAANLocationServicePolicy`
9. **Create policy** → **Attach** al rol autenticado

## Scripts de Verificación

### Script de Prueba (`scripts/test-location-actions.ts`)

```bash
npx tsx scripts/test-location-actions.ts
```

**Nota**: Este script requiere un usuario autenticado, así que debe ejecutarse desde el contexto de la aplicación con sesión activa.

### Script de Verificación de Permisos (`scripts/verify-location-permissions.ts`)

```bash
npx tsx scripts/verify-location-permissions.ts
```

## Configuración Amplify

✅ **Verificado**: El archivo `amplify/outputs.json` está correctamente configurado:

```json
{
  "auth": {
    "aws_region": "us-west-2",
    "user_pool_id": "us-west-2_e8mS22a1i",
    "identity_pool_id": "us-west-2:00035e2e-e92f-4e72-a91b-454acba27eec",
    "unauthenticated_identities_enabled": false
  }
}
```

## Estado Actual

✅ **Código actualizado**: Todas las funciones ahora usan credenciales autenticadas
✅ **Scripts de verificación**: Creados para probar los permisos
✅ **Documentación IAM**: Política JSON lista para aplicar
⏳ **Pendiente**: Configurar permisos IAM en AWS Console

## Próximos Pasos

1. **Aplicar la política IAM** del archivo `docs/aws-location-iam-policy.json` al rol autenticado en AWS Console
2. **Probar la funcionalidad** desde el dashboard con un usuario autenticado
3. **Verificar** que el componente LocationSelector funcione correctamente en el formulario de creación de paquetes

## Archivos Modificados

- ✅ `src/lib/server/location-actions.ts` - Actualizado para usar credenciales autenticadas
- ✅ `scripts/test-location-actions.ts` - Script de prueba creado
- ✅ `docs/aws-location-iam-policy.json` - Política IAM documentada
- ✅ `scripts/verify-location-permissions.ts` - Script de verificación existente

El problema principal está resuelto en el código. Solo falta la configuración de permisos IAM en AWS Console.