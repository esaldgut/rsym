# 🚀 Guía de Despliegue - YAAN Web App

## 📊 Comparación de Opciones

| Característica | AWS Amplify Hosting | AWS Copilot (ECS/Fargate) |
|----------------|-------------------|------------------------|
| **Tiempo de setup** | 5-10 minutos | 20-30 minutos |
| **Costo estimado** | $5-20/mes | $30-50/mes |
| **Complejidad** | Baja | Media |
| **Control** | Medio | Alto |
| **Auto-scaling** | Automático | Configurable |
| **Preview URLs** | ✅ Automático | ⚠️ Manual |
| **CI/CD** | ✅ Integrado | ⚠️ Requiere setup |
| **Monitoreo** | CloudWatch básico | CloudWatch completo |
| **Rollback** | ✅ Fácil | ✅ Blue/Green |
| **SSR Support** | ✅ Nativo | ✅ Full control |

## 🎯 Opción 1: AWS Amplify Hosting (RECOMENDADO)

### ¿Por qué esta opción?
- **Integración perfecta** con tu stack Amplify Gen 2 existente
- **Despliegue automático** con cada push
- **Preview environments** para testing de branches
- **Optimizado para Next.js 15** con SSR/SSG automático

### Pasos de implementación:

```bash
# 1. Hacer ejecutable el script
chmod +x deploy-amplify.sh

# 2. Ejecutar despliegue
./deploy-amplify.sh

# 3. Commit y push de configuración
git add amplify.yml deploy-amplify.sh
git commit -m "feat: Configure Amplify Hosting for deployment"
git push origin fix/inicio-comienza_buton
```

### Configuración en AWS Console:

1. Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click en "New app" → "Host web app"
3. Conecta tu repositorio GitHub
4. Selecciona branch: `fix/inicio-comienza_buton`
5. Acepta la configuración detectada (amplify.yml)
6. Click "Save and deploy"

### Variables de entorno necesarias:
```env
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=<tu-user-pool-id>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<tu-client-id>
NEXT_PUBLIC_IDENTITY_POOL_ID=<tu-identity-pool-id>
NEXT_PUBLIC_BUCKET_NAME=<tu-bucket-name>
```

### Verificación post-despliegue:
```bash
# Ver estado del despliegue
amplify status

# Ver logs
amplify console

# Obtener URL de la app
amplify hosting status
```

## 🐳 Opción 2: AWS Copilot con ECS/Fargate

### ¿Por qué esta opción?
- **Control total** sobre la infraestructura
- **Mejor para microservicios** si planeas expandir
- **Monitoreo avanzado** con CloudWatch
- **Blue/Green deployments** para zero-downtime

### Pasos de implementación:

```bash
# 1. Configurar Next.js para standalone
echo 'module.exports = { output: "standalone" }' >> next.config.js

# 2. Hacer ejecutable el script
chmod +x deploy-copilot.sh

# 3. Ejecutar despliegue
./deploy-copilot.sh

# 4. Verificar servicio
copilot svc status --name nextjs --env test
```

### Comandos útiles de Copilot:

```bash
# Ver logs en tiempo real
copilot svc logs --name nextjs --env test --follow

# Escalar servicio
copilot svc override --name nextjs --env test

# Ver métricas
copilot svc status --name nextjs --env test

# Ejecutar comandos en el contenedor
copilot svc exec --name nextjs --env test

# Actualizar después de cambios
copilot svc deploy --name nextjs --env test

# Eliminar todo
copilot app delete
```

## 🔍 Validación de Funcionalidad

### Checklist de pruebas post-despliegue:

- [ ] **Autenticación**
  - [ ] Login con email/password
  - [ ] Login social (Google/Facebook)
  - [ ] Registro de nuevos usuarios
  - [ ] Logout funciona correctamente

- [ ] **Perfil de usuario**
  - [ ] Carga de imagen de perfil
  - [ ] Actualización de datos
  - [ ] Validación de campos

- [ ] **Funciones críticas**
  - [ ] Creación de momentos
  - [ ] Búsqueda de ubicaciones
  - [ ] Carga de archivos S3
  - [ ] Queries GraphQL

- [ ] **Performance**
  - [ ] Tiempo de carga < 3s
  - [ ] TTI (Time to Interactive) < 5s
  - [ ] No errores en consola

## 📈 Monitoreo y Alertas

### Para Amplify Hosting:
```javascript
// amplify/backend/monitoring/alarms.ts
import { Duration, Stack } from 'aws-cdk-lib';
import { Alarm, Metric } from 'aws-cdk-lib/aws-cloudwatch';

const errorAlarm = new Alarm(stack, 'HighErrorRate', {
  metric: new Metric({
    namespace: 'AWS/AmplifyHosting',
    metricName: '4xxErrors',
    dimensionsMap: {
      AppId: amplifyApp.appId,
      BranchName: 'main'
    }
  }),
  threshold: 10,
  evaluationPeriods: 2
});
```

### Para Copilot:
```yaml
# copilot/environments/test/addons/alarms.yml
Resources:
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: High CPU usage
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
```

## 🚨 Troubleshooting

### Problemas comunes y soluciones:

1. **Build falla en Amplify**
   ```bash
   # Verificar logs
   amplify console
   # Revisar amplify.yml
   # Verificar variables de entorno
   ```

2. **Container no inicia en Copilot**
   ```bash
   # Ver logs del contenedor
   copilot svc logs --name nextjs --env test
   # Verificar health check
   curl https://[tu-servicio-url]/api/health
   ```

3. **Errores de Amplify Auth**
   ```bash
   # Verificar configuración
   amplify status
   # Regenerar recursos
   amplify push --force
   ```

## 📞 Soporte y Recursos

- [Next.js 15 Docs](https://nextjs.org/docs)
- [AWS Amplify Hosting Docs](https://docs.amplify.aws/guides/hosting/nextjs/q/platform/js/)
- [AWS Copilot Docs](https://aws.github.io/copilot-cli/)
- [Amplify Gen 2 Docs](https://docs.amplify.aws/gen2/)

## 🎯 Recomendación Final

**Para tu caso específico, recomiendo empezar con Amplify Hosting** porque:

1. ✅ Ya tienes Amplify Gen 2 configurado
2. ✅ Necesitas validar funcionalidad rápidamente
3. ✅ Preview environments automáticos para testing
4. ✅ Menor costo inicial
5. ✅ Integración nativa con todos tus recursos Amplify

Si necesitas más control o escalar a microservicios, puedes migrar a Copilot más adelante.

---

**Tiempo estimado de despliegue:**
- Amplify Hosting: 10-15 minutos ⚡
- Copilot: 30-45 minutos 🐳

**Siguiente paso:** Ejecuta `./deploy-amplify.sh` y sigue las instrucciones en consola.