/**
 * Tipos TypeScript generados desde el esquema GraphQL de AppSync
 * Mantiene compatibilidad con AWS Amplify v6
 */

// Tipos escalares de AWS
export type AWSDateTime = string;
export type AWSJSON = string;

// Tipos base
export interface CircuitLocation {
  id?: string;
  place?: string;
  placeSub?: string;
  coordinates?: number[];
  complementaryDescription?: string;
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

// Input Types
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