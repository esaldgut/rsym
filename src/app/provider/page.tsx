import { Suspense } from 'react';
import ProviderContent from './provider-content';

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  );
}

export default function ProviderPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProviderContent />
    </Suspense>
  );
}