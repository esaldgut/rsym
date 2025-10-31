#!/bin/bash
set -e

# Script para configurar secretos en AWS Secrets Manager para Copilot
# Este script crea los secretos necesarios para el despliegue en AWS ECS

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuración de Secretos AWS para Copilot ===${NC}"
echo ""

# Configuración
APP_NAME="yaan-dev"
ENV_NAME="dev"
REGION="us-west-2"

# Verificar que AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI no está instalado${NC}"
    echo "Instala AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Verificar que estamos autenticados
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: No estás autenticado en AWS${NC}"
    echo "Ejecuta: aws configure"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI configurado correctamente${NC}"
echo ""

# Leer valores de .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${RED}Error: No se encuentra .env.local${NC}"
    echo "Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

echo -e "${YELLOW}Leyendo valores de .env.local...${NC}"

# Extraer valores (manejo seguro de variables vacías)
URL_SECRET=$(grep "^URL_ENCRYPTION_SECRET=" .env.local | cut -d '=' -f2- | tr -d '\r')
MIT_WEBHOOK=$(grep "^MIT_WEBHOOK_SECRET=" .env.local | cut -d '=' -f2- | tr -d '\r')
MIT_API=$(grep "^MIT_API_KEY=" .env.local | cut -d '=' -f2- | tr -d '\r')

# Validar que las variables existen
if [ -z "$URL_SECRET" ]; then
    echo -e "${RED}Error: URL_ENCRYPTION_SECRET no encontrado en .env.local${NC}"
    exit 1
fi

if [ -z "$MIT_WEBHOOK" ]; then
    echo -e "${RED}Error: MIT_WEBHOOK_SECRET no encontrado en .env.local${NC}"
    exit 1
fi

if [ -z "$MIT_API" ]; then
    echo -e "${RED}Error: MIT_API_KEY no encontrado en .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Variables encontradas en .env.local${NC}"
echo ""

# Función para crear o actualizar secreto
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3

    echo -e "${YELLOW}Procesando: $secret_name${NC}"

    # Verificar si el secreto ya existe
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$REGION" &> /dev/null; then
        echo "  - Secreto existe, actualizando valor..."
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "$secret_value" \
            --region "$REGION" > /dev/null
        echo -e "  ${GREEN}✓ Secreto actualizado${NC}"
    else
        echo "  - Creando nuevo secreto..."
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "$description" \
            --secret-string "$secret_value" \
            --region "$REGION" > /dev/null
        echo -e "  ${GREEN}✓ Secreto creado${NC}"
    fi
}

# Crear/actualizar secretos
echo -e "${YELLOW}=== Creando Secretos en AWS Secrets Manager ===${NC}"
echo ""

create_or_update_secret \
    "/copilot/${APP_NAME}/${ENV_NAME}/secrets/URL_ENCRYPTION_SECRET" \
    "$URL_SECRET" \
    "Secret para cifrado AES-256-GCM de URLs de booking"

create_or_update_secret \
    "/copilot/${APP_NAME}/${ENV_NAME}/secrets/MIT_WEBHOOK_SECRET" \
    "$MIT_WEBHOOK" \
    "Secret para verificar HMAC SHA-256 de webhooks MIT"

create_or_update_secret \
    "/copilot/${APP_NAME}/${ENV_NAME}/secrets/MIT_API_KEY" \
    "$MIT_API" \
    "API Key para MIT Payment Gateway"

echo ""
echo -e "${GREEN}=== ✓ Todos los secretos configurados correctamente ===${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Verifica que copilot/nextjs-dev/manifest.yml tiene la sección 'secrets'"
echo "2. Ejecuta: ./deploy-safe.sh"
echo "3. Los secretos estarán disponibles como variables de entorno en ECS"
echo ""
echo -e "${YELLOW}Verificar secretos creados:${NC}"
echo "aws secretsmanager list-secrets --region $REGION --query 'SecretList[?contains(Name, \`/copilot/${APP_NAME}/${ENV_NAME}/\`)].Name'"
echo ""
