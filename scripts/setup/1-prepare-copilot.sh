#!/bin/bash

echo "🚀 CONFIGURANDO AWS COPILOT PARA yaan.com.mx"
echo "==========================================="

# Variables
DOMAIN="yaan.com.mx"
SUBDOMAIN="www.yaan.com.mx"
APP_NAME="yaan-dev"
REGION="us-west-2"
HOSTED_ZONE_ID="Z01441381BYM7F3YGIDHZ"

# 1. Verificar instalación de Copilot
if ! command -v copilot &> /dev/null; then
    echo "📦 Instalando AWS Copilot..."
    curl -Lo copilot https://github.com/aws/copilot-cli/releases/latest/download/copilot-linux
    chmod +x copilot && sudo mv copilot /usr/local/bin
    echo "✅ Copilot instalado"
else
    echo "✅ Copilot ya está instalado"
fi

# 2. Verificar configuración AWS
echo "🔍 Verificando configuración AWS..."
aws sts get-caller-identity
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ Account ID: $ACCOUNT_ID"

# 3. Verificar dominio en Route 53
echo "🌐 Verificando dominio en Route 53..."
aws route53 get-hosted-zone --id $HOSTED_ZONE_ID --query 'HostedZone.Name' --output text
echo "✅ Dominio verificado: $DOMAIN"

echo ""
echo "🎯 CONFIGURACIÓN LISTA PARA COPILOT"
echo "Dominio principal: $DOMAIN"
echo "Subdominio: $SUBDOMAIN"
echo "Hosted Zone ID: $HOSTED_ZONE_ID"
echo "Región: $REGION"
