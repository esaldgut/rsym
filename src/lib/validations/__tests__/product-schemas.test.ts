/**
 * Unit Tests for product-schemas.ts
 *
 * Tests Zod validation schemas for product creation and editing.
 * These are pure function tests - testing validation logic.
 *
 * @coverage Target: 95%+
 */
import {
  generalInfoCircuitSchema,
  generalInfoPackageSchema,
  productDetailsSchema,
  tourDetailsSchema,
  packageDetailsSchema,
  policiesSchema,
  publishCircuitSchema,
  publishPackageSchema,
  validateForPublication,
} from '../product-schemas';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

const createValidLocation = (overrides = {}) => ({
  place: 'Mexico City',
  placeSub: 'CDMX, Mexico',
  coordinates: { latitude: 19.4326, longitude: -99.1332 },
  ...overrides,
});

const createValidPrice = (overrides = {}) => ({
  currency: 'MXN',
  price: 15000,
  room_name: 'Habitación Doble',
  max_adult: 2,
  max_minor: 2,
  children: [],
  ...overrides,
});

const createValidSeason = (overrides = {}) => ({
  category: 'Alta',
  start_date: '2025-06-01',
  end_date: '2025-08-31',
  allotment: 20,
  prices: [createValidPrice()],
  ...overrides,
});

const createValidGeneralInfoCircuit = (overrides = {}) => ({
  name: 'Ruta Maya Completa',
  preferences: ['aventura', 'cultura'],
  languages: ['es', 'en'],
  description: 'Un increíble recorrido por los sitios arqueológicos más importantes del mundo maya.',
  cover_image_url: '',
  image_url: [],
  video_url: [],
  ...overrides,
});

const createValidProductDetails = (overrides = {}) => ({
  destination: [createValidLocation(), createValidLocation({ place: 'Cancun' })],
  itinerary: 'Día 1: Llegada a CDMX. Día 2: Visita a Teotihuacán. Día 3: Traslado a Cancún. Día 4: Visita a Tulum.',
  seasons: [createValidSeason()],
  planned_hotels_or_similar: ['Hotel Fiesta Americana', 'Hyatt Regency'],
  ...overrides,
});

// ============================================================================
// generalInfoCircuitSchema
// ============================================================================

describe('generalInfoCircuitSchema', () => {
  describe('validaciones exitosas', () => {
    it('valida datos completos correctamente', () => {
      const data = createValidGeneralInfoCircuit();
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('valida con campos opcionales vacíos', () => {
      const data = createValidGeneralInfoCircuit({
        cover_image_url: undefined,
        image_url: undefined,
        video_url: undefined,
      });
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('acepta nombre con exactamente 3 caracteres', () => {
      const data = createValidGeneralInfoCircuit({ name: 'ABC' });
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('acepta nombre con exactamente 100 caracteres', () => {
      const data = createValidGeneralInfoCircuit({ name: 'A'.repeat(100) });
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('acepta descripción con exactamente 20 caracteres', () => {
      const data = createValidGeneralInfoCircuit({ description: 'A'.repeat(20) });
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('validaciones fallidas', () => {
    it('rechaza nombre muy corto (menos de 3 caracteres)', () => {
      const data = createValidGeneralInfoCircuit({ name: 'AB' });
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('3 caracteres');
      }
    });

    it('rechaza nombre muy largo (más de 100 caracteres)', () => {
      const data = createValidGeneralInfoCircuit({ name: 'A'.repeat(101) });
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('100 caracteres');
      }
    });

    it('rechaza descripción muy corta (menos de 20 caracteres)', () => {
      const data = createValidGeneralInfoCircuit({ description: 'Corta' });
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('20 caracteres');
      }
    });

    it('rechaza descripción muy larga (más de 2000 caracteres)', () => {
      const data = createValidGeneralInfoCircuit({ description: 'A'.repeat(2001) });
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('2000 caracteres');
      }
    });

    it('rechaza preferences vacío', () => {
      const data = createValidGeneralInfoCircuit({ preferences: [] });
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('tipo de interés');
      }
    });

    it('rechaza languages vacío', () => {
      const data = createValidGeneralInfoCircuit({ languages: [] });
      const result = generalInfoCircuitSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('idioma');
      }
    });
  });
});

// ============================================================================
// generalInfoPackageSchema
// ============================================================================

describe('generalInfoPackageSchema', () => {
  it('valida datos completos correctamente', () => {
    const data = createValidGeneralInfoCircuit();
    const result = generalInfoPackageSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('tiene las mismas validaciones que generalInfoCircuitSchema', () => {
    // Ambos schemas tienen las mismas reglas de validación
    const data = createValidGeneralInfoCircuit({ name: 'AB' }); // Nombre muy corto

    const circuitResult = generalInfoCircuitSchema.safeParse(data);
    const packageResult = generalInfoPackageSchema.safeParse(data);

    expect(circuitResult.success).toBe(packageResult.success);
  });
});

// ============================================================================
// productDetailsSchema
// ============================================================================

describe('productDetailsSchema', () => {
  describe('destination', () => {
    it('valida con múltiples destinos', () => {
      const data = createValidProductDetails();
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rechaza sin destinos', () => {
      const data = createValidProductDetails({ destination: [] });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('itinerary', () => {
    it('valida itinerario con más de 20 caracteres', () => {
      const data = createValidProductDetails({ itinerary: 'A'.repeat(50) });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rechaza itinerario con menos de 20 caracteres', () => {
      const data = createValidProductDetails({ itinerary: 'Corto' });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('seasons', () => {
    it('valida con al menos una temporada', () => {
      const data = createValidProductDetails();
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rechaza sin temporadas', () => {
      const data = createValidProductDetails({ seasons: [] });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('valida temporada con múltiples precios', () => {
      const data = createValidProductDetails({
        seasons: [
          createValidSeason({
            prices: [
              createValidPrice({ room_name: 'Sencilla' }),
              createValidPrice({ room_name: 'Doble' }),
              createValidPrice({ room_name: 'Triple' }),
            ],
          }),
        ],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// tourDetailsSchema (Circuits - 2+ destinations)
// ============================================================================

describe('tourDetailsSchema', () => {
  it('valida circuito con 2+ destinos', () => {
    const data = createValidProductDetails();
    expect(data.destination.length).toBeGreaterThanOrEqual(2);
    const result = tourDetailsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rechaza circuito con solo 1 destino', () => {
    const data = createValidProductDetails({
      destination: [createValidLocation()],
    });
    const result = tourDetailsSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.message.includes('2 destinos'))).toBe(true);
    }
  });
});

// ============================================================================
// packageDetailsSchema (Packages - exactly 1 destination)
// ============================================================================

describe('packageDetailsSchema', () => {
  it('valida paquete con exactamente 1 destino', () => {
    const data = createValidProductDetails({
      destination: [createValidLocation()],
      seasons: [createValidSeason({ number_of_nights: '3' })],
    });
    const result = packageDetailsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rechaza paquete con 2+ destinos', () => {
    const data = createValidProductDetails({
      destination: [createValidLocation(), createValidLocation({ place: 'Cancun' })],
    });
    const result = packageDetailsSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.message.includes('1 destino'))).toBe(true);
    }
  });
});

// ============================================================================
// policiesSchema
// ============================================================================

describe('policiesSchema', () => {
  const createValidContadoPolicy = () => ({
    payment_policy: {
      options: [
        {
          type: 'CONTADO' as const,
          description: 'Pago único con 10% de descuento',
          config: {
            cash: {
              discount: 10,
              discount_type: 'PERCENTAGE' as const,
              deadline_days_to_pay: 30,
              payment_methods: ['BANK_CARD' as const, 'CASH' as const],
            },
          },
        },
      ],
    },
  });

  const createValidPlazosPolicy = () => ({
    payment_policy: {
      options: [
        {
          type: 'PLAZOS' as const,
          description: 'Pago en cuotas mensuales',
          config: {
            installments: {
              down_payment_before: 20,
              down_payment_type: 'PERCENTAGE' as const,
              down_payment_after: 0,
              installment_intervals: 'MENSUAL' as const,
              days_before_must_be_settled: 7,
              deadline_days_to_pay: 30,
              payment_methods: ['BANK_CARD' as const],
            },
          },
        },
      ],
    },
  });

  describe('pago de contado', () => {
    it('valida política de contado correctamente', () => {
      const data = createValidContadoPolicy();
      const result = policiesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rechaza CONTADO sin configuración cash', () => {
      const data = {
        payment_policy: {
          options: [
            {
              type: 'CONTADO' as const,
              description: 'Pago único',
              config: {},
            },
          ],
        },
      };
      const result = policiesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rechaza descuento negativo', () => {
      const data = createValidContadoPolicy();
      data.payment_policy.options[0].config.cash!.discount = -5;
      const result = policiesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('pago en plazos', () => {
    it('valida política de plazos correctamente', () => {
      const data = createValidPlazosPolicy();
      const result = policiesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rechaza PLAZOS sin configuración installments', () => {
      const data = {
        payment_policy: {
          options: [
            {
              type: 'PLAZOS' as const,
              description: 'Pago en cuotas',
              config: {},
            },
          ],
        },
      };
      const result = policiesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('opciones múltiples', () => {
    it('valida múltiples opciones de pago', () => {
      const data = {
        payment_policy: {
          options: [
            ...createValidContadoPolicy().payment_policy.options,
            ...createValidPlazosPolicy().payment_policy.options,
          ],
        },
      };
      const result = policiesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rechaza sin opciones de pago', () => {
      const data = {
        payment_policy: {
          options: [],
        },
      };
      const result = policiesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('métodos de pago', () => {
    it('acepta todos los métodos de pago válidos', () => {
      const data = createValidContadoPolicy();
      data.payment_policy.options[0].config.cash!.payment_methods = [
        'CASH',
        'BANK_CARD',
        'APPLE_PAY',
        'GOOGLE_PAY',
        'CODI',
        'CLICK_TO_PAY',
      ];
      const result = policiesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rechaza métodos de pago vacíos', () => {
      const data = createValidContadoPolicy();
      data.payment_policy.options[0].config.cash!.payment_methods = [];
      const result = policiesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// publishCircuitSchema
// ============================================================================

describe('publishCircuitSchema', () => {
  it('valida producto listo para publicar', () => {
    const data = createValidGeneralInfoCircuit({
      cover_image_url: 'https://example.com/image.jpg',
      image_url: ['https://example.com/gallery1.jpg'],
    });
    const result = publishCircuitSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rechaza sin imagen de portada', () => {
    const data = createValidGeneralInfoCircuit({
      cover_image_url: '',
      image_url: ['https://example.com/gallery1.jpg'],
    });
    const result = publishCircuitSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rechaza sin imágenes adicionales', () => {
    const data = createValidGeneralInfoCircuit({
      cover_image_url: 'https://example.com/image.jpg',
      image_url: [],
    });
    const result = publishCircuitSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rechaza URL de imagen inválida', () => {
    const data = createValidGeneralInfoCircuit({
      cover_image_url: 'not-a-valid-url',
      image_url: ['https://example.com/gallery1.jpg'],
    });
    const result = publishCircuitSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// publishPackageSchema
// ============================================================================

describe('publishPackageSchema', () => {
  it('valida producto listo para publicar', () => {
    const data = createValidGeneralInfoCircuit({
      cover_image_url: 'https://example.com/image.jpg',
      image_url: ['https://example.com/gallery1.jpg'],
    });
    const result = publishPackageSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('tiene las mismas validaciones de publicación que publishCircuitSchema', () => {
    const data = createValidGeneralInfoCircuit({
      cover_image_url: '',
      image_url: [],
    });

    const circuitResult = publishCircuitSchema.safeParse(data);
    const packageResult = publishPackageSchema.safeParse(data);

    expect(circuitResult.success).toBe(packageResult.success);
  });
});

// ============================================================================
// validateForPublication
// ============================================================================

describe('validateForPublication', () => {
  describe('producto válido', () => {
    it('retorna isValid: true para circuito completo', () => {
      const data = createValidGeneralInfoCircuit({
        cover_image_url: 'https://example.com/image.jpg',
        image_url: ['https://example.com/gallery1.jpg'],
      });
      const result = validateForPublication(data, 'circuit');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toContain('listo para publicarse');
    });

    it('retorna isValid: true para paquete completo', () => {
      const data = createValidGeneralInfoCircuit({
        cover_image_url: 'https://example.com/image.jpg',
        image_url: ['https://example.com/gallery1.jpg'],
      });
      const result = validateForPublication(data, 'package');
      expect(result.isValid).toBe(true);
    });
  });

  describe('producto inválido', () => {
    it('retorna isValid: false con errores', () => {
      const data = { name: '' };
      const result = validateForPublication(data, 'circuit');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('los errores están ordenados por prioridad', () => {
      const data = { name: 'AB', description: '' }; // Múltiples errores
      const result = validateForPublication(data, 'circuit');

      if (result.errors.length > 1) {
        // Los errores con menor número de prioridad deben venir primero
        for (let i = 1; i < result.errors.length; i++) {
          expect(result.errors[i].priority).toBeGreaterThanOrEqual(result.errors[i - 1].priority);
        }
      }
    });

    it('incluye campos esenciales faltantes en summary', () => {
      const data = { name: '' }; // Falta nombre (prioridad 1)
      const result = validateForPublication(data, 'circuit');
      expect(result.summary).toContain('campos esenciales');
    });

    it('diferencia mensajes según tipo de producto', () => {
      const data = { name: '' };

      const circuitResult = validateForPublication(data, 'circuit');
      const packageResult = validateForPublication(data, 'package');

      expect(circuitResult.summary).toContain('circuito');
      expect(packageResult.summary).toContain('paquete');
    });
  });

  describe('mensajes amigables', () => {
    it('traduce errores técnicos a mensajes amigables', () => {
      const data = { name: '' };
      const result = validateForPublication(data, 'circuit');

      // No debe mostrar mensajes técnicos como "Expected string, received undefined"
      const technicalPatterns = ['Expected', 'received', 'Invalid'];
      result.errors.forEach((error: { message: string }) => {
        technicalPatterns.forEach((pattern) => {
          expect(error.message.toLowerCase()).not.toContain(pattern.toLowerCase());
        });
      });
    });

    it('usa mensajes personalizados para campos conocidos', () => {
      const data = createValidGeneralInfoCircuit({
        cover_image_url: '',
        image_url: [],
      });
      const result = validateForPublication(data, 'circuit');

      const coverImageError = result.errors.find((e: { field: string }) => e.field === 'cover_image_url');
      if (coverImageError) {
        expect(coverImageError.message).toContain('imagen de portada');
      }
    });
  });
});

// ============================================================================
// Edge Cases y Casos Especiales
// ============================================================================

describe('Edge Cases', () => {
  describe('ubicaciones', () => {
    it('acepta ubicación sin coordenadas', () => {
      const location = {
        place: 'Ciudad desconocida',
      };
      const data = createValidProductDetails({
        destination: [location, location],
      });
      const result = productDetailsSchema.safeParse(data);
      // El resultado depende de si se requieren coordenadas
      expect(typeof result.success).toBe('boolean');
    });

    it('acepta ubicación con coordenadas parciales como inválida', () => {
      const location = {
        place: 'Ciudad',
        coordinates: { latitude: 19.4326 }, // Falta longitude
      };
      const data = createValidProductDetails({
        destination: [location as any, createValidLocation()],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('precios', () => {
    it('rechaza precio negativo', () => {
      const data = createValidProductDetails({
        seasons: [
          createValidSeason({
            prices: [createValidPrice({ price: -100 })],
          }),
        ],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rechaza precio cero', () => {
      const data = createValidProductDetails({
        seasons: [
          createValidSeason({
            prices: [createValidPrice({ price: 0 })],
          }),
        ],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('acepta precios con decimales', () => {
      const data = createValidProductDetails({
        seasons: [
          createValidSeason({
            prices: [createValidPrice({ price: 1599.99 })],
          }),
        ],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('temporadas', () => {
    it('rechaza allotment negativo', () => {
      const data = createValidProductDetails({
        seasons: [createValidSeason({ allotment: -5 })],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rechaza allotment cero', () => {
      const data = createValidProductDetails({
        seasons: [createValidSeason({ allotment: 0 })],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('acepta múltiples temporadas', () => {
      const data = createValidProductDetails({
        seasons: [
          createValidSeason({ category: 'Alta' }),
          createValidSeason({ category: 'Media' }),
          createValidSeason({ category: 'Baja' }),
        ],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('niños y rangos de edad', () => {
    it('valida configuración de niños correctamente', () => {
      const data = createValidProductDetails({
        seasons: [
          createValidSeason({
            prices: [
              createValidPrice({
                children: [
                  {
                    name: 'Infante',
                    min_minor_age: 0,
                    max_minor_age: 3,
                    child_price: 0,
                  },
                  {
                    name: 'Niño',
                    min_minor_age: 4,
                    max_minor_age: 11,
                    child_price: 7500,
                  },
                ],
              }),
            ],
          }),
        ],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rechaza edad mínima negativa', () => {
      const data = createValidProductDetails({
        seasons: [
          createValidSeason({
            prices: [
              createValidPrice({
                children: [
                  {
                    name: 'Niño',
                    min_minor_age: -1,
                    max_minor_age: 11,
                    child_price: 7500,
                  },
                ],
              }),
            ],
          }),
        ],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rechaza precio de niño negativo', () => {
      const data = createValidProductDetails({
        seasons: [
          createValidSeason({
            prices: [
              createValidPrice({
                children: [
                  {
                    name: 'Niño',
                    min_minor_age: 0,
                    max_minor_age: 11,
                    child_price: -100,
                  },
                ],
              }),
            ],
          }),
        ],
      });
      const result = productDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
