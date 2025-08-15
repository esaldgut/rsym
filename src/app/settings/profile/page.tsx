import { AuthGuard } from '../../../components/guards/AuthGuard';
import ProfileSettingsClient from './profile-client';
import { runWithAmplifyServerContext } from '@/utils/amplify-server-utils';
import { fetchUserAttributes } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server Component que obtiene los datos del usuario antes de renderizar
 * Implementa las mejores prácticas de Next.js App Router con datos server-side
 */
export default async function ProfileSettingsPage() {
  // Obtener atributos del usuario desde el servidor
  const userAttributes = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        const attributes = await fetchUserAttributes(contextSpec);
        return attributes;
      } catch (error) {
        console.error('Error obteniendo atributos del servidor:', error);
        return null;
      }
    },
  });

  // Si no hay sesión, redirigir a signin
  if (!userAttributes) {
    redirect('/signin');
  }

  // Preparar los datos para el cliente
  const initialData = {
    userType: userAttributes['custom:user_type'] as 'traveler' | 'influencer' | 'provider' | undefined,
    phone_number: userAttributes.phone_number || '',
    birthdate: userAttributes.birthdate || '',
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

  return (
    <AuthGuard>
      <ProfileSettingsClient initialAttributes={initialData} />
    </AuthGuard>
  );
}