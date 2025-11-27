# ============================================================================
# Dockerfile para Next.js 16.0.2 - Patrón Oficial Multi-Stage
# ============================================================================
# Basado en documentación oficial:
# https://nextjs.org/docs/app/building-your-application/deploying/production-checklist#docker-image
#
# CARACTERÍSTICAS CLAVE:
# - Multi-stage build (base → deps → builder → runner)
# - Auto-detección de package manager (yarn.lock → usa yarn)
# - Standalone output mode (next.config.mjs: output: 'standalone')
# - Sharp para optimización de imágenes en producción
# - Amplify v6 Gen 2 outputs.json copiado explícitamente
# - Deep linking files (.well-known/) copiados explícitamente
# - Usuario no-root (nextjs:nodejs) para seguridad
# - Healthcheck opcional
#
# TAMAÑO ESPERADO: ~370-480MB (vs 2.83GB con Dockerfile.dev)
# - Base: ~300-400MB
# - FFmpeg: ~70-80MB adicionales
#
# IMPORTANTE: Este Dockerfile usa --webpack flag
# - next.config.mjs requiere webpack para custom loader de .graphql files
# - Turbopack no soporta custom loaders todavía
# - Ver package.json scripts: "build": "next build --webpack"
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 0: base - Dependencias del sistema
# ----------------------------------------------------------------------------
# Prepara el sistema base con dependencias necesarias para Node.js en Alpine
# - libc6-compat: Compatibilidad con binarios compilados para glibc
# - Sharp requiere estas dependencias del sistema
# ----------------------------------------------------------------------------
FROM node:20-alpine AS base

# Instalar dependencias del sistema necesarias para Sharp y otros paquetes nativos
# libc6-compat: Requerido para compatibilidad de binarios nativos en Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar archivos de definición de paquetes para cache layer optimization
# El layer se invalida solo si estos archivos cambian
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Auto-detectar package manager y preparar para siguientes stages
# Next.js recomienda usar el mismo package manager que generó el lockfile
RUN \
  if [ -f yarn.lock ]; then \
    echo "🔍 Detected yarn.lock - will use yarn"; \
    corepack enable; \
  elif [ -f package-lock.json ]; then \
    echo "🔍 Detected package-lock.json - will use npm"; \
  elif [ -f pnpm-lock.yaml ]; then \
    echo "🔍 Detected pnpm-lock.yaml - will use pnpm"; \
    corepack enable; \
  else \
    echo "⚠️ No lockfile found - defaulting to yarn"; \
    corepack enable; \
  fi

# ----------------------------------------------------------------------------
# Stage 1: deps - Instalación de dependencias
# ----------------------------------------------------------------------------
# Instala SOLO las dependencias de producción para optimizar tamaño
# - Usa --frozen-lockfile para builds reproducibles
# - Limpia cache después de instalar
# - Este stage se cachea eficientemente (solo se re-ejecuta si lockfile cambia)
# ----------------------------------------------------------------------------
FROM base AS deps

WORKDIR /app

# Copiar archivos de paquetes del stage anterior
COPY --from=base /app/package.json /app/yarn.lock* /app/package-lock.json* /app/pnpm-lock.yaml* ./

# Instalar dependencias basado en el package manager detectado
# - production: Solo instala dependencies (no devDependencies)
# - frozen-lockfile: Falla si lockfile está desactualizado (builds reproducibles)
# - Limpia cache después de instalar para reducir tamaño
RUN \
  if [ -f yarn.lock ]; then \
    echo "📦 Installing dependencies with yarn..."; \
    yarn install --production --frozen-lockfile && yarn cache clean; \
  elif [ -f package-lock.json ]; then \
    echo "📦 Installing dependencies with npm..."; \
    npm ci --only=production && npm cache clean --force; \
  elif [ -f pnpm-lock.yaml ]; then \
    echo "📦 Installing dependencies with pnpm..."; \
    pnpm install --prod --frozen-lockfile && pnpm store prune; \
  else \
    echo "⚠️ No lockfile found, using yarn..."; \
    yarn install --production --frozen-lockfile && yarn cache clean; \
  fi

# ----------------------------------------------------------------------------
# Stage 2: builder - Build de la aplicación Next.js
# ----------------------------------------------------------------------------
# Construye la aplicación Next.js en modo producción
# - Instala TODAS las dependencias (incluyendo devDependencies para build)
# - Ejecuta next build (genera .next/ folder)
# - Standalone mode copia dependencias necesarias a .next/standalone/
# - Sharp se instala automáticamente si está en package.json
# ----------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

# Copiar node_modules de producción del stage anterior
# Esto acelera la instalación de devDependencies
COPY --from=deps /app/node_modules ./node_modules

# Copiar archivos de paquetes
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Instalar TODAS las dependencias (incluyendo devDependencies)
# devDependencies son necesarias para el build (TypeScript, ESLint, etc.)
RUN \
  if [ -f yarn.lock ]; then \
    echo "📦 Installing all dependencies (including dev) with yarn..."; \
    yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    echo "📦 Installing all dependencies (including dev) with npm..."; \
    npm ci; \
  elif [ -f pnpm-lock.yaml ]; then \
    echo "📦 Installing all dependencies (including dev) with pnpm..."; \
    pnpm install --frozen-lockfile; \
  else \
    echo "⚠️ No lockfile found, using yarn..."; \
    yarn install --frozen-lockfile; \
  fi

# Copiar código fuente de la aplicación
# IMPORTANTE: .dockerignore excluye .next/, node_modules/, .git/, etc.
COPY . .

# ============================================================================
# AMPLIFY V6 GEN 2 CONFIGURATION (CRÍTICO)
# ============================================================================
# Amplify Gen 2 usa outputs.json para configuración (NO variables de entorno)
# - outputs.json se genera con: npx ampx generate outputs --out-dir amplify
# - Contiene: user_pool_id, client_id, identity_pool_id, appsync_url, etc.
# - MUST be copied explicitly (no está en package.json ni en public/)
#
# PATRÓN INCORRECTO (NO USAR):
# ARG NEXT_PUBLIC_USER_POOL_ID
# ENV NEXT_PUBLIC_USER_POOL_ID=$NEXT_PUBLIC_USER_POOL_ID
#
# PATRÓN CORRECTO (Gen 2):
# COPY amplify/outputs.json amplify/
# ============================================================================

# Verificar que amplify/outputs.json existe (requerido para build)
# Si no existe, el build fallará con mensaje claro
RUN \
  if [ ! -f "amplify/outputs.json" ]; then \
    echo "❌ ERROR: amplify/outputs.json not found!"; \
    echo "Run: npx ampx generate outputs --out-dir amplify"; \
    exit 1; \
  else \
    echo "✅ amplify/outputs.json found"; \
  fi

# ============================================================================
# DEEP LINKING FILES (CRÍTICO para SEO y mobile app integration)
# ============================================================================
# - assetlinks.json: Android App Links verification
# - apple-app-site-association: iOS Universal Links
# - next.config.mjs configura headers especiales para estos archivos
# - MUST be copied explicitly a public/ antes del build
# ============================================================================

# Verificar que deep linking files existen
RUN \
  if [ -f "public/.well-known/assetlinks.json" ]; then \
    echo "✅ Android App Links file found"; \
  else \
    echo "⚠️ WARNING: public/.well-known/assetlinks.json not found"; \
  fi && \
  if [ -f "public/.well-known/apple-app-site-association" ]; then \
    echo "✅ iOS Universal Links file found"; \
  else \
    echo "⚠️ WARNING: public/.well-known/apple-app-site-association not found"; \
  fi

# ============================================================================
# NEXT.JS BUILD
# ============================================================================
# Ejecuta: next build --webpack
# - --webpack: Requerido para custom loader de .graphql files
# - Genera: .next/standalone/ (servidor self-contained)
# - Genera: .next/static/ (assets estáticos)
# - Sharp se compila automáticamente si está en dependencies
#
# OUTPUT MODE: standalone (next.config.mjs: output: 'standalone')
# - Copia dependencias necesarias a .next/standalone/node_modules/
# - Crea server.js auto-contenido
# - Reduce tamaño de imagen (no necesita copiar todo node_modules/)
# ============================================================================

# Deshabilitar telemetría durante build
ENV NEXT_TELEMETRY_DISABLED=1

# Build de Next.js
RUN \
  if [ -f yarn.lock ]; then \
    echo "🔨 Building with yarn build..."; \
    yarn build; \
  elif [ -f package-lock.json ]; then \
    echo "🔨 Building with npm run build..."; \
    npm run build; \
  elif [ -f pnpm-lock.yaml ]; then \
    echo "🔨 Building with pnpm build..."; \
    pnpm build; \
  else \
    echo "🔨 Building with yarn build (default)..."; \
    yarn build; \
  fi

# ============================================================================
# BUILD VERIFICATION (Fail Fast)
# ============================================================================
# Verifica que el build fue exitoso:
# - .next/standalone/ existe (output mode standalone)
# - .next/static/ existe (assets estáticos)
# Si no existen, el build falló silenciosamente
# ============================================================================

RUN \
  if [ ! -d ".next/standalone" ]; then \
    echo "❌ ERROR: .next/standalone/ not found!"; \
    echo "Check: next.config.mjs has 'output: standalone'"; \
    exit 1; \
  else \
    echo "✅ .next/standalone/ created successfully"; \
  fi && \
  if [ ! -d ".next/static" ]; then \
    echo "❌ ERROR: .next/static/ not found!"; \
    echo "Build may have failed"; \
    exit 1; \
  else \
    echo "✅ .next/static/ created successfully"; \
  fi

# ----------------------------------------------------------------------------
# Stage 3: runner - Imagen de producción final
# ----------------------------------------------------------------------------
# Imagen mínima de producción con solo lo necesario para ejecutar
# - Copia .next/standalone/ (contiene server.js + dependencias)
# - Copia .next/static/ (assets estáticos)
# - Copia public/ (archivos estáticos)
# - Usuario no-root para seguridad
# - Variables de entorno de producción
# - FFmpeg para transcoding de video (WebM export)
# ----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Configuración de entorno
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ============================================================================
# FFMPEG INSTALLATION (Para transcoding de video)
# ============================================================================
# FFmpeg es requerido para el endpoint /api/transcode-video
# - Convierte MP4 (CE.SDK nativo) a WebM/MKV
# - Codecs: VP9+Opus (WebM), H.264+AAC (MKV)
# - Alpine incluye FFmpeg en repositorio principal
#
# NOTA: Esto añade ~70-80MB al tamaño de la imagen
# Si no necesitas transcoding de video, puedes comentar esta línea
# ============================================================================
RUN apk add --no-cache ffmpeg && \
    echo "✅ FFmpeg installed:" && \
    ffmpeg -version | head -1

# ============================================================================
# SHARP INSTALLATION (CRÍTICO para producción)
# ============================================================================
# Sharp es la librería de optimización de imágenes de Next.js
# - MUST ser instalado en producción para Image Optimization API
# - Debe compilarse para Alpine Linux (arquitectura específica)
# - Si no está instalado, next/image fallará en producción
#
# IMPORTANTE: Sharp debe estar en package.json dependencies
# - El builder stage ya lo compiló
# - El runner stage lo copia del standalone
#
# ALTERNATIVA (si sharp no se copia automáticamente):
# RUN apk add --no-cache libc6-compat
# RUN yarn add sharp
# ============================================================================

# Crear usuario no-root para seguridad
# - nodejs: grupo del sistema (gid 1001)
# - nextjs: usuario del sistema (uid 1001)
# - Seguir principio de least privilege
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ============================================================================
# COPY STRATEGY (Order matters for caching)
# ============================================================================
# 1. public/ - Static assets (images, fonts, etc.)
# 2. amplify/ - Amplify Gen 2 outputs.json (auth config)
# 3. .next/standalone/ - Self-contained server + minimal node_modules
# 4. .next/static/ - Next.js optimized static assets
#
# IMPORTANTE: .next/standalone/ ya incluye:
# - server.js (servidor Node.js)
# - node_modules/ mínimos (solo producción)
# - package.json
# - next.config.mjs
# ============================================================================

# Copiar archivos estáticos públicos
# - Includes: images, fonts, robots.txt, sitemap.xml
# - Includes: .well-known/ (deep linking files)
COPY --from=builder /app/public ./public

# ============================================================================
# AMPLIFY OUTPUTS (CRÍTICO)
# ============================================================================
# Copiar amplify/outputs.json para runtime authentication
# - Usado por: src/app/amplify-config-ssr.ts
# - Contiene: Cognito User Pool, Identity Pool, AppSync endpoint
# - MUST be in runtime image (no solo build-time)
# ============================================================================
COPY --from=builder /app/amplify ./amplify

# Copiar output standalone de Next.js
# - Contiene: server.js, node_modules/, package.json
# - Este es el servidor self-contained
# - Cambiar ownership a nextjs:nodejs (usuario no-root)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# ============================================================================
# STATIC ASSETS (CRÍTICO)
# ============================================================================
# .next/static/ contiene:
# - JavaScript bundles optimizados (code splitting)
# - CSS optimizados y minificados
# - Image optimization metadata
# - Font optimization metadata
#
# IMPORTANTE: .next/standalone/ NO incluye .next/static/
# - Debe copiarse manualmente
# - server.js sirve estos archivos desde .next/static/
# ============================================================================
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root (seguridad)
# - A partir de aquí, el contenedor corre como nextjs (uid 1001)
# - No puede escribir en filesystem (read-only)
# - Reduce superficie de ataque
USER nextjs

# Exponer puerto 3000
# - Next.js server escucha en este puerto por defecto
# - ECS/ALB hace port mapping a 80/443
EXPOSE 3000

# Variables de entorno para el servidor
# - PORT: Puerto donde Next.js escucha
# - HOSTNAME: 0.0.0.0 permite conexiones externas (no solo localhost)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ============================================================================
# HEALTHCHECK (Opcional pero recomendado)
# ============================================================================
# Permite a Docker/ECS verificar que el contenedor está healthy
# - Intervalo: cada 30 segundos
# - Timeout: 3 segundos por check
# - Start period: 40 segundos (tiempo de warm-up)
# - Retries: 3 intentos fallidos antes de marcar como unhealthy
#
# DESCOMENTARIF QUIERES HABILITAR HEALTHCHECK:
# HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
# ============================================================================

# ============================================================================
# STARTUP COMMAND
# ============================================================================
# Ejecuta: node server.js
# - server.js es generado por next build (standalone mode)
# - Auto-contenido: incluye servidor HTTP + routing + SSR
# - Sirve:
#   - API routes (/api/*)
#   - Server-side rendered pages
#   - Static assets (public/, .next/static/)
#   - Image Optimization API (next/image)
# ============================================================================
CMD ["node", "server.js"]

# ============================================================================
# NOTAS DE DEPLOYMENT
# ============================================================================
# Build local (testing):
#   docker build -t yaan-web:latest .
#
# Run local:
#   docker run -p 3000:3000 yaan-web:latest
#
# Verify image size:
#   docker images yaan-web:latest
#   Expected: ~370-480MB (vs 2.83GB with Dockerfile.dev)
#   (~300-400MB base + ~70-80MB FFmpeg)
#
# AWS Copilot deployment:
#   ./deploy-safe.sh
#   (Uses this Dockerfile, not Dockerfile.dev)
#
# IMPORTANTE: Si la imagen excede 500MB, verificar:
#   1. Sharp compiló correctamente para Alpine
#   2. .dockerignore excluye .next/, node_modules/, .git/
#   3. Standalone mode está activado (next.config.mjs)
#   4. Solo dependencies de producción en deps stage
# ============================================================================
