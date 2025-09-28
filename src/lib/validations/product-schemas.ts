import { z } from 'zod';

// Validaciones comunes
const locationInputSchema = z.object({
  place: z.string().min(1, 'Lugar requerido'),
  placeSub: z.string().optional(),
  coordinates: z.object({
    longitude: z.number(),
    latitude: z.number()
  }).optional(),
  complementary_description: z.string().optional()
});

const childRangeSchema = z.object({
  name: z.string().min(1, 'Nombre de rango requerido'),
  min_minor_age: z.number().int().nonnegative('Edad mínima no puede ser negativa'),
  max_minor_age: z.number().int().positive('Edad máxima debe ser mayor a 0'),
  child_price: z.number().nonnegative('Precio niño no puede ser negativo')
});

const productPriceSchema = z.object({
  currency: z.string().min(1, 'Moneda requerida'),
  price: z.number().positive('Precio debe ser mayor a 0'),
  room_name: z.string().min(1, 'Nombre de habitación requerido'),
  max_adult: z.number().int().positive('Máximo adultos debe ser mayor a 0'),
  max_minor: z.number().int().nonnegative('Máximo menores no puede ser negativo'),
  children: z.array(childRangeSchema)
});

const productSeasonSchema = z.object({
  category: z.string().min(1, 'Categoría de temporada requerida'),
  start_date: z.string().min(1, 'Fecha de inicio requerida'),
  end_date: z.string().min(1, 'Fecha de fin requerida'),
  allotment: z.number().int().positive('Disponibilidad debe ser mayor a 0'),
  allotment_remain: z.number().int().nonnegative('Disponibilidad restante no puede ser negativa'),
  schedules: z.string().optional(),
  aditional_services: z.string().optional(),
  number_of_nights: z.string().optional(),
  prices: z.array(productPriceSchema).min(1, 'Agrega al menos una opción de precio'),
  extra_prices: z.array(productPriceSchema).optional()
});

// Esquema para información general - Circuitos
export const generalInfoCircuitSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  preferences: z.array(z.string()).min(1, 'Selecciona al menos un tipo de interés'),
  languages: z.array(z.string()).min(1, 'Selecciona al menos un idioma'),
  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  cover_image_url: z.string().optional(),
  image_url: z.array(z.string()).optional(),
  video_url: z.array(z.string()).optional()
});

// Esquema para información general - Paquetes
export const generalInfoPackageSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  preferences: z.array(z.string()).min(1, 'Selecciona al menos un tipo de interés'),
  languages: z.array(z.string()).min(1, 'Selecciona al menos un idioma'),
  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  cover_image_url: z.string().optional(),
  image_url: z.array(z.string()).optional(),
  video_url: z.array(z.string()).optional()
});

// Esquemas para las nuevas estructuras refactorizadas
const regularDepartureSchema = z.object({
  origin: locationInputSchema,
  days: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])).min(1, 'Selecciona al menos un día para esta ciudad')
});

const dateRangeSchema = z.object({
  start_datetime: z.string().min(1, 'Fecha de inicio requerida'),
  end_datetime: z.string().min(1, 'Fecha de fin requerida')
}).refine((data) => {
  // Validar que end_datetime >= start_datetime
  const startDate = new Date(data.start_datetime);
  const endDate = new Date(data.end_datetime);
  return endDate >= startDate;
}, {
  message: "La fecha de fin debe ser igual o posterior a la fecha de inicio",
  path: ["end_datetime"]
});

const specificDepartureSchema = z.object({
  origin: locationInputSchema,
  date_ranges: z.array(dateRangeSchema).min(1, 'Agrega al menos un rango de fechas para esta ciudad')
});

const guaranteedDeparturesSchema = z.object({
  regular_departures: z.array(regularDepartureSchema).optional(),
  specific_departures: z.array(specificDepartureSchema).optional()
}).refine((data) => {
  // Al menos una salida regular o específica debe estar definida
  const hasRegular = data.regular_departures && data.regular_departures.length > 0;
  const hasSpecific = data.specific_departures && data.specific_departures.length > 0;
  return hasRegular || hasSpecific;
}, {
  message: "Define al menos una salida garantizada (regular o específica)",
  path: ["regular_departures"]
});

// Schema unificado para detalles de producto (circuit y package)
export const productDetailsSchema = z.object({
  destination: z.array(locationInputSchema).min(1, 'Agrega al menos un destino'),
  departures: guaranteedDeparturesSchema.optional(),
  itinerary: z.string().min(20, 'El itinerario debe ser más detallado (mínimo 20 caracteres)'),
  seasons: z.array(productSeasonSchema).min(1, 'Agrega al menos una temporada'),
  planned_hotels_or_similar: z.array(z.string()).optional()
}).refine((data) => {
  // Validación dinámica basada en el número de destinos
  const isCircuit = data.destination.length >= 2;
  
  if (isCircuit) {
    // Para circuitos: requiere itinerario más detallado
    return data.itinerary.length >= 50;
  } else {
    // Para packages: validar número de noches en temporadas
    return data.seasons.every(season => season.number_of_nights && season.number_of_nights.length > 0);
  }
}, {
  message: "Los circuitos requieren itinerario detallado (50+ caracteres). Los paquetes requieren número de noches en todas las temporadas.",
  path: ["seasons"]
});

// Schemas legacy mantenidos para compatibilidad
export const tourDetailsSchema = productDetailsSchema.refine((data) => data.destination.length >= 2, {
  message: "Los circuitos requieren al menos 2 destinos",
  path: ["destination"]
});

export const packageDetailsSchema = productDetailsSchema.refine((data) => data.destination.length === 1, {
  message: "Los paquetes requieren exactamente 1 destino",
  path: ["destination"]
});

// Esquema para políticas de pago
export const policiesSchema = z.object({
  payment_policy: z.object({
    product_id: z.string().min(1, 'ID de producto requerido'),
    options: z.array(z.object({
      type: z.enum(['CONTADO', 'PLAZOS']),
      description: z.string().min(1, 'Descripción requerida'),
      config: z.object({
        cash: z.object({
          discount: z.number().nonnegative('Descuento no puede ser negativo'),
          discount_type: z.enum(['PERCENTAGE', 'AMOUNT']),
          deadline_days_to_pay: z.number().int().positive('Días límite debe ser mayor a 0'),
          payment_methods: z.array(z.enum([
            'CASH', 'BANK_CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'CODI', 'CLICK_TO_PAY'
          ]))
        }).optional(),
        installments: z.object({
          down_payment_before: z.number().nonnegative(),
          down_payment_type: z.enum(['PERCENTAGE', 'AMOUNT']),
          down_payment_after: z.number().nonnegative(),
          installment_intervals: z.enum(['QUINCENAL', 'MENSUAL']),
          days_before_must_be_settled: z.number().int().positive(),
          deadline_days_to_pay: z.number().int().positive(),
          payment_methods: z.array(z.enum([
            'CASH', 'BANK_CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'CODI', 'CLICK_TO_PAY'
          ]))
        }).optional()
      }),
      requirements: z.object({
        deadline_days_to_pay: z.number().int().positive()
      })
    })).min(1, 'Configura al menos una opción de pago'),
    general_policies: z.object({
      change_policy: z.object({
        allows_date_chage: z.boolean(),
        deadline_days_to_make_change: z.number().int().nonnegative()
      }).optional()
    })
  })
});

// Esquemas estrictos para publicación al marketplace
export const publishCircuitSchema = generalInfoCircuitSchema.extend({
  cover_image_url: z.string().url('Se requiere imagen de portada para publicar').min(1, 'Se requiere imagen de portada'),
  image_url: z.array(z.string().url()).min(1, 'Se requiere al menos una imagen adicional para publicar'),
});

export const publishPackageSchema = generalInfoPackageSchema.extend({
  cover_image_url: z.string().url('Se requiere imagen de portada para publicar').min(1, 'Se requiere imagen de portada'),
  image_url: z.array(z.string().url()).min(1, 'Se requiere al menos una imagen adicional para publicar'),
});

// Mapeo de errores técnicos a mensajes amigables para usuarios
const userFriendlyMessages: Record<string, string> = {
  'cover_image_url': 'Agrega una imagen de portada atractiva',
  'image_url': 'Incluye al menos una imagen adicional en la galería',
  'video_url': 'Considera agregar videos para mostrar mejor tu producto',
  'name': 'El nombre del producto es obligatorio',
  'description': 'Escribe una descripción detallada del producto',
  'preferences': 'Selecciona al menos un tipo de interés',
  'languages': 'Indica los idiomas disponibles para tu producto',
  'destination': 'Define los destinos de tu producto turístico',
  'seasons': 'Configura al menos una temporada con precios',
  'itinerary': 'Completa el itinerario detallado',
  'payment_policy': 'Define las políticas de pago',
  'planned_hotels_or_similar': 'Especifica los hoteles o alojamientos'
};

function mapToUserFriendlyMessage(field: string, originalMessage: string): string {
  // Buscar mensaje personalizado
  if (userFriendlyMessages[field]) {
    return userFriendlyMessages[field];
  }
  
  // Mapear errores específicos de coordenadas
  if (field.includes('coordinates')) {
    return 'Las ubicaciones se mapean automáticamente con coordenadas precisas';
  }
  
  // Mapear errores específicos de destinos
  if (field.includes('destination')) {
    return 'Define los destinos de tu producto turístico';
  }
  
  // Mapear errores técnicos comunes
  if (originalMessage.includes('Expected object, received array')) {
    return `Revisa la configuración del campo`;
  }
  if (originalMessage.includes('Required')) {
    return `Campo obligatorio para publicar`;
  }
  if (originalMessage.includes('url')) {
    return `Proporciona una URL válida`;
  }
  if (originalMessage.includes('min')) {
    return `Completa la información requerida`;
  }
  
  // Fallback: mensaje original pero más limpio
  return originalMessage.replace(/Expected \w+, received \w+/g, 'Formato de datos incorrecto');
}

// Función utilitaria para validar si un producto está listo para publicar
export function validateForPublication(productData: any, productType: 'circuit' | 'package') {
  const schema = productType === 'circuit' ? publishCircuitSchema : publishPackageSchema;
  
  try {
    schema.parse(productData);
    return { isValid: true, errors: [], message: '¡Tu producto está listo para publicarse!' };
  } catch (error: any) {
    const rawErrors = error.errors || [];
    
    // Convertir errores técnicos a mensajes amigables
    const friendlyErrors = rawErrors.map((err: any) => {
      const field = err.path.join('.');
      const friendlyMessage = mapToUserFriendlyMessage(field, err.message);
      
      return {
        field,
        message: friendlyMessage,
        priority: getPriorityByField(field)
      };
    });
    
    // Ordenar por prioridad (campos más importantes primero)
    friendlyErrors.sort((a, b) => a.priority - b.priority);
    
    const essentialFieldsCount = friendlyErrors.filter(e => e.priority <= 2).length;
    const totalCount = friendlyErrors.length;
    
    return { 
      isValid: false, 
      errors: friendlyErrors,
      summary: essentialFieldsCount > 0 
        ? `Completa ${essentialFieldsCount} campos esenciales para publicar tu ${productType === 'circuit' ? 'circuito' : 'paquete'}`
        : `Mejora ${totalCount} detalles adicionales para una mejor presentación`
    };
  }
}

// Función para determinar la prioridad de los campos
function getPriorityByField(field: string): number {
  const priorities: Record<string, number> = {
    'name': 1,
    'description': 1,
    'cover_image_url': 1,
    'destination': 1,
    'seasons': 2,
    'preferences': 2,
    'languages': 2,
    'image_url': 3,
    'itinerary': 3,
    'video_url': 4,
    'payment_policy': 4,
    'planned_hotels_or_similar': 5
  };
  
  return priorities[field] || 3;
}