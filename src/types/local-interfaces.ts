/**
 * Interfaces Locales de Formularios
 *
 * Estas interfaces son usadas en formularios del frontend y NO están
 * directamente mapeadas al schema GraphQL de AWS AppSync.
 *
 * Son estructuras intermedias para manejar el estado de formularios
 * antes de transformarlas a los tipos GraphQL oficiales.
 */

/**
 * Price (Frontend Form)
 * Representa un precio en formularios del Product Wizard
 *
 * NOTA: Diferente de ProductPrice del schema GraphQL.
 * Este es una versión simplificada para formularios.
 */
export interface Price {
  id?: string;
  currency?: string;
  price?: number;
  roomName?: string;
}

/**
 * Season (Frontend Form)
 * Representa una temporada en formularios del Product Wizard
 *
 * NOTA: Diferente de ProductSeason del schema GraphQL.
 * Esta es una versión simplificada para formularios.
 */
export interface Season {
  capacity?: number;
  categories?: string[];
  startDate?: string;
  endDate?: string;
  product_pricing?: number;
  prices?: Price[];
  schedules?: string;
}

/**
 * Policy (Frontend Form)
 * Representa una política en formularios
 *
 * Estructura simplificada para manejar políticas generales
 * en el Product Wizard antes de convertirlas a PaymentPolicyInput.
 */
export interface Policy {
  title?: string;
  policy?: string;
}
