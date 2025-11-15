/**
 * Tipos Custom de Departures (Frontend)
 *
 * Estos tipos NO existen en el schema GraphQL de AWS AppSync.
 * Son construcciones del frontend para manejar salidas regulares y específicas.
 *
 * NOTA: El backend GraphQL usa GuaranteedDeparturesInput que acepta estos datos
 * pero no tipifica explícitamente estas estructuras internas.
 */

import type { LocationInput, Location, WeekDays } from '@/generated/graphql';

/**
 * Salida Regular (Input)
 * Representa salidas que ocurren regularmente en ciertos días de la semana
 */
export interface RegularDepartureInput {
  origin: LocationInput;
  days: WeekDays[];
}

/**
 * Salida Regular (Output)
 * Versión de output con Location en lugar de LocationInput
 */
export interface RegularDeparture {
  origin: Location;
  days: WeekDays[];
}

/**
 * Rango de Fechas (Input)
 * Define un periodo de tiempo con inicio y fin
 */
export interface DateRangeInput {
  start_datetime: string; // AWSDateTime
  end_datetime: string;   // AWSDateTime
}

/**
 * Rango de Fechas (Output)
 * Versión de output del rango de fechas
 */
export interface DateRange {
  start_datetime: string; // AWSDateTime
  end_datetime: string;   // AWSDateTime
}

/**
 * Salida Específica (Input)
 * Representa salidas en fechas específicas (rangos de fechas)
 */
export interface SpecificDepartureInput {
  origin: LocationInput;
  date_ranges: DateRangeInput[];
}

/**
 * Salida Específica (Output)
 * Versión de output con Location en lugar de LocationInput
 */
export interface SpecificDeparture {
  origin: Location;
  date_ranges: DateRange[];
}
