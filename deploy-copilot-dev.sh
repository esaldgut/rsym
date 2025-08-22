#!/bin/bash

# Script de emergencia - Copilot con modo desarrollo
# Usar SOLO si Amplify Hosting muestra pérdida de funcionalidad

set -e

echo "🚨 MODO EMERGENCIA - Desplegando con yarn dev"
echo "⚠️  Esto NO es para producción, solo para validación"

# Colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  ADVERTENCIA: Este modo es más costoso y menos seguro${NC}"
echo -e "${YELLOW}Usar solo para identificar problemas de funcionalidad${NC}"
echo ""

# Modificar el manifiesto de Copilot para dev mode
setup_dev_service() {
    echo "🔧 Configurando servicio en modo desarrollo..."
    
    mkdir -p copilot/services/nextjs-dev
    
    cat > copilot/services/nextjs-dev/manifest.yml << 'EOF'
name: nextjs-dev
type: Load Balanced Web Service

# Más recursos para modo dev
cpu: 2048       # 2 vCPU
memory: 4096    # 4 GB

platform: linux/x86_64

# Usar Dockerfile de desarrollo
build:
  dockerfile: ./Dockerfile.dev
  context: .

# Health check ajustado para dev
http:
  path: '/'
  healthcheck:
    path: '/'
    interval: 60s
    timeout: 30s
    retries: 5
    healthy_threshold: 1
    unhealthy_threshold: 3
    start_period: 120s

# Solo 1 instancia para dev
count: 1

# Variables de entorno desde .env.local
environments:
  test:
    variables:
      NODE_ENV: development
      PORT: 3000
      NEXT_PUBLIC_AWS_REGION: us-east-1

# Montar volumen para hot-reload (opcional)
storage:
  ephemeral:
    size: 20

# Logs detallados
logging:
  level: debug
  retention: 7
EOF
    
    echo -e "${GREEN}✅ Servicio dev configurado${NC}"
}

# Copiar variables de entorno
copy_env_vars() {
    echo "📋 Copiando variables de entorno..."
    
    if [ -f .env.local ]; then
        # Crear script para cargar variables
        cat > load-env.sh << 'EOF'
#!/bin/bash
# Cargar variables de .env.local a Copilot
while IFS='=' read -r key value; do
  if [[ ! -z "$key" && ! "$key" =~ ^# ]]; then
    copilot secret init --name "$key" --overwrite <<< "$value"
  fi
done < .env.local
EOF
        chmod +x load-env.sh
        ./load-env.sh
        rm load-env.sh
    else
        echo -e "${RED}❌ No se encontró .env.local${NC}"
    fi
}

# Desplegar en modo dev
deploy_dev() {
    echo "🚀 Desplegando en modo desarrollo..."
    
    # Inicializar app si no existe
    copilot app init yaan-dev || echo "App ya existe"
    
    # Crear ambiente
    copilot env init --name dev || echo "Ambiente ya existe"
    copilot env deploy --name dev
    
    # Desplegar servicio
    copilot svc deploy --name nextjs-dev --env dev
    
    # Obtener URL
    DEV_URL=$(copilot svc show --name nextjs-dev --json | jq -r '.routes[0].url')
    
    echo ""
    echo "======================================"
    echo -e "${GREEN}✅ Despliegue en modo dev completado${NC}"
    echo "======================================"
    echo -e "🔗 URL de desarrollo: ${YELLOW}${DEV_URL}${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "1. Esta URL ejecuta 'yarn dev' - NO es para producción"
    echo "2. Los cambios locales NO se reflejan (no hay hot-reload remoto)"
    echo "3. Para ver logs: copilot svc logs --name nextjs-dev --env dev --follow"
    echo "4. Para eliminar: copilot app delete --name yaan-dev"
    echo ""
    echo "📝 Documenta cualquier funcionalidad perdida para revertir cambios específicos"
}

# Función de rollback
suggest_rollback() {
    echo ""
    echo "🔄 Si encuentras funcionalidad perdida, considera:"
    echo "1. Revertir cambios específicos del linter"
    echo "2. Usar 'git diff HEAD~10' para ver todos los cambios"
    echo "3. Restaurar tipos originales en lugar de 'as any'"
    echo "4. Probar con 'npm run dev' localmente primero"
}

# Main
main() {
    echo "======================================"
    echo "   🚨 PLAN B: Copilot Dev Mode"
    echo "======================================"
    
    read -p "¿Confirmas que Amplify Hosting mostró pérdida de funcionalidad? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelado. Usa Amplify Hosting primero."
        exit 1
    fi
    
    setup_dev_service
    copy_env_vars
    deploy_dev
    suggest_rollback
}

main "$@"