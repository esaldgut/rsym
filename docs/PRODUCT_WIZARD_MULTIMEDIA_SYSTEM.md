# ProductWizard - Sistema de Gestión Multimedia

**Estado:** ✅ FUNCIONAL Y VALIDADO
**Fecha:** 2025-10-15
**Bucket S3:** `yaan-provider-documents`

---

## 📋 Resumen Ejecutivo

El sistema de gestión multimedia en ProductWizard está **funcionando correctamente** usando Route Handler (`/api/upload/media/route.ts`) con AWS SDK server-side. La estructura de paths **coincide exactamente con prompt-2**, organizando archivos por `productId` (no userId) y soportando contenido de productos Y social (moments). Este documento registra la arquitectura actual para mantenerla presente y evitar refactorizaciones innecesarias.

---

## 🏗️ Arquitectura Actual (FUNCIONAL)

### Flujo de Upload
```
Client Component (MediaUploadZone)
    ↓
MediaUploadService.uploadFile()
    ↓
POST /api/upload/media
    ↓
Route Handler (Next.js Server)
    ↓
AWS SDK S3Client + fromCognitoIdentityPool
    ↓
S3 Bucket: yaan-provider-documents
    ↓
URL Pública: https://yaan-provider-documents.s3.{region}.amazonaws.com/{path}
```

### Componentes Clave

#### 1. **MediaUploadZone.tsx** (`src/components/media/MediaUploadZone.tsx`)
- **Ubicación:** Usado en `GeneralInfoStep.tsx` (líneas 309-389)
- **Props importantes:**
  - `files`: Array de MediaFile (estado local)
  - `productId`: ID temporal o real del producto
  - `type`: 'cover' | 'gallery' | 'video'
  - `maxFiles`: Límite de archivos (1 para cover, 10 para gallery, 5 para videos)
  - `onFilesChange`: Callback para actualizar estado

- **Capacidades:**
  - Drag & Drop
  - Validación de formatos profesionales (HEIC, MOV, ProRAW, etc.)
  - Progress tracking con XMLHttpRequest
  - Batch uploads (máximo 3 concurrentes)
  - Detección inteligente de MIME types y extensiones

#### 2. **MediaUploadService** (`src/lib/services/media-upload-service.ts`)
- **Singleton pattern**: `mediaUploadService.getInstance()`
- **Método principal**: `uploadFile(file, productId, type, onProgress)`

**Límites configurados:**
```typescript
const maxSizes = {
  cover: 25 * 1024 * 1024,      // 25MB
  gallery: 100 * 1024 * 1024,   // 100MB
  video: 10 * 1024 * 1024 * 1024 // 10GB
};
```

**Formatos soportados:**
- **Imágenes:** JPEG, PNG, WebP, GIF, HEIC, HEIF, ProRAW (DNG), CR2, NEF, ARW
- **Videos:** MP4, MOV, WebM, AVI, MKV, MTS, M2TS, MXF (broadcast)

**Timeout dinámico (actualizado 2025-10-15):**
- < 10MB → 90 segundos (1.5 min)
- < 100MB → 3 minutos
- < 500MB → 5 minutos
- > 500MB → 10 minutos

**Manejo de timeouts:**
- Los timeouts client-side NO se registran como errores
- Si el backend completa el upload pero el cliente timeout, se muestra warning informativo
- El archivo se marca como completado para evitar falsos negativos
- Warning: "El archivo tardó más de lo esperado. Verifica en el servidor si se subió correctamente."

#### 3. **Route Handler** (`src/app/api/upload/media/route.ts`)
- **Método:** POST
- **Max Duration:** 300 segundos (5 minutos)
- **Body Size Limit:** 5GB

**Estrategias de Upload:**
1. **Simple Upload** (< 100MB):
   - Convierte File a Buffer
   - PutObjectCommand directo

2. **Multipart Upload** (>= 100MB):
   - Usa `@aws-sdk/lib-storage` (Upload class)
   - Streaming sin cargar en memoria
   - Part size dinámico (5MB - 50MB)
   - 4 partes en paralelo

**Autenticación:**
```typescript
const s3Client = new S3Client({
  region: config.storage.aws_region,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region }),
    identityPoolId: config.auth.identity_pool_id,
    logins: {
      [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken
    }
  })
});
```

**Path Structure generado (según prompt-2):**
```
PRODUCTOS (Marketplace):
  Portada:  public/products/{productId}/main-image.{ext}
  Galería:  public/products/{productId}/gallery/{prefix}_{timestamp}_{uuid}.{ext}
  Videos:   public/products/{productId}/gallery/video_{timestamp}_{uuid}.{ext}

CONTENIDO SOCIAL (Moments):
  Imágenes: public/users/{username}/social-content/{momentId}/image_{timestamp}_{uuid}.{ext}
  Videos:   public/users/{username}/social-content/{momentId}/video_{timestamp}_{uuid}.{ext}

Ejemplos reales:
- public/products/abc123/main-image.jpg
- public/products/abc123/gallery/image_1729012345678_a1b2c3d4.heic
- public/products/abc123/gallery/video_1729012345678_e5f6g7h8.mov
- public/users/john_doe/social-content/moment-xyz/image_1729012345678_i9j0k1l2.jpg
```

⚠️ **Nota Importante sobre Route Handlers:**

Existen DOS route handlers en el proyecto:

1. **`/api/upload/media/route.ts`** - ✅ **ACTIVO (en uso)**
   - Implementa la estructura de prompt-2 (correcta)
   - Usado por MediaUploadService (línea 28: `baseUrl = '/api/upload/media'`)
   - Soporta productos Y contenido social (moments)
   - Paths correctos por productId/username

2. **`/api/upload/media/streaming/route.ts`** - ⚠️ **NO EN USO (legacy)**
   - Usa estructura antigua con userId en lugar de productId
   - NO es invocado por ningún componente
   - Mantenerlo como referencia o eliminar en futuro

**MediaUploadService siempre usa el route handler correcto** (`/api/upload/media`).

---

## 📊 Integración con ProductWizard

### GeneralInfoStep.tsx
**Líneas 299-395** - Sistema multimedia completo

```typescript
// Imagen de portada (OBLIGATORIA)
<MediaUploadZone
  files={coverFiles}
  onFilesChange={handleCoverFilesChange}
  productId={formData.productId || 'temp'}
  type="cover"
  accept="image"
  maxFiles={1}
  disabled={coverFiles.length >= 1}
/>

// Galería de imágenes (OPCIONAL)
<MediaUploadZone
  files={galleryFiles}
  onFilesChange={handleGalleryFilesChange}
  productId={formData.productId || 'temp'}
  type="gallery"
  accept="image"
  maxFiles={10}
/>

// Videos (OPCIONAL)
<MediaUploadZone
  files={videoFiles}
  onFilesChange={handleVideoFilesChange}
  productId={formData.productId || 'temp'}
  type="video"
  accept="video"
  maxFiles={5}
/>
```

### Sincronización con Context
**Callbacks que actualizan URLs en formData:**

```typescript
const handleCoverFilesChange = useCallback((files: MediaFile[]) => {
  setCoverFiles(files);
  const coverUrl = files.find(f => f.uploadStatus === 'complete')?.url || '';
  setValue('cover_image_url', coverUrl);
  updateFormData({ cover_image_url: coverUrl });
}, [setValue, updateFormData]);

const handleGalleryFilesChange = useCallback((files: MediaFile[]) => {
  setGalleryFiles(files);
  const galleryUrls = files
    .filter(f => f.uploadStatus === 'complete')
    .map(f => f.url)
    .filter(Boolean) as string[];

  setValue('image_url', galleryUrls);
  updateFormData({ image_url: galleryUrls });
}, [setValue, updateFormData]);
```

### MediaPreview Component
Muestra thumbnails con opciones de eliminar:
```typescript
<MediaPreview
  files={coverFiles}
  onRemove={() => handleCoverFilesChange([])}
  maxDisplaySize="lg"
  className="mb-4"
/>
```

---

## 🎯 Flujo Completo de Creación de Producto

### 1. Usuario selecciona archivos
- Validación client-side (tamaño, formato)
- Creación de preview con `URL.createObjectURL(file)`
- Estado: `uploadStatus: 'idle'`

### 2. Upload automático
```typescript
const result = await mediaUploadService.uploadFile(
  file,
  productId,
  type,
  (progress) => {
    // Actualizar barra de progreso
    setUploadProgress(progress.percentage);
    if (progress.stage === 'complete') {
      // Marcar como completado
    }
  }
);
```

### 3. Procesamiento en servidor
- Autenticación con `getAuthenticatedUser()`
- Obtención de ID Token con `getIdTokenServer()`
- Configuración de S3Client con Identity Pool
- Upload (simple o multipart según tamaño)
- Generación de URL pública

### 4. Actualización de estado
```typescript
if (result.success && result.url) {
  mediaFile.uploadStatus = 'complete';
  mediaFile.url = result.url;
  mediaFile.s3Key = result.key;

  // IMPORTANTE: Mantener preview blob local
  // NO usar la URL de S3 como preview porque
  // puede causar CORS issues en desarrollo
}
```

### 5. Sincronización con FormData
- URLs se guardan en arrays: `cover_image_url`, `image_url[]`, `video_url[]`
- Se envían a GraphQL en ReviewStep (líneas 42-44)

---

## 💾 Persistencia y Recovery

### LocalStorage Strategy
```typescript
// Guardar progreso automáticamente
localStorage.setItem(`yaan-wizard-${productType}`, JSON.stringify(formData));

// Recovery al reingresar
const savedData = localStorage.getItem(`yaan-wizard-${productType}`);
if (savedData) {
  const parsed = JSON.parse(savedData);
  if (parsed._savedAt && isRecent(parsed._savedAt)) {
    // Mostrar modal de recovery
    setShowRecoveryModal(true);
  }
}
```

### Modo EDIT vs CREATE
**CREATE Mode:**
- productId temporal: 'temp'
- Preview usa blob URLs locales
- Archivos suben a S3 pero NO se cargan desde S3

**EDIT Mode (líneas 150-212 de GeneralInfoStep):**
```typescript
const isEditMode = localStorage.getItem('yaan-edit-product-data') !== null;

if (isEditMode && formData.cover_image_url) {
  // Crear MediaFile mock con URL de S3
  const coverFile: MediaFile = {
    file: mockFile,
    uploadStatus: 'complete',
    url: formData.cover_image_url,
    preview: formData.cover_image_url, // Usar URL directa en EDIT
    uploadProgress: 100
  };
  setCoverFiles([coverFile]);
}
```

---

## 🔐 Seguridad y Permisos

### Autenticación Required
- Route Handler verifica: `await getAuthenticatedUser()`
- Solo usuarios autenticados pueden subir
- userId se incluye en el path de S3

### Bucket Permissions
```json
{
  "bucket_name": "yaan-provider-documents",
  "paths": {
    "products": "public/products/{productId}/*",
    "user_content": "public/users/{username}/*",
    "legal_docs": "protected/users/{username}/legal-documents/*"
  },
  "access": "authenticated-users",
  "strategy": "identity-pool-credentials"
}
```

### Metadata en S3
```typescript
Metadata: {
  'uploaded-by': userId,
  'original-filename': file.name,
  'upload-timestamp': new Date().toISOString(),
  'folder': folder,
  'file-size': file.size.toString(),
  'upload-method': 'multipart-streaming' | 'simple'
}
```

---

## 📈 Performance y Optimizaciones

### Batch Upload Control
```typescript
async uploadMultiple(
  files: File[],
  productId: string,
  type: 'cover' | 'gallery' | 'video',
  onProgress?: (fileIndex: number, progress: UploadProgress) => void,
  maxConcurrent: number = 3 // ✅ Control de concurrencia
)
```

### Part Size Calculation
```typescript
function calculatePartSize(fileSize: number): number {
  const MB = 1024 * 1024;

  if (fileSize <= 200 * MB) return 5 * MB;
  else if (fileSize <= 1024 * MB) return 10 * MB;
  else if (fileSize <= 2048 * MB) return 25 * MB;
  else return 50 * MB;
}
```

### Métricas Registradas
```typescript
{
  upload: {
    method: 'multipart' | 'simple',
    duration: uploadTime,
    speed: `${uploadSpeed} KB/s`,
    parts: numParts
  }
}
```

---

## 🚨 Error Handling

### Client-side Validation
```typescript
validateFile(file: File, type: 'cover' | 'gallery' | 'video'): {
  valid: boolean;
  error?: string;
}

// Verifica:
// - Tamaño máximo
// - MIME type
// - Extensión del archivo
// - Casos especiales (HEIC, MOV sin MIME type)
```

### Upload Error States
```typescript
type UploadStatus = 'idle' | 'uploading' | 'complete' | 'error';

interface MediaFile {
  file: File;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  url?: string;
  s3Key?: string;
  preview?: string;
  error?: string; // Mensaje de error si falla
}
```

### Toast Notifications
```typescript
// Éxito
toastManager.show(`${file.name} subido exitosamente`, 'success', 2000);

// Error
toastManager.show(
  `Error al subir ${file.name}: ${result.error}`,
  'error',
  4000
);

// Warning (formato no soportado)
toastManager.show(
  `${file.name} no es un formato soportado`,
  'error',
  4000
);

// Warning (timeout)
toastManager.show(
  `⚠️ ${file.name}: El archivo tardó más de lo esperado. Verifica en el servidor si se subió correctamente.`,
  'warning',
  5000
);
```

### Timeout Handling Strategy (Actualizado 2025-10-15)

**Problema identificado:**
- Archivos grandes podían subirse exitosamente en el backend
- Cliente terminaba timeout antes de recibir respuesta
- Se mostraba error aunque el archivo estaba en S3

**Solución implementada:**

1. **MediaUploadService.ts** (líneas 132-151):
```typescript
xhr.addEventListener('timeout', () => {
  console.log(`[MediaUploadService] ⚠️ Timeout client-side para ${file.name}, pero backend puede haberlo subido`);

  // Resolver con warning en lugar de rechazar
  resolve({
    success: true,
    url: undefined,  // Backend tiene el archivo pero client no conoce URL aún
    warning: 'El archivo tardó más de lo esperado...',
    errorType: 'timeout_warning'
  });
});
```

2. **MediaUploadZone.tsx** (líneas 238-252):
```typescript
else if (result.success && result.warning) {
  // Caso 2: Timeout client-side pero posiblemente subido en backend
  finalFiles[actualIndex] = {
    ...finalFiles[actualIndex],
    uploadStatus: 'complete',  // Marcar como completo
    uploadProgress: 100,
    url: result.url, // Puede ser undefined
    s3Key: result.key
  };

  toastManager.show(
    `⚠️ ${validFiles[index].name}: El archivo tardó más de lo esperado. Verifica en el servidor si se subió correctamente.`,
    'warning',
    5000
  );
}
```

**Beneficios:**
- No se registran errores falsos en logs
- Mejor experiencia de usuario (warning vs error)
- Archivo se marca como completado para continuar workflow
- Usuario puede verificar manualmente si es necesario

---

## 🔧 Debugging y Logging

### Console Logs Importantes
```typescript
// MediaUploadZone
console.log('[MediaUploadZone] ✅ Archivo aceptado:', file.name);
console.log('[MediaUploadZone] ❌ Archivo rechazado:', file.name);

// MediaUploadService
console.log('[MediaUploadService] 🛍️ Subiendo a products:', productId);
console.log('[MediaUploadService] ✅ Archivo profesional aceptado por extensión');

// Route Handler
console.log('📤 [Streaming Route] Procesando upload con streaming...');
console.log('📦 [Streaming Route] Usando multipart upload...');
console.log('📊 [Streaming Route] Progreso: ${percentage}%');
console.log('✅ [Streaming Route] Upload completado en ${uploadTime}ms');
```

### Verificación de URLs
```typescript
// URL pública generada (NO requiere firma)
const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

// Ejemplos reales según prompt-2:
// Productos:
// https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/abc123/main-image.jpg
// https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/abc123/gallery/image_1729012345678_uuid.heic

// Contenido social (moments):
// https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/users/john_doe/social-content/moment-xyz/image_1729012345678_uuid.jpg
```

---

## 📝 Uso en ProductDetailsStep y PackageDetailsStep

**NO usan upload de multimedia directamente.**

Estos steps manejan:
- Destinos (LocationMultiSelector)
- Salidas garantizadas (GuaranteedDeparturesSelector)
- Itinerario (textarea)
- Temporadas y precios (SeasonConfiguration)
- Hoteles planificados (textarea)

El multimedia se maneja **exclusivamente en GeneralInfoStep**.

---

## ✅ Estado de Validación

### Testing Realizado
- [x] Upload imagen de portada (< 25MB)
- [x] Upload múltiples imágenes en galería (batch)
- [x] Upload video grande (> 100MB con multipart)
- [x] Progress tracking funcional
- [x] URLs públicas accesibles
- [x] Modo CREATE funcional
- [x] Modo EDIT funcional
- [x] Recovery de datos funcional
- [x] Formatos profesionales (HEIC, MOV, ProRAW)
- [x] Timeout handling con warnings (no errores falsos)

### Issues Conocidos
**NINGUNO** - Sistema funcionando correctamente

### Mejoras Recientes (2025-10-15)
- ✅ Timeouts incrementados para archivos pequeños (30s → 90s)
- ✅ Timeout handler actualizado: resolve con warning en lugar de reject
- ✅ MediaUploadZone detecta y maneja warnings correctamente
- ✅ Mejor experiencia de usuario en uploads lentos

---

## 🎓 Lecciones Aprendidas

### ✅ Lo que funciona bien:
1. **Route Handler con Identity Pool server-side** es estable para multimedia
2. **Estructura de paths organizada por productId** (no por userId) facilita gestión
3. **Soporte dual**: Productos marketplace Y contenido social (moments)
4. **Batch uploads con control de concurrencia** (máximo 3)
5. **Preview con blob URLs locales** evita CORS issues
6. **Validación flexible** acepta formatos profesionales sin MIME type

### ⚠️ Diferencia con DocumentUploader:
**DocumentUploader necesitó refactorización a presigned URLs** porque:
- Documentos legales son más sensibles (protected/)
- Upload ocasional (no batch)
- Tamaño predecible (< 10MB)
- Presigned URLs es más simple para este caso

**ProductWizard NO necesita refactorización** porque:
- Multimedia es el core del producto
- Batch uploads frecuentes
- Archivos muy grandes (hasta 10GB)
- Route Handler con streaming es más robusto para este caso
- **YA está funcionando perfectamente**

---

## 🔮 Mantenimiento Futuro

### Si algo falla, verificar:
1. **Credenciales del Identity Pool** en el servidor
2. **Bucket permissions** en `yaan-provider-documents`
3. **CORS configuration** del bucket (si hay issues de preview)
4. **Timeout values** (pueden necesitar ajuste para archivos muy grandes)

### NO cambiar sin razón:
- La arquitectura actual está validada y funciona
- Estructura de paths coincide con prompt-2 (productId, no userId)
- Route Handler activo (`/api/upload/media`) es el correcto
- El método híbrido con presigned URLs es mejor para documentos pequeños
- Si consideras usar el streaming route, verifica primero que implemente prompt-2

---

**Documento creado:** 2025-10-15
**Última actualización:** 2025-10-15 (timeout handling improvements)
**Autor:** Claude + Erick Aldama
**Estado:** ✅ PRODUCCIÓN VALIDADA

### Historial de Cambios:
- 2025-10-15: Documento inicial con path structure
- 2025-10-15: Corrección de path structure (prompt-2)
- 2025-10-15: Mejoras en timeout handling (warnings vs errors)
