/**
 * Tipos TypeScript actualizados desde el backend GraphQL real
 * Importados desde /Users/esaldgut/dev/src/react/aws-amplify-next/src/generated/graphql.ts
 * Mantiene compatibilidad con AWS Amplify v6
 */

// Re-export backend types for consistency
export type {
  CreateProductOfTypeCircuitInput,
  CreateProductOfTypePackageInput, GuaranteedDepartures,
  GuaranteedDeparturesInput, Location,
  LocationInput, PaginationInput, PaymentPolicy,
  PaymentPolicyInput, Point,
  PointInput, Product,
  ProductConnection,
  ProductFilterInput, ProductPrice,
  ProductPriceInput, ProductSeason,
  ProductSeasonInput, UpdateProductInput, User
} from '/Users/esaldgut/dev/src/react/aws-amplify-next/src/generated/graphql'

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

// Tipos oficiales del GraphQL schema (líneas 323-331, 189-194)
export interface Point {
  longitude?: number;
  latitude?: number;
}

export interface PointInput {
  longitude?: number;
  latitude?: number;
}

export interface Location {
  id?: string;
  complementary_description?: string;
  coordinates?: Point;
  place?: string;
  placeSub?: string;
}

export interface LocationInput {
  complementary_description?: string;
  coordinates?: PointInput;
  place?: string;
  placeSub?: string;
}

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

export interface User {
  sub?: string;
  username?: string;
  email?: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
}

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
export interface Reservation {
  id: string;
  kids?: number;
  babys?: number;
  adults?: number;
  price_per_person?: number;
  price_per_kid?: number;
  total_price?: number;
  experience_id?: string;
  experience_type?: string;
  reservationDate?: AWSDateTime;
  status?: string;
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

// Salida regular con origen específico y sus días
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
export interface SpecificDepartureInput {
  origin: LocationInput;
  date_ranges: DateRangeInput[];
}

export interface SpecificDeparture {
  origin: Location;
  date_ranges: DateRange[];
}

// Tipo principal refactorizado para mapeo correcto del esquema GraphQL
export interface GuaranteedDeparturesInput {
  specific_dates?: AWSDateTime[];
  origin?: LocationInput[];
  days?: WeekDays[];
}

export interface GuaranteedDepartures {
  regular_departures?: RegularDeparture[];
  specific_departures?: SpecificDeparture[];
}

export interface ChildRange {
  name: string;
  min_minor_age: number;
  max_minor_age: number;
  child_price: number;
}

export interface ChildRangeInput {
  name: string;
  min_minor_age: number;
  max_minor_age: number;
  child_price: number;
}

export interface ProductPrice {
  id?: string;
  currency: string;
  price: number;
  room_name: string;
  max_adult: number;
  max_minor: number;
  children: ChildRange[];
}

export interface ProductPriceInput {
  currency: string;
  price: number;
  room_name: string;
  max_adult: number;
  max_minor: number;
  children: ChildRangeInput[];
}

export interface ProductSeason {
  id?: string;
  allotment?: number;
  category?: string;
  start_date?: AWSDateTime;
  end_date?: AWSDateTime;
  schedules?: string;
  prices?: ProductPrice[];
  aditional_services?: string;
  number_of_nights?: string;
  allotment_remain?: number;
  extra_prices?: ProductPrice[];
}

export interface ProductSeasonInput {
  allotment?: number;
  category?: string;
  start_date?: AWSDateTime;
  end_date?: AWSDateTime;
  schedules?: string;
  prices?: ProductPriceInput[];
  aditional_services?: string;
  number_of_nights?: string;
  allotment_remain?: number;
  extra_prices?: ProductPriceInput[];
}

export enum WeekDays {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

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

export interface ReservationInput {
  kids: number;
  babys: number;
  adults: number;
  price_per_person: number;
  price_per_kid: number;
  total_price: number;
  experience_id: string;
  collection_type: string;
  reservationDate?: AWSDateTime;
  status?: string;
}

export interface PaymentInput {
  reservation_id: string;
  payment_method: string;
  promotions: boolean;
}

// Payment Policy Types
export interface PaymentRequirements {
  deadline_days_to_pay?: number; // Nullable para evitar error GraphQL
}

export interface PaymentConfig {
  cash?: {
    discount?: number;
    discount_type?: string;
    deadline_days_to_pay?: number;
    payment_methods?: string[];
  };
  installments?: {
    down_payment_before?: number;
    down_payment_type?: string;
    down_payment_after?: number;
    installment_intervals?: string;
    days_before_must_be_settled?: number;
    deadline_days_to_pay?: number;
    payment_methods?: string[];
  };
}

export interface PaymentOption {
  type?: string;
  description?: string;
  config?: PaymentConfig;
  requirements?: PaymentRequirements;
  benefits_or_legal?: {
    stated?: string;
  };
}

export interface PaymentPolicyInput {
  product_id: string;
  options: PaymentOption[];
  general_policies?: {
    change_policy?: {
      allows_date_change?: boolean;
      deadline_days_to_make_change?: number;
    };
  };
}

export interface PaymentPolicy {
  id?: string;
  product_id?: string;
  provider_id?: string;
  status?: string;
  version?: string;
  created_at?: AWSDateTime;
  updated_at?: AWSDateTime;
  options?: PaymentOption[];
  general_policies?: {
    change_policy?: {
      allows_date_change?: boolean;
      deadline_days_to_make_change?: number;
    };
  };
}

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

// Estadísticas de usuario
export interface UserStats {
  userId: string;
  connectionsCount: number;
  followersCount: number;
  followingCount: number;
  blockedUsersCount: number;
  pendingRequestsReceived: number;
  pendingRequestsSent: number;
}

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
