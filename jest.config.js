const { defaults } = require('jest-config');

module.exports = {
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageProvider: 'v8',
  collectCoverageFrom: [
    '**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!<rootDir>/out/**',
    '!<rootDir>/.next/**',
    '!<rootDir>/*.config.js',
    '!<rootDir>/coverage/**',
    '!<rootDir>/.scannerwork/**',
  ],
  moduleNameMapper: {
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/$1',
    '^@public/(.*)$': '<rootDir>/public/$1',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testMatch: [
    '<rootDir>/test/**/*.+(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '.auth.ts',
    'jest.config.js',
    'styleMock.js',
    'next.config.ts',
    'tailwind.config.ts',
    'route.ts'
  ],
  transform: {
    // Use babel-jest with Next preset to support JSX/TSX
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  coveragePathIgnorePatterns: [
    'auth.ts',
    'jest.config.js',
    'styleMock.js',
    'next.config.ts',
    'tailwind.config.ts',
    'route.ts',
    '<rootDir>/.scannerwork/'
  ],
  transformIgnorePatterns: ['/node_modules/', '^.+\\.module\\.(css|sass|scss)$'],
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx', 'css'],
  fakeTimers: { enableGlobally: true },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
