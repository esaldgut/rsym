# 🔐 Configuración de Variables de Entorno en AWS Copilot

**Fecha**: 2025-10-31
**Versión**: 1.1 (IMPLEMENTADO)
**Status**: ✅ Script y configuración listos para usar

---

## 🚀 Quick Start (Ejecutar Ahora)

```bash
# 1. Asegúrate de estar en el directorio del proyecto
cd /Users/esaldgut/dev/src/react/nextjs/yaan-web

# 2. Verifica que .env.local existe con los secretos
cat .env.local | grep -E "(URL_ENCRYPTION_SECRET|MIT_WEBHOOK_SECRET|MIT_API_KEY)"

# 3. Ejecuta el script de configuración (creará secretos en AWS)
./scripts/setup-copilot-secrets.sh

# 4. Verifica que los secretos fueron creados
aws secretsmanager list-secrets --region us-west-2 --query 'SecretList[?contains(Name, `/copilot/yaan-dev/dev/`)].Name'

# 5. Despliega con los secretos configurados
./deploy-safe.sh
```

**✅ Archivos ya configurados:**
- `scripts/setup-copilot-secrets.sh` - Script ejecutable
- `copilot/nextjs-dev/manifest.yml` - Actualizado con secrets section
- `docs/iam-secrets-policy.json` - Política IAM de referencia

---

## 📋 Índice

1. [Quick Start](#-quick-start-ejecutar-ahora)
2. [Variables de Entorno: Local vs Copilot](#variables-de-entorno-local-vs-copilot)
3. [Tipos de Variables en Copilot](#tipos-de-variables-en-copilot)
4. [Configuración en Copilot Manifest](#configuración-en-copilot-manifest)
5. [AWS Secrets Manager](#aws-secrets-manager)
6. [Script de Configuración](#script-de-configuración)
7. [Verificación y Testing](#verificación-y-testing)
8. [Troubleshooting](#troubleshooting)

---

## 🔀 Variables de Entorno: Local vs Copilot

### **Desarrollo Local** (`.env.local`)

En desarrollo local, Next.js lee las variables de entorno desde:
- `.env.local` - Variables locales (NO se suben a Git)
- `.env` - Variables compartidas (opcional)
- `.env.example` - Template para el equipo

**Ejemplo `.env.local`**:
```bash
URL_ENCRYPTION_SECRET=/nmajawaO61zlorZ6PZgdTu8+5S75YtjBySDq235Fac=
MIT_WEBHOOK_SECRET=test-secret-key-for-local-development
MIT_API_KEY=test-api-key-for-local
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### **AWS Copilot** (Despliegue)

En Copilot, las variables se definen en:
1. **`manifest.yml`** - Variables públicas (no sensibles)
2. **AWS Parameter Store** - Variables de configuración
3. **AWS Secrets Manager** - Secretos sensibles (API keys, passwords)

---

## 📦 Tipos de Variables en Copilot

### **1. Variables Públicas** (`variables:`)
Para valores NO sensibles que pueden estar en el código.

**Dónde**: `copilot/nextjs-dev/manifest.yml`

**Ejemplo**:
```yaml
variables:
  NODE_ENV: development
  NEXT_TELEMETRY_DISABLED: 1
  PORT: 3000
  AWS_REGION: us-west-2
  HOSTNAME: "0.0.0.0"

  # NEXT_PUBLIC variables (visible en cliente)
  NEXT_PUBLIC_BASE_URL: "https://yaan.com.mx"
  NEXT_PUBLIC_APP_SCHEME: "yaan"
  NEXT_PUBLIC_ENABLE_SMART_APP_BANNER: "true"
  NEXT_PUBLIC_SMART_APP_BANNER_DELAY_MS: "5000"

  # AWS Location Service (público)
  NEXT_PUBLIC_LOCATION_MAP_NAME: "YaanEsri"
  NEXT_PUBLIC_LOCATION_ROUTE_CALCULATOR: "YaanTourismRouteCalculator"
  NEXT_PUBLIC_LOCATION_PLACE_INDEX: "YAANPlaceIndex"
```

### **2. Secretos** (`secrets:`)
Para valores sensibles (API keys, passwords, tokens).

**Dónde**: AWS Secrets Manager

**Ejemplo en `manifest.yml`**:
```yaml
secrets:
  # URL Encryption Secret (CRÍTICO - NO exponer)
  URL_ENCRYPTION_SECRET: /copilot/${COPILOT_APPLICATION_NAME}/${COPILOT_ENVIRONMENT_NAME}/secrets/URL_ENCRYPTION_SECRET

  # MIT Payment Gateway Secrets (CRÍTICO - NO exponer)
  MIT_WEBHOOK_SECRET: /copilot/${COPILOT_APPLICATION_NAME}/${COPILOT_ENVIRONMENT_NAME}/secrets/MIT_WEBHOOK_SECRET
  MIT_API_KEY: /copilot/${COPILOT_APPLICATION_NAME}/${COPILOT_ENVIRONMENT_NAME}/secrets/MIT_API_KEY
```

### **3. Variables por Entorno** (`environments:`)
Para valores específicos por entorno (dev, staging, prod).

**Ejemplo en `manifest.yml`**:
```yaml
environments:
  dev:
    count: 1
    variables:
      LOG_LEVEL: debug
      NEXT_PUBLIC_ENV: development
      MIT_ENVIRONMENT: sandbox  # MIT en modo sandbox para dev

  prod:
    count: 2
    variables:
      LOG_LEVEL: info
      NEXT_PUBLIC_ENV: production
      MIT_ENVIRONMENT: production  # MIT en modo production
```

---

## 📝 Configuración en Copilot Manifest

### **Actualizar `copilot/nextjs-dev/manifest.yml`**

Agrega las siguientes secciones:

```yaml
# ============================================================================
# Variables de Entorno Públicas
# ============================================================================
variables:
  # Node.js / Next.js
  NODE_ENV: development
  NEXT_TELEMETRY_DISABLED: 1
  PORT: 3000
  AWS_REGION: us-west-2
  HOSTNAME: "0.0.0.0"

  # Next.js Public Variables (visible en cliente)
  NEXT_PUBLIC_BASE_URL: "https://yaan.com.mx"
  NEXT_PUBLIC_APP_SCHEME: "yaan"
  NEXT_PUBLIC_ENABLE_SMART_APP_BANNER: "true"
  NEXT_PUBLIC_SMART_APP_BANNER_DELAY_MS: "5000"

  # AWS Location Service
  NEXT_PUBLIC_LOCATION_MAP_NAME: "YaanEsri"
  NEXT_PUBLIC_LOCATION_ROUTE_CALCULATOR: "YaanTourismRouteCalculator"
  NEXT_PUBLIC_LOCATION_PLACE_INDEX: "YAANPlaceIndex"

  # AWS S3
  NEXT_PUBLIC_S3_BUCKET: "yaan-provider-documents"

# ============================================================================
# Secretos (AWS Secrets Manager)
# ============================================================================
secrets:
  # URL Encryption Secret (REQUERIDO para /marketplace/booking)
  URL_ENCRYPTION_SECRET: /copilot/${COPILOT_APPLICATION_NAME}/${COPILOT_ENVIRONMENT_NAME}/secrets/URL_ENCRYPTION_SECRET

  # MIT Payment Gateway Secrets (REQUERIDO para FASE 6)
  MIT_WEBHOOK_SECRET: /copilot/${COPILOT_APPLICATION_NAME}/${COPILOT_ENVIRONMENT_NAME}/secrets/MIT_WEBHOOK_SECRET
  MIT_API_KEY: /copilot/${COPILOT_APPLICATION_NAME}/${COPILOT_ENVIRONMENT_NAME}/secrets/MIT_API_KEY

# ============================================================================
# Variables por Entorno
# ============================================================================
environments:
  dev:
    count: 1
    variables:
      LOG_LEVEL: debug
      NEXT_PUBLIC_ENV: development
      MIT_ENVIRONMENT: sandbox

  prod:
    count: 2
    variables:
      LOG_LEVEL: info
      NEXT_PUBLIC_ENV: production
      MIT_ENVIRONMENT: production
```

---

## 🤖 Script de Configuración

Hemos creado un script automatizado que configura todos los secretos en AWS Secrets Manager leyendo los valores de `.env.local`.

### **Archivo**: `scripts/setup-copilot-secrets.sh`

**Características**:
- ✅ Lee valores automáticamente de `.env.local`
- ✅ Crea o actualiza secretos (idempotente)
- ✅ Valida que AWS CLI esté configurado
- ✅ Valida que todas las variables existen
- ✅ Manejo de errores y output colorizado
- ✅ Verifica autenticación AWS antes de ejecutar

### **Uso**:

```bash
# 1. Asegúrate de que .env.local existe con los valores correctos
cat .env.local | grep -E "(URL_ENCRYPTION_SECRET|MIT_WEBHOOK_SECRET|MIT_API_KEY)"

# 2. Ejecuta el script
./scripts/setup-copilot-secrets.sh

# Output esperado:
# === Configuración de Secretos AWS para Copilot ===
# ✓ AWS CLI configurado correctamente
# ✓ Variables encontradas en .env.local
#
# === Creando Secretos en AWS Secrets Manager ===
# Procesando: /copilot/yaan-dev/dev/secrets/URL_ENCRYPTION_SECRET
#   ✓ Secreto creado
# Procesando: /copilot/yaan-dev/dev/secrets/MIT_WEBHOOK_SECRET
#   ✓ Secreto creado
# Procesando: /copilot/yaan-dev/dev/secrets/MIT_API_KEY
#   ✓ Secreto creado
#
# === ✓ Todos los secretos configurados correctamente ===
```

### **Secretos Configurados**:

El script crea/actualiza 3 secretos:

| Secret | Path | Descripción | Usado en |
|--------|------|-------------|----------|
| URL_ENCRYPTION_SECRET | `/copilot/yaan-dev/dev/secrets/URL_ENCRYPTION_SECRET` | AES-256-GCM para cifrar URLs | FASE 1 - Booking URLs |
| MIT_WEBHOOK_SECRET | `/copilot/yaan-dev/dev/secrets/MIT_WEBHOOK_SECRET` | HMAC SHA-256 para webhooks | FASE 6 - Webhook Handler |
| MIT_API_KEY | `/copilot/yaan-dev/dev/secrets/MIT_API_KEY` | API Key para MIT Gateway | FASE 6 - Payment API |

### **Troubleshooting del Script**:

**Error: "AWS CLI no está instalado"**
```bash
# Instalar AWS CLI v2
brew install awscli  # macOS
# o visita: https://aws.amazon.com/cli/
```

**Error: "No estás autenticado en AWS"**
```bash
# Configurar credenciales
aws configure

# Verificar
aws sts get-caller-identity
```

**Error: "No se encuentra .env.local"**
```bash
# Verificar que estás en el directorio correcto
pwd
# Debe mostrar: /Users/esaldgut/dev/src/react/nextjs/yaan-web

# Crear .env.local si no existe
cp .env.example .env.local
```

**Error: "Variable no encontrada en .env.local"**
```bash
# Verificar que .env.local tiene todas las variables
grep -E "(URL_ENCRYPTION_SECRET|MIT_WEBHOOK_SECRET|MIT_API_KEY)" .env.local

# Agregar variables faltantes
echo "URL_ENCRYPTION_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "MIT_WEBHOOK_SECRET=test-secret-key-for-local-development" >> .env.local
echo "MIT_API_KEY=test-api-key-for-local" >> .env.local
```

---

## 🔑 AWS Systems Manager Parameter Store

Para variables de configuración NO sensibles pero que quieres centralizar.

### **Crear Parameter**

```bash
aws ssm put-parameter \
  --name "/copilot/yaan-dev/dev/LOG_LEVEL" \
  --value "debug" \
  --type "String" \
  --region us-west-2
```

### **Usar en manifest.yml**

```yaml
variables:
  LOG_LEVEL:
    from_cfn: ${LOG_LEVEL_PARAMETER}
```

**Ventajas**:
- Centralizado en AWS
- Fácil de actualizar
- Historial de cambios

**Desventajas**:
- Más lento que hardcodear
- Requiere permisos IAM

---

## 🔐 AWS Secrets Manager

Para secretos sensibles (API keys, passwords, tokens).

### **1. URL Encryption Secret**

**Generar Secret**:
```bash
# Generar clave aleatoria de 32 caracteres
openssl rand -base64 32
# Output ejemplo: /nmajawaO61zlorZ6PZgdTu8+5S75YtjBySDq235Fac=
```

**Crear Secret en AWS**:
```bash
aws secretsmanager create-secret \
  --name "/copilot/yaan-dev/dev/secrets/URL_ENCRYPTION_SECRET" \
  --description "Secret para cifrado AES-256-GCM de URLs de booking" \
  --secret-string "/nmajajawaO61zlorZ6PZgdTu8+5S75YtjBySDq235Fac=" \
  --region us-west-2
```

### **2. MIT Payment Gateway Secrets**

**MIT Webhook Secret**:
```bash
# Este secret lo proporciona MIT Payment Gateway en su portal
aws secretsmanager create-secret \
  --name "/copilot/yaan-dev/dev/secrets/MIT_WEBHOOK_SECRET" \
  --description "Secret para verificar HMAC SHA-256 de webhooks MIT" \
  --secret-string "whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  --region us-west-2
```

**MIT API Key**:
```bash
# Este API key lo proporciona MIT Payment Gateway
aws secretsmanager create-secret \
  --name "/copilot/yaan-dev/dev/secrets/MIT_API_KEY" \
  --description "API Key para MIT Payment Gateway (sandbox)" \
  --secret-string "mk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  --region us-west-2
```

### **3. Verificar Secrets Creados**

```bash
# Listar todos los secrets de la app
aws secretsmanager list-secrets \
  --filters Key=name,Values=/copilot/yaan-dev/dev/secrets/ \
  --region us-west-2

# Ver valor de un secret específico (para verificar)
aws secretsmanager get-secret-value \
  --secret-id "/copilot/yaan-dev/dev/secrets/URL_ENCRYPTION_SECRET" \
  --region us-west-2 \
  --query SecretString \
  --output text
```

---

## 🚀 Comandos para Configurar Secrets

### **Script Completo de Configuración**

Guarda esto como `scripts/setup-copilot-secrets.sh`:

```bash
#!/bin/bash
# ============================================================================
# Script para configurar secretos en AWS Secrets Manager para Copilot
# ============================================================================

set -e

# Variables
APP_NAME="yaan-dev"
ENV_NAME="dev"
REGION="us-west-2"

echo "🔐 Configurando secretos para ${APP_NAME}-${ENV_NAME}"

# ============================================================================
# 1. URL Encryption Secret
# ============================================================================
echo ""
echo "📝 1. URL Encryption Secret"
read -p "Ingresa el URL_ENCRYPTION_SECRET (o presiona Enter para generar uno nuevo): " URL_SECRET

if [ -z "$URL_SECRET" ]; then
  echo "🔑 Generando nuevo secret..."
  URL_SECRET=$(openssl rand -base64 32)
  echo "✅ Secret generado: $URL_SECRET"
fi

aws secretsmanager create-secret \
  --name "/copilot/${APP_NAME}/${ENV_NAME}/secrets/URL_ENCRYPTION_SECRET" \
  --description "Secret para cifrado AES-256-GCM de URLs de booking" \
  --secret-string "$URL_SECRET" \
  --region $REGION \
  2>/dev/null && echo "✅ URL_ENCRYPTION_SECRET creado" || echo "⚠️  URL_ENCRYPTION_SECRET ya existe (usa update-secret para actualizar)"

# ============================================================================
# 2. MIT Webhook Secret
# ============================================================================
echo ""
echo "📝 2. MIT Webhook Secret"
echo "ℹ️  Este secret lo proporciona MIT Payment Gateway en su portal"
read -p "Ingresa el MIT_WEBHOOK_SECRET (whsec_...): " MIT_WEBHOOK

if [ ! -z "$MIT_WEBHOOK" ]; then
  aws secretsmanager create-secret \
    --name "/copilot/${APP_NAME}/${ENV_NAME}/secrets/MIT_WEBHOOK_SECRET" \
    --description "Secret para verificar HMAC SHA-256 de webhooks MIT" \
    --secret-string "$MIT_WEBHOOK" \
    --region $REGION \
    2>/dev/null && echo "✅ MIT_WEBHOOK_SECRET creado" || echo "⚠️  MIT_WEBHOOK_SECRET ya existe"
else
  echo "⏭️  Saltando MIT_WEBHOOK_SECRET (configúralo más tarde)"
fi

# ============================================================================
# 3. MIT API Key
# ============================================================================
echo ""
echo "📝 3. MIT API Key"
echo "ℹ️  Este API key lo proporciona MIT Payment Gateway (mk_test_... para sandbox)"
read -p "Ingresa el MIT_API_KEY: " MIT_API

if [ ! -z "$MIT_API" ]; then
  aws secretsmanager create-secret \
    --name "/copilot/${APP_NAME}/${ENV_NAME}/secrets/MIT_API_KEY" \
    --description "API Key para MIT Payment Gateway" \
    --secret-string "$MIT_API" \
    --region $REGION \
    2>/dev/null && echo "✅ MIT_API_KEY creado" || echo "⚠️  MIT_API_KEY ya existe"
else
  echo "⏭️  Saltando MIT_API_KEY (configúralo más tarde)"
fi

# ============================================================================
# Resumen
# ============================================================================
echo ""
echo "✅ Configuración completada!"
echo ""
echo "📋 Secrets configurados:"
aws secretsmanager list-secrets \
  --filters Key=name,Values=/copilot/${APP_NAME}/${ENV_NAME}/secrets/ \
  --region $REGION \
  --query 'SecretList[*].[Name,Description]' \
  --output table

echo ""
echo "🚀 Próximo paso: Actualiza copilot/nextjs-dev/manifest.yml con:"
echo ""
echo "secrets:"
echo "  URL_ENCRYPTION_SECRET: /copilot/\${COPILOT_APPLICATION_NAME}/\${COPILOT_ENVIRONMENT_NAME}/secrets/URL_ENCRYPTION_SECRET"
echo "  MIT_WEBHOOK_SECRET: /copilot/\${COPILOT_APPLICATION_NAME}/\${COPILOT_ENVIRONMENT_NAME}/secrets/MIT_WEBHOOK_SECRET"
echo "  MIT_API_KEY: /copilot/\${COPILOT_APPLICATION_NAME}/\${COPILOT_ENVIRONMENT_NAME}/secrets/MIT_API_KEY"
```

### **Ejecutar el Script**

```bash
# Dar permisos de ejecución
chmod +x scripts/setup-copilot-secrets.sh

# Ejecutar
./scripts/setup-copilot-secrets.sh
```

---

## 🔄 Actualizar Secretos Existentes

Si ya creaste un secret y necesitas actualizarlo:

```bash
# Actualizar URL_ENCRYPTION_SECRET
aws secretsmanager update-secret \
  --secret-id "/copilot/yaan-dev/dev/secrets/URL_ENCRYPTION_SECRET" \
  --secret-string "nuevo-valor-aqui" \
  --region us-west-2

# Actualizar MIT_WEBHOOK_SECRET
aws secretsmanager update-secret \
  --secret-id "/copilot/yaan-dev/dev/secrets/MIT_WEBHOOK_SECRET" \
  --secret-string "nuevo-valor-aqui" \
  --region us-west-2

# Actualizar MIT_API_KEY
aws secretsmanager update-secret \
  --secret-id "/copilot/yaan-dev/dev/secrets/MIT_API_KEY" \
  --secret-string "nuevo-valor-aqui" \
  --region us-west-2
```

**IMPORTANTE**: Después de actualizar secretos, debes redesplegar:
```bash
~/bin/copilot svc deploy --name nextjs-dev --env dev
```

---

## ✅ Verificación y Testing

### **1. Verificar en AWS Console**

**Secrets Manager**:
1. AWS Console → Secrets Manager
2. Filter: `/copilot/yaan-dev/dev/secrets/`
3. Deberías ver 3 secrets:
   - `URL_ENCRYPTION_SECRET`
   - `MIT_WEBHOOK_SECRET`
   - `MIT_API_KEY`

### **2. Verificar en ECS Task**

Después de desplegar, verifica que las variables estén disponibles:

```bash
# Conectar a la tarea ECS
~/bin/copilot task exec --app yaan-dev --env dev --name nextjs-dev

# Una vez dentro del contenedor, verificar variables
echo $URL_ENCRYPTION_SECRET
echo $MIT_WEBHOOK_SECRET
echo $MIT_API_KEY
echo $NEXT_PUBLIC_BASE_URL

# Salir
exit
```

### **3. Verificar en CloudWatch Logs**

```bash
# Ver logs recientes
~/bin/copilot svc logs --name nextjs-dev --env dev --follow

# Buscar errores relacionados con env vars
~/bin/copilot svc logs --name nextjs-dev --env dev | grep -i "undefined\|missing\|secret"
```

### **4. Testing de Funcionalidad**

**Test 1: URL Encryption (Booking)**
```bash
# Acceder a booking
curl -I https://yaan.com.mx/marketplace/booking?product=xxx

# Si devuelve 200, URL encryption está funcionando
# Si devuelve 500, revisar URL_ENCRYPTION_SECRET
```

**Test 2: MIT Webhook**
```bash
# Enviar webhook de prueba desde MIT portal
# O simular con curl (requiere signature HMAC válida)

curl -X POST https://yaan.com.mx/api/webhooks/mit-payment \
  -H "Content-Type: application/json" \
  -H "x-mit-signature: <HMAC_SIGNATURE>" \
  -d '{"eventType":"payment.completed","paymentId":"test",...}'

# Verificar logs
~/bin/copilot svc logs --name nextjs-dev --env dev | grep "MIT Webhook"
```

---

## 🐛 Troubleshooting

### **Problema 1: Secret no encontrado en ECS**

**Error**:
```
Error: Failed to fetch secret /copilot/yaan-dev/dev/secrets/URL_ENCRYPTION_SECRET
```

**Solución**:
1. Verificar que el secret existe en AWS Secrets Manager
2. Verificar permisos IAM del Task Role
3. Verificar que el nombre en `manifest.yml` coincide exactamente

```bash
# Verificar secret
aws secretsmanager describe-secret \
  --secret-id "/copilot/yaan-dev/dev/secrets/URL_ENCRYPTION_SECRET" \
  --region us-west-2

# Verificar Task Role tiene permisos
aws iam get-role-policy \
  --role-name yaan-dev-dev-nextjs-dev-TaskRole \
  --policy-name SecretsManagerAccess
```

### **Problema 2: Variables NEXT_PUBLIC no disponibles en cliente**

**Síntoma**: Variables `NEXT_PUBLIC_*` son `undefined` en el navegador.

**Causa**: Las variables `NEXT_PUBLIC_*` deben estar disponibles en **build time**, no solo en runtime.

**Solución**:

**Opción A**: Usar `variables:` en manifest (público)
```yaml
variables:
  NEXT_PUBLIC_BASE_URL: "https://yaan.com.mx"
```

**Opción B**: Build args en Dockerfile
```dockerfile
# Dockerfile.dev
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
```

### **Problema 3: MIT Webhook falla con "Invalid signature"**

**Causa**: `MIT_WEBHOOK_SECRET` incorrecto o no coincide con el configurado en MIT portal.

**Solución**:
1. Verificar secret en Secrets Manager
2. Obtener el secret correcto desde MIT portal
3. Actualizar en AWS:
```bash
aws secretsmanager update-secret \
  --secret-id "/copilot/yaan-dev/dev/secrets/MIT_WEBHOOK_SECRET" \
  --secret-string "whsec_CORRECT_VALUE_FROM_MIT" \
  --region us-west-2
```
4. Redesplegar:
```bash
~/bin/copilot svc deploy --name nextjs-dev --env dev
```

### **Problema 4: Task Role sin permisos para Secrets**

**Error**:
```
AccessDeniedException: User is not authorized to perform: secretsmanager:GetSecretValue
```

**Solución**: Crear IAM Policy para Task Role

```bash
# Ver el Task Role actual
aws ecs describe-task-definition \
  --task-definition yaan-dev-dev-nextjs-dev \
  --query 'taskDefinition.taskRoleArn'

# El Task Role debería tener esta política automáticamente
# Si no, verificar que Copilot creó la política correctamente
```

**Copilot crea automáticamente permisos para secrets**, pero si necesitas agregar manualmente:

Crear `copilot/nextjs-dev/addons/secrets-policy.yml`:
```yaml
Parameters:
  App:
    Type: String
  Env:
    Type: String
  Name:
    Type: String

Resources:
  SecretsAccessPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      Description: !Sub 'Grants access to Secrets Manager for ${Name}'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowSecretsManagerAccess
            Effect: Allow
            Action:
              - secretsmanager:GetSecretValue
            Resource:
              - !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:/copilot/${App}/${Env}/secrets/*'

Outputs:
  SecretsAccessPolicyArn:
    Value: !Ref SecretsAccessPolicy
```

---

## 📋 Checklist de Configuración

### **Desarrollo Local**
- [ ] `.env.local` creado con todas las variables
- [ ] `URL_ENCRYPTION_SECRET` generado (min 32 chars)
- [ ] `MIT_*` variables configuradas para sandbox
- [ ] `yarn dev` arranca sin errores

### **AWS Copilot**
- [ ] `manifest.yml` actualizado con `variables:`
- [ ] `manifest.yml` actualizado con `secrets:`
- [ ] `manifest.yml` actualizado con `environments:`
- [ ] Secrets creados en AWS Secrets Manager:
  - [ ] `URL_ENCRYPTION_SECRET`
  - [ ] `MIT_WEBHOOK_SECRET`
  - [ ] `MIT_API_KEY`
- [ ] Task Role tiene permisos para Secrets Manager
- [ ] Service desplegado con `copilot svc deploy`
- [ ] Variables verificadas en ECS task (`copilot task exec`)
- [ ] Funcionalidad testeada (booking, webhooks)

---

## 📚 Referencias

- [AWS Copilot - Environment Variables](https://aws.github.io/copilot-cli/docs/developing/environment-variables/)
- [AWS Copilot - Secrets](https://aws.github.io/copilot-cli/docs/developing/secrets/)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**Última actualización**: 2025-10-31
**Autor**: Claude (Anthropic)
**Estado**: ✅ Documentación completa
