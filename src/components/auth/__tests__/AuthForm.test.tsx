/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthForm } from '../AuthForm';
import { useRouter, useSearchParams } from 'next/navigation';
import * as awsAmplify from 'aws-amplify/auth';

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
  signIn: jest.fn(),
  signUp: jest.fn(),
  confirmSignUp: jest.fn(),
  resetPassword: jest.fn(),
  confirmResetPassword: jest.fn(),
}));

// Mock YaanLogo component
jest.mock('../../ui/YaanLogo', () => ({
  __esModule: true,
  default: ({ size, variant, className }: any) => (
    <div data-testid="yaan-logo" data-size={size} data-variant={variant} className={className}>
      YAAN Logo
    </div>
  ),
}));

// Mock SocialAuthButtons component
jest.mock('../SocialAuthButtons', () => ({
  SocialAuthButtons: ({ onError }: any) => (
    <div data-testid="social-auth-buttons">
      <button onClick={() => onError && onError('Social auth error')}>
        Social Login
      </button>
    </div>
  ),
}));

// Mock auth validation
jest.mock('../../../lib/auth-validation', () => ({
  validateSignUpForm: jest.fn(() => ({})),
  validateSignInForm: jest.fn(() => ({})),
  validateForgotPasswordForm: jest.fn(() => ({})),
  validateResetPasswordForm: jest.fn(() => ({})),
  getPasswordStrength: jest.fn((password: string) => ({
    score: password.length >= 8 ? 5 : 2,
    feedback: password.length >= 8 ? 'Fuerte' : 'Débil',
  })),
  hasErrors: jest.fn((errors: any) => Object.keys(errors).length > 0),
}));

// ============================================================================
// TEST SETUP
// ============================================================================

const mockPush = jest.fn();
let mockSearchParams: URLSearchParams;

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset search params for each test
    mockSearchParams = new URLSearchParams();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup search params mock
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
    });

    // Mock window.history
    delete (window as any).history;
    (window as any).history = {
      replaceState: jest.fn(),
    };

    // Mock window.location
    delete (window as any).location;
    (window as any).location = {
      href: 'http://localhost:3000/auth',
    };
  });

  // ==========================================================================
  // 1. RENDERIZADO INICIAL
  // ==========================================================================

  describe('Renderizado Inicial', () => {
    it('renderiza el logo de YAAN', () => {
      render(<AuthForm />);
      
      const logo = screen.getByTestId('yaan-logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('data-size', '3xl');
      expect(logo).toHaveAttribute('data-variant', 'gradient-purple');
    });

    it('renderiza el formulario de inicio de sesión por defecto', () => {
      render(<AuthForm />);
      
      expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument();
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument();
    });

    it('renderiza los botones de autenticación social', () => {
      render(<AuthForm />);
      
      expect(screen.getByTestId('social-auth-buttons')).toBeInTheDocument();
    });

    it('renderiza el enlace a términos y política de privacidad', () => {
      render(<AuthForm />);
      
      expect(screen.getByText('Términos de Servicio')).toBeInTheDocument();
      expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
    });

    it('renderiza el enlace para crear cuenta', () => {
      render(<AuthForm />);
      
      expect(screen.getByText('¿No tienes cuenta?')).toBeInTheDocument();
      expect(screen.getByText('Créala aquí')).toBeInTheDocument();
    });

    it('renderiza el enlace de olvidé mi contraseña', () => {
      render(<AuthForm />);
      
      expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument();
    });

    it('carga el modo desde URL search params', () => {
      mockSearchParams.set('mode', 'signup');
      (useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => 'signup',
      });

      render(<AuthForm />);
      
      expect(screen.getByText('Crea tu cuenta YAAN')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 2. NAVEGACIÓN ENTRE MODOS
  // ==========================================================================

  describe('Navegación entre Modos', () => {
    it('cambia a modo registro al hacer clic en "Créala aquí"', () => {
      render(<AuthForm />);
      
      const createAccountLink = screen.getByText('Créala aquí');
      fireEvent.click(createAccountLink);
      
      expect(screen.getByText('Crea tu cuenta YAAN')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
      expect(screen.getByLabelText('Apellido')).toBeInTheDocument();
    });

    it('cambia a modo olvidé contraseña al hacer clic en el enlace', () => {
      render(<AuthForm />);
      
      const forgotPasswordLink = screen.getByText('¿Olvidaste tu contraseña?');
      fireEvent.click(forgotPasswordLink);
      
      expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
      expect(screen.getByText('Te enviaremos un código de recuperación')).toBeInTheDocument();
    });

    it('vuelve a inicio de sesión desde registro', () => {
      render(<AuthForm />);
      
      const createAccountLink = screen.getByText('Créala aquí');
      fireEvent.click(createAccountLink);
      
      const backToSignInLink = screen.getByText('Inicia sesión');
      fireEvent.click(backToSignInLink);
      
      expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument();
    });

    it('actualiza la URL cuando cambia el modo', async () => {
      render(<AuthForm />);
      
      const createAccountLink = screen.getByText('Créala aquí');
      fireEvent.click(createAccountLink);
      
      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalled();
      });
    });

    it('limpia mensajes al cambiar de modo', () => {
      render(<AuthForm />);
      
      // Simular un error (lo haremos después cuando probemos errores)
      const createAccountLink = screen.getByText('Créala aquí');
      fireEvent.click(createAccountLink);
      
      // No deben existir mensajes de error o éxito
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 3. FORMULARIO DE INICIO DE SESIÓN
  // ==========================================================================

  describe('Formulario de Inicio de Sesión', () => {
    it('permite ingresar email y contraseña', () => {
      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('Correo electrónico') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Contraseña') as HTMLInputElement;
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });

    it('deshabilita el botón mientras carga', async () => {
      (awsAmplify.signIn as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ nextStep: { signInStep: 'DONE' } }), 100))
      );

      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('Correo electrónico');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: /Iniciar sesión/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('inicia sesión exitosamente y redirige a /moments', async () => {
      (awsAmplify.signIn as jest.Mock).mockResolvedValue({
        nextStep: { signInStep: 'DONE' },
      });

      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('Correo electrónico');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: /Iniciar sesión/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(awsAmplify.signIn).toHaveBeenCalledWith({
          username: 'test@example.com',
          password: 'password123',
        });
      });

      // Esperar el timeout antes de verificar la redirección
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/moments');
      }, { timeout: 200 });
    });

    it('muestra error cuando las credenciales son incorrectas', async () => {
      (awsAmplify.signIn as jest.Mock).mockRejectedValue(
        new Error('Incorrect username or password')
      );

      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('Correo electrónico');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: /Iniciar sesión/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Incorrect username or password/i)).toBeInTheDocument();
      });
    });

    it('maneja nextStep CONFIRM_SIGN_UP', async () => {
      (awsAmplify.signIn as jest.Mock).mockResolvedValue({
        nextStep: { signInStep: 'CONFIRM_SIGN_UP' },
      });

      render(<AuthForm />);
      
      const emailInput = screen.getByLabelText('Correo electrónico');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: /Iniciar sesión/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Verifica tu cuenta')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 4. FORMULARIO DE REGISTRO
  // ==========================================================================

  describe('Formulario de Registro', () => {
    beforeEach(() => {
      render(<AuthForm />);
      const createAccountLink = screen.getByText('Créala aquí');
      fireEvent.click(createAccountLink);
    });

    it('renderiza todos los campos de registro', () => {
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
      expect(screen.getByLabelText('Apellido')).toBeInTheDocument();
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
    });

    it('permite ingresar todos los datos de registro', () => {
      const nameInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      const lastNameInput = screen.getByLabelText('Apellido') as HTMLInputElement;
      const emailInput = screen.getByLabelText('Correo electrónico') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Contraseña') as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText('Confirmar contraseña') as HTMLInputElement;
      
      fireEvent.change(nameInput, { target: { value: 'Juan' } });
      fireEvent.change(lastNameInput, { target: { value: 'Pérez' } });
      fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePass123!' } });
      
      expect(nameInput.value).toBe('Juan');
      expect(lastNameInput.value).toBe('Pérez');
      expect(emailInput.value).toBe('juan@example.com');
      expect(passwordInput.value).toBe('SecurePass123!');
      expect(confirmPasswordInput.value).toBe('SecurePass123!');
    });

    it('muestra indicador de fortaleza de contraseña', () => {
      const passwordInput = screen.getByLabelText('Contraseña');
      
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
      
      expect(screen.getByText('Seguridad:')).toBeInTheDocument();
      expect(screen.getByText('Fuerte')).toBeInTheDocument();
    });

    it('muestra error cuando el email ya existe', async () => {
      (awsAmplify.signUp as jest.Mock).mockRejectedValue(
        new Error('An account with the given email already exists')
      );

      const nameInput = screen.getByLabelText('Nombre');
      const lastNameInput = screen.getByLabelText('Apellido');
      const emailInput = screen.getByLabelText('Correo electrónico');
      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar contraseña');
      const submitButton = screen.getByRole('button', { name: /Crear cuenta/i });
      
      fireEvent.change(nameInput, { target: { value: 'Juan' } });
      fireEvent.change(lastNameInput, { target: { value: 'Pérez' } });
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePass123!' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/An account with the given email already exists/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 5. CONFIRMACIÓN DE CUENTA
  // ==========================================================================

  describe('Confirmación de Cuenta', () => {
    beforeEach(async () => {
      (awsAmplify.signUp as jest.Mock).mockResolvedValue({
        isSignUpComplete: false,
        nextStep: { signUpStep: 'CONFIRM_SIGN_UP' },
      });

      render(<AuthForm />);
      
      const createAccountLink = screen.getByText('Créala aquí');
      fireEvent.click(createAccountLink);

      const nameInput = screen.getByLabelText('Nombre');
      const lastNameInput = screen.getByLabelText('Apellido');
      const emailInput = screen.getByLabelText('Correo electrónico');
      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText('Confirmar contraseña');
      const submitButton = screen.getByRole('button', { name: /Crear cuenta/i });
      
      fireEvent.change(nameInput, { target: { value: 'Juan' } });
      fireEvent.change(lastNameInput, { target: { value: 'Pérez' } });
      fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Verifica tu cuenta')).toBeInTheDocument();
      });
    });

    it('renderiza el formulario de confirmación', () => {
      expect(screen.getByLabelText('Código de confirmación')).toBeInTheDocument();
      expect(screen.getByText(/Código enviado a/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Verificar cuenta/i })).toBeInTheDocument();
    });

    it('permite ingresar código de confirmación', () => {
      const codeInput = screen.getByLabelText('Código de confirmación') as HTMLInputElement;
      
      fireEvent.change(codeInput, { target: { value: '123456' } });
      
      expect(codeInput.value).toBe('123456');
    });

    it('solo acepta números en el código', () => {
      const codeInput = screen.getByLabelText('Código de confirmación') as HTMLInputElement;
      
      fireEvent.change(codeInput, { target: { value: 'abc123def' } });
      
      expect(codeInput.value).toBe('123');
    });

    it('muestra error cuando el código es inválido', async () => {
      (awsAmplify.confirmSignUp as jest.Mock).mockRejectedValue(
        new Error('Invalid verification code provided')
      );

      const codeInput = screen.getByLabelText('Código de confirmación');
      const submitButton = screen.getByRole('button', { name: /Verificar cuenta/i });
      
      fireEvent.change(codeInput, { target: { value: '999999' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid verification code provided/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 6. OLVIDÉ MI CONTRASEÑA
  // ==========================================================================

  describe('Olvidé mi Contraseña', () => {
    beforeEach(() => {
      render(<AuthForm />);
      const forgotPasswordLink = screen.getByText('¿Olvidaste tu contraseña?');
      fireEvent.click(forgotPasswordLink);
    });

    it('renderiza el formulario de recuperación', () => {
      expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Solicitar código/i })).toBeInTheDocument();
    });

    it('permite ingresar email', () => {
      const emailInput = screen.getByLabelText('Correo electrónico') as HTMLInputElement;
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('muestra error cuando el email no existe', async () => {
      (awsAmplify.resetPassword as jest.Mock).mockRejectedValue(
        new Error('User does not exist')
      );

      const emailInput = screen.getByLabelText('Correo electrónico');
      const submitButton = screen.getByRole('button', { name: /Solicitar código/i });
      
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/User does not exist/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 9. AUTENTICACIÓN SOCIAL
  // ==========================================================================

  describe('Autenticación Social', () => {
    it('renderiza botones de autenticación social en modo signin', () => {
      render(<AuthForm />);
      
      expect(screen.getByTestId('social-auth-buttons')).toBeInTheDocument();
    });

    it('renderiza botones de autenticación social en modo signup', () => {
      render(<AuthForm />);
      
      const createAccountLink = screen.getByText('Créala aquí');
      fireEvent.click(createAccountLink);
      
      expect(screen.getByTestId('social-auth-buttons')).toBeInTheDocument();
    });

    it('maneja errores de autenticación social', () => {
      render(<AuthForm />);
      
      const socialButton = screen.getByText('Social Login');
      fireEvent.click(socialButton);
      
      expect(screen.getByText('Social auth error')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 10. ACCESIBILIDAD
  // ==========================================================================

  describe('Accesibilidad', () => {
    it('todos los inputs tienen labels', () => {
      render(<AuthForm />);
      
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    });

    it('los botones tienen texto descriptivo', () => {
      render(<AuthForm />);
      
      expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument();
    });

    it('los enlaces tienen texto descriptivo', () => {
      render(<AuthForm />);
      
      expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument();
      expect(screen.getByText('Créala aquí')).toBeInTheDocument();
    });
  });
});
