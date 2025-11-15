/**
 * CRITICAL: Type declarations for importing .graphql files
 *
 * ⚠️ DO NOT DELETE THIS FILE ⚠️
 *
 * This file is REQUIRED for Next.js to properly import .graphql files.
 * It works in combination with the webpack config in next.config.mjs:
 *
 * 1. Webpack loads .graphql files as strings (via 'asset/source' loader)
 * 2. This declaration tells TypeScript about the import type
 *
 * Without this file, you'll get:
 *   "Module parse failed: Unexpected token"
 *   "Cannot find module '*.graphql'"
 *
 * Related files:
 * - next.config.mjs (webpack config with asset/source loader)
 * - tsconfig.json (includes src/types/**/*.d.ts)
 * - src/graphql/operations.ts (exports all .graphql files)
 *
 * Architecture Decision:
 * - We use 'asset/source' (string) instead of 'graphql-tag/loader' (AST)
 * - AWS Amplify client.graphql() accepts string queries
 * - GraphQL Code Generator handles type generation separately
 */
declare module '*.graphql' {
  const content: string;
  export default content;
}

declare module '*.gql' {
  const content: string;
  export default content;
}
