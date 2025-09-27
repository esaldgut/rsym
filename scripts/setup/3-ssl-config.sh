#!/bin/bash

echo "🔐 CONFIGURANDO CERTIFICADOS SSL"
echo "==============================="

DOMAIN="yaan.com.mx"
REGION="us-west-2"
HOSTED_ZONE_ID="Z01441381BYM7F3YGIDHZ"

# 1. Verificar certificados existentes
echo "🔍 Verificando certificados existentes..."
EXISTING_CERTS=$(aws acm list-certificates --region $REGION --query 'CertificateSummaryList[?DomainName==`'$DOMAIN'` || DomainName==`*.'$DOMAIN'`]')

if [ "$(echo $EXISTING_CERTS | jq length)" -gt 0 ]; then
    echo "✅ Certificados existentes encontrados:"
    echo $EXISTING_CERTS | jq -r '.[] | "- \(.DomainName) (\(.CertificateArn))"'
else
    echo "📜 Solicitando nuevo certificado..."
    
    # Solicitar certificado wildcard
    CERT_ARN=$(aws acm request-certificate \
        --domain-name $DOMAIN \
        --subject-alternative-names "*.$DOMAIN" \
        --validation-method DNS \
        --region $REGION \
        --query 'CertificateArn' \
        --output text)
    
    echo "✅ Certificado solicitado: $CERT_ARN"
    
    # Esperar y obtener registros de validación
    echo "⏳ Esperando registros de validación..."
    sleep 10
    
    VALIDATION_RECORDS=$(aws acm describe-certificate \
        --certificate-arn $CERT_ARN \
        --region $REGION \
        --query 'Certificate.DomainValidationOptions[].ResourceRecord')
    
    echo "📋 Registros de validación DNS:"
    echo $VALIDATION_RECORDS | jq -r '.[] | "Name: \(.Name)\nType: \(.Type)\nValue: \(.Value)\n"'
    
    # Crear registros de validación automáticamente
    for record in $(echo $VALIDATION_RECORDS | jq -c '.[]'); do
        NAME=$(echo $record | jq -r '.Name')
        TYPE=$(echo $record | jq -r '.Type')
        VALUE=$(echo $record | jq -r '.Value')
        
        aws route53 change-resource-record-sets \
            --hosted-zone-id $HOSTED_ZONE_ID \
            --change-batch '{
                "Changes": [{
                    "Action": "CREATE",
                    "ResourceRecordSet": {
                        "Name": "'$NAME'",
                        "Type": "'$TYPE'",
                        "TTL": 300,
                        "ResourceRecords": [{"Value": "'$VALUE'"}]
                    }
                }]
            }'
    done
    
    echo "✅ Registros de validación creados"
fi

echo ""
echo "🔐 CERTIFICADOS SSL CONFIGURADOS"
