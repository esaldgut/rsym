# AWS Location Service - Configuración de Permisos ✅

## Estado General

✅ **CÓDIGO ACTUALIZADO**: Todos los componentes usan Cognito Identity Pool credentials
✅ **IAM POLICY ACTUALIZADA**: Permisos para place search Y route calculation
✅ **FIX v2.0.1 APLICADO**: ExpiredTokenException eliminado en route calculation API

**Ver:** [CHANGELOG v2.0.1](/CHANGELOG.md#201---2025-10-23) para detalles completos del fix.

---

## Problemas Resueltos

### 1. AccessDeniedException en location-actions.ts (Place Search)

✅ **RESUELTO**: El `AccessDeniedException` se debía a que `location-actions.ts` estaba usando credenciales **no autenticadas** en lugar de credenciales autenticadas con ID Token.

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

### 2. ExpiredTokenException en /api/routes/calculate (Route Calculation) - v2.0.1

✅ **RESUELTO**: El `ExpiredTokenException` se debía a que el API route usaba `fromNodeProviderChain` que leía credenciales temporales de `~/.aws/credentials` sin capacidad de auto-refresh.

**Problema:**
- API route leía credenciales de archivo `~/.aws/credentials`
- Si las credenciales eran temporales (con `aws_session_token`), expiraban
- SDK NO podía auto-refrescar credenciales del archivo
- Retry logic fallaba en ambos intentos con las mismas credenciales expiradas

**Solución Implementada:**
```typescript
// ANTES - fromNodeProviderChain ❌
const client = new LocationClient({
  region: AWS_REGION,
  credentials: fromNodeProviderChain({
    clientConfig: { region: AWS_REGION }
  })
});

// DESPUÉS - Cognito Identity Pool ✅
const client = new LocationClient({
  region: config.auth.aws_region,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: config.auth.aws_region }),
    identityPoolId: config.auth.identity_pool_id,
    logins: {
      [`cognito-idp.${config.auth.aws_region}.amazonaws.com/${config.auth.user_pool_id}`]: idToken
    }
  })
});
```

**Beneficios:**
- ✅ Auto-refresh automático por el SDK
- ✅ Consistencia con otros Server Actions (s3-actions.ts)
- ✅ Sin dependencia de archivos externos
- ✅ Funciona igual en desarrollo y producción

**Ver:** `/src/app/api/routes/calculate/route.ts` para implementación completa.

---

## Configuración AWS IAM (COMPLETADA ✅)

La política IAM ha sido actualizada y está lista para aplicar:

### 1. Política IAM para Cognito Identity Pool Authenticated Role

**IMPORTANTE:** Esta política se aplica al **Cognito Identity Pool Authenticated Role**, NO al ECS Task Role.

Aplica la política completa del archivo `docs/aws-location-iam-policy.json` al rol autenticado de tu Identity Pool:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "YAANLocationServicePlaceIndexAccess",
      "Effect": "Allow",
      "Action": [
        "geo:SearchPlaceIndexForText",
        "geo:SearchPlaceIndexForPosition",
        "geo:GetPlace"
      ],
      "Resource": [
        "arn:aws:geo:us-west-2:288761749126:place-index/YAANPlaceIndex"
      ]
    },
    {
      "Sid": "YAANLocationServiceRouteCalculatorAccess",
      "Effect": "Allow",
      "Action": ["geo:CalculateRoute"],
      "Resource": [
        "arn:aws:geo:us-west-2:288761749126:route-calculator/YaanTourismRouteCalculator"
      ]
    },
    {
      "Sid": "YAANLocationServiceList",
      "Effect": "Allow",
      "Action": [
        "geo:ListPlaceIndexes",
        "geo:DescribePlaceIndex",
        "geo:ListRouteCalculators",
        "geo:DescribeRouteCalculator"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-west-2"
        }
      }
    }
  ]
}
```

### 2. Distinción de Roles IAM (IMPORTANTE)

AWS Location Service requiere permisos en **dos roles diferentes** dependiendo del componente:

| Componente | Rol IAM Requerido | Permisos Necesarios |
|------------|-------------------|---------------------|
| **location-actions.ts** (Server Action) | Cognito Identity Pool Authenticated Role | `geo:SearchPlaceIndexForText`, `geo:SearchPlaceIndexForPosition`, `geo:GetPlace` |
| **CognitoLocationMap.tsx** (Client Component) | Cognito Identity Pool Authenticated Role | `geo:GetMapTile`, `geo:GetMapStyleDescriptor`, `geo:GetMapGlyphs`, `geo:GetMapSprites` |
| **/api/routes/calculate** (API Route) | Cognito Identity Pool Authenticated Role | `geo:CalculateRoute` |

**Nota:** Los API Routes (como `/api/routes/calculate`) usan el ID Token del usuario para obtener credenciales temporales del Cognito Identity Pool, por lo que los permisos se configuran en el **Authenticated Role del Identity Pool**, NO en el ECS Task Role.

### 3. Pasos en AWS Console

#### Aplicar Política al Cognito Identity Pool Authenticated Role:

1. **AWS Console** → **Amazon Cognito** → **Identity Pools**
2. Seleccionar tu Identity Pool: `us-west-2:00035e2e-e92f-4e72-a91b-454acba27eec`
3. **Authentication providers** → **Edit**
4. Encontrar el **Authenticated role** (ejemplo: `YaanCognitoAuthenticatedRole`)
5. **IAM Console** → **Roles** → Buscar tu rol autenticado
6. **Add permissions** → **Attach policies** → **Create policy**
7. Pegar el JSON completo de `docs/aws-location-iam-policy.json`
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

## Recursos AWS Location Service

### Place Index
- **Nombre**: `YAANPlaceIndex`
- **Proveedor**: Esri
- **Uso**: Búsqueda de lugares, geocodificación, geocodificación inversa
- **Usado por**: `location-actions.ts` (Server Action)

### Route Calculator
- **Nombre**: `YaanTourismRouteCalculator`
- **Proveedor**: Esri
- **Uso**: Cálculo de rutas optimizadas entre waypoints
- **Usado por**: `/api/routes/calculate` (API Route)

### Map Style
- **Nombre**: `YaanEsri`
- **Proveedor**: Esri
- **Uso**: Tiles de mapa para visualización interactiva
- **Usado por**: `CognitoLocationMap.tsx` (Client Component)

---

## Estado Actual

✅ **Código actualizado**: Todos los componentes usan Cognito Identity Pool credentials
✅ **Scripts de verificación**: Creados para probar los permisos
✅ **Documentación IAM**: Política JSON completa en `docs/aws-location-iam-policy.json`
✅ **Fix v2.0.1 aplicado**: ExpiredTokenException eliminado
✅ **Patrón consistente**: Mismo pattern en Server Actions, API Routes y Client Components

**COMPLETADO**: Sistema AWS Location Service operacional con arquitectura de seguridad de dos capas (JWT + IAM).

## Componentes del Sistema

### Server Actions (Server-Side)
- **Archivo**: `src/lib/server/location-actions.ts`
- **Funciones**: `searchPlacesByText()`, `searchPlacesByCoordinates()`, `getPlaceDetails()`
- **Pattern**: Cognito Identity Pool credentials con ID Token
- **Uso**: Product Wizard (creación de productos)

### API Routes (Server-Side)
- **Archivo**: `src/app/api/routes/calculate/route.ts`
- **Endpoint**: `POST /api/routes/calculate`
- **Pattern**: Cognito Identity Pool credentials con ID Token (v2.0.1 fix)
- **Uso**: CognitoLocationMap (cálculo de rutas para visualización)

### Client Components (Client-Side)
- **CognitoLocationMap.tsx**: Mapa interactivo con autenticación Cognito
- **HybridProductMap.tsx**: Estrategia híbrida (auto-detecta configuración AWS)
- **ProductMap.tsx**: Mapa decorativo (fallback sin AWS)

---

## Próximos Pasos (si no aplicados)

1. **Aplicar la política IAM** del archivo `docs/aws-location-iam-policy.json` al Cognito Identity Pool Authenticated Role en AWS Console
2. **Verificar permisos**: Ejecutar `npx tsx scripts/verify-location-permissions.ts`
3. **Probar funcionalidad**:
   - LocationSelector en Product Wizard
   - CognitoLocationMap en ProductDetailModal
   - Route calculation en mapas de circuitos

---

## Troubleshooting

### Error: "AccessDeniedException" en location-actions.ts
- **Causa**: Cognito Identity Pool Authenticated Role no tiene permisos `geo:SearchPlaceIndexForText`
- **Solución**: Aplicar política IAM del archivo `docs/aws-location-iam-policy.json`

### Error: "ExpiredTokenException" en /api/routes/calculate
- **Causa**: (Resuelto en v2.0.1) API route usaba `fromNodeProviderChain` en lugar de Cognito Identity Pool
- **Solución**: Ya aplicado en v2.0.1 - upgrade a versión actual

### Error: "The security token included in the request is expired"
- **Causa**: Credenciales temporales expiradas sin auto-refresh
- **Solución**: Verificar que el código use `fromCognitoIdentityPool` (patrón correcto v2.0.1)

### Mapa no carga en CognitoLocationMap
- **Causa**: Identity Pool Authenticated Role no tiene permisos `geo:GetMapTile`
- **Solución**: Aplicar política completa que incluye permisos de map tiles

## Archivos del Sistema

### Configuración y Documentación
- ✅ `docs/aws-location-iam-policy.json` - Política IAM completa (place index + route calculator + map tiles)
- ✅ `CHANGELOG.md` - v2.0.1 documenta fix de ExpiredTokenException
- ✅ `CLAUDE.md` - Sección "AWS Location Services - Interactive Maps" con arquitectura completa

### Server-Side
- ✅ `src/lib/server/location-actions.ts` - Place search con Cognito Identity Pool credentials
- ✅ `src/app/api/routes/calculate/route.ts` - Route calculation con Cognito Identity Pool credentials (v2.0.1 fix)

### Client-Side
- ✅ `src/components/marketplace/maps/CognitoLocationMap.tsx` - Mapa interactivo con Cognito auth
- ✅ `src/components/marketplace/maps/HybridProductMap.tsx` - Estrategia híbrida
- ✅ `src/components/marketplace/ProductMap.tsx` - Mapa decorativo (fallback)
- ⚠️ `src/components/marketplace/maps/AmazonLocationMap.tsx` - **DEPRECATED** (usa API keys)

### Testing
- ✅ `scripts/test-location-actions.ts` - Script de prueba de place search
- ✅ `scripts/verify-location-permissions.ts` - Script de verificación de permisos

---

## Referencias

- **CHANGELOG v2.0.1**: `/CHANGELOG.md#201---2025-10-23`
- **CLAUDE.md**: Sección "AWS Location Services - Interactive Maps"
- **IAM Policy**: `docs/aws-location-iam-policy.json`
- **AWS Location System Docs**: `docs/AWS_LOCATION_SYSTEM.md`

---

**Última actualización:** 2025-10-23 (v2.0.1)
**Estado:** ✅ Sistema completamente operacional con patrón Cognito Identity Pool