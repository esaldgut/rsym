'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeroSection } from '@/components/ui/HeroSection';
import ProductWizard from '@/components/product-wizard/ProductWizard';

interface CreateProductClientProps {
  userId: string;
}

export default function CreateProductClient({ userId }: CreateProductClientProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'circuit' | 'package' | null>(null);

  if (!selectedType) {
    return (
      <div className="min-h-screen">
        <HeroSection
          title="¿Qué tipo de experiencia quieres crear?"
          subtitle="Escoge el tipo de producto turístico que mejor se adapte a tu propuesta"
          size="md"
          showShapes={true}
        />
        
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Circuito */}
            <div 
              onClick={() => setSelectedType('circuit')}
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 hover:border-pink-500 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-violet-500/10 group-hover:from-pink-500/20 group-hover:to-violet-500/20 transition-all duration-300" />
              
              <div className="relative p-8">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Circuito Turístico</h3>
                <p className="text-gray-600 mb-6">
                  Para experiencias que recorren múltiples destinos, con itinerarios detallados y actividades programadas.
                </p>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Múltiples destinos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Itinerario detallado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Múltiples temporadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Hoteles opcionales</span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium">
                    Crear Circuito
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Paquete */}
            <div 
              onClick={() => setSelectedType('package')}
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 hover:border-violet-500 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-pink-500/10 group-hover:from-violet-500/20 group-hover:to-pink-500/20 transition-all duration-300" />
              
              <div className="relative p-8">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Paquete Turístico</h3>
                <p className="text-gray-600 mb-6">
                  Para experiencias completas desde un origen a un destino específico, con servicios incluidos.
                </p>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Origen y destino específicos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Servicios incluidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Una temporada principal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Configuración simplificada</span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium">
                    Crear Paquete
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <div className="text-center mt-12">
              <button
                onClick={() => router.push('/provider')}
                className="text-gray-500 hover:text-gray-700 underline font-medium"
              >
                Cancelar y volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ProductWizard userId={userId} productType={selectedType} />;
}