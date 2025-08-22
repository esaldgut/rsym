#!/bin/bash

# Script de despliegue con AWS Amplify Hosting
# Para Next.js 15.3.4 con Amplify Gen 2

echo "🚀 Iniciando despliegue con AWS Amplify Hosting..."

# 1. Verificar que Amplify CLI esté instalado
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI no está instalado. Instalando..."
    npm install -g @aws-amplify/cli
fi

# 2. Inicializar Amplify Hosting si no existe
echo "📦 Configurando Amplify Hosting..."

# 3. Crear archivo de configuración de build
cat > amplify.yml << 'EOF'
version: 1
applications:
  - appRoot: .
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci --cache .npm --prefer-offline
            - echo "AWS_BRANCH=$AWS_BRANCH"
        build:
          commands:
            - env | grep -e NEXT_PUBLIC_ >> .env.production
            - env | grep -e AWS_ >> .env.production
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - .next/cache/**/*
          - .npm/**/*
          - node_modules/**/*
    platform:
      name: WEB_COMPUTE
      runtime: nodejs20.x
EOF

# 4. Configurar branch para despliegue
echo "🌿 Configurando branch: fix/inicio-comienza_buton"

# 5. Push a repositorio
git add amplify.yml
git commit -m "feat: Add Amplify Hosting configuration for Next.js 15.3.4"
git push origin fix/inicio-comienza_buton

# 6. Conectar con Amplify Hosting
amplify hosting add

echo "✅ Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ve a la consola de AWS Amplify"
echo "2. Conecta tu repositorio GitHub"
echo "3. Selecciona la branch 'fix/inicio-comienza_buton'"
echo "4. El despliegue iniciará automáticamente"
echo ""
echo "🔗 URL de preview estará disponible en ~5-10 minutos"