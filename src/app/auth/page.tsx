'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthForm } from '../../components/auth/AuthForm';
import { AuthErrorBoundary } from '../../components/auth/AuthErrorBoundary';

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // If already authenticated, don't show the auth form
  if (isAuthenticated) {
    return null;
  }

  return (
    <AuthErrorBoundary>
      <AuthForm />
    </AuthErrorBoundary>
  );
}
