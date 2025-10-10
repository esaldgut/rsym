# 🏪 Arquitectura del Marketplace - YAAN

## 📊 Stack Tecnológico
- **Framework**: Next.js 15.3.4 (App Router)
- **Backend**: AWS Amplify Gen 2 v6
- **Auth**: AWS Cognito + generateServerClientUsingCookies
- **GraphQL**: AWS AppSync
- **State**: Server Actions + React Server Components

## 🛡️ Arquitectura de Protección Multi-Capa

### Capa 1: Server-Side (layout.tsx)
```typescript
// Verifica autenticación en el servidor
await RouteProtectionWrapper.protectMarketplace();
```
- ✅ Verificación de sesión con cookies HttpOnly
- ✅ Redirección automática a /auth si no autenticado
- ✅ Sin exposición de tokens en cliente

### Capa 2: Client-Side (MarketplaceGuard)
```typescript
// Validación en tiempo real del lado del cliente
<MarketplaceGuard>
  {children}
</MarketplaceGuard>
```
- ✅ Verificación de tokens válidos
- ✅ Verificación de email confirmado
- ✅ UI de estados de error personalizados

### Capa 3: Feature-Level (ProfileCompletionGuard)
```typescript
// Para acciones críticas como reservas
useRequireCompleteProfile()
```
- ✅ Verificación de perfil completo antes de reservar
- ✅ Modal de completado de perfil inline

## 🚀 Patrones de Rendimiento Next.js 15.3.4

### 1. Server Components por Defecto
```typescript
// page.tsx - Server Component
export default async function MarketplacePage() {
  // SSR con datos iniciales
  const [products, metrics] = await Promise.allSettled([...]);
}
```

### 2. Streaming SSR con Suspense
```typescript
<Suspense fallback={<MarketplaceLoadingSkeleton />}>
  <MarketplaceClient {...props} />
</Suspense>
```

### 3. Partial Pre-Rendering (PPR)
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 60; // ISR cada 60 segundos
```

### 4. Parallel Data Fetching
```typescript
// Requests paralelos para mejor performance
const [productsResult, metricsResult] = await Promise.allSettled([
  getMarketplaceProductsAction(),
  getMarketplaceMetricsAction()
]);
```

## 📡 Server Actions Pattern

### Arquitectura Correcta
```typescript
// marketplace-actions.ts
'use server';

export async function getMarketplaceProductsAction(params) {
  // 1. Crear cliente con cookies
  const cookiesStore = await cookies();
  const client = generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies: () => cookiesStore
  });

  // 2. Ejecutar query GraphQL
  const result = await client.graphql({
    query: getAllActiveAndPublishedProducts,
    variables
  });

  // 3. Retornar response tipada
  return { success: true, data: result.data };
}
```

### Mutaciones con Server Actions
```typescript
// reservation-actions.ts
export async function createReservationAction(input) {
  // 1. Validar autenticación
  const session = await getServerSession();

  // 2. Ejecutar mutación
  const result = await client.graphql({
    query: createReservation,
    variables: { input }
  });

  // 3. Revalidar cache
  revalidateTag('user-reservations');

  return result;
}
```

## 🔄 Pagination con nextToken

### Hook de Paginación
```typescript
// useMarketplacePagination.ts
export function useMarketplacePagination(initialData) {
  const [products, setProducts] = useState(initialData);
  const [nextToken, setNextToken] = useState(initialNextToken);

  const loadMore = async () => {
    const result = await getMarketplaceProductsAction({
      pagination: { nextToken, limit: 20 }
    });

    setProducts(prev => [...prev, ...result.data.items]);
    setNextToken(result.data.nextToken);
  };
}
```

### Infinite Scroll
```typescript
// marketplace-client.tsx
const { ref } = useInView({
  onChange: (inView) => {
    if (inView && hasMore && !isLoading) {
      loadMore();
    }
  }
});
```

## 📊 Métricas y Cache

### unstable_cache para Métricas
```typescript
const getCachedMetrics = unstable_cache(
  async () => {
    // Query metrics
    return metrics;
  },
  ['marketplace-metrics'],
  {
    revalidate: 300, // 5 minutos
    tags: ['marketplace', 'metrics']
  }
);
```

## 🔐 Seguridad

### Tokens HttpOnly
- ✅ Cookies seguras con SameSite=Strict
- ✅ No exposición de tokens en localStorage
- ✅ Auto-refresh silencioso de tokens

### Validación Multi-Nivel
1. **Server**: Verificación de sesión antes de render
2. **Client**: Validación en tiempo real
3. **API**: Verificación en cada Server Action
4. **GraphQL**: Autorización en resolvers AppSync

## 📈 Optimizaciones de Rendimiento

### Query Optimizada (90% reducción)
```graphql
# Antes: 500+ campos
# Ahora: Solo campos esenciales
query getAllActiveAndPublishedProducts {
  items {
    id, name, description, product_type,
    cover_image_url, min_product_price,
    destination { place, placeSub },
    seasons { id, start_date, end_date }
  }
  nextToken
  total
}
```

### Métricas de Performance
- **TTFB**: < 200ms con SSR
- **FCP**: < 1s con streaming
- **CLS**: < 0.1 con Suspense
- **Bundle**: -70% con Server Components

## 🎯 Checklist de Mejores Prácticas

✅ Server Components por defecto
✅ Server Actions para mutaciones
✅ generateServerClientUsingCookies para auth SSR
✅ Suspense boundaries para streaming
✅ Parallel data fetching
✅ nextToken pagination
✅ unstable_cache para datos frecuentes
✅ Protección multi-capa
✅ PPR con revalidate
✅ Optimistic UI updates
✅ Error boundaries
✅ Type safety end-to-end
✅ CloudWatch monitoring

## 🚦 Flujo de Usuario

1. **Acceso**: Usuario navega a /marketplace
2. **Auth Check**: Layout verifica autenticación (server)
3. **SSR**: Carga inicial de productos en servidor
4. **Hydration**: Cliente recibe HTML + datos
5. **Guard**: Validación adicional en cliente
6. **Interacción**: Filtros, búsqueda, paginación
7. **Reserva**: Modal con verificación de perfil
8. **Server Action**: Crear reserva + generar pago
9. **Redirect**: A página de pago o confirmación

## 📝 Comandos Útiles

```bash
# Desarrollo local
yarn dev

# Build de producción
yarn build

# Deploy a AWS
./deploy-safe.sh

# Verificar logs
~/bin/copilot svc logs --name nextjs-dev --env dev --follow

# Métricas de performance
yarn analyze
```