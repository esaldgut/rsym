import ProfileSettingsClient from './profile-client';
import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';
import { runWithAmplifyServerContext } from '@/utils/amplify-server-utils';
import { fetchUserAttributes } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fixDoubleEncodedAttributes } from '@/utils/json-parsing-safe';
import { cognitoDateToHTML } from '@/utils/date-format-helpers';
import { getProfileImageUrlServer } from '@/lib/server/storage-server-actions';

/**
 * Server Component que obtiene los datos del usuario antes de renderizar
 * Implementa las mejores prácticas de Next.js 15 App Router con datos server-side
 * Usa UnifiedAuthSystem para protección de rutas
 *
 * @param searchParams - Query parameters de la URL (opcional: callbackUrl para redirección post-guardado)
 */
export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Proteger ruta con autenticación usando UnifiedAuthSystem
  // Solo requiere autenticación básica ya que cualquier usuario puede editar su perfil
  const authResult = await UnifiedAuthSystem.requireAuthentication('/settings/profile');

  // Obtener atributos del usuario desde el servidor con manejo seguro
  const userAttributes = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        const attributes = await fetchUserAttributes(contextSpec);

        // Sanitizar atributos con doble encoding si existen
        const sanitizedAttributes = fixDoubleEncodedAttributes(attributes);

        return sanitizedAttributes;
      } catch (error) {
        console.error('Error obteniendo atributos del servidor:', error);

        // Si hay error al obtener atributos, la sesión es inválida
        // Redirigir a auth siguiendo el patrón de protección de rutas
        return null;
      }
    },
  });

  // Si no hay atributos válidos, redirigir a auth
  // RouteProtectionWrapper ya manejó la autenticación básica,
  // pero si fetchUserAttributes falla, la sesión está corrupta
  if (!userAttributes) {
    redirect('/auth?error=session_corrupted');
  }

  // Generar URL pre-firmada server-side para la imagen de perfil
  // Esto previene el error "Credentials should not be empty" que ocurre
  // cuando el Client Component intenta usar APIs client-side
  const profilePhotoPath = userAttributes['custom:profilePhotoPath'] || '';
  const profilePhotoUrl = profilePhotoPath
    ? await getProfileImageUrlServer(profilePhotoPath)
    : null;

  console.log('🖼️ [Profile Settings Page] URL de imagen generada server-side:', {
    hasPath: !!profilePhotoPath,
    hasUrl: !!profilePhotoUrl,
    path: profilePhotoPath
  });

  // Preparar los datos para el cliente
  // Usar el userType del authResult que ya fue validado por UnifiedAuthSystem
  const initialData = {
    'custom:user_type': authResult.user?.userType || userAttributes['custom:user_type'] as 'traveler' | 'influencer' | 'provider' | undefined,
    userId: authResult.user?.id || '',
    email: authResult.user?.email || userAttributes.email || '',
    username: authResult.user?.username || '',
    isProviderApproved: authResult.permissions?.isApproved || false,
    phone_number: userAttributes.phone_number || '',
    birthdate: cognitoDateToHTML(userAttributes.birthdate), // Convertir DD/MM/YYYY a YYYY-MM-DD para input[type="date"]
    preferred_username: userAttributes.preferred_username || '',
    given_name: userAttributes.given_name || '',
    family_name: userAttributes.family_name || '',
    'custom:details': userAttributes['custom:details'] || '',
    'custom:profilePhotoPath': profilePhotoPath,
    'custom:profilePhotoUrl': profilePhotoUrl || undefined, // Nueva URL pre-firmada
    'custom:have_a_passport': userAttributes['custom:have_a_passport'] || 'false',
    'custom:have_a_Visa': userAttributes['custom:have_a_Visa'] || 'false',
    'custom:uniq_influencer_ID': userAttributes['custom:uniq_influencer_ID'] || '',
    'custom:social_media_plfms': userAttributes['custom:social_media_plfms'] || '',
    'custom:profilePreferences': userAttributes['custom:profilePreferences'] || '',
    'custom:company_profile': userAttributes['custom:company_profile'] || '',
    'custom:days_of_service': userAttributes['custom:days_of_service'] || '',
    'custom:contact_information': userAttributes['custom:contact_information'] || '',
    'custom:emgcy_details': userAttributes['custom:emgcy_details'] || '',
    'custom:proofOfTaxStatusPath': userAttributes['custom:proofOfTaxStatusPath'] || '',
    'custom:secturPath': userAttributes['custom:secturPath'] || '',
    'custom:complianceOpinPath': userAttributes['custom:complianceOpinPath'] || '',
    locale: userAttributes.locale || 'MX',
    address: userAttributes.address || '',
    name: userAttributes.name || '',
    'custom:banking_details': userAttributes['custom:banking_details'] || '',
    'custom:interest_rate': userAttributes['custom:interest_rate'] || '',
    'custom:req_special_services': userAttributes['custom:req_special_services'] || 'false',
    'custom:credentials': userAttributes['custom:credentials'] || '',
  };

  // Extraer callbackUrl de searchParams si existe
  // Este parámetro se usa cuando el usuario es redirigido a completar su perfil
  // antes de realizar una acción (ej: reservar un producto)
  const callbackUrl = searchParams?.callbackUrl as string | undefined;

  console.log('🔗 [Profile Settings Page] Callback URL detectada:', {
    hasCallbackUrl: !!callbackUrl,
    callbackUrl
  });

  // Renderizar cliente con datos sanitizados
  // UnifiedAuthSystem ya validó la sesión y permisos
  // Los datos vienen del servidor, evitando llamadas duplicadas al cliente
  return <ProfileSettingsClient initialAttributes={initialData} callbackUrl={callbackUrl} />;
}