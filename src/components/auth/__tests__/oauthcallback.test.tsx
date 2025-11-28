/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OAuthCallback } from '../OAuthCallback';
import { useRouter, useSearchParams } from 'next/navigation';
import * as awsAmplify from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

// ============================================================================
// MOCKS
// ============================================================================

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock AWS Amplify auth
jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: jest.fn(),
  fetchUserAttributes: jest.fn(),
}));

// Mock Hub
jest.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: jest.fn(),
  },
}));

// ============================================================================
// TEST SETUP
// ============================================================================

const mockPush = jest.fn();
const mockSearchParams = {
  get: jest.fn(),
};
const mockHubUnsubscribe = jest.fn();

describe('OAuthCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup search params mock
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    // Setup Hub mock
    (Hub.listen as jest.Mock).mockReturnValue(mockHubUnsubscribe);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ==========================================================================
  // 1. RENDERIZADO INICIAL
  // ==========================================================================

  describe('Renderizado Inicial', () => {
    it('no renderiza nada si no hay parámetros de OAuth', () => {
      mockSearchParams.get.mockReturnValue(null);

      const { container } = render(<OAuthCallback />);
      
      expect(container.firstChild).toBeNull();
    });

    it('muestra spinner de carga', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      render(<OAuthCallback />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 3. AUTENTICACIÓN EXITOSA
  // ==========================================================================

  describe('Autenticación Exitosa', () => {
    it('procesa autenticación exitosa con código', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
        userId: 'user-123',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
      });

      render(<OAuthCallback />);

      // Avanzar el timeout inicial
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(awsAmplify.getCurrentUser).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(awsAmplify.fetchUserAttributes).toHaveBeenCalled();
      });
    });

    it('muestra mensaje de éxito', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      render(<OAuthCallback />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido a YAAN!')).toBeInTheDocument();
      });

      expect(screen.getByText(/¡Autenticación exitosa! Redirigiendo.../i)).toBeInTheDocument();
    });

    it('redirige a /profile por defecto después de éxito', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      render(<OAuthCallback />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido a YAAN!')).toBeInTheDocument();
      });

      // Avanzar el timeout de redirección
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile');
      });
    });

    it('redirige a URL personalizada si existe parámetro redirect', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        if (key === 'redirect') return '/dashboard';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      render(<OAuthCallback />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido a YAAN!')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('llama onSuccess callback cuando tiene éxito', async () => {
      const onSuccess = jest.fn();
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      render(<OAuthCallback onSuccess={onSuccess} />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('muestra icono de éxito', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      render(<OAuthCallback />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        const successIcon = document.querySelector('.bg-green-100');
        expect(successIcon).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 4. MANEJO DE ERRORES DE AUTENTICACIÓN
  // ==========================================================================

  describe('Manejo de Errores de Autenticación', () => {
    it('maneja error cuando getCurrentUser falla', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockRejectedValue(
        new Error('User not authenticated')
      );

      render(<OAuthCallback />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('Error de autenticación')).toBeInTheDocument();
      });

      expect(screen.getByText('User not authenticated')).toBeInTheDocument();
    });

    it('maneja error cuando fetchUserAttributes falla', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockRejectedValue(
        new Error('Cannot fetch attributes')
      );

      render(<OAuthCallback />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('Error de autenticación')).toBeInTheDocument();
      });
    });

    it('muestra error genérico para errores no identificados', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockRejectedValue('Unknown error');

      const onError = jest.fn();
      render(<OAuthCallback onError={onError} />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Error en la autenticación social');
      });
    });

    it('muestra icono de error', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockRejectedValue(
        new Error('Auth failed')
      );

      render(<OAuthCallback />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        const errorIcon = document.querySelector('.bg-red-100');
        expect(errorIcon).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 5. HUB EVENTS
  // ==========================================================================

  describe('Hub Events', () => {
    it('registra listener de Hub al montar', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      render(<OAuthCallback />);

      expect(Hub.listen).toHaveBeenCalledWith('auth', expect.any(Function));
    });

    it('desregistra listener de Hub al desmontar', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      const { unmount } = render(<OAuthCallback />);

      unmount();

      expect(mockHubUnsubscribe).toHaveBeenCalled();
    });

    it('maneja evento signInWithRedirect del Hub', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      let hubCallback: any;
      (Hub.listen as jest.Mock).mockImplementation((channel, callback) => {
        hubCallback = callback;
        return mockHubUnsubscribe;
      });

      render(<OAuthCallback />);

      // Simular evento del Hub
      hubCallback({
        payload: {
          event: 'signInWithRedirect',
        },
      });

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(awsAmplify.getCurrentUser).toHaveBeenCalled();
      });
    });

    it('maneja evento signInWithRedirect_failure del Hub', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      const onError = jest.fn();

      let hubCallback: any;
      (Hub.listen as jest.Mock).mockImplementation((channel, callback) => {
        hubCallback = callback;
        return mockHubUnsubscribe;
      });

      render(<OAuthCallback onError={onError} />);

      // Simular evento de fallo del Hub
      hubCallback({
        payload: {
          event: 'signInWithRedirect_failure',
        },
      });

      expect(onError).toHaveBeenCalledWith('Error en la autenticación social');
    });
  });

  // ==========================================================================
  // 6. MENSAJES DE PROGRESO
  // ==========================================================================

  describe('Mensajes de Progreso', () => {

    it('actualiza mensaje durante verificación', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ username: 'test' }), 100))
      );

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      render(<OAuthCallback />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText(/Verificando autenticación.../i)).toBeInTheDocument();
      });
    });

    it('muestra mensaje al obtener perfil', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ email: 'test@example.com' }), 100))
      );

      render(<OAuthCallback />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText(/Obteniendo información del perfil.../i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 7. ESTILOS Y UI
  // ==========================================================================

  describe('Estilos y UI', () => {
    it('aplica overlay de pantalla completa durante procesamiento', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      render(<OAuthCallback />);

      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('bg-white', 'z-50');
    });

    it('centra el contenido', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      render(<OAuthCallback />);

      const container = document.querySelector('.flex.items-center.justify-center');
      expect(container).toBeInTheDocument();
    });

    it('aplica estilos de éxito correctos', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      render(<OAuthCallback />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        const successHeading = screen.getByText('¡Bienvenido a YAAN!');
        expect(successHeading).toHaveClass('text-green-900');
      });
    });
  });

  // ==========================================================================
  // 8. CALLBACKS OPCIONALES
  // ==========================================================================

  describe('Callbacks Opcionales', () => {
    it('funciona sin callbacks', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      // No debería lanzar error sin callbacks
      expect(() => render(<OAuthCallback />)).not.toThrow();

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido a YAAN!')).toBeInTheDocument();
      });
    });

    it('onSuccess es opcional', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      });

      (awsAmplify.getCurrentUser as jest.Mock).mockResolvedValue({
        username: 'test-user',
      });

      (awsAmplify.fetchUserAttributes as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      render(<OAuthCallback onError={jest.fn()} />);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido a YAAN!')).toBeInTheDocument();
      });
    });
  });
});
