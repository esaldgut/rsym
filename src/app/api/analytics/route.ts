import { NextRequest, NextResponse } from 'next/server';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';

/**
 * API Route para Analytics - Fase 1
 * Recibe eventos del cliente y los envía a AWS CloudWatch
 */

// Configuración de AWS CloudWatch
const cloudWatchClient = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: process.env.NODE_ENV === 'production' ? undefined : {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: process.env.NODE_ENV === 'production' ? undefined : {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Configuración
const METRICS_NAMESPACE = 'YAAN/ProductManagement';
const LOG_GROUP_NAME = '/aws/yaan/analytics';
const LOG_STREAM_PREFIX = 'web-events';

interface AnalyticsEvent {
  eventType: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  context: {
    feature: string;
    category: string;
    subcategory?: string;
    userFlow?: {
      previousAction?: string;
      currentAction: string;
      flowId?: string;
    };
    error?: {
      message: string;
      code?: string;
      correlationId?: string;
    };
    performance?: {
      operationTime?: number;
      apiResponseTime?: number;
    };
    metadata?: Record<string, any>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, source, environment } = body;
    
    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid events format' },
        { status: 400 }
      );
    }
    
    // En desarrollo, solo log
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 Analytics Events Received:', {
        count: events.length,
        source,
        environment
      });
      
      events.forEach((event: AnalyticsEvent) => {
        console.log(`  - ${event.eventType}:`, event.context);
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Events logged (development mode)' 
      });
    }
    
    // En producción, enviar a CloudWatch
    const results = await Promise.allSettled([
      sendMetricsToCloudWatch(events),
      sendLogsToCloudWatch(events, source)
    ]);
    
    // Verificar resultados
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some analytics operations failed:', failures);
    }
    
    return NextResponse.json({ 
      success: true,
      processed: events.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    
    // No retornar error 500 para no afectar al cliente
    return NextResponse.json({ 
      success: false,
      message: 'Analytics processing failed'
    }, { status: 202 }); // 202 Accepted - procesaremos después
  }
}

/**
 * Enviar métricas a CloudWatch
 */
async function sendMetricsToCloudWatch(events: AnalyticsEvent[]): Promise<void> {
  const metrics = events.map(event => ({
    MetricName: event.eventType,
    Value: 1,
    Unit: 'Count',
    Timestamp: new Date(event.timestamp),
    Dimensions: [
      { Name: 'Feature', Value: event.context.feature },
      { Name: 'Category', Value: event.context.category },
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' }
    ]
  }));
  
  // CloudWatch permite máximo 20 métricas por request
  const chunks = [];
  for (let i = 0; i < metrics.length; i += 20) {
    chunks.push(metrics.slice(i, i + 20));
  }
  
  for (const chunk of chunks) {
    const command = new PutMetricDataCommand({
      Namespace: METRICS_NAMESPACE,
      MetricData: chunk
    });
    
    await cloudWatchClient.send(command);
  }
}

/**
 * Enviar logs a CloudWatch Logs
 */
async function sendLogsToCloudWatch(events: AnalyticsEvent[], source: string): Promise<void> {
  const logStreamName = `${LOG_STREAM_PREFIX}-${new Date().toISOString().split('T')[0]}`;
  
  // Crear log stream si no existe
  try {
    await cloudWatchLogsClient.send(new CreateLogStreamCommand({
      logGroupName: LOG_GROUP_NAME,
      logStreamName: logStreamName
    }));
  } catch (error: unknown) {
    // Ignorar si ya existe
    const errorName = error instanceof Error && 'name' in error ? (error as any).name : '';
    if (errorName !== 'ResourceAlreadyExistsException') {
      throw error;
    }
  }
  
  // Preparar log events
  const logEvents = events.map(event => ({
    timestamp: new Date(event.timestamp).getTime(),
    message: JSON.stringify({
      eventType: event.eventType,
      sessionId: event.sessionId,
      userId: event.userId,
      source: source,
      context: event.context
    })
  }));
  
  // Enviar logs
  const command = new PutLogEventsCommand({
    logGroupName: LOG_GROUP_NAME,
    logStreamName: logStreamName,
    logEvents: logEvents
  });
  
  await cloudWatchLogsClient.send(command);
}

// GET endpoint para health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'analytics',
    timestamp: new Date().toISOString()
  });
}