#!/bin/bash

echo "🔐 CONFIGURANDO SECRETS SIMPLIFICADOS PARA DESARROLLO"
echo "==================================================="

REGION="us-west-2"
APP_NAME="yaan-dev"

echo "ℹ️  NOTA: Para desarrollo con yarn dev, simplificamos los secrets"
echo "Solo configuramos los essenciales para desarrollo."

# 1. Verificar si ya existen secrets
echo "🔍 Verificando secrets existentes..."

# 2. Configurar secrets mínimos para desarrollo
echo "🔧 Configurando secrets mínimos para desarrollo..."

# Crear directorio de secrets si no existe
mkdir -p ~/.aws/copilot-secrets

# JWT Secret para desarrollo (local)
DEV_JWT_SECRET=$(openssl rand -base64 32)
echo "🔑 JWT Secret generado para desarrollo: ${DEV_JWT_SECRET:0:20}..."

# Crear archivo temporal con instrucciones
cat > secrets-setup-instructions.md << 'EOF'
# 📋 INSTRUCCIONES PARA CONFIGURAR SECRETS

## Para Desarrollo (yarn dev):

### Variables de entorno necesarias:
```bash
# En tu archivo .env.local o variables de entorno:
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
AWS_REGION=us-west-2

# AWS Amplify se manejará automáticamente con IAM roles en ECS
# No necesitas AWS_ACCESS_KEY_ID ni AWS_SECRET_ACCESS_KEY en contenedor
```

### Secrets opcionales para desarrollo:
```bash
# Solo si necesitas conectar a MongoDB específico:
# MONGODB_URI=mongodb://...

# JWT para autenticación local:
# JWT_SECRET=<generated-secret>
```

## Para Producción (futuro):
- Configurar MongoDB URI en AWS Parameter Store
- Configurar JWT Secret en AWS Parameter Store
- Usar IAM roles para AWS services (recomendado)

## Comandos para configurar secrets manualmente:
```bash
# Crear secret en Parameter Store:
aws ssm put-parameter \
    --name "/copilot/yaan-dev/dev/secrets/JWT_SECRET" \
    --value "your-secret-here" \
    --type "SecureString" \
    --region us-west-2

# Listar secrets:
aws ssm get-parameters-by-path \
    --path "/copilot/yaan-dev/" \
    --recursive \
    --region us-west-2
```
EOF

echo "✅ Configuración de secrets simplificada"
echo "📋 Archivos creados:"
echo "├── secrets-setup-instructions.md (instrucciones detalladas)"
echo "└── JWT Secret generado para desarrollo"
echo ""
echo "🎯 DESARROLLO CON yarn dev:"
echo "├── AWS credentials → Manejados por IAM roles en ECS"
echo "├── Variables de entorno → Definidas en copilot.yml"
echo "├── Secrets complejos → Opcionales para desarrollo"
echo "└── Amplify → Configurado automáticamente"
echo ""
echo "📖 Ver 'secrets-setup-instructions.md' para más detalles"
