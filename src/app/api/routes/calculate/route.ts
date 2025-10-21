import { NextRequest, NextResponse } from 'next/server';
import {
  LocationClient,
  CalculateRouteCommand,
  OptimizeWaypointsCommand
} from '@aws-sdk/client-location';

// Initialize AWS Location Service client
const locationClient = new LocationClient({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
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

    let optimizedWaypointOrder: number[] | undefined;
    let waypointsToUse = waypoints;

    // Optimize waypoints if requested and more than 2 waypoints
    if (optimize && waypoints.length > 2) {
      try {
        const startPosition = waypoints[0].position;
        const endPosition = waypoints[waypoints.length - 1].position;
        const middleWaypoints = waypoints.slice(1, -1);

        if (middleWaypoints.length > 0) {
          const optimizeCommand = new OptimizeWaypointsCommand({
            CalculatorName: ROUTE_CALCULATOR_NAME,
            DeparturePosition: startPosition,
            DestinationPosition: endPosition,
            WaypointPositions: middleWaypoints.map((wp) => wp.position),
            TravelMode: travelMode,
            OptimizeFor: 'FastestRoute'
          });

          const optimizeResponse = await locationClient.send(optimizeCommand);

          if (optimizeResponse.OptimizedWaypoints) {
            // Reconstruct waypoints in optimized order
            optimizedWaypointOrder = optimizeResponse.OptimizedWaypoints.map((ow) => {
              const originalIndex = middleWaypoints.findIndex(
                (wp) => wp.position[0] === ow.Position![0] && wp.position[1] === ow.Position![1]
              );
              return originalIndex + 1; // +1 because we excluded the first waypoint
            });

            waypointsToUse = [
              waypoints[0],
              ...optimizeResponse.OptimizedWaypoints.map((ow, index) => ({
                position: ow.Position as [number, number],
                place: middleWaypoints[optimizedWaypointOrder![index] - 1]?.place,
                placeSub: middleWaypoints[optimizedWaypointOrder![index] - 1]?.placeSub
              })),
              waypoints[waypoints.length - 1]
            ];
          }
        }
      } catch (optimizeError) {
        console.error('Waypoint optimization failed, using original order:', optimizeError);
        // Continue with original order if optimization fails
      }
    }

    // Calculate route through all waypoints
    const departurePosition = waypointsToUse[0].position;
    const destinationPosition = waypointsToUse[waypointsToUse.length - 1].position;
    const intermediateWaypoints = waypointsToUse
      .slice(1, -1)
      .map((wp) => wp.position);

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

    return NextResponse.json({
      success: true,
      data: {
        totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal
        totalDuration: Math.round(totalDuration),
        routeGeometry,
        ...(optimizedWaypointOrder && { optimizedOrder: optimizedWaypointOrder }),
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
