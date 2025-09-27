/**
 * Utilidades para parsing seguro de JSON con manejo de doble encoding
 * Soluciona el problema del doble JSON.stringify() en atributos de Cognito
 */

export interface ParsedJsonResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  wasDoubleEncoded?: boolean;
}

/**
 * Parsea JSON de forma segura, manejando casos de doble encoding
 */
export function safeJsonParse<T = unknown>(
  value: string | null | undefined,
  fallback: T
): ParsedJsonResult<T> {
  if (!value || typeof value !== 'string') {
    return {
      success: true,
      data: fallback,
      error: 'Empty or invalid input'
    };
  }

  try {
    // Primer intento: parsing normal
    const parsed = JSON.parse(value);

    // Verificar si el resultado es un string (posible doble encoding)
    if (typeof parsed === 'string') {
      try {
        // Segundo intento: parsing del string interno
        const doubleDecoded = JSON.parse(parsed);
        console.warn('🔄 Detectado doble encoding JSON, corrigiendo...', {
          original: value,
          firstParse: parsed,
          finalResult: doubleDecoded
        });

        return {
          success: true,
          data: doubleDecoded,
          wasDoubleEncoded: true
        };
      } catch (innerError) {
        // Si el segundo parse falla, usar el primer resultado
        return {
          success: true,
          data: parsed as T,
          wasDoubleEncoded: false
        };
      }
    }

    // Si no es string, usar el resultado directo
    return {
      success: true,
      data: parsed as T,
      wasDoubleEncoded: false
    };

  } catch (error) {
    console.error('❌ Error parsing JSON:', {
      value,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      data: fallback,
      error: error instanceof Error ? error.message : 'JSON parse error'
    };
  }
}

/**
 * Parsea múltiples atributos JSON de Cognito de forma segura
 */
export function parseMultipleCognitoAttributes<T extends Record<string, any>>(
  attributes: Record<string, string | undefined>,
  schema: Record<keyof T, any>
): T {
  const result = {} as T;
  const warnings: string[] = [];

  for (const [key, fallback] of Object.entries(schema)) {
    const value = attributes[key];
    const parseResult = safeJsonParse(value, fallback);

    if (parseResult.wasDoubleEncoded) {
      warnings.push(`Atributo '${key}' tenía doble encoding - corregido automáticamente`);
    }

    if (!parseResult.success) {
      warnings.push(`Error parsing '${key}': ${parseResult.error}`);
    }

    result[key as keyof T] = parseResult.data;
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Advertencias en parsing de atributos Cognito:', warnings);
  }

  return result;
}

/**
 * Valida si un string parece tener doble encoding
 */
export function detectDoubleEncoding(value: string): boolean {
  if (!value || typeof value !== 'string') return false;

  try {
    const parsed = JSON.parse(value);
    // Si el resultado es un string que empieza con { o [, probablemente es doble encoding
    return typeof parsed === 'string' &&
           (parsed.trim().startsWith('{') || parsed.trim().startsWith('['));
  } catch {
    return false;
  }
}

/**
 * Corrige doble encoding en un objeto de atributos
 */
export function fixDoubleEncodedAttributes(
  attributes: Record<string, string | undefined>
): Record<string, string | undefined> {
  const fixed: Record<string, string | undefined> = {};
  const fixedKeys: string[] = [];

  for (const [key, value] of Object.entries(attributes)) {
    if (value && detectDoubleEncoding(value)) {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'string') {
          fixed[key] = parsed;
          fixedKeys.push(key);
        } else {
          fixed[key] = value;
        }
      } catch {
        fixed[key] = value;
      }
    } else {
      fixed[key] = value;
    }
  }

  if (fixedKeys.length > 0) {
    console.log('🔧 Atributos con doble encoding corregidos:', fixedKeys);
  }

  return fixed;
}

/**
 * Helper específico para atributos de perfil de usuario
 */
export function parseProfileAttributes(attributes: Record<string, string | undefined>) {
  return parseMultipleCognitoAttributes(attributes, {
    'custom:social_media_plfms': [],
    'custom:days_of_service': [],
    'custom:contact_information': { contact_name: '', contact_phone: '', contact_email: '' },
    'custom:emgcy_details': { contact_name: '', contact_phone: '', contact_email: '' },
    'custom:proofOfTaxStatusPath': undefined,
    'custom:secturPath': undefined,
    'custom:complianceOpinPath': undefined,
    'address': { cp: '', c: '', ne: '', ni: '', col: '', mun: '', est: '' },
    'custom:company_profile': '',
    'custom:banking_details': '',
    'custom:credentials': ''
  });
}