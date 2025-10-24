'use client';

import React, { useEffect } from 'react';
import { signInWithOAuth, setupOAuthListeners } from '@/lib/auth/oauth-config';
import { useRouter } from 'next/navigation';

interface AppleSignInButtonProps {
  customState?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  className?: string;
}

/**
 * Botón de Sign in with Apple
 * Implementa el flujo OAuth con Apple usando las mejores prácticas
 */
export default function AppleSignInButton({
  customState,
  onSuccess,
  onError,
  className = '',
}: AppleSignInButtonProps) {
  const router = useRouter();

  useEffect(() => {
    // Configurar listeners para eventos OAuth
    const unsubscribe = setupOAuthListeners(
      () => {
        console.log('Apple Sign-In exitoso');
        onSuccess?.();
        // Redirigir a momentos después del login exitoso
        router.push('/moments');
      },
      (error) => {
        console.error('Apple Sign-In falló:', error);
        onError?.(error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [router, onSuccess, onError]);

  const handleAppleSignIn = async () => {
    try {
      await signInWithOAuth('Apple', customState);
    } catch (error) {
      console.error('Error iniciando Apple Sign-In:', error);
      onError?.(error);
    }
  };

  return (
    <button
      onClick={handleAppleSignIn}
      className={`
        flex items-center justify-center gap-3 w-full
        bg-black text-white hover:bg-gray-900
        px-4 py-3 rounded-lg font-medium
        transition-colors duration-200
        ${className}
      `}
      type="button"
      aria-label="Iniciar sesión con Apple"
    >
      <AppleIcon />
      <span>Iniciar sesión con Apple</span>
    </button>
  );
}

/**
 * Icono de Apple
 */
function AppleIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.54-2.08-.52-3.23 0-1.45.65-2.2.46-3.06-.35C3.44 15.98 4.07 9.24 8.91 9c1.24.05 2.1.68 2.82.68.72 0 2.07-.83 3.49-.73 1.42.1 2.71.68 3.56 1.73-3.26 1.94-2.79 6.94.72 8.29-.45 1.18-.99 2.34-1.99 3.31zM12.05 3.73c-.95 2.26-3.5 2.47-4.34.17C8.56 1.66 10.97.9 12.29 2c.96.82.76 1.73-.24 1.73z"/>
    </svg>
  );
}