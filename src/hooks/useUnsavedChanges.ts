'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

/**
 * Hook para detectar cambios no guardados con dos estrategias de validación
 * Opción 1: Deep comparison - Compara el estado actual con el inicial
 * Opción 2: Dirty tracking - Marca campos modificados individualmente
 */

interface UseUnsavedChangesOptions {
  strategy?: 'deep-compare' | 'dirty-tracking';
  enabled?: boolean;
  message?: string;
  beforeUnloadMessage?: string;
  initialData?: any;
}

export function useUnsavedChanges(
  currentData: any,
  options: UseUnsavedChangesOptions = {}
) {
  const {
    strategy = 'deep-compare',
    enabled = true,
    message = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
    beforeUnloadMessage = 'Los cambios que no hayas guardado se perderán.',
    initialData: providedInitialData
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const initialData = useRef<any>(null);
  const dirtyFields = useRef<Set<string>>(new Set());
  const isFirstRender = useRef(true);

  // Opción 1: Deep Compare Strategy
  const deepCompare = useCallback((obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    
    if (!obj1 || !obj2) return false;
    
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj1 === obj2;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      
      // Ignorar campos que son funciones o undefined
      if (typeof obj1[key] === 'function' || typeof obj2[key] === 'function') continue;
      if (obj1[key] === undefined && obj2[key] === undefined) continue;
      
      if (!deepCompare(obj1[key], obj2[key])) return false;
    }

    return true;
  }, []);

  // Opción 2: Dirty Tracking Strategy
  const markFieldAsDirty = useCallback((fieldName: string) => {
    if (strategy === 'dirty-tracking') {
      dirtyFields.current.add(fieldName);
      setHasUnsavedChanges(dirtyFields.current.size > 0);
    }
  }, [strategy]);

  const markFieldAsClean = useCallback((fieldName: string) => {
    if (strategy === 'dirty-tracking') {
      dirtyFields.current.delete(fieldName);
      setHasUnsavedChanges(dirtyFields.current.size > 0);
    }
  }, [strategy]);

  const resetDirtyFields = useCallback(() => {
    dirtyFields.current.clear();
    setHasUnsavedChanges(false);
  }, []);

  // Guardar datos iniciales en el primer render
  useEffect(() => {
    if (isFirstRender.current) {
      const dataToSave = providedInitialData || currentData;
      if (dataToSave) {
        console.log('📌 Guardando datos iniciales:', dataToSave);
        initialData.current = JSON.parse(JSON.stringify(dataToSave));
        isFirstRender.current = false;
      }
    }
  }, [currentData, providedInitialData]);

  // Detectar cambios según la estrategia
  useEffect(() => {
    if (!enabled || !initialData.current) {
      console.log('⚠️ Saliendo temprano:', { enabled, hasInitialData: !!initialData.current });
      return;
    }

    if (strategy === 'deep-compare') {
      const hasChanges = !deepCompare(currentData, initialData.current);
      console.log('🔄 Comparación profunda:', { 
        hasChanges, 
        currentData, 
        initialData: initialData.current 
      });
      setHasUnsavedChanges(hasChanges);
    }
    // Para dirty-tracking, los cambios se manejan con markFieldAsDirty/Clean
  }, [currentData, enabled, strategy, deepCompare]);

  // Prevenir navegación del navegador (refresh, cerrar pestaña)
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = beforeUnloadMessage;
      return beforeUnloadMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, enabled, beforeUnloadMessage]);

  // Interceptar navegación de Next.js
  const handleNavigation = useCallback((url: string) => {
    if (hasUnsavedChanges && enabled) {
      setPendingNavigation(url);
      setShowModal(true);
      return false; // Prevenir navegación
    }
    return true; // Permitir navegación
  }, [hasUnsavedChanges, enabled]);

  // Confirmar navegación
  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      resetDirtyFields();
      setHasUnsavedChanges(false);
      router.push(pendingNavigation);
      setPendingNavigation(null);
      setShowModal(false);
    }
  }, [pendingNavigation, router, resetDirtyFields]);

  // Cancelar navegación
  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
    setShowModal(false);
  }, []);

  // Resetear el estado inicial (después de guardar)
  const resetInitialData = useCallback(() => {
    initialData.current = JSON.parse(JSON.stringify(currentData));
    resetDirtyFields();
    setHasUnsavedChanges(false);
  }, [currentData, resetDirtyFields]);

  // Obtener lista de campos modificados
  const getModifiedFields = useCallback(() => {
    if (strategy === 'dirty-tracking') {
      return Array.from(dirtyFields.current);
    }
    
    if (strategy === 'deep-compare' && initialData.current) {
      const modified: string[] = [];
      const findDifferences = (obj1: any, obj2: any, path = '') => {
        Object.keys(obj1 || {}).forEach(key => {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof obj1[key] === 'object' && obj1[key] !== null) {
            findDifferences(obj1[key], obj2?.[key], currentPath);
          } else if (obj1[key] !== obj2?.[key]) {
            modified.push(currentPath);
          }
        });
      };
      findDifferences(currentData, initialData.current);
      return modified;
    }
    
    return [];
  }, [strategy, currentData]);

  return {
    hasUnsavedChanges,
    showModal,
    handleNavigation,
    confirmNavigation,
    cancelNavigation,
    resetInitialData,
    markFieldAsDirty,
    markFieldAsClean,
    resetDirtyFields,
    getModifiedFields,
    setShowModal
  };
}