'use client';

import { ReactNode } from 'react';

interface SettingsHeroProps {
  title: string | ReactNode;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Componente Hero específico para páginas de configuración
 * Mantiene la consistencia visual pero con menor altura para páginas de formularios
 */
export function SettingsHero({ 
  title, 
  subtitle, 
  children,
  className = ''
}: SettingsHeroProps) {
  return (
    <section className={`relative pt-28 pb-12 ${className}`}>
      {/* Gradiente vibrante consistente con el branding de YAAN */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Formas animadas sutiles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-yellow-400/5 rounded-full blur-3xl" />
      </div>

      {/* Contenido del Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-fade-in-up">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-lg text-white/90 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              {subtitle}
            </p>
          )}
          
          {children && (
            <div className="mt-6 animate-fade-in-up animation-delay-400">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}