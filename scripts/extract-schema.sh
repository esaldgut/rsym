#!/bin/bash

API_ID="czuxavss35b2di5syqrs256i6q"
REGION="us-west-2"

echo "📥 EXTRAYENDO SCHEMA GRAPHQL DE APPSYNC"
echo "======================================"

# Crear directorio para schemas
mkdir -p schemas

# Obtener schema en formato SDL
echo "📋 Descargando schema SDL..."
aws appsync get-introspection-schema \
    --api-id $API_ID \
    --format SDL \
    --region $REGION \
    --output text schemas/schema-raw.graphql

# Limpiar directivas de AWS
echo "🧹 Limpiando directivas de AWS..."
npx tsx scripts/clean-aws-directives.ts

# Mover schema limpiado
mv schemas/schema-cleaned.graphql schemas/schema.graphql

echo "✅ Schema descargado y limpiado: schemas/schema.graphql"
