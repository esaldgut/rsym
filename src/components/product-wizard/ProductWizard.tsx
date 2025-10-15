'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { ProductFormProvider } from '@/context/ProductFormContext';
import { useProductForm } from '@/context/ProductFormContext';
import { getStepsForProductType } from './config/wizard-steps';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '@/components/ui/UnsavedChangesModal';
import { HeroSection } from '@/components/ui/HeroSection';
import { useRouter } from 'next/navigation';
import { toastManager } from '@/components/ui/Toast';
import ProductNameModal from './ProductNameModal';
import { RecoveryModal } from './RecoveryModal';
import { CancelProductModal } from './CancelProductModal';
import type { StepProps } from '@/types/wizard';
import type { Product } from '@/lib/graphql/types';
import type { ProductFormDataWithRecovery } from '@/types/wizard';

interface ProductWizardProps {
  userId: string;
  productType: 'circuit' | 'package';
  editMode?: boolean;
  initialProduct?: Product;
}

export default function ProductWizard({
  userId,
  productType,
  editMode = false,
  initialProduct
}: ProductWizardProps) {
  const steps = getStepsForProductType(productType);
  const [productId, setProductId] = useState<string | null>(initialProduct?.id || null);
  const [productName, setProductName] = useState<string>(initialProduct?.name || '');
  const [showModal, setShowModal] = useState<boolean | null>(null); // null = loading state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState<ProductFormDataWithRecovery | null>(null);

  // Detectar datos pendientes de recuperación al montar
  useEffect(() => {
    // Si es edit mode con initialProduct, no buscar recovery
    if (editMode && initialProduct) {
      console.log('🎯 Edit mode con initialProduct - no recovery check');
      setProductId(initialProduct.id);
      setProductName(initialProduct.name || '');
      setShowModal(false);
      return;
    }

    // Buscar datos de recovery en localStorage
    const checkForRecovery = () => {
      if (typeof window === 'undefined') return false;

      try {
        // Limpiar datos expirados (>7 días)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const keysToCheck = [`yaan-wizard-${productType}`, 'yaan-product-form-data'];

        for (const key of keysToCheck) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed._savedAt) {
              const savedTime = new Date(parsed._savedAt).getTime();
              if (savedTime < sevenDaysAgo) {
                console.log(`🗑️ Limpiando datos expirados (>7 días): ${key}`);
                localStorage.removeItem(key);
              }
            }
          }
        }

        // Buscar datos recientes para recovery (últimas 24 horas)
        const savedData = localStorage.getItem(`yaan-wizard-${productType}`);
        if (savedData) {
          const parsed = JSON.parse(savedData) as ProductFormDataWithRecovery;

          // Verificar que tenga metadata de recovery
          if (parsed._savedAt && parsed.productType === productType) {
            const savedTime = new Date(parsed._savedAt).getTime();
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

            // Si es reciente (últimas 24h), ofrecer recovery
            if (savedTime > twentyFourHoursAgo) {
              console.log('📦 Datos de recovery detectados:', {
                savedAt: parsed._savedAt,
                productName: parsed.name,
                productType: parsed.productType
              });
              setRecoveryData(parsed);
              setShowRecoveryModal(true);
              setShowModal(false);
              return true;
            }
          }
        }
      } catch (error) {
        console.warn('Error checking for recovery data:', error);
      }

      return false;
    };

    const hasRecovery = checkForRecovery();

    // Si no hay recovery y no es edit mode, mostrar modal de creación
    if (!hasRecovery) {
      setShowModal(true);
    }
  }, [productType, editMode, initialProduct]);

  const handleProductCreated = (newProductId: string, name: string) => {
    setProductId(newProductId);
    setProductName(name);
    setShowModal(false);
    
    // Guardar en localStorage
    localStorage.setItem('yaan-current-product-id', newProductId);
    localStorage.setItem('yaan-current-product-type', productType);
    localStorage.setItem('yaan-current-product-name', name);
    
    console.log('✅ Producto creado y guardado:', { 
      id: newProductId, 
      name, 
      type: productType 
    });
  };

  const handleError = (error: string) => {
    console.error('Error en creación de producto:', error);
    // El error ya se muestra en el toast desde el modal
  };

  // Handler para recuperar datos guardados
  const handleRecovery = () => {
    if (recoveryData) {
      console.log('✅ Recuperando datos guardados:', recoveryData);
      setProductId(recoveryData.productId);
      setProductName(recoveryData.name || '');
      setShowRecoveryModal(false);
      setShowModal(false);

      // Guardar en localStorage actual
      if (recoveryData.productId) {
        localStorage.setItem('yaan-current-product-id', recoveryData.productId);
        localStorage.setItem('yaan-current-product-type', productType);
        localStorage.setItem('yaan-current-product-name', recoveryData.name || '');
      }

      toastManager.show('✨ Datos recuperados exitosamente', 'success', 3000);
    }
  };

  // Handler para descartar datos de recovery
  const handleDiscardRecovery = () => {
    console.log('🗑️ Descartando datos de recovery');
    localStorage.removeItem(`yaan-wizard-${productType}`);
    localStorage.removeItem('yaan-product-form-data');
    setRecoveryData(null);
    setShowRecoveryModal(false);
    setShowModal(true);
    toastManager.show('Datos descartados', 'info', 2000);
  };

  // Handler para cancelar creación/edición
  const handleCancelProduct = () => {
    console.log('❌ Cancelando producto - limpiando datos');

    // Limpiar todo el localStorage relacionado
    localStorage.removeItem(`yaan-wizard-${productType}`);
    localStorage.removeItem('yaan-product-form-data');
    localStorage.removeItem('yaan-current-product-id');
    localStorage.removeItem('yaan-current-product-type');
    localStorage.removeItem('yaan-current-product-name');
    localStorage.removeItem('yaan-edit-product-data');

    setShowCancelModal(false);
    toastManager.show('Producto cancelado', 'info', 2000);

    // Redirigir al listado de productos
    window.location.href = '/provider/products';
  };

  return (
    <ProductFormProvider steps={steps} productType={productType} initialProduct={initialProduct}>
      <div className="bg-gray-50 pb-8">
        {/* Modal de captura de nombre - solo mostrar cuando showModal es true */}
        {showModal === true && (
          <ProductNameModal
            isOpen={true}
            productType={productType}
            onProductCreated={handleProductCreated}
            onError={handleError}
          />
        )}

        {/* Modal de recuperación de datos */}
        <RecoveryModal
          isOpen={showRecoveryModal}
          recoveryData={recoveryData}
          onRecover={handleRecovery}
          onDiscard={handleDiscardRecovery}
        />

        {/* Modal de cancelación */}
        <CancelProductModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelProduct}
          productName={productName}
          productType={productType}
        />

        {/* Contenido principal del wizard */}
        <div className={showModal === true ? 'blur-sm pointer-events-none' : ''}>
        {/* Hero Section estandarizado */}
        <HeroSection
          title={`${editMode ? 'Editar' : 'Crear'} ${productType === 'circuit' ? 'Circuito' : 'Paquete'} Turístico`}
          subtitle={editMode ? 'Actualiza los detalles de tu experiencia turística' : 'Comparte tu experiencia turística única con viajeros de todo el mundo'}
          size="sm"
          showShapes={true}
        />

        {/* Contenido del wizard - solo mostrar cuando no está en loading */}
        {showModal !== null && (
          <div className="relative -mt-8 z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <WizardContent
                userId={userId}
                productId={productId}
                productName={productName}
                productType={productType}
                onCancelClick={() => setShowCancelModal(true)}
              />
            </div>
          </div>
        )}

        {/* Loading state */}
        {showModal === null && (
          <div className="relative -mt-8 z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Verificando productos pendientes...</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </ProductFormProvider>
  );
}

function WizardContent({
  userId,
  productId,
  productName,
  productType,
  onCancelClick
}: {
  userId: string;
  productId: string | null;
  productName: string;
  productType: 'circuit' | 'package';
  onCancelClick: () => void;
}) {
  const router = useRouter();
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  const { 
    formData, 
    updateFormData,
    currentStepIndex, 
    steps, 
    navigateToStep,
    isLastStep,
    isFirstStep,
    initialFormData
  } = useProductForm();

  // Actualizar el context con productId y nombre cuando estén disponibles (solo una vez)
  useEffect(() => {
    if (productId && productName && !formData.productId) {
      // Intentar recuperar todo el formData del localStorage primero
      const savedFormData = localStorage.getItem('yaan-product-form-data');
      
      if (savedFormData) {
        try {
          const parsedFormData = JSON.parse(savedFormData);
          // Verificar que corresponda al producto actual
          if (parsedFormData.productId === productId && parsedFormData.productType === productType) {
            console.log('📝 Restaurando formData completo desde localStorage:', parsedFormData);
            updateFormData(parsedFormData);
            return; // Salir temprano si se restauró desde localStorage
          }
        } catch (error) {
          console.warn('⚠️ Error al parsear formData de localStorage:', error);
        }
      }
      
      // Fallback: solo actualizar productId y nombre si no hay formData completo
      console.log('📝 Actualizando contexto del wizard con datos básicos:', { 
        productId, 
        name: productName 
      });
      updateFormData({
        productId,
        name: productName
      });
    }
  }, [productId, productName, productType]);

  // Hook para detectar cambios no guardados
  const {
    hasUnsavedChanges,
    showModal,
    setShowModal,
    resetInitialData,
    getModifiedFields
  } = useUnsavedChanges(formData, {
    strategy: 'deep-compare',
    enabled: true,
    message: 'Tienes cambios sin guardar en tu producto turístico. ¿Deseas guardarlos antes de salir?',
    initialData: initialFormData
  });

  // Debug: Log para verificar el estado
  useEffect(() => {
    console.log('🔍 Debug ProductWizard:', {
      hasUnsavedChanges,
      formData,
      modifiedFields: getModifiedFields(),
      showModal
    });
  }, [hasUnsavedChanges, formData, showModal]);

  // Interceptar navegación cuando hay cambios sin guardar
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      console.log('🔗 Click detectado, hasUnsavedChanges:', hasUnsavedChanges);
      
      // Solo interceptar si hay cambios sin guardar
      if (!hasUnsavedChanges) {
        console.log('❌ No hay cambios sin guardar, permitiendo navegación');
        return;
      }
      
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.includes('#')) {
        const url = new URL(link.href);
        console.log('🔍 URL detectada:', url.pathname);
        
        // Interceptar navegación fuera de la creación de productos
        if (!url.pathname.includes('/provider/products/create')) {
          console.log('✅ Interceptando navegación, mostrando modal');
          e.preventDefault();
          setPendingNavigation(url.pathname);
          setShowModal(true);
        } else {
          console.log('➡️ Navegación dentro de create, permitida');
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [hasUnsavedChanges, setShowModal]);

  const currentStep = steps[currentStepIndex];
  const StepComponent = currentStep?.component;

  // Keyboard Navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'Tab':
          event.preventDefault();
          if (!isLastStep) {
            navigateToStep(currentStepIndex + 1);
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (!isFirstStep) {
            navigateToStep(currentStepIndex - 1);
          }
          break;
        case 'Home':
          event.preventDefault();
          navigateToStep(0);
          break;
        case 'End':
          event.preventDefault();
          navigateToStep(steps.length - 1);
          break;
        default:
          // Handle numeric keys (1, 2, 3, etc.)
          const num = parseInt(event.key);
          if (num >= 1 && num <= steps.length && num <= currentStepIndex + 1) {
            event.preventDefault();
            navigateToStep(num - 1);
          }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStepIndex, isLastStep, isFirstStep, navigateToStep, steps.length]);

  const handleNext = () => {
    if (!isLastStep) {
      navigateToStep(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      navigateToStep(currentStepIndex - 1);
    }
  };

  const stepProps: StepProps = {
    userId,
    onNext: handleNext,
    onPrevious: handlePrevious,
    isValid: true // TODO: Implementar validación en tiempo real
  };

  if (!StepComponent) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600">
          Error: Paso del wizard no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      {/* Progress Bar integrada - con overflow solo en el header */}
      <div className="overflow-hidden rounded-t-2xl">
        <WizardProgressBar
          steps={steps}
          currentStepIndex={currentStepIndex}
          productType={formData.productType}
          onCancelClick={onCancelClick}
        />
      </div>

      {/* Contenido del paso actual - sin overflow para permitir dropdowns */}
      <div className="p-6 sm:p-8 relative">
        {/* Keyboard Navigation Help */}
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-purple-800">Navegación rápida:</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-purple-600">
              <kbd className="px-2 py-1 bg-white rounded border border-purple-200 font-mono">←</kbd>
              <span>Anterior</span>
              <kbd className="px-2 py-1 bg-white rounded border border-purple-200 font-mono">→</kbd>
              <span>Siguiente</span>
              <kbd className="px-2 py-1 bg-white rounded border border-purple-200 font-mono">1-{steps.length}</kbd>
              <span>Ir a paso</span>
            </div>
          </div>
        </div>

        {/* Step Component */}
        <Suspense fallback={<StepSkeleton />}>
          <StepComponent {...stepProps} />
        </Suspense>
      </div>

      {/* Modal de cambios no guardados */}
      <UnsavedChangesModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setPendingNavigation(null);
        }}
        onDiscard={() => {
          // Descartar cambios y navegar
          if (pendingNavigation) {
            // Limpiar localStorage para este producto
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`yaan-wizard-${formData.productType}`);
            }
            resetInitialData();
            router.push(pendingNavigation);
          }
          setShowModal(false);
          setPendingNavigation(null);
        }}
        onSave={async () => {
          setShowModal(false);
          // Guardar en localStorage antes de navegar
          if (typeof window !== 'undefined') {
            localStorage.setItem(`yaan-wizard-${formData.productType}`, JSON.stringify(formData));
          }
          
          // Mostrar mensaje de éxito con toast profesional
          toastManager.show('✨ Tu progreso ha sido guardado exitosamente', 'success', 4000);
          
          if (pendingNavigation) {
            router.push(pendingNavigation);
            setPendingNavigation(null);
          }
        }}
        title="¿Abandonar creación del producto?"
        message="Tu producto turístico tiene cambios sin guardar. Estos cambios se perderán si sales sin guardar."
        modifiedFields={getModifiedFields()}
      />
    </div>
  );
}

// Componente para la barra de progreso
function WizardProgressBar({
  steps,
  currentStepIndex,
  productType,
  onCancelClick
}: {
  steps: Array<{ id: string; title: string; component: React.ComponentType<StepProps> }>;
  currentStepIndex: number;
  productType: 'circuit' | 'package';
  onCancelClick: () => void;
}) {
  const { navigateToStep } = useProductForm();

  return (
    <div className="border-b border-gray-200 pb-6">
      {/* Header simplificado */}
      <div className="px-6 sm:px-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {steps[currentStepIndex]?.title || 'Información General'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Paso {currentStepIndex + 1} de {steps.length}
            </p>
          </div>
          <div className="text-right flex items-center gap-3">
            {/* Botón Cancelar */}
            <button
              onClick={onCancelClick}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 border border-red-300 hover:border-red-400"
              title="Cancelar creación del producto"
            >
              Cancelar
            </button>
            {/* Progress Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% completado
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps - Simplificado */}
      <div className="relative">
        <div className="sm:hidden space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isClickable = index <= currentStepIndex;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <button
                  onClick={() => isClickable ? navigateToStep(index) : null}
                  disabled={!isClickable}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 flex-shrink-0
                    ${isCompleted 
                      ? 'bg-gradient-to-r from-green-400 to-green-500 border-green-500 text-white shadow-md' 
                      : isCurrent 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white shadow-md animate-pulse' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }
                    ${isClickable ? 'cursor-pointer hover:shadow-lg active:scale-95' : 'cursor-not-allowed'}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </button>
                
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  {isCurrent && (
                    <div className="text-xs text-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text font-semibold">
                      Paso actual
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: Horizontal Progress (sm and above) */}
        <div className="hidden sm:block">
          {/* Progress Line Background */}
          <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full"></div>
          
          {/* Progress Line Completed */}
          <div 
            className="absolute top-5 left-5 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: steps.length > 1 ? `${(currentStepIndex / (steps.length - 1)) * (100 - (100 / steps.length))}%` : '0%' }}
          ></div>

          <div className="flex items-start justify-between relative z-10">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isClickable = index <= currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center group max-w-24">
                  <button
                    onClick={() => isClickable ? navigateToStep(index) : null}
                    disabled={!isClickable}
                    className={`
                      flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all duration-300 transform
                      ${isCompleted 
                        ? 'bg-gradient-to-r from-green-400 to-green-500 border-green-500 text-white shadow-lg hover:shadow-xl hover:scale-105' 
                        : isCurrent 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white shadow-lg animate-pulse' 
                          : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                      }
                      ${isClickable ? 'cursor-pointer hover:shadow-md active:scale-95' : 'cursor-not-allowed'}
                    `}
                    title={isClickable ? `Ir a: ${step.title}` : step.title}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-xs md:text-sm font-bold">{index + 1}</span>
                    )}
                  </button>

                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium leading-tight ${
                      isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    {isCurrent && (
                      <div className="text-xs text-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text font-semibold mt-1">
                        Actual
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de skeleton para loading
function StepSkeleton() {
  return (
    <div className="p-8 space-y-6">
      {/* Header skeleton */}
      <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
      
      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Navigation skeleton */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <div className="h-12 bg-gray-200 rounded w-24 animate-pulse" />
        <div className="h-12 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
    </div>
  );
}
