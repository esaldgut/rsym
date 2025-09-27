#!/bin/bash

echo "🏗️  INICIALIZANDO APLICACIÓN COPILOT"
echo "=================================="

APP_NAME="yaan-dev"
DOMAIN="yaan.com.mx"

# 1. Inicializar aplicación Copilot
echo "📱 Creando aplicación Copilot..."
copilot app init $APP_NAME --domain $DOMAIN

# 2. Verificar aplicación creada
echo "✅ Aplicación creada:"
copilot app ls

# 3. Mostrar estructura generada
echo "📁 Estructura generada:"
tree copilot/ 2>/dev/null || find copilot/ -type f

echo ""
echo "✅ Aplicación Copilot inicializada"
echo "📂 Directorio: ./copilot/"
echo "🌐 Dominio configurado: $DOMAIN"
