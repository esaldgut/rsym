#!/bin/bash

echo "⚡ FORZANDO BUILD LIMPIO SIN CACHÉ"
echo "================================="

SERVICE_NAME="nextjs-dev"
ENV_NAME="dev"

echo "🧹 Limpiando caché de Docker..."
docker system prune -f
docker builder prune -f

echo ""
echo "📊 Verificando tamaño actual de node_modules local:"
du -sh node_modules 2>/dev/null || echo "No node_modules local (perfecto)"

echo ""
echo "🔨 Construyendo imagen SIN caché para verificar tamaño..."

# Build local para verificar tamaño
docker build -f Dockerfile.dev -t test-size:latest . --no-cache

if [ $? -eq 0 ]; then
    echo ""
    echo "📏 TAMAÑO DE LA IMAGEN CONSTRUIDA:"
    docker images test-size:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

    IMAGE_SIZE=$(docker images test-size:latest --format "{{.Size}}")
    echo ""

    if [[ $IMAGE_SIZE == *"GB"* ]]; then
        echo "⚠️  IMAGEN GRANDE: $IMAGE_SIZE"
        echo "📊 Causa: Dependencies de AWS Amplify/SDK (~2.14GB)"
        echo ""
        echo "🔍 Inspeccionando capas de la imagen:"
        docker history test-size:latest --human --format "table {{.CreatedBy}}\t{{.Size}}"
        echo ""
        echo "⚡ CONTINUANDO con deploy de demostración (yarn dev)"
        echo "   (El tamaño no afecta funcionalidad, solo tiempo de deploy)"
        echo ""
    else
        echo "✅ IMAGEN OPTIMIZADA: $IMAGE_SIZE"
        echo ""
        echo "🚀 Procediendo con despliegue..."
    fi

    # Limpiar imagen de prueba
    docker rmi test-size:latest

    # Desplegar con Copilot
    ~/bin/copilot svc deploy --name $SERVICE_NAME --env $ENV_NAME

    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 ¡DESPLIEGUE EXITOSO!"
        echo ""
        echo "🌐 URLs disponibles:"
        echo "├── https://yaan.com.mx"
        echo "├── https://www.yaan.com.mx"
        echo "└── Health check: https://yaan.com.mx/api/health"
    fi
else
    echo "❌ Error construyendo imagen de prueba"
fi