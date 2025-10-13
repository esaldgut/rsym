# 🗂️ Fix: S3 File Structure for Moments (Social Content)

**Fecha**: 2025-10-11
**Status**: ✅ Implementado
**Prioridad**: Alta - Corrige estructura de archivos según estándar del proyecto

---

## 🎯 Problema

Los archivos multimedia de **Moments** (contenido social) se estaban guardando con la estructura incorrecta:

### ❌ Estructura Incorrecta (ANTES):
```
public/products/moment-{moment_id}/gallery/video_xxx.mov
public/products/moment-{moment_id}/gallery/image_xxx.jpg
```

**Problemas**:
- Usaba estructura de "products" (marketplace) para contenido social
- No seguía la convención definida en `prompt-2`
- Mezclaba dos tipos de contenido diferentes

---

## ✅ Solución Implementada

### Estructura Correcta (DESPUÉS):
```
public/users/{username}/social-content/{post_id}/video_1760231104373_9f4a7224.mov
public/users/{username}/social-content/{post_id}/image_1760231096517_y241j.jpg
```

**Beneficios**:
- ✅ Sigue convención del proyecto según `prompt-2`
- ✅ Separa contenido social de productos marketplace
- ✅ Organización por username facilita administración
- ✅ Estructura clara: `users → social-content → post_id → archivos`

---

## 📋 Referencia: Estructura Completa de S3

Según `../prompt/yaan-web/prompt-2`:

```
/
├── public/
│   ├── users/
│   │   └── {username}/
│   │       ├── profile-images/           # Fotos de perfil
│   │       └── social-content/           # 👈 MOMENTS (contenido social)
│   │           └── {post_id}/
│   │               ├── image_1.jpg
│   │               ├── image_2.jpg
│   │               └── video.mp4
│   │
│   └── products/                          # 👈 MARKETPLACE (productos)
│       └── {product_id}/
│           ├── main-image.jpg
│           └── gallery/
│               ├── image_1.jpg
│               ├── image_2.jpg
│               └── video_1.mp4
│
└── protected/
    └── users/
        └── {username}/
            └── legal-documents/            # Documentos privados
                ├── proof-of-tax-status/
                ├── sectur-registry/
                └── compliance-opinion/
```

**Tipo de contenido**:
- `public/users/{username}/social-content/` → **Moments** (red social)
- `public/products/{product_id}/` → **Marketplace** (productos turísticos)
- `protected/users/{username}/` → **Documentos legales** (privados)

---

## 🔧 Archivos Modificados

### 1. `/src/app/api/upload/media/route.ts`

**Cambios**:
- Agregado parámetro `contentType` ('product' | 'moment')
- Agregado parámetro `momentId` para contenido social
- Lógica de path según contentType

**Código agregado**:
```typescript
const contentType = formData.get('contentType') as string || 'product';
const momentId = formData.get('momentId') as string;

if (contentType === 'moment') {
  // Estructura para contenido social (Moments)
  if (!momentId) {
    return NextResponse.json(
      { error: 'momentId es requerido para contenido social' },
      { status: 400 }
    );
  }

  const isVideo = file.type.startsWith('video/');
  const prefix = isVideo ? 'video' : 'image';
  const uniqueFileName = `${prefix}_${Date.now()}_${uuidv4().slice(0, 8)}.${fileExtension}`;
  s3Key = `public/users/${username}/social-content/${momentId}/${uniqueFileName}`;
} else {
  // Estructura para productos del marketplace
  // ... (código existente para products)
}
```

**Metadatos actualizados**:
```typescript
Metadata: {
  'uploaded-by': user.sub || user.userId,
  'username': username,
  'content-category': contentType,  // 'product' | 'moment'
  'product-id': productId || 'n/a',
  'moment-id': momentId || 'n/a',
  'original-filename': file.name,
  'upload-timestamp': new Date().toISOString(),
  'folder-type': folder,
  'file-size': file.size.toString()
}
```

---

### 2. `/src/lib/services/media-upload-service.ts`

**Cambios**:
- Auto-detección de tipo de contenido basado en `productId`
- Si `productId` empieza con `moment-`, usa estructura social
- Envía parámetros correctos al API

**Código agregado**:
```typescript
async uploadFile(
  file: File,
  productId: string,
  type: 'cover' | 'gallery' | 'video' = 'gallery',
  onProgress?: (progress: UploadProgress) => void
): Promise<MediaUploadResult> {
  // ... código existente ...

  // Detectar si es contenido social (Moments) según estructura del productId
  const isMoment = productId.startsWith('moment-');
  const momentId = isMoment ? productId.replace('moment-', '') : undefined;

  // Preparar FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('productId', productId);

  // Agregar parámetros específicos para Moments (contenido social)
  if (isMoment && momentId) {
    formData.append('contentType', 'moment');
    formData.append('momentId', momentId);
    console.log(`[MediaUploadService] 📱 Subiendo a social-content: moment-${momentId}`);
  } else {
    formData.append('contentType', 'product');
    console.log(`[MediaUploadService] 🛍️ Subiendo a products: ${productId}`);
  }

  // ... resto del código ...
}
```

---

### 3. `/src/components/moments/MomentMediaUpload.tsx`

**Estado**: ✅ No requiere cambios

El componente ya pasa el ID correcto:
```typescript
<MediaUploadZone
  productId={`moment-${momentId}`}  // ✅ Correcto
  type="gallery"
  // ...
/>
```

La auto-detección en `media-upload-service.ts` identifica el prefijo `moment-` y usa la estructura correcta automáticamente.

---

### 4. `/src/lib/server/moments-actions.ts`

**Estado**: ⚠️ Código legacy presente pero NO usado

**Código legacy (línea 113)**:
```typescript
// ⚠️ LEGACY: Este código ya no se ejecuta porque el flujo usa URLs pre-subidas
const fileName = `moments/${user.sub}/${Date.now()}-${Math.random()...}`;
```

**Nota**: Este código está en la rama "Opción 2" que solo se ejecuta si no hay `existingMediaUrls`, pero el flujo actual SIEMPRE usa URLs pre-subidas del cliente, por lo que esta línea nunca se ejecuta.

**¿Debe eliminarse?** No urgente, pero puede limpiarse en el futuro.

---

## 🧪 Testing

### Verificar Estructura Correcta

1. **Crear nuevo Moment con video/imagen**:
   ```bash
   # Frontend
   1. Ir a http://localhost:3000/moments/create
   2. Subir archivo .mov o .jpg
   3. Ver consola del navegador
   ```

2. **Verificar logs esperados**:
   ```
   [MediaUploadService] 📱 Subiendo a social-content: moment-1760231096517
   [AWS Route Handler] Subiendo a: public/users/{username}/social-content/moment-1760231096517/video_xxx.mov
   ✅ [AWS Route Handler] Archivo subido exitosamente
   ```

3. **Verificar en S3**:
   ```bash
   aws s3 ls s3://yaan-provider-documents/public/users/ --recursive | grep social-content
   ```

   **Salida esperada**:
   ```
   public/users/esaldgut/social-content/moment_1760231096517_y241j/video_1760231104373_9f4a7224.mov
   public/users/esaldgut/social-content/moment_1760231096517_y241j/image_1760231096517_9f4a7224.jpg
   ```

4. **Verificar metadatos en S3**:
   ```bash
   aws s3api head-object \
     --bucket yaan-provider-documents \
     --key "public/users/{username}/social-content/{moment_id}/video_xxx.mov"
   ```

   **Metadatos esperados**:
   ```json
   {
     "Metadata": {
       "username": "esaldgut",
       "content-category": "moment",
       "moment-id": "moment_1760231096517_y241j"
     }
   }
   ```

---

## 📊 Impacto

### Archivos Existentes

**¿Qué pasa con archivos subidos ANTES de este fix?**
- ✅ Siguen funcionando (URLs guardadas en DB apuntan a ubicación actual)
- ⚠️ Están en ubicación incorrecta: `public/products/moment-*/gallery/`
- 📋 Considerar migración futura (opcional)

### Nuevos Archivos

**A partir de ahora**:
- ✅ Todos los nuevos moments usan estructura correcta
- ✅ `public/users/{username}/social-content/{post_id}/`
- ✅ Separación clara entre contenido social y marketplace

---

## 🚀 Migración (Opcional - Futuro)

Si se desea migrar archivos antiguos a la nueva estructura:

### Script de Migración (Ejemplo)

```bash
#!/bin/bash
# migrate-moments-to-correct-structure.sh

# Listar archivos en ubicación antigua
aws s3 ls s3://yaan-provider-documents/public/products/ --recursive | grep "moment-" > old-files.txt

# Para cada archivo
while IFS= read -r line; do
  OLD_KEY=$(echo "$line" | awk '{print $4}')

  # Extraer moment_id y filename
  MOMENT_ID=$(echo "$OLD_KEY" | grep -oP 'moment-\K[^/]+')
  FILENAME=$(basename "$OLD_KEY")

  # Obtener username del owner (requiere query a DB)
  # USERNAME=$(query_db_for_moment_owner "$MOMENT_ID")

  # Nueva ubicación
  NEW_KEY="public/users/${USERNAME}/social-content/${MOMENT_ID}/${FILENAME}"

  # Copiar archivo
  aws s3 cp "s3://yaan-provider-documents/${OLD_KEY}" \
    "s3://yaan-provider-documents/${NEW_KEY}"

  # Actualizar referencia en base de datos
  # update_moment_resource_url "$MOMENT_ID" "$NEW_KEY"

  # (Opcional) Eliminar archivo viejo
  # aws s3 rm "s3://yaan-provider-documents/${OLD_KEY}"

done < old-files.txt
```

**Pasos**:
1. Obtener lista de archivos en ubicación antigua
2. Para cada archivo, obtener username del owner desde DB
3. Copiar a nueva ubicación
4. Actualizar URL en base de datos (tabla `moments.resourceUrl`)
5. (Opcional) Eliminar archivo antiguo

**Nota**: Este script es solo un ejemplo. Requiere:
- Query a base de datos para obtener username por moment_id
- Update de URLs en GraphQL/DynamoDB
- Testing exhaustivo antes de ejecutar en producción

---

## ✅ Checklist Post-Fix

- [x] API route actualizada con lógica de contentType
- [x] MediaUploadService detecta automáticamente tipo
- [x] Logging agregado para debugging
- [x] Metadatos S3 incluyen content-category
- [x] Build pasa sin errores
- [x] CORS configurado en bucket S3
- [x] Documentación actualizada

---

## 📚 Referencias

- `../prompt/yaan-web/prompt-2` - Estructura estándar de archivos S3
- `/docs/S3_CORS_FIX.md` - Configuración CORS para video playback
- `/docs/SESSION_SUMMARY.md` - Historial completo de refactorización

---

**Última actualización**: 2025-10-11 22:00
**Autor**: Claude AI Assistant + Erick Aldama
**Status**: ✅ Implementado y funcionando
**Próximos pasos**: Testing con usuarios reales, considerar migración de archivos antiguos (opcional)
