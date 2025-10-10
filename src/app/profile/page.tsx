import ProfileViewClient from './ProfileViewClient';
import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';
import { runWithAmplifyServerContext } from '@/utils/amplify-server-utils';
import { fetchUserAttributes } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getProfileStats } from '@/lib/server/profile-actions';

/**
 * Server Component para la página de perfil
 * Obtiene todos los datos del usuario en el servidor
 * Implementa SSR con el patrón establecido en /settings/profile
 */
export default async function ProfilePage() {
  // Proteger ruta requiriendo autenticación
  const authResult = await UnifiedAuthSystem.requireAuthentication('/profile');

  if (!authResult.isAuthenticated || !authResult.user) {
    redirect('/auth?callbackUrl=/profile');
  }

  // Obtener atributos del usuario desde el servidor
  const userAttributes = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        const attributes = await fetchUserAttributes(contextSpec);
        return attributes;
      } catch (error) {
        console.error('Error obteniendo atributos del perfil:', error);
        return null;
      }
    },
  });

  // Si no hay atributos válidos, redirigir
  if (!userAttributes) {
    redirect('/auth?error=session_expired&callbackUrl=/profile');
  }

  // Verificar si el provider está aprobado
  const providerApprovalAttr = userAttributes['custom:provider_is_approved'];
  const isProviderApproved = providerApprovalAttr === 'true' || providerApprovalAttr === true;

  // Verificar completitud del perfil (reutilizando la lógica de useProfileCompletion)
  const requiredFields = ['given_name', 'family_name', 'email'];
  const missingFields = requiredFields.filter(field => !userAttributes[field]);
  const isProfileComplete = missingFields.length === 0;

  // Obtener estadísticas reales del usuario desde GraphQL
  const profileStats = await getProfileStats(authResult.user.id);

  // Preparar datos para el cliente
  const profileData = {
    username: authResult.user.username || '',
    email: userAttributes.email || '',
    givenName: userAttributes.given_name || '',
    familyName: userAttributes.family_name || '',
    profilePhotoPath: userAttributes['custom:profilePhotoPath'] || undefined,
    preferredUsername: userAttributes.preferred_username || authResult.user.username,
    details: userAttributes['custom:details'] || undefined,
    website: userAttributes.website || undefined,
    userType: (userAttributes['custom:user_type'] as 'traveler' | 'influencer' | 'provider') || 'traveler',
    isProviderApproved: isProviderApproved,
    isProfileComplete: isProfileComplete,
    missingFields: missingFields,
    // Estadísticas reales obtenidas desde GraphQL
    stats: {
      posts: profileStats.posts,
      followers: profileStats.followers,
      following: profileStats.following,
      likes: profileStats.likes
    }
  };

  // Renderizar cliente con datos del servidor
  // No necesitamos AuthGuard porque UnifiedAuthSystem ya validó la sesión
  return <ProfileViewClient initialData={profileData} />;
}