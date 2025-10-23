import { NextRequest, NextResponse } from 'next/server';
import {
  LocationClient,
  CalculateRouteCommand
} from '@aws-sdk/client-location';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { getAuthenticatedUser, getIdTokenServer } from '@/utils/amplify-server-utils';
import config from '../../../../../amplify/outputs.json';

/**
 * AWS Location Service Client - Configuración de Credenciales
 *
 * ARQUITECTURA DE SEGURIDAD DE DOS CAPAS:
 *
 * Capa 1: AUTENTICACIÓN DE USUARIO (JWT)
 *   - Usuarios se autentican con Cognito User Pool
 *   - API route valida JWT antes de procesar requests
 *   - Implementado en el handler POST más abajo
 *
 * Capa 2: AUTORIZACIÓN DE SERVICIO AWS (IAM vía Cognito Identity Pool)
 *   - PATTERN: Cognito Identity Pool credentials (igual que s3-actions.ts)
 *   - SDK intercambia ID Token del usuario por credenciales temporales de AWS
 *   - El Cognito Identity Pool Authenticated Role tiene permisos para geo:CalculateRoute
 *
 *   FLUJO DE CREDENCIALES:
 *   1. Usuario autenticado → ID Token del Cognito User Pool
 *   2. SDK intercambia ID Token → Credenciales temporales del Identity Pool
 *   3. Credenciales temporales → Acceso a AWS Location Service
 *   4. SDK auto-refresca credenciales cuando expiran (usando el ID Token)
 *
 *   EN DESARROLLO Y PRODUCCIÓN:
 *   - Mismo patrón funciona en ambos ambientes
 *   - No requiere ~/.aws/credentials ni variables de entorno
 *   - Auto-refresh automático por el SDK
 *   - Credenciales de corta duración (1 hora, renovables)
 *
 * BENEFICIOS:
 * ✅ Auto-refresh automático: SDK maneja expiración transparentemente
 * ✅ Consistencia: Mismo pattern que s3-actions.ts
 * ✅ Sin archivos externos: No depende de ~/.aws/credentials
 * ✅ Seguridad: Credenciales temporales de corta duración
 * ✅ Auditoría: Logs rastrean qué usuario solicitó qué operación
 * ✅ Simplicidad: Funciona igual en dev y producción
 */

const ROUTE_CALCULATOR_NAME = process.env.AWS_ROUTE_CALCULATOR_NAME || 'YaanTourismRouteCalculator';
const AWS_REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-west-2';

/**
 * Obtiene un LocationClient con credenciales del Cognito Identity Pool
 * PATTERN: Idéntico a getS3Client() en s3-actions.ts para consistencia
 *
 * Este patrón utiliza el ID Token del usuario autenticado para obtener
 * credenciales temporales del Cognito Identity Pool, que luego se usan
 * para acceder a AWS Location Service.
 *
 * BENEFICIO CLAVE: El SDK AWS auto-refresca las credenciales cuando expiran,
 * eliminando completamente el problema de "ExpiredTokenException".
 */
async function getLocationClient(): Promise<LocationClient> {
  console.log('[API /api/routes/calculate] 🔑 Creando LocationClient con Cognito Identity Pool...');

  const idToken = await getIdTokenServer();

  if (!idToken) {
    throw new Error('Token de autenticación requerido para calcular rutas');
  }

  console.log('[API /api/routes/calculate] ✅ ID Token obtenido, intercambiando por credenciales AWS...');

  return new LocationClient({
    region: config.auth.aws_region,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: config.auth.aws_region }),
      identityPoolId: config.auth.identity_pool_id,
      logins: {
        [`cognito-idp.${config.auth.aws_region}.amazonaws.com/${config.auth.user_pool_id}`]: idToken
      }
    })
  });
}

/**
 * Ejecuta un comando de AWS con retry logic para robustez adicional
 *
 * NOTA: Con el patrón de Cognito Identity Pool, el auto-refresh automático
 * hace que los errores de token expirado sean extremadamente raros. Esta
 * función de retry se mantiene como capa adicional de seguridad, pero en
 * la práctica ya no debería ser necesaria.
 *
 * @param command - Comando de AWS Location Service a ejecutar
 * @param maxAttempts - Número máximo de intentos (default: 2)
 * @returns Resultado del comando
 */
async function executeWithRetry<TOutput>(
  command: CalculateRouteCommand,
  maxAttempts = 2
): Promise<TOutput> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[API /api/routes/calculate] 🔄 Intento ${attempt}/${maxAttempts} de ejecutar comando...`);

      // Crear cliente fresco en cada intento (garantiza credenciales actualizadas)
      const client = await getLocationClient();
      const result = await client.send(command);

      console.log(`[API /api/routes/calculate] ✅ Comando ejecutado exitosamente en intento ${attempt}`);
      return result as TOutput;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      const errorMessage = lastError.message;

      // Detectar errores de credenciales expiradas
      const isTokenExpired =
        errorMessage.includes('security token included in the request is expired') ||
        errorMessage.includes('The security token') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('ExpiredToken');

      console.error(`[API /api/routes/calculate] ❌ Error en intento ${attempt}:`, {
        message: errorMessage,
        isTokenExpired,
        willRetry: isTokenExpired && attempt < maxAttempts
      });

      // Si es error de token expirado Y aún tenemos intentos, reintentar
      if (isTokenExpired && attempt < maxAttempts) {
        console.log(`[API /api/routes/calculate] 🔁 Token expirado detectado, reintentando con credenciales frescas...`);
        // Esperar 500ms antes de reintentar (dar tiempo al SDK para refresh)
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      // Si no es error de token O ya no quedan intentos, lanzar el error
      throw lastError;
    }
  }

  // Esto no debería alcanzarse nunca, pero TypeScript lo requiere
  throw lastError || new Error('Max attempts reached without success');
}

interface Waypoint {
  position: [number, number]; // [longitude, latitude]
  place?: string;
  placeSub?: string;
}

interface RouteCalculationRequest {
  waypoints: Waypoint[];
  optimize?: boolean;
  travelMode?: 'Car' | 'Truck' | 'Walking';
}

interface RouteCalculationResponse {
  success: boolean;
  data?: {
    totalDistance: number; // in kilometers
    totalDuration: number; // in seconds
    routeGeometry: Array<[number, number]>; // polyline coordinates
    optimizedOrder?: number[]; // optimized waypoint order if optimization was requested
    waypoints: Array<{
      position: [number, number];
      place?: string;
      placeSub?: string;
      arrivalTime?: string;
    }>;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<RouteCalculationResponse>> {
  try {
    // ========================================================================
    // PASO 1: AUTENTICACIÓN - Validar JWT del Usuario (Cognito User Pool)
    // ========================================================================
    console.log('[API /api/routes/calculate] 🔐 Validando autenticación JWT...');

    const user = await getAuthenticatedUser();

    if (!user) {
      console.log('[API /api/routes/calculate] ❌ Usuario no autenticado - rechazando request');
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado. Por favor inicia sesión para calcular rutas.'
        },
        { status: 401 }
      );
    }

    console.log('[API /api/routes/calculate] ✅ Usuario autenticado:', {
      userId: user.userId,
      userType: user.userType,
      email: user.attributes?.email || 'N/A'
    });

    // ========================================================================
    // PASO 2: AUTORIZACIÓN - Verificar permisos (todos los usuarios pueden calcular rutas)
    // ========================================================================
    // NOTA: A diferencia de los endpoints de upload, el cálculo de rutas está
    // disponible para todos los tipos de usuario autenticados (admin, provider,
    // influencer, traveler). No se requiere aprobación especial.
    console.log('[API /api/routes/calculate] ✅ Usuario autorizado para calcular rutas');

    // ========================================================================
    // PASO 3: PROCESAMIENTO - Calcular ruta usando credenciales AWS del servidor
    // ========================================================================
    // Parse request body
    const body: RouteCalculationRequest = await request.json();
    const { waypoints, optimize = false, travelMode = 'Car' } = body;

    // Validate waypoints
    if (!waypoints || waypoints.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least 2 waypoints are required'
        },
        { status: 400 }
      );
    }

    // Validate coordinates format
    const invalidWaypoint = waypoints.find(
      (wp) =>
        !Array.isArray(wp.position) ||
        wp.position.length !== 2 ||
        typeof wp.position[0] !== 'number' ||
        typeof wp.position[1] !== 'number'
    );

    if (invalidWaypoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid waypoint coordinates format. Expected [longitude, latitude]'
        },
        { status: 400 }
      );
    }

    console.log('[API /api/routes/calculate] 🗺️ Calculando ruta para', waypoints.length, 'waypoints usando AWS Location Service');

    // NOTE: OptimizeWaypointsCommand no está disponible en @aws-sdk/client-location v3.873.0
    // Por ahora, usamos los waypoints en el orden proporcionado
    const waypointsToUse = waypoints;

    // Calculate route through all waypoints
    const departurePosition = waypointsToUse[0].position;
    const destinationPosition = waypointsToUse[waypointsToUse.length - 1].position;
    const intermediateWaypoints = waypointsToUse
      .slice(1, -1)
      .map((wp) => wp.position);

    console.log('[API /api/routes/calculate] Route params:', {
      departure: departurePosition,
      destination: destinationPosition,
      intermediates: intermediateWaypoints.length,
      calculator: ROUTE_CALCULATOR_NAME
    });

    const calculateCommand = new CalculateRouteCommand({
      CalculatorName: ROUTE_CALCULATOR_NAME,
      DeparturePosition: departurePosition,
      DestinationPosition: destinationPosition,
      ...(intermediateWaypoints.length > 0 && { WaypointPositions: intermediateWaypoints }),
      TravelMode: travelMode,
      IncludeLegGeometry: true,
      DistanceUnit: 'Kilometers',
      DepartNow: true
    });

    // Execute with automatic retry on token expiration
    const calculateResponse = await executeWithRetry(calculateCommand);

    // Extract route geometry from all legs
    const routeGeometry: Array<[number, number]> = [];
    let totalDistance = 0;
    let totalDuration = 0;

    if (calculateResponse.Legs) {
      calculateResponse.Legs.forEach((leg) => {
        if (leg.Geometry?.LineString) {
          routeGeometry.push(...(leg.Geometry.LineString as Array<[number, number]>));
        }
        totalDistance += leg.Distance || 0;
        totalDuration += leg.DurationSeconds || 0;
      });
    }

    // Build response waypoints with metadata
    const responseWaypoints = waypointsToUse.map((wp, index) => ({
      position: wp.position,
      place: wp.place,
      placeSub: wp.placeSub,
      arrivalTime: index > 0 ? new Date(Date.now() + index * 3600000).toISOString() : undefined // Example arrival times
    }));

    console.log('[API /api/routes/calculate] Route calculated successfully:', {
      distance: Math.round(totalDistance * 10) / 10,
      duration: Math.round(totalDuration),
      geometryPoints: routeGeometry.length
    });

    return NextResponse.json({
      success: true,
      data: {
        totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal
        totalDuration: Math.round(totalDuration),
        routeGeometry,
        waypoints: responseWaypoints
      }
    });
  } catch (error) {
    console.error('[API /api/routes/calculate] ❌ Route calculation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    console.error('[API /api/routes/calculate] Error details:', {
      name: errorName,
      message: errorMessage,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined
    });

    // Check for specific AWS errors
    if (errorMessage.includes('ResourceNotFoundException')) {
      console.error('[API /api/routes/calculate] 🔍 ResourceNotFoundException - Route calculator no encontrado');
      return NextResponse.json(
        {
          success: false,
          error: 'Route calculator not found. Please check AWS configuration.'
        },
        { status: 404 }
      );
    }

    if (errorMessage.includes('AccessDeniedException')) {
      console.error('[API /api/routes/calculate] 🔒 AccessDeniedException - Acceso denegado');
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. Please check AWS credentials.'
        },
        { status: 403 }
      );
    }

    // Check for 400 km distance limit error (Esri DataSource)
    if (errorMessage.includes('400 km') || errorMessage.includes('distance between all route positions')) {
      console.error('[API /api/routes/calculate] 📏 Distance limit exceeded - 400 km limit de Esri');
      return NextResponse.json(
        {
          success: false,
          error: 'La distancia total del circuito excede el límite de 400 km para cálculo de rutas. El mapa mostrará una aproximación con líneas rectas.',
          errorCode: 'DISTANCE_LIMIT_EXCEEDED',
          limit: 400
        },
        { status: 400 }
      );
    }

    // Check for token expiration errors (should be rare after retry logic)
    if (errorMessage.includes('security token') || errorMessage.includes('expired') || errorMessage.includes('ExpiredToken')) {
      console.error('[API /api/routes/calculate] ⏰ Token expiration error después de reintentos - esto es inesperado');
      return NextResponse.json(
        {
          success: false,
          error: 'AWS credentials expired and could not be refreshed. Please try again.',
          errorCode: 'CREDENTIALS_EXPIRED'
        },
        { status: 500 }
      );
    }

    // Generic error
    console.error('[API /api/routes/calculate] ⚠️ Error genérico no categorizado');
    return NextResponse.json(
      {
        success: false,
        error: `Route calculation failed: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
