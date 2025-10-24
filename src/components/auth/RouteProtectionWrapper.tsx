import { redirect } from 'next/navigation';
import {
  UnifiedAuthSystem,
  type YAANUserType,
  type AuthValidationResult
} from '@/lib/auth/unified-auth-system';

/**
 * Configuración para protección de rutas
 */
interface RouteProtectionConfig {
  /** Tipos de usuario permitidos */
  allowedUserTypes?: YAANUserType | YAANUserType[];
  /** Si requiere aprobación (para providers/influencers) */
  requireApproval?: boolean;
  /** Si requiere pertenencia a grupo específico */
  requireGroup?: boolean;
  /** URL de redirección personalizada */
  redirectTo?: string;
  /** Si la ruta requiere solo autenticación básica */
  authenticationOnly?: boolean;
  /** Permisos específicos requeridos */
  requiredPermissions?: string[];
}

/**
 * Wrapper centralizado para protección de rutas server-side
 * Maneja todos los flujos de autenticación y autorización
 */
export class RouteProtectionWrapper {
  
  /**
   * Protege una ruta con configuración específica
   */
  static async protect(config: RouteProtectionConfig = {}) {
    const {
      allowedUserTypes,
      requireApproval = false,
      requireGroup = false,
      redirectTo,
      authenticationOnly = false,
      requiredPermissions = []
    } = config;

    try {
      // 1. Si solo requiere autenticación básica
      if (authenticationOnly) {
        return await UnifiedAuthSystem.requireAuthentication(redirectTo || '/moments');
      }

      // 2. Si requiere tipos específicos de usuario
      if (allowedUserTypes) {
        return await UnifiedAuthSystem.requireUserType(allowedUserTypes, {
          requireApproval,
          requireGroup,
          redirectTo: redirectTo || this.getDefaultRedirectForUserType(allowedUserTypes)
        });
      }

      // 3. Si requiere permisos específicos
      if (requiredPermissions.length > 0) {
        const auth = await UnifiedAuthSystem.getValidatedSession();
        
        if (!auth.isAuthenticated) {
          redirect(`/auth?error=authentication_required&callbackUrl=${redirectTo || '/moments'}`);
        }

        // Verificar cada permiso requerido
        for (const permission of requiredPermissions) {
          if (!this.hasPermission(auth, permission)) {
            redirect(`${redirectTo || '/moments'}?error=insufficient_permissions`);
          }
        }

        return auth;
      }

      // 4. Por defecto, solo requiere autenticación
      return await UnifiedAuthSystem.requireAuthentication(redirectTo || '/moments');

    } catch (error) {
      // NEXT_REDIRECT es el mecanismo normal de Next.js para redirecciones
      // Debe ser re-lanzado para que funcione correctamente
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        throw error;
      }

      console.error('Error in route protection:', error);
      // En caso de error, redirigir a auth
      redirect('/auth?error=system_error');
    }
  }

  /**
   * Helpers específicos para cada tipo de ruta
   */

  // Moments (negocio principal - solo autenticación básica)
  static async protectMoments() {
    return this.protect({
      authenticationOnly: true,
      redirectTo: '/auth'
    });
  }

  // Marketplace (solo autenticación básica)
  static async protectMarketplace() {
    return this.protect({
      authenticationOnly: true,
      redirectTo: '/marketplace'  // CORREGIDO: debe redirigir a marketplace, no a auth
    });
  }

  // Dashboard general (cualquier usuario autenticado) 
  static async protectDashboard() {
    return this.protect({
      authenticationOnly: true,
      redirectTo: '/moments' // Redirigir al negocio principal
    });
  }

  // Área de admin
  static async protectAdmin() {
    return this.protect({
      allowedUserTypes: 'admin',
      requireGroup: true,
      redirectTo: '/admin'
    });
  }

  // Área de provider (requiere aprobación completa)
  static async protectProvider(requireFullApproval = false) {
    console.log('📍 RouteProtectionWrapper.protectProvider called');
    console.log('   - requireFullApproval:', requireFullApproval);
    
    // NO especificar redirectTo aquí para evitar conflictos
    // El UnifiedAuthSystem manejará la redirección correcta
    const result = await this.protect({
      allowedUserTypes: 'provider',
      requireApproval: requireFullApproval,
      requireGroup: requireFullApproval
      // Sin redirectTo - dejar que UnifiedAuthSystem decida
    });
    
    console.log('   - Protection result:', {
      user: result.user?.userType,
      isApproved: result.permissions?.isApproved,
      inGroup: result.permissions?.inRequiredGroup
    });
    
    return result;
  }

  // Área de influencer
  static async protectInfluencer(requireApproval = false) {
    return this.protect({
      allowedUserTypes: 'influencer',
      requireApproval,
      redirectTo: '/influencer'
    });
  }

  // Rutas que permiten múltiples tipos
  static async protectContentCreators() {
    return this.protect({
      allowedUserTypes: ['provider', 'influencer'],
      redirectTo: '/moments'
    });
  }

  // Rutas de configuración de perfil
  static async protectProfile() {
    return this.protect({
      authenticationOnly: true,
      redirectTo: '/profile'
    });
  }

  /**
   * Métodos utilitarios privados
   */

  private static getDefaultRedirectForUserType(userTypes: YAANUserType | YAANUserType[]): string {
    const types = Array.isArray(userTypes) ? userTypes : [userTypes];

    if (types.includes('admin')) return '/admin';
    if (types.includes('provider')) return '/provider';
    if (types.includes('influencer')) return '/influencer';

    return '/profile';
  }

  private static hasPermission(auth: AuthValidationResult, permission: string): boolean {
    if (!auth.permissions) return false;
    
    // Mapear permisos a propiedades del objeto permissions
    const permissionMap: Record<string, keyof typeof auth.permissions> = {
      'create_products': 'canCreateProducts',
      'access_admin': 'canAccessAdmin',
      'manage_content': 'canManageContent',
      'create_moments': 'canCreateMoments'
    };

    const permissionKey = permissionMap[permission];
    return permissionKey ? !!auth.permissions[permissionKey] : false;
  }

  /**
   * Validar y normalizar URLs de redirección
   */
  static normalizeRedirectUrl(url: string, fallback = '/moments'): string {
    try {
      // Asegurar que sea una URL relativa válida
      if (!url.startsWith('/')) {
        return fallback;
      }

      // Evitar redirecciones externas
      const urlObj = new URL(url, 'http://localhost');
      if (urlObj.hostname !== 'localhost') {
        return fallback;
      }

      // Normalizar rutas conocidas
      const knownRoutes = [
        '/moments', '/profile', '/settings', '/marketplace',
        '/provider', '/admin', '/influencer', '/auth'
      ];

      // Si la URL coincide exactamente o es una subruta válida
      if (knownRoutes.some(route => url === route || url.startsWith(route + '/'))) {
        return url;
      }

      return fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Helper para construcción de URLs con parámetros de error
   */
  static buildRedirectUrl(
    basePath: string, 
    error?: string, 
    callbackUrl?: string,
    additionalParams?: Record<string, string>
  ): string {
    const url = new URL(basePath, 'http://localhost');
    
    if (error) {
      url.searchParams.set('error', error);
    }
    
    if (callbackUrl) {
      const normalizedCallback = this.normalizeRedirectUrl(callbackUrl);
      url.searchParams.set('callbackUrl', normalizedCallback);
    }

    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.pathname + url.search;
  }
}
