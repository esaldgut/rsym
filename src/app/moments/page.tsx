import { Suspense } from 'react';
import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import { HeroSection } from '@/components/ui/HeroSection';
import { FeedContainer } from '@/components/feed/FeedContainer';
import { FeedSkeleton } from '@/components/feed/FeedSkeleton';
import { getMomentsAction } from '@/lib/server/moments-actions';

// Habilitar Partial Prerendering para combinar contenido estático y dinámico
export const experimental_ppr = true;

// Página de Momentos con SSR y cache optimization
export default async function MomentsPage() {
  // Validar autenticación básica (solo tener cuenta)
  await RouteProtectionWrapper.protectMoments();
  
  // Cargar momentos iniciales en el servidor con cache
  const initialData = await loadInitialMoments();
  
  return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - Contenido estático */}
        <HeroSection
          title="Momentos"
          subtitle="Comparte tus experiencias de viaje y conecta con otros aventureros"
          size="sm"
          showShapes={true}
        />
        
        {/* Feed Container - Contenido dinámico con Suspense */}
        <div className="relative -mt-8 z-10">
          <Suspense fallback={<FeedSkeleton />}>
            <FeedContainer 
              type="moments"
              initialPosts={initialData}
              showCreatePost={true}
            />
          </Suspense>
        </div>
      </div>
  );
}

// Función helper para cargar datos iniciales
async function loadInitialMoments() {
  try {
    const result = await getMomentsAction(20);
    return result.success ? result.moments : [];
  } catch (error) {
    console.error('Error loading initial moments:', error);
    return [];
  }
}