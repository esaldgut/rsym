# Sistema Multimedia YAAN

## Descripción General

El **Sistema Multimedia YAAN** es una solución completa y optimizada para subir, procesar y mostrar archivos multimedia (imágenes y videos) en aplicaciones Next.js con AWS Amplify v6. Diseñado siguiendo las mejores prácticas de AWS para archivos grandes y optimizado para performance y experiencia de usuario.

## 🏗️ Arquitectura

```
Sistema Multimedia YAAN
├── 📦 Core Service
│   └── MediaUploadService (Singleton)
├── 🧩 UI Components  
│   ├── MediaUploadZone (Drag & Drop + Validation)
│   └── MediaPreview (Thumbnails + Progress)
├── 🌐 Route Handler
│   └── /api/upload/media (AWS S3 Upload)
└── 🔧 Configuration
    └── AWS Amplify v6 + S3
```

## 📁 Estructura de Archivos

```
/src
├── lib/services/
│   └── media-upload-service.ts       # Core service (Singleton)
├── components/media/
│   ├── MediaUploadZone.tsx          # Drag & drop upload zone
│   └── MediaPreview.tsx             # File preview with progress
└── app/api/upload/media/
    └── route.ts                     # AWS Route Handler
```

## 🚀 Instalación y Configuración

### 1. Configuración AWS

Asegúrate de tener configurado en tu `amplify_outputs.json`:

```json
{
  "storage": {
    "aws_region": "us-east-1",
    "bucket_name": "your-bucket-name"
  },
  "auth": {
    "aws_region": "us-east-1",
    "user_pool_id": "us-east-1_xxxxxx",
    "identity_pool_id": "us-east-1:xxxxx-xxxxx"
  }
}
```

### 2. Dependencias Requeridas

```bash
# Core dependencies (ya incluidas en YAAN)
npm install aws-amplify @aws-sdk/client-s3 @aws-sdk/credential-provider-cognito-identity
npm install @aws-sdk/client-cognito-identity uuid clsx react-hook-form
```

### 3. Configuración Next.js

En tu `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Para Route Handler
    },
  },
};
```

## 📖 Guía de Uso

### Uso Básico - Upload de Imágenes

```tsx
import { useState } from 'react';
import MediaUploadZone from '@/components/media/MediaUploadZone';
import MediaPreview, { MediaFile } from '@/components/media/MediaPreview';

function MyComponent() {
  const [files, setFiles] = useState<MediaFile[]>([]);

  return (
    <div>
      {/* Preview de archivos */}
      <MediaPreview 
        files={files}
        onRemove={(index) => {
          const updatedFiles = files.filter((_, i) => i !== index);
          setFiles(updatedFiles);
        }}
      />
      
      {/* Zona de upload */}
      <MediaUploadZone
        files={files}
        onFilesChange={setFiles}
        productId="my-product-id"
        type="gallery"
        accept="image"
        maxFiles={5}
      />
    </div>
  );
}
```

### Uso Avanzado - Control Completo

```tsx
import { useState, useCallback } from 'react';
import { mediaUploadService } from '@/lib/services/media-upload-service';
import MediaUploadZone from '@/components/media/MediaUploadZone';
import MediaPreview, { MediaFile } from '@/components/media/MediaPreview';

function AdvancedUploadComponent() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploadStats, setUploadStats] = useState({ total: 0, completed: 0 });

  const handleFilesChange = useCallback((newFiles: MediaFile[]) => {
    setFiles(newFiles);
    
    // Calcular estadísticas
    const completed = newFiles.filter(f => f.uploadStatus === 'complete').length;
    setUploadStats({ total: newFiles.length, completed });
  }, []);

  const handleCustomUpload = async (file: File) => {
    const result = await mediaUploadService.uploadFile(
      file,
      'custom-product-id',
      'gallery',
      (progress) => {
        console.log(`Upload progress: ${progress.percentage}%`);
      }
    );
    
    if (result.success) {
      console.log('File uploaded:', result.url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          📊 Upload Status: {uploadStats.completed}/{uploadStats.total} archivos completados
        </p>
      </div>

      <MediaPreview 
        files={files}
        onRemove={(index) => {
          const updatedFiles = files.filter((_, i) => i !== index);
          handleFilesChange(updatedFiles);
        }}
        layout="grid"
        maxDisplaySize="lg"
      />
      
      <MediaUploadZone
        files={files}
        onFilesChange={handleFilesChange}
        productId="advanced-upload"
        type="gallery"
        accept="all"
        maxFiles={10}
      />
    </div>
  );
}
```

## 🔧 API Reference

### MediaUploadService

```typescript
class MediaUploadService {
  // Upload individual file
  async uploadFile(
    file: File,
    productId: string,
    type: 'cover' | 'gallery' | 'video',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaUploadResult>

  // Upload múltiples archivos
  async uploadMultiple(
    files: File[],
    productId: string,
    type: 'cover' | 'gallery' | 'video',
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    maxConcurrent?: number
  ): Promise<MediaUploadResult[]>

  // Validar archivo
  validateFile(
    file: File, 
    type: 'cover' | 'gallery' | 'video'
  ): { valid: boolean; error?: string }
}
```

### MediaUploadZone Props

```typescript
interface MediaUploadZoneProps {
  files: MediaFile[];                          // Array de archivos actuales
  onFilesChange: (files: MediaFile[]) => void; // Callback cuando cambien archivos
  productId: string;                           // ID del producto/contenedor
  type?: 'cover' | 'gallery' | 'video';       // Tipo de contenido
  accept?: 'image' | 'video' | 'all';         // Tipos de archivo aceptados
  maxFiles?: number;                           // Máximo número de archivos
  className?: string;                          // CSS classes adicionales
  disabled?: boolean;                          // Deshabilitar componente
}
```

### MediaPreview Props

```typescript
interface MediaPreviewProps {
  files: MediaFile[];                          // Array de archivos a mostrar
  onRemove?: (index: number) => void;         // Callback para eliminar archivo
  className?: string;                          // CSS classes adicionales
  showProgress?: boolean;                      // Mostrar barras de progreso
  maxDisplaySize?: 'sm' | 'md' | 'lg';       // Tamaño de thumbnails
  layout?: 'list' | 'grid';                  // Layout de visualización
}
```

### MediaFile Interface

```typescript
interface MediaFile {
  file: File;                                  // Archivo original
  preview?: string;                           // URL de preview
  uploadProgress?: number;                    // Progreso de upload (0-100)
  uploadStatus?: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  s3Key?: string;                            // Clave en S3
  url?: string;                              // URL pública del archivo
  thumbnailUrl?: string;                     // URL del thumbnail
  error?: string;                            // Mensaje de error
}
```

## 🎯 Casos de Uso

### 1. ProductWizard (Implementado)
- Upload de imagen de portada (1 archivo, máx 10MB)
- Galería de imágenes (hasta 10 archivos, máx 50MB cada uno)
- Videos promocionales (hasta 5 archivos, máx 5GB cada uno)

### 2. Red Social /moments (Próximo)
- Posts multimedia con imágenes y videos
- Stories temporales
- Avatar y fotos de perfil

### 3. Documentos Legales
- Upload de PDFs y documentos oficiales
- Validación y procesamiento automático

## 🔄 Integración con /moments

Para adaptar el sistema a la red social `/moments`:

### 1. Crear Route Handler Específico

```typescript
// /app/api/upload/moments/route.ts
export async function POST(request: NextRequest) {
  // Lógica específica para moments:
  // - Estructura S3: /moments/{user_id}/{moment_id}/
  // - Metadata adicional: moment_type, visibility, etc.
  // - Procesamiento de hashtags y menciones
}
```

### 2. Componente MomentUpload

```tsx
// /components/moments/MomentUpload.tsx
import MediaUploadZone from '@/components/media/MediaUploadZone';
import MediaPreview from '@/components/media/MediaPreview';

export function MomentUpload({ momentId, userId }) {
  return (
    <MediaUploadZone
      files={files}
      onFilesChange={setFiles}
      productId={momentId}
      type="gallery"
      accept="all"
      maxFiles={10}
    />
  );
}
```

### 3. Personalización para Moments

```typescript
// Configuración específica para moments
const MOMENTS_CONFIG = {
  maxFiles: 10,
  maxImageSize: 25 * 1024 * 1024, // 25MB
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedVideoTypes: ['video/mp4', 'video/webm'],
  s3Structure: 'moments/{user_id}/{moment_id}/'
};
```

## 📊 Características Técnicas

### Performance
- ✅ **Componentes memoizados** para evitar re-renders
- ✅ **Lazy loading** de componentes pesados
- ✅ **Debounce** en campos de texto (300-500ms)
- ✅ **Cleanup automático** de object URLs
- ✅ **Progress tracking** en tiempo real

### Escalabilidad
- ✅ **Upload concurrente** (máx 3 archivos simultáneos)
- ✅ **Timeouts dinámicos** según tamaño de archivo
- ✅ **Singleton pattern** para gestión eficiente
- ✅ **Route Handler** optimizado para archivos grandes
- ✅ **Estructura S3** organizada y flexible

### UX/UI
- ✅ **Drag & Drop** intuitivo
- ✅ **Preview inmediato** con thumbnails reales
- ✅ **Estados visuales** claros para cada archivo
- ✅ **Notificaciones** integradas con sistema YAAN
- ✅ **Responsive design** mobile-first
- ✅ **Validación** en tiempo real

### Seguridad
- ✅ **Autenticación** AWS Cognito
- ✅ **Validación** de tipos y tamaños de archivo
- ✅ **Metadata** completa para auditoría
- ✅ **Límites** configurables por tipo de contenido
- ✅ **Error handling** robusto

## 🐛 Troubleshooting

### Problema: "Body exceeded 1 MB limit"
**Solución**: El sistema usa Route Handlers en lugar de Server Actions para evitar este límite.

### Problema: "Maximum update depth exceeded"
**Solución**: Los componentes están optimizados con `useCallback`, `useMemo` y dependencias correctas.

### Problema: Thumbnails no se muestran
**Solución**: El sistema genera previews reales usando `URL.createObjectURL()` con cleanup automático.

### Problema: Upload lento para archivos grandes
**Solución**: El sistema implementa uploads concurrentes y timeouts dinámicos según el tamaño.

## 📈 Métricas y Monitoreo

El sistema incluye logging automático para:
- Tiempo de upload por archivo
- Tasa de éxito/error
- Tipos de archivo más utilizados
- Tamaños promedio de archivo
- Performance de uploads concurrentes

## 🔮 Roadmap

### Próximas Funcionalidades
- [ ] **Compresión automática** de imágenes antes del upload
- [ ] **Generación de thumbnails** con AWS Lambda
- [ ] **Upload chunked** para archivos muy grandes (>1GB)
- [ ] **Integración con CDN** para entrega optimizada
- [ ] **Watermarks automáticos** para protección de contenido
- [ ] **Análisis de contenido** con AWS Rekognition
- [ ] **Transcoding automático** de videos

### Integraciones Futuras
- [ ] **Moments Feed** - Posts multimedia en tiempo real
- [ ] **Stories** - Contenido temporal con auto-eliminación
- [ ] **Live Streaming** - Transmisiones en vivo
- [ ] **Chat Multimedia** - Envío de archivos en mensajes
- [ ] **Marketplace** - Galería de productos mejorada

---

## 📄 Licencia

Este sistema es parte de la plataforma YAAN y está sujeto a las políticas de la empresa.

## 👨‍💻 Contribución

Para contribuir al sistema multimedia, sigue las guías de desarrollo de YAAN y asegúrate de:
1. Mantener compatibilidad con AWS Amplify v6
2. Seguir patrones de performance establecidos
3. Incluir tests para nuevas funcionalidades
4. Actualizar esta documentación según cambios

---

**Última actualización**: $(date)  
**Versión**: 2.0.0  
**Mantenedor**: Equipo de Desarrollo YAAN