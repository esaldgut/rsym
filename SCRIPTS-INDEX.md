# 📚 ÍNDICE DE SCRIPTS - AWS Copilot Deployment

## 🎯 Objetivo Principal
Desplegar aplicación Next.js con `yarn dev` en AWS usando dominios `yaan.com.mx` y `www.yaan.com.mx`

---

## 📂 Scripts Originales (1-8)
Scripts base para configuración inicial de AWS Copilot.

| Script | Propósito | Estado |
|--------|-----------|---------|
| `1-prepare-copilot.sh` | Verifica instalación y configuración AWS | ✅ Listo |
| `2-copilot-app-init.sh` | Crea app Copilot con dominio | ⚠️ Necesita --domain |
| `3-ssl-config.sh` | Configura certificados SSL | ✅ Certificado existe |
| `4-create-web-service-with-copilot.sh` | Crea servicio web | ✅ Actualizado |
| `5-create-environments.sh` | Crea environments dev/prod | ✅ Solo dev |
| `6-configure-secrets-manager.sh` | Configura secrets | ✅ Opcional |
| `7-full-deployment-script.sh` | Script completo de despliegue | ✅ Actualizado |
| `8-quick-dev-deploy.sh` | Redespliegue rápido | ✅ Para updates |

---

## 🔧 Scripts de Corrección
Scripts creados para resolver problemas específicos.

| Script | Problema que resuelve | Cuándo usar |
|--------|----------------------|-------------|
| `force-domain-deployment.sh` | App sin dominio asociado | **USAR ESTE** - Recrea app con dominio |
| `fix-domain-association.sh` | Intento de asociar dominio | ❌ No funciona (Copilot limitación) |
| `fix-cert-import.sh` | Importar certificado SSL | ❌ No resuelve el dominio |
| `configure-domain-and-deploy.sh` | Configurar dominio y SSL | ❌ Falla sin app con dominio |
| `redeploy-existing-service.sh` | Re-desplegar servicio existente | Para servicios en ROLLBACK |

---

## 🐳 Scripts de Optimización Docker
Scripts para optimizar el tamaño de la imagen Docker.

| Script | Propósito | Resultado esperado |
|--------|-----------|-------------------|
| `rebuild-optimized-image.sh` | Limpia Docker y reconstruye | Imagen ~200-300MB |
| `force-clean-build.sh` | Build sin node_modules local | Verifica optimización |

---

## 🚀 SECUENCIA RECOMENDADA DE EJECUCIÓN

### Para despliegue inicial con dominios:

```bash
# 1. Optimizar imagen Docker (opcional pero recomendado)
./rebuild-optimized-image.sh

# 2. Recrear app con dominio (OBLIGATORIO)
./force-domain-deployment.sh

# El script force-domain-deployment.sh:
# - Elimina app actual sin dominio
# - Recrea app CON --domain yaan.com.mx
# - Crea environment dev
# - Despliega servicio con dominios
# - Configura HTTPS automáticamente
```

### Para redespliegues posteriores:

```bash
# Opción A: Redespliegue rápido
./8-quick-dev-deploy.sh

# Opción B: Si hay cambios en manifest
copilot svc deploy --name nextjs-dev --env dev
```

---

## 📝 Scripts Auxiliares

| Script | Propósito |
|--------|-----------|
| `deploy-copilot-dev.sh` | Script original (obsoleto) |
| `load-env.sh` | Cargar variables de entorno |

---

## ⚠️ NOTAS IMPORTANTES

1. **El problema del dominio**: La app actual NO tiene dominio asociado. Copilot NO permite agregar dominio después. DEBE recrearse con `--domain`.

2. **Tamaño de imagen**: El `.dockerignore` no funciona correctamente con Copilot. Solución: copiar archivos específicos en lugar de `COPY . .`

3. **Certificado SSL**: Ya existe en `us-east-1`. No necesitas crearlo.

4. **Variables de entorno**: Configuradas para `NODE_ENV=development` y `yarn dev`.

---

## 🎯 Estado Actual

- ✅ App recreada con dominio
- ✅ Environment `dev` desplegado
- ✅ Servicio `nextjs-dev` configurado
- ⚠️ Imagen Docker grande (2.6GB) - próximo deploy será optimizada
- 🔄 Despliegue en progreso con dominios

---

## 🆘 Troubleshooting

```bash
# Ver logs del servicio
copilot svc logs --name nextjs-dev --env dev --follow

# Ver estado del stack
aws cloudformation describe-stacks --stack-name yaan-dev-dev-nextjs-dev --region us-west-2

# Verificar DNS
dig yaan.com.mx
dig www.yaan.com.mx

# Si AWS SSO expira
aws sso login --profile AdministratorAccess-288761749126
```