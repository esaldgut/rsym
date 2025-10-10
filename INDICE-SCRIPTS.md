# Índice de Scripts de Despliegue

## 📁 Setup (Configuración Inicial)
**Ubicación:** `scripts/setup/`

### 1-prepare-copilot.sh
- **Función:** Instala y configura AWS Copilot CLI
- **Uso:** Solo ejecutar una vez para preparar el entorno

### 2-copilot-app-init.sh
- **Función:** Inicializa la aplicación Copilot con dominio
- **Uso:** Crear app `yaan-dev` con dominio `yaan.com.mx`

### 3-ssl-config.sh
- **Función:** Configura certificados SSL en us-east-1
- **Uso:** Crear certificados para dominios principales

### 4-create-web-service-with-copilot.sh
- **Función:** Crea el servicio web balanceado
- **Uso:** Genera servicio `nextjs-dev` con manifest optimizado

### 5-create-environments.sh
- **Función:** Crea entorno de desarrollo
- **Uso:** Configura entorno `dev` con VPC y subredes

### 6-configure-secrets-manager.sh
- **Función:** Configura AWS Secrets Manager
- **Uso:** Gestión de secretos para la aplicación

## 🚀 Deploy (Despliegue)
**Ubicación:** `scripts/deploy/`

### force-domain-deployment.sh
- **Función:** Despliegue completo con dominio obligatorio
- **Uso:** Despliegue principal con yaan.com.mx y www.yaan.com.mx
- **Características:**
  - Verificación de dominios
  - Health check optimizado
  - Configuración SSL automática

### force-clean-docker-deploy.sh
- **Función:** Build limpio sin caché + verificación de tamaño
- **Uso:** Despliegue con validación de imagen optimizada
- **Características:**
  - Limpia caché Docker
  - Verifica tamaño < 1GB
  - Cancela si imagen muy grande

### rebuild-optimized-image.sh
- **Función:** Reconstruye imagen con optimizaciones
- **Uso:** Rebuild específico para reducir tamaño de imagen

## 🔧 Troubleshoot (Solución de Problemas)
**Ubicación:** `scripts/troubleshoot/`

### fix-rollback-and-redeploy.sh
- **Función:** Corrige stacks en ROLLBACK_COMPLETE
- **Uso:** Elimina stack fallido y redespliega
- **Características:**
  - Verificación de estado CloudFormation
  - Eliminación segura de stack
  - Redespliegue automático

## 🔐 Utilidades
**Ubicación:** `raíz del proyecto`

### load-env.sh
- **Función:** Carga variables de entorno
- **Uso:** Configuración de entorno local

## 📊 Estado Actual

### ✅ Scripts Funcionales
- Setup completo (6 scripts)
- Despliegue con dominio
- Troubleshooting de rollbacks

### ⚠️  Problemas Identificados
- **Imagen Docker:** Persiste en 2.83GB debido a dependencias
- **Layer más pesado:** `yarn install` genera 2.14GB
- **Causa:** Bloat en package.json dependencies

## 🎯 Uso Recomendado

### Primera Vez (Setup Completo)
```bash
# 1. Configurar entorno
./scripts/setup/1-prepare-copilot.sh
./scripts/setup/2-copilot-app-init.sh
./scripts/setup/3-ssl-config.sh

# 2. Crear servicio
./scripts/setup/4-create-web-service-with-copilot.sh
./scripts/setup/5-create-environments.sh

# 3. Desplegar
./scripts/deploy/force-domain-deployment.sh
```

### Despliegue Rutinario
```bash
./scripts/deploy/force-domain-deployment.sh
```

### Problemas de Rollback
```bash
./scripts/troubleshoot/fix-rollback-and-redeploy.sh
```

### Imagen Muy Grande
```bash
./scripts/deploy/force-clean-docker-deploy.sh
```

## 📋 Notas Técnicas

- **Región:** us-west-2 (Oregon)
- **SSL:** us-east-1 (requerido para CloudFront)
- **Dominios:** yaan.com.mx, www.yaan.com.mx
- **Health Check:** /api/health (120s start period)
- **Recursos:** 1 vCPU, 2GB RAM
- **Modo:** Development (yarn dev)