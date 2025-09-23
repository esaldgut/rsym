/**
 * Tipos centralizados para Autenticación
 * Fuente única de verdad para todas las interfaces de auth
 */

// ============================================
// Tipos base
// ============================================

export type YAANUserType = 'admin' | 'provider' | 'influencer' | 'traveler';

export type AuthStatus =
  | 'authenticated'
  | 'unauthenticated'
  | 'loading'
  | 'error';

// ============================================
// Interfaces de usuario
// ============================================

export interface UserAttributes {
  sub: string;
  email: string;
  email_verified: boolean;
  username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  'custom:user_type'?: YAANUserType;
  'custom:provider_is_approved'?: string;
  'custom:influencer_is_approved'?: string;
  'custom:provider_id'?: string;
  'custom:influencer_id'?: string;
  [key: string]: string | boolean | undefined;
}

export interface UserSession {
  id: string;
  username: string;
  email: string;
  userType: YAANUserType;
  isApproved?: boolean;
  attributes?: UserAttributes;
}

// ============================================
// Interfaces de permisos
// ============================================

export interface UserPermissions {
  userType: YAANUserType;
  isApproved?: boolean;
  inRequiredGroup?: boolean;
  canAccessAdmin?: boolean;
  canCreateProducts?: boolean;
  canCreateMoments?: boolean;
  canManageContent?: boolean;
}

// ============================================
// Interfaces de validación
// ============================================

export interface AuthValidationResult {
  isValid: boolean;
  isAuthenticated: boolean;
  user?: UserSession;
  permissions?: UserPermissions;
  errors: string[];
  needsRefresh?: boolean;
}

// ============================================
// Interfaces de tokens
// ============================================

export interface TokenPayload {
  sub: string;
  email: string;
  'cognito:username': string;
  'cognito:groups'?: string[];
  'custom:user_type'?: YAANUserType;
  exp: number;
  iat: number;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface AuthTokens {
  idToken?: {
    payload: TokenPayload;
    toString: () => string;
  };
  accessToken?: {
    payload: TokenPayload;
    toString: () => string;
  };
  refreshToken?: string;
}

// ============================================
// Interfaces de contexto
// ============================================

export interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions?: UserPermissions;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUserAttributes: (attributes: Partial<UserAttributes>) => Promise<void>;
}

// ============================================
// Interfaces de respuesta
// ============================================

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: UserSession;
  tokens?: AuthTokens;
  error?: string;
}

export interface LoginResponse extends AuthResponse {
  requiresVerification?: boolean;
  requiresMFA?: boolean;
}

export interface SignUpResponse extends AuthResponse {
  userSub?: string;
  requiresConfirmation?: boolean;
}

// ============================================
// Interfaces de guards
// ============================================

export interface RouteGuardProps {
  children: React.ReactNode;
  requiredUserType?: YAANUserType;
  requiresApproval?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// ============================================
// Tipos de utilidad
// ============================================

export type PartialUserAttributes = Partial<UserAttributes>;
export type UserTypeOrNull = YAANUserType | null;
export type AuthStatusCallback = (status: AuthStatus) => void;