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
   * Valida completamente un ID Token y sus claims
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
      result.errors.push('ID Token no encontrado');
      return result;
    }

    const payload = idToken.payload as Partial<TokenClaims>;

    // Validación 1: Claims requeridos
    const missingClaims = this.validateRequiredClaims(payload);
    if (missingClaims.length > 0) {
      result.errors.push(`Claims faltantes: ${missingClaims.join(', ')}`);
    }

    // Validación 2: Expiración de token
    const expiryValidation = this.validateTokenExpiry(payload);
    if (!expiryValidation.isValid) {
      result.errors.push(expiryValidation.error!);
    }
    if (expiryValidation.warning) {
      result.warnings.push(expiryValidation.warning);
    }

    // Validación 3: Email verificado
    if (payload.email_verified !== true) {
      result.errors.push('Email no verificado');
    }

    // Validación 4: UserType válido
    const userTypeValidation = this.validateUserType(payload['custom:user_type']);
    if (!userTypeValidation.isValid) {
      result.errors.push(userTypeValidation.error!);
      result.userType = 'consumer'; // Fallback seguro
    } else {
      result.userType = userTypeValidation.userType!;
    }

    // Validación 5: Formato de sub (user ID)
    const userIdValidation = this.validateUserId(payload.sub);
    if (!userIdValidation.isValid) {
      result.errors.push(userIdValidation.error!);
    } else {
      result.userId = payload.sub!;
    }

    // Validación 6: Estructura del token
    const structureValidation = this.validateTokenStructure(idToken);
    if (!structureValidation.isValid) {
      result.errors.push(structureValidation.error!);
    }

    result.isValid = result.errors.length === 0;

    // Log de seguridad (sin datos sensibles)
    if (!result.isValid) {
      logger.warn('Token validation failed', {
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        userType: result.userType
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
  private static validateUserType(userType: any): {
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
  private static validateUserId(sub: any): {
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
  static sanitizeForLogging(data: any): any {
    const sanitized = { ...data };
    const sensitiveFields = ['sub', 'email', 'token', 'accessToken', 'idToken'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}