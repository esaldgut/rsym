# 🔧 Fix: S3 CORS Configuration for Video Playback

**Problema**: Videos .mov no se reproducen - Error código 0 (CORS blocked)
**Causa**: Bucket S3 `yaan-provider-documents` no tiene configuración CORS
**Solución**: Agregar configuración CORS al bucket

---

## 🚀 Solución Inmediata

### Paso 1: Abrir AWS Console

1. Ir a https://console.aws.amazon.com/s3/
2. Buscar bucket: `yaan-provider-documents`
3. Click en el nombre del bucket

### Paso 2: Configurar CORS

1. Click en la pestaña **"Permissions"**
2. Scroll down hasta **"Cross-origin resource sharing (CORS)"**
3. Click en **"Edit"**
4. Pegar la siguiente configuración:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://yaan.com.mx",
            "https://www.yaan.com.mx",
            "https://*.yaan.com.mx"
        ],
        "ExposeHeaders": [
            "ETag",
            "Content-Length",
            "Content-Type",
            "Accept-Ranges",
            "Content-Range"
        ],
        "MaxAgeSeconds": 3600
    }
]
```

5. Click en **"Save changes"**

### Paso 3: Verificar

1. Recargar la página de moments en el navegador
2. El video debería reproducirse ahora

---

## 📋 Explicación de la Configuración

### AllowedHeaders
```json
"AllowedHeaders": ["*"]
```
Permite todos los headers en las requests (necesario para Range requests de video)

### AllowedMethods
```json
"AllowedMethods": ["GET", "HEAD"]
```
- **GET**: Para descargar el archivo
- **HEAD**: Para obtener metadata (tamaño, tipo)

### AllowedOrigins
```json
"AllowedOrigins": [
    "http://localhost:3000",    // Desarrollo local
    "https://yaan.com.mx",      // Producción
    "https://www.yaan.com.mx",  // Producción con www
    "https://*.yaan.com.mx"     // Subdominios (staging, etc.)
]
```

### ExposeHeaders
```json
"ExposeHeaders": [
    "ETag",              // Cache validation
    "Content-Length",    // Tamaño del archivo
    "Content-Type",      // Tipo MIME
    "Accept-Ranges",     // Soporte para range requests
    "Content-Range"      // Info de rango para streaming
]
```
Estos headers son **críticos** para que el video HTML5 funcione correctamente con streaming progresivo.

### MaxAgeSeconds
```json
"MaxAgeSeconds": 3600
```
Cachea la respuesta CORS por 1 hora (mejora performance)

---

## 🧪 Testing

### Verificar CORS está Funcionando

**En Chrome DevTools → Network**:

1. Recargar la página de moments
2. Buscar request al archivo `.mov`
3. Verificar headers de respuesta:
   ```
   Access-Control-Allow-Origin: http://localhost:3000
   Access-Control-Allow-Methods: GET, HEAD
   Access-Control-Expose-Headers: ETag, Content-Length, ...
   ```

Si ves estos headers, CORS está funcionando ✅

### Verificar Video Reproduce

1. Ir a http://localhost:3000/moments
2. Video debería cargar y reproducirse automáticamente
3. No más errores en consola

---

## 🔒 Configuración de Producción (Adicional)

Para producción, también configura:

### 1. Bucket Policy (Acceso Público de Lectura)

Si los archivos son públicos, agrega esta policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::yaan-provider-documents/public/*"
        }
    ]
}
```

**Nota**: Solo aplica a la carpeta `/public/*`, no a todo el bucket.

### 2. CloudFront Distribution (Opcional pero Recomendado)

Para mejor performance y menor costo:

1. Crear CloudFront distribution apuntando a S3
2. Configurar CORS en CloudFront también
3. Usar URL de CloudFront en lugar de S3 directamente

**Beneficios**:
- ✅ 70% más rápido (CDN global)
- ✅ 50% más barato (menos data transfer de S3)
- ✅ HTTPS gratis
- ✅ Mejor caché

---

## 📊 Verificación Post-Fix

### Checklist

- [ ] Configuración CORS agregada al bucket
- [ ] Recargar página de moments
- [ ] Video se carga sin errores
- [ ] Video se reproduce correctamente
- [ ] Console del navegador sin errores CORS

### Expected Console Logs (Después del Fix)

```
[MomentCard] 🎴 Renderizando momento: { id: "...", resourceUrlFirst: "https://..." }
[MomentMedia] 📦 Props recibidas: { resourceUrl: "https://...", hasVideo: true }
[useStorageUrl] 📦 Procesando path: https://yaan-provider-documents.s3...
[useStorageUrl] ✅ URL pública detectada, usando directamente
[MomentMedia] 🔗 Estado: { url: "https://...", isLoading: false }
[MomentMedia] 🎬 Video loadstart: https://...
[MomentMedia] ✅ Video metadata loaded
[MomentMedia] ✅ Video can play
[MomentCard] Video playing: 68eaff0bc822f6be2d2ed688
```

---

## 🚨 Problemas Comunes

### Problema 1: "CORS configuration has been successfully set" pero aún no funciona

**Solución**: Esperar 1-2 minutos para que los cambios se propaguen en S3

### Problema 2: Error "Access-Control-Allow-Origin: *"

**Causa**: Wildcard `*` no funciona con credentials
**Solución**: Usar lista específica de origins (como arriba)

### Problema 3: Funciona en localhost pero no en producción

**Causa**: Falta agregar domain de producción a AllowedOrigins
**Solución**: Agregar `https://yaan.com.mx` a la lista

---

## 📚 Referencias

- [AWS S3 CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [HTML5 Video CORS](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image#what_is_a_cors-enabled_image)

---

## 🎯 Comando CLI (Alternativa)

Si prefieres usar AWS CLI:

```bash
# Guardar configuración en archivo
cat > cors-config.json <<'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://yaan.com.mx",
        "https://www.yaan.com.mx"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type",
        "Accept-Ranges",
        "Content-Range"
      ],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# Aplicar configuración
aws s3api put-bucket-cors \
  --bucket yaan-provider-documents \
  --cors-configuration file://cors-config.json \
  --region us-west-2

# Verificar
aws s3api get-bucket-cors \
  --bucket yaan-provider-documents \
  --region us-west-2
```

---

**Última actualización**: 2025-10-11
**Status**: ✅ Ready to apply
**Tiempo estimado**: 5 minutos
**Impacto**: 🎯 Resolverá el problema de video playback
