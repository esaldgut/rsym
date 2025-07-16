// Tipos base del esquema GraphQL

export interface CircuitLocation {
  complementaryDescription?: string;
  coordinates?: number[];
  id?: string;
  place?: string;
  placeSub?: string;
}

export interface Price {
  currency?: string;
  id?: string;
  price?: number;
  roomName?: string;
}

export interface Seasson {
  capacity?: number;
  categories?: string[];
  endDate?: string;
  product_pricing?: number;
  prices?: Price[];
  schedules?: string;
  startDate?: string;
}

export interface User {
  bio?: string;
  email?: string;
  name?: string;
  profile_picture?: string;
  sub?: string;
  username?: string;
}

export interface Comment {
  comment?: string;
  created_at?: string;
  id?: string;
  likeCount: number;
  status?: string;
  updated_at?: string;
  username?: string;
  viewerHasLiked: boolean;
}

export interface Circuit {
  cover_image_url?: string;
  created_at?: string;
  description?: string;
  destination?: CircuitLocation[];
  endDate?: string;
  id: string;
  image_url?: string[];
  included_services?: string;
  language?: string[];
  name?: string;
  preferences?: string[];
  provider_id?: string;
  published?: boolean;
  seassons?: Seasson[];
  startDate?: string;
  status?: string;
  video_url?: string[];
}

export interface Package {
  aditional_services?: string;
  capacity?: number;
  categories?: string[];
  cover_image_url?: string;
  created_at?: string;
  description?: string;
  destination?: CircuitLocation[];
  endDate?: string;
  extraPrices?: Price[];
  id: string;
  image_url?: string[];
  included_services?: string;
  language?: string[];
  name?: string;
  numberOfNights?: string;
  origin?: CircuitLocation[];
  preferences?: string[];
  prices?: Price[];
  provider_id?: string;
  published?: boolean;
  startDate?: string;
  status?: string;
  video_url?: string[];
}

export interface Moment {
  audioUrl?: string;
  comments?: Comment;
  created_at?: string;
  description?: string;
  destination?: CircuitLocation[];
  experienceLink?: string;
  id?: string;
  likeCount?: number;
  likes?: User;
  preferences?: string[];
  resourceType?: string;
  resourceUrl?: string[];
  saves?: User;
  status?: string;
  tags?: string[];
  updated_at?: string;
  user_data?: User;
  viewerHasLiked?: boolean;
}

export interface MarketplaceFeed {
  collection_type?: string;
  cover_image_url?: string;
  description?: string;
  followerNumber?: number;
  id: string;
  location?: string[];
  name?: string;
  preferences?: string[];
  product_pricing?: number;
  provider_id?: string;
  published?: boolean;
  startDate?: string;
  username?: string;
  user_data?: User;
}

export interface LikePayload {
  newLikeCount: number;
  success: boolean;
  viewerHasLiked: boolean;
}

// Input types para mutations
export interface CircuitLocationInput {
  complementaryDescription?: string;
  coordinates?: number[];
  place?: string;
  placeSub?: string;
}

export interface PriceInput {
  currency?: string;
  price?: number;
  roomName?: string;
}

export interface SeassonInput {
  capacity: number;
  categories?: string[];
  endDate?: string;
  prices?: PriceInput[];
  schedules?: string;
  startDate?: string;
}

export interface CreateMomentInput {
  audioUrl?: string;
  description?: string;
  destination?: CircuitLocationInput[];
  experienceLink?: string;
  preferences?: string[];
  resourceType?: string;
  resourceUrl?: string[];
  tags?: string[];
}

export interface CreateCommentInput {
  comment?: string;
  moment_id?: string;
}
