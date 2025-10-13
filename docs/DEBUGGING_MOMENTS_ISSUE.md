# 🐛 Debugging: Moments No Aparecen en Feed

**Fecha**: 2025-10-11
**Problemas Reportados**:
1. ❌ Momento se crea pero no aparece en el feed
2. ❌ Video .mov no se reproduce en navegador (error: "media resource not suitable")

---

## 📊 Status Actual

### Logging Agregado

Agregué logging detallado en 3 puntos críticos:

#### 1. **CreateMomentForm.tsx** (Cliente)
```
[CreateMomentForm] Llamando createMomentAction con: {...}
[CreateMomentForm] Resultado de createMomentAction: {...}
```

#### 2. **createMomentAction** (Servidor - Crear)
```
[createMomentAction] 🚀 Iniciando creación de momento...
[createMomentAction] 👤 Usuario autenticado: {...}
[createMomentAction] 📝 Datos del formulario: {...}
[createMomentAction] 📊 Input para GraphQL: {...}
[createMomentAction] 🔄 Llamando GraphQL mutation...
[createMomentAction] 📬 Respuesta GraphQL: {...}
[createMomentAction] ✅ Momento creado exitosamente: <ID>
```

#### 3. **getMomentsAction** (Servidor - Listar)
```
[getMomentsAction] 🔍 Obteniendo momentos...
[getMomentsAction] 👤 Usuario: {...}
[getMomentsAction] 🔄 Llamando GraphQL query...
[getMomentsAction] 📦 Momentos obtenidos: {...}
```

---

## 🧪 Testing Instructions

### Paso 1: Abrir Consola del Navegador

**Chrome/Edge**:
- `Cmd + Option + J` (Mac) o `F12` (Windows)
- Ir a la pestaña "Console"

### Paso 2: Abrir Terminal del Servidor

En una terminal separada, ver los logs del servidor:
```bash
cd /Users/esaldgut/dev/src/react/nextjs/yaan-web
yarn dev
```

### Paso 3: Crear Momento

1. Ir a `http://localhost:3000/moments/create`
2. Subir un video .mov (o cualquier archivo)
3. Llenar formulario:
   - Caption: "La experiencia más vívida que he vivido"
   - Hashtags: "#MomentosYAAN"
   - Location: "Ciudad de México"
4. Click en "Publicar Momento"

### Paso 4: Capturar Logs

**En la consola del navegador**, deberías ver:
```
[CreateMomentForm] Llamando createMomentAction con: {
  description: "La experiencia más vívida que he vivido",
  tags: ["MomentosYAAN"],
  existingMediaUrls: ["https://yaan-provider-documents.s3...mov"],
  preferences: ["Ciudad de México"]
}
```

**En la terminal del servidor**, deberías ver:
```
[createMomentAction] 🚀 Iniciando creación de momento...
[createMomentAction] 👤 Usuario autenticado: {
  sub: "...",
  userId: "...",
  username: "esaldgut@icloud.com"
}
[createMomentAction] 📝 Datos del formulario: {...}
[createMomentAction] 📊 Input para GraphQL: {
  "description": "La experiencia más vívida que he vivido",
  "resourceType": "video",
  "resourceUrl": ["https://yaan-provider-documents.s3...mov"],
  "tags": ["MomentosYAAN"],
  "preferences": ["Ciudad de México"]
}
[createMomentAction] 🔄 Llamando GraphQL mutation createMoment...
```

### Paso 5: Verificar Redirect y Feed

Después de publicar, deberías ser redirigido a `/moments`.

**En la terminal del servidor**, deberías ver:
```
[getMomentsAction] 🔍 Obteniendo momentos... { feedType: 'all', limit: 20 }
[getMomentsAction] 👤 Usuario: { sub: "...", userId: "..." }
[getMomentsAction] 🔄 Llamando GraphQL query: all
[getMomentsAction] 📦 Momentos obtenidos: {
  count: 1,
  moments: [
    { id: "...", description: "La experiencia más vívida...", hasMedia: true }
  ]
}
```

---

## 🔍 Posibles Escenarios

### Escenario A: GraphQL Mutation Falla

**Síntomas**:
```
[createMomentAction] ❌ GraphQL errors creating moment: {...}
```

**Causas posibles**:
1. Schema de GraphQL no acepta el formato de input
2. Permisos de usuario insuficientes
3. URL de S3 en formato incorrecto
4. Campo requerido faltante

**Solución**: Verificar el schema de GraphQL y ajustar el input

### Escenario B: GraphQL Query Retorna Vacío

**Síntomas**:
```
[getMomentsAction] 📦 Momentos obtenidos: { count: 0, moments: [] }
```

**Causas posibles**:
1. Query de GraphQL no encuentra los momentos creados
2. Filtro de "activos" excluye el momento recién creado
3. Permisos de lectura insuficientes
4. Momento se creó en tabla diferente

**Solución**: Verificar la query de GraphQL y los filtros

### Escenario C: Video .mov No Se Reproduce

**Síntomas**:
```
Console: NotSupportedError: The media resource indicated by the src attribute
or assigned media provider object was not suitable.
```

**Causa**:
- Navegadores web (Chrome, Firefox) no soportan todos los codecs de MOV
- MOV con codec H.265 (HEVC) o ProRes no son compatibles
- Solo H.264 es universalmente soportado

**Solución a corto plazo**:
1. Detectar formato del video en el servidor
2. Si es .mov, mostrar mensaje al usuario:
   ```
   "⚠️ Video .mov detectado. Para mejor compatibilidad,
   considera usar MP4 H.264 o espera mientras lo procesamos."
   ```

**Solución a largo plazo**:
1. Implementar transcoding en el servidor con FFmpeg
2. Convertir automáticamente MOV → MP4 H.264
3. Generar thumbnail para preview
4. Notificar al usuario cuando esté listo

---

## 📋 Checklist de Información a Capturar

Cuando reportes el problema, incluye:

- [ ] Logs completos de la consola del navegador
- [ ] Logs completos de la terminal del servidor
- [ ] Screenshot del error (si aplica)
- [ ] URL del archivo .mov subido a S3
- [ ] Formato y codec del video original (usar `ffprobe` si está disponible)

### Ejemplo de logs esperados:

**Consola navegador**:
```
[CreateMomentForm] Llamando createMomentAction con: {...}
[CreateMomentForm] Resultado de createMomentAction: { success: true, data: {...} }
```

**Terminal servidor**:
```
[createMomentAction] ✅ Momento creado exitosamente: moment-abc123
[getMomentsAction] 📦 Momentos obtenidos: { count: 1, moments: [...] }
```

---

## 🚨 Problemas Conocidos

### 1. Video .mov No Reproduce

**Problema**: Navegadores no soportan todos los codecs de MOV.

**Workaround temporal**:
- Usar MP4 H.264 en lugar de MOV
- Convertir video antes de subir (usar Handbrake, VLC, etc.)

**Fix permanente**: Implementar transcoding en servidor

### 2. Cache No Se Revalida

**Problema**: Momento se crea pero no aparece hasta refrescar página.

**Causas**:
- `revalidateTag` o `revalidatePath` no funcionando
- Router cache de Next.js no actualizado

**Fix**: Agregar `router.refresh()` después de redirect

---

## 🎯 Próximos Pasos

1. **Inmediato**: Ejecutar testing con logging y capturar resultados
2. **Debugging**: Analizar logs para identificar punto de falla
3. **Fix específico**: Aplicar solución según el escenario identificado
4. **Video compatibility**: Implementar detección de formato y mensaje al usuario
5. **Long-term**: Implementar transcoding automático

---

## 📚 Referencias

- [Next.js revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Next.js revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [MDN: Media Formats](https://developer.mozilla.org/en-US/docs/Web/Media/Formats)
- [Can I Use: Video Formats](https://caniuse.com/video)

---

**Última actualización**: 2025-10-11
**Status**: 🔍 Investigando con logging detallado
**Prioridad**: Alta
