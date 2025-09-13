/**
 * Configuración de AWS CloudWatch para Analytics - Fase 1
 * Este archivo contiene las configuraciones y scripts necesarios para
 * crear los recursos de CloudWatch en AWS
 */

export const cloudWatchConfig = {
  region: 'us-west-2',
  
  // Log Group Configuration
  logGroup: {
    name: '/aws/yaan/analytics',
    retentionInDays: 30, // 30 días de retención para Fase 1
    kmsKeyId: undefined, // Opcional: KMS key para encriptación
  },
  
  // Metrics Configuration
  metrics: {
    namespace: 'YAAN/ProductManagement',
    
    // Métricas predefinidas para Fase 1
    metricDefinitions: [
      {
        name: 'ProductDeletionSuccess',
        unit: 'Count',
        description: 'Número de productos eliminados exitosamente'
      },
      {
        name: 'ProductDeletionError',
        unit: 'Count', 
        description: 'Número de errores al eliminar productos'
      },
      {
        name: 'FilterChangeSuccess',
        unit: 'Count',
        description: 'Cambios de filtro exitosos'
      },
      {
        name: 'InfiniteScrollTrigger',
        unit: 'Count',
        description: 'Activaciones de scroll infinito'
      },
      {
        name: 'DataRefresh',
        unit: 'Count',
        description: 'Actualizaciones de datos'
      },
      {
        name: 'OperationLatency',
        unit: 'Milliseconds',
        description: 'Latencia de operaciones'
      }
    ],
    
    // Dimensiones comunes
    commonDimensions: [
      { name: 'Environment', value: process.env.NODE_ENV || 'development' },
      { name: 'Application', value: 'ProductManagement' },
      { name: 'Version', value: '1.0.0' }
    ]
  },
  
  // CloudWatch Dashboard Configuration
  dashboard: {
    name: 'YAAN-ProductManagement-Analytics',
    widgets: [
      {
        type: 'metric',
        title: 'Operaciones Exitosas',
        metrics: [
          'ProductDeletionSuccess',
          'FilterChangeSuccess',
          'DataRefresh'
        ],
        stat: 'Sum',
        period: 300 // 5 minutos
      },
      {
        type: 'metric',
        title: 'Errores',
        metrics: [
          'ProductDeletionError'
        ],
        stat: 'Sum',
        period: 300
      },
      {
        type: 'metric',
        title: 'Performance',
        metrics: [
          'OperationLatency'
        ],
        stat: 'Average',
        period: 300
      },
      {
        type: 'log',
        title: 'Recent Events',
        logGroup: '/aws/yaan/analytics',
        queryString: 'fields @timestamp, eventType, context.feature, context.category | sort @timestamp desc | limit 100'
      }
    ]
  },
  
  // CloudWatch Alarms Configuration
  alarms: [
    {
      name: 'HighErrorRate',
      description: 'Alerta cuando hay muchos errores',
      metricName: 'ProductDeletionError',
      threshold: 10,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      period: 300,
      statistic: 'Sum'
    },
    {
      name: 'HighLatency',
      description: 'Alerta cuando la latencia es alta',
      metricName: 'OperationLatency',
      threshold: 5000, // 5 segundos
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300,
      statistic: 'Average'
    }
  ]
};

/**
 * Script para crear recursos en AWS (ejecutar con AWS CLI o SDK)
 */
export const createCloudWatchResources = `
#!/bin/bash

# Variables
REGION="us-west-2"
LOG_GROUP="/aws/yaan/analytics"
NAMESPACE="YAAN/ProductManagement"
DASHBOARD_NAME="YAAN-ProductManagement-Analytics"

# Crear Log Group
aws logs create-log-group \\
  --log-group-name $LOG_GROUP \\
  --region $REGION

# Configurar retención
aws logs put-retention-policy \\
  --log-group-name $LOG_GROUP \\
  --retention-in-days 30 \\
  --region $REGION

# Crear Dashboard
aws cloudwatch put-dashboard \\
  --dashboard-name $DASHBOARD_NAME \\
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["'$NAMESPACE'", "ProductDeletionSuccess", {"stat": "Sum"}],
            [".", "FilterChangeSuccess", {"stat": "Sum"}],
            [".", "DataRefresh", {"stat": "Sum"}]
          ],
          "period": 300,
          "stat": "Sum",
          "region": "'$REGION'",
          "title": "Operaciones Exitosas"
        }
      },
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["'$NAMESPACE'", "ProductDeletionError", {"stat": "Sum"}]
          ],
          "period": 300,
          "stat": "Sum",
          "region": "'$REGION'",
          "title": "Errores"
        }
      },
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["'$NAMESPACE'", "OperationLatency", {"stat": "Average"}]
          ],
          "period": 300,
          "stat": "Average",
          "region": "'$REGION'",
          "title": "Latencia Promedio",
          "yAxis": {
            "left": {
              "min": 0
            }
          }
        }
      }
    ]
  }' \\
  --region $REGION

# Crear Alarma para errores
aws cloudwatch put-metric-alarm \\
  --alarm-name "YAAN-HighErrorRate" \\
  --alarm-description "Alta tasa de errores en Product Management" \\
  --metric-name ProductDeletionError \\
  --namespace $NAMESPACE \\
  --statistic Sum \\
  --period 300 \\
  --threshold 10 \\
  --comparison-operator GreaterThanThreshold \\
  --evaluation-periods 1 \\
  --region $REGION

# Crear Alarma para latencia
aws cloudwatch put-metric-alarm \\
  --alarm-name "YAAN-HighLatency" \\
  --alarm-description "Alta latencia en operaciones" \\
  --metric-name OperationLatency \\
  --namespace $NAMESPACE \\
  --statistic Average \\
  --period 300 \\
  --threshold 5000 \\
  --comparison-operator GreaterThanThreshold \\
  --evaluation-periods 2 \\
  --region $REGION

echo "CloudWatch resources created successfully!"
`;

/**
 * IAM Policy necesaria para el servicio
 */
export const iamPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams'
      ],
      Resource: 'arn:aws:logs:us-west-2:*:log-group:/aws/yaan/analytics:*'
    },
    {
      Effect: 'Allow',
      Action: [
        'cloudwatch:PutMetricData'
      ],
      Resource: '*',
      Condition: {
        StringEquals: {
          'cloudwatch:namespace': 'YAAN/ProductManagement'
        }
      }
    }
  ]
};