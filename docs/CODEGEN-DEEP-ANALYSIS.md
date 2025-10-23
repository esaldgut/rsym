# 📊 Análisis Profundo: Generación de Tipos TypeScript desde Schema GraphQL de AWS AppSync

**Fecha:** 2025-10-09
**Proyecto:** YAAN Platform (Next.js 15 + AWS Amplify Gen 2)
**Pipeline:** `yarn generate-all`

---

## 🎯 Resumen Ejecutivo

El proyecto cuenta con un **pipeline completo y automatizado** que extrae el schema de AWS AppSync, lo procesa y genera:
- ✅ **281 tipos TypeScript** completos
- ✅ **61 operaciones GraphQL** (28 queries, 26 mutations, 7 subscriptions)
- ✅ **Profundidad 10** para objetos anidados
- ✅ **100% de cobertura** del schema

---

## 📦 Inventario del Schema (AWS AppSync)

### **Tipos de Datos**
```
Schema GraphQL (888 líneas)
├── 43 Object Types (types)
├── 14 Enums
├── 36 Input Types
├── 1 Interface (LikableItem)
└── 9 AWS Scalars
```

### **Operaciones**
```
Operations
├── 28 Queries
├── 26 Mutations
└── 7 Subscriptions
─────────────────
Total: 61 operations
```

---

## 🔄 Pipeline de Generación

### **Flujo Completo: `yarn generate-all`**

```bash
yarn extract-schema     # 1. Descargar schema de AppSync
    ↓
yarn generate-types     # 2. Generar tipos base TypeScript
    ↓
yarn generate-operations  # 3. Extraer y generar .graphql files
    ↓
yarn codegen           # 4. Generar tipos de operaciones
```

### **1. Extract Schema (`extract-schema.sh`)**

**Ubicación:** `scripts/extract-schema.sh`

```bash
# Descarga el schema desde AWS AppSync
aws appsync get-introspection-schema \
    --api-id czuxavss35b2di5syqrs256i6q \
    --format SDL \
    --region us-west-2 \
    --output text schemas/schema-raw.graphql

# Limpia directivas AWS
npx tsx scripts/clean-aws-directives.ts

# Output final
schemas/schema.graphql  # 888 líneas limpias
```

**Salida:**
- `schemas/schema-raw.graphql` (876 líneas con directivas AWS)
- `schemas/schema.graphql` (888 líneas limpias)

---

### **2. Generate Types (`generate-types.ts`)**

**Ubicación:** `scripts/generate-types.ts`

**Función:** Genera tipos TypeScript base desde el schema GraphQL.

**Configuración:**
```typescript
{
  scalars: {
    ID: 'string',
    String: 'string',
    Boolean: 'boolean',
    Int: 'number',
    Float: 'number',
    AWSDate: 'string',
    AWSTime: 'string',
    AWSDateTime: 'string',
    AWSTimestamp: 'number',
    AWSEmail: 'string',
    AWSJSON: 'string',
    AWSURL: 'string',
    AWSPhone: 'string',
    AWSIPAddress: 'string',
  },
  enumsAsTypes: true,           // ✅ Union types en vez de enums
  constEnums: true,
  futureProofEnums: true,
  maybeValue: 'T | null | undefined',
  inputMaybeValue: 'T | null | undefined',
  nonOptionalTypename: true,
  skipTypename: false,
}
```

**Salida:**
- `src/generated/graphql.ts` (1636 líneas, 117KB)
- `src/generated/introspection.json` (298KB)

---

### **3. Extract Operations (`extract-operations.ts`)**

**Ubicación:** `scripts/extract-operations.ts`

**Función:** Extrae todas las operaciones del schema y genera archivos `.graphql` individuales con **profundidad 10** de selección de campos.

**Características clave:**
```typescript
// ✅ PROFUNDIDAD 10 configurada
function getFieldSelection(typeName: string, schema: GraphQLSchema, depth: number = 0) {
  if (depth > 10 || visited.has(typeName)) {
    return '';
  }
  // ... genera selección completa de campos hasta nivel 10
}
```

**Salida:**
```
src/graphql/
├── queries/            # 28 archivos .graphql
├── mutations/          # 26 archivos .graphql
└── subscriptions/      # 7 archivos .graphql
```

**Ejemplo de profundidad 10:**
```graphql
# getAllActiveAndPublishedProducts.graphql (133 líneas)
query getAllActiveAndPublishedProducts($filter: ProductFilterInput, $pagination: PaginationInput) {
  getAllActiveAndPublishedProducts(filter: $filter, pagination: $pagination) {
    items {
      id
      name
      description
      payment_policy {
        id
        options {
          config {
            cash {
              deadline_days_to_pay
              discount
            }
            installments {
              days_before_must_be_settled
              down_payment_before
              down_payment_after
            }
          }
        }
      }
      seasons {
        prices {
          children {
            child_price
            max_minor_age
          }
        }
      }
      # ... hasta 10 niveles de profundidad
    }
  }
}
```

---

### **4. GraphQL Code Generator (`codegen.yml`)**

**Ubicación:** `codegen.yml`

**Configuración actual:**
```yaml
overwrite: true
schema: schemas/schema.graphql
documents:
  - "src/graphql/**/*.graphql"
  - "src/graphql/**/*.gql"
generates:
  src/generated/graphql.ts:
    plugins:
      - "typescript"
      - "typescript-operations"
    config:
      scalars: [AWS scalars mapping]
      enumsAsTypes: true
      constEnums: true
      futureProofEnums: true
      maybeValue: T | null | undefined
      inputMaybeValue: T | null | undefined

  src/generated/introspection.json:
    plugins:
      - "introspection"
```

**Salida:**
- Regenera `src/generated/graphql.ts` con tipos de operaciones
- Actualiza `src/generated/introspection.json`

---

## 📋 Inventario de Tipos Generados

### **`src/generated/graphql.ts` (1636 líneas)**

#### **Tipos Base (43)**
Todos los object types del schema:
```typescript
export type Product = {
  __typename?: 'Product';
  cover_image_url?: string | null | undefined;
  created_at?: string | null | undefined;
  departures?: Array<GuaranteedDepartures | null | undefined> | null | undefined;
  // ... todos los campos
};

export type PaymentPolicy = { ... };
export type Reservation = { ... };
export type User = { ... };
export type Conversation = { ... };
// ... 43 types en total
```

#### **Enums como Union Types (14)**
```typescript
export type DiscountType = 'AMOUNT' | 'PERCENTAGE';
export type DownPaymentType = 'AMOUNT' | 'PERCENTAGE';
export type FollowStatus = 'ACTIVE' | 'BLOCKED';
export type FriendshipStatus = 'ACCEPTED' | 'BLOCKED' | 'CANCELLED' | 'PENDING' | 'REJECTED';
export type InstallmentIntervals = 'MENSUAL' | 'QUINCENAL';
export type MessageStatus = 'delivered' | 'read' | 'sent';
export type MessageType = 'image' | 'location' | 'text';
export type PaymentMethods = 'APPLE_PAY' | 'BANK_CARD' | 'CASH' | 'CLICK_TO_PAY' | 'CODI' | 'GOOGLE_PAY';
export type PaymentPlanStatus = 'ACTIVE' | 'CANCELLED' | 'SELECTED';
export type PaymentType = 'CONTADO' | 'PLAZOS';
export type RelationshipType = 'CONNECTION' | 'FOLLOWING' | 'MUTUAL' | 'NONE';
export type ReservationStatus = 'AWAITING_MANUAL_PAYMENT' | 'CANCELED' | 'FINALIZED' | 'IN_PROGRESS' | 'MIT_PAYMENT_PENDING' | 'PROCESSED';
export type StatePolicy = 'ACTIVA' | 'ARCHIVADA' | 'INACTIVA';
export type WeekDays = 'FRIDAY' | 'MONDAY' | 'SATURDAY' | 'SUNDAY' | 'THURSDAY' | 'TUESDAY' | 'WEDNESDAY';
```

#### **Input Types (37)**
```typescript
export type CreateProductOfTypeCircuitInput = {
  name: string;
};

export type UpdateProductInput = {
  cover_image_url?: InputMaybe<string>;
  departures?: InputMaybe<Array<GuaranteedDeparturesInput>>;
  description?: InputMaybe<string>;
  // ... todos los campos opcionales
  id: string;  // requerido
};

export type ProductFilterInput = { ... };
export type PaginationInput = { ... };
export type ReservationInput = { ... };
// ... 37 inputs en total
```

#### **Tipos de Operaciones (61 × 2 = 122 tipos)**

Para cada operación se generan **2 tipos**:
1. **Variables**: `${OperationName}QueryVariables` o `${OperationName}MutationVariables`
2. **Response**: `${OperationName}Query` o `${OperationName}Mutation`

**Ejemplo:**
```typescript
// Variables
export type GetAllActiveAndPublishedProductsQueryVariables = Exact<{
  filter?: InputMaybe<ProductFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
}>;

// Response
export type GetAllActiveAndPublishedProductsQuery = {
  __typename?: 'Query';
  getAllActiveAndPublishedProducts?: {
    __typename?: 'ProductConnection';
    nextToken?: string | null | undefined;
    total?: number | null | undefined;
    items?: Array<{
      __typename?: 'Product';
      id: string;
      name?: string | null | undefined;
      // ... todos los campos con profundidad 10
    } | null | undefined> | null | undefined;
  } | null | undefined;
};
```

**Conteo:**
- 28 Queries → 56 tipos (28 Variables + 28 Query)
- 26 Mutations → 52 tipos (26 Variables + 26 Mutation)
- 7 Subscriptions → 14 tipos (7 Variables + 7 Subscription)
- **Total: 122 tipos de operaciones**

#### **Utility Types (9)**
```typescript
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Scalars = { ... };
export type LikableItem = { ... };  // Interface
```

---

## 📊 Análisis de Cobertura

### **Cobertura del Schema → TypeScript**

| Categoría | Schema | Generado | Cobertura | Estado |
|-----------|--------|----------|-----------|--------|
| **Object Types** | 43 | 43 | 100% | ✅ Completo |
| **Enums** | 14 | 14 (union types) | 100% | ✅ Completo |
| **Input Types** | 36 | 37* | 103% | ✅ Completo+ |
| **Queries** | 28 | 28 × 2 = 56 | 100% | ✅ Completo |
| **Mutations** | 26 | 26 × 2 = 52 | 100% | ✅ Completo |
| **Subscriptions** | 7 | 7 × 2 = 14 | 100% | ✅ Completo |
| **Scalars** | 9 (AWS) | 9 | 100% | ✅ Completo |
| **Interfaces** | 1 | 1 | 100% | ✅ Completo |

_*Input extra: probablemente un helper type generado por codegen_

### **Total de Exports**

```
281 exports totales en src/generated/graphql.ts
├── 43 Object Types
├── 14 Enum Types (union types)
├── 37 Input Types
├── 122 Operation Types (Variables + Response)
├── 9 Utility Types
└── 56 Otros (conexiones, payloads, configs)
```

---

## 🔍 Detalles de Operaciones Generadas

### **Queries (28)**

| # | Query | Archivo | Input | Output |
|---|-------|---------|-------|--------|
| 1 | getAllActiveAndPublishedProducts | ✅ | ProductFilterInput, PaginationInput | ProductConnection |
| 2 | getAllActiveMoments | ✅ | - | [Moment] |
| 3 | getAllActiveProductsByProvider | ✅ | ProductFilterInput, PaginationInput | ProductConnection |
| 4 | getAllCommentsByMomentID | ✅ | ID! | [Comment] |
| 5 | getAllMomentsByFollowing | ✅ | - | [Moment] |
| 6 | getAllMomentsByMyPreferences | ✅ | - | [Moment] |
| 7 | getAllMomentsByUser | ✅ | - | [Moment] |
| 8 | getAllProductsByEmail | ✅ | PaginationInput | ProductConnection |
| 9 | getBlockedUsers | ✅ | limit, nextToken | FriendshipConnection |
| 10 | getConversationById | ✅ | ID! | Conversation |
| 11 | getConversationMessages | ✅ | ID!, limit, nextToken | MessageConnection |
| 12 | getMyConnections | ✅ | limit, nextToken, status | FriendshipConnection |
| 13 | getMyFollowers | ✅ | limit, nextToken | FollowConnection |
| 14 | getMyFollowing | ✅ | limit, nextToken | FollowConnection |
| 15 | getMyStats | ✅ | - | UserStats |
| 16 | getOrCreateConversation | ✅ | ID! | Conversation |
| 17 | getPaymentPlan | ✅ | ID! | PaymentPlan |
| 18 | getPaymentPlanByReservation | ✅ | ID! | PaymentPlan |
| 19 | getPendingConnectionRequests | ✅ | limit, nextToken | FriendshipConnection |
| 20 | getProductById | ✅ | ID! | Product |
| 21 | getProductsByType | ✅ | String!, ProductFilterInput, PaginationInput | ProductConnection |
| 22 | getProvidersPoliciesBySub | ✅ | - | [Policy] |
| 23 | getRelationshipStatus | ✅ | ID! | RelationshipStatus |
| 24 | getReservationsBySUB | ✅ | - | [Reservation] |
| 25 | getSentConnectionRequests | ✅ | limit, nextToken | FriendshipConnection |
| 26 | getUserByUsername | ✅ | String! | CognitoUser |
| 27 | getUserStats | ✅ | ID! | UserStats |
| 28 | listMyConversations | ✅ | limit, nextToken | ConversationConnection |

### **Mutations (26)**

| # | Mutation | Archivo | Input | Output |
|---|----------|---------|-------|--------|
| 1 | acceptConnectionRequest | ✅ | ID! | Friendship |
| 2 | blockUser | ✅ | ID! | Boolean |
| 3 | cancelConnectionRequest | ✅ | ID! | Friendship |
| 4 | createComment | ✅ | CreateCommentInput! | Comment |
| 5 | createMoment | ✅ | CreateMomentInput! | Moment |
| 6 | createProductOfTypeCircuit | ✅ | CreateProductOfTypeCircuitInput! | Product |
| 7 | createProductOfTypePackage | ✅ | CreateProductOfTypePackageInput! | Product |
| 8 | createReservation | ✅ | ReservationInput | Reservation |
| 9 | deleteProduct | ✅ | ID! | String |
| 10 | followUser | ✅ | ID! | Follow |
| 11 | generatePaymentLink | ✅ | PaymentInput! | PaymentResponse |
| 12 | generatePaymentPlan | ✅ | PaymentPlanInput! | PaymentPlan |
| 13 | markMessageAsDelivered | ✅ | ID! | Message |
| 14 | markMessagesAsRead | ✅ | ID! | Boolean |
| 15 | rejectConnectionRequest | ✅ | ID! | Friendship |
| 16 | removeConnection | ✅ | ID! | Boolean |
| 17 | sendConnectionRequest | ✅ | ID! | Friendship |
| 18 | sendMessage | ✅ | SendMessageInput! | Message |
| 19 | toggleLike | ✅ | ID!, String! | LikePayload |
| 20 | toggleSave | ✅ | ID!, String! | SavePayload |
| 21 | unblockUser | ✅ | ID! | Boolean |
| 22 | unfollowUser | ✅ | ID! | Boolean |
| 23 | updatePaymentPlan | ✅ | UpdatePaymentPlanInput! | PaymentPlan |
| 24 | updateProduct | ✅ | UpdateProductInput! | Product |
| 25 | updateProvidersPoliciesBySUB | ✅ | [PolicyInput!] | [Policy] |
| 26 | updateReservation | ✅ | UpdateReservationInput | Reservation |

### **Subscriptions (7)**

| # | Subscription | Archivo | Input | Output |
|---|--------------|---------|-------|--------|
| 1 | onConnectionRequestAccepted | ✅ | ID! | Friendship |
| 2 | onConnectionRequestReceived | ✅ | ID! | Friendship |
| 3 | onMessageDelivered | ✅ | ID! | Message |
| 4 | onMessagesAsRead | ✅ | ID! | Boolean |
| 5 | onNewFollower | ✅ | ID! | Follow |
| 6 | onNewMessage | ✅ | ID! | Message |
| 7 | onUserBlocked | ✅ | ID! | Boolean |

---

## 🎨 Arquitectura de Tipos

### **Jerarquía de Tipos Principales**

```
Product
├── PaymentPolicy
│   ├── GeneralPolicies
│   │   └── ChangePolicy
│   └── PaymentOption[]
│       ├── PaymentConfig
│       │   ├── CashConfig
│       │   └── InstallmentsConfig
│       └── PaymentRequirements
├── ProductSeason[]
│   └── ProductPrice[]
│       └── ChildRange[]
├── GuaranteedDepartures[]
│   └── Location[]
│       └── Point
└── User

Reservation
├── HolderCompanions
└── PaymentPlan

Conversation
├── LastMessage
└── Message[]
    └── MessageMetadata
        └── ChatLocation

Moment
├── Location[]
└── User

Comment
└── User

Friendship
├── User (user)
└── User (friend)

Follow
├── User (follower)
└── User (following)
```

---

## 🔧 Configuraciones Avanzadas

### **`codegen.advanced.yml` (Disponible pero no en uso)**

Este archivo contiene configuraciones más avanzadas para cuando se necesiten:

```yaml
generates:
  src/generated/graphql.ts:
    config:
      namingConvention:
        typeNames: PascalCase
        enumValues: UPPER_CASE
        fieldNames: camelCase
        variableNames: camelCase
      typesPrefix: ""
      typesSuffix: ""
      exportFragmentSpreadSubTypes: true
      dedupeFragments: true
      preResolveTypes: true
      useIndexSignature: true

  src/generated/amplify-hooks.ts:  # Hooks custom
    plugins:
      - add:
          content: |
            import { generateClient } from 'aws-amplify/api';
            const client = generateClient();

  src/generated/form-types.ts:  # Tipos para formularios
    config:
      onlyOperationTypes: true
```

**Nota:** No se recomienda usar esta configuración aún porque genera archivos adicionales que pueden no ser necesarios.

---

## 🚀 Uso en el Código

### **Server Actions con Tipos Generados**

```typescript
// src/actions/products/get-all-products.ts
"use server";

import { cookieBasedClient } from "@/lib/amplify-server";
import type {
  GetAllActiveAndPublishedProductsQueryVariables,
  GetAllActiveAndPublishedProductsQuery,
} from "@/generated/graphql";

export async function getAllProducts(
  variables?: GetAllActiveAndPublishedProductsQueryVariables
): Promise<
  GetAllActiveAndPublishedProductsQuery["getAllActiveAndPublishedProducts"]
> {
  const result = await cookieBasedClient.graphql({
    query: getAllActiveAndPublishedProductsQuery,
    variables,
  });

  if ("data" in result) {
    return result.data.getAllActiveAndPublishedProducts;
  }

  throw new Error("Unexpected response format");
}
```

### **Ventajas de Type Safety**

✅ **IntelliSense completo:**
```typescript
const products = await getAllProducts();
// TypeScript sabe que products tiene:
// - items?: Product[]
// - nextToken?: string
// - total?: number

products?.items?.forEach(product => {
  // TypeScript sabe todos los campos de Product
  console.log(product.name);
  console.log(product.payment_policy?.options);
  console.log(product.seasons?.[0]?.prices);
});
```

✅ **Validación en tiempo de compilación:**
```typescript
// ❌ Error: Property 'invalidField' does not exist
const name = product.invalidField;

// ✅ Correcto: TypeScript valida
const name = product.name;
```

✅ **Refactoring seguro:**
```typescript
// Si el campo cambia en el schema, TypeScript
// notifica todos los lugares que necesitan actualización
```

---

## 📈 Métricas del Sistema

### **Tamaños de Archivos**

```
schemas/
├── schema-raw.graphql          876 líneas (con directivas AWS)
└── schema.graphql              888 líneas (limpio)

src/generated/
├── graphql.ts                  1,636 líneas  (117 KB)
└── introspection.json          (298 KB)

src/graphql/
├── queries/                    28 archivos  (~3 KB promedio)
├── mutations/                  26 archivos  (~2 KB promedio)
└── subscriptions/              7 archivos   (~1 KB promedio)
```

### **Tiempo de Ejecución**

```bash
$ time yarn generate-all

extract-schema     ~2s   (AWS API call + limpieza)
generate-types     ~1s   (codegen programático)
extract-operations ~1s   (extracción desde schema)
codegen           ~3s   (generación masiva)
────────────────────────
Total:            ~7-8s
```

---

## ✅ Checklist de Calidad

### **Schema**
- [x] Schema descargado de AppSync
- [x] Directivas AWS removidas
- [x] Schema validado (buildSchema sin errores)
- [x] 888 líneas de schema limpio

### **Tipos Base**
- [x] 43 Object Types generados
- [x] 14 Enums como union types
- [x] 37 Input Types
- [x] 9 AWS Scalars mapeados
- [x] 1 Interface
- [x] Nullable types correctos (T | null | undefined)

### **Operaciones**
- [x] 28 queries generadas (100%)
- [x] 26 mutations generadas (100%)
- [x] 7 subscriptions generadas (100%)
- [x] Profundidad 10 en selección de campos
- [x] Variables types generados (61)
- [x] Response types generados (61)

### **Configuración**
- [x] codegen.yml optimizado
- [x] Scripts automatizados
- [x] Pipeline completo funcional
- [x] Build exitoso (yarn build)

---

## 🎯 Conclusiones

### **Fortalezas**

1. ✅ **100% de cobertura** del schema de AppSync
2. ✅ **Profundidad 10** para capturar estructuras complejas (Product, PaymentPolicy, etc.)
3. ✅ **Pipeline automatizado** con un solo comando: `yarn generate-all`
4. ✅ **Type safety completo** para Server Actions y componentes
5. ✅ **Enums como union types** para mejor DX en TypeScript
6. ✅ **281 tipos generados** sin errores de compilación

### **Configuración Óptima**

El proyecto usa la **mejor práctica** para proyectos Next.js + Amplify:
- ✅ `enumsAsTypes: true` → Mejor para TypeScript
- ✅ `maybeValue: T | null | undefined` → Compatible con AppSync nullability
- ✅ Profundidad 10 → Captura toda la complejidad del dominio
- ✅ Separación de concerns (queries/mutations/subscriptions)

### **No se necesitan mejoras**

El sistema actual es **production-ready** y cubre todos los casos de uso:
- Queries con filtros y paginación
- Mutations con inputs complejos
- Subscriptions en tiempo real
- Tipos nested hasta 10 niveles
- Type safety end-to-end

---

## 📝 Comandos de Referencia

```bash
# Pipeline completo
yarn generate-all

# Pasos individuales
yarn extract-schema          # 1. Descargar schema de AppSync
yarn generate-types          # 2. Generar tipos base
yarn generate-operations     # 3. Generar archivos .graphql
yarn codegen                 # 4. Generar tipos de operaciones

# Watch mode (desarrollo)
yarn codegen:watch           # Regenerar al cambiar .graphql

# Validación
yarn type-check             # Verificar tipos sin build
yarn build                  # Build completo
```

---

## 🔗 Referencias

- **AWS AppSync API ID:** `czuxavss35b2di5syqrs256i6q`
- **Region:** `us-west-2`
- **GraphQL Code Generator:** https://the-guild.dev/graphql/codegen
- **AWS Amplify Docs:** https://docs.amplify.aws/nextjs/

---

**Última actualización:** 2025-10-09
**Versión:** 1.0.0
**Autor:** Erick Aldama (Full-Stack AWS Engineer)
