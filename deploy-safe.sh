#!/bin/bash

# Script de deploy seguro que mantiene la configuración de www.yaan.com.mx
# Uso: ./deploy-safe.sh

set -e

echo "🚀 Iniciando deploy seguro..."

# Colores
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables de configuración
SERVICE_NAME="nextjs-dev"
ENV_NAME="dev"
APP_NAME="yaan-dev"
LOG_GROUP="/copilot/${APP_NAME}-${ENV_NAME}-${SERVICE_NAME}"
AWS_REGION="us-west-2"

# Función para verificar y crear CloudWatch Log Groups
check_and_create_log_groups() {
    echo -e "${BLUE}📊 Verificando CloudWatch Log Groups...${NC}"

    # Verificar si el log group existe
    if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region "$AWS_REGION" --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "$LOG_GROUP"; then
        echo -e "${GREEN}✓ Log group existe: $LOG_GROUP${NC}"
    else
        echo -e "${YELLOW}⚠️  Log group no encontrado. Creando: $LOG_GROUP${NC}"

        # Crear el log group
        if aws logs create-log-group --log-group-name "$LOG_GROUP" --region "$AWS_REGION" 2>/dev/null; then
            echo -e "${GREEN}✓ Log group creado exitosamente${NC}"

            # Configurar retención (7 días)
            aws logs put-retention-policy \
                --log-group-name "$LOG_GROUP" \
                --retention-in-days 7 \
                --region "$AWS_REGION" 2>/dev/null || true

            echo -e "${GREEN}✓ Retención configurada a 7 días${NC}"
        else
            echo -e "${RED}❌ Error creando log group (puede que ya exista)${NC}"
        fi
    fi

    # Verificar log groups adicionales que Copilot podría necesitar
    local COPILOT_LOG_GROUPS=(
        "/aws/ecs/containerinsights/${APP_NAME}-${ENV_NAME}-Cluster/performance"
        "/ecs/${APP_NAME}-${ENV_NAME}/${SERVICE_NAME}"
    )

    for LOG_GROUP_NAME in "${COPILOT_LOG_GROUPS[@]}"; do
        if ! aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP_NAME" --region "$AWS_REGION" --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "$LOG_GROUP_NAME"; then
            echo -e "${YELLOW}⚠️  Creando log group adicional: $LOG_GROUP_NAME${NC}"
            aws logs create-log-group --log-group-name "$LOG_GROUP_NAME" --region "$AWS_REGION" 2>/dev/null || true
        fi
    done

    echo -e "${GREEN}✓ Verificación de log groups completada${NC}"
    echo ""
}

# 0. Verificar y crear CloudWatch Log Groups
check_and_create_log_groups

# 1. Deploy con Copilot
echo -e "${BLUE}Ejecutando Copilot deploy...${NC}"
~/bin/copilot svc deploy --name "$SERVICE_NAME" --env "$ENV_NAME"

# 2. Esperar a que el servicio esté saludable
echo -e "${YELLOW}Esperando a que el servicio esté saludable...${NC}"
sleep 10

# 3. Verificar estado del servicio
echo -e "${BLUE}Verificando estado del servicio...${NC}"
~/bin/copilot svc status --name "$SERVICE_NAME" --env "$ENV_NAME"

# 4. Verificar que los logs están funcionando
echo -e "${BLUE}Verificando logs del servicio...${NC}"
if ~/bin/copilot svc logs --name "$SERVICE_NAME" --env "$ENV_NAME" --limit 5 2>/dev/null; then
    echo -e "${GREEN}✓ Logs funcionando correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  Los logs podrían tardar un momento en aparecer${NC}"
fi

# 5. Aplicar correcciones post-deploy (si existe el script)
if [ -f "./scripts/post-deploy-fix.sh" ]; then
    echo -e "${BLUE}Aplicando correcciones de configuración...${NC}"
    ./scripts/post-deploy-fix.sh
fi

# 6. Mostrar información del despliegue
echo ""
echo -e "${GREEN}✅ Deploy completado exitosamente${NC}"
echo ""
echo -e "${BLUE}Información del despliegue:${NC}"
echo "  • Servicio: $SERVICE_NAME"
echo "  • Ambiente: $ENV_NAME"
echo "  • Región: $AWS_REGION"
echo "  • Log Group: $LOG_GROUP"
echo ""
echo -e "${BLUE}URLs disponibles:${NC}"
echo "  • https://yaan.com.mx"
echo "  • https://www.yaan.com.mx"
echo ""
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "  • Ver logs: ~/bin/copilot svc logs --name $SERVICE_NAME --env $ENV_NAME --follow"
echo "  • Estado: ~/bin/copilot svc status --name $SERVICE_NAME --env $ENV_NAME"
echo "  • Rollback: ~/bin/copilot svc deploy --name $SERVICE_NAME --env $ENV_NAME --rollback"