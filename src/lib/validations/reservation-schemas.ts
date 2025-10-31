import { z } from 'zod';

/**
 * Reservation Validation Schemas
 *
 * Schemas de validación Zod para todos los inputs de Server Actions
 * relacionados con reservaciones y planes de pago.
 *
 * Previene:
 * - XSS (Cross-Site Scripting)
 * - Inyección SQL
 * - Formato de UUID inválido
 * - Valores negativos o inválidos
 * - Datos malformados
 */

// ============================================================================
// COMMON VALIDATIONS
// ============================================================================

/**
 * UUID v4 validation regex
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * ISO 8601 DateTime validation regex
 * Format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DD
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;

/**
 * Currency code validation (ISO 4217)
 */
const CURRENCY_REGEX = /^[A-Z]{3}$/;

// ============================================================================
// RESERVATION SCHEMAS
// ============================================================================

/**
 * Schema para crear una nueva reservación
 * Usado en: createReservationAction
 */
export const createReservationSchema = z.object({
  experience_id: z.string()
    .regex(UUID_REGEX, 'ID de experiencia debe ser un UUID válido')
    .min(1, 'ID de experiencia requerido'),

  adults: z.number()
    .int('Número de adultos debe ser entero')
    .positive('Debe haber al menos 1 adulto')
    .max(50, 'Número máximo de adultos excedido'),

  kids: z.number()
    .int('Número de niños debe ser entero')
    .nonnegative('Número de niños no puede ser negativo')
    .max(50, 'Número máximo de niños excedido')
    .default(0),

  babys: z.number()
    .int('Número de bebés debe ser entero')
    .nonnegative('Número de bebés no puede ser negativo')
    .max(20, 'Número máximo de bebés excedido')
    .default(0),

  reservation_date: z.string()
    .regex(ISO_DATE_REGEX, 'Fecha de reservación debe estar en formato ISO 8601')
    .refine((date) => {
      const reservationDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return reservationDate >= today;
    }, {
      message: 'Fecha de reservación no puede ser en el pasado'
    }),

  season_id: z.string()
    .regex(UUID_REGEX, 'ID de temporada debe ser un UUID válido')
    .optional(),

  price_id: z.string()
    .regex(UUID_REGEX, 'ID de precio debe ser un UUID válido')
    .optional(),

  price_per_person: z.number()
    .positive('Precio por persona debe ser mayor a 0')
    .max(1000000, 'Precio por persona excede el máximo permitido')
    .optional(),

  price_per_kid: z.number()
    .nonnegative('Precio por niño no puede ser negativo')
    .max(1000000, 'Precio por niño excede el máximo permitido')
    .optional(),

  total_price: z.number()
    .positive('Precio total debe ser mayor a 0')
    .max(10000000, 'Precio total excede el máximo permitido')
    .optional(),

  currency: z.string()
    .regex(CURRENCY_REGEX, 'Moneda debe ser código ISO 4217 (ej. MXN, USD)')
    .default('MXN')
}).refine((data) => {
  // Validar que al menos haya un viajero
  const totalTravelers = data.adults + data.kids + data.babys;
  return totalTravelers > 0;
}, {
  message: 'Debe haber al menos 1 viajero en la reservación',
  path: ['adults']
});

/**
 * Tipo TypeScript inferido del schema
 */
export type CreateReservationInput = z.infer<typeof createReservationSchema>;

// ============================================================================
// PAYMENT PLAN SCHEMAS
// ============================================================================

/**
 * Schema para generar un plan de pago
 * Usado en: generatePaymentPlanAction
 */
export const generatePaymentPlanSchema = z.object({
  product_id: z.string()
    .regex(UUID_REGEX, 'ID de producto debe ser un UUID válido')
    .min(1, 'ID de producto requerido'),

  total_cost: z.number()
    .positive('Costo total debe ser mayor a 0')
    .max(10000000, 'Costo total excede el máximo permitido'),

  travel_date: z.string()
    .regex(ISO_DATE_REGEX, 'Fecha de viaje debe estar en formato ISO 8601')
    .refine((date) => {
      const travelDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return travelDate >= today;
    }, {
      message: 'Fecha de viaje no puede ser en el pasado'
    }),

  currency: z.string()
    .regex(CURRENCY_REGEX, 'Moneda debe ser código ISO 4217 (ej. MXN, USD)')
    .default('MXN'),

  payment_type_selected: z.enum(['CONTADO', 'PLAZOS'], {
    errorMap: () => ({ message: 'Tipo de pago debe ser CONTADO o PLAZOS' })
  })
});

/**
 * Tipo TypeScript inferido del schema
 */
export type GeneratePaymentPlanInput = z.infer<typeof generatePaymentPlanSchema>;

/**
 * Schema para actualizar un plan de pago
 * Usado en: updatePaymentPlanAction
 */
export const updatePaymentPlanSchema = z.object({
  id: z.string()
    .regex(UUID_REGEX, 'ID de plan de pago debe ser un UUID válido')
    .min(1, 'ID de plan de pago requerido'),

  payment_type_selected: z.enum(['CONTADO', 'PLAZOS'], {
    errorMap: () => ({ message: 'Tipo de pago debe ser CONTADO o PLAZOS' })
  }).optional(),

  status: z.enum(['ACTIVE', 'SELECTED', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Estado debe ser ACTIVE, SELECTED, COMPLETED o CANCELLED' })
  }).optional()
}).refine((data) => {
  // Al menos un campo debe estar presente para actualizar
  return data.payment_type_selected !== undefined || data.status !== undefined;
}, {
  message: 'Debe proporcionar al menos un campo para actualizar (payment_type_selected o status)',
  path: ['payment_type_selected']
});

/**
 * Tipo TypeScript inferido del schema
 */
export type UpdatePaymentPlanInput = z.infer<typeof updatePaymentPlanSchema>;

/**
 * Schema para iniciar pago con MIT
 * Usado en: initiateMITPaymentAction
 */
export const initiateMITPaymentSchema = z.object({
  paymentPlanId: z.string()
    .regex(UUID_REGEX, 'ID de plan de pago debe ser un UUID válido')
    .min(1, 'ID de plan de pago requerido')
});

/**
 * Tipo TypeScript inferido del schema
 */
export type InitiateMITPaymentInput = z.infer<typeof initiateMITPaymentSchema>;

// ============================================================================
// AVAILABILITY CHECK SCHEMAS
// ============================================================================

/**
 * Schema para verificar disponibilidad
 * Usado en: checkAvailabilityAction
 */
export const checkAvailabilitySchema = z.object({
  experienceId: z.string()
    .regex(UUID_REGEX, 'ID de experiencia debe ser un UUID válido')
    .min(1, 'ID de experiencia requerido'),

  adults: z.number()
    .int('Número de adultos debe ser entero')
    .positive('Debe haber al menos 1 adulto')
    .max(50, 'Número máximo de adultos excedido'),

  kids: z.number()
    .int('Número de niños debe ser entero')
    .nonnegative('Número de niños no puede ser negativo')
    .max(50, 'Número máximo de niños excedido')
    .default(0),

  babys: z.number()
    .int('Número de bebés debe ser entero')
    .nonnegative('Número de bebés no puede ser negativo')
    .max(20, 'Número máximo de bebés excedido')
    .default(0),

  date: z.string()
    .regex(ISO_DATE_REGEX, 'Fecha debe estar en formato ISO 8601')
    .optional(),

  seasonId: z.string()
    .regex(UUID_REGEX, 'ID de temporada debe ser un UUID válido')
    .optional(),

  priceId: z.string()
    .regex(UUID_REGEX, 'ID de precio debe ser un UUID válido')
    .optional()
}).refine((data) => {
  // Validar que al menos haya un viajero
  const totalTravelers = data.adults + data.kids + data.babys;
  return totalTravelers > 0;
}, {
  message: 'Debe haber al menos 1 viajero para verificar disponibilidad',
  path: ['adults']
});

/**
 * Tipo TypeScript inferido del schema
 */
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Valida y sanitiza un input contra un schema
 *
 * @param schema - Schema de Zod a usar para validación
 * @param input - Datos a validar
 * @returns Objeto con { success, data?, errors? }
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validatedData = schema.parse(input);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Formatea errores de Zod a mensajes amigables para el usuario
 *
 * @param zodError - Error de Zod a formatear
 * @returns String con mensaje de error amigable
 */
export function formatZodError(zodError: z.ZodError): string {
  const firstError = zodError.errors[0];

  if (!firstError) {
    return 'Error de validación';
  }

  const field = firstError.path.join('.');
  const message = firstError.message;

  // Mapeo de campos técnicos a nombres amigables
  const friendlyFields: Record<string, string> = {
    'experience_id': 'Experiencia',
    'adults': 'Adultos',
    'kids': 'Niños',
    'babys': 'Bebés',
    'reservation_date': 'Fecha de reservación',
    'season_id': 'Temporada',
    'price_id': 'Precio',
    'total_price': 'Precio total',
    'payment_type_selected': 'Tipo de pago',
    'paymentPlanId': 'Plan de pago'
  };

  const friendlyField = friendlyFields[field] || field;

  return `${friendlyField}: ${message}`;
}
