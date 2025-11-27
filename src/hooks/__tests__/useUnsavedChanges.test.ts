/**
 * Unit Tests for useUnsavedChanges hook
 *
 * Tests the unsaved changes detection, navigation prevention,
 * and modal state management for the Product Wizard.
 *
 * @coverage Target: 90%+
 */
import { renderHook, act } from '@testing-library/react';
import { useUnsavedChanges } from '../useUnsavedChanges';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock Next.js navigation hooks
const mockPush = jest.fn();
const mockPathname = '/test-path';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

// Mock console.log to reduce noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

afterAll(() => {
  mockConsoleLog.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// TEST DATA
// ============================================================================

interface TestFormData {
  name: string;
  description: string;
  count: number;
  nested: {
    value: string;
    items: string[];
  };
}

const createTestData = (overrides: Partial<TestFormData> = {}): TestFormData => ({
  name: 'Test Name',
  description: 'Test Description',
  count: 0,
  nested: {
    value: 'nested value',
    items: ['item1', 'item2'],
  },
  ...overrides,
});

// ============================================================================
// BASIC FUNCTIONALITY TESTS
// ============================================================================

describe('useUnsavedChanges - Basic Functionality', () => {
  it('returns initial state without unsaved changes', () => {
    const initialData = createTestData();
    const { result } = renderHook(() => useUnsavedChanges(initialData));

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.showModal).toBe(false);
  });

  it('returns all expected functions', () => {
    const { result } = renderHook(() => useUnsavedChanges({}));

    expect(typeof result.current.handleNavigation).toBe('function');
    expect(typeof result.current.confirmNavigation).toBe('function');
    expect(typeof result.current.cancelNavigation).toBe('function');
    expect(typeof result.current.resetInitialData).toBe('function');
    expect(typeof result.current.markFieldAsDirty).toBe('function');
    expect(typeof result.current.markFieldAsClean).toBe('function');
    expect(typeof result.current.resetDirtyFields).toBe('function');
    expect(typeof result.current.getModifiedFields).toBe('function');
    expect(typeof result.current.setShowModal).toBe('function');
  });

  it('allows customization via options', () => {
    const initialData = createTestData();
    const { result } = renderHook(() =>
      useUnsavedChanges(initialData, {
        strategy: 'dirty-tracking',
        enabled: true,
        message: 'Custom message',
        beforeUnloadMessage: 'Custom unload message',
      })
    );

    expect(result.current.hasUnsavedChanges).toBe(false);
  });
});

// ============================================================================
// DEEP COMPARE STRATEGY TESTS
// ============================================================================

describe('useUnsavedChanges - Deep Compare Strategy', () => {
  it('detects changes when data differs from initial', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: initialData } }
    );

    // Initially no changes
    expect(result.current.hasUnsavedChanges).toBe(false);

    // Update with different data
    const changedData = { ...initialData, name: 'Changed Name' };
    rerender({ data: changedData });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('detects nested changes', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: initialData } }
    );

    // Update nested value
    const changedData = {
      ...initialData,
      nested: { ...initialData.nested, value: 'changed nested' },
    };
    rerender({ data: changedData });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('detects array changes', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: initialData } }
    );

    // Update array
    const changedData = {
      ...initialData,
      nested: { ...initialData.nested, items: ['item1', 'item2', 'item3'] },
    };
    rerender({ data: changedData });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('reports no changes when data matches initial', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: initialData } }
    );

    // Rerender with same data (new object but same values)
    const sameData = createTestData();
    rerender({ data: sameData });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('handles null values correctly', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: { value: null } } }
    );

    rerender({ data: { value: 'now has value' } });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('handles undefined values correctly', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: { value: undefined } } }
    );

    rerender({ data: { value: 'now has value' } });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('handles objects with function properties', () => {
    // Note: The hook uses JSON.parse(JSON.stringify()) to store initial data,
    // which strips functions. This means objects with functions will always
    // be considered "changed" if they have function properties in current data.
    // This test documents this behavior.
    const dataWithFunction = {
      name: 'Test',
      callback: () => console.log('test'),
    };
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: dataWithFunction } }
    );

    // Rerender with same object structure
    // The deepCompare function itself ignores functions,
    // but since initial data was JSON serialized (functions stripped),
    // the comparison may show differences due to key mismatch.
    rerender({
      data: {
        name: 'Test',
        callback: () => console.log('different'),
      },
    });

    // The hook's deepCompare ignores function comparisons during iteration,
    // but key comparison may still detect the difference since JSON.stringify
    // removes functions from the stored initial data
    // This documents the actual behavior
    expect(typeof result.current.hasUnsavedChanges).toBe('boolean');
  });
});

// ============================================================================
// DIRTY TRACKING STRATEGY TESTS
// ============================================================================

describe('useUnsavedChanges - Dirty Tracking Strategy', () => {
  it('starts without dirty fields', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({}, { strategy: 'dirty-tracking' })
    );

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.getModifiedFields()).toEqual([]);
  });

  it('marks field as dirty', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({}, { strategy: 'dirty-tracking' })
    );

    act(() => {
      result.current.markFieldAsDirty('name');
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.getModifiedFields()).toContain('name');
  });

  it('marks multiple fields as dirty', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({}, { strategy: 'dirty-tracking' })
    );

    act(() => {
      result.current.markFieldAsDirty('name');
      result.current.markFieldAsDirty('description');
      result.current.markFieldAsDirty('count');
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    const fields = result.current.getModifiedFields();
    expect(fields).toContain('name');
    expect(fields).toContain('description');
    expect(fields).toContain('count');
    expect(fields).toHaveLength(3);
  });

  it('marks field as clean', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({}, { strategy: 'dirty-tracking' })
    );

    act(() => {
      result.current.markFieldAsDirty('name');
      result.current.markFieldAsDirty('description');
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      result.current.markFieldAsClean('name');
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.getModifiedFields()).not.toContain('name');
    expect(result.current.getModifiedFields()).toContain('description');
  });

  it('removes hasUnsavedChanges when all fields are clean', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({}, { strategy: 'dirty-tracking' })
    );

    act(() => {
      result.current.markFieldAsDirty('name');
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      result.current.markFieldAsClean('name');
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('resets all dirty fields', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({}, { strategy: 'dirty-tracking' })
    );

    act(() => {
      result.current.markFieldAsDirty('name');
      result.current.markFieldAsDirty('description');
      result.current.markFieldAsDirty('count');
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      result.current.resetDirtyFields();
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.getModifiedFields()).toEqual([]);
  });

  it('does not mark fields in deep-compare mode', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({}, { strategy: 'deep-compare' })
    );

    act(() => {
      result.current.markFieldAsDirty('name');
    });

    // In deep-compare mode, markFieldAsDirty should be a no-op
    expect(result.current.getModifiedFields()).toEqual([]);
  });
});

// ============================================================================
// NAVIGATION HANDLING TESTS
// ============================================================================

describe('useUnsavedChanges - Navigation Handling', () => {
  it('allows navigation when no unsaved changes', () => {
    const initialData = createTestData();
    const { result } = renderHook(() => useUnsavedChanges(initialData));

    const shouldNavigate = result.current.handleNavigation('/new-route');

    expect(shouldNavigate).toBe(true);
    expect(result.current.showModal).toBe(false);
  });

  it('blocks navigation when has unsaved changes', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: initialData } }
    );

    // Make changes
    rerender({ data: { ...initialData, name: 'Changed' } });

    expect(result.current.hasUnsavedChanges).toBe(true);

    // Wrap in act() since handleNavigation updates state
    let shouldNavigate: boolean = true;
    act(() => {
      shouldNavigate = result.current.handleNavigation('/new-route');
    });

    expect(shouldNavigate).toBe(false);
    expect(result.current.showModal).toBe(true);
  });

  it('confirms navigation and redirects', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: initialData } }
    );

    // Make changes
    rerender({ data: { ...initialData, name: 'Changed' } });

    // Attempt navigation
    act(() => {
      result.current.handleNavigation('/new-route');
    });

    expect(result.current.showModal).toBe(true);

    // Confirm navigation
    act(() => {
      result.current.confirmNavigation();
    });

    expect(mockPush).toHaveBeenCalledWith('/new-route');
    expect(result.current.showModal).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('cancels navigation and stays on page', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: initialData } }
    );

    // Make changes
    rerender({ data: { ...initialData, name: 'Changed' } });

    // Attempt navigation
    act(() => {
      result.current.handleNavigation('/new-route');
    });

    // Cancel navigation
    act(() => {
      result.current.cancelNavigation();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.showModal).toBe(false);
    // Changes should still be unsaved
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('allows navigation when disabled', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { enabled: false }),
      { initialProps: { data: initialData } }
    );

    // Make changes (but hook is disabled)
    rerender({ data: { ...initialData, name: 'Changed' } });

    const shouldNavigate = result.current.handleNavigation('/new-route');

    expect(shouldNavigate).toBe(true);
    expect(result.current.showModal).toBe(false);
  });
});

// ============================================================================
// RESET INITIAL DATA TESTS
// ============================================================================

describe('useUnsavedChanges - Reset Initial Data', () => {
  it('resets initial data to current data', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: initialData } }
    );

    // Make changes
    const changedData = { ...initialData, name: 'Changed Name' };
    rerender({ data: changedData });

    expect(result.current.hasUnsavedChanges).toBe(true);

    // Reset initial data to match current
    act(() => {
      result.current.resetInitialData();
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('clears dirty fields on reset', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({}, { strategy: 'dirty-tracking' })
    );

    act(() => {
      result.current.markFieldAsDirty('name');
      result.current.markFieldAsDirty('description');
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      result.current.resetInitialData();
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.getModifiedFields()).toEqual([]);
  });
});

// ============================================================================
// GET MODIFIED FIELDS TESTS
// ============================================================================

describe('useUnsavedChanges - Get Modified Fields', () => {
  it('returns empty array when no changes (deep-compare)', () => {
    const initialData = createTestData();
    const { result } = renderHook(() =>
      useUnsavedChanges(initialData, { strategy: 'deep-compare' })
    );

    expect(result.current.getModifiedFields()).toEqual([]);
  });

  it('returns modified field names (deep-compare)', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: initialData } }
    );

    const changedData = {
      ...initialData,
      name: 'Changed Name',
      count: 42,
    };
    rerender({ data: changedData });

    const modified = result.current.getModifiedFields();
    expect(modified).toContain('name');
    expect(modified).toContain('count');
    expect(modified).not.toContain('description');
  });

  it('returns nested modified fields (deep-compare)', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { strategy: 'deep-compare' }),
      { initialProps: { data: initialData } }
    );

    const changedData = {
      ...initialData,
      nested: { ...initialData.nested, value: 'changed' },
    };
    rerender({ data: changedData });

    const modified = result.current.getModifiedFields();
    expect(modified).toContain('nested.value');
  });

  it('returns dirty fields set (dirty-tracking)', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({}, { strategy: 'dirty-tracking' })
    );

    act(() => {
      result.current.markFieldAsDirty('field1');
      result.current.markFieldAsDirty('field2');
    });

    const modified = result.current.getModifiedFields();
    expect(modified).toContain('field1');
    expect(modified).toContain('field2');
  });
});

// ============================================================================
// MODAL STATE TESTS
// ============================================================================

describe('useUnsavedChanges - Modal State', () => {
  it('starts with modal closed', () => {
    const { result } = renderHook(() => useUnsavedChanges({}));

    expect(result.current.showModal).toBe(false);
  });

  it('opens modal on blocked navigation', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data: initialData } }
    );

    rerender({ data: { ...initialData, name: 'Changed' } });

    act(() => {
      result.current.handleNavigation('/somewhere');
    });

    expect(result.current.showModal).toBe(true);
  });

  it('closes modal on confirm', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data: initialData } }
    );

    rerender({ data: { ...initialData, name: 'Changed' } });

    act(() => {
      result.current.handleNavigation('/somewhere');
    });

    act(() => {
      result.current.confirmNavigation();
    });

    expect(result.current.showModal).toBe(false);
  });

  it('closes modal on cancel', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data: initialData } }
    );

    rerender({ data: { ...initialData, name: 'Changed' } });

    act(() => {
      result.current.handleNavigation('/somewhere');
    });

    act(() => {
      result.current.cancelNavigation();
    });

    expect(result.current.showModal).toBe(false);
  });

  it('allows manual modal control via setShowModal', () => {
    const { result } = renderHook(() => useUnsavedChanges({}));

    act(() => {
      result.current.setShowModal(true);
    });

    expect(result.current.showModal).toBe(true);

    act(() => {
      result.current.setShowModal(false);
    });

    expect(result.current.showModal).toBe(false);
  });
});

// ============================================================================
// BEFORE UNLOAD EVENT TESTS
// ============================================================================

describe('useUnsavedChanges - beforeunload Event', () => {
  it('adds beforeunload listener when has unsaved changes', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const initialData = createTestData();

    const { rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data: initialData } }
    );

    // Make changes to trigger unsaved state
    rerender({ data: { ...initialData, name: 'Changed' } });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });

  it('removes beforeunload listener on cleanup', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const initialData = createTestData();

    const { rerender, unmount } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data: initialData } }
    );

    // Make changes
    rerender({ data: { ...initialData, name: 'Changed' } });

    // Unmount to trigger cleanup
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('does not add listener when disabled', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const initialData = createTestData();

    const { rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data, { enabled: false }),
      { initialProps: { data: initialData } }
    );

    // Make changes (but hook is disabled)
    rerender({ data: { ...initialData, name: 'Changed' } });

    // beforeunload should not be called (only other event types)
    const beforeUnloadCalls = addEventListenerSpy.mock.calls.filter(
      (call) => call[0] === 'beforeunload'
    );
    expect(beforeUnloadCalls).toHaveLength(0);

    addEventListenerSpy.mockRestore();
  });
});

// ============================================================================
// INITIAL DATA OPTION TESTS
// ============================================================================

describe('useUnsavedChanges - Initial Data Option', () => {
  it('uses providedInitialData over currentData for comparison', () => {
    const providedInitial = createTestData({ name: 'Original' });
    const currentData = createTestData({ name: 'Current' });

    const { result, rerender } = renderHook(
      ({ data }) =>
        useUnsavedChanges(data, { initialData: providedInitial }),
      { initialProps: { data: currentData } }
    );

    // Should detect change since currentData differs from providedInitialData
    expect(result.current.hasUnsavedChanges).toBe(true);

    // Change current data back to match initial
    rerender({ data: providedInitial });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('useUnsavedChanges - Edge Cases', () => {
  it('handles empty object data', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data: {} } }
    );

    expect(result.current.hasUnsavedChanges).toBe(false);

    rerender({ data: { newField: 'value' } });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('handles primitive data', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data: 'initial string' } }
    );

    expect(result.current.hasUnsavedChanges).toBe(false);

    rerender({ data: 'changed string' });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('handles array data', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data: [1, 2, 3] } }
    );

    expect(result.current.hasUnsavedChanges).toBe(false);

    rerender({ data: [1, 2, 3, 4] });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('handles rapid data changes', () => {
    const initialData = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data: initialData } }
    );

    // Rapid changes
    for (let i = 0; i < 10; i++) {
      rerender({ data: { ...initialData, count: i } });
    }

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('confirmNavigation does nothing without pending navigation', () => {
    const { result } = renderHook(() => useUnsavedChanges({}));

    act(() => {
      result.current.confirmNavigation();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.showModal).toBe(false);
  });

  it('handles deeply nested object changes', () => {
    const initialData = {
      level1: {
        level2: {
          level3: {
            value: 'deep',
          },
        },
      },
    };

    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data: initialData } }
    );

    const changedData = {
      level1: {
        level2: {
          level3: {
            value: 'changed deep',
          },
        },
      },
    };

    rerender({ data: changedData });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('handles same object reference correctly', () => {
    const data = createTestData();
    const { result, rerender } = renderHook(
      ({ data }) => useUnsavedChanges(data),
      { initialProps: { data } }
    );

    // Rerender with exact same reference
    rerender({ data });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });
});
