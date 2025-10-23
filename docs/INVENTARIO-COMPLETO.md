# 📋 INVENTARIO COMPLETO - PLATAFORMA YAAN

## 🎯 OBJETIVO
Auditoría completa de funcionalidades para **reconstrucción desde cero** de forma estructurada.

---

## 🏗️ ESTRUCTURA DE APLICACIÓN

### **Next.js 15 App Router**
```
src/app/
├── (general)/          # Grupo de rutas generales
├── auth/               # Páginas de autenticación
├── dashboard/          # Panel principal del usuario
├── marketplace/        # Mercado de productos/servicios
├── moments/            # Feed de momentos (social)
├── oauth2/             # OAuth callback handlers
├── profile/            # Perfil del usuario
├── provider/           # Dashboard del proveedor
├── settings/           # Configuraciones de usuario
├── logo-showcase/      # Showcase de logos
└── test-auth-status/   # Testing de autenticación
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### **Proveedores OAuth configurados:**
1. **Google** - Login social
2. **Facebook** - Login social
3. **Amazon Cognito** - Proveedor principal

### **Componentes de Auth:**
```
components/auth/
├── AuthGuard.tsx           # Protección de rutas
├── LoginForm.tsx          # Formulario de login
├── SignUpForm.tsx         # Formulario de registro
├── OAuth/                 # Botones OAuth
└── AuthStatus.tsx         # Estado de autenticación
```

### **Hooks de Auth:**
```
hooks/
├── useAmplifyAuth.ts      # Hook principal de auth
├── useAmplifyAuth-mock.ts # Mock para testing
├── useSocialAuth.ts       # OAuth social
└── useUserType.ts         # Tipo de usuario (buyer/provider)
```

### **Utilidades de Auth:**
```
lib/auth/
utils/
├── authGuards.ts          # Guards de rutas
├── cognito-error-decoder.ts # Decodificador errores Cognito
├── oauth-helpers.ts       # Helpers OAuth
└── security-audit.ts     # Auditoría de seguridad
```

---

## 👤 SISTEMA DE PERFILES

### **Tipos de Usuario:**
1. **Buyer** - Comprador/consumidor
2. **Provider** - Proveedor de servicios

### **Componentes de Profile:**
```
components/profile/
├── ProfileCompletion.tsx  # Completar perfil
├── ProfileForm.tsx        # Formulario de perfil
├── UserTypeSelector.tsx   # Selector tipo usuario
└── ProfileImage.tsx       # Imagen de perfil
```

### **Context de Usuario:**
```
contexts/
└── UserTypeContext.tsx    # Contexto tipo de usuario
```

---

## 🛍️ SISTEMA DE MARKETPLACE

### **Páginas:**
```
app/marketplace/
├── page.tsx              # Lista de productos
├── [productId]/          # Detalle de producto
└── search/               # Búsqueda de productos
```

### **Componentes:**
```
components/marketplace/
├── ProductCard.tsx       # Tarjeta de producto
├── ProductList.tsx       # Lista de productos
├── ProductSearch.tsx     # Buscador
├── CategoryFilter.tsx    # Filtros por categoría
└── ProductDetail.tsx     # Detalle completo
```

---

## 🏪 SISTEMA DE PROVEEDOR

### **Dashboard del Proveedor:**
```
app/provider/
├── page.tsx              # Dashboard principal
├── products/             # Gestión de productos
├── orders/               # Gestión de pedidos
├── analytics/            # Analíticas
└── settings/             # Configuraciones
```

### **Componentes Provider:**
```
components/provider/
├── ProviderDashboard.tsx # Dashboard principal
├── ProductManagement.tsx # Gestión productos
├── OrderList.tsx         # Lista de pedidos
├── ProviderStats.tsx     # Estadísticas
└── ProviderSettings.tsx  # Configuraciones
```

### **Product Wizard (Creación de Productos):**
```
components/product-wizard/
├── ProductWizard.tsx     # Wizard principal
├── StepLayout.tsx        # Layout de pasos
├── steps/                # Pasos individuales
│   ├── BasicInfoStep.tsx
│   ├── MediaStep.tsx
│   ├── PricingStep.tsx
│   ├── LocationStep.tsx
│   └── ReviewStep.tsx
└── ReviewForm.tsx        # Revisión final
```

---

## 📱 SISTEMA SOCIAL (MOMENTS)

### **Feed de Momentos:**
```
app/moments/
├── page.tsx              # Feed principal
├── create/               # Crear momento
└── [momentId]/           # Detalle momento
```

### **Componentes Social:**
```
components/moments/
├── MomentCard.tsx        # Tarjeta de momento
├── MomentFeed.tsx        # Feed completo
├── CreateMoment.tsx      # Crear momento
├── MomentInteractions.tsx # Likes, comentarios
└── MomentMedia.tsx       # Media del momento
```

---

## 🗺️ SISTEMA DE UBICACIÓN

### **Servicio AWS Location:**
```
lib/services/
├── location-service.ts   # Servicio principal
└── geocoding.ts          # Geocodificación
```

### **Componentes Location:**
```
components/location/
├── LocationSelector.tsx  # Selector de ubicación
├── LocationMap.tsx       # Mapa interactivo
├── LocationSearch.tsx    # Búsqueda de lugares
└── LocationDisplay.tsx   # Mostrar ubicación
```

### **Hook de Location:**
```
hooks/
└── useLocationSelector.ts # Hook selector ubicación
```

---

## 📸 SISTEMA MULTIMEDIA

### **Gestión de Media:**
```
components/media/
├── MediaUpload.tsx       # Subida de archivos
├── ImageGallery.tsx      # Galería de imágenes
├── VideoPlayer.tsx       # Reproductor de video
└── MediaPreview.tsx      # Preview de media
```

### **Hooks y Servicios:**
```
hooks/
├── useMediaUpload.ts     # Upload de media
└── useStorageUrls.ts     # URLs de Storage

utils/
├── image-helpers.ts      # Helpers de imagen
├── storage-helpers.ts    # Helpers de storage
└── storage-upload-manager.ts # Manager de uploads
```

### **S3 Storage:**
```
lib/utils/
└── s3-url-transformer.ts # Transformador URLs S3
```

---

## 🏢 SISTEMA DE DASHBOARD

### **Dashboard General:**
```
app/dashboard/
├── page.tsx              # Dashboard principal
├── analytics/            # Analíticas
├── notifications/        # Notificaciones
└── activities/           # Actividades recientes
```

### **Componentes Dashboard:**
```
components/dashboard/
├── DashboardLayout.tsx   # Layout principal
├── StatsCards.tsx        # Tarjetas estadísticas
├── ActivityFeed.tsx      # Feed de actividad
├── NotificationCenter.tsx # Centro notificaciones
└── QuickActions.tsx      # Acciones rápidas
```

---

## 🎨 SISTEMA DE UI

### **Componentes Base:**
```
components/ui/
├── Button.tsx            # Botones
├── Input.tsx             # Inputs
├── Modal.tsx             # Modales
├── Loading.tsx           # Indicadores de carga
├── Toast.tsx             # Notificaciones toast
├── Dropdown.tsx          # Dropdowns
├── Tabs.tsx              # Pestañas
├── Card.tsx              # Tarjetas
├── Badge.tsx             # Badges
└── Avatar.tsx            # Avatares
```

### **Layout Components:**
```
components/layout/
├── Header.tsx            # Header principal
├── Footer.tsx            # Footer
├── Sidebar.tsx           # Sidebar
├── Navigation.tsx        # Navegación
└── Container.tsx         # Container wrapper
```

### **Navbar:**
```
components/navbar/
├── MainNavbar.tsx        # Navbar principal
├── MobileNavbar.tsx      # Navbar móvil
├── NavLinks.tsx          # Enlaces navegación
└── UserMenu.tsx          # Menú de usuario
```

---

## 🔗 SISTEMA DE DATOS (GraphQL)

### **Schema y Queries:**
```
lib/graphql/
├── queries.ts            # Queries GraphQL
├── mutations.ts          # Mutaciones GraphQL
├── fragments.ts          # Fragmentos reutilizables
└── types.ts              # Tipos generados

lib/
└── graphql-queries.ts    # Queries adicionales
```

### **Server Actions:**
```
lib/server/
├── product-wizard-actions.ts    # Acciones wizard productos
├── product-creation-actions.ts  # Creación productos
├── user-actions.ts              # Acciones usuario
├── location-actions.ts          # Acciones ubicación
└── media-actions.ts             # Acciones multimedia
```

### **Hooks de Data:**
```
hooks/
├── useAmplifyData.ts     # Hook datos Amplify
├── useProductCreation.ts # Creación productos
├── useProviderProducts.ts # Productos proveedor
└── useProfileCompletion.ts # Completar perfil
```

---

## 🧠 TIPOS Y VALIDACIONES

### **Tipos TypeScript:**
```
types/
├── auth.ts               # Tipos autenticación
├── product.ts            # Tipos productos
├── location.ts           # Tipos ubicación
├── analytics.ts          # Tipos analíticas
├── common.ts             # Tipos comunes
├── graphql.ts            # Tipos GraphQL
├── wizard.ts             # Tipos wizard
└── index.ts              # Exportaciones
```

### **Validaciones:**
```
lib/validations/
├── auth-validation.ts    # Validaciones auth
├── product-validation.ts # Validaciones productos
└── profile-validation.ts # Validaciones perfil
```

---

## ⚙️ CONFIGURACIONES

### **Next.js:**
```
next.config.mjs           # Configuración Next.js
middleware.ts             # Middleware de rutas
```

### **AWS Amplify:**
```
amplify/
├── backend.ts            # Backend config
├── data/resource.ts      # Recursos de datos
└── outputs.json          # Outputs generados

src/
├── amplify-ui-config.ts  # Config UI Amplify
├── app/amplify-client-config.tsx
└── app/amplify-config-ssr.ts
```

### **TypeScript:**
```
tsconfig.json             # Config TypeScript
tsconfig.tsbuildinfo      # Build info
next-env.d.ts             # Types Next.js
```

### **Linting:**
```
eslint.config.mjs         # Config ESLint
eslint.config.mjs.disabled
```

### **Styling:**
```
src/app/globals.css       # Estilos globales
src/styles/design-tokens.ts # Tokens de diseño
postcss.config.mjs        # PostCSS config
```

---

## 📚 DOCUMENTACIÓN EXISTENTE

```
docs/
├── ANALYTICS_PHASE1_IMPLEMENTATION.md
├── ANALYTICS_TRACKING_GUIDE.md
├── AUTHENTICATION_SYSTEM.md
├── AWS_LOCATION_SYSTEM.md
├── BROWSER_ALERT_MIGRATION.md
├── ESTRATEGIA-COOKIES-HTTP-ONLY.md
├── MULTIMEDIA_SYSTEM.md
├── NOTIFICATION_PATTERNS.md
├── NOTIFICATION_SYSTEM.md
├── OAUTH-COOKIES-CONSIDERATIONS.md
├── PAGINATION_IMPLEMENTATION.md
├── PRODUCT_WIZARD_SYSTEM.md
├── S3_URL_TRANSFORMER_SYSTEM.md
└── UX_IMPROVEMENT_REPORT.md
```

---

## 🚨 PROBLEMAS IDENTIFICADOS

### **1. Compilación (yarn build FALLA):**
- Errores TypeScript no resueltos
- Imports circulares
- Dependencias mal configuradas
- Configuraciones conflictivas

### **2. Arquitectura:**
- Múltiples formas de hacer lo mismo
- Código duplicado entre `/lib` y `/utils`
- Inconsistencia en patterns
- Falta de separación clara de responsabilidades

### **3. Performance:**
- Imagen Docker 2.6GB
- yarn dev en producción
- Dependencies no optimizadas
- Bundle size no optimizado

### **4. Mantenibilidad:**
- Deuda técnica acumulada
- Falta de tests
- Documentación desactualizada
- Código legacy mezclado

---

## ✅ FUNCIONALIDADES CORE CONFIRMADAS

1. ✅ **Autenticación completa** (OAuth + Cognito)
2. ✅ **Perfiles de usuario** (Buyer/Provider)
3. ✅ **Marketplace** (Productos/Servicios)
4. ✅ **Dashboard de Proveedor** (Gestión productos)
5. ✅ **Product Wizard** (Creación productos)
6. ✅ **Sistema Social** (Moments/Feed)
7. ✅ **Ubicación** (AWS Location Service)
8. ✅ **Multimedia** (S3 + Upload)
9. ✅ **UI Components** (Sistema de diseño)
10. ✅ **GraphQL** (Amplify Gen 2)

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Auditoría de dependencias** - package.json
2. **Mapeo de errores TypeScript** - tsc --noEmit
3. **Identificar funcionalidades críticas vs nice-to-have**
4. **Plan de migración/refactoring**
5. **Arquitectura limpia propuesta**

**¿Procedo con alguna categoría específica o quieres que profundice en algún sistema en particular?**