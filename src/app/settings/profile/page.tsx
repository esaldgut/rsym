'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../../components/guards/AuthGuard';
import { useAmplifyAuth } from '../../../hooks/useAmplifyAuth';
import { updateUserAttributes, fetchUserAttributes } from 'aws-amplify/auth';
import { Preferences } from '@/utils/preferences';
import { uploadProfileImage } from '@/utils/storage-helpers';
import { ProfileImage } from '@/components/ui/ProfileImage';
import Image from 'next/image';

// Tipos para el formulario
type UserType = 'traveler' | 'influencer' | 'provider';

interface FormData {
  // Campos comunes
  profilePhotoPath?: string;
  phone_number: string;
  birthdate: string;
  preferred_username: string;
  details: string;
  have_a_passport: boolean;
  have_a_Visa: boolean;
  
  // Campos para influencer
  uniq_influencer_ID?: string;
  social_media_plfms?: Array<{
    name: string;
    target: string;
    socialMedia: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'linkedin' | 'youtube' | 'twitch';
  }>;
  profilePreferences?: string[];
  
  // Campos para provider
  company_profile?: string;
  days_of_service?: Array<{
    day: 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';
    sd: string;
    ed: string;
  }>;
  locale?: string;
  contact_information?: {
    contact_name: string;
    contact_phone: string;
    contact_email: string;
  };
  emgcy_details?: {
    contact_name: string;
    contact_phone: string;
    contact_email: string;
  };
  proofOfTaxStatusPath?: { uri: string; name: string };
  secturPath?: { uri: string; name: string };
  complianceOpinPath?: { uri: string; name: string };
  
  // Campos para provider e influencer
  address?: {
    cp: string;
    c: string;
    ne: string;
    ni?: string;
    col: string;
    mun: string;
    est: string;
  };
  name?: string;
  banking_details?: string;
  interest_rate?: string;
  req_special_services?: boolean;
  credentials?: string;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user } = useAmplifyAuth();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<FormData>({
    phone_number: '',
    birthdate: '',
    preferred_username: '',
    details: '',
    have_a_passport: false,
    have_a_Visa: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1); // 1: Selección de tipo, 2: Formulario

  // Cargar datos existentes del usuario
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const existingUserType = attributes['custom:user_type'] as UserType;
        
        if (existingUserType) {
          setUserType(existingUserType);
          setStep(2);
        }

        // Cargar datos existentes en el formulario
        setFormData(prev => ({
          ...prev,
          phone_number: attributes.phone_number || '',
          birthdate: attributes.birthdate || '',
          preferred_username: attributes.preferred_username || '',
          details: attributes['custom:details'] || '',
          have_a_passport: attributes['custom:have_a_passport'] === 'true',
          have_a_Visa: attributes['custom:have_a_Visa'] === 'true',
          profilePhotoPath: attributes['custom:profilePhotoPath'] || undefined,
        }));
      } catch (error) {
        console.error('Error cargando datos del usuario:', error);
      }
    };

    loadUserData();
  }, []);

  // Función para manejar la carga de imágenes
  const handleImageUpload = async (file: File) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      
      const path = await uploadProfileImage(file, user.userId, {
        accessLevel: 'protected',
        onProgress: (progress) => {
          console.log('Progreso de carga:', progress);
        }
      });

      if (path) {
        // Actualizar el estado local
        setFormData(prev => ({ ...prev, profilePhotoPath: path }));
        
        // Actualizar en Cognito inmediatamente
        await updateUserAttributes({
          userAttributes: {
            'custom:profilePhotoPath': path
          }
        });
      }

      return path;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setErrors(prev => ({ ...prev, profilePhoto: 'Error al subir la imagen' }));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones comunes
    if (!formData.phone_number) newErrors.phone_number = 'Teléfono es obligatorio';
    if (!formData.birthdate) newErrors.birthdate = 'Fecha de nacimiento es obligatoria';
    if (!formData.preferred_username) newErrors.preferred_username = 'Nombre de usuario es obligatorio';
    if (!formData.details) newErrors.details = 'Descripción es obligatoria';

    // Validaciones específicas por tipo
    if (userType === 'influencer') {
      if (!formData.uniq_influencer_ID) newErrors.uniq_influencer_ID = 'ID de influencer es obligatorio';
      if (!formData.social_media_plfms || formData.social_media_plfms.length === 0) {
        newErrors.social_media_plfms = 'Debes agregar al menos una red social';
      }
    }

    if (userType === 'provider') {
      if (!formData.company_profile) newErrors.company_profile = 'Perfil de empresa es obligatorio';
      if (!formData.days_of_service || formData.days_of_service.length === 0) {
        newErrors.days_of_service = 'Debes agregar horarios de servicio';
      }
      if (!formData.locale) newErrors.locale = 'País es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para guardar el perfil
  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updates: Record<string, string> = {
        'custom:user_type': userType!,
        phone_number: formData.phone_number,
        birthdate: formData.birthdate,
        preferred_username: formData.preferred_username,
        'custom:details': formData.details,
        'custom:have_a_passport': String(formData.have_a_passport),
        'custom:have_a_Visa': String(formData.have_a_Visa),
      };

      // Agregar campos específicos según el tipo
      if (userType === 'influencer') {
        updates['custom:uniq_influencer_ID'] = formData.uniq_influencer_ID!;
        updates['custom:social_media_plfms'] = JSON.stringify(formData.social_media_plfms || []);
        if (formData.profilePreferences) {
          updates['custom:profilePreferences'] = formData.profilePreferences.join(':');
        }
      }

      if (userType === 'provider') {
        updates['custom:company_profile'] = formData.company_profile!;
        updates['custom:days_of_service'] = JSON.stringify(formData.days_of_service || []);
        updates.locale = formData.locale!;
        if (formData.contact_information) {
          updates['custom:contact_information'] = JSON.stringify(formData.contact_information);
        }
        if (formData.emgcy_details) {
          updates['custom:emgcy_details'] = JSON.stringify(formData.emgcy_details);
        }
      }

      // Actualizar atributos en Cognito
      await updateUserAttributes({ userAttributes: updates });

      // Redirigir según el contexto de origen
      const returnUrl = sessionStorage.getItem('profileCompleteReturnUrl');
      if (returnUrl) {
        sessionStorage.removeItem('profileCompleteReturnUrl');
        router.push(returnUrl);
      } else {
        router.push('/profile');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setErrors({ general: 'Error al guardar el perfil. Por favor intenta de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar selección de tipo de usuario
  if (step === 1) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Completa tu perfil
              </h1>
              <p className="text-gray-600">
                Selecciona el tipo de cuenta que mejor se adapte a ti
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Viajero */}
              <button
                onClick={() => {
                  setUserType('traveler');
                  setStep(2);
                }}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left group"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Viajero Común</h3>
                <p className="text-gray-600 text-sm">
                  Explora destinos, comparte experiencias y conecta con otros viajeros
                </p>
              </button>

              {/* Influencer */}
              <button
                onClick={() => {
                  setUserType('influencer');
                  setStep(2);
                }}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left group"
              >
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors">
                  <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Viajero Influencer</h3>
                <p className="text-gray-600 text-sm">
                  Comparte tu contenido, monetiza tus viajes y colabora con marcas
                </p>
              </button>

              {/* Proveedor */}
              <button
                onClick={() => {
                  setUserType('provider');
                  setStep(2);
                }}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left group"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Proveedor de Experiencias</h3>
                <p className="text-gray-600 text-sm">
                  Ofrece servicios turísticos, crea paquetes y gestiona reservas
                </p>
              </button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Renderizar formulario según el tipo de usuario
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Completa tu perfil de {
                userType === 'traveler' ? 'Viajero' :
                userType === 'influencer' ? 'Influencer' :
                'Proveedor'
              }
            </h1>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {errors.general}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-6">
              {/* Foto de perfil */}
              <div className="flex items-center space-x-6">
                <ProfileImage
                  path={formData.profilePhotoPath}
                  alt="Foto de perfil"
                  fallbackText={user?.username?.substring(0, 2).toUpperCase() || 'U'}
                  size="lg"
                  accessLevel="protected"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto de perfil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleImageUpload(file);
                      }
                    }}
                    disabled={isLoading}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 disabled:opacity-50"
                  />
                  {errors.profilePhoto && (
                    <p className="mt-1 text-sm text-red-600">{errors.profilePhoto}</p>
                  )}
                </div>
              </div>

              {/* Campos comunes */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 ${
                      errors.phone_number ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+52 123 456 7890"
                  />
                  {errors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de nacimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthdate: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 ${
                      errors.birthdate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.birthdate && (
                    <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de usuario *
                </label>
                <input
                  type="text"
                  value={formData.preferred_username}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_username: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 ${
                    errors.preferred_username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="@tunombre"
                />
                {errors.preferred_username && (
                  <p className="mt-1 text-sm text-red-600">{errors.preferred_username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del perfil *
                </label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 ${
                    errors.details ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows={4}
                  placeholder="Cuéntanos sobre ti..."
                />
                {errors.details && (
                  <p className="mt-1 text-sm text-red-600">{errors.details}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.have_a_passport}
                    onChange={(e) => setFormData(prev => ({ ...prev, have_a_passport: e.target.checked }))}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Cuento con pasaporte</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.have_a_Visa}
                    onChange={(e) => setFormData(prev => ({ ...prev, have_a_Visa: e.target.checked }))}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Cuento con VISA</span>
                </label>
              </div>

              {/* Campos específicos para influencer */}
              {userType === 'influencer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID único de influencer *
                    </label>
                    <input
                      type="text"
                      value={formData.uniq_influencer_ID || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, uniq_influencer_ID: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 ${
                        errors.uniq_influencer_ID ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="INF-123456"
                    />
                    {errors.uniq_influencer_ID && (
                      <p className="mt-1 text-sm text-red-600">{errors.uniq_influencer_ID}</p>
                    )}
                  </div>

                  {/* TODO: Agregar componente para gestionar redes sociales */}
                  {/* TODO: Agregar selector de preferencias de viaje */}
                </>
              )}

              {/* Campos específicos para provider */}
              {userType === 'provider' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Perfil de la empresa *
                    </label>
                    <textarea
                      value={formData.company_profile || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_profile: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 ${
                        errors.company_profile ? 'border-red-300' : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="Describe tu empresa..."
                    />
                    {errors.company_profile && (
                      <p className="mt-1 text-sm text-red-600">{errors.company_profile}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País *
                    </label>
                    <select
                      value={formData.locale || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, locale: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 ${
                        errors.locale ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecciona un país</option>
                      <option value="MX">México</option>
                      <option value="US">Estados Unidos</option>
                      <option value="ES">España</option>
                      {/* Agregar más países según necesidad */}
                    </select>
                    {errors.locale && (
                      <p className="mt-1 text-sm text-red-600">{errors.locale}</p>
                    )}
                  </div>

                  {/* TODO: Agregar componente para horarios de servicio */}
                  {/* TODO: Agregar campos para información de contacto */}
                  {/* TODO: Agregar carga de documentos */}
                </>
              )}

              {/* Botones de acción */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Guardando...' : 'Guardar perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}