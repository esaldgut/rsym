#!/bin/bash

# Script de despliegue con AWS Copilot
# Para Next.js 15.3.4 con integración a Amplify Gen 2

set -e

echo "🚀 Iniciando despliegue con AWS Copilot..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar prerequisitos
check_prerequisites() {
    echo "📋 Verificando prerequisitos..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        echo "Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Verificar Copilot CLI
    if ! command -v copilot &> /dev/null; then
        echo -e "${YELLOW}⚠️  Copilot CLI no está instalado. Instalando...${NC}"
        brew install aws/tap/copilot-cli || {
            echo "Instalación manual requerida:"
            echo "curl -Lo copilot https://github.com/aws/copilot-cli/releases/latest/download/copilot-darwin"
            echo "chmod +x copilot && sudo mv copilot /usr/local/bin/copilot"
            exit 1
        }
    fi
    
    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI no está instalado${NC}"
        echo "Instala con: brew install awscli"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Todos los prerequisitos instalados${NC}"
}

# 2. Configurar aplicación
setup_application() {
    echo "🏗️ Configurando aplicación Copilot..."
    
    # Inicializar aplicación si no existe
    if [ ! -f "copilot/.workspace" ]; then
        copilot app init yaan-web
    fi
    
    # Crear ambiente de test
    copilot env init --name test || echo "Ambiente 'test' ya existe"
    
    # Desplegar ambiente
    copilot env deploy --name test
}

# 3. Configurar servicio
setup_service() {
    echo "🐳 Configurando servicio Next.js..."
    
    # Crear manifiesto del servicio
    cat > copilot/services/nextjs/manifest.yml << 'EOF'
name: nextjs
type: Load Balanced Web Service

# Configuración de CPU y memoria
cpu: 1024       # 1 vCPU
memory: 2048    # 2 GB

# Configuración de la plataforma
platform: linux/x86_64

# Build configuration
build:
  dockerfile: ./Dockerfile
  context: .
  args:
    NEXT_PUBLIC_AWS_REGION: ${COPILOT_AWS_REGION}
    NEXT_PUBLIC_USER_POOL_ID: ${NEXT_PUBLIC_USER_POOL_ID}
    NEXT_PUBLIC_USER_POOL_CLIENT_ID: ${NEXT_PUBLIC_USER_POOL_CLIENT_ID}
    NEXT_PUBLIC_IDENTITY_POOL_ID: ${NEXT_PUBLIC_IDENTITY_POOL_ID}
    NEXT_PUBLIC_BUCKET_NAME: ${NEXT_PUBLIC_BUCKET_NAME}

# Configuración del balanceador de carga
http:
  path: '/'
  healthcheck:
    path: '/api/health'
    interval: 30s
    timeout: 10s
    retries: 3
    healthy_threshold: 2
    unhealthy_threshold: 3

# Auto-scaling
count:
  min: 1
  max: 3
  cooldown: 60
  scale_in_cooldown: 180
  
cpu_percentage: 70
memory_percentage: 80

# Variables de entorno
environments:
  test:
    secrets:
      - name: DATABASE_URL
        from_cfn: ${COPILOT_APPLICATION_NAME}-test-DatabaseUrl
    variables:
      NODE_ENV: production
      PORT: 3000

# Logs
logging:
  retention: 30
  
# Configuración de red
network:
  vpc:
    enable_nat: true
EOF
    
    echo -e "${GREEN}✅ Servicio configurado${NC}"
}

# 4. Crear health check endpoint
create_health_check() {
    echo "🏥 Creando endpoint de health check..."
    
    mkdir -p src/app/api/health
    cat > src/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar conexión a base de datos si aplica
    // await checkDatabaseConnection();
    
    return NextResponse.json(
      { 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'yaan-nextjs',
        version: process.env.npm_package_version || '1.0.0'
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
EOF
    
    echo -e "${GREEN}✅ Health check creado${NC}"
}

# 5. Desplegar servicio
deploy_service() {
    echo "🚢 Desplegando servicio..."
    
    # Build y push de la imagen
    copilot svc deploy --name nextjs --env test
    
    # Obtener URL del servicio
    SERVICE_URL=$(copilot svc show --name nextjs --json | jq -r '.routes[0].url')
    
    echo -e "${GREEN}✅ Servicio desplegado exitosamente${NC}"
    echo -e "🔗 URL del servicio: ${YELLOW}${SERVICE_URL}${NC}"
}

# 6. Configurar monitoreo
setup_monitoring() {
    echo "📊 Configurando monitoreo..."
    
    cat > copilot/environments/test/addons/cloudwatch-dashboard.yml << 'EOF'
Parameters:
  App:
    Type: String
  Env:
    Type: String

Resources:
  Dashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub ${App}-${Env}-dashboard
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
                  [".", "MemoryUtilization", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "ECS Metrics"
              }
            }
          ]
        }
EOF
    
    echo -e "${GREEN}✅ Monitoreo configurado${NC}"
}

# 7. Función principal
main() {
    echo "======================================"
    echo "   AWS Copilot Deployment Script"
    echo "   Next.js 15.3.4 + Amplify Gen 2"
    echo "======================================"
    echo ""
    
    check_prerequisites
    setup_application
    create_health_check
    setup_service
    deploy_service
    setup_monitoring
    
    echo ""
    echo "======================================"
    echo -e "${GREEN}🎉 Despliegue completado con éxito!${NC}"
    echo "======================================"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Verifica el servicio en la URL proporcionada"
    echo "2. Revisa los logs: copilot svc logs --name nextjs --env test"
    echo "3. Monitorea métricas: copilot svc status --name nextjs --env test"
    echo "4. Para actualizar: copilot svc deploy --name nextjs --env test"
    echo ""
    echo "🗑️ Para limpiar recursos: copilot app delete"
}

# Ejecutar script
main "$@"