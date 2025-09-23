/**
 * Tipos comunes y compartidos
 * Tipos de utilidad general para toda la aplicación
 */

// ============================================
// Tipos de respuesta API genéricos
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string | null;
  totalCount?: number;
  pageSize?: number;
}

// ============================================
// Tipos de error
// ============================================

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean> | string | null;
  statusCode?: number;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: string | number | boolean | null;
}

// ============================================
// Tipos de formularios
// ============================================

export interface FormState<T = Record<string, unknown>> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface FormAction {
  type: string;
  payload?: string | number | boolean | Record<string, unknown> | unknown[];
}

// ============================================
// Tipos de navegación
// ============================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  badge?: string | number;
  children?: MenuItem[];
  isActive?: boolean;
  isDisabled?: boolean;
}

// ============================================
// Tipos de utilidad generales
// ============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type ValueOf<T> = T[keyof T];
export type KeysOf<T> = keyof T;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// ============================================
// Tipos de estado de carga
// ============================================

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  retryCount?: number;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// ============================================
// Tipos de metadata
// ============================================

export interface Metadata {
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  version?: number;
}

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Tipos de archivos y media
// ============================================

export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
  uploaded?: boolean;
  url?: string;
}

export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video' | 'document';
  name?: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

// ============================================
// Tipos de coordenadas y ubicación
// ============================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: Coordinates;
}

// ============================================
// Tipos de configuración
// ============================================

export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
  version: string;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
}