/**
 * Companion Validation Schemas
 *
 * Zod schemas for validating companion (traveler) data
 * Used in Edit Companions wizard
 */

import { z } from 'zod';

/**
 * Gender options
 */
export const GENDER_OPTIONS = ['male', 'female', 'other'] as const;

/**
 * Companion Type (based on age)
 */
export const COMPANION_TYPE = ['adult', 'kid', 'baby'] as const;

/**
 * Country codes (ISO 3166-1 alpha-2)
 * Extended list of common countries
 */
export const COUNTRY_CODES = [
  'MX', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'BR',
  'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY',
  'CN', 'JP', 'KR', 'IN', 'AU', 'NZ', 'ZA', 'RU'
] as const;

/**
 * Passport Number Validation Patterns by Country
 *
 * Common patterns (simplified for MVP):
 * - Mexico: alphanumeric 8-10 chars
 * - USA: numeric 9 chars
 * - Canada: alphanumeric 8 chars
 * - UK: alphanumeric 9 chars
 * - EU: varies but typically 8-10 alphanumeric
 */
const PASSPORT_PATTERNS: Record<string, RegExp> = {
  MX: /^[A-Z0-9]{8,10}$/i,
  US: /^\d{9}$/,
  CA: /^[A-Z]{2}\d{6}$/i,
  GB: /^\d{9}[A-Z]?$/i,
  // Generic fallback for other countries
  DEFAULT: /^[A-Z0-9]{6,15}$/i
};

/**
 * Validate passport number format for specific country
 */
function validatePassportNumber(passport: string, country: string): boolean {
  const pattern = PASSPORT_PATTERNS[country] || PASSPORT_PATTERNS.DEFAULT;
  return pattern.test(passport);
}

/**
 * Calculate age from birthday
 */
function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Determine companion type based on age
 * - Adult: 18+
 * - Kid: 2-17
 * - Baby: 0-1
 */
function getCompanionType(age: number): typeof COMPANION_TYPE[number] {
  if (age >= 18) return 'adult';
  if (age >= 2) return 'kid';
  return 'baby';
}

/**
 * Single Companion Schema
 */
export const companionSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),

  family_name: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios'),

  birthday: z.string()
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      return birthDate < today;
    }, 'La fecha de nacimiento debe ser en el pasado')
    .refine((date) => {
      const age = calculateAge(date);
      return age <= 120;
    }, 'La edad no puede ser mayor a 120 años'),

  country: z.string()
    .length(2, 'El código de país debe tener 2 caracteres')
    .toUpperCase(),

  gender: z.enum(GENDER_OPTIONS, {
    errorMap: () => ({ message: 'Género inválido' })
  }),

  passport_number: z.string()
    .min(6, 'El número de pasaporte debe tener al menos 6 caracteres')
    .max(15, 'El número de pasaporte no puede exceder 15 caracteres')
    .toUpperCase()
}).refine(
  (data) => validatePassportNumber(data.passport_number, data.country),
  {
    message: 'Formato de pasaporte inválido para el país seleccionado',
    path: ['passport_number']
  }
);

/**
 * Companion with ID (for editing existing companions)
 */
export const companionWithIdSchema = companionSchema.extend({
  id: z.string().optional() // Optional ID for new companions
});

/**
 * Multiple Companions Schema
 */
export const companionsArraySchema = z.array(companionSchema)
  .min(1, 'Debe haber al menos un viajero')
  .max(20, 'No se pueden agregar más de 20 viajeros');

/**
 * Edit Companions Input (with reservation context)
 */
export const editCompanionsInputSchema = z.object({
  reservationId: z.string().uuid('ID de reservación inválido'),

  companions: companionsArraySchema,

  // Expected counts (from reservation)
  expectedAdults: z.number().int().min(1),
  expectedKids: z.number().int().min(0),
  expectedBabys: z.number().int().min(0)
}).refine(
  (data) => {
    // Count companions by type based on age
    const companions = data.companions;
    let adults = 0;
    let kids = 0;
    let babys = 0;

    companions.forEach((companion) => {
      const age = calculateAge(companion.birthday);
      const type = getCompanionType(age);

      if (type === 'adult') adults++;
      else if (type === 'kid') kids++;
      else babys++;
    });

    // Verify counts match reservation
    return (
      adults === data.expectedAdults &&
      kids === data.expectedKids &&
      babys === data.expectedBabys
    );
  },
  {
    message: 'La cantidad de viajeros no coincide con la reservación (adultos/niños/bebés)',
    path: ['companions']
  }
);

/**
 * Type exports
 */
export type Companion = z.infer<typeof companionSchema>;
export type CompanionWithId = z.infer<typeof companionWithIdSchema>;
export type EditCompanionsInput = z.infer<typeof editCompanionsInputSchema>;

/**
 * Helper Functions
 */

/**
 * Get validation message for passport based on country
 */
export function getPassportHint(country: string): string {
  const hints: Record<string, string> = {
    MX: 'México: 8-10 caracteres alfanuméricos (ej: G12345678)',
    US: 'USA: 9 dígitos numéricos (ej: 123456789)',
    CA: 'Canadá: 2 letras + 6 dígitos (ej: AB123456)',
    GB: 'Reino Unido: 9 dígitos + opcional letra (ej: 123456789X)',
    DEFAULT: 'Formato general: 6-15 caracteres alfanuméricos'
  };

  return hints[country] || hints.DEFAULT;
}

/**
 * Get country name from code
 */
export function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    MX: 'México',
    US: 'Estados Unidos',
    CA: 'Canadá',
    GB: 'Reino Unido',
    FR: 'Francia',
    DE: 'Alemania',
    IT: 'Italia',
    ES: 'España',
    PT: 'Portugal',
    BR: 'Brasil',
    AR: 'Argentina',
    CL: 'Chile',
    CO: 'Colombia',
    PE: 'Perú',
    VE: 'Venezuela',
    EC: 'Ecuador',
    BO: 'Bolivia',
    PY: 'Paraguay',
    UY: 'Uruguay',
    CN: 'China',
    JP: 'Japón',
    KR: 'Corea del Sur',
    IN: 'India',
    AU: 'Australia',
    NZ: 'Nueva Zelanda',
    ZA: 'Sudáfrica',
    RU: 'Rusia'
  };

  return countries[code] || code;
}

/**
 * Get gender label in Spanish
 */
export function getGenderLabel(gender: string): string {
  const labels: Record<string, string> = {
    male: 'Masculino',
    female: 'Femenino',
    other: 'Otro'
  };

  return labels[gender.toLowerCase()] || gender;
}

/**
 * Validate companion and return errors
 */
export function validateCompanion(companion: unknown): { success: boolean; errors?: z.ZodError } {
  const result = companionSchema.safeParse(companion);

  if (!result.success) {
    return { success: false, errors: result.error };
  }

  return { success: true };
}

/**
 * Get companion type label
 */
export function getCompanionTypeLabel(birthday: string): string {
  const age = calculateAge(birthday);
  const type = getCompanionType(age);

  const labels: Record<typeof COMPANION_TYPE[number], string> = {
    adult: `Adulto (${age} años)`,
    kid: `Niño (${age} años)`,
    baby: `Bebé (${age} ${age === 1 ? 'año' : 'meses'})`
  };

  return labels[type];
}
