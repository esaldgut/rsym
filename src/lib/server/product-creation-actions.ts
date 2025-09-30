'use server';

import { getIdTokenServer, getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { createProductOfTypeCircuit, createProductOfTypePackage, updateProduct } from '@/lib/graphql/operations';
import { transformProductUrlsToPaths } from '@/lib/utils/s3-url-transformer';
import { runWithAmplifyServerContext } from '@/app/amplify-config-ssr';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import outputs from '../../../amplify/outputs.json';

// COPIANDO EXACTAMENTE EL PATTERN DE package-actions.ts QUE FUNCIONA
interface ServerActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  validationErrors?: Record<string, string>;
}

interface CreateProductResult {
  success: boolean;
  productId?: string;
  productName?: string;
  error?: string;
}

/**
 * Server Action para crear un producto de tipo Circuit
 * COPIANDO EXACTAMENTE EL PATRÓN DE createPackageAction QUE FUNCIONA
 */
export async function createCircuitProductAction(name: string): Promise<CreateProductResult> {
  try {
    // 1. Validar autenticación (EXACTO COMO package-actions.ts)
    const idToken = await getIdTokenServer();
    if (!idToken) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario'
      };
    }

    // 2. Validar permisos de proveedor (EXACTO COMO package-actions.ts)
    const userType = user.attributes?.['custom:user_type'];
    if (userType !== 'provider') {
      console.log('❌ [Server Action] Usuario no es provider:', userType, 'User:', user.username);
      return {
        success: false,
        error: 'Solo los proveedores pueden crear productos'
      };
    }

    // 3. Validar entrada
    if (!name?.trim()) {
      return {
        success: false,
        error: 'El nombre del circuito es requerido'
      };
    }

    console.log('🚀 [Server Action] Creando circuito:', name, 'Usuario:', user.sub);

    // 4. Ejecutar GraphQL directamente usando fetch con AppSync URL y ID token
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        // 1. Obtener la sesión de autenticación con ID token
        const session = await fetchAuthSession(contextSpec);
        
        if (!session.tokens?.idToken) {
          throw new Error('No se encontró ID token en la sesión');
        }

        const idToken = session.tokens.idToken.toString();
        console.log('🔑 ID Token obtenido:', idToken.substring(0, 50) + '...');
        console.log('🚀 AppSync URL:', outputs.data.url);

        // 2. Ejecutar GraphQL directamente con fetch - SIN generateClient
        const response = await fetch(outputs.data.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken,
            'x-api-key': outputs.data.api_key || ''
          },
          body: JSON.stringify({
            query: createProductOfTypeCircuit,
            variables: {
              input: { name: name.trim() }
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const graphqlResult = await response.json();
        console.log('📤 GraphQL Response:', graphqlResult);

        return graphqlResult;
      }
    });

    if (result.errors) {
      console.error('❌ [Server Action] Error en GraphQL:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al ejecutar la operación GraphQL'
      };
    }

    const newProduct = result.data?.createProductOfTypeCircuit;

    if (newProduct?.id) {
      console.log('✅ [Server Action] Circuito creado:', newProduct.id);
      return {
        success: true,
        productId: newProduct.id,
        productName: newProduct.name
      };
    } else {
      console.error('❌ [Server Action] No se recibió ID del producto');
      return {
        success: false,
        error: 'No se pudo obtener el ID del producto creado'
      };
    }

  } catch (error: any) {
    console.error('❌ [Server Action] Error creando circuito:', error);
    return {
      success: false,
      error: error.message || 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para crear un producto de tipo Package
 * COPIANDO EXACTAMENTE EL PATRÓN DE createPackageAction QUE FUNCIONA
 */
export async function createPackageProductAction(name: string): Promise<CreateProductResult> {
  try {
    // 1. Validar autenticación (EXACTO COMO package-actions.ts)
    const idToken = await getIdTokenServer();
    if (!idToken) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario'
      };
    }

    // 2. Validar permisos de proveedor (EXACTO COMO package-actions.ts)
    const userType = user.attributes?.['custom:user_type'];
    if (userType !== 'provider') {
      console.log('❌ [Server Action] Usuario no es provider:', userType, 'User:', user.username);
      return {
        success: false,
        error: 'Solo los proveedores pueden crear productos'
      };
    }

    // 3. Validar entrada
    if (!name?.trim()) {
      return {
        success: false,
        error: 'El nombre del paquete es requerido'
      };
    }

    console.log('🚀 [Server Action] Creando paquete:', name, 'Usuario:', user.sub);

    // 4. Ejecutar GraphQL directamente usando fetch con AppSync URL y ID token
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        // 1. Obtener la sesión de autenticación con ID token
        const session = await fetchAuthSession(contextSpec);
        
        if (!session.tokens?.idToken) {
          throw new Error('No se encontró ID token en la sesión');
        }

        const idToken = session.tokens.idToken.toString();
        console.log('🔑 ID Token obtenido:', idToken.substring(0, 50) + '...');
        console.log('🚀 AppSync URL:', outputs.data.url);

        // 2. Ejecutar GraphQL directamente con fetch - SIN generateClient
        const response = await fetch(outputs.data.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken,
            'x-api-key': outputs.data.api_key || ''
          },
          body: JSON.stringify({
            query: createProductOfTypePackage,
            variables: {
              input: { name: name.trim() }
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const graphqlResult = await response.json();
        console.log('📤 GraphQL Response:', graphqlResult);

        return graphqlResult;
      }
    });

    if (result.errors) {
      console.error('❌ [Server Action] Error en GraphQL:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al ejecutar la operación GraphQL'
      };
    }

    const newProduct = result.data?.createProductOfTypePackage;

    if (newProduct?.id) {
      console.log('✅ [Server Action] Paquete creado:', newProduct.id);
      return {
        success: true,
        productId: newProduct.id,
        productName: newProduct.name
      };
    } else {
      console.error('❌ [Server Action] No se recibió ID del producto');
      return {
        success: false,
        error: 'No se pudo obtener el ID del producto creado'
      };
    }

  } catch (error: any) {
    console.error('❌ [Server Action] Error creando paquete:', error);
    return {
      success: false,
      error: error.message || 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para actualizar un producto existente
 * COPIANDO EXACTAMENTE EL PATRÓN QUE FUNCIONA
 */
export async function updateProductAction(productId: string, updateData: any): Promise<CreateProductResult> {
  try {
    // 1. Validar autenticación (EXACTO COMO LAS OTRAS FUNCIONES)
    const idToken = await getIdTokenServer();
    if (!idToken) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'No se pudo obtener información del usuario'
      };
    }

    // 2. Validar permisos de proveedor
    const userType = user.attributes?.['custom:user_type'];
    if (userType !== 'provider') {
      console.log('❌ [Server Action] Usuario no es provider:', userType, 'User:', user.username);
      return {
        success: false,
        error: 'Solo los proveedores pueden actualizar productos'
      };
    }

    // 3. Validar entrada
    if (!productId?.trim()) {
      return {
        success: false,
        error: 'El ID del producto es requerido'
      };
    }

    console.log('🔄 [Server Action] Actualizando producto:', productId, 'Usuario:', user.sub);

    // 4. Ejecutar GraphQL directamente usando fetch con AppSync URL y ID token
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        // 1. Obtener la sesión de autenticación con ID token
        const session = await fetchAuthSession(contextSpec);
        
        if (!session.tokens?.idToken) {
          throw new Error('No se encontró ID token en la sesión');
        }

        const idToken = session.tokens.idToken.toString();
        console.log('🔑 ID Token obtenido para update:', idToken.substring(0, 50) + '...');
        console.log('🚀 AppSync URL:', outputs.data.url);

        // 2. Función para convertir fechas a formato AWSDateTime
        const normalizeDate = (dateString: string): string => {
          if (!dateString) return dateString;
          
          // Si ya tiene formato ISO completo, devolver tal como está
          if (dateString.includes('T') && dateString.includes(':')) {
            return dateString;
          }
          
          // Si es solo fecha (YYYY-MM-DD), convertir a ISO con UTC
          const date = new Date(dateString + 'T00:00:00.000Z');
          return date.toISOString();
        };

        // 3. Función para normalizar seasons recursivamente
        const normalizeSeasons = (seasons: any[]): any[] => {
          if (!seasons || !Array.isArray(seasons)) return seasons;
          
          return seasons.map(season => ({
            ...season,
            start_date: season.start_date ? normalizeDate(season.start_date) : season.start_date,
            end_date: season.end_date ? normalizeDate(season.end_date) : season.end_date
          }));
        };

        // 4. Preparar input filtrando solo campos permitidos por UpdateProductInput
        // Excluir campos que son solo de output como user_id, created_at, updated_at
        const allowedFields = [
          'name', 'description', 'preferences', 'languages',
          'cover_image_url', 'image_url', 'video_url',
          'seasons', 'planned_hotels_or_similar', 'payment_policy',
          'published', 'destination', 'origin', 'itinerary', 'departures'
        ];

        const filteredData = Object.keys(updateData)
          .filter(key => allowedFields.includes(key))
          .reduce((obj, key) => {
            obj[key] = updateData[key];
            return obj;
          }, {} as any);

        // 5. Normalizar fechas en seasons y filtrar campos no permitidos en input
        if (filteredData.seasons) {
          console.log('📅 Original seasons dates:', filteredData.seasons.map(s => ({
            start_date: s.start_date,
            end_date: s.end_date
          })));

          // Filtrar campos de solo lectura de seasons antes de enviar a GraphQL
          const seasonsAllowedFields = [
            'allotment', 'category', 'start_date', 'end_date', 'schedules',
            'prices', 'aditional_services', 'number_of_nights', 'extra_prices'
          ];

          filteredData.seasons = normalizeSeasons(filteredData.seasons).map((season: any) => {
            const filteredSeason = Object.keys(season)
              .filter(key => seasonsAllowedFields.includes(key))
              .reduce((obj, key) => {
                obj[key] = season[key];
                return obj;
              }, {} as any);

            // Filtrar campos de solo lectura en prices y extra_prices
            if (filteredSeason.prices) {
              filteredSeason.prices = filteredSeason.prices.map((price: any) => {
                const { id, ...priceWithoutId } = price;
                return priceWithoutId;
              });
            }

            if (filteredSeason.extra_prices) {
              filteredSeason.extra_prices = filteredSeason.extra_prices.map((price: any) => {
                const { id, ...priceWithoutId } = price;
                return priceWithoutId;
              });
            }

            return filteredSeason;
          });

          console.log('📅 Normalized and filtered seasons:', filteredData.seasons.map(s => ({
            start_date: s.start_date,
            end_date: s.end_date,
            fields: Object.keys(s)
          })));
        }

        // 6. Mapear departures del formato interno al formato GraphQL según el esquema real
        if (filteredData.departures) {
          console.log('🚀 Original departures (internal format):', JSON.stringify(filteredData.departures, null, 2));

          const graphqlDepartures: any[] = [];

          // Mapear salidas regulares - conservar la estructura actual que funciona
          if (filteredData.departures.regular_departures) {
            filteredData.departures.regular_departures.forEach((regular: any) => {
              if (regular.origin && regular.origin.place) {
                graphqlDepartures.push({
                  origin: [regular.origin],
                  days: regular.days || []
                });
              }
            });
          }

          // Mapear salidas específicas - CORREGIR SEGÚN ESQUEMA GRAPHQL
          // El esquema GraphQL espera: { specific_dates: AWSDateTime[], origin: LocationInput[], days?: WeekDays[] }
          if (filteredData.departures.specific_departures) {
            // Extraer todas las fechas específicas y orígenes
            const allSpecificDates: string[] = [];
            const allOrigins: any[] = [];

            filteredData.departures.specific_departures.forEach((specific: any) => {
              if (specific.origin && specific.origin.place) {
                allOrigins.push(specific.origin);

                // Extraer fechas de los rangos
                if (specific.date_ranges) {
                  specific.date_ranges.forEach((range: any) => {
                    if (range.start_datetime) {
                      // Convertir a formato AWSDateTime completo si es solo fecha
                      const startDate = range.start_datetime.includes('T')
                        ? range.start_datetime
                        : range.start_datetime + 'T00:00:00.000Z';
                      allSpecificDates.push(startDate);
                    }
                    if (range.end_datetime && range.end_datetime !== range.start_datetime) {
                      const endDate = range.end_datetime.includes('T')
                        ? range.end_datetime
                        : range.end_datetime + 'T00:00:00.000Z';
                      allSpecificDates.push(endDate);
                    }
                  });
                }
              }
            });

            // Crear una sola entrada con todas las fechas específicas y orígenes
            if (allSpecificDates.length > 0 && allOrigins.length > 0) {
              graphqlDepartures.push({
                specific_dates: allSpecificDates,
                origin: allOrigins
              });
            }
          }

          filteredData.departures = graphqlDepartures;
          console.log('🚀 Mapped departures (GraphQL format):', JSON.stringify(filteredData.departures, null, 2));
        }

        // 7. Transformar URLs a paths antes de enviar a GraphQL
        const transformedData = transformProductUrlsToPaths(filteredData);

        const filteredInput = {
          id: productId,
          ...transformedData
        };

        console.log('📋 Filtered and transformed input for updateProduct:', JSON.stringify(filteredInput, null, 2));

        // 3. Ejecutar GraphQL directamente con fetch - SIN generateClient
        const response = await fetch(outputs.data.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken,
            'x-api-key': outputs.data.api_key || ''
          },
          body: JSON.stringify({
            query: updateProduct,
            variables: {
              input: filteredInput
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const graphqlResult = await response.json();
        console.log('📤 GraphQL Update Response:', graphqlResult);

        return graphqlResult;
      }
    });

    if (result.errors) {
      console.error('❌ [Server Action] Error en GraphQL update:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al ejecutar la operación GraphQL'
      };
    }

    const updatedProduct = result.data?.updateProduct;

    if (updatedProduct?.id) {
      console.log('✅ [Server Action] Producto actualizado:', updatedProduct.id);
      return {
        success: true,
        productId: updatedProduct.id,
        productName: updatedProduct.name
      };
    } else {
      console.error('❌ [Server Action] No se recibió confirmación del update');
      return {
        success: false,
        error: 'No se pudo confirmar la actualización del producto'
      };
    }

  } catch (error: any) {
    console.error('❌ [Server Action] Error actualizando producto:', error);
    return {
      success: false,
      error: error.message || 'Error interno del servidor'
    };
  }
}
