# Análisis Profundo: ProductWizard con Next.js 15.3.4 y AWS Amplify Gen 2 v6

## 📊 Estado Actual de la Arquitectura

### 1. Patrón de Componentes Implementado

#### ✅ Server Components (Correctamente implementados)
```typescript
// /app/provider/(protected)/products/create/page.tsx
export default async function CreateProductPage() {
  const auth = await RouteProtectionWrapper.protectProvider(true);
  return <CreateProductClient userId={auth.user.id} />;
}
```
- **Autenticación en servidor**: Se valida en el server antes de renderizar
- **Protección de rutas**: RouteProtectionWrapper ejecuta en servidor
- **Props seguras**: Solo pasa `userId` al cliente, no tokens sensibles

#### ⚠️ Client Components (Necesitan optimización)
```typescript
'use client';
// ProductWizard.tsx, CreateProductClient.tsx, todos los steps
```
- **Problema**: TODO el wizard es client-side
- **Impacto**: Bundle JavaScript grande, no aprovecha SSR
- **Solución propuesta**: Híbrido con más Server Components

### 2. Server Actions Implementadas

#### ✅ Acciones Correctas
```typescript
// product-wizard-actions.ts
export async function createCircuitProductAction(
  input: CreateProductOfTypeCircuitInput
): Promise<ProductActionResponse> {
  // 1. Autenticación servidor
  // 2. Validación permisos
  // 3. Validación seguridad
  // 4. Transformación URLs
  // 5. Operación GraphQL
  // 6. Revalidación cache
}
```

#### ⚠️ Problemas Detectados
1. **No se usan desde el wizard**: El wizard usa GraphQL directo desde el cliente
2. **Duplicación de lógica**: Validaciones en cliente Y servidor
3. **Sin optimistic updates**: No hay feedback inmediato

### 3. Integración AWS Amplify Gen 2 v6

#### ⚠️ Problemas Críticos

##### Storage (Archivos Multimedia)
```typescript
// MediaUploadZone.tsx - Problema actual
import { uploadData } from 'aws-amplify/storage';

// URLs S3 directas sin presignado
preview: formData.cover_image_url // ❌ Bucket privado, no funciona
```

**Solución Requerida**:
```typescript
// Usar getUrl para URLs presignadas
import { getUrl } from 'aws-amplify/storage';

const signedUrl = await getUrl({
  path: imagePath,
  options: {
    expiresIn: 3600, // 1 hora
    validateObjectExistence: true
  }
});
```

##### Autenticación
```typescript
// ✅ Correcto: useAuth() del Context
const { user } = useAuth();

// ❌ Evitar: Amplify Auth directo en cliente
import { getCurrentUser } from 'aws-amplify/auth';
```

### 4. Problemas de Rendimiento

#### Bundle Size
- **ProductWizard.tsx**: 595 líneas, todo client-side
- **ProductFormContext.tsx**: 260 líneas, localStorage pesado
- **Cada Step**: 400-500 líneas promedio

#### Re-renders Excesivos
```typescript
// Problema: Actualización en cada keystroke
useEffect(() => {
  updateFormData({ name }); // Se ejecuta en cada cambio
}, [name]);
```

**Solución**: Debounce implementado parcialmente, necesita mejora

#### localStorage Abuse
```typescript
// Se guarda TODO el formData en cada cambio
localStorage.setItem('yaan-wizard-${productType}', JSON.stringify(formData));
```

## 🔧 Mejoras Propuestas

### 1. Arquitectura Híbrida Server/Client

```typescript
// Nuevo: ProductWizardServer.tsx
export default async function ProductWizardServer({
  userId,
  productType
}: Props) {
  // Cargar datos iniciales en servidor
  const preferences = await getPreferences();
  const languages = await getLanguages();

  return (
    <ProductWizardClient
      userId={userId}
      productType={productType}
      initialData={{
        preferences,
        languages
      }}
    />
  );
}
```

### 2. Server Actions para Todo

```typescript
// Nuevo flujo con Server Actions
'use server';

export async function saveProductStepAction(
  stepId: string,
  data: StepData
) {
  // Validar en servidor
  const validation = await validateStepDataAction(stepId, data);
  if (!validation.success) return validation;

  // Guardar en base de datos temporal
  await saveDraftToDatabase(data);

  // Revalidar solo lo necesario
  revalidatePath(`/provider/products/create?step=${stepId}`);

  return { success: true };
}
```

### 3. Optimización de Context

```typescript
// Usar useOptimistic para feedback inmediato
function ProductFormProvider({ children }: Props) {
  const [optimisticData, addOptimisticUpdate] = useOptimistic(
    formData,
    (state, newData) => ({ ...state, ...newData })
  );

  const updateFormData = async (data: Partial<FormData>) => {
    // Update optimista inmediato
    addOptimisticUpdate(data);

    // Server action en background
    await saveProductStepAction(currentStep, data);
  };
}
```

### 4. Storage con Amplify v6 Correcto

```typescript
// utils/amplify-storage-v6.ts
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

export async function uploadProductMedia(
  file: File,
  productId: string,
  type: 'cover' | 'gallery' | 'video'
) {
  const path = `products/${productId}/${type}/${file.name}`;

  // Upload con progreso
  const operation = uploadData({
    path,
    data: file,
    options: {
      onProgress: ({ transferredBytes, totalBytes }) => {
        const progress = (transferredBytes / totalBytes) * 100;
        // Actualizar UI
      }
    }
  });

  const result = await operation.result;

  // Obtener URL presignada
  const { url } = await getUrl({
    path: result.path,
    options: { expiresIn: 3600 }
  });

  return { path: result.path, url: url.toString() };
}
```

### 5. Validación Unificada con Zod

```typescript
// lib/validations/unified-product-schemas.ts
import { z } from 'zod';

// Schema compartido servidor/cliente
export const productStepSchemas = {
  'general-info': z.object({
    name: z.string().min(3).max(100),
    description: z.string().min(20).max(1000),
    preferences: z.array(z.string()).min(1),
    languages: z.array(z.string()).min(1),
    cover_image_url: z.string().url().optional()
  }),
  // ... más schemas
};

// Validar en Server Action
export async function validateProductStep(
  stepId: string,
  data: unknown
) {
  const schema = productStepSchemas[stepId];
  return schema.safeParseAsync(data);
}
```

### 6. Lazy Loading Mejorado

```typescript
// Cargar steps bajo demanda
const stepComponents = {
  'general-info': lazy(() => import('./steps/GeneralInfoStep')),
  'product-details': lazy(() =>
    formData.productType === 'circuit'
      ? import('./steps/ProductDetailsStep')
      : import('./steps/PackageDetailsStep')
  ),
  // ...
};

// Suspense con fallback específico por step
<Suspense fallback={<StepSkeleton stepId={currentStep.id} />}>
  <StepComponent {...props} />
</Suspense>
```

## 📋 Plan de Migración

### Fase 1: Server Actions (Prioridad Alta)
1. ✅ Implementar `saveProductStepAction`
2. ✅ Migrar validaciones a Server Actions
3. ✅ Reemplazar GraphQL directo por Server Actions

### Fase 2: Storage Amplify v6 (Prioridad Alta)
1. ✅ Implementar `uploadProductMedia` con getUrl
2. ✅ Migrar MediaUploadZone a usar paths en lugar de URLs
3. ✅ Implementar preview con URLs presignadas

### Fase 3: Optimización Performance (Prioridad Media)
1. ✅ Implementar debounce global
2. ✅ Reducir uso de localStorage
3. ✅ Implementar useOptimistic

### Fase 4: Server Components (Prioridad Baja)
1. ✅ Crear ProductWizardServer
2. ✅ Mover lógica estática a servidor
3. ✅ Reducir bundle del cliente

## 🚨 Problemas Críticos a Resolver

### 1. URLs S3 No Funcionan (CRÍTICO)
**Problema**: Las URLs directas de S3 no funcionan porque el bucket es privado
**Solución**: Implementar getUrl() para URLs presignadas
**Archivo**: `MediaUploadZone.tsx`, `MediaPreview.tsx`

### 2. Validación Duplicada
**Problema**: Validación en cliente Y servidor sin sincronización
**Solución**: Schemas Zod compartidos
**Archivo**: Crear `unified-product-schemas.ts`

### 3. Estado No Persistente
**Problema**: Se pierde el progreso si hay error
**Solución**: Guardar drafts en base de datos
**Archivo**: Implementar en Server Actions

### 4. Sin Feedback de Progreso
**Problema**: Usuario no ve progreso de uploads
**Solución**: Implementar onProgress de Amplify v6
**Archivo**: `MediaUploadZone.tsx`

## 🎯 Métricas de Éxito

### Performance
- [ ] Reducir bundle inicial en 40%
- [ ] Time to Interactive < 3s
- [ ] Eliminar re-renders innecesarios

### UX
- [ ] Feedback inmediato con optimistic updates
- [ ] Progreso de upload visible
- [ ] Autoguardado cada 30 segundos

### Seguridad
- [ ] Todas las validaciones en servidor
- [ ] URLs presignadas con expiración
- [ ] Sanitización de inputs

## 📚 Referencias

- [Next.js 15 Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js 15 Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [AWS Amplify Gen 2 Storage](https://docs.amplify.aws/gen2/build-a-backend/storage/)
- [AWS Amplify v6 Migration](https://docs.amplify.aws/gen1/javascript/tools/libraries/migrate-to-v6/)

---

**Última actualización**: 2025-10-11
**Autor**: Claude (Análisis profundo del ProductWizard)