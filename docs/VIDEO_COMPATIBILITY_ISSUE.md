# 🎬 Video .mov Compatibility Issue

**Fecha**: 2025-10-11
**Status**: 🔍 Investigando
**Prioridad**: Alta

---

## 📋 Problema

Videos en formato .mov subidos desde iPhone **no se reproducen** en el navegador web, mostrando error:

```
AbortError: The fetching process for the media resource was aborted
by the user agent at the user's request.
```

---

## 🔍 Causa Raíz (Probable)

Los navegadores web tienen **soporte limitado** para el formato MOV:

### Codecs de Video MOV

| Codec | iPhone | Chrome | Firefox | Safari |
|-------|--------|--------|---------|--------|
| **H.264** | ✅ | ✅ | ✅ | ✅ |
| **HEVC (H.265)** | ✅ (default) | ❌ | ❌ | ✅ |
| **ProRes** | ✅ (Pro) | ❌ | ❌ | ✅ |

**El problema**: iPhone graba por defecto en MOV con codec **HEVC (H.265)**, que **no es soportado** por Chrome/Firefox.

---

## ✅ Soluciones

### Solución 1: Cambiar Ajustes del iPhone (Inmediato)

**Para el usuario**:
1. Abrir **Ajustes** en iPhone
2. Ir a **Cámara** → **Formatos**
3. Seleccionar **"Más compatible"** (en lugar de "Alta eficiencia")
4. Ahora grabará en MOV H.264 (compatible con todos los navegadores)

**Pros**:
- ✅ Solución inmediata
- ✅ No requiere cambios en código

**Contras**:
- ❌ Archivos más grandes (2x tamaño)
- ❌ Requiere que todos los usuarios cambien sus ajustes

### Solución 2: Transcoding Automático (Recomendado)

**Implementar en el servidor**:
1. Detectar formato del video al subirlo
2. Si es MOV con HEVC/ProRes, agregarlo a cola de transcoding
3. Convertir a MP4 H.264 usando FFmpeg
4. Notificar usuario cuando esté listo
5. Reemplazar video original con versión compatible

**Pros**:
- ✅ Transparente para el usuario
- ✅ Optimiza videos automáticamente
- ✅ Mejor experiencia general

**Contras**:
- ❌ Requiere infraestructura adicional (Lambda + ECS)
- ❌ Costo de procesamiento
- ❌ Demora en publicación (procesamiento asíncrono)

### Solución 3: Detección + Mensaje Útil (Corto Plazo)

**Implementar ahora**:
1. Detectar codec del video en cliente o servidor
2. Si es HEVC/ProRes, mostrar mensaje:
   ```
   ⚠️ Este video está en formato HEVC que no es compatible
   con todos los navegadores. Estamos procesándolo para mejor
   compatibilidad. Esto tomará unos minutos.
   ```
3. Mostrar placeholder mientras procesa
4. Reemplazar con versión compatible cuando esté lista

**Pros**:
- ✅ Balance entre UX y complejidad
- ✅ Usuario informado del proceso
- ✅ Funciona con infraestructura actual

**Contras**:
- ❌ Usuario debe esperar
- ❌ Aún requiere transcoding

---

## 🛠️ Implementación Recomendada

### Fase 1: Detección (Esta Semana)

**1. Detectar Codec en el Cliente**

Usar librería `video-metadata` o `ffprobe.wasm`:

```typescript
// src/utils/video-codec-detector.ts
import ffprobe from 'ffprobe-wasm';

export async function detectVideoCodec(file: File): Promise<{
  codec: string;
  isCompatible: boolean;
  needsTranscoding: boolean;
}> {
  const metadata = await ffprobe(file);
  const videoStream = metadata.streams.find(s => s.codec_type === 'video');

  const codec = videoStream?.codec_name || 'unknown';

  const compatibleCodecs = ['h264', 'vp8', 'vp9', 'av1'];
  const isCompatible = compatibleCodecs.includes(codec.toLowerCase());

  return {
    codec,
    isCompatible,
    needsTranscoding: !isCompatible
  };
}
```

**2. Mostrar Advertencia al Subir**

```typescript
// En MomentMediaUpload
const handleFileSelect = async (file: File) => {
  const codecInfo = await detectVideoCodec(file);

  if (!codecInfo.isCompatible) {
    toastManager.show(
      `⚠️ Video en formato ${codecInfo.codec.toUpperCase()}.
      Será convertido automáticamente para mejor compatibilidad.
      Esto puede tomar unos minutos.`,
      'warning',
      5000
    );

    // Marcar para transcoding
    setNeedsTranscoding(true);
  }

  // Continuar con upload normal
  await uploadFile(file);
};
```

### Fase 2: Transcoding en Servidor (Próxima Sprint)

**Arquitectura**:

```
1. Upload → S3
2. Lambda detecta nuevo archivo (S3 Event)
3. Si necesita transcoding:
   - Envía job a MediaConvert o ECS Task
   - MediaConvert convierte a MP4 H.264
   - Guarda en S3 con sufijo -transcoded.mp4
   - Actualiza DB con nueva URL
   - Notifica usuario vía WebSocket/SNS
4. Usuario ve video convertido
```

**AWS Services**:
- **MediaConvert**: Transcoding profesional ($0.015/min)
- **Lambda**: Orquestación
- **S3**: Storage original + convertido
- **DynamoDB Streams**: Notificaciones

**Costo estimado**:
- Video 1min @ 1080p: $0.015
- 1000 videos/mes: $15/mes

### Fase 3: Optimizaciones (Futuro)

- Generar múltiples resoluciones (360p, 720p, 1080p)
- HLS adaptive streaming
- Thumbnail extraction
- Duración máxima por video

---

## 📋 Checklist de Implementación

### Fase 1 (Esta Semana)
- [ ] Instalar `ffprobe-wasm` o alternativa ligera
- [ ] Implementar `detectVideoCodec` utility
- [ ] Agregar warning en upload de videos incompatibles
- [ ] Agregar campo `needsTranscoding` en DB
- [ ] Mostrar placeholder en feed para videos en proceso
- [ ] Agregar logging detallado de formatos

### Fase 2 (Próxima Sprint)
- [ ] Configurar AWS MediaConvert
- [ ] Crear Lambda function para detección
- [ ] Implementar cola de transcoding (SQS)
- [ ] Actualizar DB cuando transcoding complete
- [ ] Implementar notificaciones (WebSocket o polling)
- [ ] Agregar retry logic para fallos

### Fase 3 (Futuro)
- [ ] Multi-resolution transcoding
- [ ] HLS streaming
- [ ] CDN optimization (CloudFront)
- [ ] Analytics de formatos más usados

---

## 🧪 Testing

### Test Cases

1. **MOV H.264 (compatible)**
   - ✅ Debe reproducirse directamente
   - ✅ No debe mostrar warning
   - ✅ No debe enviar a transcoding

2. **MOV HEVC (incompatible)**
   - ⚠️ Debe mostrar warning
   - ⚠️ Debe marcar para transcoding
   - ✅ Debe mostrar placeholder en feed
   - ✅ Debe reemplazar con versión transcoded

3. **MP4 H.264**
   - ✅ Debe funcionar en todos los navegadores
   - ✅ Sin warning ni transcoding

4. **Archivos grandes (>1GB)**
   - ⚠️ Debe mostrar error antes de subir
   - ℹ️ Sugerir comprimir antes

---

## 📚 Referencias

### Codecs de Video
- [MDN: Media Formats](https://developer.mozilla.org/en-US/docs/Web/Media/Formats)
- [Can I Use: HEVC](https://caniuse.com/hevc)
- [Can I Use: H.264](https://caniuse.com/mpeg4)

### Transcoding
- [AWS MediaConvert](https://aws.amazon.com/mediaconvert/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [HLS Streaming](https://developer.apple.com/streaming/)

### iPhone Settings
- [Apple: Capture High Efficiency](https://support.apple.com/en-us/108019)
- [Apple: ProRes on iPhone](https://support.apple.com/guide/iphone/record-videos-in-apple-prores-iphcb9b7d742/ios)

---

**Última actualización**: 2025-10-11
**Owner**: Claude AI + Erick Aldama
**Status**: 🔍 Fase de Investigación - Logs detallados agregados
