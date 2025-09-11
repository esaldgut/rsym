'use client';

import { ReactNode } from 'react';
import { HeroSection } from '@/components/ui/HeroSection';

interface PageLayoutProps {
  /** Título del hero section */
  title: string | ReactNode;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Contenido adicional en el hero (botones, acciones) */
  heroChildren?: ReactNode;
  /** Contenido principal de la página */
  children: ReactNode;
  /** Tamaño del hero section */
  heroSize?: 'sm' | 'md' | 'lg' | 'full';
  /** Si mostrar formas animadas */
  showShapes?: boolean;
  /** Ancho máximo del contenedor principal */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl' | '7xl';
  /** Clases adicionales para el contenedor principal */
  containerClassName?: string;
  /** Si el fondo debe ser gris o blanco */
  backgroundColor?: 'gray' | 'white';
}

/**
 * Layout reutilizable para páginas con HeroSection
 * Mantiene la consistencia visual y el patrón estándar de YAAN
 * 
 * Patrón estándar:
 * - HeroSection con gradiente vibrante
 * - Contenido principal con -mt-8 para superposición
 * - Fondo gris con contenedor centrado
 * - Responsive y mobile-first
 */
export function PageLayout({
  title,
  subtitle,
  heroChildren,
  children,
  heroSize = 'md',
  showShapes = true,
  maxWidth = '7xl',
  containerClassName = '',
  backgroundColor = 'gray'
}: PageLayoutProps) {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md', 
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };

  const backgroundClasses = {
    'gray': 'bg-gray-50',
    'white': 'bg-white'
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section consistente */}
      <HeroSection
        title={title}
        subtitle={subtitle}
        size={heroSize}
        showShapes={showShapes}
      >
        {heroChildren}
      </HeroSection>
      
      {/* Contenido principal con patrón estándar */}
      <div className={`${backgroundClasses[backgroundColor]} -mt-8 relative z-10`}>
        <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8 ${containerClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Variante específica para páginas de configuración
 * Hero más pequeño y centrado en formularios
 */
export function SettingsPageLayout(props: Omit<PageLayoutProps, 'heroSize' | 'maxWidth'>) {
  return (
    <PageLayout
      {...props}
      heroSize="sm"
      maxWidth="4xl"
    />
  );
}

/**
 * Variante específica para páginas de contenido principal
 * Hero estándar y contenedor amplio
 */
export function ContentPageLayout(props: Omit<PageLayoutProps, 'heroSize' | 'maxWidth'>) {
  return (
    <PageLayout
      {...props}
      heroSize="md"
      maxWidth="7xl"
    />
  );
}

/**
 * Variante específica para páginas de perfil
 * Hero mediano y contenedor intermedio
 */
export function ProfilePageLayout(props: Omit<PageLayoutProps, 'heroSize' | 'maxWidth'>) {
  return (
    <PageLayout
      {...props}
      heroSize="md" 
      maxWidth="5xl"
    />
  );
}