import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';

/**
 * Guard component para páginas que requieren provider completamente aprobado
 * Usa el sistema unificado de autenticación
 */
export async function requireApprovedProvider() {
  // Delegar al sistema unificado
  return await UnifiedAuthSystem.requireApprovedProvider();
}