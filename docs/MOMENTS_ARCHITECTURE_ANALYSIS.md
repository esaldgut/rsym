# Moments Social Network - Análisis de Arquitectura Completa

**Fecha:** 2025-10-11
**Estado:** Análisis Profundo de Implementación Actual
**Objetivo:** Implementar red social robusta, segura y optimizada siguiendo patrones Next.js 15 + AWS Amplify Gen 2 v6

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [GraphQL Schema Analysis](#graphql-schema-analysis)
3. [Arquitectura Actual](#arquitectura-actual)
4. [Server Actions - Estado Actual](#server-actions---estado-actual)
5. [Client Components - Estado Actual](#client-components---estado-actual)
6. [Problemas Identificados](#problemas-identificados)
7. [Propuesta de Solución](#propuesta-de-solución)
8. [Comparación con ProductWizard](#comparación-con-productwizard)
9. [Plan de Implementación](#plan-de-implementación)

---

## 🎯 Resumen Ejecutivo

### Estado Actual ✅

La implementación de Moments está **MUY BIEN ESTRUCTURADA** comparada con ProductWizard. Ya sigue muchas de las buenas prácticas documentadas:

**Fortalezas:**
- ✅ Server Actions ya implementadas en `moments-actions.ts`
- ✅ Server Components correctamente usados en `/moments/page.tsx`
- ✅ GraphQL schema completo con todas las operaciones necesarias
- ✅ Componente de media upload especializado y optimizado
- ✅ Validación con Zod en formularios
- ✅ useOptimistic parcialmente implementado para likes

**Áreas de Mejora:**
- ⚠️ GraphQL operations NO están integradas (Server Actions usan TODOs)
- ⚠️ Video feed NO implementado (falta Instagram-style autoplay)
- ⚠️ Preview de multimedia básico (falta patrón robusto documentado)
- ⚠️ useOptimistic solo en likes, falta en comments y saves
- ⚠️ Subscriptions GraphQL no integradas para real-time

---

## 📊 GraphQL Schema Analysis

### Tipo `Moment` (líneas 213-234 de schema.graphql)

```graphql
type Moment {
  audioUrl: String
  comments: [ID]                    # IDs de comentarios
  created_at: AWSDateTime
  description: String
  destination: [Location]           # Array de ubicaciones
  experienceLink: String
  id: ID
  likeCount: Int
  likes: User                       # ⚠️ Tipo User, debería ser [User]
  preferences: [String]
  resourceType: String
  resourceUrl: [String]             # Array de URLs (imágenes/videos)
  saveCount: Int
  saves: User                       # ⚠️ Tipo User, debería ser [User]
  status: String
  tags: [String]
  updated_at: AWSDateTime
  user_data: User                   # Autor del momento
  viewerHasLiked: Boolean           # Estado del usuario actual
  viewerHasSaved: Boolean           # Estado del usuario actual
}
```

**Problemas en Schema:**
1. `likes: User` debería ser `likes: [User]` (array)
2. `saves: User` debería ser `saves: [User]` (array)
3. `comments: [ID]` solo tiene IDs, no objetos Comment completos

### Mutations Disponibles

```graphql
# Crear momento
createMoment(input: CreateMomentInput!): Moment

# Toggle like (funciona para Moments y Comments)
toggleLike(item_id: ID!, item_type: String!): LikePayload!

# Toggle save
toggleSave(item_id: ID!, item_type: String!): SavePayload!

# Crear comentario
createComment(input: CreateCommentInput!): Comment
```

**Tipos de Respuesta:**

```graphql
type LikePayload {
  newLikeCount: Int!
  success: Boolean!
  viewerHasLiked: Boolean!
}

type SavePayload {
  newSaveCount: Int!
  success: Boolean!
  viewerHasSaved: Boolean!
}
```

### Queries Disponibles

```graphql
getAllActiveMoments: [Moment]                    # Feed público
getAllMomentsByFollowing: [Moment]               # Feed personalizado
getAllMomentsByMyPreferences: [Moment]           # Basado en preferencias
getAllMomentsByUser: [Moment]                    # Perfil de usuario
getAllCommentsByMomentID(moment_id: ID!): [Comment]
```

### Input Types

```graphql
input CreateMomentInput {
  audioUrl: String
  description: String
  destination: [LocationInput]
  experienceLink: String
  preferences: [String]
  resourceType: String
  resourceUrl: [String]        # URLs de S3
  tags: [String]
}

input CreateCommentInput {
  comment: String
  moment_id: String
}
```

---

## 🏗️ Arquitectura Actual

### Estructura de Archivos

```
src/
├── app/
│   └── moments/
│       ├── page.tsx                        # ✅ Server Component (feed)
│       └── create/
│           └── page.tsx                    # ✅ Client Component (formulario)
│
├── components/
│   └── moments/
│       └── MomentMediaUpload.tsx          # ✅ Componente especializado
│
├── lib/
│   └── server/
│       └── moments-actions.ts             # ✅ Server Actions
│
└── graphql/
    ├── mutations/
    │   └── createMoment.graphql           # ✅ Mutation definida
    └── queries/
        └── getAllActiveMoments.graphql    # ✅ Query definida
```

### Flujo Actual de Datos

```
1. Usuario crea momento → /moments/create/page.tsx (Client)
2. Form submit → moments-actions.ts (Server Action)
3. Server Action → ❌ NO llama GraphQL (TODO pendiente)
4. Response → Redirect a /moments
5. Feed → /moments/page.tsx (Server Component)
6. Server Component → ❌ NO usa GraphQL (retorna mock data)
```

---

## ⚙️ Server Actions - Estado Actual

### Archivo: `/src/lib/server/moments-actions.ts` (276 líneas)

#### 1. `createMomentAction`

```typescript
export async function createMomentAction(
  formData: FormData
): Promise<ActionResponse<Moment>> {
  'use server'

  try {
    const user = await getAuthenticatedUser() // ✅ Usa UnifiedAuthSystem

    // ✅ Validación Zod
    const validation = createMomentSchema.safeParse({
      description: formData.get('description'),
      // ... más campos
    })

    // ✅ Upload de archivos multimedia a S3
    const uploadedMedia = await uploadMomentMedia(
      mediaFiles,
      user.userId,
      'temp-moment-id'
    )

    // ❌ TODO: Integrar con GraphQL
    // Actualmente retorna datos mock
    const newMoment: Moment = {
      id: 'temp-' + Date.now(),
      user_data: {
        sub: user.userId,
        name: user.name,
        username: user.username,
        avatar_url: user.picture
      },
      // ...
    }

    revalidatePath('/moments')
    return { success: true, data: newMoment }

  } catch (error) {
    return { success: false, error: 'Error creating moment' }
  }
}
```

**Análisis:**
- ✅ **Estructura correcta** con 'use server'
- ✅ **Autenticación** con UnifiedAuthSystem
- ✅ **Validación** con Zod schema
- ✅ **Upload a S3** con AWS Amplify Storage
- ✅ **Error handling** robusto
- ❌ **NO integra GraphQL mutation** (línea ~120)
- ❌ **Retorna mock data** en lugar de datos reales

#### 2. `toggleLikeAction`

```typescript
export async function toggleLikeAction(
  momentId: string,
  currentLiked: boolean
): Promise<ActionResponse<{ liked: boolean; likeCount: number }>> {
  'use server'

  const user = await getAuthenticatedUser()

  // ❌ TODO: Llamar toggleLike mutation
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 500))

  const newLiked = !currentLiked
  const likeCount = newLiked
    ? Math.floor(Math.random() * 100) + 1
    : Math.floor(Math.random() * 100)

  revalidatePath('/moments')
  return {
    success: true,
    data: { liked: newLiked, likeCount }
  }
}
```

**Análisis:**
- ✅ Estructura correcta
- ✅ Autenticación
- ❌ **Mock implementation** (línea ~180)
- ✅ revalidatePath para actualizar cache

#### 3. `getMomentsAction`

```typescript
export async function getMomentsAction(): Promise<ActionResponse<Moment[]>> {
  'use server'

  try {
    const user = await getAuthenticatedUser()

    // ❌ TODO: Usar getAllActiveMoments query
    // Mock data
    const moments: Moment[] = [/* ... mock data ... */]

    return { success: true, data: moments }
  } catch (error) {
    return { success: false, error: 'Error fetching moments' }
  }
}
```

**Análisis:**
- ✅ Estructura correcta
- ❌ **Retorna mock data** en lugar de GraphQL query

---

## 🎨 Client Components - Estado Actual

### 1. `/app/moments/page.tsx` (Server Component) ✅

```typescript
export default async function MomentsPage() {
  // ✅ Server Component - correcto para SSR
  const user = await getAuthenticatedUser()

  return (
    <RouteProtectionWrapper
      allowedUserTypes={['traveler', 'provider']}
      currentUserType={user.userType}
    >
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <Suspense fallback={<LoadingFeed />}>
          <MomentsFeed userId={user.userId} />
        </Suspense>
      </div>
    </RouteProtectionWrapper>
  )
}
```

**Análisis:**
- ✅ **Server Component** - correcto para SSR
- ✅ **RouteProtectionWrapper** para autenticación
- ✅ **Suspense** para lazy loading
- ⚠️ **Falta** componente `MomentsFeed` (referenciado pero no existe)

### 2. `/app/moments/create/page.tsx` (Client Component) ✅

```typescript
'use client'

export default function CreateMomentPage() {
  const form = useForm<CreateMomentFormData>({
    resolver: zodResolver(createMomentSchema), // ✅ Zod validation
    defaultValues: {
      description: '',
      tags: [],
      preferences: [],
      // ...
    }
  })

  const { mediaFiles, setMediaFiles } = useMomentMedia()

  const onSubmit = async (data: CreateMomentFormData) => {
    const formData = new FormData()
    // ... populate formData

    const result = await createMomentAction(formData) // ✅ Server Action

    if (result.success) {
      router.push('/moments')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ✅ React Hook Form integration */}
      <MomentMediaUpload
        userId={userId}
        onMediaChange={setMediaFiles}
        maxFiles={10}
      />
      {/* ... resto del formulario */}
    </form>
  )
}
```

**Análisis:**
- ✅ **Client Component** - correcto para formulario interactivo
- ✅ **React Hook Form** + **Zod** para validación
- ✅ **Server Action** llamada correctamente
- ✅ **useMomentMedia** hook personalizado
- ❌ **NO usa useOptimistic** para feedback inmediato
- ❌ **NO maneja errores de upload** con retry

### 3. `/components/moments/MomentMediaUpload.tsx` ✅

```typescript
export function MomentMediaUpload({
  momentId = 'temp',
  userId,
  onMediaChange,
  maxFiles = 10,
  className,
  placeholder = "Comparte fotos y videos de tu experiencia...",
  disabled = false
}: MomentMediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])

  // ✅ Configuración específica para Moments
  const momentsConfig = useMemo(() => ({
    maxImageSize: 25 * 1024 * 1024,  // 25MB
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  }), [])

  // ✅ Validación personalizada
  const validateMomentFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // ... validación por tipo y tamaño
  }, [momentsConfig])

  // ✅ Estadísticas de upload
  const uploadStats = useMemo(() => {
    const total = mediaFiles.length
    const completed = mediaFiles.filter(f => f.uploadStatus === 'complete').length
    const uploading = mediaFiles.filter(f => f.uploadStatus === 'uploading').length
    const failed = mediaFiles.filter(f => f.uploadStatus === 'error').length
    return { total, completed, uploading, failed }
  }, [mediaFiles])

  return (
    <div>
      {/* ✅ Upload Statistics */}
      {hasFiles && <UploadStats stats={uploadStats} />}

      {/* ✅ Media Preview - usando MediaPreview existente */}
      {hasFiles && (
        <MediaPreview
          files={mediaFiles}
          onRemove={(index) => handleMediaChange(mediaFiles.filter((_, i) => i !== index))}
          layout="grid"
          showProgress={true}
        />
      )}

      {/* ✅ Upload Zone - usando MediaUploadZone existente */}
      <MediaUploadZone
        files={mediaFiles}
        onFilesChange={handleMediaChange}
        productId={`moment-${momentId}`}
        type="gallery"
        accept="all"
        maxFiles={maxFiles}
      />
    </div>
  )
}
```

**Análisis:**
- ✅ **Reutiliza sistema multimedia YAAN** (MediaUploadZone, MediaPreview)
- ✅ **Validación específica** para Moments
- ✅ **Estadísticas de upload** para UX
- ✅ **useMemo** y **useCallback** para optimización
- ⚠️ **MediaPreview básico** - falta patrón robusto con retry/fallback
- ⚠️ **NO lazy loading** de previews (carga todos inmediatamente)

---

## ❌ Problemas Identificados

### 🔴 Críticos (Bloquean funcionalidad)

1. **GraphQL No Integrado**
   - Server Actions NO llaman mutations/queries reales
   - Toda la data es mock/hardcoded
   - `createMoment`, `toggleLike`, `getAllActiveMoments` no funcionan
   - **Ubicación:** `moments-actions.ts` líneas ~120, ~180, ~240

2. **Video Feed No Implementado**
   - NO existe componente `MomentsFeed`
   - NO hay autoplay estilo Instagram
   - NO usa Intersection Observer
   - **Referencia:** `instagram-video-feed.md` no aplicado

3. **Tipos GraphQL Incorrectos en Schema**
   - `likes: User` debería ser `likes: [User]`
   - `saves: User` debería ser `saves: [User]`
   - **Ubicación:** `schema.graphql` líneas 222, 227

### ⚠️ Importantes (Impactan UX)

4. **Preview de Multimedia No Robusto**
   - Usa `MediaPreview` básico sin retry logic
   - NO maneja URLs expiradas de S3
   - NO lazy loading de previews
   - NO fallback images
   - **Solución:** Aplicar patrón de `PRODUCT_WIZARD_OPTIMIZED_EXAMPLE.md`

5. **useOptimistic Incompleto**
   - Solo parcialmente implementado para likes
   - Falta en comments
   - Falta en saves
   - NO feedback inmediato en creación de moments
   - **Ubicación:** `create/page.tsx` línea ~85

6. **Subscriptions No Implementadas**
   - NO real-time para nuevos moments
   - NO notificaciones de likes/comments en tiempo real
   - GraphQL subscriptions definidas pero no usadas

### ℹ️ Mejoras (Optimización)

7. **Falta Infinite Scroll**
   - Feed carga todos los moments de una vez
   - NO pagination
   - NO usa `nextToken` de GraphQL

8. **Error Handling Básico**
   - Errores de upload NO se manejan con retry
   - NO exponential backoff
   - Toast messages genéricos

9. **Accesibilidad**
   - Videos sin controles accesibles
   - Falta ARIA labels en feed
   - NO keyboard navigation

---

## ✅ Propuesta de Solución

### Fase 1: Integración GraphQL (CRÍTICO)

**Objetivo:** Conectar Server Actions con GraphQL operations reales

#### 1.1. Integrar `createMoment` mutation

**Archivo:** `moments-actions.ts`

```typescript
import { generateClient } from 'aws-amplify/api'
import * as mutations from '@/graphql/mutations'

const client = generateClient()

export async function createMomentAction(
  formData: FormData
): Promise<ActionResponse<Moment>> {
  'use server'

  try {
    const user = await getAuthenticatedUser()

    // Validación Zod (ya existe) ✅
    const validation = createMomentSchema.safeParse({ /* ... */ })
    if (!validation.success) {
      return { success: false, error: 'Validation failed' }
    }

    // Upload multimedia (ya existe) ✅
    const uploadedMedia = await uploadMomentMedia(/* ... */)

    // ✅ NUEVO: Llamar GraphQL mutation
    const { data, errors } = await client.graphql({
      query: mutations.createMoment,
      variables: {
        input: {
          description: validation.data.description,
          tags: validation.data.tags,
          preferences: validation.data.preferences,
          resourceUrl: uploadedMedia.map(m => m.url),
          resourceType: 'mixed', // 'image' | 'video' | 'mixed'
          destination: validation.data.locations,
          experienceLink: validation.data.experienceLink,
          audioUrl: validation.data.audioUrl
        }
      }
    })

    if (errors || !data?.createMoment) {
      // Cleanup: eliminar archivos de S3 si falló
      await cleanupUploadedMedia(uploadedMedia)
      return { success: false, error: 'Failed to create moment' }
    }

    revalidatePath('/moments')
    return { success: true, data: data.createMoment }

  } catch (error) {
    console.error('createMomentAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

#### 1.2. Integrar `toggleLike` mutation

```typescript
export async function toggleLikeAction(
  momentId: string,
  currentLiked: boolean
): Promise<ActionResponse<LikePayload>> {
  'use server'

  try {
    const user = await getAuthenticatedUser()

    const { data, errors } = await client.graphql({
      query: mutations.toggleLike,
      variables: {
        item_id: momentId,
        item_type: 'moment'
      }
    })

    if (errors || !data?.toggleLike) {
      return { success: false, error: 'Failed to toggle like' }
    }

    revalidatePath('/moments')
    return { success: true, data: data.toggleLike }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to like moment'
    }
  }
}
```

#### 1.3. Integrar `getAllActiveMoments` query

```typescript
import * as queries from '@/graphql/queries'

export async function getMomentsAction(
  feedType: 'all' | 'following' | 'preferences' | 'user' = 'all'
): Promise<ActionResponse<Moment[]>> {
  'use server'

  try {
    const user = await getAuthenticatedUser()

    // Seleccionar query según tipo de feed
    const queryMap = {
      all: queries.getAllActiveMoments,
      following: queries.getAllMomentsByFollowing,
      preferences: queries.getAllMomentsByMyPreferences,
      user: queries.getAllMomentsByUser
    }

    const { data, errors } = await client.graphql({
      query: queryMap[feedType]
    })

    if (errors) {
      console.error('getMomentsAction errors:', errors)
      return { success: false, error: 'Failed to fetch moments' }
    }

    const moments = data?.getAllActiveMoments || []

    return { success: true, data: moments }

  } catch (error) {
    console.error('getMomentsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch moments'
    }
  }
}
```

### Fase 2: Video Feed con Autoplay (CRÍTICO)

**Objetivo:** Implementar feed estilo Instagram con autoplay

**Referencia:** `instagram-video-feed.md`

#### 2.1. Hook `useVideoAutoplay`

**Archivo:** `/src/hooks/useVideoAutoplay.ts`

```typescript
import { useEffect, useRef, useState } from 'react'

interface UseVideoAutoplayOptions {
  threshold?: number
  rootMargin?: string
  onPlay?: () => void
  onPause?: () => void
}

export function useVideoAutoplay({
  threshold = 0.7, // 70% visible para autoplay
  rootMargin = '0px',
  onPlay,
  onPause
}: UseVideoAutoplayOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)

        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          // Video visible, reproducir
          videoElement.play().then(() => {
            setIsPlaying(true)
            onPlay?.()
          }).catch(error => {
            console.warn('Autoplay blocked:', error)
          })
        } else {
          // Video no visible, pausar
          videoElement.pause()
          setIsPlaying(false)
          onPause?.()
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(videoElement)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, onPlay, onPause])

  return {
    videoRef,
    isPlaying,
    isInView
  }
}
```

#### 2.2. Componente `MomentsFeed`

**Archivo:** `/src/components/moments/MomentsFeed.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getMomentsAction } from '@/lib/server/moments-actions'
import { MomentCard } from './MomentCard'
import type { Moment } from '@/types'

interface MomentsFeedProps {
  userId: string
  feedType?: 'all' | 'following' | 'preferences' | 'user'
}

export function MomentsFeed({ userId, feedType = 'all' }: MomentsFeedProps) {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMoments() {
      setLoading(true)
      const result = await getMomentsAction(feedType)

      if (result.success && result.data) {
        setMoments(result.data)
      } else {
        setError(result.error || 'Failed to load moments')
      }

      setLoading(false)
    }

    loadMoments()
  }, [feedType])

  if (loading) {
    return <LoadingFeed />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (moments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No hay momentos para mostrar</p>
      </div>
    )
  }

  return (
    <div
      className="max-w-2xl mx-auto space-y-6 snap-y snap-mandatory overflow-y-scroll h-screen"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {moments.map(moment => (
        <div
          key={moment.id}
          className="snap-start snap-always"
        >
          <MomentCard moment={moment} currentUserId={userId} />
        </div>
      ))}
    </div>
  )
}
```

#### 2.3. Componente `MomentCard`

**Archivo:** `/src/components/moments/MomentCard.tsx`

```typescript
'use client'

import { useVideoAutoplay } from '@/hooks/useVideoAutoplay'
import { toggleLikeAction, toggleSaveAction } from '@/lib/server/moments-actions'
import { useOptimistic, useState } from 'react'
import type { Moment } from '@/types'

interface MomentCardProps {
  moment: Moment
  currentUserId: string
}

export function MomentCard({ moment, currentUserId }: MomentCardProps) {
  const [liked, setLiked] = useState(moment.viewerHasLiked || false)
  const [saved, setSaved] = useState(moment.viewerHasSaved || false)
  const [likeCount, setLikeCount] = useState(moment.likeCount || 0)
  const [saveCount, setSaveCount] = useState(moment.saveCount || 0)

  // ✅ useOptimistic para likes
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(
    liked,
    (state, newLiked: boolean) => newLiked
  )

  const [optimisticLikeCount, setOptimisticLikeCount] = useOptimistic(
    likeCount,
    (state, delta: number) => state + delta
  )

  const handleLike = async () => {
    const newLiked = !liked
    const delta = newLiked ? 1 : -1

    // Actualización optimista
    setOptimisticLiked(newLiked)
    setOptimisticLikeCount(delta)

    // Server Action
    const result = await toggleLikeAction(moment.id!, liked)

    if (result.success && result.data) {
      // Actualizar estado real
      setLiked(result.data.viewerHasLiked)
      setLikeCount(result.data.newLikeCount)
    } else {
      // Revertir si falló
      setOptimisticLiked(liked)
      setOptimisticLikeCount(-delta)
    }
  }

  // Detectar si es video
  const hasVideo = moment.resourceUrl?.some(url =>
    url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')
  )

  const { videoRef, isPlaying } = useVideoAutoplay({
    threshold: 0.7,
    onPlay: () => console.log('Video playing:', moment.id),
    onPause: () => console.log('Video paused:', moment.id)
  })

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4">
        <img
          src={moment.user_data?.avatar_url || '/default-avatar.png'}
          alt={moment.user_data?.name || 'User'}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-semibold">{moment.user_data?.name}</p>
          <p className="text-xs text-gray-500">
            {moment.destination?.[0]?.place || 'Unknown location'}
          </p>
        </div>
      </div>

      {/* Media */}
      <div className="relative aspect-square bg-black">
        {hasVideo ? (
          <video
            ref={videoRef}
            src={moment.resourceUrl?.[0]}
            className="w-full h-full object-contain"
            loop
            muted
            playsInline
          >
            Tu navegador no soporta video
          </video>
        ) : (
          <img
            src={moment.resourceUrl?.[0] || '/placeholder.png'}
            alt={moment.description || 'Moment'}
            className="w-full h-full object-cover"
          />
        )}

        {/* Play/Pause indicator */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!isPlaying && (
              <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className="flex items-center space-x-1 transition-transform active:scale-110"
          >
            <svg
              className={`w-6 h-6 ${optimisticLiked ? 'text-red-500 fill-current' : 'text-gray-700'}`}
              fill={optimisticLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-semibold">{optimisticLikeCount}</span>
          </button>

          <button className="flex items-center space-x-1">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">{moment.comments?.length || 0}</span>
          </button>

          <button
            onClick={() => {/* TODO: handleSave */}}
            className="ml-auto"
          >
            <svg
              className={`w-6 h-6 ${saved ? 'text-yellow-500 fill-current' : 'text-gray-700'}`}
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm">
            <span className="font-semibold">{moment.user_data?.username}</span>{' '}
            {moment.description}
          </p>
        </div>

        {/* Tags */}
        {moment.tags && moment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {moment.tags.map(tag => (
              <span key={tag} className="text-xs text-pink-600">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Fase 3: Preview Robusto de Multimedia

**Objetivo:** Aplicar patrón documentado en `PRODUCT_WIZARD_OPTIMIZED_EXAMPLE.md`

**Componente:** `/src/components/moments/RobustMomentPreview.tsx`

```typescript
'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { getUrl } from 'aws-amplify/storage'

interface MediaItem {
  url: string
  type: 'image' | 'video'
  s3Key?: string
}

interface RobustMomentPreviewProps {
  media: MediaItem[]
  onRemove?: (index: number) => void
  maxRetries?: number
}

export const RobustMomentPreview = memo(function RobustMomentPreview({
  media,
  onRemove,
  maxRetries = 3
}: RobustMomentPreviewProps) {
  const [loadedUrls, setLoadedUrls] = useState<Map<number, string>>(new Map())
  const [loadingStates, setLoadingStates] = useState<Map<number, boolean>>(new Map())
  const [errorStates, setErrorStates] = useState<Map<number, number>>(new Map()) // retry count
  const observerRef = useRef<IntersectionObserver | null>(null)

  // ✅ Intersection Observer para lazy loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            loadMediaUrl(index)
          }
        })
      },
      {
        rootMargin: '50px', // Pre-load 50px antes
        threshold: 0.1
      }
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  // ✅ Cargar URL con retry exponencial
  const loadMediaUrl = useCallback(async (index: number) => {
    const item = media[index]
    if (!item || loadedUrls.has(index)) return

    setLoadingStates(prev => new Map(prev).set(index, true))

    try {
      let url = item.url

      // Si es S3 key, obtener signed URL
      if (item.s3Key) {
        const result = await getUrl({
          path: item.s3Key,
          options: {
            expiresIn: 3600 // 1 hora
          }
        })
        url = result.url.toString()
      }

      // Validar URL
      await validateMediaUrl(url, item.type)

      setLoadedUrls(prev => new Map(prev).set(index, url))
      setErrorStates(prev => {
        const newMap = new Map(prev)
        newMap.delete(index)
        return newMap
      })
    } catch (error) {
      console.error(`Failed to load media ${index}:`, error)

      const retryCount = errorStates.get(index) || 0

      if (retryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000

        setTimeout(() => {
          setErrorStates(prev => new Map(prev).set(index, retryCount + 1))
          loadMediaUrl(index)
        }, delay)
      }
    } finally {
      setLoadingStates(prev => new Map(prev).set(index, false))
    }
  }, [media, loadedUrls, errorStates, maxRetries])

  // ✅ Validar URL (imagen o video)
  async function validateMediaUrl(url: string, type: 'image' | 'video'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (type === 'image') {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image load failed'))
        img.src = url
      } else {
        // Para video, solo verificar que la URL responda
        fetch(url, { method: 'HEAD' })
          .then(res => res.ok ? resolve() : reject(new Error('Video URL invalid')))
          .catch(reject)
      }
    })
  }

  // ✅ Cleanup de blob URLs
  useEffect(() => {
    const blobUrls = Array.from(loadedUrls.values()).filter(url => url.startsWith('blob:'))

    return () => {
      blobUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [loadedUrls])

  return (
    <div className="grid grid-cols-2 gap-4">
      {media.map((item, index) => {
        const isLoading = loadingStates.get(index)
        const loadedUrl = loadedUrls.get(index)
        const retryCount = errorStates.get(index) || 0
        const hasError = retryCount >= maxRetries

        return (
          <div
            key={index}
            data-index={index}
            ref={(el) => {
              if (el && observerRef.current) {
                observerRef.current.observe(el)
              }
            }}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
          >
            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Error state */}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-4">
                <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-red-600 text-center">Error cargando</p>
                <button
                  onClick={() => {
                    setErrorStates(prev => {
                      const newMap = new Map(prev)
                      newMap.delete(index)
                      return newMap
                    })
                    loadMediaUrl(index)
                  }}
                  className="mt-2 px-2 py-1 text-xs bg-red-500 text-white rounded"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Media content */}
            {loadedUrl && !hasError && (
              <>
                {item.type === 'image' ? (
                  <img
                    src={loadedUrl}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={loadedUrl}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  >
                    Tu navegador no soporta video
                  </video>
                )}

                {/* Remove button */}
                {onRemove && (
                  <button
                    onClick={() => onRemove(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
})
```

---

## 📊 Comparación con ProductWizard

| Aspecto | ProductWizard | Moments | Ganador |
|---------|---------------|---------|---------|
| **Server Components** | ❌ Todo client-side | ✅ page.tsx es Server | ✅ Moments |
| **Server Actions** | ⚠️ Definidas pero no usadas | ✅ Implementadas y usadas | ✅ Moments |
| **GraphQL Integration** | ❌ No integrado | ❌ TODOs pendientes | ⚖️ Empate |
| **Validación Zod** | ✅ Implementada | ✅ Implementada | ⚖️ Empate |
| **useOptimistic** | ❌ No usado | ⚠️ Parcial (solo likes) | ⚠️ Moments |
| **Media Upload** | ✅ Sistema robusto | ✅ Reutiliza sistema | ⚖️ Empate |
| **Preview Robusto** | ❌ Básico | ❌ Básico | ⚖️ Empate |
| **Video Features** | ✅ Upload | ❌ No autoplay | ✅ ProductWizard |
| **Error Handling** | ⚠️ Básico | ⚠️ Básico | ⚖️ Empate |

**Conclusión:** Moments tiene **mejor arquitectura base** pero **ambos necesitan las mismas mejoras** (GraphQL, preview robusto, useOptimistic completo).

---

## 📅 Plan de Implementación

### Sprint 1: Core Functionality (CRÍTICO) - 3 días

**Objetivo:** Hacer que la app funcione con datos reales

1. **Día 1: Integración GraphQL**
   - [ ] Integrar `createMoment` mutation en Server Action
   - [ ] Integrar `getAllActiveMoments` query
   - [ ] Integrar `toggleLike` mutation
   - [ ] Integrar `toggleSave` mutation
   - [ ] Testing manual de flujo completo

2. **Día 2: Video Feed**
   - [ ] Implementar hook `useVideoAutoplay`
   - [ ] Crear componente `MomentsFeed`
   - [ ] Crear componente `MomentCard`
   - [ ] Implementar snap scrolling
   - [ ] Testing de autoplay en diferentes navegadores

3. **Día 3: useOptimistic Completo**
   - [ ] Implementar useOptimistic para likes
   - [ ] Implementar useOptimistic para saves
   - [ ] Implementar useOptimistic para crear momento
   - [ ] Testing de rollback en errores

### Sprint 2: UX Improvements (IMPORTANTE) - 2 días

4. **Día 4: Preview Robusto**
   - [ ] Implementar `RobustMomentPreview`
   - [ ] Integrar Intersection Observer
   - [ ] Implementar retry con exponential backoff
   - [ ] Cleanup de blob URLs
   - [ ] Testing de lazy loading

5. **Día 5: Comments System**
   - [ ] Implementar Server Action para crear comentario
   - [ ] Componente `CommentsSection`
   - [ ] useOptimistic para comentarios
   - [ ] Testing de flujo de comentarios

### Sprint 3: Optimizations (MEJORAS) - 2 días

6. **Día 6: Infinite Scroll**
   - [ ] Implementar pagination con `nextToken`
   - [ ] Infinite scroll con Intersection Observer
   - [ ] Loading states durante fetch
   - [ ] Testing de performance

7. **Día 7: Real-time & Polish**
   - [ ] Integrar GraphQL subscriptions
   - [ ] Real-time notifications de likes/comments
   - [ ] Accesibilidad (ARIA labels, keyboard nav)
   - [ ] Testing E2E completo

---

## 🎯 Criterios de Éxito

### Funcionalidad
- ✅ Usuarios pueden crear moments con multimedia
- ✅ Feed muestra moments reales de GraphQL
- ✅ Videos reproducen automáticamente al scroll
- ✅ Likes/saves funcionan con feedback inmediato
- ✅ Comentarios se crean y muestran correctamente

### Performance
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3.0s
- ✅ Videos lazy load (no cargan todos)
- ✅ Previews con retry robusto
- ✅ No memory leaks (blob URLs cleaned)

### UX
- ✅ Feedback inmediato con useOptimistic
- ✅ Error handling con retry
- ✅ Loading states claros
- ✅ Accesibilidad completa
- ✅ Mobile-first responsive

---

## 📚 Referencias

1. **Documentación interna:**
   - `/docs/PRODUCT_WIZARD_ANALYSIS.md` - Problemas identificados
   - `/docs/PRODUCT_WIZARD_OPTIMIZED_EXAMPLE.md` - Patrones a seguir
   - `/instagram-video-feed.md` - Implementación de video autoplay

2. **Archivos clave:**
   - `/schemas/schema.graphql` - Schema GraphQL completo
   - `/src/lib/server/moments-actions.ts` - Server Actions actuales
   - `/src/components/moments/MomentMediaUpload.tsx` - Upload component
   - `/src/app/moments/page.tsx` - Feed page (Server Component)
   - `/src/app/moments/create/page.tsx` - Create page (Client Component)

3. **Next.js 15 + Amplify Gen 2 v6:**
   - Server Components para SSR
   - Server Actions para mutations
   - useOptimistic para UI inmediata
   - generateClient() para GraphQL
   - getUrl() para S3 signed URLs

---

**Última actualización:** 2025-10-11
**Autor:** Claude Code Analysis System
**Status:** ✅ Arquitectura base sólida, requiere integración GraphQL y video feed
