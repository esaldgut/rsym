#!/bin/bash

# Script de corrección post-deploy para mantener configuración de www.yaan.com.mx
# Ejecutar después de: ~/bin/copilot svc deploy --name nextjs-dev --env dev

set -e

echo "🔧 Aplicando correcciones post-deploy..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
CERT_ARN="arn:aws:acm:us-west-2:288761749126:certificate/777f93fa-5315-472e-9df3-94b41098ac4f"
ZONE_ID="Z01441381BYM7F3YGIDHZ"
ALB_DNS="yaan-d-Publi-KL6mU1p6M0Ff-2074737806.us-west-2.elb.amazonaws.com"
REGION="us-west-2"

echo -e "${YELLOW}1. Verificando certificado SSL en ALB...${NC}"

# Obtener ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers --region $REGION \
  --query 'LoadBalancers[?contains(LoadBalancerName,`yaan-d-Publi`)].LoadBalancerArn' \
  --output text)

if [ -z "$ALB_ARN" ]; then
  echo -e "${RED}❌ No se encontró el ALB${NC}"
  exit 1
fi

# Obtener Listener ARN
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN \
  --region $REGION \
  --query 'Listeners[0].ListenerArn' \
  --output text)

# Verificar certificado actual
CURRENT_CERT=$(aws elbv2 describe-listeners --listener-arn $LISTENER_ARN \
  --region $REGION \
  --query 'Listeners[0].Certificates[0].CertificateArn' \
  --output text)

if [ "$CURRENT_CERT" != "$CERT_ARN" ]; then
  echo -e "${YELLOW}  Actualizando certificado...${NC}"
  aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
    --region $REGION \
    --certificates CertificateArn=$CERT_ARN > /dev/null 2>&1
  echo -e "${GREEN}  ✅ Certificado actualizado${NC}"
else
  echo -e "${GREEN}  ✅ Certificado correcto${NC}"
fi

echo -e "${YELLOW}2. Verificando reglas de ALB para www.yaan.com.mx...${NC}"

# Buscar todas las reglas que no sean default
RULES=$(aws elbv2 describe-rules --listener-arn $LISTENER_ARN \
  --region $REGION \
  --query 'Rules[?IsDefault==`false`].[RuleArn,Priority]' \
  --output text)

# Tomar la primera regla no-default (normalmente la de mayor prioridad)
RULE_ARN=$(echo "$RULES" | head -1 | awk '{print $1}')

# Si no hay reglas custom, buscar por prioridad específica
if [ -z "$RULE_ARN" ] || [ "$RULE_ARN" == "None" ]; then
  RULE_ARN=$(aws elbv2 describe-rules --listener-arn $LISTENER_ARN \
    --region $REGION \
    --query 'Rules[0].RuleArn' \
    --output text 2>/dev/null || echo "")
fi

if [ ! -z "$RULE_ARN" ]; then
  # Verificar si la regla incluye www.yaan.com.mx
  HOSTS=$(aws elbv2 describe-rules --rule-arns $RULE_ARN \
    --region $REGION \
    --query 'Rules[0].Conditions[?Field==`host-header`].HostHeaderConfig.Values[]' \
    --output text)

  if [[ ! "$HOSTS" == *"www.yaan.com.mx"* ]]; then
    echo -e "${YELLOW}  Actualizando reglas de host header...${NC}"

    # Obtener el target group actual
    TARGET_GROUP=$(aws elbv2 describe-rules --rule-arns $RULE_ARN \
      --region $REGION \
      --query 'Rules[0].Actions[0].TargetGroupArn' \
      --output text)

    # Actualizar la regla para incluir www
    aws elbv2 modify-rule --rule-arn $RULE_ARN \
      --region $REGION \
      --conditions '[
        {
          "Field": "host-header",
          "HostHeaderConfig": {
            "Values": ["yaan.com.mx", "www.yaan.com.mx"]
          }
        },
        {
          "Field": "path-pattern",
          "PathPatternConfig": {
            "Values": ["/*"]
          }
        }
      ]' > /dev/null 2>&1

    echo -e "${GREEN}  ✅ Reglas actualizadas para incluir www.yaan.com.mx${NC}"
  else
    echo -e "${GREEN}  ✅ Reglas de ALB correctas${NC}"
  fi
else
  echo -e "${RED}  ⚠️  No se encontró regla de routing - puede requerir configuración manual${NC}"
fi

echo -e "${YELLOW}3. Verificando DNS para www.yaan.com.mx...${NC}"

# Verificar si existe el registro CNAME
DNS_CHECK=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID \
  --query 'ResourceRecordSets[?Name==`www.yaan.com.mx.`].Type' \
  --output text)

if [ -z "$DNS_CHECK" ]; then
  echo -e "${YELLOW}  Creando registro CNAME para www.yaan.com.mx...${NC}"

  aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.yaan.com.mx",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$ALB_DNS'"}]
      }
    }]
  }' > /dev/null 2>&1

  echo -e "${GREEN}  ✅ Registro DNS creado${NC}"
else
  echo -e "${GREEN}  ✅ Registro DNS existe${NC}"
fi

echo -e "${YELLOW}4. Verificando conectividad...${NC}"

# Esperar un momento para que los cambios se apliquen
sleep 3

# Test yaan.com.mx
if curl -I -s -m 5 https://yaan.com.mx | head -1 | grep -q "200"; then
  echo -e "${GREEN}  ✅ yaan.com.mx respondiendo correctamente${NC}"
else
  echo -e "${RED}  ⚠️  yaan.com.mx no responde con 200 OK${NC}"
fi

# Test www.yaan.com.mx (usando IP directamente por si DNS no se ha propagado)
if curl --resolve www.yaan.com.mx:443:44.236.124.174 -I -s -m 5 https://www.yaan.com.mx | head -1 | grep -q "200"; then
  echo -e "${GREEN}  ✅ www.yaan.com.mx respondiendo correctamente${NC}"
else
  echo -e "${YELLOW}  ⚠️  www.yaan.com.mx aún propagando DNS o requiere verificación${NC}"
fi

echo -e "${GREEN}✨ Correcciones post-deploy completadas${NC}"
echo ""
echo "Puedes verificar manualmente con:"
echo "  curl -I https://yaan.com.mx"
echo "  curl -I https://www.yaan.com.mx"