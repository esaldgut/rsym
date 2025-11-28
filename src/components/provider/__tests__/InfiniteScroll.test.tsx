/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { InfiniteScroll } from '../InfiniteScroll';

// Mock IntersectionObserver
let intersectionCallback: IntersectionObserverCallback | null = null;
let observerOptions: IntersectionObserverInit | undefined;

const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    intersectionCallback = callback;
    observerOptions = options;
  }

  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// Replace global IntersectionObserver
const originalIntersectionObserver = window.IntersectionObserver;

describe('InfiniteScroll', () => {
  const mockOnLoadMore = jest.fn();

  beforeAll(() => {
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterAll(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    intersectionCallback = null;
    observerOptions = undefined;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders children content', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div data-testid="child-content">Product List</div>
        </InfiniteScroll>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Product List')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div data-testid="child-1">Product 1</div>
          <div data-testid="child-2">Product 2</div>
          <div data-testid="child-3">Product 3</div>
        </InfiniteScroll>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('applies className prop to container', () => {
      const { container } = render(
        <InfiniteScroll
          hasMore={true}
          isLoading={false}
          onLoadMore={mockOnLoadMore}
          className="custom-class grid-cols-3"
        >
          <div>Content</div>
        </InfiniteScroll>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
      expect(wrapper).toHaveClass('grid-cols-3');
    });

    it('renders sentinel element for intersection observer', () => {
      const { container } = render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      // Sentinel is a div with h-4 class
      const sentinel = container.querySelector('.h-4');
      expect(sentinel).toBeInTheDocument();
    });
  });

  describe('IntersectionObserver Setup', () => {
    it('creates IntersectionObserver on mount', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      expect(mockObserve).toHaveBeenCalledTimes(1);
    });

    it('observes sentinel element', () => {
      const { container } = render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      const sentinel = container.querySelector('.h-4');
      expect(mockObserve).toHaveBeenCalledWith(sentinel);
    });

    it('disconnects observer on unmount', () => {
      const { unmount } = render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      unmount();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('uses default threshold of 300px', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      expect(observerOptions?.rootMargin).toBe('300px');
    });

    it('uses custom threshold prop', () => {
      render(
        <InfiniteScroll
          hasMore={true}
          isLoading={false}
          onLoadMore={mockOnLoadMore}
          threshold={500}
        >
          <div>Content</div>
        </InfiniteScroll>
      );

      expect(observerOptions?.rootMargin).toBe('500px');
    });

    it('sets threshold option to 0.1', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      expect(observerOptions?.threshold).toBe(0.1);
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={true} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      // Check for spinner element (animated spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows "Cargando más productos..." text when loading', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={true} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      expect(screen.getByText('Cargando más productos...')).toBeInTheDocument();
    });

    it('does not show loading state when isLoading is false', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      expect(screen.queryByText('Cargando más productos...')).not.toBeInTheDocument();
    });
  });

  describe('End of List State', () => {
    it('shows end state when hasMore is false and not loading', () => {
      render(
        <InfiniteScroll hasMore={false} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      expect(screen.getByText('Has visto todos los productos')).toBeInTheDocument();
    });

    it('shows secondary message in end state', () => {
      render(
        <InfiniteScroll hasMore={false} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      expect(screen.getByText('¡Crea más productos para hacer crecer tu negocio!')).toBeInTheDocument();
    });

    it('does not show end state when hasMore is true', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      expect(screen.queryByText('Has visto todos los productos')).not.toBeInTheDocument();
    });

    it('does not show end state when isLoading is true', () => {
      render(
        <InfiniteScroll hasMore={false} isLoading={true} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      expect(screen.queryByText('Has visto todos los productos')).not.toBeInTheDocument();
    });

    it('renders checkmark icon in end state', () => {
      const { container } = render(
        <InfiniteScroll hasMore={false} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      // Checkmark SVG is present
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Load More Trigger', () => {
    it('calls onLoadMore when sentinel intersects and conditions met', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      // Simulate intersection
      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });

    it('does not call onLoadMore when not intersecting', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(mockOnLoadMore).not.toHaveBeenCalled();
    });

    it('does not call onLoadMore when hasMore is false', () => {
      render(
        <InfiniteScroll hasMore={false} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(mockOnLoadMore).not.toHaveBeenCalled();
    });

    it('does not call onLoadMore when isLoading is true', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={true} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(mockOnLoadMore).not.toHaveBeenCalled();
    });
  });

  describe('Debounce Mechanism', () => {
    it('prevents rapid-fire calls with debounce', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      // First intersection - should call
      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);

      // Second rapid intersection - should NOT call (debounced)
      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });

    it('allows call after debounce timeout (1000ms)', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      // First call
      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);

      // Advance timer past debounce period
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Second call after timeout - should work
      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(mockOnLoadMore).toHaveBeenCalledTimes(2);
    });

    it('still blocks call before debounce timeout expires', () => {
      render(
        <InfiniteScroll hasMore={true} isLoading={false} onLoadMore={mockOnLoadMore}>
          <div>Content</div>
        </InfiniteScroll>
      );

      // First call
      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      // Advance timer but not past debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Try second call - should still be blocked
      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });
  });
});
