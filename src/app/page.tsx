'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0 bg-repeat"
            style={{
              transform: `translateY(${scrollY * 0.3}px)`,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 opacity-0 animate-fade-in-up"
            style={{
              transform: `translateY(${scrollY * -0.2}px)`,
              opacity: 1 - scrollY / 1000
            }}
          >
            Descubre el mundo
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              a tu manera
            </span>
          </h1>
          
          <p 
            className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto opacity-0 animate-fade-in-up animation-delay-200"
            style={{
              transform: `translateY(${scrollY * -0.15}px)`,
              opacity: 1 - scrollY / 800
            }}
          >
            YAAN conecta viajeros con experiencias únicas. Encuentra circuitos turísticos 
            y paquetes diseñados por expertos locales.
          </p>
          
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up animation-delay-400"
            style={{
              transform: `translateY(${scrollY * -0.1}px)`,
              opacity: 1 - scrollY / 600
            }}
          >
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-block bg-white text-purple-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                Ir al Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth?mode=signup"
                  className="inline-block bg-white text-purple-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                >
                  Comenzar ahora
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-block bg-transparent text-white border-2 border-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-purple-900 transition-all duration-300 transform hover:scale-105"
                >
                  Explorar marketplace
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white opacity-70 animate-bounce"
          style={{ opacity: 1 - scrollY / 200 }}
        >
          <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para tu próxima aventura
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Una plataforma completa diseñada para conectar viajeros con experiencias auténticas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🌍',
                title: 'Circuitos Únicos',
                description: 'Descubre rutas turísticas diseñadas por expertos locales que conocen los mejores lugares.',
              },
              {
                icon: '📦',
                title: 'Paquetes Completos',
                description: 'Todo incluido: alojamiento, transporte y actividades. Sin preocupaciones, solo disfrutar.',
              },
              {
                icon: '⭐',
                title: 'Proveedores Verificados',
                description: 'Trabajamos solo con proveedores certificados para garantizar tu seguridad y satisfacción.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-on-scroll opacity-0 translate-y-10`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-5xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Cómo funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tres simples pasos para comenzar tu próxima aventura
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Explora',
                description: 'Navega por nuestro marketplace y descubre experiencias únicas en destinos increíbles.',
              },
              {
                step: '02',
                title: 'Selecciona',
                description: 'Elige el circuito o paquete que mejor se adapte a tus preferencias y presupuesto.',
              },
              {
                step: '03',
                title: 'Disfruta',
                description: 'Relájate y disfruta de tu viaje mientras nosotros nos encargamos de todos los detalles.',
              },
            ].map((step, index) => (
              <div
                key={index}
                className={`text-center animate-on-scroll opacity-0 translate-y-10`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="text-6xl font-bold text-purple-600 mb-6 opacity-20">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-700 to-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-on-scroll opacity-0 translate-y-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Listo para comenzar tu aventura?
            </h2>
            <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
              Únete a miles de viajeros que ya están descubriendo el mundo con YAAN
            </p>
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-block bg-white text-purple-900 px-10 py-5 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                Explorar experiencias
              </Link>
            ) : (
              <Link
                href="/auth?mode=signup"
                className="inline-block bg-white text-purple-900 px-10 py-5 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                Crear cuenta gratis
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">YAAN</h3>
              <p className="text-gray-400">
                Tu puerta de entrada a experiencias de viaje inolvidables.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Explorar</h4>
              <ul className="space-y-2">
                <li><Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/circuits" className="text-gray-400 hover:text-white transition-colors">Circuitos</Link></li>
                <li><Link href="/packages" className="text-gray-400 hover:text-white transition-colors">Paquetes</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Compañía</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">Nosotros</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contacto</Link></li>
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Ayuda</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Términos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 YAAN. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animate-on-scroll {
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-on-scroll.animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}