import { Suspense } from 'react';
import AuthContent from './auth-content';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthContent />
    </Suspense>
  );
}
