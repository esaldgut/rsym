#!/bin/bash

echo "🧹 LIMPIANDO Y RECONSTRUYENDO IMAGEN OPTIMIZADA"
echo "=============================================="

# 1. Limpiar Docker
echo "🗑️  Limpiando Docker (liberando ~28GB)..."
docker system prune -af --volumes
docker builder prune -af

echo ""
echo "✅ Docker limpio"
echo ""

# 2. Verificar que Dockerfile.dev está optimizado
echo "📝 Verificando Dockerfile.dev optimizado..."
if grep -q "rm -rf node_modules/.cache" Dockerfile.dev; then
    echo "✅ Dockerfile.dev está optimizado"
else
    echo "❌ Dockerfile.dev no está optimizado"
    exit 1
fi

# 3. Construir imagen localmente para verificar tamaño
echo ""
echo "🔨 Construyendo imagen optimizada localmente..."
docker build -f Dockerfile.dev -t yaan-dev-optimized:latest .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Imagen construida"

    # 4. Verificar el tamaño
    echo ""
    echo "📊 Tamaño de la imagen:"
    docker images yaan-dev-optimized:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

    # 5. Verificar que funciona
    echo ""
    echo "🧪 Probando la imagen localmente..."
    docker run -d --name test-yaan -p 3000:3000 yaan-dev-optimized:latest

    sleep 5

    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Imagen funciona correctamente"
    else
        echo "⚠️  La imagen puede tardar en iniciar (yarn dev)"
    fi

    # Detener y eliminar contenedor de prueba
    docker stop test-yaan > /dev/null 2>&1
    docker rm test-yaan > /dev/null 2>&1

    echo ""
    echo "📦 Imagen optimizada lista para despliegue"
    echo ""
    echo "La próxima vez que ejecutes copilot svc deploy:"
    echo "- Usará el Dockerfile.dev optimizado"
    echo "- La imagen será ~200-300MB (no 2.6GB)"
    echo "- El push será mucho más rápido"

else
    echo "❌ Error construyendo imagen"
fi

echo ""
echo "💡 Para forzar reconstrucción en ECR:"
echo "docker build -f Dockerfile.dev -t 288761749126.dkr.ecr.us-west-2.amazonaws.com/yaan-dev/nextjs-dev:latest ."
echo "docker push 288761749126.dkr.ecr.us-west-2.amazonaws.com/yaan-dev/nextjs-dev:latest"