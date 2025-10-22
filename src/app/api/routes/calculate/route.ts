import { NextRequest, NextResponse } from 'next/server';
import {
  LocationClient,
  CalculateRouteCommand
} from '@aws-sdk/client-location';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';

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
 * Capa 2: AUTORIZACIÓN DE SERVICIO AWS (IAM)
 *   - El servidor usa CREDENCIALES AWS SEPARADAS (no las del usuario)
 *   - SDK usa Default Credential Provider Chain:
 *
 *     EN DESARROLLO LOCAL:
 *     1. Variables de entorno (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 *     2. ~/.aws/credentials file (perfil 'default')
 *     3. ~/.aws/config para región
 *
 *     EN PRODUCCIÓN (ECS FARGATE):
 *     1. ECS Task IAM Role (auto-detectado por SDK)
 *     2. Copilot crea automáticamente el Task Role
 *     3. Sin credenciales hardcodeadas en código
 *
 * BENEFICIOS:
 * ✅ Separación de concerns: Autenticación ≠ Autorización de servicio
 * ✅ Seguridad: Usuarios nunca ven credenciales AWS del servidor
 * ✅ Auditoría: Logs rastrean qué usuario solicitó qué operación
 * ✅ Escalabilidad: Fácil ajustar permisos independientemente
 */
const locationClient = new LocationClient({
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-west-2'
});

const ROUTE_CALCULATOR_NAME = process.env.AWS_ROUTE_CALCULATOR_NAME || 'YaanTourismRouteCalculator';

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

    const calculateResponse = await locationClient.send(calculateCommand);

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
    console.error('Route calculation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Check for specific AWS errors
    if (errorMessage.includes('ResourceNotFoundException')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Route calculator not found. Please check AWS configuration.'
        },
        { status: 404 }
      );
    }

    if (errorMessage.includes('AccessDeniedException')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. Please check AWS credentials.'
        },
        { status: 403 }
      );
    }

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
