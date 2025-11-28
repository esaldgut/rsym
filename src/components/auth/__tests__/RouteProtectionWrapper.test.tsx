/**
* RouteProtectionWrapper
*
* Pruebas para el envoltorio centralizado de protección de rutas.
* Cubre:
* - Protección básica de autenticación
* - Protección específica según tipo de usuario
* - Requisitos de aprobación y de grupo
* - Control de acceso basado en permisos
* - Manejo y normalización de URL de redirección
* - Métodos auxiliares para diferentes tipos de rutas
* - Manejo de errores y casos límite
*/

import { redirect } from 'next/navigation';
import { RouteProtectionWrapper } from '../RouteProtectionWrapper';
import { UnifiedAuthSystem, type AuthValidationResult, type YAANUserType } from '@/lib/auth/unified-auth-system';

// ============================================================================
// MOCKS
// ============================================================================

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

jest.mock('@/lib/auth/unified-auth-system', () => ({
  UnifiedAuthSystem: {
    requireAuthentication: jest.fn(),
    requireUserType: jest.fn(),
    getValidatedSession: jest.fn()
  }
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockRequireAuthentication = UnifiedAuthSystem.requireAuthentication as jest.MockedFunction<
  typeof UnifiedAuthSystem.requireAuthentication
>;
const mockRequireUserType = UnifiedAuthSystem.requireUserType as jest.MockedFunction<
  typeof UnifiedAuthSystem.requireUserType
>;
const mockGetValidatedSession = UnifiedAuthSystem.getValidatedSession as jest.MockedFunction<
  typeof UnifiedAuthSystem.getValidatedSession
>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createMockAuthResult = (
  userType: YAANUserType = 'traveler',
  isAuthenticated = true,
  permissions: Partial<AuthValidationResult['permissions']> = {}
): AuthValidationResult => ({
  isValid: true,
  isAuthenticated,
  user: isAuthenticated
    ? {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        userType
      }
    : undefined,
  permissions: isAuthenticated
    ? {
        userType,
        canCreateMoments: true,
        ...permissions
      }
    : undefined,
  errors: []
});

const createNextRedirectError = () => {
  const error = new Error('NEXT_REDIRECT');
  error.message = 'NEXT_REDIRECT';
  return error;
};

// ============================================================================
// TESTS
// ============================================================================

describe('RouteProtectionWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // BASIC PROTECTION TESTS
  // ==========================================================================

  describe('protect() - Basic Authentication', () => {
    it('should require authentication when authenticationOnly is true', async () => {
      const mockAuth = createMockAuthResult();
      mockRequireAuthentication.mockResolvedValue(mockAuth);

      const result = await RouteProtectionWrapper.protect({
        authenticationOnly: true
      });

      expect(mockRequireAuthentication).toHaveBeenCalledWith('/moments');
      expect(result).toEqual(mockAuth);
    });

    it('should use custom redirectTo for authentication', async () => {
      const mockAuth = createMockAuthResult();
      mockRequireAuthentication.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protect({
        authenticationOnly: true,
        redirectTo: '/custom-redirect'
      });

      expect(mockRequireAuthentication).toHaveBeenCalledWith('/custom-redirect');
    });

    it('should default to authentication only when no config provided', async () => {
      const mockAuth = createMockAuthResult();
      mockRequireAuthentication.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protect({});

      expect(mockRequireAuthentication).toHaveBeenCalledWith('/moments');
    });
  });

  // ==========================================================================
  // USER TYPE PROTECTION TESTS
  // ==========================================================================

  describe('protect() - User Type Requirements', () => {
    it('should require specific user type', async () => {
      const mockAuth = createMockAuthResult('provider');
      mockRequireUserType.mockResolvedValue(mockAuth);

      const result = await RouteProtectionWrapper.protect({
        allowedUserTypes: 'provider'
      });

      expect(mockRequireUserType).toHaveBeenCalledWith('provider', {
        requireApproval: false,
        requireGroup: false,
        redirectTo: '/provider'
      });
      expect(result).toEqual(mockAuth);
    });

    it('should require multiple user types', async () => {
      const mockAuth = createMockAuthResult('influencer');
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protect({
        allowedUserTypes: ['provider', 'influencer']
      });

      expect(mockRequireUserType).toHaveBeenCalledWith(['provider', 'influencer'], {
        requireApproval: false,
        requireGroup: false,
        redirectTo: '/provider'
      });
    });

    it('should require approval when specified', async () => {
      const mockAuth = createMockAuthResult('provider', true, { isApproved: true });
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protect({
        allowedUserTypes: 'provider',
        requireApproval: true
      });

      expect(mockRequireUserType).toHaveBeenCalledWith('provider', {
        requireApproval: true,
        requireGroup: false,
        redirectTo: '/provider'
      });
    });

    it('should require group membership when specified', async () => {
      const mockAuth = createMockAuthResult('provider', true, { inRequiredGroup: true });
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protect({
        allowedUserTypes: 'provider',
        requireGroup: true
      });

      expect(mockRequireUserType).toHaveBeenCalledWith('provider', {
        requireApproval: false,
        requireGroup: true,
        redirectTo: '/provider'
      });
    });
  });

  // ==========================================================================
  // PERMISSION-BASED PROTECTION TESTS
  // ==========================================================================

  describe('protect() - Permission Requirements', () => {
    it('should check required permissions and allow access', async () => {
      const mockAuth = createMockAuthResult('provider', true, {
        canCreateProducts: true
      });
      mockGetValidatedSession.mockResolvedValue(mockAuth);

      const result = await RouteProtectionWrapper.protect({
        requiredPermissions: ['create_products']
      });

      expect(mockGetValidatedSession).toHaveBeenCalled();
      expect(result).toEqual(mockAuth);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should deny access when permission is missing', async () => {
      const mockAuth = createMockAuthResult('traveler', true, {
        canCreateProducts: false
      });
      mockGetValidatedSession.mockResolvedValue(mockAuth);
      mockRedirect.mockImplementation(() => {
        throw createNextRedirectError();
      });

      await expect(
        RouteProtectionWrapper.protect({
          requiredPermissions: ['create_products']
        })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/moments?error=insufficient_permissions');
    });

    it('should redirect to auth when not authenticated for permission check', async () => {
      const mockAuth = createMockAuthResult('traveler', false);
      mockGetValidatedSession.mockResolvedValue(mockAuth);
      mockRedirect.mockImplementation(() => {
        throw createNextRedirectError();
      });

      await expect(
        RouteProtectionWrapper.protect({
          requiredPermissions: ['create_products']
        })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/auth?error=authentication_required&callbackUrl=/moments');
    });

    it('should check multiple permissions', async () => {
      const mockAuth = createMockAuthResult('admin', true, {
        canAccessAdmin: true,
        canManageContent: true
      });
      mockGetValidatedSession.mockResolvedValue(mockAuth);

      const result = await RouteProtectionWrapper.protect({
        requiredPermissions: ['access_admin', 'manage_content']
      });

      expect(result).toEqual(mockAuth);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should deny if any permission is missing', async () => {
      const mockAuth = createMockAuthResult('admin', true, {
        canAccessAdmin: true,
        canManageContent: false
      });
      mockGetValidatedSession.mockResolvedValue(mockAuth);
      mockRedirect.mockImplementation(() => {
        throw createNextRedirectError();
      });

      await expect(
        RouteProtectionWrapper.protect({
          requiredPermissions: ['access_admin', 'manage_content']
        })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/moments?error=insufficient_permissions');
    });
  });

  // ==========================================================================
  // HELPER METHODS TESTS
  // ==========================================================================

  describe('Helper Methods', () => {
    it('protectMoments() should protect with authentication only', async () => {
      const mockAuth = createMockAuthResult();
      mockRequireAuthentication.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectMoments();

      expect(mockRequireAuthentication).toHaveBeenCalledWith('/auth');
    });

    it('protectMarketplace() should protect with authentication only', async () => {
      const mockAuth = createMockAuthResult();
      mockRequireAuthentication.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectMarketplace();

      expect(mockRequireAuthentication).toHaveBeenCalledWith('/marketplace');
    });

    it('protectDashboard() should protect with authentication only', async () => {
      const mockAuth = createMockAuthResult();
      mockRequireAuthentication.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectDashboard();

      expect(mockRequireAuthentication).toHaveBeenCalledWith('/moments');
    });

    it('protectAdmin() should require admin user type and group', async () => {
      const mockAuth = createMockAuthResult('admin');
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectAdmin();

      expect(mockRequireUserType).toHaveBeenCalledWith('admin', {
        requireApproval: false,
        requireGroup: true,
        redirectTo: '/admin'
      });
    });

    it('protectProvider() should require provider type without approval by default', async () => {
      const mockAuth = createMockAuthResult('provider');
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectProvider(false);

      expect(mockRequireUserType).toHaveBeenCalledWith('provider', {
        requireApproval: false,
        requireGroup: false,
        redirectTo: '/provider'
      });
    });

    it('protectProvider() should require approval when specified', async () => {
      const mockAuth = createMockAuthResult('provider', true, { isApproved: true });
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectProvider(true);

      expect(mockRequireUserType).toHaveBeenCalledWith('provider', {
        requireApproval: true,
        requireGroup: true,
        redirectTo: '/provider'
      });
    });

    it('protectInfluencer() should require influencer type', async () => {
      const mockAuth = createMockAuthResult('influencer');
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectInfluencer(false);

      expect(mockRequireUserType).toHaveBeenCalledWith('influencer', {
        requireApproval: false,
        requireGroup: false,
        redirectTo: '/influencer'
      });
    });

    it('protectContentCreators() should allow provider or influencer', async () => {
      const mockAuth = createMockAuthResult('provider');
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectContentCreators();

      expect(mockRequireUserType).toHaveBeenCalledWith(['provider', 'influencer'], {
        requireApproval: false,
        requireGroup: false,
        redirectTo: '/moments'
      });
    });

    it('protectProfile() should protect with authentication only', async () => {
      const mockAuth = createMockAuthResult();
      mockRequireAuthentication.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectProfile();

      expect(mockRequireAuthentication).toHaveBeenCalledWith('/profile');
    });
  });

  // ==========================================================================
  // URL NORMALIZATION TESTS
  // ==========================================================================

  describe('normalizeRedirectUrl()', () => {
    it('should return valid relative URLs unchanged', () => {
      expect(RouteProtectionWrapper.normalizeRedirectUrl('/moments')).toBe('/moments');
      expect(RouteProtectionWrapper.normalizeRedirectUrl('/profile')).toBe('/profile');
      expect(RouteProtectionWrapper.normalizeRedirectUrl('/provider/dashboard')).toBe('/provider/dashboard');
    });

    it('should reject non-relative URLs', () => {
      expect(RouteProtectionWrapper.normalizeRedirectUrl('http://evil.com')).toBe('/moments');
      expect(RouteProtectionWrapper.normalizeRedirectUrl('https://evil.com')).toBe('/moments');
      expect(RouteProtectionWrapper.normalizeRedirectUrl('moments')).toBe('/moments');
    });

    it('should use custom fallback when provided', () => {
      expect(RouteProtectionWrapper.normalizeRedirectUrl('invalid', '/custom')).toBe('/custom');
      expect(RouteProtectionWrapper.normalizeRedirectUrl('http://evil.com', '/safe')).toBe('/safe');
    });

    it('should accept known routes and subroutes', () => {
      expect(RouteProtectionWrapper.normalizeRedirectUrl('/moments/create')).toBe('/moments/create');
      expect(RouteProtectionWrapper.normalizeRedirectUrl('/provider/settings')).toBe('/provider/settings');
      expect(RouteProtectionWrapper.normalizeRedirectUrl('/marketplace/products')).toBe('/marketplace/products');
    });

    it('should reject unknown routes', () => {
      expect(RouteProtectionWrapper.normalizeRedirectUrl('/unknown-route')).toBe('/moments');
      expect(RouteProtectionWrapper.normalizeRedirectUrl('/fake/path')).toBe('/moments');
    });

    it('should handle malformed URLs gracefully', () => {
      expect(RouteProtectionWrapper.normalizeRedirectUrl(':::invalid:::')).toBe('/moments');
      expect(RouteProtectionWrapper.normalizeRedirectUrl('')).toBe('/moments');
    });
  });

  // ==========================================================================
  // BUILD REDIRECT URL TESTS
  // ==========================================================================

  describe('buildRedirectUrl()', () => {
    it('should build URL with error parameter', () => {
      const url = RouteProtectionWrapper.buildRedirectUrl('/auth', 'access_denied');
      expect(url).toBe('/auth?error=access_denied');
    });

    it('should build URL with callbackUrl parameter', () => {
      const url = RouteProtectionWrapper.buildRedirectUrl('/auth', undefined, '/moments');
      expect(url).toBe('/auth?callbackUrl=%2Fmoments');
    });

    it('should build URL with both error and callbackUrl', () => {
      const url = RouteProtectionWrapper.buildRedirectUrl('/auth', 'authentication_required', '/marketplace');
      expect(url).toBe('/auth?error=authentication_required&callbackUrl=%2Fmarketplace');
    });

    it('should build URL with additional parameters', () => {
      const url = RouteProtectionWrapper.buildRedirectUrl(
        '/auth',
        'access_denied',
        '/admin',
        { reason: 'no_permission', userId: '123' }
      );
      expect(url).toContain('/auth?');
      expect(url).toContain('error=access_denied');
      expect(url).toContain('callbackUrl=%2Fadmin');
      expect(url).toContain('reason=no_permission');
      expect(url).toContain('userId=123');
    });

    it('should normalize callbackUrl', () => {
      const url = RouteProtectionWrapper.buildRedirectUrl('/auth', undefined, 'invalid-url');
      expect(url).toBe('/auth?callbackUrl=%2Fmoments');
    });

    it('should build URL with only base path when no parameters', () => {
      const url = RouteProtectionWrapper.buildRedirectUrl('/auth');
      expect(url).toBe('/auth');
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling', () => {
    it('should re-throw NEXT_REDIRECT errors', async () => {
      mockRequireAuthentication.mockImplementation(() => {
        throw createNextRedirectError();
      });

      await expect(
        RouteProtectionWrapper.protect({ authenticationOnly: true })
      ).rejects.toThrow('NEXT_REDIRECT');
    });

    it('should redirect to auth on system error', async () => {
      mockRequireAuthentication.mockImplementation(() => {
        throw new Error('System error');
      });
      mockRedirect.mockImplementation(() => {
        throw createNextRedirectError();
      });

      await expect(
        RouteProtectionWrapper.protect({ authenticationOnly: true })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(console.error).toHaveBeenCalledWith('Error in route protection:', expect.any(Error));
      expect(mockRedirect).toHaveBeenCalledWith('/auth?error=system_error');
    });

    it('should handle errors in permission checks', async () => {
      mockGetValidatedSession.mockImplementation(() => {
        throw new Error('Permission check failed');
      });
      mockRedirect.mockImplementation(() => {
        throw createNextRedirectError();
      });

      await expect(
        RouteProtectionWrapper.protect({
          requiredPermissions: ['create_products']
        })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/auth?error=system_error');
    });
  });

  // ==========================================================================
  // CONSOLE LOGGING TESTS
  // ==========================================================================

  describe('Console Logging', () => {
    it('should log when protectProvider is called', async () => {
      const mockAuth = createMockAuthResult('provider');
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectProvider(true);

      expect(console.log).toHaveBeenCalledWith('📍 RouteProtectionWrapper.protectProvider called');
      expect(console.log).toHaveBeenCalledWith('   - requireFullApproval:', true);
    });

    it('should log protection result for provider', async () => {
      const mockAuth = createMockAuthResult('provider', true, {
        isApproved: true,
        inRequiredGroup: true
      });
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protectProvider(true);

      expect(console.log).toHaveBeenCalledWith('   - Protection result:', {
        user: 'provider',
        isApproved: true,
        inGroup: true
      });
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty permissions object', async () => {
      const mockAuth = createMockAuthResult('traveler', true, {});
      mockGetValidatedSession.mockResolvedValue(mockAuth);
      mockRedirect.mockImplementation(() => {
        throw createNextRedirectError();
      });

      await expect(
        RouteProtectionWrapper.protect({
          requiredPermissions: ['create_products']
        })
      ).rejects.toThrow('NEXT_REDIRECT');
    });

    it('should handle missing user in auth result', async () => {
      const mockAuth: AuthValidationResult = {
        isValid: false,
        isAuthenticated: false,
        errors: ['No user']
      };
      mockGetValidatedSession.mockResolvedValue(mockAuth);
      mockRedirect.mockImplementation(() => {
        throw createNextRedirectError();
      });

      await expect(
        RouteProtectionWrapper.protect({
          requiredPermissions: ['create_products']
        })
      ).rejects.toThrow('NEXT_REDIRECT');
    });

    it('should handle unknown permission names gracefully', async () => {
      const mockAuth = createMockAuthResult('provider', true, {
        canCreateProducts: true
      });
      mockGetValidatedSession.mockResolvedValue(mockAuth);
      mockRedirect.mockImplementation(() => {
        throw createNextRedirectError();
      });

      await expect(
        RouteProtectionWrapper.protect({
          requiredPermissions: ['unknown_permission']
        })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/moments?error=insufficient_permissions');
    });

    it('should use default redirect for unknown user type', async () => {
      const mockAuth = createMockAuthResult('traveler');
      mockRequireUserType.mockResolvedValue(mockAuth);

      await RouteProtectionWrapper.protect({
        allowedUserTypes: 'traveler'
      });

      expect(mockRequireUserType).toHaveBeenCalledWith('traveler', {
        requireApproval: false,
        requireGroup: false,
        redirectTo: '/profile'
      });
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('Integration Scenarios', () => {
    it('should handle full provider protection flow', async () => {
      const mockAuth = createMockAuthResult('provider', true, {
        isApproved: true,
        inRequiredGroup: true,
        canCreateProducts: true
      });
      mockRequireUserType.mockResolvedValue(mockAuth);

      const result = await RouteProtectionWrapper.protectProvider(true);

      expect(result.user?.userType).toBe('provider');
      expect(result.permissions?.isApproved).toBe(true);
      expect(result.permissions?.inRequiredGroup).toBe(true);
    });

    it('should handle mixed permission and user type requirements', async () => {
      const mockAuth = createMockAuthResult('admin', true, {
        canAccessAdmin: true,
        canManageContent: true
      });
      mockGetValidatedSession.mockResolvedValue(mockAuth);

      const result = await RouteProtectionWrapper.protect({
        requiredPermissions: ['access_admin', 'manage_content'],
        redirectTo: '/admin/dashboard'
      });

      expect(result).toEqual(mockAuth);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});
