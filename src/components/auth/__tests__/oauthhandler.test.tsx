/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OAuthHandler } from '../OAuthHandler';
import { Hub } from 'aws-amplify/utils';
import { useRouter } from 'next/navigation';
import { logger } from '../../../utils/logger';

// ============================================================================
// MOCKS
// ============================================================================

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Amplify Hub
jest.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    auth: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// ============================================================================
// TEST SETUP
// ============================================================================

const mockPush = jest.fn();
const mockHubUnsubscribe = jest.fn();

describe('OAuthHandler', () => {
  let hubCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup Hub mock - capture the callback
    (Hub.listen as jest.Mock).mockImplementation((channel, callback) => {
      hubCallback = callback;
      return mockHubUnsubscribe;
    });
  });

  // ==========================================================================
  // 1. RENDERIZADO Y SETUP
  // ==========================================================================

  describe('Renderizado y Setup', () => {
    it('no renderiza nada visible', () => {
      const { container } = render(<OAuthHandler />);
      
      expect(container.firstChild).toBeNull();
    });

    it('registra listener de Hub al montar', () => {
      render(<OAuthHandler />);
      
      expect(Hub.listen).toHaveBeenCalledWith('auth', expect.any(Function));
    });

    it('registra log de inicialización', () => {
      render(<OAuthHandler />);
      
      expect(logger.auth).toHaveBeenCalledWith(
        'Inicializando listener de eventos OAuth',
        'OAuthHandler'
      );
    });

    it('desregistra listener al desmontar', () => {
      const { unmount } = render(<OAuthHandler />);
      
      unmount();
      
      expect(mockHubUnsubscribe).toHaveBeenCalled();
    });

    it('registra log al desmontar', () => {
      const { unmount } = render(<OAuthHandler />);
      
      unmount();
      
      expect(logger.auth).toHaveBeenCalledWith(
        'Removiendo listener de eventos OAuth',
        'OAuthHandler'
      );
    });
  });

  // ==========================================================================
  // 2. EVENTO signInWithRedirect
  // ==========================================================================

  describe('Evento signInWithRedirect', () => {
    beforeEach(() => {
      render(<OAuthHandler />);
    });

    it('maneja evento signInWithRedirect exitoso', () => {
      hubCallback({
        payload: {
          event: 'signInWithRedirect',
          data: {},
        },
      });
      
      expect(logger.auth).toHaveBeenCalledWith(
        'Evento recibido: signInWithRedirect',
        'OAuthHandler'
      );
      expect(logger.auth).toHaveBeenCalledWith(
        'OAuth sign in successful',
        'signInWithRedirect'
      );
    });

    it('redirige a /marketplace después de sign in exitoso', () => {
      hubCallback({
        payload: {
          event: 'signInWithRedirect',
          data: {},
        },
      });
      
      expect(mockPush).toHaveBeenCalledWith('/marketplace');
    });
  });

  // ==========================================================================
  // 3. EVENTO signInWithRedirect_failure
  // ==========================================================================

  describe('Evento signInWithRedirect_failure', () => {
    beforeEach(() => {
      render(<OAuthHandler />);
    });

    it('maneja fallo de OAuth con mensaje de error', () => {
      const errorMessage = 'User cancelled login';
      
      hubCallback({
        payload: {
          event: 'signInWithRedirect_failure',
          data: {
            message: errorMessage,
          },
        },
      });
      
      expect(logger.error).toHaveBeenCalledWith(
        'OAuth sign in failed',
        { error: errorMessage }
      );
    });

    it('redirige a /auth con parámetros de error', () => {
      const errorMessage = 'Access denied';
      
      hubCallback({
        payload: {
          event: 'signInWithRedirect_failure',
          data: {
            message: errorMessage,
          },
        },
      });
      
      expect(mockPush).toHaveBeenCalledWith(
        '/auth?error=oauth_failed&error_description=Access%20denied'
      );
    });

    it('usa mensaje genérico si no hay mensaje de error', () => {
      hubCallback({
        payload: {
          event: 'signInWithRedirect_failure',
          data: {},
        },
      });
      
      expect(mockPush).toHaveBeenCalledWith(
        '/auth?error=oauth_failed&error_description=Error%20en%20autenticaci%C3%B3n%20social'
      );
    });

    it('maneja error sin data', () => {
      hubCallback({
        payload: {
          event: 'signInWithRedirect_failure',
        },
      });
      
      expect(mockPush).toHaveBeenCalledWith(
        '/auth?error=oauth_failed&error_description=Error%20en%20autenticaci%C3%B3n%20social'
      );
    });

    it('codifica correctamente caracteres especiales en error', () => {
      const errorMessage = 'Error: Invalid credentials & expired token';
      
      hubCallback({
        payload: {
          event: 'signInWithRedirect_failure',
          data: {
            message: errorMessage,
          },
        },
      });
      
      const expectedUrl = `/auth?error=oauth_failed&error_description=${encodeURIComponent(errorMessage)}`;
      expect(mockPush).toHaveBeenCalledWith(expectedUrl);
    });
  });

  // ==========================================================================
  // 4. EVENTO customOAuthState
  // ==========================================================================

  describe('Evento customOAuthState', () => {
    beforeEach(() => {
      render(<OAuthHandler />);
    });

    it('maneja estado OAuth personalizado', () => {
      hubCallback({
        payload: {
          event: 'customOAuthState',
          data: {
            redirect: '/dashboard',
          },
        },
      });
      
      expect(logger.auth).toHaveBeenCalledWith(
        'Custom OAuth state received',
        'customOAuthState'
      );
    });

    it('redirige a URL personalizada cuando está presente', () => {
      const customRedirect = '/profile?setup=true';
      
      hubCallback({
        payload: {
          event: 'customOAuthState',
          data: {
            redirect: customRedirect,
          },
        },
      });
      
      expect(mockPush).toHaveBeenCalledWith(customRedirect);
    });

    it('no redirige si no hay URL de redirección', () => {
      hubCallback({
        payload: {
          event: 'customOAuthState',
          data: {},
        },
      });
      
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('no redirige si data es undefined', () => {
      hubCallback({
        payload: {
          event: 'customOAuthState',
        },
      });
      
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 5. EVENTO signedIn
  // ==========================================================================

  describe('Evento signedIn', () => {
    beforeEach(() => {
      render(<OAuthHandler />);
    });

    it('registra log cuando el usuario inicia sesión', () => {
      hubCallback({
        payload: {
          event: 'signedIn',
          data: {},
        },
      });
      
      expect(logger.auth).toHaveBeenCalledWith(
        'User signed in successfully',
        'signedIn'
      );
    });

    it('no realiza redirección en signedIn', () => {
      hubCallback({
        payload: {
          event: 'signedIn',
          data: {},
        },
      });
      
      // No debería llamar a router.push
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 6. EVENTO signedOut
  // ==========================================================================

  describe('Evento signedOut', () => {
    beforeEach(() => {
      render(<OAuthHandler />);
    });

    it('registra log cuando el usuario cierra sesión', () => {
      hubCallback({
        payload: {
          event: 'signedOut',
          data: {},
        },
      });
      
      expect(logger.auth).toHaveBeenCalledWith(
        'User signed out',
        'signedOut'
      );
    });

    it('redirige a la página principal después de cerrar sesión', () => {
      hubCallback({
        payload: {
          event: 'signedOut',
          data: {},
        },
      });
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  // ==========================================================================
  // 7. EVENTO tokenRefresh
  // ==========================================================================

  describe('Evento tokenRefresh', () => {
    beforeEach(() => {
      render(<OAuthHandler />);
    });

    it('registra log cuando el token se refresca exitosamente', () => {
      hubCallback({
        payload: {
          event: 'tokenRefresh',
          data: {},
        },
      });
      
      expect(logger.auth).toHaveBeenCalledWith(
        'Token refreshed successfully',
        'tokenRefresh'
      );
    });

    it('no realiza redirección en tokenRefresh', () => {
      hubCallback({
        payload: {
          event: 'tokenRefresh',
          data: {},
        },
      });
      
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 8. EVENTO tokenRefresh_failure
  // ==========================================================================

  describe('Evento tokenRefresh_failure', () => {
    beforeEach(() => {
      render(<OAuthHandler />);
    });

    it('registra warning cuando falla el refresh del token', () => {
      hubCallback({
        payload: {
          event: 'tokenRefresh_failure',
          data: {},
        },
      });
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Token refresh failed',
        { event: 'tokenRefresh_failure' }
      );
    });

    it('no realiza redirección en tokenRefresh_failure', () => {
      hubCallback({
        payload: {
          event: 'tokenRefresh_failure',
          data: {},
        },
      });
      
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 9. EVENTOS DESCONOCIDOS
  // ==========================================================================

  describe('Eventos Desconocidos', () => {
    beforeEach(() => {
      render(<OAuthHandler />);
    });

    it('registra log para eventos desconocidos sin errores', () => {
      hubCallback({
        payload: {
          event: 'unknownEvent',
          data: {},
        },
      });
      
      expect(logger.auth).toHaveBeenCalledWith(
        'Evento recibido: unknownEvent',
        'OAuthHandler'
      );
      
      // No debería causar errores ni redirecciones
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('maneja eventos sin data sin errores', () => {
      expect(() => {
        hubCallback({
          payload: {
            event: 'someEvent',
          },
        });
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // 10. MÚLTIPLES EVENTOS
  // ==========================================================================

  describe('Múltiples Eventos', () => {
    beforeEach(() => {
      render(<OAuthHandler />);
    });

    it('maneja múltiples eventos en secuencia', () => {
      // Evento 1: signedIn
      hubCallback({
        payload: {
          event: 'signedIn',
          data: {},
        },
      });
      
      expect(logger.auth).toHaveBeenCalledWith(
        'User signed in successfully',
        'signedIn'
      );
      
      // Evento 2: tokenRefresh
      hubCallback({
        payload: {
          event: 'tokenRefresh',
          data: {},
        },
      });
      
      expect(logger.auth).toHaveBeenCalledWith(
        'Token refreshed successfully',
        'tokenRefresh'
      );
      
      // Evento 3: signedOut
      hubCallback({
        payload: {
          event: 'signedOut',
          data: {},
        },
      });
      
      expect(logger.auth).toHaveBeenCalledWith(
        'User signed out',
        'signedOut'
      );
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('mantiene el estado entre múltiples renderizados', () => {
      const { rerender } = render(<OAuthHandler />);
      
      // Primer evento
      hubCallback({
        payload: {
          event: 'signedIn',
          data: {},
        },
      });
      
      // Re-renderizar
      rerender(<OAuthHandler />);
      
      // Segundo evento
      hubCallback({
        payload: {
          event: 'signedOut',
          data: {},
        },
      });
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  // ==========================================================================
  // 11. INTEGRACIÓN CON ROUTER
  // ==========================================================================

  describe('Integración con Router', () => {
    it('usa el router del hook useRouter', () => {
      render(<OAuthHandler />);
      
      expect(useRouter).toHaveBeenCalled();
    });

    it('maneja múltiples redirecciones', () => {
      render(<OAuthHandler />);
      
      // Primera redirección
      hubCallback({
        payload: {
          event: 'signInWithRedirect',
          data: {},
        },
      });
      
      expect(mockPush).toHaveBeenCalledWith('/marketplace');
      
      mockPush.mockClear();
      
      // Segunda redirección
      hubCallback({
        payload: {
          event: 'signedOut',
          data: {},
        },
      });
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('preserva parámetros de URL en redirecciones de error', () => {
      render(<OAuthHandler />);
      
      const errorWithSpecialChars = 'Error: Token expired (401)';
      
      hubCallback({
        payload: {
          event: 'signInWithRedirect_failure',
          data: {
            message: errorWithSpecialChars,
          },
        },
      });
      
      const expectedUrl = `/auth?error=oauth_failed&error_description=${encodeURIComponent(errorWithSpecialChars)}`;
      expect(mockPush).toHaveBeenCalledWith(expectedUrl);
    });
  });

  // ==========================================================================
  // 12. LOGGING
  // ==========================================================================

  describe('Logging', () => {
    it('registra todos los eventos recibidos', () => {
      render(<OAuthHandler />);
      
      const events = [
        'signInWithRedirect',
        'signedIn',
        'signedOut',
        'tokenRefresh',
        'customOAuthState',
      ];
      
      events.forEach(eventName => {
        hubCallback({
          payload: {
            event: eventName,
            data: {},
          },
        });
        
        expect(logger.auth).toHaveBeenCalledWith(
          `Evento recibido: ${eventName}`,
          'OAuthHandler'
        );
      });
    });

    it('registra errores con contexto adicional', () => {
      render(<OAuthHandler />);
      
      const errorMessage = 'Network failure';
      
      hubCallback({
        payload: {
          event: 'signInWithRedirect_failure',
          data: {
            message: errorMessage,
          },
        },
      });
      
      expect(logger.error).toHaveBeenCalledWith(
        'OAuth sign in failed',
        { error: errorMessage }
      );
    });

    it('registra warnings para fallos de token', () => {
      render(<OAuthHandler />);
      
      hubCallback({
        payload: {
          event: 'tokenRefresh_failure',
          data: {},
        },
      });
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Token refresh failed',
        { event: 'tokenRefresh_failure' }
      );
    });
  });

  // ==========================================================================
  // 13. LIMPIEZA DE RECURSOS
  // ==========================================================================

  describe('Limpieza de Recursos', () => {
    it('limpia listener una sola vez al desmontar', () => {
      const { unmount } = render(<OAuthHandler />);
      
      unmount();
      
      expect(mockHubUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('no causa memory leaks al montar y desmontar múltiples veces', () => {
      const { unmount, rerender } = render(<OAuthHandler />);
      
      // Primera renderización
      expect(Hub.listen).toHaveBeenCalledTimes(1);
      
      // Re-renderizar sin desmontar
      rerender(<OAuthHandler />);
      
      // No debería registrar un nuevo listener
      expect(Hub.listen).toHaveBeenCalledTimes(1);
      
      // Desmontar
      unmount();
      expect(mockHubUnsubscribe).toHaveBeenCalledTimes(1);
      
      // Montar nuevamente
      render(<OAuthHandler />);
      expect(Hub.listen).toHaveBeenCalledTimes(2);
    });

    it('mantiene la referencia del callback durante el ciclo de vida', () => {
      const { unmount } = render(<OAuthHandler />);
      
      const firstCallback = hubCallback;
      
      // Disparar evento
      firstCallback({
        payload: {
          event: 'signedIn',
          data: {},
        },
      });
      
      expect(logger.auth).toHaveBeenCalledWith(
        'User signed in successfully',
        'signedIn'
      );
      
      unmount();
      
      // El callback debería seguir siendo el mismo
      expect(hubCallback).toBe(firstCallback);
    });
  });
});
