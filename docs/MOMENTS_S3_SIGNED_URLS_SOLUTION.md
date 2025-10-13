# Solución Definitiva: URLs Firmadas de S3 en Next.js 15

## 📋 Resumen Ejecutivo

Se implementó una solución robusta para manejar URLs firmadas de S3 que contienen query parameters, reemplazando Next.js Image con tags `<img>` nativos cuando es necesario.

## 🔍 Problema Identificado

### Error Original
```
Error: Invalid src prop (https://bucket.s3.amazonaws.com/path/file.jpg?X-Amz-Algorithm=...)
on `next/image`, hostname "bucket.s3.amazonaws.com" is not configured under images
in your `next.config.js`
```

### Causa Raíz
Next.js Image Component tiene limitaciones con URLs firmadas de S3:
1. **Query Parameters**: Las URLs firmadas incluyen parámetros como `X-Amz-Algorithm`, `X-Amz-Credential`, etc.
2. **Validación Estricta**: Next.js valida el hostname exacto sin considerar query parameters
3. **Optimización de Imágenes**: No puede optimizar URLs temporales con tokens de seguridad

## 🛠️ Solución Implementada

### 1. Reemplazo Selectivo de Next.js Image

**Componente MomentMedia** (src/components/moments/MomentCard.tsx:483-550)
```typescript
function MomentMedia({
  resourceUrl,
  description,
  hasVideo,
  videoRef,
  isPlaying,
  isMuted,
  toggle,
  unmute
}: MomentMediaProps) {
  // Obtener URL firmada de S3
  const { url, isLoading, error } = useStorageUrl(resourceUrl);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
    );
  }

  if (error || !url) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (hasVideo) {
    return (
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={isMuted}
        autoPlay={isPlaying}
        onClick={toggle}
        onDoubleClick={unmute}
      />
    );
  }

  // SOLUCIÓN: Usar <img> nativo para URLs firmadas de S3
  // Next.js Image no funciona bien con URLs firmadas que tienen query parameters
  return (
    <img
      src={url}
      alt={description || 'Imagen del momento'}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );
}
```

### 2. Manejo de Avatares

**Normalización de URLs de Avatar** (src/components/moments/MomentCard.tsx:176-189)
```typescript
const getAvatarUrl = (avatarUrl: string | undefined): string | null => {
  if (!avatarUrl) return null;

  // Si ya es una URL absoluta, usarla directamente
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  // Si viene con prefijo 'public/', convertir a ruta relativa
  if (avatarUrl.startsWith('public/')) {
    return '/' + avatarUrl.substring(7);
  }

  // Si ya es una ruta relativa válida
  if (avatarUrl.startsWith('/')) {
    return avatarUrl;
  }

  return null;
};

// Uso con <img> nativo para avatares
const normalizedAvatarUrl = getAvatarUrl(moment.user?.avatarUrl);
{normalizedAvatarUrl ? (
  <img
    src={normalizedAvatarUrl}
    alt={moment.user?.username || 'Usuario'}
    className="w-full h-full object-cover"
  />
) : (
  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
)}
```

## 📊 Comparación: Next.js Image vs img Nativo

| Característica | Next.js Image | img Nativo |
|----------------|---------------|------------|
| URLs firmadas con query params | ❌ Error | ✅ Funciona |
| Optimización automática | ✅ Sí | ❌ No |
| Lazy loading | ✅ Automático | ✅ Con `loading="lazy"` |
| Responsive | ✅ Con sizes | ✅ Con CSS |
| Formato WebP | ✅ Automático | ❌ Manual |
| CDN Cache | ✅ Optimizado | ⚠️ Depende de S3 |

## ✅ Ventajas de la Solución

1. **Compatibilidad Total**: Funciona con cualquier URL firmada de S3
2. **Sin Configuración**: No requiere modificar next.config.js
3. **Flexibilidad**: Maneja tokens de seguridad y expiración
4. **Performance Aceptable**: Con lazy loading y cache del navegador
5. **Simplicidad**: Menos complejidad que configurar un loader personalizado

## ⚠️ Consideraciones

1. **Optimización Manual**: Sin conversión automática a WebP
2. **Ancho de Banda**: Mayor consumo sin optimización de Next.js
3. **LCP**: Potencial impacto en Largest Contentful Paint
4. **Cache**: Depende de headers de S3 y navegador

## 🚀 Optimizaciones Futuras Recomendadas

### 1. Implementar Image Loader Personalizado
```typescript
// Opción para futuro: Custom loader que maneje URLs firmadas
const s3Loader = ({ src, width, quality }) => {
  // Extraer URL base sin query params
  const [baseUrl, queryString] = src.split('?');

  // Si tiene query params (URL firmada), usarla directamente
  if (queryString) {
    return src;
  }

  // Si no, aplicar optimizaciones
  return `${baseUrl}?w=${width}&q=${quality || 75}`;
};
```

### 2. Pre-generar URLs en el Servidor
```typescript
// Server Action con URLs pre-generadas y cache
export async function getMomentsWithSignedUrls() {
  const moments = await getMoments();

  // Pre-generar URLs y cachearlas
  return Promise.all(moments.map(async (moment) => ({
    ...moment,
    signedUrl: await generateSignedUrl(moment.resourceUrl),
    signedUrlExpiry: Date.now() + (3600 * 1000) // 1 hora
  })));
}
```

### 3. Implementar Service Worker para Cache
```javascript
// Cache de URLs firmadas en Service Worker
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('s3.amazonaws.com')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          // Cache por 30 minutos
          return caches.open('s3-images').then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

## 📝 Conclusión

La solución implementada usando tags `<img>` nativos es pragmática y efectiva para manejar URLs firmadas de S3. Aunque sacrifica algunas optimizaciones automáticas de Next.js, garantiza compatibilidad total con el sistema de seguridad de AWS S3.

Esta aproximación es especialmente válida cuando:
- Las imágenes ya están optimizadas en origen
- Se requiere seguridad con URLs temporales
- La simplicidad es prioritaria sobre micro-optimizaciones

## 🔗 Referencias

- [Next.js Image Documentation](https://nextjs.org/docs/app/api-reference/components/image)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Web.dev Lazy Loading](https://web.dev/lazy-loading-images/)
- [MDN img element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img)

---

**Implementación**: 2025-10-11
**Versión**: 1.0.0
**Estado**: ✅ Funcionando en producción