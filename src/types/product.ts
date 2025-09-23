/**
 * Tipos centralizados para Products
 * Fuente única de verdad para todas las interfaces relacionadas con productos
 */

// ============================================
// Tipos base y enums
// ============================================

export type ProductType = 'circuit' | 'package';
export type ProductStatus = 'draft' | 'published' | 'archived';
export type ProductFilter = 'all' | 'circuit' | 'package' | 'draft' | 'published';
export type PaymentType = 'cash' | 'installments';
export type DiscountType = 'percentage' | 'fixed';

// ============================================
// Interfaces de precios y temporadas
// ============================================

export interface ChildPrice {
  name: string;
  min_minor_age: number;
  max_minor_age: number;
  child_price: number;
}

export interface ProductPrice {
  id: string;
  currency: string;
  price: number;
  room_name: string;
  max_adult: number;
  max_minor: number;
  children: ChildPrice[];
}

export interface ProductSeason {
  id: string;
  start_date: string;
  end_date: string;
  category: string;
  allotment: number;
  allotment_remain: number;
  schedules?: string;
  number_of_nights?: string;
  aditional_services?: string;
  prices?: ProductPrice[];
  extra_prices?: ProductPrice[];
}

// ============================================
// Interfaces de ubicación
// ============================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  id?: string;
  place: string;
  placeSub: string;
  complementary_description?: string;
  coordinates?: Coordinates;
}

export interface Departure {
  specific_dates?: string[];
  days?: string[];
  origin?: Location[];
}

// ============================================
// Interfaces de políticas de pago
// ============================================

export interface CashConfig {
  discount: number;
  discount_type: DiscountType;
  deadline_days_to_pay: number;
  payment_methods: string[];
}

export interface InstallmentsConfig {
  down_payment_before: number;
  down_payment_type: DiscountType;
  down_payment_after: number;
  installment_intervals: string;
  days_before_must_be_settled: number;
  deadline_days_to_pay: number;
  payment_methods: string[];
}

export interface PaymentOption {
  type: PaymentType;
  description: string;
  config: {
    cash?: CashConfig;
    installments?: InstallmentsConfig;
  };
  requirements: {
    deadline_days_to_pay: number;
  };
  benefits_or_legal?: Array<{
    stated: string;
  }>;
}

export interface ChangePolicy {
  allows_date_chage: boolean;
  deadline_days_to_make_change: number;
}

export interface PaymentPolicy {
  id: string;
  product_id: string;
  provider_id: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
  options: PaymentOption[];
  general_policies: {
    change_policy: ChangePolicy;
  };
}

// ============================================
// Interface principal de Product
// ============================================

export interface Product {
  id: string;
  name: string;
  description?: string;
  product_type: string;
  status: string;
  published: boolean;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  created_at: string;
  updated_at: string;
  provider_id: string;
  preferences?: string[];
  languages?: string[];
  seasons?: ProductSeason[];
  destination?: Location[];
  departures?: Departure[];
  itinerary?: string;
  planned_hotels_or_similar?: string[];
  payment_policy?: PaymentPolicy;
  min_product_price?: number;
  is_foreign?: boolean;
}

// ============================================
// Interfaces de conexión y paginación
// ============================================

export interface ProductConnection {
  items: Product[];
  nextToken?: string;
}

export interface ProductMetrics {
  total: number;
  published: number;
  drafts: number;
  circuits: number;
  packages: number;
  totalViews?: number;
}

// ============================================
// Interfaces de respuesta de acciones
// ============================================

export interface ProductActionResponse {
  success: boolean;
  message: string;
  error?: string;
  product?: Product;
}

// ============================================
// Interfaces para formularios y creación
// ============================================

export interface ProductFormData {
  name: string;
  description?: string;
  product_type: ProductType;
  preferences?: string[];
  languages?: string[];
  seasons?: ProductSeason[];
  destination?: Location[];
  departures?: Departure[];
  itinerary?: string;
  planned_hotels_or_similar?: string[];
  payment_policy?: PaymentPolicy;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
}

// ============================================
// Props de componentes
// ============================================

export interface ProductCardProps {
  product: Product;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export interface ProductDetailsViewProps {
  product: Product;
  userId: string;
}

export interface EditProductWrapperProps {
  product: Product;
  userId: string;
}

// ============================================
// Tipos de utilidad
// ============================================

export type PartialProduct = Partial<Product>;
export type ProductWithoutId = Omit<Product, 'id'>;
export type ProductCreateInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'provider_id'>;
export type ProductUpdateInput = Partial<ProductCreateInput>;