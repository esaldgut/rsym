# Solución de Route Groups para Provider

## Problema Original

La página `/provider/pending-approval` no renderizaba correctamente y mostraba una página en blanco con error `NEXT_REDIRECT` en la consola. Esto se debía a un **loop infinito de redirección**.

### Causa Raíz

El archivo `layout.tsx` en `/provider` aplicaba protección con `requireApproval: true` a **TODAS** las rutas bajo `/provider`, incluyendo `/provider/pending-approval`. Esto causaba:

1. Usuario no aprobado intenta acceder a `/provider/pending-approval`
2. El layout requiere aprobación completa
3. Sistema detecta que no está aprobado y redirige a... `/provider/pending-approval`
4. Loop infinito → página en blanco

## Solución Implementada: Next.js 15 Route Groups

### Estructura de Directorios

```
src/app/provider/
├── (protected)/           # Route Group para rutas protegidas
│   ├── layout.tsx        # Aplica protección con requireApproval: true
│   ├── page.tsx          # Dashboard principal
│   └── products/         # Gestión de productos
│       ├── page.tsx
│       ├── create/
│       └── [id]/
└── (public)/             # Route Group para rutas públicas
    └── pending-approval/ # Accesible sin aprobación completa
        └── page.tsx
```

### Características de Route Groups

1. **Organización sin afectar URLs**: Los paréntesis `()` crean grupos que no aparecen en las URLs
   - Archivo: `/provider/(protected)/products/page.tsx`
   - URL: `/provider/products` (NO `/provider/(protected)/products`)

2. **Layouts aislados**: Cada Route Group puede tener su propio layout
   - `(protected)/layout.tsx` solo aplica a rutas dentro de `(protected)`
   - `(public)` no tiene layout, por lo que no aplica protección

3. **Separación clara de concerns**:
   - `(protected)`: Rutas que requieren provider aprobado
   - `(public)`: Rutas accesibles para providers pendientes

## Implementación

### 1. Layout Protegido

```typescript
// src/app/provider/(protected)/layout.tsx
export default async function ProviderProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SIEMPRE requiere aprobación completa
  const auth = await RouteProtectionWrapper.protectProvider(true);

  return <>{children}</>;
}
```

### 2. Página Pending Approval (sin protección)

```typescript
// src/app/provider/(public)/pending-approval/page.tsx
export default async function PendingApprovalPage() {
  // Solo verifica que es un provider, NO requiere aprobación
  const auth = await UnifiedAuthSystem.requireUserType('provider', {
    requireApproval: false,  // Importante: NO requerir aprobación
    requireGroup: false      // NO requerir grupo
  });

  // Renderizar estado de aprobación...
}
```

### 3. Sistema de Redirección

```typescript
// UnifiedAuthSystem maneja las redirecciones
if (!validation.permissions?.isApproved) {
  // Redirige a /provider/pending-approval (sin Route Groups en URL)
  redirect(`/${validation.user.userType}/pending-approval`);
}
```

## Flujos de Usuario

### Provider No Aprobado

1. Intenta acceder a `/provider` → Redirigido a `/provider/pending-approval`
2. Accede a `/provider/pending-approval` → Renderiza correctamente (sin loop)
3. Intenta acceder a `/provider/products` → Redirigido a `/provider/pending-approval`

### Provider Aprobado

1. Accede a `/provider` → Renderiza dashboard
2. Accede a `/provider/products` → Renderiza lista de productos
3. Accede a `/provider/pending-approval` → Ve estado aprobado con botón al dashboard

## Ventajas de la Solución

1. **No hay loops de redirección**: pending-approval está fuera del layout protegido
2. **Código limpio**: No hay lógica condicional compleja en el layout
3. **Escalable**: Fácil agregar más rutas públicas o protegidas
4. **Mantenible**: Separación clara entre rutas que requieren o no aprobación
5. **Sigue patrones de Next.js 15**: Uso correcto de Route Groups

## Testing

Para verificar que la solución funciona:

```bash
# Acceder como provider no aprobado
curl -I http://localhost:3000/provider/pending-approval
# Debería retornar 200 OK

# Acceder a ruta protegida
curl -I http://localhost:3000/provider/products
# Debería retornar 307 Redirect a /provider/pending-approval
```

O usar la página de test: `/test-provider-routes`

## Notas Importantes

- **NO** incluir Route Groups en las URLs al hacer redirects o links
- **NO** poner lógica de protección en páginas individuales si ya está en el layout
- **SIEMPRE** verificar que las rutas públicas estén en `(public)` si no deben requerir aprobación
- Los Route Groups son solo para organización, no afectan las URLs finales

## Consideraciones sobre Imports al Usar Route Groups

### Problema Potencial
Cuando mueves archivos a Route Groups, la profundidad del directorio cambia:
- Antes: `/app/provider/ProviderPageClient.tsx` (2 niveles desde `/src`)
- Después: `/app/provider/(protected)/ProviderPageClient.tsx` (3 niveles desde `/src`)

Esto puede romper imports relativos como:
```typescript
// ❌ Esto se rompe después de mover a Route Groups
import { useAmplifyAuth } from '../../hooks/useAmplifyAuth';
```

### Solución Recomendada
Usar **imports absolutos** con el alias `@/` configurado en Next.js:

```typescript
// ✅ Funciona independientemente de la ubicación del archivo
import { useAmplifyAuth } from '@/hooks/useAmplifyAuth';
import { AuthSecurityWrapper } from '@/components/auth/AuthSecurityWrapper';
import { HeroSection } from '@/components/ui/HeroSection';
```

### Beneficios
1. **Resistente a refactorización**: Los imports no se rompen al mover archivos
2. **Más legible**: Es claro desde dónde viene cada import
3. **Consistente**: Un patrón único para toda la aplicación
4. **IDE friendly**: Mejor autocompletado y navegación

### Verificación
Para verificar imports después de mover archivos a Route Groups:
```bash
# Buscar imports relativos problemáticos
grep -r "from ['\"]\.\./" src/app/provider/
```

Si encuentras imports con `../`, cámbialos a imports absolutos con `@/`

## Archivos Modificados

1. **Movidos a `(protected)/`**:
   - `/provider/layout.tsx` → `/provider/(protected)/layout.tsx`
   - `/provider/page.tsx` → `/provider/(protected)/page.tsx`
   - `/provider/products/*` → `/provider/(protected)/products/*`
   - `/provider/ProviderPageClient.tsx` → `/provider/(protected)/ProviderPageClient.tsx`

2. **Movidos a `(public)/`**:
   - `/provider/pending-approval/` → `/provider/(public)/pending-approval/`

3. **Actualizados**:
   - `UnifiedAuthSystem`: URLs de redirección sin Route Groups
   - `RouteProtectionWrapper`: Default redirect a `/provider` no `/provider/pending-approval`
   - `ProviderPageClient.tsx`: Imports cambiados de relativos (`../../`) a absolutos (`@/`)

## Conclusión

La implementación de Route Groups resuelve el problema del loop infinito de manera elegante, siguiendo las mejores prácticas de Next.js 15 y manteniendo una separación clara entre rutas públicas y protegidas sin duplicación de código.