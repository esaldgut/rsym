'use client';

import { ReactNode, useEffect, useState } from 'react';

interface HeroSectionProps {
  title: string | ReactNode;
  subtitle?: string;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showShapes?: boolean;
  className?: string;
}

/**
 * Componente reutilizable para Hero Sections con el gradiente vibrante de YAAN
 * Mantiene consistencia visual en toda la aplicación
 */
export function HeroSection({ 
  title, 
  subtitle, 
  children,
  size = 'md',
  showShapes = true,
  className = ''
}: HeroSectionProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!showShapes) return;
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showShapes]);

  // Configuración de tamaños
  const sizeClasses = {
    sm: 'pt-28 pb-12',
    md: 'pt-32 pb-16',
    lg: 'pt-40 pb-20',
    full: 'min-h-screen flex items-center justify-center'
  };

  // Configuración de tamaño de título según el size
  const titleSizeClasses = {
    sm: 'text-3xl md:text-4xl',
    md: 'text-4xl md:text-5xl',
    lg: 'text-5xl md:text-6xl',
    full: 'text-5xl md:text-6xl lg:text-7xl'
  };

  return (
    <section className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Gradiente vibrante consistente con el branding de YAAN */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Formas animadas opcionales para dar dinamismo */}
      {showShapes && (
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          />
          <div 
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-pink-400/20 rounded-full blur-3xl"
            style={{ transform: `translateY(${scrollY * -0.3}px)` }}
          />
          <div 
            className="absolute top-1/2 left-1/3 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          />
        </div>
      )}

      {/* Contenido del Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={size === 'full' ? 'text-center' : ''}>
          <h1 className={`${titleSizeClasses[size]} font-bold text-white mb-4 animate-fade-in-up`}>
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-lg md:text-xl text-white/90 max-w-3xl animate-fade-in-up animation-delay-200">
              {subtitle}
            </p>
          )}
          
          {children && (
            <div className="mt-8 animate-fade-in-up animation-delay-400">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Variante del Hero para páginas de contenido (como marketplace, moments, etc.)
 * Incluye un wrapper para el contenido principal con fondo blanco
 */
export function PageHeroSection({
  title,
  subtitle,
  children,
  contentChildren
}: HeroSectionProps & { contentChildren?: ReactNode }) {
  return (
    <>
      <HeroSection 
        title={title} 
        subtitle={subtitle} 
        size="md"
        showShapes={true}
      >
        {children}
      </HeroSection>
      
      {/* Contenido principal con transición suave */}
      {contentChildren && (
        <div className="bg-gray-50 -mt-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {contentChildren}
          </div>
        </div>
      )}
    </>
  );
}