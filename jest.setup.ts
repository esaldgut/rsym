/**
 * Jest Setup File
 *
 * This file runs before each test file.
 * Configure global mocks and testing utilities here.
 *
 * @see https://jestjs.io/docs/configuration#setupfilesafterenv-array
 */
import '@testing-library/jest-dom';

// ============================================================================
// NEXT.JS ROUTER MOCK
// ============================================================================

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Export for test access
export { mockRouter };

// ============================================================================
// LOCALSTORAGE MOCK
// ============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Export for test access
export { localStorageMock };

// ============================================================================
// SESSIONSTORAGE MOCK
// ============================================================================

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// ============================================================================
// WINDOW MOCKS
// ============================================================================

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver (for lazy loading)
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor() {}

  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver (for dynamic layouts)
class MockResizeObserver {
  constructor() {}

  disconnect() {}
  observe() {}
  unobserve() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// ============================================================================
// FETCH MOCK
// ============================================================================

// Default fetch mock (override in individual tests as needed)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as Response)
);

// ============================================================================
// CONSOLE SUPPRESSION (optional - uncomment to suppress console noise)
// ============================================================================

// Suppress console.error for expected errors in tests
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args) => {
//     if (
//       typeof args[0] === 'string' &&
//       args[0].includes('Warning: ReactDOM.render')
//     ) {
//       return;
//     }
//     originalError.call(console, ...args);
//   };
// });
//
// afterAll(() => {
//   console.error = originalError;
// });

// ============================================================================
// TEST CLEANUP
// ============================================================================

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Clear storage mocks
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Reset fetch mock
  (global.fetch as jest.Mock).mockClear();
});

afterEach(() => {
  // Clean up any pending timers
  jest.clearAllTimers();
});
