'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAmplifyAuth } from '../../../hooks/useAmplifyAuth';
import { 
  updateUserProfile, 
  validateProfileData,
  type ProfileFormData,
} from '@/lib/auth/user-attributes';
import { uploadProfileImage } from '@/utils/storage-helpers';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { SocialMediaManager } from '@/components/profile/SocialMediaManager';
import { ServiceScheduleSelector } from '@/components/profile/ServiceScheduleSelector';
import { DocumentUploader } from '@/components/profile/DocumentUploader';
import { SettingsHero } from '@/components/ui/SettingsHero';

// Tipos para el formulario
type UserType = 'traveler' | 'influencer' | 'provider';

// Países disponibles para providers
const COUNTRIES = [
  { code: 'MX', name: 'México' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CA', name: 'Canadá' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'BZ', name: 'Belice' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panamá' },
];

interface ProfileSettingsClientProps {
  initialAttributes: Record<string, string | undefined>;
}

export default function ProfileSettingsClient({ initialAttributes }: ProfileSettingsClientProps) {
  const router = useRouter();
  const { user } = useAmplifyAuth();
  const [userType, setUserType] = useState<UserType | null>(initialAttributes.userType || null);
  const [step, setStep] = useState(initialAttributes.userType ? 2 : 1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  // Inicializar formData con los datos del servidor
  const [formData, setFormData] = useState<ProfileFormData>(() => {
    const data: ProfileFormData = {
      phone_number: initialAttributes.phone_number || '',
      birthdate: initialAttributes.birthdate || '',
      preferred_username: initialAttributes.preferred_username || '',
      details: initialAttributes['custom:details'] || '',
      profilePhotoPath: initialAttributes['custom:profilePhotoPath'] || undefined,
      have_a_passport: initialAttributes['custom:have_a_passport'] === 'true',
      have_a_Visa: initialAttributes['custom:have_a_Visa'] === 'true',
      
      // Campos de influencer
      uniq_influencer_ID: initialAttributes['custom:uniq_influencer_ID'] || '',
      social_media_plfms: initialAttributes['custom:social_media_plfms'] 
        ? JSON.parse(initialAttributes['custom:social_media_plfms']) 
        : [],
      
      // Campos de provider
      company_profile: initialAttributes['custom:company_profile'] || '',
      locale: initialAttributes.locale || 'MX',
      days_of_service: initialAttributes['custom:days_of_service']
        ? JSON.parse(initialAttributes['custom:days_of_service'])
        : [],
      contact_information: initialAttributes['custom:contact_information']
        ? JSON.parse(initialAttributes['custom:contact_information'])
        : { contact_name: '', contact_phone: '', contact_email: '' },
      emgcy_details: initialAttributes['custom:emgcy_details']
        ? JSON.parse(initialAttributes['custom:emgcy_details'])
        : { contact_name: '', contact_phone: '', contact_email: '' },
      
      // Documentos
      proofOfTaxStatusPath: initialAttributes['custom:proofOfTaxStatusPath']
        ? JSON.parse(initialAttributes['custom:proofOfTaxStatusPath'])
        : undefined,
      secturPath: initialAttributes['custom:secturPath']
        ? JSON.parse(initialAttributes['custom:secturPath'])
        : undefined,
      complianceOpinPath: initialAttributes['custom:complianceOpinPath']
        ? JSON.parse(initialAttributes['custom:complianceOpinPath'])
        : undefined,
      
      // Campos compartidos
      address: initialAttributes.address ? JSON.parse(initialAttributes.address) : {
        cp: '', c: '', ne: '', ni: '', col: '', mun: '', est: ''
      },
      name: initialAttributes.name || '',
      banking_details: initialAttributes['custom:banking_details'] || '',
      interest_rate: initialAttributes['custom:interest_rate'] || '',
      req_special_services: initialAttributes['custom:req_special_services'] === 'true',
      credentials: initialAttributes['custom:credentials'] || ''
    };
    
    console.log('📊 Datos iniciales cargados desde el servidor:', data);
    return data;
  });

  const handleSubmit = async () => {
    if (!userType) {
      console.error('❌ No hay userType definido');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Validar datos del formulario
      const validation = validateProfileData(userType, formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsLoading(false);
        return;
      }

      // Actualizar perfil usando el servicio
      await updateUserProfile(userType, formData);

      // Redirigir según el contexto de origen
      const returnUrl = sessionStorage.getItem('profileCompleteReturnUrl');
      
      if (returnUrl) {
        sessionStorage.removeItem('profileCompleteReturnUrl');
        sessionStorage.removeItem('profileCompleteAction');
        sessionStorage.removeItem('profileCompleteData');
        router.push(returnUrl);
      } else {
        router.push('/profile');
      }
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      setErrors({ general: 'Error al guardar el perfil. Por favor intenta de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof ProfileFormData, value: string | boolean | object) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedFormData = (field: keyof ProfileFormData, nestedField: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as Record<string, string>),
        [nestedField]: value
      }
    }));
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const imagePath = await uploadProfileImage(file);
      updateFormData('profilePhotoPath', imagePath);
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setErrors({ profilePhoto: 'Error al subir la imagen. Intenta de nuevo.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Renderizar selección de tipo de usuario
  if (step === 1) {
    return (
      <div className="min-h-screen">
        <SettingsHero 
          title="🎆 Elige tu perfil YAAN"
          subtitle="Selecciona el tipo de cuenta que mejor se adapte a tu estilo de viajar"
        />
        
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-4xl mx-auto px-4 py-12">

            <div className="grid md:grid-cols-3 gap-8">
              {/* Viajero */}
              <button
                onClick={() => {
                  setUserType('traveler');
                  setStep(2);
                }}
                className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 text-left group transform hover:scale-105"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Viajero Común</h3>
                <p className="text-gray-600 leading-relaxed">
                  Explora destinos increíbles, comparte tus experiencias y conecta con otros aventureros
                </p>
                <div className="mt-4 flex items-center text-blue-600 font-medium">
                  <span>Empezar aventura</span>
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Influencer */}
              <button
                onClick={() => {
                  setUserType('influencer');
                  setStep(2);
                }}
                className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl hover:border-pink-200 transition-all duration-300 text-left group transform hover:scale-105"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:from-pink-600 group-hover:to-purple-700 transition-all duration-300 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Viajero Influencer</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monetiza tu contenido, colabora con marcas y construye tu comunidad de viajeros
                </p>
                <div className="mt-4 flex items-center text-pink-600 font-medium">
                  <span>Crear contenido</span>
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Proveedor */}
              <button
                onClick={() => {
                  setUserType('provider');
                  setStep(2);
                }}
                className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl hover:border-purple-200 transition-all duration-300 text-left group transform hover:scale-105"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:from-purple-600 group-hover:to-indigo-700 transition-all duration-300 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Proveedor de Experiencias</h3>
                <p className="text-gray-600 leading-relaxed">
                  Ofrece tours, experiencias y servicios turísticos únicos para viajeros
                </p>
                <div className="mt-4 flex items-center text-purple-600 font-medium">
                  <span>Ofrecer servicios</span>
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar formulario principal  
  const getUserTypeConfig = () => {
    switch(userType) {
      case 'traveler':
        return { emoji: '🌍', title: 'Viajero Común', color: 'blue' };
      case 'influencer':
        return { emoji: '📸', title: 'Viajero Influencer', color: 'pink' };
      case 'provider':
        return { emoji: '', title: 'Proveedor de Experiencias', color: 'purple' };
      default:
        return { emoji: '⚙️', title: 'Configuración', color: 'gray' };
    }
  };
  
  const config = getUserTypeConfig();
  
  return (
    <div className="min-h-screen">
      <SettingsHero 
        title={`${config.emoji} ${config.title}`}
        subtitle="Completa tu información para potenciar tu experiencia en YAAN"
      >
        <button
          onClick={() => setStep(1)}
          className="text-white/90 hover:text-white mb-4 inline-flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cambiar tipo de cuenta
        </button>
      </SettingsHero>
      
      <div className="bg-gray-50 -mt-8 relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form className="space-y-8">
            {/* Foto de perfil */}
            <div className="text-center">
              <div className="relative inline-block">
                <ProfileImage
                  path={formData.profilePhotoPath}
                  alt="Foto de perfil del usuario"
                  className="w-32 h-32"
                  fallbackText={user?.signInDetails?.loginId?.charAt(0).toUpperCase() || 'U'}
                />
                <label className="absolute bottom-0 right-0 bg-pink-500 text-white rounded-full p-2 cursor-pointer hover:bg-pink-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {isUploading && (
                <p className="text-sm text-gray-500 mt-2">Subiendo imagen...</p>
              )}
              {errors.profilePhoto && (
                <p className="text-sm text-red-600 mt-2">{errors.profilePhoto}</p>
              )}
            </div>

            {/* Campos comunes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone_number || ''}
                  onChange={(e) => updateFormData('phone_number', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="+52 555 123 4567"
                />
                {errors.phone_number && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de nacimiento *
                </label>
                <input
                  type="date"
                  value={formData.birthdate || ''}
                  onChange={(e) => updateFormData('birthdate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                {errors.birthdate && (
                  <p className="text-sm text-red-600 mt-1">{errors.birthdate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de usuario *
              </label>
              <input
                type="text"
                value={formData.preferred_username || ''}
                onChange={(e) => updateFormData('preferred_username', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="@tunombre"
              />
              {errors.preferred_username && (
                <p className="text-sm text-red-600 mt-1">{errors.preferred_username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del perfil *
              </label>
              <textarea
                value={formData.details || ''}
                onChange={(e) => updateFormData('details', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Cuéntanos sobre ti, tus intereses de viaje..."
              />
              {errors.details && (
                <p className="text-sm text-red-600 mt-1">{errors.details}</p>
              )}
            </div>

            {/* Checkboxes para documentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.have_a_passport || false}
                  onChange={(e) => updateFormData('have_a_passport', e.target.checked)}
                  className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Tengo pasaporte</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.have_a_Visa || false}
                  onChange={(e) => updateFormData('have_a_Visa', e.target.checked)}
                  className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Tengo visa</span>
              </label>
            </div>

            {/* Campos específicos de Influencer */}
            {userType === 'influencer' && (
              <div className="space-y-6 bg-pink-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-pink-200 pb-2">
                  Información de Influencer
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID único de influencer *
                  </label>
                  <input
                    type="text"
                    value={formData.uniq_influencer_ID || ''}
                    onChange={(e) => updateFormData('uniq_influencer_ID', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Tu ID único como influencer"
                  />
                  {errors.uniq_influencer_ID && (
                    <p className="text-sm text-red-600 mt-1">{errors.uniq_influencer_ID}</p>
                  )}
                </div>

                <SocialMediaManager
                  platforms={formData.social_media_plfms || []}
                  onChange={(platforms) => updateFormData('social_media_plfms', platforms)}
                />
                {errors.social_media_plfms && (
                  <p className="text-sm text-red-600 mt-1">{errors.social_media_plfms}</p>
                )}
              </div>
            )}

            {/* Campos específicos de Provider */}
            {userType === 'provider' && (
              <div className="space-y-6 bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-purple-200 pb-2">
                  Información de Proveedor
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Perfil de empresa *
                  </label>
                  <textarea
                    value={formData.company_profile || ''}
                    onChange={(e) => updateFormData('company_profile', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe tu empresa y servicios..."
                  />
                  {errors.company_profile && (
                    <p className="text-sm text-red-600 mt-1">{errors.company_profile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País de operación *
                  </label>
                  <select
                    value={formData.locale || 'MX'}
                    onChange={(e) => updateFormData('locale', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.locale && (
                    <p className="text-sm text-red-600 mt-1">{errors.locale}</p>
                  )}
                </div>

                <ServiceScheduleSelector
                  schedule={formData.days_of_service || []}
                  onChange={(schedule) => updateFormData('days_of_service', schedule)}
                />
                {errors.days_of_service && (
                  <p className="text-sm text-red-600 mt-1">{errors.days_of_service}</p>
                )}

                {/* Información de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de contacto *
                    </label>
                    <input
                      type="text"
                      value={formData.contact_information?.contact_name || ''}
                      onChange={(e) => updateNestedFormData('contact_information', 'contact_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {errors.contact_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.contact_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de contacto *
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_information?.contact_phone || ''}
                      onChange={(e) => updateNestedFormData('contact_information', 'contact_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {errors.contact_phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.contact_phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de contacto *
                    </label>
                    <input
                      type="email"
                      value={formData.contact_information?.contact_email || ''}
                      onChange={(e) => updateNestedFormData('contact_information', 'contact_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {errors.contact_email && (
                      <p className="text-sm text-red-600 mt-1">{errors.contact_email}</p>
                    )}
                  </div>
                </div>

                {/* Contacto de emergencia */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Contacto de Emergencia</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={formData.emgcy_details?.contact_name || ''}
                      onChange={(e) => updateNestedFormData('emgcy_details', 'contact_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={formData.emgcy_details?.contact_phone || ''}
                      onChange={(e) => updateNestedFormData('emgcy_details', 'contact_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.emgcy_details?.contact_email || ''}
                      onChange={(e) => updateNestedFormData('emgcy_details', 'contact_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Documentos obligatorios */}
                <div className="space-y-6">
                  <h4 className="text-md font-medium text-gray-900">Documentos Obligatorios</h4>
                  
                  <DocumentUploader
                    label="Constancia de Situación Fiscal"
                    description="Documento que acredite tu situación fiscal actualizada"
                    value={formData.proofOfTaxStatusPath}
                    onChange={(doc) => updateFormData('proofOfTaxStatusPath', doc)}
                    required
                  />

                  <DocumentUploader
                    label="Registro Nacional de Turismo"
                    description="Registro SECTUR que acredite tu actividad turística"
                    value={formData.secturPath}
                    onChange={(doc) => updateFormData('secturPath', doc)}
                    required
                  />

                  <DocumentUploader
                    label="Opinión de Cumplimiento"
                    description="Documento de cumplimiento de obligaciones fiscales"
                    value={formData.complianceOpinPath}
                    onChange={(doc) => updateFormData('complianceOpinPath', doc)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Errores generales */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </div>
                ) : 'Guardar Perfil ✨'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
