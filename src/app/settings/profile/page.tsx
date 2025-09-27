import ProfileSettingsClient from './profile-client';
import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import { runWithAmplifyServerContext } from '@/utils/amplify-server-utils';
import { fetchUserAttributes } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fixDoubleEncodedAttributes } from '@/utils/json-parsing-safe';
import { cognitoDateToHTML } from '@/utils/date-format-helpers';

/**
 * Server Component que obtiene los datos del usuario antes de renderizar
 * Implementa las mejores prácticas de Next.js App Router con datos server-side
 */
export default async function ProfileSettingsPage() {
  // Proteger ruta con autenticación básica usando el patrón SSR
  await RouteProtectionWrapper.protectProfile();

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

  // Preparar los datos para el cliente
  const initialData = {
    userType: userAttributes['custom:user_type'] as 'traveler' | 'influencer' | 'provider' | undefined,
    phone_number: userAttributes.phone_number || '',
    birthdate: cognitoDateToHTML(userAttributes.birthdate), // Convertir DD/MM/YYYY a YYYY-MM-DD para input[type="date"]
    preferred_username: userAttributes.preferred_username || '',
    email: userAttributes.email || '',
    given_name: userAttributes.given_name || '',
    family_name: userAttributes.family_name || '',
    'custom:details': userAttributes['custom:details'] || '',
    'custom:profilePhotoPath': userAttributes['custom:profilePhotoPath'] || '',
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

  // Renderizar cliente con datos sanitizados
  // No necesitamos AuthGuard porque RouteProtectionWrapper ya validó la sesión
  return <ProfileSettingsClient initialAttributes={initialData} />;
}