# 📱 Implementación de Friendship & Chat - Análisis Backend y Plan Frontend

## 📋 Tabla de Contenido

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Lambda toggle-friendship](#análisis-toggle-friendship)
3. [Análisis de Lambda mongodb-atlas-chat](#análisis-chat)
4. [Plan de Implementación Frontend](#plan-frontend)
5. [GraphQL Operations Requeridas](#graphql-operations)
6. [Server Actions](#server-actions)
7. [Server Components y UI](#server-components)

---

## 🎯 Resumen Ejecutivo

### Estado Actual
- ✅ **Backend Lambda Functions** - Completamente implementadas en Go
- ✅ **Base de datos MongoDB** - Esquema y colecciones definidas
- ❌ **Frontend GraphQL** - Sin operations para friendship/chat
- ❌ **Frontend Actions** - Sin Server Actions implementadas
- ❌ **Frontend UI** - Sin componentes implementados

### Objetivo
Implementar funcionalidad completa de **Connections/Friendship** y **Chat** en el frontend Next.js 15 usando:
- Server Components para renderizado SSR
- Server Actions para mutations
- GraphQL operations con AWS Amplify v6
- Optimistic updates para UX

---

## 📊 Análisis de Lambda toggle-friendship

### Arquitectura

```
toggle-friendship/
├── toggle-friendship.go  # Entry point y routing
├── models.go            # Tipos y estructuras de datos
├── business_logic.go    # Mutations (sendConnection, accept, reject, follow, etc.)
├── queries.go           # Queries (getMyConnections, getPendingRequests, etc.)
├── helpers.go           # Validaciones y utilidades
└── notifications.go     # Sistema de notificaciones (EventBridge/SNS)
```

### Colecciones MongoDB

#### 1. **Friendships** (Conexiones bidireccionales profesionales)

```go
type Friendship struct {
    ID          ObjectID
    UserID      string
    FriendID    string
    Status      string  // PENDING, ACCEPTED, REJECTED, CANCELLED, BLOCKED
    InitiatedBy string
    CreatedAt   time.Time
    UpdatedAt   time.Time
    Metadata    map[string]interface{}
    User        *UserBasic  // Poblado via aggregation
    Friend      *UserBasic  // Poblado via aggregation
}
```

**Estados**:
- `PENDING` - Solicitud enviada, esperando respuesta
- `ACCEPTED` - Conexión aceptada (ambos usuarios conectados)
- `REJECTED` - Solicitud rechazada por el receptor
- `CANCELLED` - Solicitud cancelada por el emisor
- `BLOCKED` - Usuario bloqueado (elimina todas las relaciones)

#### 2. **Follows** (Seguimientos unidireccionales sociales)

```go
type Follow struct {
    ID                  ObjectID
    FollowerID          string
    FollowingID         string
    Status              string  // ACTIVE, BLOCKED
    CreatedAt           time.Time
    NotificationEnabled bool
    Metadata            map[string]interface{}
}
```

#### 3. **UserStats** (Contadores denormalizados)

```go
type UserStats struct {
    UserID                   string  // _id (cognito_sub)
    ConnectionsCount         int
    PendingRequestsReceived  int
    PendingRequestsSent      int
    FollowersCount           int
    FollowingCount           int
    BlockedUsersCount        int
    UpdatedAt                time.Time
}
```

### Mutations Disponibles

#### Conexiones (Bidireccionales)

| Mutation | Descripción | Input | Output |
|----------|-------------|-------|--------|
| `sendConnectionRequest` | Enviar solicitud de conexión | `targetUserId: ID!` | `Friendship` |
| `acceptConnectionRequest` | Aceptar solicitud recibida | `requestId: ID!` | `Friendship` |
| `rejectConnectionRequest` | Rechazar solicitud recibida | `requestId: ID!` | `Friendship` |
| `cancelConnectionRequest` | Cancelar solicitud enviada | `requestId: ID!` | `Friendship` |
| `removeConnection` | Eliminar conexión existente | `connectionId: ID!` | `Boolean` |

#### Seguimientos (Unidireccionales)

| Mutation | Descripción | Input | Output |
|----------|-------------|-------|--------|
| `followUser` | Seguir a un usuario | `targetUserId: ID!` | `Follow` |
| `unfollowUser` | Dejar de seguir | `targetUserId: ID!` | `Boolean` |

#### Bloqueos

| Mutation | Descripción | Input | Output |
|----------|-------------|-------|--------|
| `blockUser` | Bloquear usuario (elimina todas relaciones) | `targetUserId: ID!` | `Boolean` |
| `unblockUser` | Desbloquear usuario | `targetUserId: ID!` | `Boolean` |

### Queries Disponibles

| Query | Descripción | Input | Output |
|-------|-------------|-------|--------|
| `getMyConnections` | Mis conexiones aceptadas | `status?: String, limit?: Int, nextToken?: String` | `FriendshipConnection` |
| `getPendingConnectionRequests` | Solicitudes recibidas pendientes | `limit?: Int, nextToken?: String` | `FriendshipConnection` |
| `getSentConnectionRequests` | Solicitudes enviadas pendientes | `limit?: Int, nextToken?: String` | `FriendshipConnection` |
| `getMyFollowers` | Mis seguidores | `limit?: Int, nextToken?: String` | `FollowConnection` |
| `getMyFollowing` | Usuarios que sigo | `limit?: Int, nextToken?: String` | `FollowConnection` |
| `getRelationshipStatus` | Estado de relación con otro usuario | `targetUserId: ID!` | `RelationshipStatus` |
| `getMyStats` | Mis estadísticas | - | `UserStats` |
| `getUserStats` | Estadísticas de un usuario | `userId: ID!` | `UserStats` |
| `getBlockedUsers` | Usuarios bloqueados | `limit?: Int, nextToken?: String` | `FriendshipConnection` |

### Lógica de Negocio Importante

#### 1. **Solicitud Mutua Auto-Accept**

Si un usuario A envía solicitud a usuario B, y B ya había enviado solicitud a A, el backend **acepta automáticamente** ambas conexiones.

```go
// En sendConnectionRequest
if existing != nil && existing.Status == "PENDING" {
    if existing.InitiatedBy != userID {
        // Solicitud mutua, aceptar automáticamente
        return a.acceptConnectionRequest(ctx, userID, existing.ID.Hex())
    }
}
```

#### 2. **Bloqueo Elimina Todas las Relaciones**

Al bloquear un usuario:
- Se crea/actualiza un registro `Friendship` con `status=BLOCKED`
- Se eliminan todos los `Follow` en ambas direcciones
- Se actualiza `blocked_users_count` en UserStats

#### 3. **Transacciones MongoDB**

Todas las operaciones que modifican múltiples documentos usan **transacciones** para garantizar consistencia:
- Actualizar Friendship/Follow + actualizar UserStats atómicamente

#### 4. **Notificaciones Asíncronas**

El sistema envía notificaciones via:
- **EventBridge** (principal) - Para procesamiento posterior
- **SNS** (fallback) - Push notifications directo
- **CloudWatch Logs** - Logging estructurado

Eventos notificados:
- `connection_request_received`
- `connection_request_accepted`
- `new_follower`
- `user_blocked`

---

## 💬 Análisis de Lambda mongodb-atlas-chat

### Arquitectura

```
mongodb-atlas-chat/
├── main.go            # Entry point y routing
├── models.go          # Conversation, Message, Participant
├── mutations.go       # sendMessage, markAsRead, markAsDelivered
├── queries.go         # listConversations, getMessages, getOrCreateConversation
├── helpers.go         # Validación de permisos de chat
├── cache.go           # Caching de conversaciones y permisos
├── rate_limiter.go    # Rate limiting por usuario
├── circuit_breaker.go # Circuit breaker para resiliencia
└── observability.go   # Métricas CloudWatch
```

### Colecciones MongoDB

#### 1. **Conversations** (Conversaciones 1:1)

```go
type Conversation struct {
    ID                   ObjectID
    ParticipantIDs       []string           // [user1_id, user2_id] ordenados alfabéticamente
    ParticipantUsernames []string
    ParticipantTypes     []ParticipantType  // [{userId, userType}, ...]
    LastMessage          *LastMessage       // Snapshot del último mensaje
    UnreadCount          []UnreadCount      // [{userId, count}, ...]
    CreatedAt            time.Time
    UpdatedAt            time.Time
}
```

**Índices importantes**:
- `participant_ids` - Para buscar conversaciones por usuario
- `updated_at` - Para ordenar por última actividad

#### 2. **Messages** (Mensajes)

```go
type Message struct {
    ID             ObjectID
    ConversationID ObjectID
    SenderID       string
    SenderUsername string
    Content        string
    Type           string           // "text", "image", "location"
    Metadata       *MessageMetadata // URL imagen, coordenadas, etc.
    Status         string           // "sent", "delivered", "read"
    Timestamp      time.Time
    CreatedAt      time.Time
}
```

**Estados de mensaje**:
- `sent` - Mensaje enviado, aún no entregado
- `delivered` - Mensaje recibido por el destinatario
- `read` - Mensaje leído por el destinatario

### Reglas de Permisos de Chat 🔒

**IMPORTANTE**: El sistema implementa validación de permisos antes de permitir enviar mensajes.

#### Escenarios de Comunicación

| Escenario | Regla | Requiere |
|-----------|-------|----------|
| **Traveler ↔ Traveler** | Conexión profesional | `friendship.status = "ACCEPTED"` |
| **Influencer ↔ Influencer** | Conexión profesional | `friendship.status = "ACCEPTED"` |
| **Traveler ↔ Influencer** | Conexión profesional | `friendship.status = "ACCEPTED"` |
| **Traveler ↔ Provider** | Reservación activa | `reservation.status IN ("confirmed", "active")` |
| **Influencer ↔ Provider** | Reservación activa | `reservation.status IN ("confirmed", "active")` |
| **Provider ↔ Provider** | Conexión profesional | `friendship.status = "ACCEPTED"` |

```go
// Código de validación en helpers.go
func (a *App) validateChatPermission(ctx context.Context, user1ID, user1Type, user2ID, user2Type string) (*ChatPermission, error) {
    // 1. Verificar bloqueos
    if isBlocked, _ := a.isUserBlocked(ctx, user1ID, user2ID); isBlocked {
        return &ChatPermission{Allowed: false, Reason: "usuario bloqueado"}, nil
    }

    // 2. Determinar escenario (provider chat vs regular chat)
    isProviderChat := a.isProviderChatScenario(user1Type, user2Type)

    if isProviderChat {
        // Requiere reservación activa
        hasReservation, _ := a.hasActiveReservation(ctx, user1ID, user2ID, user1Type, user2Type)
        return &ChatPermission{
            Allowed: hasReservation,
            Reason: "se requiere una reservación activa"
        }, nil
    }

    // 3. Comunicación regular: requiere friendship ACCEPTED
    hasFriendship, _ := a.hasFriendshipAccepted(ctx, user1ID, user2ID)
    return &ChatPermission{
        Allowed: hasFriendship,
        Reason: "se requiere una conexión aceptada"
    }, nil
}
```

### Mutations Disponibles

| Mutation | Descripción | Input | Output |
|----------|-------------|-------|--------|
| `sendMessage` | Enviar mensaje | `SendMessageInput` | `Message` |
| `markMessagesAsRead` | Marcar mensajes como leídos | `conversationId: ID!` | `Boolean` |
| `markMessageAsDelivered` | Marcar mensaje como entregado | `messageId: ID!` | `Message` |

**SendMessageInput**:
```typescript
{
  recipientId: ID!
  content: String!
  type?: "text" | "image" | "location"
  metadata?: {
    imageUrl?: String
    location?: { lat: Float, lng: Float }
  }
}
```

### Queries Disponibles

| Query | Descripción | Input | Output |
|-------|-------------|-------|--------|
| `listMyConversations` | Mis conversaciones ordenadas por actividad | `limit?: Int, nextToken?: String` | `ConversationConnection` |
| `getConversationMessages` | Mensajes de una conversación | `conversationId: ID!, limit?: Int, nextToken?: String` | `MessageConnection` |
| `getOrCreateConversation` | Obtener/crear conversación con usuario | `participantId: ID!` | `Conversation` |
| `getConversationById` | Obtener conversación por ID | `conversationId: ID!` | `Conversation` |

### Flujo de Envío de Mensaje

```
1. validateChatPermission() → Verifica permisos
2. findOrCreateConversation() → Busca o crea conversación
3. insertOne(message) → Inserta mensaje en colección messages
4. updateOne(conversation) → Actualiza lastMessage y unreadCount
5. return message → Retorna mensaje creado
```

### Características Avanzadas

#### 1. **Caching Multi-Nivel**

```go
// Cache de conversaciones (LRU)
conversationCache *ConversationCache  // 100 items, 5 min TTL

// Cache de mensajes (LRU)
messageCache *MessageCache            // 500 items, 2 min TTL

// Cache de permisos (LRU)
permissionCache *PermissionCache      // 200 items, 10 min TTL
```

#### 2. **Rate Limiting**

```go
rateLimiter *RateLimiter
// 30 mensajes por minuto por usuario
// 100 mensajes por hora por usuario
```

#### 3. **Circuit Breaker**

```go
CircuitBreaker *CircuitBreaker
// CLOSED → OPEN después de 5 errores consecutivos
// OPEN → HALF_OPEN después de 30s
// HALF_OPEN → CLOSED después de 3 requests exitosos
```

#### 4. **Observability**

```go
metrics *MetricsCollector
// CloudWatch Metrics:
// - MessagesSent
// - ConversationsCreated
// - CacheHitRate
// - ErrorRate
```

---

## 🚀 Plan de Implementación Frontend

### Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript (strict mode)
- **GraphQL Client**: AWS Amplify v6 (`generateServerClientUsingCookies`)
- **Rendering**: Server Components + Server Actions
- **State Management**: Optimistic updates con `useOptimistic`
- **Real-time**: GraphQL Subscriptions (opcional, futuro)

### Estructura de Archivos Propuesta

```
src/
├── app/
│   ├── friends/                    # Página de conexiones
│   │   ├── page.tsx               # Server Component
│   │   ├── pending/
│   │   │   └── page.tsx           # Solicitudes pendientes
│   │   └── following/
│   │       └── page.tsx           # Seguimientos
│   ├── chat/                       # Página de chat
│   │   ├── page.tsx               # Lista de conversaciones (SSR)
│   │   └── [conversationId]/
│   │       └── page.tsx           # Chat conversation (SSR + Client)
│   └── profile/
│       └── [username]/
│           └── page.tsx           # Perfil con RelationshipStatus
│
├── lib/
│   ├── server/
│   │   ├── friendship-actions.ts  # Server Actions para friendship
│   │   └── chat-actions.ts        # Server Actions para chat
│   ├── graphql/
│   │   ├── operations.ts          # GraphQL queries/mutations
│   │   └── types.ts               # TypeScript types
│   └── hooks/
│       ├── useFriendship.ts       # Client hook con optimistic updates
│       └── useChat.ts             # Client hook con optimistic updates
│
└── components/
    ├── friendship/
    │   ├── ConnectionButton.tsx   # Botón send/accept/reject connection
    │   ├── FollowButton.tsx       # Botón follow/unfollow
    │   ├── ConnectionsList.tsx    # Lista de conexiones
    │   ├── PendingRequestCard.tsx # Card de solicitud pendiente
    │   └── RelationshipBadge.tsx  # Badge de estado de relación
    └── chat/
        ├── ConversationList.tsx   # Lista de conversaciones
        ├── ConversationCard.tsx   # Card de conversación con unread count
        ├── ChatWindow.tsx         # Ventana de chat (Client Component)
        ├── MessageBubble.tsx      # Mensaje individual
        └── ChatInput.tsx          # Input de mensaje con optimistic update
```

---

## 📝 GraphQL Operations Requeridas

### Archivo: `/src/lib/graphql/operations.ts`

#### Queries - Friendship

```typescript
// ==================== FRIENDSHIP QUERIES ====================

export const getMyConnections = /* GraphQL */ `
  query GetMyConnections($status: String, $limit: Int, $nextToken: String) {
    getMyConnections(status: $status, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        friendId
        status
        initiatedBy
        createdAt
        updatedAt
        user {
          sub
          username
          name
          email
          userType
          avatarUrl
          bio
        }
        friend {
          sub
          username
          name
          email
          userType
          avatarUrl
          bio
        }
      }
      nextToken
      total
    }
  }
`;

export const getPendingConnectionRequests = /* GraphQL */ `
  query GetPendingConnectionRequests($limit: Int, $nextToken: String) {
    getPendingConnectionRequests(limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        friendId
        status
        initiatedBy
        createdAt
        user {
          sub
          username
          name
          avatarUrl
          userType
        }
      }
      nextToken
      total
    }
  }
`;

export const getSentConnectionRequests = /* GraphQL */ `
  query GetSentConnectionRequests($limit: Int, $nextToken: String) {
    getSentConnectionRequests(limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        friendId
        status
        initiatedBy
        createdAt
        friend {
          sub
          username
          name
          avatarUrl
          userType
        }
      }
      nextToken
      total
    }
  }
`;

export const getMyFollowers = /* GraphQL */ `
  query GetMyFollowers($limit: Int, $nextToken: String) {
    getMyFollowers(limit: $limit, nextToken: $nextToken) {
      items {
        id
        followerId
        followingId
        status
        createdAt
        notificationEnabled
      }
      nextToken
      total
    }
  }
`;

export const getMyFollowing = /* GraphQL */ `
  query GetMyFollowing($limit: Int, $nextToken: String) {
    getMyFollowing(limit: $limit, nextToken: $nextToken) {
      items {
        id
        followerId
        followingId
        status
        createdAt
        notificationEnabled
      }
      nextToken
      total
    }
  }
`;

export const getRelationshipStatus = /* GraphQL */ `
  query GetRelationshipStatus($targetUserId: ID!) {
    getRelationshipStatus(targetUserId: $targetUserId) {
      type
      isConnected
      isFollowing
      isFollower
      connectionStatus
      canSendRequest
      canFollow
    }
  }
`;

export const getMyStats = /* GraphQL */ `
  query GetMyStats {
    getMyStats {
      userId
      connectionsCount
      pendingRequestsReceived
      pendingRequestsSent
      followersCount
      followingCount
      blockedUsersCount
      updatedAt
    }
  }
`;

export const getUserStats = /* GraphQL */ `
  query GetUserStats($userId: ID!) {
    getUserStats(userId: $userId) {
      userId
      connectionsCount
      followersCount
      followingCount
      blockedUsersCount
      updatedAt
    }
  }
`;

export const getBlockedUsers = /* GraphQL */ `
  query GetBlockedUsers($limit: Int, $nextToken: String) {
    getBlockedUsers(limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        friendId
        status
        initiatedBy
        updatedAt
        friend {
          sub
          username
          name
          avatarUrl
        }
      }
      nextToken
      total
    }
  }
`;
```

#### Mutations - Friendship

```typescript
// ==================== FRIENDSHIP MUTATIONS ====================

export const sendConnectionRequest = /* GraphQL */ `
  mutation SendConnectionRequest($targetUserId: ID!) {
    sendConnectionRequest(targetUserId: $targetUserId) {
      id
      userId
      friendId
      status
      initiatedBy
      createdAt
      updatedAt
    }
  }
`;

export const acceptConnectionRequest = /* GraphQL */ `
  mutation AcceptConnectionRequest($requestId: ID!) {
    acceptConnectionRequest(requestId: $requestId) {
      id
      userId
      friendId
      status
      initiatedBy
      updatedAt
    }
  }
`;

export const rejectConnectionRequest = /* GraphQL */ `
  mutation RejectConnectionRequest($requestId: ID!) {
    rejectConnectionRequest(requestId: $requestId) {
      id
      userId
      friendId
      status
      updatedAt
    }
  }
`;

export const cancelConnectionRequest = /* GraphQL */ `
  mutation CancelConnectionRequest($requestId: ID!) {
    cancelConnectionRequest(requestId: $requestId) {
      id
      userId
      friendId
      status
      updatedAt
    }
  }
`;

export const removeConnection = /* GraphQL */ `
  mutation RemoveConnection($connectionId: ID!) {
    removeConnection(connectionId: $connectionId)
  }
`;

export const followUser = /* GraphQL */ `
  mutation FollowUser($targetUserId: ID!) {
    followUser(targetUserId: $targetUserId) {
      id
      followerId
      followingId
      status
      createdAt
      notificationEnabled
    }
  }
`;

export const unfollowUser = /* GraphQL */ `
  mutation UnfollowUser($targetUserId: ID!) {
    unfollowUser(targetUserId: $targetUserId)
  }
`;

export const blockUser = /* GraphQL */ `
  mutation BlockUser($targetUserId: ID!) {
    blockUser(targetUserId: $targetUserId)
  }
`;

export const unblockUser = /* GraphQL */ `
  mutation UnblockUser($targetUserId: ID!) {
    unblockUser(targetUserId: $targetUserId)
  }
`;
```

#### Queries - Chat

```typescript
// ==================== CHAT QUERIES ====================

export const listMyConversations = /* GraphQL */ `
  query ListMyConversations($limit: Int, $nextToken: String) {
    listMyConversations(limit: $limit, nextToken: $nextToken) {
      items {
        id
        participantIds
        participantUsernames
        participantTypes {
          userId
          userType
        }
        lastMessage {
          content
          senderId
          timestamp
        }
        unreadCount {
          userId
          count
        }
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const getConversationMessages = /* GraphQL */ `
  query GetConversationMessages($conversationId: ID!, $limit: Int, $nextToken: String) {
    getConversationMessages(conversationId: $conversationId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        conversationId
        senderId
        senderUsername
        content
        type
        metadata {
          imageUrl
          location {
            lat
            lng
          }
        }
        status
        timestamp
        createdAt
      }
      nextToken
    }
  }
`;

export const getOrCreateConversation = /* GraphQL */ `
  query GetOrCreateConversation($participantId: ID!) {
    getOrCreateConversation(participantId: $participantId) {
      id
      participantIds
      participantUsernames
      participantTypes {
        userId
        userType
      }
      lastMessage {
        content
        senderId
        timestamp
      }
      unreadCount {
        userId
        count
      }
      createdAt
      updatedAt
    }
  }
`;

export const getConversationById = /* GraphQL */ `
  query GetConversationById($conversationId: ID!) {
    getConversationById(conversationId: $conversationId) {
      id
      participantIds
      participantUsernames
      participantTypes {
        userId
        userType
      }
      lastMessage {
        content
        senderId
        timestamp
      }
      unreadCount {
        userId
        count
      }
      createdAt
      updatedAt
    }
  }
`;
```

#### Mutations - Chat

```typescript
// ==================== CHAT MUTATIONS ====================

export const sendMessage = /* GraphQL */ `
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      conversationId
      senderId
      senderUsername
      content
      type
      metadata {
        imageUrl
        location {
          lat
          lng
        }
      }
      status
      timestamp
      createdAt
    }
  }
`;

export const markMessagesAsRead = /* GraphQL */ `
  mutation MarkMessagesAsRead($conversationId: ID!) {
    markMessagesAsRead(conversationId: $conversationId)
  }
`;

export const markMessageAsDelivered = /* GraphQL */ `
  mutation MarkMessageAsDelivered($messageId: ID!) {
    markMessageAsDelivered(messageId: $messageId) {
      id
      status
    }
  }
`;
```

---

## 🎯 Server Actions

Implementar Server Actions siguiendo el patrón de `moments-actions.ts`.

### Archivo: `/src/lib/server/friendship-actions.ts`

```typescript
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import outputs from '../../../amplify/outputs.json';
import type { Schema } from '@/amplify/data/resource';
import * as mutations from '@/lib/graphql/operations';
import * as queries from '@/lib/graphql/operations';

// ========== CONNECTION REQUESTS ==========

export async function sendConnectionRequestAction(targetUserId: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.sub) throw new Error('Usuario no autenticado');

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.sendConnectionRequest,
      variables: { targetUserId }
    });

    if (errors || !data?.sendConnectionRequest) {
      throw new Error('Failed to send connection request');
    }

    revalidateTag('my-connections');
    revalidateTag('sent-requests');
    revalidateTag(`user-${targetUserId}-relationship`);

    return {
      success: true,
      data: data.sendConnectionRequest
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar solicitud'
    };
  }
}

export async function acceptConnectionRequestAction(requestId: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.sub) throw new Error('Usuario no autenticado');

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.acceptConnectionRequest,
      variables: { requestId }
    });

    if (errors || !data?.acceptConnectionRequest) {
      throw new Error('Failed to accept connection request');
    }

    revalidateTag('my-connections');
    revalidateTag('pending-requests');
    revalidateTag('my-stats');

    return {
      success: true,
      data: data.acceptConnectionRequest
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al aceptar solicitud'
    };
  }
}

// ... Similar para reject, cancel, remove, follow, unfollow, block, unblock

// ========== QUERIES ==========

export async function getMyConnectionsAction(
  status?: string,
  limit: number = 20,
  nextToken?: string
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.sub) throw new Error('Usuario no autenticado');

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getMyConnections,
      variables: { status, limit, nextToken }
    });

    if (errors) {
      throw new Error('Failed to fetch connections');
    }

    return {
      success: true,
      connections: data?.getMyConnections.items || [],
      nextToken: data?.getMyConnections.nextToken,
      total: data?.getMyConnections.total
    };
  } catch (error) {
    return {
      success: false,
      connections: [],
      error: error instanceof Error ? error.message : 'Error al cargar conexiones'
    };
  }
}

export async function getRelationshipStatusAction(targetUserId: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.sub) throw new Error('Usuario no autenticado');

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.getRelationshipStatus,
      variables: { targetUserId }
    });

    if (errors) {
      throw new Error('Failed to fetch relationship status');
    }

    return {
      success: true,
      status: data?.getRelationshipStatus
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estado de relación'
    };
  }
}
```

### Archivo: `/src/lib/server/chat-actions.ts`

```typescript
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import outputs from '../../../amplify/outputs.json';
import type { Schema } from '@/amplify/data/resource';
import * as mutations from '@/lib/graphql/operations';
import * as queries from '@/lib/graphql/operations';

// ========== SEND MESSAGE ==========

export async function sendMessageAction(input: {
  recipientId: string;
  content: string;
  type?: 'text' | 'image' | 'location';
  metadata?: {
    imageUrl?: string;
    location?: { lat: number; lng: number };
  };
}) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.sub) throw new Error('Usuario no autenticado');

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.sendMessage,
      variables: { input }
    });

    if (errors || !data?.sendMessage) {
      throw new Error('Failed to send message');
    }

    revalidateTag('my-conversations');
    revalidateTag(`conversation-${data.sendMessage.conversationId}`);

    return {
      success: true,
      message: data.sendMessage
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar mensaje'
    };
  }
}

// ========== MARK AS READ ==========

export async function markMessagesAsReadAction(conversationId: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.sub) throw new Error('Usuario no autenticado');

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.markMessagesAsRead,
      variables: { conversationId }
    });

    if (errors) {
      throw new Error('Failed to mark messages as read');
    }

    revalidateTag('my-conversations');
    revalidateTag(`conversation-${conversationId}`);

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al marcar como leído'
    };
  }
}

// ========== GET CONVERSATIONS ==========

export async function getMyConversationsAction(
  limit: number = 20,
  nextToken?: string
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.sub) throw new Error('Usuario no autenticado');

    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: queries.listMyConversations,
      variables: { limit, nextToken }
    });

    if (errors) {
      throw new Error('Failed to fetch conversations');
    }

    return {
      success: true,
      conversations: data?.listMyConversations.items || [],
      nextToken: data?.listMyConversations.nextToken
    };
  } catch (error) {
    return {
      success: false,
      conversations: [],
      error: error instanceof Error ? error.message : 'Error al cargar conversaciones'
    };
  }
}
```

---

## 📊 Próximos Pasos de Implementación

### Fase 1: GraphQL Operations (1-2 horas)
- [x] Analizar Lambdas Go
- [x] Documentar tipos y estructuras
- [ ] Agregar operations a `/src/lib/graphql/operations.ts`
- [ ] Agregar tipos a `/src/lib/graphql/types.ts`

### Fase 2: Server Actions (2-3 horas)
- [ ] Crear `/src/lib/server/friendship-actions.ts`
- [ ] Crear `/src/lib/server/chat-actions.ts`
- [ ] Implementar todas las mutations
- [ ] Implementar todas las queries
- [ ] Agregar revalidation tags apropiados

### Fase 3: Server Components (3-4 horas)
- [ ] Crear `/app/friends/page.tsx` (Lista de conexiones SSR)
- [ ] Crear `/app/friends/pending/page.tsx` (Solicitudes pendientes SSR)
- [ ] Crear `/app/chat/page.tsx` (Lista de conversaciones SSR)
- [ ] Crear `/app/chat/[conversationId]/page.tsx` (Chat SSR + Client)

### Fase 4: Client Components (4-5 horas)
- [ ] `ConnectionButton.tsx` con optimistic updates
- [ ] `FollowButton.tsx` con optimistic updates
- [ ] `ChatWindow.tsx` con optimistic message sending
- [ ] `ChatInput.tsx` con auto-scroll y typing indicators

### Fase 5: Testing y Pulido (2-3 horas)
- [ ] Testing de permisos de chat (provider vs regular)
- [ ] Testing de solicitudes mutuas (auto-accept)
- [ ] Testing de bloqueos (elimina relaciones)
- [ ] Testing de unread counts
- [ ] Error handling y loading states

---

## 🔗 Referencias

### Lambda Functions
- `/Users/esaldgut/dev/src/go/src/yaan/apps/yaan-backend/lambdas/toggle-friendship/`
- `/Users/esaldgut/dev/src/go/src/yaan/apps/yaan-backend/lambdas/mongodb-atlas-chat/`

### Frontend Existing Patterns
- `/src/lib/server/moments-actions.ts` - Patrón de Server Actions
- `/src/components/moments/MomentCard.tsx` - Patrón de optimistic updates

### Documentación
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [AWS Amplify v6 GraphQL](https://docs.amplify.aws/javascript/build-a-backend/graphqlapi/)
- [React useOptimistic](https://react.dev/reference/react/useOptimistic)

---

**Última actualización**: 2025-10-13
**Autor**: Claude AI + Erick Aldama
**Status**: ✅ Análisis completado, listo para implementación
