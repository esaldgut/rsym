'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import YaanLogo from '../components/ui/YaanLogo';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  
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

  const destinations = [
    { name: 'Machu Picchu', country: 'Perú', image: '🏔️' },
    { name: 'Caribe Mexicano', country: 'México', image: '🏖️' },
    { name: 'Buenos Aires', country: 'Argentina', image: '🌆' },
    { name: 'Amazonas', country: 'Brasil', image: '🌳' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section with Onboarding Style */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Animated Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          />
          <div 
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-pink-400/20 rounded-full blur-3xl"
            style={{ transform: `translateY(${scrollY * -0.3}px)` }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 animate-fade-in-up">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-xl text-white text-sm font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Más de 10,000 viajeros activos
            </span>
          </div>
          
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight animate-fade-in-up animation-delay-200"
          >
            Tu próxima aventura
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
              comienza aquí
            </span>
          </h1>
          
          <p 
            className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400"
          >
            Conectamos viajeros con experiencias únicas diseñadas por expertos locales
          </p>
          
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-600"
          >
            {isAuthenticated ? (
              <Link
                href="/moments"
                className="group relative inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <span className="relative z-10">Explorar experiencias</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute inset-0 rounded-2xl bg-white group-hover:bg-transparent transition-colors duration-300" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth?mode=signup"
                  className="group relative inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10">Comenzar gratis</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white font-bold text-lg hover:bg-white/20 transform hover:-translate-y-1 transition-all duration-300"
                >
                  Ver experiencias
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-800">
            {[
              { number: '50K+', label: 'Viajeros' },
              { number: '1000+', label: 'Experiencias' },
              { number: '4.9', label: 'Calificación' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.number}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce"
          style={{ opacity: 1 - scrollY / 200 }}
        >
          <div className="flex flex-col items-center">
            <span className="text-sm mb-2">Descubre más</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Popular Destinations Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-10">
            <span className="text-pink-600 font-bold text-sm uppercase tracking-wider">Destinos populares</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-4 mb-6">
              Descubre lugares increíbles
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explora nuestros destinos más solicitados y vive experiencias únicas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((destination, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 p-8 hover:shadow-2xl transition-all duration-500 animate-on-scroll opacity-0 translate-y-10 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {destination.image}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {destination.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{destination.country}</p>
                  <div className="flex items-center text-pink-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Explorar
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-10">
            <span className="text-purple-600 font-bold text-sm uppercase tracking-wider">Cómo funciona</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-4 mb-6">
              Tu viaje en 3 simples pasos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-200 via-purple-200 to-pink-200 transform -translate-y-1/2" />
            
            {[
              {
                step: '1',
                icon: '🔍',
                title: 'Busca tu destino',
                description: 'Explora miles de experiencias únicas en destinos increíbles',
                color: 'pink',
              },
              {
                step: '2',
                icon: '💳',
                title: 'Reserva seguro',
                description: 'Paga de forma segura y recibe confirmación instantánea',
                color: 'purple',
              },
              {
                step: '3',
                icon: '✈️',
                title: 'Viaja tranquilo',
                description: 'Disfruta tu experiencia con soporte 24/7',
                color: 'indigo',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative animate-on-scroll opacity-0 translate-y-10"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative z-10 text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-${item.color}-400 to-${item.color}-600 flex items-center justify-center text-4xl shadow-xl transform hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-10">
            <span className="text-pink-600 font-bold text-sm uppercase tracking-wider">Por qué elegirnos</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-4 mb-6">
              La mejor forma de viajar
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🛡️',
                title: 'Viajes seguros',
                description: 'Todos nuestros proveedores están verificados y cuentan con seguro',
                gradient: 'from-blue-400 to-blue-600',
              },
              {
                icon: '💰',
                title: 'Mejor precio',
                description: 'Garantizamos el mejor precio o te devolvemos la diferencia',
                gradient: 'from-green-400 to-green-600',
              },
              {
                icon: '🌟',
                title: 'Experiencias únicas',
                description: 'Accede a experiencias exclusivas no disponibles en otros lugares',
                gradient: 'from-purple-400 to-purple-600',
              },
              {
                icon: '🤝',
                title: 'Soporte 24/7',
                description: 'Nuestro equipo está disponible para ayudarte en cualquier momento',
                gradient: 'from-pink-400 to-pink-600',
              },
              {
                icon: '🌍',
                title: 'Turismo sostenible',
                description: 'Apoyamos el turismo responsable y las comunidades locales',
                gradient: 'from-orange-400 to-orange-600',
              },
              {
                icon: '📱',
                title: 'App móvil',
                description: 'Gestiona tus viajes desde cualquier lugar con nuestra app',
                gradient: 'from-indigo-400 to-indigo-600',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 animate-on-scroll opacity-0 translate-y-10 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700`} />
                
                <div className="relative z-10">
                  <div className={`w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-3xl shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black/10" />
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-400/10 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-on-scroll opacity-0 translate-y-10">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              ¿Listo para tu próxima aventura?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Únete a miles de viajeros que ya están descubriendo el mundo de una forma diferente
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {isAuthenticated ? (
                <Link
                  href="/moments"
                  className="group relative inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-white text-gray-900 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <span className="relative z-10">Explorar experiencias</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth?mode=signup"
                    className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-white text-gray-900 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    Crear cuenta gratis
                  </Link>
                  <div className="flex items-center gap-4 text-white">
                    <div className="flex -space-x-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 border-2 border-white flex items-center justify-center text-sm font-bold"
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm">+10K viajeros activos</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-6">
                <YaanLogo
                  size="xl"
                  variant="white"
                  className="mb-4 hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Conectamos viajeros con experiencias únicas. Descubre el mundo de una forma diferente.
              </p>
              <div className="flex space-x-4">
                {['facebook', 'instagram', 'twitter'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors duration-300"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5 bg-white rounded" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Explora</h4>
              <ul className="space-y-3">
                <li><Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/circuits" className="text-gray-400 hover:text-white transition-colors">Circuitos</Link></li>
                <li><Link href="/packages" className="text-gray-400 hover:text-white transition-colors">Paquetes</Link></li>
                <li><Link href="/destinations" className="text-gray-400 hover:text-white transition-colors">Destinos</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Soporte</h4>
              <ul className="space-y-3">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Centro de ayuda</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contacto</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Términos</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 YAAN. Todos los derechos reservados.</p>
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(-10deg);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }

        .animation-delay-800 {
          animation-delay: 800ms;
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
