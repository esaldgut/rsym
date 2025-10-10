# Arquitectura por Dominios - Next.js 15 + AWS Amplify Gen 2 v6

## 📁 Estructura de Dominios

```
src/domains/
├── marketplace/           # Dominio del Marketplace
│   ├── server/           # Server Components y Actions
│   │   ├── actions/      # Server Actions
│   │   └── components/   # Server Components
│   ├── client/          # Client Components
│   │   ├── components/  # Interactive UI
│   │   └── hooks/       # Custom hooks
│   ├── lib/             # Business logic
│   └── types/           # TypeScript types
│
├── provider/            # Dominio del Proveedor
│   ├── server/
│   ├── client/
│   ├── lib/
│   └── types/
│
├── reservations/        # Dominio de Reservas
│   ├── server/
│   ├── client/
│   ├── lib/
│   └── types/
│
├── auth/               # Dominio de Autenticación
│   ├── server/
│   ├── client/
│   ├── lib/
│   └── types/
│
└── shared/             # Código compartido
    ├── ui/             # UI components
    ├── utils/          # Utilidades
    └── types/          # Tipos globales
```

## 🏗️ Arquitectura Correcta

### 1. **Server Components por Defecto**
- Todos los componentes son Server Components a menos que necesiten interactividad
- Datos fetched en servidor con `generateServerClientUsingCookies`
- Streaming y Suspense para mejor performance

### 2. **Server Actions para Mutaciones**
```typescript
'use server';

export async function createResourceAction(input: Input) {
  const client = generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies: () => cookies()
  });

  const result = await client.graphql({
    query: createResource,
    variables: { input }
  });

  revalidateTag('resources');
  return result;
}
```

### 3. **Client Components Solo para Interactividad**
```typescript
'use client';

// Solo cuando necesitas:
// - useState, useEffect
// - Event handlers
// - Browser APIs
// - Real-time updates
```

### 4. **SSR con generateServerClientUsingCookies**
- Autenticación automática vía cookies
- Type-safe con Schema
- No expone tokens en cliente

### 5. **Subscriptions para Real-Time**
```typescript
// Client component con subscription
export function LiveUpdates() {
  const subscription = client.graphql({
    query: onResourceUpdate
  }).subscribe({
    next: (data) => updateUI(data)
  });
}
```

## 🎯 Patrones Clave

### Patrón Server-First
```typescript
// page.tsx - Server Component
export default async function Page() {
  const data = await getDataAction();
  return <ClientComponent initialData={data} />;
}
```

### Patrón de Paginación con nextToken
```typescript
export async function getResourcesAction(nextToken?: string) {
  const result = await client.graphql({
    query: getResources,
    variables: {
      pagination: { limit: 20, nextToken }
    }
  });
  return result.data;
}
```

### Patrón de Cache y Revalidación
```typescript
const getCachedData = unstable_cache(
  async () => fetchData(),
  ['cache-key'],
  { revalidate: 300, tags: ['data'] }
);

// After mutation
revalidateTag('data');
```

### Patrón de Error Handling
```typescript
interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function action(): Promise<ServerActionResponse<Data>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 🚀 Optimizaciones Next.js 15

1. **Partial Prerendering**: Combina static y dynamic rendering
2. **Server Actions**: Mutaciones sin API routes
3. **Streaming SSR**: Envía HTML mientras se genera
4. **React Server Components**: Reduce bundle size
5. **Parallel Routes**: Carga rutas en paralelo
6. **Error Boundaries**: Manejo granular de errores

## 📊 Métricas de Performance

- **Time to First Byte (TTFB)**: < 200ms con SSR
- **First Contentful Paint (FCP)**: < 1s con streaming
- **Cumulative Layout Shift (CLS)**: < 0.1 con suspense
- **Bundle Size**: -70% con Server Components

## 🔒 Seguridad

- Cookies HTTP-only para tokens
- Server Actions validan auth automáticamente
- No exponer secrets en cliente
- Rate limiting en Server Actions
- CSRF protection automática

## 📝 Mejores Prácticas

1. **Preferir Server Components**: Menos JS en cliente
2. **Use Server Actions**: Para todas las mutaciones
3. **Implementar Suspense**: Para mejor UX
4. **Cache Agresivo**: Con revalidación inteligente
5. **Optimistic Updates**: En Client Components
6. **Error Boundaries**: En cada nivel
7. **Type Safety**: End-to-end con TypeScript
8. **Monitoring**: CloudWatch para performance

## 🔄 Migración Progresiva

1. Identificar componentes sin estado → Server Components
2. Extraer mutaciones → Server Actions
3. Implementar SSR con generateServerClientUsingCookies
4. Agregar Suspense boundaries
5. Optimizar con cache y streaming
6. Implementar real-time donde sea necesario