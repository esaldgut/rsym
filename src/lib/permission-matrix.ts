import { UserType } from './security-validator';

/**
 * Matriz de permisos por tipo de usuario
 * Define qué operaciones puede realizar cada tipo de usuario
 */

export interface Permission {
  operation: string;
  resource: string;
  description: string;
}

export const PERMISSIONS: Record<UserType, Permission[]> = {
  consumer: [
    {
      operation: 'read',
      resource: 'marketplace',
      description: 'Ver contenido del marketplace'
    },
    {
      operation: 'read', 
      resource: 'circuits',
      description: 'Ver circuitos disponibles'
    },
    {
      operation: 'read',
      resource: 'packages', 
      description: 'Ver paquetes turísticos'
    },
    {
      operation: 'read',
      resource: 'moments',
      description: 'Ver momentos de otros usuarios'
    },
    {
      operation: 'create',
      resource: 'moment',
      description: 'Crear momentos propios'
    },
    {
      operation: 'like',
      resource: 'content',
      description: 'Dar like a contenido'
    },
    {
      operation: 'update',
      resource: 'own_profile',
      description: 'Actualizar perfil propio'
    }
  ],
  
  provider: [
    {
      operation: 'read',
      resource: 'marketplace',
      description: 'Ver contenido del marketplace'
    },
    {
      operation: 'read',
      resource: 'circuits', 
      description: 'Ver circuitos disponibles'
    },
    {
      operation: 'read',
      resource: 'packages',
      description: 'Ver paquetes turísticos'
    },
    {
      operation: 'read', 
      resource: 'moments',
      description: 'Ver momentos de otros usuarios'
    },
    {
      operation: 'create',
      resource: 'moment',
      description: 'Crear momentos propios'
    },
    {
      operation: 'create',
      resource: 'circuit',
      description: 'Crear nuevos circuitos'
    },
    {
      operation: 'create',
      resource: 'package',
      description: 'Crear nuevos paquetes turísticos'
    },
    {
      operation: 'update',
      resource: 'own_circuit',
      description: 'Actualizar circuitos propios'
    },
    {
      operation: 'update',
      resource: 'own_package', 
      description: 'Actualizar paquetes propios'
    },
    {
      operation: 'update',
      resource: 'own_profile',
      description: 'Actualizar perfil propio'
    },
    {
      operation: 'like',
      resource: 'content',
      description: 'Dar like a contenido'
    },
    {
      operation: 'manage',
      resource: 'own_content',
      description: 'Gestionar contenido propio'
    }
  ]
};

/**
 * Operaciones específicas de GraphQL por tipo de usuario
 */
export const GRAPHQL_OPERATIONS: Record<UserType, string[]> = {
  consumer: [
    'getAllMarketplaceFeed',
    'getAllActiveCircuits',
    'getAllActivePackages', 
    'getAllActiveMoments',
    'createMoment',
    'toggleLike',
    'updateProfile'
  ],
  
  provider: [
    'getAllMarketplaceFeed',
    'getAllActiveCircuits',
    'getAllActivePackages',
    'getAllActiveMoments',
    'createMoment',
    'createCircuit',
    'createPackage',
    'updateCircuit',
    'updatePackage',
    'toggleLike',
    'updateProfile',
    'getMyCircuits',
    'getMyPackages'
  ]
};

/**
 * Valida si un usuario tiene permisos para una operación
 */
export function hasPermission(
  userType: UserType, 
  operation: string, 
  resource: string
): boolean {
  const userPermissions = PERMISSIONS[userType] || [];
  
  return userPermissions.some(permission => 
    permission.operation === operation && permission.resource === resource
  );
}

/**
 * Valida si un usuario puede ejecutar una operación GraphQL específica
 */
export function canExecuteGraphQLOperation(
  userType: UserType,
  operation: string
): boolean {
  const allowedOperations = GRAPHQL_OPERATIONS[userType] || [];
  return allowedOperations.includes(operation);
}

/**
 * Obtiene todas las operaciones permitidas para un tipo de usuario
 */
export function getAllowedOperations(userType: UserType): Permission[] {
  return PERMISSIONS[userType] || [];
}

/**
 * Obtiene todas las operaciones GraphQL permitidas para un tipo de usuario
 */
export function getAllowedGraphQLOperations(userType: UserType): string[] {
  return GRAPHQL_OPERATIONS[userType] || [];
}