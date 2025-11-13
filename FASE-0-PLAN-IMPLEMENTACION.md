# 🎯 FASE 0: Creación de Reservaciones - Plan de Implementación Completo

**Fecha**: 2025-10-31
**Status**: 📋 **PLAN DETALLADO - LISTO PARA IMPLEMENTAR**
**Estimated Time**: 10-16 días

---

## 📊 Executive Summary

FASE 0 está **90% implementado**. El booking wizard, server actions, GraphQL mutations, y validaciones ya existen. Este plan se enfoca en:

1. **Completar el 10% faltante** (componentes de UI faltantes)
2. **Mejorar la experiencia de usuario** (página de detalle atractiva)
3. **Agregar componentes opcionales** (Room Type Selector, Companion Details, Seat Counter)
4. **Reutilizar componentes existentes** (ProductGalleryHeader, FullscreenGallery, LocationSelector, HybridProductMap)

---

## 🎯 Objetivos

### Objetivo Principal
Crear una experiencia de reservación **atractiva y completa** desde el marketplace hasta el pago, que supere a la competencia (Exoticca) aprovechando las ventajas únicas de YAAN:

- ✅ Payment plans auto-generados (CONTADO vs PLAZOS)
- ✅ Secure Pricing System (7 business rules)
- ✅ Room distribution inteligente
- ✅ Change policies flexibles
- ✅ Galería interactiva con auto-play
- ✅ Mapas interactivos con AWS Location Service

### Objetivos Secundarios
1. **100% Reusabilidad**: Usar componentes existentes (ProductGalleryHeader, FullscreenGallery, HybridProductMap, LocationSelector)
2. **Atractivo Visual**: Diseño superior que enganche al cliente viajero/influencer/provider
3. **Mobile-First**: Experiencia optimizada para dispositivos móviles
4. **Performance**: Fast loading con Intersection Observer, lazy loading, SSR

---

## 🏗️ Arquitectura Completa FASE 0

### Flujo End-to-End

```
┌──────────────────────────────────────────────────────────────────────┐
│ MARKETPLACE (/marketplace)                                           │
│                                                                      │
│  ExperienceCard (grid con productos)                                │
│         │                                                            │
│         │ Click en producto                                          │
│         ▼                                                            │
│  ProductDetailModal (modal existente)                               │
│         │                                                            │
│         │ Click "Reservar ahora"                                     │
│         ▼                                                            │
│  1. encryptProductUrlAction(id, name, type)                         │
│  2. requireProfileCompletion() → /settings/profile si incompleto    │
│  3. Navigate to /marketplace/booking/[productId]                    │
└──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│ PÁGINA DE DETALLE (/marketplace/booking/[productId])                │
│ ✨ NUEVO - Página completa ANTES del wizard                         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ ProductGalleryHeader (100% reusable)                       │     │
│  │  - Auto-play carousel (5s interval)                        │     │
│  │  - Images + videos                                         │     │
│  │  - Fullscreen integration                                  │     │
│  │  - forwardRef pause/resume                                 │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Product Summary Section                                    │     │
│  │  - Nombre del producto                                     │     │
│  │  - Rating (⭐⭐⭐⭐⭐ 4.8 / 5)                                │     │
│  │  - Precio desde: $5,000 MXN                                │     │
│  │  - Provider avatar + nombre                                │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Descripción Section                                        │     │
│  │  - Descripción completa del viaje                          │     │
│  │  - Preferences tags (🏖️ Playa, 🏔️ Montaña)               │     │
│  │  - Languages available (🇪🇸 Español, 🇺🇸 English)          │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Itinerario Section (NEW ✨)                                │     │
│  │  - ItineraryCard component                                 │     │
│  │  - Day-by-day breakdown                                    │     │
│  │  - Activities por día                                      │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Temporadas y Precios Section (NEW ✨)                      │     │
│  │  - SeasonCard component (horizontal scroll)               │     │
│  │  - Dates (Nov 15 - Dic 15)                                 │     │
│  │  - Nights (8 noches)                                       │     │
│  │  - Category (Alta Temporada)                               │     │
│  │  - Base price ($5,000 por persona)                         │     │
│  │  - Availability badge (15 plazas disponibles)              │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Alojamiento Section                                        │     │
│  │  - HotelCard components                                    │     │
│  │  - Hotel names                                             │     │
│  │  - "o similar" disclaimer                                  │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Mapa de Ruta Section (100% reusable)                       │     │
│  │  - HybridProductMap component                              │     │
│  │  - CognitoLocationMap (si AWS configurado)                 │     │
│  │  - ProductMap (fallback decorativo)                        │     │
│  │  - Route calculation + distance                            │     │
│  │  - Waypoint markers                                        │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Reseñas Section (opcional)                                 │     │
│  │  - ProductReviews component                                │     │
│  │  - Empty state si no hay reseñas                           │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Sticky Footer (CTA)                                        │     │
│  │  - Precio desde: $5,000 MXN                                │     │
│  │  - Button: "Continuar con Reservación" → Wizard           │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
                             │
                             │ Click "Continuar con Reservación"
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│ BOOKING WIZARD (/marketplace/booking/wizard?product=[encrypted])    │
│ 🔧 90% existente - Completar 10% faltante                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ WizardProgress (4 steps)                                   │     │
│  │  [1. Fecha] → [2. Viajeros] → [3. Confirmación] → [4. ✅] │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ ProductSummaryCard (sidebar)                               │     │
│  │  - ProductGalleryHeader (mini version)                     │     │
│  │  - Producto seleccionado                                   │     │
│  │  - Fecha seleccionada                                      │     │
│  │  - Viajeros seleccionados                                  │     │
│  │  - Precio estimado                                         │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ STEP 1: SelectDateStep (existente - mejorar)              │     │
│  │                                                            │     │
│  │  1. Seleccionar Temporada                                  │     │
│  │     - SeasonCard horizontal scroll                         │     │
│  │     - Show dates, nights, category                         │     │
│  │     - Real-time seat counter ✨ NEW                        │     │
│  │                                                            │     │
│  │  2. Seleccionar Tipo de Habitación ✨ NEW                  │     │
│  │     - RoomTypeSelector component                           │     │
│  │     - Show room_name, capacity (max_adult, max_minor)      │     │
│  │     - Show price per room                                  │     │
│  │     - Visual cards con iconos                              │     │
│  │                                                            │     │
│  │  3. Seleccionar Fecha Específica                           │     │
│  │     - DatePicker calendar                                  │     │
│  │     - Disable dates outside season                         │     │
│  │     - Highlight selected date                              │     │
│  │                                                            │     │
│  │  Button: "Continuar" → Step 2                              │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ STEP 2: TravelersStep (existente - mejorar)               │     │
│  │                                                            │     │
│  │  1. Número de Viajeros                                     │     │
│  │     - Adults (1-50) with +/- buttons                       │     │
│  │     - Kids (0-50) with age selector                        │     │
│  │     - Babys (0-20) free                                    │     │
│  │     - Dynamic pricing display por categoría                │     │
│  │     - Capacity validation (room max_adult + max_minor)     │     │
│  │                                                            │     │
│  │  2. Información de Acompañantes ✨ NEW                     │     │
│  │     - CompanionDetailsForm component                       │     │
│  │     - Nombre, apellido, fecha nacimiento                   │     │
│  │     - Pasaporte (opcional - internacional)                 │     │
│  │     - Lead passenger flag                                  │     │
│  │     - Repetir para cada adulto                             │     │
│  │                                                            │     │
│  │  3. Servicios Adicionales (opcional) ✨ NEW                │     │
│  │     - ExtraServicesSelector component                      │     │
│  │     - Mostrar extra_prices[] del producto                  │     │
│  │     - Checkboxes con precios                               │     │
│  │     - Tours, seguros, transfers                            │     │
│  │                                                            │     │
│  │  Button: "Continuar" → Step 3                              │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ STEP 3: ReviewStep (existente)                            │     │
│  │                                                            │     │
│  │  1. Resumen Completo                                       │     │
│  │     - Producto + temporada + habitación                    │     │
│  │     - Fecha de viaje                                       │     │
│  │     - Viajeros (desglosado)                                │     │
│  │     - Servicios adicionales (si aplica)                    │     │
│  │                                                            │     │
│  │  2. Seleccionar Tipo de Pago                               │     │
│  │     - PaymentTypeSelector (100% reusable)                  │     │
│  │     - CONTADO con descuento                                │     │
│  │     - PLAZOS con meses sin intereses                       │     │
│  │                                                            │     │
│  │  3. PaymentPlanSummary                                     │     │
│  │     - Mostrar plan generado por backend                    │     │
│  │     - CONTADO: cash_final_amount                           │     │
│  │     - PLAZOS: down payment + installments[]                │     │
│  │                                                            │     │
│  │  4. Políticas y Términos                                   │     │
│  │     - Política de cambios                                  │     │
│  │     - Política de cancelación                              │     │
│  │     - Checkbox: "Acepto términos y condiciones"            │     │
│  │                                                            │     │
│  │  Server Actions Flow:                                      │     │
│  │    a. checkAvailabilityAction() ✅ ya implementado         │     │
│  │    b. createReservationAction() ✅ ya implementado         │     │
│  │    c. generatePaymentPlanAction() ✅ ya implementado       │     │
│  │                                                            │     │
│  │  Button: "Confirmar y Pagar" → Step 4                      │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ STEP 4: CompletedStep (existente)                         │     │
│  │                                                            │     │
│  │  1. Success Animation                                      │     │
│  │  2. Resumen de Reservación Creada                          │     │
│  │  3. initiateMITPaymentAction() ✅ ya implementado          │     │
│  │  4. Redirect to MIT Gateway checkout                       │     │
│  │  5. Webhook procesa pago (FASE 6 ✅)                       │     │
│  │  6. Redirect to /traveler/payment-confirmation             │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes a Crear (10% Faltante)

### 1. **SeasonCard Component** (NUEVO ✨)
**Ubicación**: `src/components/booking/SeasonCard.tsx`
**Prioridad**: ALTA
**Estimated Time**: 4-6 horas

**Props Interface**:
```typescript
interface SeasonCardProps {
  season: {
    id: string;
    start_date: string;
    end_date: string;
    number_of_nights: string;
    category?: string;
    allotment: number;
    allotment_remain: number;
    prices: Array<{
      room_name: string;
      price: number;
      currency: string;
    }>;
  };
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}
```

**Funcionalidad**:
- Card visualmente atractivo con gradiente
- Mostrar fechas (Nov 15 - Dic 15, 2025)
- Mostrar duración (8 noches)
- Mostrar categoría (Alta Temporada) con badge
- Mostrar precio base desde
- **Real-time seat counter**: `${allotment_remain} plazas disponibles`
- Estado seleccionado con borde colorido
- Hover effect con elevación

**Diseño Visual**:
```
┌──────────────────────────┐
│ 🌟 Alta Temporada        │
│                          │
│ Nov 15 - Dic 15, 2025    │
│ 8 noches                 │
│                          │
│ Desde $5,000 MXN         │
│                          │
│ ✅ 15 plazas disponibles │
└──────────────────────────┘
```

**Código Esqueleto**:
```typescript
export function SeasonCard({ season, index, isSelected, onSelect }: SeasonCardProps) {
  const startDate = format(new Date(season.start_date), "MMM dd", { locale: es });
  const endDate = format(new Date(season.end_date), "MMM dd, yyyy", { locale: es });
  const minPrice = Math.min(...season.prices.map(p => p.price));

  const availabilityStatus = season.allotment_remain <= 0 ? 'sold-out' :
                            season.allotment_remain <= 5 ? 'low-availability' :
                            'available';

  return (
    <div
      onClick={onSelect}
      className={cn(
        "min-w-[280px] p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300",
        isSelected ? "border-pink-500 bg-pink-50 shadow-xl" : "border-gray-200 hover:border-pink-300 hover:shadow-lg"
      )}
    >
      {/* Category Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full">
          {season.category || 'Temporada'}
        </span>
        {availabilityStatus === 'low-availability' && (
          <span className="text-xs font-semibold text-orange-600">¡Últimas plazas!</span>
        )}
      </div>

      {/* Dates */}
      <div className="mb-2">
        <p className="text-lg font-bold text-gray-900">
          {startDate} - {endDate}
        </p>
        <p className="text-sm text-gray-600">
          {season.number_of_nights} noches
        </p>
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">Desde</p>
        <p className="text-2xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          ${minPrice.toLocaleString()} MXN
        </p>
      </div>

      {/* Availability */}
      {availabilityStatus !== 'sold-out' ? (
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-green-700">
            {season.allotment_remain} plazas disponibles
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-red-700">
            Agotado
          </span>
        </div>
      )}
    </div>
  );
}
```

---

### 2. **RoomTypeSelector Component** (NUEVO ✨)
**Ubicación**: `src/components/booking/RoomTypeSelector.tsx`
**Prioridad**: ALTA
**Estimated Time**: 4-6 horas

**Props Interface**:
```typescript
interface RoomTypeSelectorProps {
  prices: Array<{
    id: string;
    room_name: string;
    price: number;
    currency: string;
    max_adult: number;
    max_minor: number;
    children?: Array<{
      name: string;
      min_minor_age: number;
      max_minor_age: number;
      child_price: number;
    }>;
  }>;
  selected: string | null;  // price.id
  onSelect: (priceId: string) => void;
  adults: number;
  kids: number;
}
```

**Funcionalidad**:
- Grid de cards para cada tipo de habitación
- Mostrar capacidad (2 adultos + 2 niños)
- Mostrar precio por habitación
- Iconos visuales (🛏️ cama, 👨‍👩‍👧‍👦 personas)
- Validación de capacidad (disable si excede)
- Estado seleccionado con checkmark
- Tooltip con desglose de precios para niños

**Diseño Visual**:
```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ 🛏️ Habitación Doble│  │ 🛏️🛏️ Habitación    │  │ 🛏️🛏️🛏️ Suite      │
│                    │  │     Triple         │  │                    │
│ 👥 2 adultos       │  │ 👥 3 adultos       │  │ 👥 4 adultos       │
│ 👶 2 niños         │  │ 👶 1 niño          │  │ 👶 2 niños         │
│                    │  │                    │  │                    │
│ $5,000 MXN         │  │ $7,000 MXN         │  │ $10,000 MXN        │
│                    │  │                    │  │                    │
│ ✅ Compatible      │  │ ⚠️ Capacidad       │  │ ⚠️ Excede adultos  │
│                    │  │    excedida        │  │                    │
└────────────────────┘  └────────────────────┘  └────────────────────┘
   (seleccionable)         (deshabilitado)          (deshabilitado)
```

---

### 3. **CompanionDetailsForm Component** (NUEVO ✨)
**Ubicación**: `src/components/booking/CompanionDetailsForm.tsx`
**Prioridad**: MEDIA
**Estimated Time**: 6-8 horas

**Props Interface**:
```typescript
interface CompanionDetailsFormProps {
  companions: Array<{
    id: string;
    name: string;
    family_name: string;
    birthday: string;
    gender?: 'male' | 'female' | 'other';
    country?: string;
    passport_number?: string;
    isLeadPassenger: boolean;
  }>;
  onUpdate: (companions: Array<...>) => void;
  totalAdults: number;
  productType: 'circuit' | 'package';  // International trips require passport
}
```

**Funcionalidad**:
- Un formulario por cada adulto
- Accordion expandible con preview
- Validación con Zod schema
- Campo de pasaporte condicional (internacional)
- Lead passenger selector (radio button)
- Auto-save en localStorage
- Error messages inline

**Diseño Visual**:
```
┌─────────────────────────────────────────────────────────┐
│ Acompañante 1 (Pasajero principal) ✅                   │
│                                                         │
│ Nombre: [Juan                ]  Apellido: [Pérez      ] │
│ Fecha de nacimiento: [📅 15/03/1985                   ] │
│ Género: [⚪ Masculino ⚪ Femenino ⚪ Otro              ] │
│ País: [🇲🇽 México                                     ] │
│                                                         │
│ ✈️ Viaje Internacional                                  │
│ Pasaporte: [M12345678                                 ] │
│ ☑️ Pasajero principal                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Acompañante 2 ▼                                         │
│ María López (15/06/1987) - Completado ✓                │
└─────────────────────────────────────────────────────────┘
   (collapsed accordion)
```

---

### 4. **ExtraServicesSelector Component** (NUEVO ✨)
**Ubicación**: `src/components/booking/ExtraServicesSelector.tsx`
**Prioridad**: BAJA
**Estimated Time**: 3-4 horas

**Props Interface**:
```typescript
interface ExtraServicesSelectorProps {
  extraServices: Array<{
    id: string;
    service_name: string;
    description?: string;
    price: number;
    currency: string;
    icon?: string;  // emoji o icon name
  }>;
  selected: string[];  // Array of service IDs
  onToggle: (serviceId: string) => void;
}
```

**Funcionalidad**:
- Checkboxes con descripción
- Precio claramente visible
- Iconos para servicios comunes (🚌 Transfer, 🛡️ Seguro, 📸 Tour)
- Total parcial de servicios seleccionados
- Optional badge si el servicio es recomendado

**Diseño Visual**:
```
┌─────────────────────────────────────────────────────────┐
│ Servicios Adicionales (Opcional)                        │
│                                                         │
│ ☑️ 🚌 Transfer Aeropuerto - Hotel                       │
│    Transporte privado desde/hasta el aeropuerto         │
│    +$800 MXN                                            │
│                                                         │
│ ☐ 🛡️ Seguro de Viaje Completo                          │
│    Cobertura médica, cancelación, equipaje              │
│    +$1,200 MXN  [⭐ Recomendado]                        │
│                                                         │
│ ☑️ 📸 City Tour Adicional                               │
│    Tour guiado de 4 horas por la ciudad                 │
│    +$600 MXN                                            │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│ Subtotal servicios: $1,400 MXN                          │
└─────────────────────────────────────────────────────────┘
```

---

### 5. **ItineraryCard Component** (NUEVO ✨)
**Ubicación**: `src/components/marketplace/ItineraryCard.tsx`
**Prioridad**: MEDIA
**Estimated Time**: 4-6 horas

**Props Interface**:
```typescript
interface ItineraryCardProps {
  itinerary: string;  // Markdown or plain text with day-by-day
  productType: 'circuit' | 'package';
}
```

**Funcionalidad**:
- Parse itinerary text (asume formato: "Día 1: ...\nDía 2: ...")
- Timeline visual con iconos por día
- Expandible/colapsable por día
- Iconos contextuales (🏨 hotel, 🍽️ comida, 🚌 transporte)
- Markdown rendering si es formato rich text

**Diseño Visual**:
```
┌─────────────────────────────────────────────────────────┐
│ 📅 Día 1: Llegada a Cancún                              │
│ ├─ 🛬 Llegada al aeropuerto internacional               │
│ ├─ 🚌 Transfer al hotel                                 │
│ ├─ 🏨 Check-in en hotel 5 estrellas                     │
│ └─ 🍽️ Cena de bienvenida                                │
│                                                         │
│ 📅 Día 2: Chichén Itzá ▼                                │
│ ├─ 🌅 Desayuno buffet                                   │
│ ├─ 🚌 Salida a Chichén Itzá (8:00 AM)                   │
│ └─ ...                                                  │
│                                                         │
│ 📅 Día 3: Playa del Carmen ▼                            │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

---

### 6. **PaymentPlanSummary Component** (VERIFICAR EXISTENTE)
**Ubicación**: `src/components/booking/PaymentPlanSummary.tsx`
**Prioridad**: ALTA
**Estimated Time**: 2-4 horas (si necesita refactoring)

**Acción**: Verificar si este componente ya existe y funciona correctamente. Si no, crear.

**Props Interface**:
```typescript
interface PaymentPlanSummaryProps {
  paymentPlan: {
    plan_type: 'CONTADO' | 'PLAZOS';
    cash_discount_percentage?: number;
    cash_final_amount?: number;
    installment_count?: number;
    installment_amount?: number;
    down_payment_amount?: number;
    installments?: Array<{
      installment_number: number;
      amount: number;
      due_date: string;
      status: string;
    }>;
  };
  selectedType: 'CONTADO' | 'PLAZOS';
}
```

**Funcionalidad**:
- Mostrar resumen según plan seleccionado
- CONTADO: Monto final con descuento aplicado
- PLAZOS: Down payment + cuotas mensuales
- Timeline de pagos para PLAZOS
- Fechas de vencimiento claramente visibles

---

## 📁 Páginas a Crear

### 1. **Product Detail Page** (NUEVO ✨)
**Ubicación**: `src/app/marketplace/booking/[productId]/page.tsx`
**Prioridad**: ALTA
**Estimated Time**: 8-12 horas

**Funcionalidad**:
- Server Component (SSR)
- Fetch product data con `getProductByIdAction`
- Integrate all sections (Gallery, Description, Itinerary, Seasons, Hotels, Map, Reviews)
- Sticky footer con CTA "Continuar con Reservación"
- Responsive design (mobile-first)
- SEO optimizado (metadata dinámico)

**Estructura**:
```typescript
// src/app/marketplace/booking/[productId]/page.tsx
import { getProductByIdAction } from '@/lib/server/marketplace-product-actions';
import { ProductDetailClient } from './product-detail-client';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { productId: string } }) {
  const result = await getProductByIdAction(params.productId);

  if (!result.success || !result.data) {
    return { title: 'Producto no encontrado' };
  }

  return {
    title: `${result.data.product.name} - YAAN Viajes`,
    description: result.data.product.description?.substring(0, 160),
    openGraph: {
      images: [result.data.product.cover_image_url],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { productId: string } }) {
  const result = await getProductByIdAction(params.productId);

  if (!result.success || !result.data) {
    notFound();
  }

  return <ProductDetailClient product={result.data.product} />;
}
```

**Client Component**:
```typescript
// src/app/marketplace/booking/[productId]/product-detail-client.tsx
'use client';

import { useState, useRef } from 'react';
import { ProductGalleryHeader, ProductGalleryHeaderHandle } from '@/components/marketplace/ProductGalleryHeader';
import { FullscreenGallery } from '@/components/marketplace/FullscreenGallery';
import { HybridProductMap } from '@/components/marketplace/maps/HybridProductMap';
import { SeasonCard } from '@/components/booking/SeasonCard';
import { ItineraryCard } from '@/components/marketplace/ItineraryCard';
import { useRouter } from 'next/navigation';

export function ProductDetailClient({ product }: { product: MarketplaceProduct }) {
  const router = useRouter();
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const galleryRef = useRef<ProductGalleryHeaderHandle>(null);

  const handleContinueToWizard = async () => {
    // Encrypt product data
    const encryptionResult = await encryptProductUrlAction(product.id, product.name, product.product_type);

    // Navigate to wizard
    router.push(`/marketplace/booking/wizard?product=${encryptionResult.encrypted}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gallery Header */}
      <div className="relative h-96">
        <ProductGalleryHeader
          ref={galleryRef}
          images={[product.cover_image_url, ...(product.image_url || [])]}
          videos={product.video_url}
          alt={product.name}
          onOpenFullscreen={() => {
            galleryRef.current?.pause();
            setShowFullscreenGallery(true);
          }}
        />
      </div>

      {/* Content Sections */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* Summary Section */}
        <section>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span>⭐⭐⭐⭐⭐ 4.8 / 5</span>
            <span>•</span>
            <span>Desde ${product.min_product_price?.toLocaleString()} MXN</span>
          </div>
        </section>

        {/* Description */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Descripción</h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {product.description}
          </p>
        </section>

        {/* Itinerary */}
        {product.itinerary && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Itinerario</h2>
            <ItineraryCard itinerary={product.itinerary} productType={product.product_type} />
          </section>
        )}

        {/* Seasons */}
        {product.seasons && product.seasons.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Temporadas y Precios</h2>
            <div className="flex gap-6 overflow-x-auto pb-4">
              {product.seasons.map((season, index) => (
                <SeasonCard
                  key={season.id}
                  season={season}
                  index={index}
                  isSelected={selectedSeasonIndex === index}
                  onSelect={() => setSelectedSeasonIndex(index)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Map */}
        {product.destination && product.destination.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mapa de Ruta</h2>
            <HybridProductMap
              destinations={product.destination}
              productType={product.product_type}
              productName={product.name}
            />
          </section>
        )}
      </div>

      {/* Sticky Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md border-t-2 border-pink-200 p-5 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Desde</p>
            <p className="text-2xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              ${product.min_product_price?.toLocaleString() || '0'} MXN
            </p>
          </div>
          <button
            onClick={handleContinueToWizard}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            Continuar con Reservación →
          </button>
        </div>
      </div>

      {/* Fullscreen Gallery */}
      <FullscreenGallery
        images={[product.cover_image_url, ...(product.image_url || [])]}
        videos={product.video_url}
        alt={product.name}
        isOpen={showFullscreenGallery}
        onClose={() => {
          galleryRef.current?.resume();
          setShowFullscreenGallery(false);
        }}
      />
    </div>
  );
}
```

---

## 🔧 Modificaciones a Código Existente

### 1. **marketplace-client.tsx** (Modificar flujo de reserva)
**Ubicación**: `src/app/marketplace/marketplace-client.tsx`
**Línea**: ~228-270 (función `handleReserveExperience`)

**Cambio**:
```typescript
// ANTES: Navigate directo a booking wizard
router.push(`/marketplace/booking?product=${encryptionResult.encrypted}`);

// DESPUÉS: Navigate a product detail page primero
router.push(`/marketplace/booking/${product.id}`);
```

### 2. **ProductDetailModal.tsx** (Actualizar botón "Reservar ahora")
**Ubicación**: `src/components/marketplace/ProductDetailModal.tsx`
**Línea**: ~209-267 (función `handleReserveClick`)

**Cambio**:
```typescript
// ANTES: Navigate directo a booking wizard
router.push(bookingUrl);

// DESPUÉS: Navigate a product detail page primero
router.push(`/marketplace/booking/${product.id}`);
```

### 3. **booking-client.tsx** (Integrar componentes nuevos)
**Ubicación**: `src/app/marketplace/booking/booking-client.tsx`

**Cambios**:
- Importar `RoomTypeSelector`, `CompanionDetailsForm`, `ExtraServicesSelector`
- Agregar estados al `formData`:
  ```typescript
  interface BookingFormData {
    // Existentes
    selectedSeasonId?: string;
    selectedDate?: string;
    adults: number;
    kids: number;
    babys: number;
    paymentType: 'CONTADO' | 'PLAZOS';

    // NUEVOS ✨
    selectedRoomTypeId?: string;  // price.id
    companions?: Array<CompanionDetails>;
    selectedExtraServices?: string[];  // Array of service IDs

    // Generados por backend
    reservationId?: string;
    paymentPlan?: PaymentPlan;
  }
  ```

- **SelectDateStep**: Agregar `RoomTypeSelector` después de selección de temporada
- **TravelersStep**: Agregar `CompanionDetailsForm` y `ExtraServicesSelector`
- **ReviewStep**: Mostrar resumen de companions y servicios extra

---

## 🧪 Testing Plan

### Unit Tests (Jest + React Testing Library)

**1. SeasonCard Component**
```typescript
// src/components/booking/SeasonCard.test.tsx
describe('SeasonCard', () => {
  it('renders season details correctly', () => {});
  it('shows availability badge when slots > 0', () => {});
  it('shows sold-out badge when allotment_remain = 0', () => {});
  it('highlights selected state', () => {});
  it('calls onSelect when clicked', () => {});
});
```

**2. RoomTypeSelector Component**
```typescript
describe('RoomTypeSelector', () => {
  it('renders all room types', () => {});
  it('disables rooms exceeding capacity', () => {});
  it('shows capacity validation message', () => {});
  it('calls onSelect with priceId', () => {});
});
```

**3. CompanionDetailsForm Component**
```typescript
describe('CompanionDetailsForm', () => {
  it('renders form for each adult', () => {});
  it('validates required fields', () => {});
  it('shows passport field for international trips', () => {});
  it('allows selecting lead passenger', () => {});
  it('calls onUpdate with valid data', () => {});
});
```

### Integration Tests

**1. Product Detail Page Flow**
```typescript
describe('Product Detail Page', () => {
  it('fetches and displays product data', async () => {});
  it('opens fullscreen gallery on image click', () => {});
  it('pauses carousel when fullscreen opens', () => {});
  it('navigates to wizard on CTA click', () => {});
});
```

**2. Booking Wizard Flow**
```typescript
describe('Booking Wizard', () => {
  it('completes full booking flow', async () => {
    // 1. Select season
    // 2. Select room type
    // 3. Select date
    // 4. Enter travelers
    // 5. Enter companion details
    // 6. Select extra services
    // 7. Review and confirm
    // 8. Redirect to payment
  });

  it('validates availability before creating reservation', async () => {});
  it('handles sold-out seasons correctly', async () => {});
  it('handles capacity exceeded errors', async () => {});
});
```

### End-to-End Tests (Playwright)

**1. Complete User Journey**
```typescript
test('complete booking flow from marketplace to payment', async ({ page }) => {
  // 1. Navigate to marketplace
  await page.goto('/marketplace');

  // 2. Click on product
  await page.click('[data-testid="experience-card-1"]');

  // 3. Click "Ver detalles"
  await page.click('[data-testid="product-detail-btn"]');

  // 4. Scroll through sections (Gallery, Description, Itinerary, Seasons, Map)

  // 5. Click "Continuar con Reservación"
  await page.click('[data-testid="continue-booking-btn"]');

  // 6. Wizard Step 1: Select season, room type, date
  await page.click('[data-testid="season-card-0"]');
  await page.click('[data-testid="room-type-doble"]');
  await page.click('[data-testid="date-2025-12-25"]');
  await page.click('[data-testid="continue-step-1"]');

  // 7. Wizard Step 2: Enter travelers and companions
  await page.fill('[data-testid="adults-input"]', '2');
  await page.fill('[data-testid="kids-input"]', '1');
  await page.fill('[data-testid="companion-1-name"]', 'Juan');
  await page.fill('[data-testid="companion-1-family-name"]', 'Pérez');
  await page.click('[data-testid="continue-step-2"]');

  // 8. Wizard Step 3: Review and select payment type
  await page.click('[data-testid="payment-type-contado"]');
  await page.check('[data-testid="accept-terms"]');
  await page.click('[data-testid="confirm-payment-btn"]');

  // 9. Wizard Step 4: Redirect to MIT payment
  await page.waitForURL(/mitpaymentgateway\.com/);

  // Verify reservation was created
  // Verify payment plan was generated
});
```

---

## 📅 Timeline Estimado

### Semana 1: Core Components (5-6 días)
- **Día 1-2**: SeasonCard + RoomTypeSelector
- **Día 3-4**: CompanionDetailsForm + ExtraServicesSelector
- **Día 5-6**: ItineraryCard + PaymentPlanSummary (verificar/refactor)

### Semana 2: Product Detail Page (5-6 días)
- **Día 1-2**: Estructura de página + integración de gallery
- **Día 3-4**: Integración de todas las secciones
- **Día 5-6**: Responsive design + polish

### Semana 3: Wizard Integration (4-5 días)
- **Día 1-2**: Integrar componentes nuevos en wizard
- **Día 3-4**: Testing de flujo completo
- **Día 5**: Bug fixes + refinamiento

**Total**: 14-17 días (con testing incluido)

---

## ✅ Definition of Done

Una tarea se considera completa cuando:

1. **Código**:
   - ✅ Componente implementado con TypeScript strict
   - ✅ Props interface documentada
   - ✅ No errores de compilación
   - ✅ No `any` types innecesarios
   - ✅ Código limpio (no console.log)

2. **Funcionalidad**:
   - ✅ Funciona correctamente en desktop y mobile
   - ✅ Validaciones implementadas (Zod schemas)
   - ✅ Error handling completo
   - ✅ Loading states implementados
   - ✅ Accesibilidad básica (keyboard navigation, ARIA labels)

3. **Integración**:
   - ✅ Integrado con componentes existentes
   - ✅ Server Actions funcionando
   - ✅ GraphQL mutations exitosas
   - ✅ Estado persistente en localStorage (wizard)

4. **Testing**:
   - ✅ Unit tests escritos y pasando
   - ✅ Integration tests exitosos
   - ✅ End-to-end test completo del flujo

5. **Documentación**:
   - ✅ Props documentadas con JSDoc
   - ✅ README actualizado si necesario
   - ✅ Ejemplos de uso incluidos

---

## 🎨 Design System & UI Guidelines

### Colors
```typescript
// Primary gradient
bg-gradient-to-r from-pink-500 to-purple-600

// Success
text-green-700 bg-green-50

// Warning
text-orange-700 bg-orange-50

// Error
text-red-700 bg-red-50

// Neutral
text-gray-900 bg-gray-50
```

### Typography
```typescript
// Headings
h1: text-4xl font-bold
h2: text-2xl font-bold
h3: text-xl font-semibold

// Body
p: text-base leading-relaxed
small: text-sm text-gray-600
```

### Spacing
```typescript
// Sections
space-y-12  // Between major sections
space-y-6   // Between subsections
space-y-3   // Between elements

// Padding
p-6   // Cards
p-4   // Mobile cards
px-8  // Buttons
```

### Shadows
```typescript
shadow-sm    // Light cards
shadow-lg    // Hover states
shadow-2xl   // Sticky footer, important CTAs
```

### Transitions
```typescript
transition-all duration-300  // Smooth interactions
hover:scale-105             // Button hover
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Yarn
- AWS Amplify configurado
- AWS Location Service configurado
- MIT Payment Gateway credentials

### Setup
```bash
# 1. Install dependencies
yarn install

# 2. Verify environment variables
cat .env.local | grep -E "(URL_ENCRYPTION_SECRET|MIT_WEBHOOK_SECRET|MIT_API_KEY|NEXT_PUBLIC_BASE_URL)"

# 3. Run codegen to ensure GraphQL types are up to date
yarn codegen

# 4. Start dev server
yarn dev

# 5. Navigate to marketplace
open http://localhost:3000/marketplace
```

---

## 📝 Next Steps

1. **Review this plan** with team for feedback
2. **Create feature branch**: `git checkout -b feature/fase-0-booking-experience`
3. **Start with SeasonCard** (highest priority, quickest win)
4. **Iterate incrementally** (1 component → test → commit)
5. **Request code reviews** after each major component
6. **Update this plan** as discoveries are made

---

**Status**: ✅ **PLAN COMPLETO Y LISTO PARA IMPLEMENTACIÓN**

**Última actualización**: 2025-10-31
**Creado por**: Claude (Anthropic)
**Próximo paso**: Comenzar implementación de SeasonCard component
