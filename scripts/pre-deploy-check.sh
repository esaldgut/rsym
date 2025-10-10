#!/bin/bash

# Script de verificación pre-deploy
# Verifica que todos los recursos necesarios estén configurados antes del deploy

set -e

# Colores
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
SERVICE_NAME="nextjs-dev"
ENV_NAME="dev"
APP_NAME="yaan-dev"
AWS_REGION="us-west-2"

echo -e "${BLUE}🔍 Ejecutando verificación pre-deploy...${NC}"
echo ""

# Contador de errores
ERRORS=0
WARNINGS=0

# 1. Verificar AWS CLI
echo -e "${BLUE}1. Verificando AWS CLI...${NC}"
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1 | cut -d' ' -f1 | cut -d'/' -f2)
    echo -e "${GREEN}✓ AWS CLI instalado (versión: $AWS_VERSION)${NC}"
else
    echo -e "${RED}✗ AWS CLI no está instalado${NC}"
    ((ERRORS++))
fi

# 2. Verificar credenciales AWS
echo -e "${BLUE}2. Verificando credenciales AWS...${NC}"
if aws sts get-caller-identity --region "$AWS_REGION" &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
    echo -e "${GREEN}✓ Credenciales válidas (Cuenta: $ACCOUNT_ID)${NC}"
else
    echo -e "${RED}✗ Credenciales AWS no configuradas o inválidas${NC}"
    ((ERRORS++))
fi

# 3. Verificar Copilot CLI
echo -e "${BLUE}3. Verificando Copilot CLI...${NC}"
if [ -f ~/bin/copilot ]; then
    COPILOT_VERSION=$(~/bin/copilot --version 2>&1 | head -1)
    echo -e "${GREEN}✓ Copilot CLI instalado${NC}"
else
    echo -e "${RED}✗ Copilot CLI no encontrado en ~/bin/copilot${NC}"
    ((ERRORS++))
fi

# 4. Verificar aplicación Copilot
echo -e "${BLUE}4. Verificando aplicación Copilot...${NC}"
if ~/bin/copilot app show --name "$APP_NAME" &> /dev/null; then
    echo -e "${GREEN}✓ Aplicación '$APP_NAME' existe${NC}"
else
    echo -e "${RED}✗ Aplicación '$APP_NAME' no encontrada${NC}"
    ((ERRORS++))
fi

# 5. Verificar ambiente
echo -e "${BLUE}5. Verificando ambiente...${NC}"
if ~/bin/copilot env show --name "$ENV_NAME" --app "$APP_NAME" &> /dev/null; then
    echo -e "${GREEN}✓ Ambiente '$ENV_NAME' existe${NC}"
else
    echo -e "${RED}✗ Ambiente '$ENV_NAME' no encontrado${NC}"
    ((ERRORS++))
fi

# 6. Verificar servicio
echo -e "${BLUE}6. Verificando servicio...${NC}"
if ~/bin/copilot svc show --name "$SERVICE_NAME" --app "$APP_NAME" &> /dev/null; then
    echo -e "${GREEN}✓ Servicio '$SERVICE_NAME' existe${NC}"
else
    echo -e "${YELLOW}⚠ Servicio '$SERVICE_NAME' no existe (se creará en el deploy)${NC}"
    ((WARNINGS++))
fi

# 7. Verificar CloudWatch Log Groups
echo -e "${BLUE}7. Verificando CloudWatch Log Groups...${NC}"
LOG_GROUP="/copilot/${APP_NAME}-${ENV_NAME}-${SERVICE_NAME}"
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region "$AWS_REGION" 2>/dev/null | grep -q "$LOG_GROUP"; then
    echo -e "${GREEN}✓ Log group principal existe${NC}"
else
    echo -e "${YELLOW}⚠ Log group principal no existe (se creará automáticamente)${NC}"
    ((WARNINGS++))
fi

# 8. Verificar Docker
echo -e "${BLUE}8. Verificando Docker...${NC}"
if docker info &> /dev/null; then
    echo -e "${GREEN}✓ Docker está funcionando${NC}"
else
    echo -e "${RED}✗ Docker no está funcionando o no está instalado${NC}"
    ((ERRORS++))
fi

# 9. Verificar archivo de configuración
echo -e "${BLUE}9. Verificando archivos de configuración...${NC}"
if [ -f "copilot/environments/dev/addons/parameters.yml" ]; then
    echo -e "${GREEN}✓ Archivo de parámetros existe${NC}"
else
    echo -e "${YELLOW}⚠ Archivo de parámetros no encontrado${NC}"
    ((WARNINGS++))
fi

# 10. Verificar build local
echo -e "${BLUE}10. Verificando build local...${NC}"
if [ -f ".next/BUILD_ID" ]; then
    BUILD_ID=$(cat .next/BUILD_ID)
    echo -e "${GREEN}✓ Build local existe (ID: $BUILD_ID)${NC}"
else
    echo -e "${YELLOW}⚠ No hay build local (se construirá durante el deploy)${NC}"
    ((WARNINGS++))
fi

# Resumen
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📊 RESUMEN DE VERIFICACIÓN${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ Todo listo para el deploy!${NC}"
    else
        echo -e "${YELLOW}⚠️  Deploy posible con $WARNINGS advertencias${NC}"
    fi
    echo ""
    echo -e "${BLUE}Puedes ejecutar el deploy con:${NC}"
    echo -e "  ${GREEN}./deploy-safe.sh${NC}"
    exit 0
else
    echo -e "${RED}❌ Se encontraron $ERRORS errores críticos${NC}"
    echo -e "${YELLOW}⚠️  Se encontraron $WARNINGS advertencias${NC}"
    echo ""
    echo -e "${RED}Por favor, corrige los errores antes de continuar${NC}"
    exit 1
fi