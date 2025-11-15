/**
 * Tipos Escalares de AWS AppSync
 *
 * Estos son aliases de string para los tipos escalares custom de AWS AppSync.
 * Aunque @/generated/graphql define Scalars['AWSDateTime'], a veces necesitamos
 * estos aliases directos en el código del frontend.
 */

/**
 * AWSDateTime
 * Representa una fecha y hora en formato ISO 8601
 * Ejemplo: "2025-01-15T10:30:00.000Z"
 */
export type AWSDateTime = string;

/**
 * AWSJSON
 * Representa un objeto JSON serializado como string
 * Usado para campos dinámicos que no tienen esquema fijo
 */
export type AWSJSON = string;
