// Jest Configuration for YAAN Product Wizard Unit Tests
// See: https://jestjs.io/docs/configuration
// See: https://nextjs.org/docs/testing#jest-and-react-testing-library
//
// Convenciones:
// - Archivos de test: __tests__/**/*.test.ts(x)
// - Mocks: src/__tests__/mocks/
// - Coverage: coverage/

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',

  // Setup files to run after jest is initialized
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Module path aliases (must match tsconfig.json paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],

  // Files to ignore during tests
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/amplify/',
  ],

  // Transform ignore patterns (required for ES modules in node_modules)
  transformIgnorePatterns: [
    '/node_modules/(?!(maplibre-gl|@mapbox|@cesdk|@aws-amplify|aws-amplify)/)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    // Product Wizard components (primary focus)
    'src/components/product-wizard/**/*.{ts,tsx}',
    // UI components (tested)
    'src/components/ui/CarouselDots.tsx',
    'src/components/ui/DateInput.tsx',
    'src/components/ui/DateRangeInput.tsx',
    'src/components/ui/FileUpload.tsx',
    // Related hooks
    'src/hooks/useUnsavedChanges.ts',
    'src/hooks/useMediaUpload.ts',
    'src/hooks/useProductCreation.ts',
    // Validation schemas
    'src/lib/validations/product-schemas.ts',
    // Form context
    'src/context/ProductFormContext.tsx',
    // Exclude type definitions and index files
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/node_modules/**',
  ],

  // Coverage thresholds per file (enforced in CI)
  // Global thresholds are set to 0 because not all files have tests yet
  // Specific thresholds enforce high coverage on tested files
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    // High thresholds for fully tested utility files
    'src/components/product-wizard/utils/tab-navigation.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    // High thresholds for tested hooks
    'src/hooks/useUnsavedChanges.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Medium thresholds for partially tested files
    'src/lib/validations/product-schemas.ts': {
      branches: 45,
      functions: 80,
      lines: 70,
      statements: 70,
    },
    'src/context/ProductFormContext.tsx': {
      branches: 40,
      functions: 50,
      lines: 60,
      statements: 60,
    },
    // UI Components - fully tested
    'src/components/ui/CarouselDots.tsx': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    'src/components/ui/DateInput.tsx': {
      branches: 100,
      functions: 85,
      lines: 95,
      statements: 95,
    },
    'src/components/ui/DateRangeInput.tsx': {
      branches: 90,
      functions: 100,
      lines: 90,
      statements: 90,
    },
    'src/components/ui/FileUpload.tsx': {
      branches: 45,
      functions: 70,
      lines: 40,
      statements: 40,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Maximum workers for parallel execution
  maxWorkers: '50%',

  // Global timeout for tests (10 seconds)
  testTimeout: 10000,
};

module.exports = createJestConfig(customJestConfig);
