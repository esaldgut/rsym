#!/bin/bash

echo "🔧 CORRIGIENDO ROLLBACK Y RE-DESPLEGANDO"
echo "======================================="

SERVICE_NAME="nextjs-dev"
ENV_NAME="dev"
APP_NAME="yaan-dev"
STACK_NAME="yaan-dev-dev-nextjs-dev"

# 1. Verificar estado del stack
echo "📊 Verificando estado del stack..."
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region us-west-2 --query "Stacks[0].StackStatus" --output text 2>/dev/null)

echo "Estado actual: $STACK_STATUS"

if [ "$STACK_STATUS" = "UPDATE_ROLLBACK_FAILED" ]; then
    echo ""
    echo "⚠️  Stack en UPDATE_ROLLBACK_FAILED - necesita continuar el rollback"
    echo ""
    echo "🔧 Continuando rollback..."

    # Continuar el rollback para salir del estado fallido
    aws cloudformation continue-update-rollback \
        --stack-name $STACK_NAME \
        --region us-west-2

    echo "⏳ Esperando que el rollback complete..."

    # Esperar hasta que el rollback termine
    while true; do
        CURRENT_STATUS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region us-west-2 --query "Stacks[0].StackStatus" --output text 2>/dev/null)
        echo "  Estado: $CURRENT_STATUS"

        if [ "$CURRENT_STATUS" = "UPDATE_ROLLBACK_COMPLETE" ]; then
            echo "✅ Rollback completado exitosamente"
            break
        elif [ "$CURRENT_STATUS" = "UPDATE_ROLLBACK_FAILED" ]; then
            echo "❌ El rollback falló nuevamente"
            echo ""
            echo "🔧 Intentando skip de recursos problemáticos..."

            # Obtener recursos fallidos
            FAILED_RESOURCES=$(aws cloudformation list-stack-resources \
                --stack-name $STACK_NAME \
                --region us-west-2 \
                --query "StackResourceSummaries[?ResourceStatus=='UPDATE_FAILED'].LogicalResourceId" \
                --output text)

            if [ ! -z "$FAILED_RESOURCES" ]; then
                echo "  Recursos fallidos: $FAILED_RESOURCES"

                # Continuar rollback saltando recursos fallidos
                aws cloudformation continue-update-rollback \
                    --stack-name $STACK_NAME \
                    --region us-west-2 \
                    --resources-to-skip $FAILED_RESOURCES

                echo "⏳ Esperando rollback con skip..."
                sleep 30
            fi
        fi

        sleep 10
    done

elif [ "$STACK_STATUS" = "ROLLBACK_COMPLETE" ]; then
    echo ""
    echo "⚠️  Stack en ROLLBACK_COMPLETE - necesita eliminarse primero"
    echo ""

    read -p "¿Eliminar stack fallido y recrear? (y/n): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Eliminando stack fallido..."

        # Eliminar stack de CloudFormation
        aws cloudformation delete-stack --stack-name $STACK_NAME --region us-west-2

        echo "⏳ Esperando eliminación del stack..."
        aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME --region us-west-2

        if [ $? -eq 0 ]; then
            echo "✅ Stack eliminado correctamente"
        else
            echo "❌ Error eliminando stack"
            echo "Puedes eliminar manualmente en la consola de CloudFormation"
            exit 1
        fi
    else
        echo "❌ Cancelado por usuario"
        exit 1
    fi
fi

echo ""
echo "🚀 Desplegando servicio con configuración corregida..."
echo "├── Health check: /api/health"
echo "├── CPU: 2048 (2 vCPUs)"
echo "├── Memory: 6144 (6GB)"
echo "├── Grace period: 180s"
echo "└── Timeout: 10s"
echo ""

~/bin/copilot svc deploy --name $SERVICE_NAME --env $ENV_NAME

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ¡DESPLIEGUE EXITOSO!"
    echo ""
    echo "🌐 URLs disponibles:"
    echo "├── https://yaan.com.mx"
    echo "├── https://www.yaan.com.mx"
    echo "└── Health check: https://yaan.com.mx/api/health"
    echo ""

    echo "📊 Verificando servicio..."
    sleep 30

    echo "✅ Estado del servicio:"
    ~/bin/copilot svc status --name $SERVICE_NAME || echo "⏳ Servicio aún iniciando..."

    echo ""
    echo "🔍 Para testar el health check:"
    echo "curl https://yaan.com.mx/api/health"

else
    echo ""
    echo "❌ Error en el despliegue"
    echo ""
    echo "🔧 Para debugging:"
    echo "1. Ver logs:"
    echo "   ~/bin/copilot svc logs --name $SERVICE_NAME --env $ENV_NAME"
    echo ""
    echo "2. Verificar health check localmente:"
    echo "   # En otra terminal:"
    echo "   yarn dev"
    echo "   curl http://localhost:3000/api/health"
    echo ""
    echo "3. Verificar stack:"
    echo "   aws cloudformation describe-stack-events --stack-name $STACK_NAME --region us-west-2"
fi