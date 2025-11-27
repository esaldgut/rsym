/**
 * Tipos TypeScript actualizados desde el backend GraphQL real
 * Importados desde el archivo generado local del proyecto
 * Mantiene compatibilidad con AWS Amplify v6
 */

// Import types from GraphQL for use within this file
import type {
  Location,
  LocationInput,
  Point,
  PointInput,
  Product,
  ProductPrice,
  ProductPriceInput,
  ProductSeason,
  ProductSeasonInput,
  User,
  UserStats,
  WeekDays,
  ChildRange,
  ChildRangeInput,
  GuaranteedDepartures,
  GuaranteedDeparturesInput,
  PaymentPolicy as PaymentPolicyGraphQL,
  PaymentPolicyInput as PaymentPolicyInputGraphQL,
  InputMaybe
} from '@/generated/graphql'

// Re-export backend types for consistency from LOCAL project file
export type {
  CreateProductOfTypeCircuitInput,
  CreateProductOfTypePackageInput,
  GuaranteedDepartures,
  GuaranteedDeparturesInput,
  Location,
  LocationInput,
  PaginationInput,
  PaymentPolicy as PaymentPolicyGraphQL,
  PaymentPolicyInput as PaymentPolicyInputGraphQL,
  Point,
  PointInput,
  Product,
  ProductConnection,
  ProductFilterInput,
  ProductPrice,
  ProductPriceInput,
  ProductSeason,
  ProductSeasonInput,
  UpdateProductInput,
  User,
  UserStats,
  WeekDays,
  ChildRange,
  ChildRangeInput,
  InputMaybe
} from '@/generated/graphql'

// Tipos escalares de AWS
export type AWSDateTime = string;
export type AWSJSON = string;

// DEPRECATED: Migrar a types/location.ts para usar GraphQL schema oficial
// Tipos base - USAR LocationInput del schema oficial
export interface CircuitLocation {
  id?: string;
  place?: string;
  placeSub?: string;
  coordinates?: number[];
  complementaryDescription?: string;
  amazon_location_service_response?: string;
}

// Point, PointInput, Location y LocationInput ahora se importan desde @/generated/graphql

export interface Price {
  id?: string;
  currency?: string;
  price?: number;
  roomName?: string;
}

export interface Season {
  capacity?: number;
  categories?: string[];
  startDate?: AWSDateTime;
  endDate?: AWSDateTime;
  product_pricing?: number;
  prices?: Price[];
  schedules?: string;
}

export interface Policy {
  title?: string;
  policy?: string;
}

// User ahora se importa desde @/generated/graphql

export interface CognitoUser {
  id?: string;
  cognito_sub?: string;
  username?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  locale?: string;
  zoneinfo?: string;
  birthdate?: string;
  gender?: string;
  address?: string;
  user_type?: string;
  interest_rate?: string;
  budget?: string;
  have_a_visa?: boolean;
  have_a_passport?: boolean;
  req_special_services?: boolean;
  provider_is_approved?: boolean;
  profile_photo_path?: string;
  profile_preferences?: string;
  custom_attributes?: AWSJSON;
  last_sync?: AWSDateTime;
  created_at?: AWSDateTime;
  updated_at?: AWSDateTime;
  providers_policies?: Policy;
}

// Tipos de Momentos
export interface Comment {
  id?: string;
  comment?: string;
  user_data?: User;
  created_at?: AWSDateTime;
  updated_at?: AWSDateTime;
  status?: string;
  likeCount?: number;
  viewerHasLiked?: boolean;
}

export interface Moment {
  id?: string;
  description?: string;
  destination?: CircuitLocation[];
  experienceLink?: string;
  preferences?: string[];
  resourceType?: string;
  resourceUrl?: string[];
  audioUrl?: string;
  tags?: string[];
  created_at?: AWSDateTime;
  updated_at?: AWSDateTime;
  status?: string;
  user_data?: User;
  comments?: Comment;
  likes?: User;
  saves?: User;
  likeCount?: number;
  viewerHasLiked?: boolean;
}

// Tipos de Marketplace
export interface Circuit {
  id: string;
  name?: string;
  description?: string;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  provider_id?: string;
  destination?: CircuitLocation[];
  startDate?: AWSDateTime;
  endDate?: AWSDateTime;
  included_services?: string;
  language?: string[];
  preferences?: string[];
  seasons?: Season[];
  published?: boolean;
  status?: string;
  created_at?: AWSDateTime;
}

export interface Package {
  id: string;
  name?: string;
  description?: string;
  cover_image_url?: string;
  image_url?: string[];
  video_url?: string[];
  provider_id?: string;
  destination?: CircuitLocation[];
  origin?: CircuitLocation[];
  startDate?: AWSDateTime;
  endDate?: AWSDateTime;
  included_services?: string;
  aditional_services?: string;
  language?: string[];
  preferences?: string[];
  categories?: string[];
  capacity?: number;
  numberOfNights?: string;
  prices?: Price[];
  extraPrices?: Price[];
  published?: boolean;
  status?: string;
  created_at?: AWSDateTime;
}

export interface MarketplaceFeed {
  id: string;
  collection_type?: string;
  name?: string;
  description?: string;
  cover_image_url?: string;
  location?: string[];
  preferences?: string[];
  product_pricing?: number;
  provider_id?: string;
  published?: boolean;
  startDate?: AWSDateTime;
  followerNumber?: number;
  user_data?: User;
}

// Tipos de Reservaciones y Pagos

// ✅ AÑADIDO: PaymentPlan interface (23 campos completos)
export interface PaymentPlan {
  id: string;
  product_id: string;
  reservation_id: string;
  status: string;
  payment_type_selected: 'CONTADO' | 'PLAZOS';
  currency: string;
  total_cost: number;
  travel_date: AWSDateTime;
  reservation_date: AWSDateTime;
  created_at: AWSDateTime;
  updated_at: AWSDateTime;
  allows_date_change: boolean;
  change_deadline_days: number;
  benefits_statements?: string[];
  cash_discount_amount: number;
  cash_discount_percentage: number;
  cash_final_amount: number;
  cash_payment_deadline: AWSDateTime;
  cash_payment_methods?: string[];
  installment_down_payment_amount: number;
  installment_down_payment_percentage: number;
  installment_amount_per_payment: number;
  installment_number_of_payments: number;
  installment_frequency_days: number;
  installment_total_amount: number;
  installment_first_payment_deadline: AWSDateTime;
  installment_payment_deadline: AWSDateTime;
  installment_payment_methods?: string[];
  installment_available_days: number;
}

// ✅ CORREGIDO: Solo campos que existen en backend schema (schemas/schema-raw.graphql:472-487)
// PaymentPlan es un tipo separado, generado con generatePaymentPlan mutation
export interface Reservation {
  id: string;
  adults?: number;
  kids?: number;
  babys?: number;
  companions?: Array<{
    name?: string;
    family_name?: string;
    passport_number?: string;
    birthday?: AWSDateTime;
    gender?: string;
    country?: string;
  }>;
  experience_id?: string;
  experience_type?: string;
  price_per_person?: number;
  price_per_kid?: number;
  total_price?: number; // Backend-calculated secure price
  reservationDate?: AWSDateTime;
  status?: string;
  type?: 'CONTADO' | 'PLAZOS'; // Tipo de pago seleccionado
  // ❌ REMOVIDO: season_id, price_id, payment_plan - No existen en schema backend
}

export interface Payment {
  id: string;
  reservation_id: string;
  payment_method: string;
  payment_date?: AWSDateTime;
  total: number;
  currency: string;
  status: string;
  payment_url?: string;
  mit_reference?: string;
  mit_authorization?: string;
  mit_transaction_id?: string;
  created_at: AWSDateTime;
}

// Tipos oficiales de Products del GraphQL schema - REFACTORIZADOS

// Interfaces locales para departures (no existen en GraphQL generado)
// Usan Location y LocationInput importados desde @/generated/graphql
export interface RegularDepartureInput {
  origin: LocationInput;
  days: WeekDays[];
}

export interface RegularDeparture {
  origin: Location;
  days: WeekDays[];
}

// Rango de fechas para salidas específicas
export interface DateRangeInput {
  start_datetime: AWSDateTime;
  end_datetime: AWSDateTime;
}

export interface DateRange {
  start_datetime: AWSDateTime;
  end_datetime: AWSDateTime;
}

// Salida específica con origen específico y sus rangos de fechas
// Usan Location y LocationInput importados desde @/generated/graphql
export interface SpecificDepartureInput {
  origin: LocationInput;
  date_ranges: DateRangeInput[];
}

export interface SpecificDeparture {
  origin: Location;
  date_ranges: DateRange[];
}

// GuaranteedDepartures y GuaranteedDeparturesInput ahora se importan desde @/generated/graphql
// NOTA: Las interfaces RegularDeparture y SpecificDeparture son locales ya que no existen en GraphQL

// ChildRange, ChildRangeInput, ProductPrice, ProductPriceInput, ProductSeason, ProductSeasonInput
// y WeekDays ahora se importan desde @/generated/graphql

// DEPRECATED: Usar LocationInput del schema oficial
export interface CircuitLocationInput {
  id?: string;
  place?: string;
  placeSub?: string;
  coordinates?: number[];
  complementaryDescription?: string;
  amazon_location_service_response?: string;
}

export interface PriceInput {
  id?: string;
  currency?: string;
  price?: number;
  roomName?: string;
}

export interface CreatePackageInput {
  aditional_services?: string;
  capacity?: number;
  categories?: string[];
  cover_image_url?: string;
  created_at?: AWSDateTime;
  description?: string;
  destination?: CircuitLocationInput[];
  endDate?: AWSDateTime;
  extraPrices?: PriceInput[];
  image_url?: string[];
  included_services?: string;
  language?: string[];
  name: string; // Required field
  numberOfNights?: string;
  origin?: CircuitLocationInput[];
  preferences?: string[];
  prices?: PriceInput[];
  provider_id?: string;
  published?: boolean;
  startDate?: AWSDateTime;
  video_url?: string[];
}

export interface UpdatePackageInput {
  aditional_services?: string;
  capacity?: number;
  categories?: string[];
  cover_image_url?: string;
  description?: string;
  destination?: CircuitLocationInput[];
  endDate?: AWSDateTime;
  extraPrices?: PriceInput[];
  image_url?: string[];
  included_services?: string;
  language?: string[];
  name?: string;
  numberOfNights?: string;
  origin?: CircuitLocationInput[];
  preferences?: string[];
  prices?: PriceInput[];
  published?: boolean;
  startDate?: AWSDateTime;
  video_url?: string[];
}

export interface CreateMomentInput {
  description?: string;
  destination?: CircuitLocation[];
  experienceLink?: string;
  preferences?: string[];
  resourceType?: string;
  resourceUrl?: string[];
  tags?: string[];
  audioUrl?: string;
}

export interface CreateCommentInput {
  comment?: string;
  moment_id?: string;
}

// Enum de estados de reservación (alineado con backend Go y GraphQL schema)
export type ReservationStatus =
  | 'IN_PROGRESS'
  | 'FINALIZED'
  | 'CANCELED'
  | 'PROCESSED'
  | 'MIT_PAYMENT_PENDING'
  | 'AWAITING_MANUAL_PAYMENT';

// ✅ CORREGIDO: Solo campos que existen en backend schema (schemas/schema-raw.graphql:724-728)
// Backend calcula precios automáticamente con Secure Pricing System
export interface ReservationInput {
  adults: number;
  kids: number;
  babys: number;
  experience_id: string;
  collection_type: string; // 'circuit' | 'package'
  type: 'CONTADO' | 'PLAZOS'; // Tipo de pago
  reservationDate?: AWSDateTime;
  status?: ReservationStatus; // Opcional - Backend asigna IN_PROGRESS si no se envía

  // ❌ REMOVIDO: season_id, price_id - No existen en schema backend
  // Backend calcula precios automáticamente usando su Secure Pricing System
  // No se envían precios desde frontend (price_per_person, price_per_kid, total_price)
}

export interface PaymentInput {
  reservation_id: string;
  payment_method: string;
  promotions: boolean;
}

// ✅ NUEVO: PaymentPlanInput para generatePaymentPlan mutation
// Schema: schemas/schema-raw.graphql:750-756
export interface PaymentPlanInput {
  product_id: string;
  total_cost: number;
  travel_date: AWSDateTime;
  currency: string;
  payment_type_selected: 'CONTADO' | 'PLAZOS';
}

// ✅ NUEVO: UpdatePaymentPlanInput para updatePaymentPlan mutation
export interface UpdatePaymentPlanInput {
  id: string;
  payment_type_selected?: 'CONTADO' | 'PLAZOS';
  status?: 'ACTIVE' | 'SELECTED' | 'COMPLETED' | 'CANCELLED';
}

// Additional type exports from GraphQL generated types
export type {
  PaymentRequirements,
  PaymentRequirementsInput,
  PaymentConfig,
  PaymentConfigInput,
  PaymentOption,
  PaymentOptionInput,
  PaymentType,
  PaymentMethods,
  DiscountType,
  DownPaymentType,
  InstallmentIntervals,
  CashConfig,
  CashConfigInput,
  InstallmentsConfig,
  InstallmentsConfigInput,
  GeneralPolicies,
  GeneralPoliciesInput,
  ChangePolicy,
  ChangePolicyInput,
  Statements,
  StatementsInput
} from '@/generated/graphql'

// Use the re-exported types with GraphQL suffix to avoid confusion
export type PaymentPolicyInput = PaymentPolicyInputGraphQL;
export type PaymentPolicy = PaymentPolicyGraphQL;

// Response Types
export interface LikePayload {
  success: boolean;
  newLikeCount: number;
  viewerHasLiked: boolean;
}

export interface SavePayload {
  success: boolean;
  newSaveCount: number;
  viewerHasSaved: boolean;
}

// Product Query Response Types
export interface ProductQueryResponse {
  items: Product[];
  nextToken?: string;
  total?: number;
}

// Product interface is now imported from backend
// Backend Product includes user_data which was missing in my implementation

export interface PaymentResponse {
  id: string;
  reservation_id: string;
  payment_url?: string;
  status: string;
  total: number;
  currency: string;
  payment_method: string;
  created_at: AWSDateTime;
}

// ==================== FRIENDSHIP TYPES ====================
// Tipos basados en toggle-friendship Lambda (MongoDB collections)

// Estado de conexión (Friendship)
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'BLOCKED';

// Estado de seguimiento (Follow)
export type FollowStatus = 'ACTIVE' | 'BLOCKED';

// Relación de amistad/conexión entre usuarios
export interface Friendship {
  id: string;
  user1_id: string;
  user1_type: string;
  user2_id: string;
  user2_type: string;
  status: ConnectionStatus;
  initiated_by: string;
  created_at: AWSDateTime;
  updated_at: AWSDateTime;
  // User data enriquecida desde backend
  user1_data?: User;
  user2_data?: User;
}

// Relación de seguimiento
export interface Follow {
  id: string;
  follower_id: string;
  follower_type: string;
  following_id: string;
  following_type: string;
  status: FollowStatus;
  created_at: AWSDateTime;
  // User data enriquecida desde backend
  follower_data?: User;
  following_data?: User;
}

// UserStats ahora se importa desde @/generated/graphql

// Estado combinado de relación entre dos usuarios
export interface RelationshipStatus {
  user_id: string;
  target_user_id: string;
  connection_status: ConnectionStatus | null;
  connection_id: string | null;
  initiated_by: string | null;
  is_following: boolean;
  is_followed_by: boolean;
  is_blocked: boolean;
  is_blocked_by: boolean;
}

// Respuesta paginada para conexiones
export interface ConnectionsResponse {
  items: Friendship[];
  next_token?: string;
  total_count?: number;
}

// Respuesta paginada para follows
export interface FollowsResponse {
  items: Follow[];
  next_token?: string;
  total_count?: number;
}

// ==================== CHAT TYPES ====================
// Tipos basados en mongodb-atlas-chat Lambda (MongoDB collections)

// Estado de mensaje
export type MessageStatus = 'sent' | 'delivered' | 'read';

// Permiso de chat (validación de backend)
export interface ChatPermission {
  allowed: boolean;
  reason?: string;
}

// Mensaje individual
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  status: MessageStatus;
  created_at: AWSDateTime;
  updated_at: AWSDateTime;
  // User data enriquecida desde backend
  sender_data?: User;
}

// Conversación (chat entre dos usuarios)
export interface Conversation {
  id: string;
  participant1_id: string;
  participant1_type: string;
  participant2_id: string;
  participant2_type: string;
  last_message?: string;
  last_message_at?: AWSDateTime;
  created_at: AWSDateTime;
  updated_at: AWSDateTime;
  // Contadores de mensajes no leídos
  participant1_unread_count: number;
  participant2_unread_count: number;
  // User data enriquecida desde backend
  participant1_data?: User;
  participant2_data?: User;
  // Último mensaje completo
  last_message_data?: Message;
}

// Respuesta paginada para conversaciones
export interface ConversationsResponse {
  items: Conversation[];
  next_token?: string;
  total_count?: number;
}

// Respuesta paginada para mensajes
export interface MessagesResponse {
  items: Message[];
  next_token?: string;
  total_count?: number;
}

// Input para crear/obtener conversación
export interface ConversationInput {
  participant1_id: string;
  participant1_type: string;
  participant2_id: string;
  participant2_type: string;
}

// Input para enviar mensaje
export interface SendMessageInput {
  conversation_id: string;
  content: string;
}

// Input para marcar mensajes como leídos
export interface MarkAsReadInput {
  conversation_id: string;
  message_ids: string[];
}

// Input para marcar mensaje como entregado
export interface MarkAsDeliveredInput {
  conversation_id: string;
  message_id: string;
}
