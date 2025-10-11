'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileCompletionState {
  isComplete: boolean;
  isLoading: boolean;
  userType: string | null;
  missingFields: string[];
}

interface ProfileCompletionContext {
  returnUrl: string;
  action: string;
  data?: any;
}

export function useProfileCompletion() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<ProfileCompletionState>({
    isComplete: false,
    isLoading: true,
    userType: null,
    missingFields: []
  });

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!isAuthenticated || !user) {
        setState({
          isComplete: false,
          isLoading: false,
          userType: null,
          missingFields: []
        });
        return;
      }

      try {
        const attributes = await fetchUserAttributes();
        const userType = attributes['custom:user_type'];
        
        // Verificar si tiene tipo de usuario definido
        if (!userType) {
          setState({
            isComplete: false,
            isLoading: false,
            userType: null,
            missingFields: ['user_type']
          });
          return;
        }

        // Verificar campos obligatorios comunes
        const missingFields: string[] = [];
        const requiredCommonFields = [
          'phone_number',
          'birthdate',
          'preferred_username',
          'custom:details'
        ];

        for (const field of requiredCommonFields) {
          if (!attributes[field]) {
            missingFields.push(field);
          }
        }

        // Verificar campos específicos por tipo
        if (userType === 'influencer') {
          if (!attributes['custom:uniq_influencer_ID']) {
            missingFields.push('uniq_influencer_ID');
          }
          if (!attributes['custom:social_media_plfms']) {
            missingFields.push('social_media_plfms');
          }
        }

        if (userType === 'provider') {
          const providerFields = [
            'custom:company_profile',
            'custom:days_of_service',
            'locale',
            'custom:contact_information'
          ];
          
          for (const field of providerFields) {
            if (!attributes[field]) {
              missingFields.push(field);
            }
          }
        }

        setState({
          isComplete: missingFields.length === 0,
          isLoading: false,
          userType: userType as string,
          missingFields
        });
      } catch (error) {
        console.error('Error verificando completitud del perfil:', error);
        setState({
          isComplete: false,
          isLoading: false,
          userType: null,
          missingFields: []
        });
      }
    };

    checkProfileCompletion();
  }, [isAuthenticated, user]);

  // Función para guardar contexto y redirigir a completar perfil
  const requireProfileCompletion = (context: ProfileCompletionContext) => {
    if (!state.isComplete && !state.isLoading) {
      // Guardar contexto en sessionStorage
      sessionStorage.setItem('profileCompleteReturnUrl', context.returnUrl);
      sessionStorage.setItem('profileCompleteAction', context.action);
      if (context.data) {
        sessionStorage.setItem('profileCompleteData', JSON.stringify(context.data));
      }
      
      // Redirigir a completar perfil
      router.push('/settings/profile');
      return true; // Indica que se requiere completar perfil
    }
    return false; // Perfil ya está completo
  };

  // Función para verificar y ejecutar acción
  const checkAndExecute = (
    action: () => void,
    context: ProfileCompletionContext
  ) => {
    if (!requireProfileCompletion(context)) {
      // Si el perfil está completo, ejecutar la acción
      action();
    }
  };

  return {
    ...state,
    requireProfileCompletion,
    checkAndExecute
  };
}