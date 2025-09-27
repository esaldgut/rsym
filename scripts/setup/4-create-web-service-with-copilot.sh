#!/bin/bash

echo "🌐 CREANDO SERVICIO WEB CON COPILOT (MODO DESARROLLO)"
echo "================================================="

SERVICE_NAME="nextjs-dev"
APP_NAME="yaan-dev"

# 1. Crear servicio web
echo "🏗️  Creando servicio web..."
copilot svc init --name $SERVICE_NAME --svc-type "Load Balanced Web Service"

# 2. Configurar el servicio para DESARROLLO con yarn dev
echo "⚙️  Configurando servicio para desarrollo con yarn dev..."

# Crear archivo de configuración del servicio OPTIMIZADO PARA DESARROLLO
cat > copilot/$SERVICE_NAME/copilot.yml << 'EOF'
name: nextjs-dev
type: Load Balanced Web Service

http:
  healthcheck: '/'
  alias: 'yaan.com.mx'
  additional_aliases:
    - 'www.yaan.com.mx'

image:
  build: './Dockerfile.dev'

variables:
  NODE_ENV: development
  PORT: 3000
  AWS_REGION: us-west-2
  NEXT_TELEMETRY_DISABLED: 1
  HOSTNAME: "0.0.0.0"

count:
  min: 1
  max: 3
  cooldown:
    scale_in_cooldown: 180s
    scale_out_cooldown: 60s
  target_cpu: 80
  target_memory: 85

network:
  vpc:
    enable_logs: true
    placement: 'public'

exec: true
logging:
  enable_metadata: true

# Configuración específica para desarrollo
develop:
  variables:
    LOG_LEVEL: debug
    HOT_RELOAD: true
EOF

echo "✅ Servicio web configurado para desarrollo con yarn dev"

# 3. Verificar que Dockerfile.dev existe y es correcto
if [ ! -f Dockerfile.dev ]; then
    echo "⚠️  Dockerfile.dev no encontrado, creando uno optimizado para desarrollo..."
    cat > Dockerfile.dev << 'EOF'
# Dockerfile para modo desarrollo con yarn dev
FROM node:20-alpine

RUN apk add --no-cache libc6-compat git

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Instalar dependencias (incluye devDependencies para desarrollo)
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "No lockfile found." && exit 1; \
  fi

# Copiar todo el código fuente
COPY . .

# Variables de entorno para desarrollo
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Exponer puerto
EXPOSE 3000

# Comando para modo desarrollo con hot-reload
CMD ["yarn", "dev"]
EOF
    echo "✅ Dockerfile.dev creado para desarrollo"
else
    echo "✅ Dockerfile.dev ya existe"
fi

echo ""
echo "🌐 SERVICIO WEB CONFIGURADO"
echo "Nombre: $SERVICE_NAME"
echo "Tipo: Load Balanced Web Service"
echo "Dominios: yaan.com.mx, www.yaan.com.mx"
