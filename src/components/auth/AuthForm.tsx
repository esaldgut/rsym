'use client';

import { useState, useEffect } from 'react';
import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import YaanLogo from '../ui/YaanLogo';
import { SocialAuthButtons } from './SocialAuthButtons';
import {
  validateSignUpForm,
  validateSignInForm,
  validateForgotPasswordForm,
  validateResetPasswordForm,
  getPasswordStrength,
  hasErrors,
  type SignUpFormData,
  type SignInFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from '../../lib/auth-validation';

type AuthMode = 'signin' | 'signup' | 'confirm-signup' | 'forgot-password' | 'reset-password';

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('mode') as AuthMode) || 'signin';
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');

  // Form data states
  const [signUpData, setSignUpData] = useState<SignUpFormData>({
    email: '',
    given_name: '',
    family_name: '',
    password: '',
    confirm_password: '',
  });

  const [signInData, setSignInData] = useState<SignInFormData>({
    email: '',
    password: '',
  });

  const [forgotPasswordData, setForgotPasswordData] = useState<ForgotPasswordFormData>({
    email: '',
  });

  const [resetPasswordData, setResetPasswordData] = useState<ResetPasswordFormData>({
    email: '',
    confirmation_code: '',
    password: '',
    confirm_password: '',
  });

  const [confirmationCode, setConfirmationCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const inputCoreStyles = 'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300';

  const getInputClasses = (hasError: boolean) => {
    const errorClasses = 'border-red-300 bg-red-50 text-red-900 placeholder-red-400';
    const normalClasses = 'border-gray-300 bg-white text-gray-900 placeholder-gray-400';
    return `${inputCoreStyles} ${hasError ? errorClasses : normalClasses}`;
  };

  const getConfirmationInputClasses = (hasError: boolean) => {
    return `${getInputClasses(hasError)} text-center text-lg tracking-widest`;
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState({}, '', url.toString());
  }, [mode]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const errors = validateSignUpForm(signUpData);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      await signUp({
        username: signUpData.email,
        password: signUpData.password,
        options: {
          userAttributes: {
            email: signUpData.email,
            given_name: signUpData.given_name,
            family_name: signUpData.family_name,
          },
        },
      });

      setPendingEmail(signUpData.email);
      setSuccess('Te hemos enviado un código de confirmación a tu correo electrónico.');
      setMode('confirm-signup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const errors = validateSignInForm(signInData);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const { nextStep } = await signIn({
        username: signInData.email,
        password: signInData.password,
      });

      // Según la documentación oficial de Amplify v6
      if (nextStep.signInStep === 'DONE') {
        // Inicio de sesión exitoso - pequeña espera para asegurar que el estado se actualice
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        // Usuario no confirmado
        setPendingEmail(signInData.email);
        setError('Tu cuenta no está verificada. Te hemos enviado un nuevo código.');
        setMode('confirm-signup');
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        // Usuario necesita cambiar contraseña temporal
        setError('Debes cambiar tu contraseña temporal.');
        // TODO: Implementar flujo de cambio de contraseña
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE' || 
                 nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
        // MFA requerido
        setError('Se requiere autenticación de dos factores.');
        // TODO: Implementar flujo MFA
      } else {
        console.log('Paso de autenticación no manejado:', nextStep);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'UserNotConfirmedException') {
        setPendingEmail(signInData.email);
        setError('Tu cuenta no está verificada. Te hemos enviado un nuevo código.');
        setMode('confirm-signup');
      } else {
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!confirmationCode || confirmationCode.length !== 6) {
      setFieldErrors({ confirmationCode: 'Ingresa el código de 6 dígitos' });
      return;
    }

    setIsLoading(true);

    try {
      await confirmSignUp({
        username: pendingEmail,
        confirmationCode,
      });

      setSuccess('¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.');
      setMode('signin');
      setConfirmationCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const errors = validateForgotPasswordForm(forgotPasswordData);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({ username: forgotPasswordData.email });
      setPendingEmail(forgotPasswordData.email);
      setResetPasswordData(prev => ({ ...prev, email: forgotPasswordData.email }));
      setSuccess('Te hemos enviado un código para restablecer tu contraseña.');
      setMode('reset-password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar el restablecimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const errors = validateResetPasswordForm(resetPasswordData);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      await confirmResetPassword({
        username: resetPasswordData.email,
        confirmationCode: resetPasswordData.confirmation_code,
        newPassword: resetPasswordData.password,
      });

      setSuccess('Contraseña restablecida exitosamente. Ya puedes iniciar sesión.');
      setMode('signin');
      setResetPasswordData({
        email: '',
        confirmation_code: '',
        password: '',
        confirm_password: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = mode === 'signup' ? getPasswordStrength(signUpData.password) : 
                           mode === 'reset-password' ? getPasswordStrength(resetPasswordData.password) : 
                           { score: 0, feedback: '' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <YaanLogo 
              size="3xl" 
              variant="gradient-purple" 
              className="hover:scale-105 transition-transform duration-300" 
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'signin' && 'Bienvenido de vuelta'}
            {mode === 'signup' && 'Crea tu cuenta YAAN'}
            {mode === 'confirm-signup' && 'Verifica tu cuenta'}
            {mode === 'forgot-password' && 'Recuperar contraseña'}
            {mode === 'reset-password' && 'Nueva contraseña'}
          </h2>
          <p className="text-gray-600">
            {mode === 'signin' && 'Accede a tu cuenta para continuar'}
            {mode === 'signup' && 'Únete a la comunidad de viajeros'}
            {mode === 'confirm-signup' && 'Revisa tu correo e ingresa el código'}
            {mode === 'forgot-password' && 'Te enviaremos un código de recuperación'}
            {mode === 'reset-password' && 'Ingresa tu nueva contraseña'}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={signInData.email}
                    onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                    className={getInputClasses(!!fieldErrors.email)}
                    placeholder="ejemplo@correo.com"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={signInData.password}
                    onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                    className={getInputClasses(!!fieldErrors.password)}
                    placeholder="Ingresa tu contraseña"
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-sm text-pink-600 hover:text-pink-500 font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </form>

              <SocialAuthButtons onError={setError} />

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  ¿No tienes cuenta? <span className="text-pink-600 font-medium">Créala aquí</span>
                </button>
              </div>
            </>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="given_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      id="given_name"
                      type="text"
                      required
                      value={signUpData.given_name}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, given_name: e.target.value }))}
                      className={getInputClasses(!!fieldErrors.given_name)}
                      placeholder="Tu nombre"
                    />
                    {fieldErrors.given_name && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.given_name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="family_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido
                    </label>
                    <input
                      id="family_name"
                      type="text"
                      required
                      value={signUpData.family_name}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, family_name: e.target.value }))}
                      className={getInputClasses(!!fieldErrors.family_name)}
                      placeholder="Tu apellido"
                    />
                    {fieldErrors.family_name && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.family_name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={signUpData.email}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                    className={getInputClasses(!!fieldErrors.email)}
                    placeholder="ejemplo@correo.com"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    required
                    value={signUpData.password}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                    className={getInputClasses(!!fieldErrors.password)}
                    placeholder="Mínimo 8 caracteres"
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                  )}
                  {signUpData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Seguridad:</span>
                        <span className={`font-medium ${
                          passwordStrength.score <= 2 ? 'text-red-500' :
                          passwordStrength.score <= 4 ? 'text-yellow-500' : 
                          'text-green-500'
                        }`}>
                          {passwordStrength.feedback}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            passwordStrength.score <= 2 ? 'bg-red-500' :
                            passwordStrength.score <= 4 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    required
                    value={signUpData.confirm_password}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, confirm_password: e.target.value }))}
                    className={getInputClasses(!!fieldErrors.confirm_password)}
                    placeholder="Confirma tu contraseña"
                  />
                  {fieldErrors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.confirm_password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>

              <SocialAuthButtons onError={setError} />

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  ¿Ya tienes cuenta? <span className="text-pink-600 font-medium">Inicia sesión</span>
                </button>
              </div>
            </>
          )}

          {/* Confirm Sign Up Form */}
          {mode === 'confirm-signup' && (
            <form onSubmit={handleConfirmSignUp} className="space-y-4">
              <div>
                <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de confirmación
                </label>
                <input
                  id="confirmationCode"
                  type="text"
                  required
                  maxLength={6}
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
                  className={getConfirmationInputClasses(!!fieldErrors.confirmationCode)}
                  placeholder="000000"
                />
                {fieldErrors.confirmationCode && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmationCode}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Código enviado a {pendingEmail}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isLoading ? 'Verificando...' : 'Verificar cuenta'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotPasswordData.email}
                  onChange={(e) => setForgotPasswordData(prev => ({ ...prev, email: e.target.value }))}
                  className={getInputClasses(!!fieldErrors.email)}
                  placeholder="ejemplo@correo.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isLoading ? 'Solicitando código...' : 'Solicitar código'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de confirmación
                </label>
                <input
                  id="reset-code"
                  type="text"
                  required
                  maxLength={6}
                  value={resetPasswordData.confirmation_code}
                  onChange={(e) => setResetPasswordData(prev => ({ 
                    ...prev, 
                    confirmation_code: e.target.value.replace(/\D/g, '') 
                  }))}
                  className={getConfirmationInputClasses(!!fieldErrors.confirmation_code)}
                  placeholder="000000"
                />
                {fieldErrors.confirmation_code && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmation_code}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Código enviado a {pendingEmail}
                </p>
              </div>

              <div>
                <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva contraseña
                </label>
                <input
                  id="reset-password"
                  type="password"
                  required
                  value={resetPasswordData.password}
                  onChange={(e) => setResetPasswordData(prev => ({ ...prev, password: e.target.value }))}
                  className={getInputClasses(!!fieldErrors.password)}
                  placeholder="Mínimo 8 caracteres"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
                {resetPasswordData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Seguridad:</span>
                      <span className={`font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-500' :
                        passwordStrength.score <= 4 ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {passwordStrength.feedback}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 4 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  required
                  value={resetPasswordData.confirm_password}
                  onChange={(e) => setResetPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className={getInputClasses(!!fieldErrors.confirm_password)}
                  placeholder="Confirma tu nueva contraseña"
                />
                {fieldErrors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirm_password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Al continuar, aceptas nuestros{' '}
            <a href="/terms" className="text-pink-600 hover:text-pink-500 font-medium">
              Términos de Servicio
            </a>{' '}
            y{' '}
            <a href="/privacy" className="text-pink-600 hover:text-pink-500 font-medium">
              Política de Privacidad
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
