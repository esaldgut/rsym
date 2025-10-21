'use server';

import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { createProductOfTypeCircuit, createProductOfTypePackage, updateProduct } from '@/lib/graphql/operations';
import { transformProductUrlsToPaths } from '@/lib/utils/s3-url-transformer';
import { getGraphQLClientWithIdToken, debugIdTokenClaims } from './amplify-graphql-client';
import type { Schema } from '@/amplify/data/resource';
import type {
  CreateProductOfTypeCircuitMutation,
  CreateProductOfTypePackageMutation,
  UpdateProductMutation,
  UpdateProductInput
} from '@/generated/graphql';

// COPIANDO EXACTAMENTE EL PATTERN DE package-actions.ts QUE FUNCIONA
// EXTENDED: Soporte para errores parciales de GraphQL
interface ServerActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  validationErrors?: Record<string, string>;
  // Warnings para errores parciales de GraphQL (data exists pero con errores)
  warnings?: Array<{
    message: string;
    path?: readonly (string | number)[];
    extensions?: Record<string, unknown>;
  }>;
  hasPartialData?: boolean;
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
    // 1. Validar autenticación
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

    // 3. Debug de claims del idToken (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await debugIdTokenClaims();
    }

    // 4. Crear cliente GraphQL con idToken (necesario para validación de permisos en AppSync)
    const client = await getGraphQLClientWithIdToken();

    // 5. Ejecutar mutación GraphQL (el idToken ya está configurado en el cliente)
    const result = await client.graphql({
      query: createProductOfTypeCircuit,
      variables: {
        input: { name: name.trim() }
      }
    });

    // ⚡ MANEJO ROBUSTO DE ERRORES PARCIALES DE GRAPHQL
    const newProduct = result.data?.createProductOfTypeCircuit;

    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ [Server Action] GraphQL retornó errores al crear circuito:',
        result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      );

      // Si el producto se creó (tenemos ID), es éxito con warnings
      if (newProduct?.id) {
        console.log('✅ [Server Action] Circuito creado con warnings:', newProduct.id);
        return {
          success: true,
          productId: newProduct.id,
          productName: newProduct.name
        };
      }

      // Si NO se creó el producto, es un error completo
      console.error('❌ [Server Action] Error en GraphQL sin producto creado:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al ejecutar la operación GraphQL'
      };
    }

    // Caso normal: producto creado sin errores
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

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error creando circuito:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para crear un producto de tipo Package
 * COPIANDO EXACTAMENTE EL PATRÓN DE createPackageAction QUE FUNCIONA
 */
export async function createPackageProductAction(name: string): Promise<CreateProductResult> {
  try {
    // 1. Validar autenticación
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

    // 3. Debug de claims del idToken (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await debugIdTokenClaims();
    }

    // 4. Crear cliente GraphQL con idToken (necesario para validación de permisos en AppSync)
    const client = await getGraphQLClientWithIdToken();

    // 5. Ejecutar mutación GraphQL (el idToken ya está configurado en el cliente)
    const result = await client.graphql({
      query: createProductOfTypePackage,
      variables: {
        input: { name: name.trim() }
      }
    });

    // ⚡ MANEJO ROBUSTO DE ERRORES PARCIALES DE GRAPHQL
    const newProduct = result.data?.createProductOfTypePackage;

    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ [Server Action] GraphQL retornó errores al crear paquete:',
        result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      );

      // Si el producto se creó (tenemos ID), es éxito con warnings
      if (newProduct?.id) {
        console.log('✅ [Server Action] Paquete creado con warnings:', newProduct.id);
        return {
          success: true,
          productId: newProduct.id,
          productName: newProduct.name
        };
      }

      // Si NO se creó el producto, es un error completo
      console.error('❌ [Server Action] Error en GraphQL sin producto creado:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al ejecutar la operación GraphQL'
      };
    }

    // Caso normal: producto creado sin errores
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

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error creando paquete:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}

/**
 * Server Action para actualizar un producto existente
 * COPIANDO EXACTAMENTE EL PATRÓN QUE FUNCIONA
 */
export async function updateProductAction(productId: string, updateData: Record<string, unknown>): Promise<CreateProductResult> {
  try {
    // 1. Validar autenticación
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

    // 3. Debug de claims del idToken (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await debugIdTokenClaims();
    }

    // 4. Crear cliente GraphQL con idToken (necesario para validación de permisos en AppSync)
    const client = await getGraphQLClientWithIdToken();

    // 5. Función para convertir fechas a formato AWSDateTime
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

    // 6. Función para normalizar seasons recursivamente
    const normalizeSeasons = (seasons: unknown[]): unknown[] => {
          if (!seasons || !Array.isArray(seasons)) return seasons;
          
          return seasons.map(season => ({
            ...season,
            start_date: season.start_date ? normalizeDate(season.start_date) : season.start_date,
            end_date: season.end_date ? normalizeDate(season.end_date) : season.end_date
          }));
    };

    // 7. Preparar input filtrando solo campos permitidos por UpdateProductInput
        // Excluir campos que son solo de output como user_id, created_at, updated_at
        // NOTA: 'is_foreign' NO existe en UpdateProductInput según schema GraphQL
    const allowedFields = [
          'name', 'description', 'preferences', 'languages',
          'cover_image_url', 'image_url', 'video_url',
          'seasons', 'planned_hotels_or_similar', 'payment_policy',
          'published', 'destination', 'itinerary', 'departures'
    ];

    const filteredData = Object.keys(updateData)
          .filter(key => allowedFields.includes(key))
          .reduce((obj, key) => {
            obj[key] = updateData[key];
            return obj;
        }, {} as Record<string, unknown>);

    // 8. Normalizar fechas en seasons y filtrar campos no permitidos en input
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

      filteredData.seasons = normalizeSeasons(filteredData.seasons).map((season: unknown) => {
        const filteredSeason = Object.keys(season)
              .filter(key => seasonsAllowedFields.includes(key))
              .reduce((obj, key) => {
                obj[key] = season[key];
                return obj;
            }, {} as Record<string, unknown>);

        // Filtrar campos de solo lectura en prices y extra_prices
        if (filteredSeason.prices) {
          filteredSeason.prices = filteredSeason.prices.map((price: unknown) => {
                const { id, ...priceWithoutId } = price;
                return priceWithoutId;
          });
        }

        if (filteredSeason.extra_prices) {
          filteredSeason.extra_prices = filteredSeason.extra_prices.map((price: unknown) => {
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

    // 9. Mapear departures del formato interno al formato GraphQL según el esquema real
    if (filteredData.departures) {
      console.log('🚀 Original departures (internal format):', JSON.stringify(filteredData.departures, null, 2));

      const graphqlDepartures: unknown[] = [];

      // Mapear salidas regulares - conservar la estructura actual que funciona
      if (filteredData.departures.regular_departures) {
        filteredData.departures.regular_departures.forEach((regular: unknown) => {
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
        const allOrigins: unknown[] = [];

        filteredData.departures.specific_departures.forEach((specific: unknown) => {
          if (specific.origin && specific.origin.place) {
            allOrigins.push(specific.origin);

            // Extraer fechas de los rangos
            if (specific.date_ranges) {
              specific.date_ranges.forEach((range: unknown) => {
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

    // 10. Filtrar payment_policy para remover campos de solo lectura
    // CRÍTICO: AppSync rechaza campos como id, product_id, provider_id, updated_at en PaymentPolicyInput
    if (filteredData.payment_policy) {
      console.log('💳 Original payment_policy:', JSON.stringify(filteredData.payment_policy, null, 2));

      // Solo mantener los campos permitidos en PaymentPolicyInput (según schema GraphQL)
      // PaymentPolicyInput { general_policies: GeneralPoliciesInput, options: [PaymentOptionInput] }
      const allowedPaymentPolicyFields = ['options', 'general_policies'];

      const cleanPaymentPolicy = Object.keys(filteredData.payment_policy)
        .filter(key => allowedPaymentPolicyFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = filteredData.payment_policy[key];
          return obj;
        }, {} as Record<string, unknown>);

      // Filtrar campos dentro de cada option individual para preservar solo campos del schema
      // PaymentOptionInput { type, description, config, benefits_or_legal }
      if (cleanPaymentPolicy.options && Array.isArray(cleanPaymentPolicy.options)) {
        const allowedOptionFields = ['type', 'description', 'config', 'benefits_or_legal'];

        console.log('💳 Opciones antes de filtrar:', cleanPaymentPolicy.options.length);

        cleanPaymentPolicy.options = cleanPaymentPolicy.options.map((option: any) => {
          const filteredOption = Object.keys(option)
            .filter(key => allowedOptionFields.includes(key))
            .reduce((obj, key) => {
              obj[key] = option[key];
              return obj;
            }, {} as Record<string, unknown>);

          // Log específico si benefits_or_legal está presente
          if (filteredOption.benefits_or_legal) {
            console.log('💳 benefits_or_legal preservado para option:', {
              type: filteredOption.type,
              benefitsCount: Array.isArray(filteredOption.benefits_or_legal) ? filteredOption.benefits_or_legal.length : 0
            });
          }

          return filteredOption;
        });
      }

      filteredData.payment_policy = cleanPaymentPolicy;
      console.log('💳 Cleaned payment_policy con options filtradas:', JSON.stringify(filteredData.payment_policy, null, 2));
    }

    // 11. Transformar URLs a paths antes de enviar a GraphQL
    const transformedData = transformProductUrlsToPaths(filteredData);

    // 12. Transformar coordenadas de arrays [lon, lat] a objetos PointInput {latitude, longitude}
    // CRÍTICO: El frontend usa arrays para compatibilidad con Mapbox, pero GraphQL espera objetos
    const transformCoordinatesToPointInput = (data: Record<string, unknown>) => {
      const result = { ...data };

      // Transformar destination coordinates
      if (result.destination && Array.isArray(result.destination)) {
        result.destination = result.destination.map((dest: any) => {
          if (!dest) return dest;

          return {
            ...dest,
            coordinates: dest.coordinates && Array.isArray(dest.coordinates)
              ? { latitude: dest.coordinates[1], longitude: dest.coordinates[0] }
              : dest.coordinates
          };
        });
      }

      // Transformar departures.origin coordinates
      if (result.departures && Array.isArray(result.departures)) {
        result.departures = result.departures.map((dep: any) => {
          if (!dep) return dep;

          return {
            ...dep,
            origin: dep.origin && Array.isArray(dep.origin)
              ? dep.origin.map((o: any) => ({
                  ...o,
                  coordinates: o.coordinates && Array.isArray(o.coordinates)
                    ? { latitude: o.coordinates[1], longitude: o.coordinates[0] }
                    : o.coordinates
                }))
              : dep.origin
          };
        });
      }

      console.log('🔄 Coordenadas transformadas a PointInput:', {
        destinationSample: result.destination?.[0]?.coordinates,
        departureOriginSample: result.departures?.[0]?.origin?.[0]?.coordinates
      });

      return result;
    };

    const filteredInput = {
      id: productId,
      ...transformCoordinatesToPointInput(transformedData)
    };

    console.log('📋 Filtered and transformed input for updateProduct:', JSON.stringify(filteredInput, null, 2));

    // 11. Ejecutar mutación GraphQL (el idToken ya está configurado en el cliente)
    const result = await client.graphql({
      query: updateProduct,
      variables: {
        input: filteredInput
      }
    });

    // ⚡ MANEJO ROBUSTO DE ERRORES PARCIALES DE GRAPHQL
    const updatedProduct = result.data?.updateProduct;

    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ [Server Action] GraphQL retornó errores al actualizar producto:',
        result.errors.map(e => ({
          message: e.message,
          path: e.path,
          extensions: e.extensions
        }))
      );

      // Si el producto se actualizó (tenemos ID), es éxito con warnings
      if (updatedProduct?.id) {
        console.log('✅ [Server Action] Producto actualizado con warnings:', updatedProduct.id);
        return {
          success: true,
          productId: updatedProduct.id,
          productName: updatedProduct.name
        };
      }

      // Si NO se actualizó el producto, es un error completo
      console.error('❌ [Server Action] Error en GraphQL update sin confirmación:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Error al ejecutar la operación GraphQL'
      };
    }

    // Caso normal: producto actualizado sin errores
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

  } catch (error: unknown) {
    console.error('❌ [Server Action] Error actualizando producto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
  }
}
