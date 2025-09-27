#!/bin/bash

echo "🚨 SOLUCIÓN DEFINITIVA - FORZAR DOMINIO"
echo "========================================"

APP_NAME="yaan-dev"
ENV_NAME="dev"
SERVICE_NAME="nextjs-dev"
DOMAIN="yaan.com.mx"
REGION="us-west-2"
CERT_ARN_EAST="arn:aws:acm:us-east-1:288761749126:certificate/f43843ed-80b0-4a47-a24b-168c698a691b"

echo "📋 Configuración:"
echo "├── App actual: $APP_NAME (sin dominio)"
echo "├── REQUERIMIENTO: yaan.com.mx + www.yaan.com.mx"
echo "└── Solución: Recrear app con dominio"
echo ""

echo "⚠️  AVISO IMPORTANTE:"
echo "Vamos a recrear la aplicación con el dominio asociado."
echo "Esto es necesario porque Copilot no permite agregar dominio después."
echo ""

read -p "¿Continuar? Esto eliminará la app actual y la recreará (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

# 1. Eliminar la aplicación actual
echo ""
echo "🗑️  Eliminando aplicación actual sin dominio..."
~/bin/copilot app delete $APP_NAME --yes

if [ $? -ne 0 ]; then
    echo "⚠️  Si la eliminación falla, puedes hacerlo manualmente:"
    echo "aws cloudformation delete-stack --stack-name $APP_NAME-infrastructure-roles --region $REGION"
    echo "aws cloudformation delete-stack --stack-name $APP_NAME-$ENV_NAME --region $REGION"
    echo ""
    read -p "¿La eliminación se completó o quieres continuar de todos modos? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. Recrear la aplicación CON DOMINIO
echo ""
echo "🏗️  Recreando aplicación CON dominio $DOMAIN..."
~/bin/copilot app init $APP_NAME --domain $DOMAIN

if [ $? -ne 0 ]; then
    echo "❌ Error creando aplicación con dominio"
    exit 1
fi

echo "✅ Aplicación creada con dominio"

# 3. Recrear el environment
echo ""
echo "🌍 Recreando environment $ENV_NAME..."
~/bin/copilot env init --name $ENV_NAME

# Configurar el environment
cat > copilot/environments/$ENV_NAME/manifest.yml << 'EOF'
name: dev
type: Environment
region: us-west-2

network:
  vpc:
    enable_nat: false

import:
  certificate_arns:
    - "arn:aws:acm:us-east-1:288761749126:certificate/f43843ed-80b0-4a47-a24b-168c698a691b"
EOF

echo "✅ Environment configurado con certificado importado"

# 4. Desplegar el environment
echo ""
echo "🚀 Desplegando environment..."
~/bin/copilot env deploy --name $ENV_NAME

if [ $? -ne 0 ]; then
    echo "❌ Error desplegando environment"
    exit 1
fi

echo "✅ Environment desplegado"

# 5. Recrear el servicio
echo ""
echo "🔧 Recreando servicio $SERVICE_NAME..."
~/bin/copilot svc init --name $SERVICE_NAME

# Asegurarse de que el manifest tiene el dominio configurado
cat > copilot/$SERVICE_NAME/manifest.yml << 'EOF'
name: nextjs-dev
type: Load Balanced Web Service

http:
  path: '/'
  healthcheck: '/'
  alias: 'yaan.com.mx'
  additional_aliases:
    - 'www.yaan.com.mx'

image:
  build: Dockerfile.dev
  port: 3000

cpu: 256
memory: 512
platform: linux/x86_64
count: 1
exec: true

network:
  connect: true

variables:
  NODE_ENV: development
  NEXT_TELEMETRY_DISABLED: 1
  PORT: 3000
  AWS_REGION: us-west-2
  HOSTNAME: "0.0.0.0"
EOF

echo "✅ Servicio configurado con dominios"

# 6. Desplegar el servicio
echo ""
echo "🚀 DESPLEGANDO SERVICIO CON DOMINIOS..."
~/bin/copilot svc deploy --name $SERVICE_NAME --env $ENV_NAME

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ¡ÉXITO TOTAL!"
    echo ""
    echo "✅ Aplicación recreada con dominio"
    echo "✅ Environment desplegado"
    echo "✅ Servicio corriendo con yarn dev"
    echo ""
    echo "🌐 Tu aplicación está disponible en:"
    echo "├── https://yaan.com.mx"
    echo "└── https://www.yaan.com.mx"
    echo ""
    echo "📊 Verificando DNS..."
    sleep 10

    dig yaan.com.mx +short
    dig www.yaan.com.mx +short

    echo ""
    echo "📋 Para ver logs:"
    echo "~/bin/copilot svc logs --name $SERVICE_NAME --env $ENV_NAME --follow"
else
    echo "❌ Error en el despliegue final"
    echo ""
    echo "🔧 Debug:"
    echo "~/bin/copilot app show"
    echo "~/bin/copilot env ls"
    echo "~/bin/copilot svc ls"
fi