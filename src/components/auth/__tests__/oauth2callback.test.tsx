import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import '@testing-library/jest-dom';
import { Hub } from 'aws-amplify/utils';
import { OAuth2Callback } from '../OAuth2Callback';
import userEvent from '@testing-library/user-event';

// ============================================================================
// MOCKS
// ============================================================================

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

jest.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: jest.fn()
  }
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
};

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockHubListen = Hub.listen as jest.MockedFunction<typeof Hub.listen>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createMockSearchParams = (params: Record<string, string>) => {
  const searchParams = new URLSearchParams(params);
  return {
    get: (key: string) => searchParams.get(key),
    has: (key: string) => searchParams.has(key),
    getAll: (key: string) => searchParams.getAll(key),
    keys: () => searchParams.keys(),
    values: () => searchParams.values(),
    entries: () => searchParams.entries(),
    forEach: (callback: any) => searchParams.forEach(callback),
    toString: () => searchParams.toString()
  } as ReturnType<typeof useSearchParams>;
};

// ============================================================================
// TESTS
// ============================================================================

describe('OAuth2Callback', () => {
  let hubUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    hubUnsubscribe = jest.fn();
    mockHubListen.mockReturnValue(hubUnsubscribe);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render nothing when no OAuth2 parameters present', () => {
      mockUseSearchParams.mockReturnValue(createMockSearchParams({}));

      const { container } = render(<OAuth2Callback />);

      expect(container.firstChild).toBeNull();
    });

    it('should render loading state when code parameter is present', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      render(<OAuth2Callback />);

      expect(screen.getByText('Procesando autenticación')).toBeInTheDocument();
      expect(screen.getByText('Procesando autenticación...')).toBeInTheDocument();
    });

    it('should render loading spinner in loading state', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      const { container } = render(<OAuth2Callback />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render full-screen overlay when OAuth2 params present', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      const { container } = render(<OAuth2Callback />);

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('bg-white', 'z-50');
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling', () => {

    it('should handle redirect_mismatch error with custom message', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'redirect_mismatch' })
      );

      render(<OAuth2Callback />);

      expect(
        screen.getByText('Error de configuración: Las URLs de redirección no coinciden.')
      ).toBeInTheDocument();
    });

    it('should handle invalid_client error with custom message', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'invalid_client' })
      );

      render(<OAuth2Callback />);

      expect(
        screen.getByText('Error de cliente: Verifica el client_id.')
      ).toBeInTheDocument();
    });

    it('should handle access_denied error with custom message', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'access_denied' })
      );

      render(<OAuth2Callback />);

      expect(
        screen.getByText('Acceso denegado: El usuario canceló la autenticación.')
      ).toBeInTheDocument();
    });

    it('should display generic error message for unknown errors', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'unknown_error' })
      );

      render(<OAuth2Callback />);

      expect(screen.getByText('OAuth error: unknown_error')).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'access_denied' })
      );

      render(<OAuth2Callback onError={onError} />);

      expect(onError).toHaveBeenCalledWith(
        'Acceso denegado: El usuario canceló la autenticación.'
      );
    });

    it('should show retry button in error state', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'access_denied' })
      );

      render(<OAuth2Callback />);

      const retryButton = screen.getByText('Intentar nuevamente');
      expect(retryButton).toBeInTheDocument();
    });

    it('should navigate to /auth when retry button is clicked', async () => {
      const user = userEvent.setup();
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'access_denied' })
      );

      render(<OAuth2Callback />);

      const retryButton = screen.getByText('Intentar nuevamente');
      await user.click(retryButton);

      expect(mockPush).toHaveBeenCalledWith('/auth');
    });
  });

  // ==========================================================================
  // HUB LISTENER TESTS
  // ==========================================================================

  describe('Hub Event Listeners', () => {
    it('should set up Hub listener when code is present', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      render(<OAuth2Callback />);

      expect(mockHubListen).toHaveBeenCalledWith('auth', expect.any(Function));
    });

    it('should not set up Hub listener when only error is present', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'access_denied' })
      );

      render(<OAuth2Callback />);

      expect(mockHubListen).not.toHaveBeenCalled();
    });

    it('should cleanup Hub listener on unmount', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      const { unmount } = render(<OAuth2Callback />);

      unmount();

      expect(hubUnsubscribe).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SUCCESS FLOW TESTS
  // ==========================================================================

  describe('Success Flow - signInWithRedirect event', () => {
    it('should handle signInWithRedirect success event', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      // Simulate Hub event
      hubCallback({ payload: { event: 'signInWithRedirect' } });

      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido a YAAN!')).toBeInTheDocument();
        expect(screen.getByText('¡Autenticación exitosa!')).toBeInTheDocument();
      });
    });

    it('should navigate to default profile route on success', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      hubCallback({ payload: { event: 'signInWithRedirect' } });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile');
      });
    });

    it('should navigate to custom redirect URL when provided', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          code: 'auth-code-123',
          redirect: '/dashboard'
        })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      hubCallback({ payload: { event: 'signInWithRedirect' } });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should call onSuccess callback on successful authentication', async () => {
      const onSuccess = jest.fn();
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback onSuccess={onSuccess} />);

      hubCallback({ payload: { event: 'signInWithRedirect' } });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should display success icon on successful authentication', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      const { container } = render(<OAuth2Callback />);

      hubCallback({ payload: { event: 'signInWithRedirect' } });

      await waitFor(() => {
        const successIcon = container.querySelector('.bg-green-100');
        expect(successIcon).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // SUCCESS FLOW TESTS - signedIn event
  // ==========================================================================

  describe('Success Flow - signedIn event', () => {
    it('should handle signedIn success event', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      hubCallback({ payload: { event: 'signedIn' } });

      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido a YAAN!')).toBeInTheDocument();
      });
    });

    it('should navigate on signedIn event', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      hubCallback({ payload: { event: 'signedIn' } });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile');
      });
    });

    it('should call onSuccess on signedIn event', async () => {
      const onSuccess = jest.fn();
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback onSuccess={onSuccess} />);

      hubCallback({ payload: { event: 'signedIn' } });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // FAILURE FLOW TESTS
  // ==========================================================================

  describe('Failure Flow - signInWithRedirect_failure event', () => {
    it('should handle signInWithRedirect_failure event', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      hubCallback({ payload: { event: 'signInWithRedirect_failure' } });

      await waitFor(() => {
        expect(screen.getByText('Error de autenticación')).toBeInTheDocument();
        expect(screen.getByText('Error en la autenticación social')).toBeInTheDocument();
      });
    });

    it('should call onError callback on signInWithRedirect_failure', async () => {
      const onError = jest.fn();
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback onError={onError} />);

      hubCallback({ payload: { event: 'signInWithRedirect_failure' } });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Error en la autenticación social');
      });
    });

    it('should display error icon on failure', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      const { container } = render(<OAuth2Callback />);

      hubCallback({ payload: { event: 'signInWithRedirect_failure' } });

      await waitFor(() => {
        const errorIcon = container.querySelector('.bg-red-100');
        expect(errorIcon).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('Integration Scenarios', () => {
    it('should handle complete success flow from code to redirect', async () => {
      const onSuccess = jest.fn();
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          code: 'auth-code-123',
          redirect: '/moments'
        })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback onSuccess={onSuccess} />);

      // Initially loading
      expect(screen.getByText('Procesando autenticación')).toBeInTheDocument();

      // Trigger success event
      hubCallback({ payload: { event: 'signInWithRedirect' } });

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido a YAAN!')).toBeInTheDocument();
        expect(onSuccess).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/moments');
      });
    });

    it('should handle complete error flow with retry', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'access_denied' })
      );

      render(<OAuth2Callback onError={onError} />);

      // Check error state
      expect(screen.getByText('Error de autenticación')).toBeInTheDocument();
      expect(onError).toHaveBeenCalled();

      // Click retry
      const retryButton = screen.getByText('Intentar nuevamente');
      await user.click(retryButton);

      expect(mockPush).toHaveBeenCalledWith('/auth');
    });

    it('should not interfere when neither code nor error present', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ some_other_param: 'value' })
      );

      const { container } = render(<OAuth2Callback />);

      expect(container.firstChild).toBeNull();
      expect(mockHubListen).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle both callbacks being undefined', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      // Should not throw when callbacks are undefined
      expect(() => {
        hubCallback({ payload: { event: 'signInWithRedirect' } });
      }).not.toThrow();
    });

    it('should handle error without description', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'some_error' })
      );

      render(<OAuth2Callback />);

      expect(screen.getByText('OAuth error: some_error')).toBeInTheDocument();
    });

    it('should handle unknown Hub events gracefully', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      // Unknown event should not change state
      hubCallback({ payload: { event: 'unknownEvent' } });

      // Should still be in loading state
      expect(screen.getByText('Procesando autenticación')).toBeInTheDocument();
    });

    it('should handle multiple Hub events correctly', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      // First failure
      hubCallback({ payload: { event: 'signInWithRedirect_failure' } });

      await waitFor(() => {
        expect(screen.getByText('Error en la autenticación social')).toBeInTheDocument();
      });

      // Then success (shouldn't happen but testing state management)
      hubCallback({ payload: { event: 'signInWithRedirect' } });

      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido a YAAN!')).toBeInTheDocument();
      });
    });

    it('should preserve redirect parameter through the flow', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          code: 'auth-code-123',
          redirect: '/provider/dashboard'
        })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      hubCallback({ payload: { event: 'signedIn' } });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/provider/dashboard');
      });
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper semantic structure for loading state', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      render(<OAuth2Callback />);

      const heading = screen.getByRole('heading', { name: /procesando autenticación/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have proper semantic structure for error state', () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ error: 'access_denied' })
      );

      render(<OAuth2Callback />);

      const heading = screen.getByRole('heading', { name: /error de autenticación/i });
      const button = screen.getByRole('button', { name: /intentar nuevamente/i });
      
      expect(heading).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });

    it('should have proper semantic structure for success state', async () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ code: 'auth-code-123' })
      );

      let hubCallback: any;
      mockHubListen.mockImplementation((channel, callback) => {
        hubCallback = callback;
        return hubUnsubscribe;
      });

      render(<OAuth2Callback />);

      hubCallback({ payload: { event: 'signInWithRedirect' } });

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /¡bienvenido a yaan!/i });
        expect(heading).toBeInTheDocument();
      });
    });
  });
});
