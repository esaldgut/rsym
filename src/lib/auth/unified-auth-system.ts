import { redirect } from 'next/navigation';
import { runWithAmplifyServerContext } from '@/utils/amplify-server-utils';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { SecurityValidator } from '@/lib/security-validator';

/**
 * Tipos de usuario soportados por YAAN
 */
export type YAANUserType = 'admin' | 'provider' | 'influencer' | 'traveler';

/**
 * Configuración de permisos por tipo de usuario
 */
export interface UserPermissions {
  userType: YAANUserType;
  isApproved?: boolean;
  inRequiredGroup?: boolean;
  canAccessAdmin?: boolean;
  canCreateProducts?: boolean;
  canCreateMoments?: boolean;
  canManageContent?: boolean;
}

/**
 * Resultado de validación de autenticación
 */
export interface AuthValidationResult {
  isValid: boolean;
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    userType: YAANUserType;
  };
  permissions?: UserPermissions;
  errors: string[];
  warnings?: string[];
  needsRefresh?: boolean;
}

/**
 * Sistema unificado de autenticación y autorización
 * Centraliza toda la lógica de validación para todos los perfiles
 */
export class UnifiedAuthSystem {
  /**
   * Valida y obtiene la sesión actual con posibilidad de refresh
   */
  static async getValidatedSession(forceRefresh = false): Promise<AuthValidationResult> {
    try {
      const session = await runWithAmplifyServerContext({
        nextServerContext: { cookies },
        operation: async (contextSpec) => {
          try {
            // 1. Obtener sesión con opción de refresh
            const authSession = await fetchAuthSession(contextSpec, { forceRefresh });

            // 2. CRÍTICO: Verificar que hay token ANTES de obtener atributos
            if (!authSession.tokens?.idToken) {
              return {
                isValid: false,
                isAuthenticated: false,
                errors: ['No hay sesión activa']
              };
            }

            // 3. Solo si hay token válido, obtener atributos del usuario
            const userAttributes = await fetchUserAttributes(contextSpec);

            const idToken = authSession.tokens.idToken;
            const payload = idToken.payload;

            // Usar SecurityValidator para validar token y extraer userType (lógica centralizada)
            const securityValidation = SecurityValidator.validateIdToken(idToken);

            if (!securityValidation.isValid) {
              return {
                isValid: false,
                isAuthenticated: true,
                errors: securityValidation.errors,
                warnings: securityValidation.warnings
              };
            }

            // Construir resultado usando datos validados por SecurityValidator
            const result: AuthValidationResult = {
              isValid: true,
              isAuthenticated: true,
              user: {
                id: securityValidation.userId,
                username: payload['cognito:username'] as string || userAttributes.email || securityValidation.userId,
                email: userAttributes.email || '',
                userType: securityValidation.userType
              },
              permissions: this.buildPermissions(securityValidation.userType, payload, userAttributes),
              errors: []
            };

            // Verificar si el token necesita refresh (expira en menos de 10 minutos)
            const exp = payload.exp as number;
            const now = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = exp - now;
            
            // Marcar para refresh si expira en menos de 10 minutos
            if (timeUntilExpiry < 600) {
              result.needsRefresh = true;
            }
            
            // También verificar si los atributos pueden estar desactualizados
            // comparando timestamp de última actualización del perfil
            const lastProfileUpdate = payload['custom:last_updated'];
            if (lastProfileUpdate) {
              const profileTimestamp = parseInt(lastProfileUpdate);
              const tokenTimestamp = payload.iat as number;
              
              // Si el perfil fue actualizado después del token, necesitamos refresh
              if (profileTimestamp > tokenTimestamp) {
                result.needsRefresh = true;
              }
            }

            return result;
          } catch (error) {
            console.error('Error validating session:', error);
            return {
              isValid: false,
              isAuthenticated: false,
              errors: ['Error al validar sesión']
            };
          }
        }
      });

      return session as AuthValidationResult;
    } catch (error) {
      console.error('[Server] UnifiedAuthSystem: Error del sistema al validar sesión', error);
      return {
        isValid: false,
        isAuthenticated: false,
        errors: [error instanceof Error ? error.message : 'Error del sistema']
      };
    }
  }

  /**
   * DEPRECADO: Usar SecurityValidator.validateIdToken() en su lugar
   * Lógica movida a SecurityValidator para centralizar validaciones
   */
  // private static extractUserType(payload: any, attributes: any): YAANUserType | null {
  //   const customType = attributes['custom:user_type'] || payload['custom:user_type'];
  //   if (customType && this.isValidUserType(customType)) {
  //     return customType as YAANUserType;
  //   }
  //   const groups = payload['cognito:groups'] || [];
  //   if (groups.includes('admins')) return 'admin';
  //   if (groups.includes('providers')) return 'provider';
  //   if (groups.includes('influencers')) return 'influencer';
  //   if (groups.includes('travelers')) return 'traveler';
  //   return 'traveler';
  // }

  // private static isValidUserType(type: string): boolean {
  //   return ['admin', 'provider', 'influencer', 'traveler'].includes(type);
  // }

  /**
   * Construye los permisos basados en el tipo de usuario y atributos
   */
  private static buildPermissions(
    userType: YAANUserType, 
    payload: any, 
    attributes: any
  ): UserPermissions {
    const groups = payload['cognito:groups'] || [];
    
    const permissions: UserPermissions = {
      userType,
      isApproved: true, // Por defecto todos aprobados excepto providers
      canCreateMoments: true, // Todos pueden crear momentos
      canAccessAdmin: false,
      canCreateProducts: false,
      canManageContent: false
    };

    switch (userType) {
      case 'admin':
        permissions.canAccessAdmin = true;
        permissions.canManageContent = true;
        permissions.canCreateProducts = true;
        permissions.inRequiredGroup = groups.includes('admins');
        break;
        
      case 'provider':
        // Providers requieren aprobación especial
        const providerApprovalAttr = attributes['custom:provider_is_approved'];

        // Log solo en desarrollo para debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Verificando aprobación de provider:');
          console.log('   - Atributo raw:', providerApprovalAttr);
          console.log('   - Tipo:', typeof providerApprovalAttr);
          console.log('   - Usuario:', attributes.email);
        }

        // Manejar diferentes formatos del atributo (string o boolean)
        // Solo considerar aprobado si explícitamente es 'true' o true
        if (providerApprovalAttr === 'true' || providerApprovalAttr === true) {
          permissions.isApproved = true;
        } else {
          // Cualquier otro valor (false, 'false', undefined, null) = no aprobado
          // Esto es intencional por seguridad - providers deben ser explícitamente aprobados
          permissions.isApproved = false;
        }
        
        permissions.inRequiredGroup = groups.includes('providers');
        permissions.canCreateProducts = permissions.isApproved && permissions.inRequiredGroup;
        permissions.canManageContent = permissions.canCreateProducts;

        if (process.env.NODE_ENV === 'development') {
          console.log('   - Resultado isApproved:', permissions.isApproved);
          console.log('   - En grupo providers:', permissions.inRequiredGroup);
        }
        break;
        
      case 'influencer':
        permissions.isApproved = attributes['custom:influencer_is_approved'] === 'true' || 
                                 attributes['custom:influencer_is_approved'] === true ||
                                 true; // O permitir por defecto
        permissions.inRequiredGroup = groups.includes('influencers');
        permissions.canManageContent = true;
        break;
        
      case 'traveler':
        // Travelers no necesitan aprobación especial
        permissions.inRequiredGroup = true; // Todos son travelers por defecto
        break;
    }

    return permissions;
  }

  /**
   * Valida acceso para un tipo de usuario específico
   */
  static async requireUserType(
    requiredType: YAANUserType | YAANUserType[],
    options?: {
      requireApproval?: boolean;
      requireGroup?: boolean;
      redirectTo?: string;
    }
  ): Promise<AuthValidationResult> {
    const validation = await this.getValidatedSession();
    
    if (!validation.isAuthenticated) {
      redirect(`/auth?error=authentication_required&callbackUrl=${options?.redirectTo || '/moments'}`);
    }

    const allowedTypes = Array.isArray(requiredType) ? requiredType : [requiredType];
    
    if (!validation.user || !allowedTypes.includes(validation.user.userType)) {
      redirect(`/moments?error=insufficient_permissions`);
    }

    // Validaciones adicionales según opciones
    if (options?.requireApproval && !validation.permissions?.isApproved) {
      console.log('🚫 Provider no aprobado, redirigiendo a pending-approval');
      console.log('   - Usuario:', validation.user.userType);
      console.log('   - Aprobado:', validation.permissions?.isApproved);
      console.log('   - requireApproval:', options?.requireApproval);
      
      const params = new URLSearchParams({
        userType: validation.user.userType,
        message: `${validation.user.userType} no aprobado`
      });
      // Los Route Groups no aparecen en la URL, solo /provider/pending-approval
      redirect(`/${validation.user.userType}/pending-approval?${params}`);
    }

    if (options?.requireGroup && !validation.permissions?.inRequiredGroup) {
      const params = new URLSearchParams({
        userType: validation.user.userType,
        message: `No perteneces al grupo requerido`
      });
      // Los Route Groups no aparecen en la URL, solo /provider/pending-approval
      redirect(`/${validation.user.userType}/pending-approval?${params}`);
    }

    return validation;
  }

  /**
   * Refresh forzado de tokens
   * Útil cuando se actualizan atributos en Cognito
   */
  static async forceTokenRefresh(): Promise<boolean> {
    try {
      const result = await this.getValidatedSession(true);
      return result.isValid;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return false;
    }
  }

  /**
   * Valida permisos específicos
   */
  static async requirePermission(
    permission: keyof UserPermissions,
    value: any = true,
    redirectTo = '/profile'
  ): Promise<AuthValidationResult> {
    const validation = await this.getValidatedSession();
    
    if (!validation.isAuthenticated) {
      redirect(`/auth?error=authentication_required&callbackUrl=${redirectTo}`);
    }

    if (!validation.permissions || validation.permissions[permission] !== value) {
      redirect(`${redirectTo}?error=insufficient_permissions`);
    }

    return validation;
  }

  /**
   * Helper para admin
   */
  static async requireAdmin() {
    return this.requireUserType('admin', {
      requireGroup: true,
      redirectTo: '/admin'
    });
  }

  /**
   * Helper para provider aprobado
   */
  static async requireApprovedProvider() {
    return this.requireUserType('provider', {
      requireApproval: true,
      requireGroup: true,
      redirectTo: '/provider'
    });
  }

  /**
   * Helper para influencer
   */
  static async requireInfluencer() {
    return this.requireUserType('influencer', {
      requireApproval: false, // Decidir si requiere aprobación
      redirectTo: '/influencer'
    });
  }

  /**
   * Helper para traveler (usuario básico)
   */
  static async requireTraveler() {
    return this.requireUserType('traveler', {
      redirectTo: '/profile'
    });
  }

  /**
   * Helper genérico para autenticación básica
   */
  static async requireAuthentication(redirectTo = '/moments') {
    const validation = await this.getValidatedSession();

    if (!validation.isAuthenticated) {
      redirect(`/auth?error=authentication_required&callbackUrl=${redirectTo}`);
    }

    return validation;
  }
}