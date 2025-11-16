/**
 * Result Type Pattern para Server Actions
 *
 * Basado en el patrón Result/Either de programación funcional
 * Usa Discriminated Unions para type narrowing automático
 *
 * Beneficios:
 * - Type safety total sin overhead en runtime
 * - El compilador obliga a verificar success antes de acceder a data
 * - Autocomplete perfecto en IDE
 * - Errores detectados en tiempo de compilación
 */

import type {
  Product,
  CreateProductOfTypeCircuitMutation,
  CreateProductOfTypePackageMutation,
  UpdateProductMutation
} from '@/generated/graphql';

/**
 * Result Type base con Discriminated Union
 *
 * @example
 * ```typescript
 * const result = await someAction();
 * if (result.success) {
 *   console.log(result.data); // ✅ TypeScript sabe que data existe
 * } else {
 *   console.log(result.error); // ✅ TypeScript sabe que error existe
 * }
 * ```
 */
export type Result<T, E = string> =
  | { success: true; data: T; cached?: boolean; message?: string }
  | { success: false; error: E; validationErrors?: Record<string, string> };

/**
 * Para operaciones con errores parciales de GraphQL
 * (ej: cuando GraphQL retorna data pero también errores)
 */
export type PartialResult<T, E = string> = Result<T, E> & {
  warnings?: Array<{
    message: string;
    path?: readonly (string | number)[];
    extensions?: Record<string, unknown>;
  }>;
  hasPartialData?: boolean;
};

// ============================================================
// Type Aliases por Dominio (auto-documentados)
// ============================================================

// --- Products ---
export type ProductResult = Result<Product>;
export type ProductListResult = Result<Product[]>;

// Create product mutations return specific types
export type CreateCircuitResult = Result<{
  id: string;
  name: string;
}>;

export type CreatePackageResult = Result<{
  id: string;
  name: string;
}>;

export type UpdateProductResult = Result<{
  id: string;
  name: string;
}>;

// --- Marketplace ---
export interface MarketplaceConnection {
  items: Product[];
  nextToken?: string;
  total: number;
}

export interface MarketplaceMetrics {
  total: number;
  circuits: number;
  packages: number;
  avgPrice: number;
  topDestinations: string[];
}

export type MarketplaceProductsResult = Result<MarketplaceConnection>;
export type MarketplaceMetricsResult = Result<MarketplaceMetrics>;
export type MarketplaceProductResult = Result<Product>;

// --- Generic Operations ---
export type DeleteResult = Result<string>; // Retorna ID del item eliminado
export type VoidResult = Result<void>; // Para operaciones sin retorno de datos
export type MessageResult = Result<never> & { message: string }; // Solo mensaje, sin data
