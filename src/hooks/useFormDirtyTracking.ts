'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook alternativo para tracking preciso de cambios usando dirty tracking
 * Opción 2: Marca campos individuales como modificados
 * Más eficiente para formularios grandes
 */

interface DirtyField {
  name: string;
  originalValue: any;
  currentValue: any;
  isDirty: boolean;
}

export function useFormDirtyTracking() {
  const [dirtyFields, setDirtyFields] = useState<Map<string, DirtyField>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const originalValues = useRef<Map<string, any>>(new Map());

  // Registrar valor original de un campo
  const registerField = useCallback((name: string, value: any) => {
    if (!originalValues.current.has(name)) {
      originalValues.current.set(name, value);
    }
  }, []);

  // Actualizar valor de un campo y marcar como dirty si cambió
  const updateField = useCallback((name: string, value: any) => {
    const originalValue = originalValues.current.get(name);
    const isDirty = originalValue !== value && 
                   JSON.stringify(originalValue) !== JSON.stringify(value);

    setDirtyFields(prev => {
      const newMap = new Map(prev);
      
      if (isDirty) {
        newMap.set(name, {
          name,
          originalValue,
          currentValue: value,
          isDirty: true
        });
      } else {
        newMap.delete(name);
      }
      
      return newMap;
    });

    setHasUnsavedChanges(isDirty || dirtyFields.size > 0);
  }, [dirtyFields.size]);

  // Resetear todos los campos a estado limpio
  const resetAllFields = useCallback(() => {
    setDirtyFields(new Map());
    setHasUnsavedChanges(false);
    originalValues.current.clear();
  }, []);

  // Resetear un campo específico
  const resetField = useCallback((name: string) => {
    setDirtyFields(prev => {
      const newMap = new Map(prev);
      newMap.delete(name);
      return newMap;
    });
    
    setHasUnsavedChanges(dirtyFields.size > 1);
  }, [dirtyFields.size]);

  // Obtener lista de campos modificados con detalles
  const getModifiedFieldsDetails = useCallback(() => {
    return Array.from(dirtyFields.values()).map(field => ({
      name: field.name,
      originalValue: field.originalValue,
      currentValue: field.currentValue,
      friendlyName: getFieldFriendlyName(field.name)
    }));
  }, [dirtyFields]);

  // Obtener nombres amigables para mostrar al usuario
  const getFieldFriendlyName = (fieldName: string): string => {
    const fieldNames: Record<string, string> = {
      profilePhotoPath: 'Foto de perfil',
      phone_number: 'Número de teléfono',
      birthdate: 'Fecha de nacimiento',
      preferred_username: 'Nombre de usuario',
      details: 'Descripción del perfil',
      have_a_passport: 'Pasaporte',
      have_a_Visa: 'Visa',
      proofOfTaxStatusPath: 'Constancia de Situación Fiscal',
      secturPath: 'Registro Nacional de Turismo',
      complianceOpinPath: 'Opinión de Cumplimiento',
      company_profile: 'Perfil de empresa',
      days_of_service: 'Horarios de servicio',
      locale: 'País',
      contact_information: 'Información de contacto',
      emgcy_details: 'Contacto de emergencia',
      uniq_influencer_ID: 'ID de influencer',
      social_media_plfms: 'Redes sociales',
      profilePreferences: 'Preferencias de viaje',
      address: 'Dirección',
      name: 'Nombre completo',
      banking_details: 'Datos bancarios',
      interest_rate: 'Tasa de interés',
      req_special_services: 'Servicios especiales',
      credentials: 'Credenciales'
    };

    return fieldNames[fieldName] || fieldName;
  };

  // Hook para prevenir navegación con beforeunload
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    hasUnsavedChanges,
    dirtyFields: Array.from(dirtyFields.values()),
    registerField,
    updateField,
    resetField,
    resetAllFields,
    getModifiedFieldsDetails,
    isDirty: (fieldName: string) => dirtyFields.has(fieldName)
  };
}