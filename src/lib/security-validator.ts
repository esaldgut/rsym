import { JWT } from 'aws-amplify/auth';
import { logger } from '../utils/logger';

export type UserType = 'provider' | 'consumer';

export interface SecurityValidationResult {
  isValid: boolean;
  userType: UserType;
  userId: string;
  errors: string[];
  warnings: string[];
}

export interface TokenClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  'custom:user_type': UserType;
  'custom:provider_is_approved'?: string;
  'cognito:groups'?: string[];
  exp: number;
  iat: number;
  aud: string;
  iss: string;
}

/**
 * Validador integral de seguridad para tokens y claims
 * Implementa validaciones de lógica de negocio y seguridad
 */
export class SecurityValidator {
  private static readonly REQUIRED_CLAIMS = [
    'sub',
    'email', 
    'email_verified',
    'custom:user_type',
    'exp',
    'iat'
  ];

  private static readonly VALID_USER_TYPES: UserType[] = ['provider', 'consumer'];
  private static readonly TOKEN_EXPIRY_BUFFER = 300; // 5 minutos en segundos

  /**
   * Valida ID Token con validaciones esenciales solamente
   * Siguiendo AWS Amplify v6 best practices - confiar en Amplify para la mayoría de validaciones
   */
  static validateIdToken(idToken: JWT | undefined): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: false,
      userType: 'consumer',
      userId: '',
      errors: [],
      warnings: []
    };

    if (!idToken) {
      // Amplify ya validó el token, pero si no existe, es error real
      result.errors.push('ID Token no encontrado');
      return result;
    }

    const payload = idToken.payload as Partial<TokenClaims>;

    // Validación 1: Solo claims esenciales
    if (!payload.sub) {
      result.errors.push('User ID requerido');
    } else {
      result.userId = payload.sub;
    }

    // Validación 2: UserType con fallback seguro
    const userType = payload['custom:user_type'] as UserType;
    if (userType && this.VALID_USER_TYPES.includes(userType)) {
      result.userType = userType;
    } else {
      // Fallback seguro sin error - permitir acceso como consumer
      result.userType = 'consumer';
      result.warnings.push('UserType no encontrado, usando consumer por defecto');
    }

    // Validación 3: Expiración (Amplify ya maneja esto, solo advertencia)
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      if (timeUntilExpiry <= 0) {
        result.errors.push('Token expirado');
      } else if (timeUntilExpiry <= this.TOKEN_EXPIRY_BUFFER) {
        result.warnings.push(`Token expira pronto: ${timeUntilExpiry}s`);
      }
    }

    // Validación mínima exitosa si tenemos sub
    result.isValid = result.errors.length === 0 && !!result.userId;

    // Solo log si hay errores reales
    if (!result.isValid) {
      logger.warn('Token validation failed', {
        errorCount: result.errors.length,
        userId: result.userId ? '[PRESENT]' : '[MISSING]'
      });
    }

    return result;
  }

  /**
   * Valida que todos los claims requeridos estén presentes
   */
  private static validateRequiredClaims(payload: Partial<TokenClaims>): string[] {
    return this.REQUIRED_CLAIMS.filter(claim => !payload[claim as keyof TokenClaims]);
  }

  /**
   * Valida la expiración del token
   */
  private static validateTokenExpiry(payload: Partial<TokenClaims>): {
    isValid: boolean;
    error?: string;
    warning?: string;
  } {
    if (!payload.exp) {
      return { isValid: false, error: 'Token sin fecha de expiración' };
    }

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;

    if (timeUntilExpiry <= 0) {
      return { isValid: false, error: 'Token expirado' };
    }

    if (timeUntilExpiry <= this.TOKEN_EXPIRY_BUFFER) {
      return {
        isValid: true,
        warning: `Token expira en ${timeUntilExpiry} segundos`
      };
    }

    return { isValid: true };
  }

  /**
   * Valida el tipo de usuario
   */
  private static validateUserType(userType: unknown): {
    isValid: boolean;
    userType?: UserType;
    error?: string;
  } {
    if (!userType) {
      return { isValid: false, error: 'UserType no encontrado' };
    }

    if (!this.VALID_USER_TYPES.includes(userType)) {
      return { 
        isValid: false, 
        error: `UserType inválido: ${userType}. Válidos: ${this.VALID_USER_TYPES.join(', ')}` 
      };
    }

    return { isValid: true, userType };
  }

  /**
   * Valida el formato del user ID (sub)
   */
  private static validateUserId(sub: unknown): {
    isValid: boolean;
    error?: string;
  } {
    if (!sub || typeof sub !== 'string') {
      return { isValid: false, error: 'User ID inválido' };
    }

    // Validar formato UUID de Cognito
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sub)) {
      return { isValid: false, error: 'Formato de User ID inválido' };
    }

    return { isValid: true };
  }

  /**
   * Valida la estructura general del token
   */
  private static validateTokenStructure(token: JWT): {
    isValid: boolean;
    error?: string;
  } {
    if (!token.toString || typeof token.toString !== 'function') {
      return { isValid: false, error: 'Estructura de token inválida' };
    }

    const tokenString = token.toString();
    const parts = tokenString.split('.');
    
    if (parts.length !== 3) {
      return { isValid: false, error: 'Token JWT malformado' };
    }

    return { isValid: true };
  }

  /**
   * Valida si un provider está completamente aprobado
   * Requiere: tipo provider, aprobación del equipo, y membresía en grupo
   */
  static validateProviderAccess(idToken: JWT | undefined): {
    isValid: boolean;
    isApproved: boolean;
    inProvidersGroup: boolean;
    errors: string[];
  } {
    const result = {
      isValid: false,
      isApproved: false,
      inProvidersGroup: false,
      errors: [] as string[]
    };

    if (!idToken) {
      result.errors.push('Token no encontrado');
      return result;
    }

    const payload = idToken.payload as Partial<TokenClaims>;

    // 1. Verificar que sea tipo provider
    if (payload['custom:user_type'] !== 'provider') {
      result.errors.push('Usuario no es tipo provider');
      return result;
    }

    // 2. Verificar aprobación del equipo YAAN
    const providerApproved = payload['custom:provider_is_approved'];
    if (providerApproved === 'true' || providerApproved === true) {
      result.isApproved = true;
    } else {
      result.errors.push('Provider no aprobado por el equipo YAAN');
    }

    // 3. Verificar membresía en grupo 'providers' de Cognito
    const cognitoGroups = payload['cognito:groups'] || [];
    if (cognitoGroups.includes('providers')) {
      result.inProvidersGroup = true;
    } else {
      result.errors.push('Provider no pertenece al grupo providers de Cognito');
    }

    // El acceso es válido solo si ambas condiciones se cumplen
    result.isValid = result.isApproved && result.inProvidersGroup;

    if (!result.isValid) {
      logger.warn('Provider access validation failed', {
        userId: payload.sub ? '[PRESENT]' : '[MISSING]',
        isApproved: result.isApproved,
        inGroup: result.inProvidersGroup,
        errorCount: result.errors.length
      });
    }

    return result;
  }

  /**
   * Valida permisos para una operación específica
   */
  static validateOperation(userType: UserType, operation: string): boolean {
    const permissions = this.getPermissionMatrix();
    const userPermissions = permissions[userType] || [];
    
    return userPermissions.includes(operation);
  }

  /**
   * Obtiene la matriz de permisos por tipo de usuario
   */
  private static getPermissionMatrix(): Record<UserType, string[]> {
    return {
      consumer: [
        'read:marketplace',
        'read:circuits', 
        'read:packages',
        'read:moments',
        'create:moment',
        'update:own_profile',
        'like:content'
      ],
      provider: [
        'read:marketplace',
        'read:circuits',
        'read:packages', 
        'read:moments',
        'create:moment',
        'create:circuit',
        'create:package',
        'update:own_circuit',
        'update:own_package',
        'update:own_profile',
        'like:content',
        'manage:own_content'
      ]
    };
  }

  /**
   * Sanitiza datos para logging (remueve información sensible)
   */
  static sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };
    const sensitiveFields = ['sub', 'email', 'token', 'accessToken', 'idToken'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Valida input para la creación de productos
   */
  static validateProductInput(input: any): {
    isValid: boolean;
    errors?: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // Validar campos requeridos
    if (!input.name || input.name.length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (input.name && input.name.length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }

    // Validar que no contenga scripts maliciosos
    if (input.description && this.containsMaliciousContent(input.description)) {
      errors.description = 'Descripción contiene contenido no permitido';
    }

    if (input.itinerary && this.containsMaliciousContent(input.itinerary)) {
      errors.itinerary = 'Itinerario contiene contenido no permitido';
    }

    // Validar URLs si existen
    if (input.cover_image_url && !this.isValidImageUrl(input.cover_image_url)) {
      errors.cover_image_url = 'URL de imagen no válida';
    }

    if (input.image_url && Array.isArray(input.image_url)) {
      const invalidUrls = input.image_url.filter((url: string) => !this.isValidImageUrl(url));
      if (invalidUrls.length > 0) {
        errors.image_url = 'Una o más URLs de imagen no son válidas';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Valida input para actualización de productos
   */
  static validateProductUpdate(input: any): {
    isValid: boolean;
    errors?: Record<string, string>;
  } {
    // Reusar la misma lógica que validateProductInput para updates
    return this.validateProductInput(input);
  }

  /**
   * Detecta contenido malicioso básico
   */
  private static containsMaliciousContent(content: string): boolean {
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /<object\b/gi,
      /<embed\b/gi
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Valida si una URL es válida para imágenes
   */
  private static isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Solo permitir HTTPS (excepto localhost para desarrollo)
      if (parsedUrl.protocol !== 'https:' && !parsedUrl.hostname.includes('localhost')) {
        return false;
      }

      // Verificar dominios permitidos (agregar según necesidad)
      const allowedDomains = [
        'amazonaws.com',
        'cloudfront.net',
        's3.amazonaws.com',
        'localhost',
        'unsplash.com',
        'images.unsplash.com'
      ];

      const isAllowedDomain = allowedDomains.some(domain => 
        parsedUrl.hostname.includes(domain)
      );

      return isAllowedDomain;
    } catch {
      return false;
    }
  }

  /**
   * Sanitiza strings eliminando contenido peligroso
   */
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
}