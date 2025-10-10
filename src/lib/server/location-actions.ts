'use server';

import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForPositionCommand,
  GetPlaceCommand,
  type SearchPlaceIndexForTextCommandInput,
  type SearchPlaceIndexForTextCommandOutput
} from '@aws-sdk/client-location';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { revalidatePath } from 'next/cache';
import { getIdTokenServer as getIdTokenFromUtils } from '@/utils/amplify-server-utils';
import type { 
  CircuitLocation,
  Location,
  LocationInput,
  Point,
  PointInput,
  SearchOptions, 
  LocationActionResponse,
  AWSLocationPlace,
  SearchResult
} from '@/types/location';

/**
 * Obtiene el ID Token del usuario autenticado desde el servidor
 * Usando el patrón correcto de AWS Amplify Gen 2 v6
 */
async function getIdTokenServer(): Promise<string> {
  const idToken = await getIdTokenFromUtils();

  if (!idToken) {
    throw new Error('No se pudo obtener el ID Token - usuario no autenticado');
  }

  return idToken.toString();
}

// Configuración del cliente AWS Location con credenciales autenticadas
const getLocationClient = async () => {
  const identityPoolId = process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || 'us-west-2:00035e2e-e92f-4e72-a91b-454acba27eec';
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-west-2_e8mS22a1i';
  const region = 'us-west-2';
  
  // Obtener ID Token del usuario autenticado
  const idToken = await getIdTokenServer();
  
  return new LocationClient({
    region,
    credentials: fromCognitoIdentityPool({
      identityPoolId,
      logins: {
        [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken
      },
      clientConfig: { region }
    })
  });
};

/**
 * Convierte la respuesta de AWS Location a CircuitLocation
 */
function convertToCircuitLocation(
  result: SearchResult,
  rawResponse: SearchPlaceIndexForTextCommandOutput
): CircuitLocation {
  const place = result.Place;
  
  // Extraer coordenadas
  const coordinates = place?.Geometry?.Point || [0, 0];
  
  // Construir la ubicación principal
  const mainPlace = place?.Label || result.Text || '';
  
  // Construir ubicación secundaria (ciudad, región, país)
  const placeSub = [
    place?.Address?.Municipality,
    place?.Address?.Region,
    place?.Address?.Country
  ].filter(Boolean).join(', ');
  
  // Descripción complementaria
  const complementaryDescription = [
    place?.Address?.Street,
    place?.Address?.District,
    place?.Address?.PostalCode
  ].filter(Boolean).join(' ');
  
  // Crear objeto CircuitLocation
  const circuitLocation: CircuitLocation = {
    place: mainPlace,
    placeSub: placeSub || undefined,
    complementaryDescription: complementaryDescription || undefined,
    coordinates: coordinates as [number, number],
    amazon_location_service_response: JSON.stringify({
      placeId: result.PlaceId,
      result: result,
      summary: rawResponse.Summary
    })
  };
  
  return circuitLocation;
}

/**
 * Server Action: Búsqueda de lugares por texto
 * Implementa SearchPlaceIndexForText de AWS Location Service
 */
export async function searchPlacesByText(
  searchText: string,
  options: SearchOptions = {}
): Promise<LocationActionResponse> {
  try {
    // Validar entrada
    if (!searchText?.trim()) {
      return {
        success: false,
        error: 'El texto de búsqueda es requerido'
      };
    }
    
    // Obtener cliente de AWS Location con credenciales autenticadas
    const client = await getLocationClient();
    
    // Configurar parámetros de búsqueda
    const commandInput: SearchPlaceIndexForTextCommandInput = {
      IndexName: 'YAANPlaceIndex',
      Text: searchText,
      MaxResults: options.maxResults || 10,
      FilterCountries: options.countries,
      BiasPosition: options.biasPosition,
      FilterBBox: options.filterBBox,
      Language: options.language || 'es'
    };
    
    // Ejecutar búsqueda
    const command = new SearchPlaceIndexForTextCommand(commandInput);
    const response = await client.send(command);
    
    // Validar respuesta
    if (!response.Results || response.Results.length === 0) {
      return {
        success: true,
        locations: [],
        rawResponse: JSON.stringify(response)
      };
    }
    
    // Convertir resultados a CircuitLocation
    const locations: CircuitLocation[] = response.Results.map(result => 
      convertToCircuitLocation(result, response)
    );
    
    // Revalidar cache de búsquedas
    revalidatePath('/location/search');
    
    return {
      success: true,
      locations,
      rawResponse: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error en searchPlacesByText:', error);
    
    // Manejar errores específicos de AWS
    if (error instanceof Error) {
      if (error.name === 'ResourceNotFoundException') {
        return {
          success: false,
          error: 'El índice de lugares no está configurado correctamente'
        };
      }
      if (error.name === 'AccessDeniedException') {
        return {
          success: false,
          error: 'Sin permisos para acceder a AWS Location Service'
        };
      }
      if (error.name === 'ValidationException') {
        return {
          success: false,
          error: 'Parámetros de búsqueda inválidos'
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al buscar lugares'
    };
  }
}

/**
 * Server Action: Búsqueda por coordenadas (Geocodificación inversa)
 */
export async function searchPlacesByCoordinates(
  coordinates: [number, number],
  maxResults: number = 5
): Promise<LocationActionResponse> {
  try {
    // Validar coordenadas
    if (!coordinates || coordinates.length !== 2) {
      return {
        success: false,
        error: 'Las coordenadas son requeridas [longitud, latitud]'
      };
    }
    
    const [lng, lat] = coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return {
        success: false,
        error: 'Coordenadas inválidas'
      };
    }
    
    const client = await getLocationClient();
    
    const command = new SearchPlaceIndexForPositionCommand({
      IndexName: 'YAANPlaceIndex',
      Position: coordinates,
      MaxResults: maxResults,
      Language: 'es'
    });
    
    const response = await client.send(command);
    
    if (!response.Results || response.Results.length === 0) {
      return {
        success: true,
        locations: [],
        rawResponse: JSON.stringify(response)
      };
    }
    
    // Convertir resultados
    const locations: CircuitLocation[] = response.Results.map(result => ({
      place: result.Place?.Label || '',
      placeSub: [
        result.Place?.Address?.Municipality,
        result.Place?.Address?.Region,
        result.Place?.Address?.Country
      ].filter(Boolean).join(', ') || undefined,
      complementaryDescription: result.Place?.Address?.Street || undefined,
      coordinates: result.Place?.Geometry?.Point as [number, number] || coordinates,
      amazon_location_service_response: JSON.stringify(result)
    }));
    
    revalidatePath('/location/geocode');
    
    return {
      success: true,
      locations,
      rawResponse: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error en searchPlacesByCoordinates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al buscar por coordenadas'
    };
  }
}

/**
 * Server Action: Obtener detalles de un lugar específico
 */
export async function getPlaceDetails(
  placeId: string
): Promise<LocationActionResponse> {
  try {
    if (!placeId) {
      return {
        success: false,
        error: 'El ID del lugar es requerido'
      };
    }
    
    const client = await getLocationClient();
    
    const command = new GetPlaceCommand({
      IndexName: 'YAANPlaceIndex',
      PlaceId: placeId,
      Language: 'es'
    });
    
    const response = await client.send(command);
    
    if (!response.Place) {
      return {
        success: false,
        error: 'Lugar no encontrado'
      };
    }
    
    const location: CircuitLocation = {
      id: placeId,
      place: response.Place.Label || '',
      placeSub: [
        response.Place.Address?.Municipality,
        response.Place.Address?.Region,
        response.Place.Address?.Country
      ].filter(Boolean).join(', ') || undefined,
      complementaryDescription: [
        response.Place.Address?.Street,
        response.Place.Address?.District,
        response.Place.Address?.PostalCode
      ].filter(Boolean).join(' ') || undefined,
      coordinates: response.Place.Geometry?.Point as [number, number] || [0, 0],
      amazon_location_service_response: JSON.stringify(response)
    };
    
    return {
      success: true,
      locations: [location],
      rawResponse: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error en getPlaceDetails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener detalles del lugar'
    };
  }
}

/**
 * Server Action: Validar una dirección
 */
export async function validateAddress(
  address: string,
  country?: string
): Promise<LocationActionResponse> {
  try {
    // Buscar la dirección con filtro de país si se proporciona
    const searchOptions: SearchOptions = {
      maxResults: 1,
      countries: country ? [country] : undefined
    };
    
    const result = await searchPlacesByText(address, searchOptions);
    
    if (!result.success) {
      return result;
    }
    
    // Si no se encontraron resultados, la dirección no es válida
    if (!result.locations || result.locations.length === 0) {
      return {
        success: false,
        error: 'No se pudo validar la dirección proporcionada'
      };
    }
    
    // Retornar el primer resultado como dirección validada
    return {
      success: true,
      locations: [result.locations[0]],
      rawResponse: result.rawResponse
    };
    
  } catch (error) {
    console.error('Error en validateAddress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al validar dirección'
    };
  }
}