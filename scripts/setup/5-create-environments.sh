#!/bin/bash

echo "🌍 CREANDO ENTORNOS COPILOT"
echo "=========================="

APP_NAME="yaan-dev"

# 1. Crear entorno de desarrollo
echo "🔧 Creando entorno de desarrollo..."
copilot env init --name dev --region us-west-2

# 2. Configurar entorno de desarrollo OPTIMIZADO PARA yarn dev
echo "⚙️  Configurando entorno de desarrollo..."

cat > copilot/environments/dev/copilot.yml << 'EOF'
name: dev
type: Environment

network:
  vpc:
    enable_logs: true
    placement: 'public'
  cdn:
    certificate_arn: ${COPILOT_APPLICATION_NAME}.certificates.yaan-ssl-cert

import:
  vpc_id: ${COPILOT_APPLICATION_NAME}.vpc.id
  private_subnet_ids: ${COPILOT_APPLICATION_NAME}.vpc.private_subnet_ids
  public_subnet_ids: ${COPILOT_APPLICATION_NAME}.vpc.public_subnet_ids

variables:
  LOG_LEVEL: debug
  ENVIRONMENT: development
  NODE_ENV: development
  NEXT_TELEMETRY_DISABLED: 1

count:
  min: 1
  max: 3

# Configuración específica para desarrollo con yarn dev
develop:
  variables:
    HOT_RELOAD: true
    WATCH_MODE: true
EOF


echo "✅ Entorno configurado"
echo "└── dev (us-west-2)"
