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
import type { StepProps } from '@/types/wizard';

interface ProductWizardProps {
  userId: string;
  productType: 'circuit' | 'package';
}

export default function ProductWizard({ userId, productType }: ProductWizardProps) {
  const steps = getStepsForProductType(productType);
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean | null>(null); // null = loading state
  const [isEditMode, setIsEditMode] = useState(false);

  // Verificar si existe un producto en localStorage al montar
  useEffect(() => {
    const savedProductId = localStorage.getItem('yaan-current-product-id');
    const savedProductType = localStorage.getItem('yaan-current-product-type');
    const savedProductName = localStorage.getItem('yaan-current-product-name');
    const editData = localStorage.getItem('yaan-edit-product-data');
    
    // Verificar si es modo edición (priority over creation mode)
    if (editData && savedProductId && savedProductName) {
      const parsed = JSON.parse(editData);
      setProductId(savedProductId);
      setProductName(savedProductName);
      setShowModal(false); // No mostrar modal en modo edición
      setIsEditMode(true); // Activar modo edición
      
      console.log('📝 Modo edición detectado - producto cargado:', { 
        id: savedProductId, 
        name: savedProductName, 
        type: savedProductType,
        isEdit: true
      });
    } else if (savedProductId && savedProductType === productType && savedProductName) {
      // Recuperar producto existente - NO mostrar modal
      setProductId(savedProductId);
      setProductName(savedProductName);
      setShowModal(false); // Importante: no mostrar modal si hay producto existente
      
      console.log('📦 Producto existente recuperado de localStorage:', { 
        id: savedProductId, 
        name: savedProductName, 
        type: savedProductType 
      });
    } else {
      // No hay producto o es de diferente tipo - mostrar modal para crear nuevo
      if (savedProductId && savedProductType !== productType) {
        console.log('🔄 Producto existente es de diferente tipo, creando nuevo');
      }
      setShowModal(true);
    }
  }, [productType]);

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

  return (
    <ProductFormProvider steps={steps} productType={productType}>
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

        {/* Contenido principal del wizard */}
        <div className={showModal === true ? 'blur-sm pointer-events-none' : ''}>
        {/* Hero Section estandarizado */}
        <HeroSection
          title={`${isEditMode ? 'Editar' : 'Crear'} ${productType === 'circuit' ? 'Circuito' : 'Paquete'} Turístico`}
          subtitle={isEditMode ? 'Actualiza los detalles de tu experiencia turística' : 'Comparte tu experiencia turística única con viajeros de todo el mundo'}
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
  productType
}: { 
  userId: string;
  productId: string | null;
  productName: string;
  productType: 'circuit' | 'package';
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
  productType 
}: { 
  steps: any[];
  currentStepIndex: number;
  productType: 'circuit' | 'package';
}) {
  const { navigateToStep } = useProductForm();
  
  return (
    <div className="border-b border-gray-200 pb-6">
      {/* Header simplificado */}
      <div className="px-6 sm:px-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {steps[currentStepIndex]?.title || 'Información General'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Paso {currentStepIndex + 1} de {steps.length}
            </p>
          </div>
          <div className="text-right">
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
