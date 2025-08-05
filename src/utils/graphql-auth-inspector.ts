import { fetchAuthSession } from 'aws-amplify/auth';
import { logger } from './logger';

/**
 * Inspector de autenticación GraphQL
 * Ayuda a verificar que se esté usando el ID Token correctamente
 */
export class GraphQLAuthInspector {
  
  /**
   * Verifica la configuración actual de autenticación
   */
  static async inspectAuthConfig() {
    try {
      const session = await fetchAuthSession();
      
      const inspection = {
        hasIdToken: !!session.tokens?.idToken,
        hasAccessToken: !!session.tokens?.accessToken,
        idTokenExpiry: session.tokens?.idToken?.payload?.exp,
        accessTokenExpiry: session.tokens?.accessToken?.payload?.exp,
        currentTime: Math.floor(Date.now() / 1000),
        tokenType: 'ID_TOKEN', // AWS AppSync con Cognito User Pools usa ID Token
        claims: session.tokens?.idToken?.payload ? {
          sub: session.tokens.idToken.payload.sub,
          email: session.tokens.idToken.payload.email,
          userType: session.tokens.idToken.payload['custom:user_type'],
          aud: session.tokens.idToken.payload.aud,
          iss: session.tokens.idToken.payload.iss,
          tokenUse: session.tokens.idToken.payload.token_use,
        } : null
      };
      
      logger.info('GraphQL Auth Inspection', inspection);
      return inspection;
      
    } catch (error) {
      logger.error('Failed to inspect auth config', { error });
      return null;
    }
  }
  
  /**
   * Intercepta una petición GraphQL para verificar headers
   */
  static async interceptGraphQLRequest(operation: string, query: string) {
    const inspection = await this.inspectAuthConfig();
    
    if (!inspection?.hasIdToken) {
      logger.warn(`GraphQL operation ${operation} attempted without ID token`);
      return false;
    }
    
    const isExpired = inspection.currentTime > (inspection.idTokenExpiry || 0);
    if (isExpired) {
      logger.warn(`GraphQL operation ${operation} attempted with expired ID token`);
      return false;
    }
    
    logger.debug(`GraphQL operation ${operation} with valid ID token`, {
      operation,
      userType: inspection.claims?.userType,
      tokenExpiry: new Date((inspection.idTokenExpiry || 0) * 1000).toISOString(),
      queryPreview: query.substring(0, 100) + '...'
    });
    
    return true;
  }
  
  /**
   * Verifica que AppSync esté configurado para usar ID Token
   */
  static verifyAppSyncConfiguration() {
    // Leer la configuración de outputs.json
    try {
      const outputs = require('../../amplify/outputs.json');
      
      const config = {
        url: outputs.data?.url,
        region: outputs.data?.aws_region,
        defaultAuthType: outputs.data?.default_authorization_type,
        authTypes: outputs.data?.authorization_types,
        userPoolId: outputs.auth?.user_pool_id,
        userPoolClientId: outputs.auth?.user_pool_client_id,
      };
      
      const isCorrectlyConfigured = 
        config.defaultAuthType === 'AMAZON_COGNITO_USER_POOLS' &&
        config.authTypes?.includes('AMAZON_COGNITO_USER_POOLS');
      
      logger.info('AppSync Configuration Verification', {
        ...config,
        isCorrectlyConfigured,
        usesIdToken: isCorrectlyConfigured
      });
      
      return {
        ...config,
        isCorrectlyConfigured,
        usesIdToken: isCorrectlyConfigured
      };
      
    } catch (error) {
      logger.error('Failed to verify AppSync configuration', { error });
      return null;
    }
  }
}

/**
 * Hook para debugging de autenticación GraphQL en desarrollo
 */
export function useGraphQLAuthDebug() {
  if (process.env.NODE_ENV !== 'development') {
    return {
      inspectAuth: () => Promise.resolve(null),
      verifyConfig: () => null,
      interceptRequest: () => Promise.resolve(true)
    };
  }
  
  return {
    inspectAuth: GraphQLAuthInspector.inspectAuthConfig,
    verifyConfig: GraphQLAuthInspector.verifyAppSyncConfiguration,
    interceptRequest: GraphQLAuthInspector.interceptGraphQLRequest
  };
}