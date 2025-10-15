'use client';

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import YaanLogo from '../ui/YaanLogo'


// Hook para cerrar menu al hacer click fuera, excluyendo el botón hamburger
const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  excludeRef: React.RefObject<HTMLElement>,
  handler: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // No hacer nada si el click fue en el menu o en el botón hamburger
      if (!ref.current ||
          ref.current.contains(target) ||
          (excludeRef.current && excludeRef.current.contains(target))) {
        return;
      }

      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, excludeRef, handler]);
};

interface NavbarImprovedProps {
  initialUserType?: 'provider' | 'influencer' | 'traveler' | 'admin';
}

export const NavbarImproved = ({ initialUserType }: NavbarImprovedProps = {}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, signOut, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  // Usar initialUserType para renderizado inicial (SSR), luego user.userType del contexto
  const effectiveUserType = user?.userType || initialUserType;

  // Scroll handler - basado en el Navbar original que funciona
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Configurar estado inicial
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside (excluyendo el botón hamburger)
  useClickOutside(mobileMenuRef, hamburgerButtonRef, () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  });

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Configuración de navegación consolidada
  const navigationConfig = {
    publicLinks: [
      { href: '/', label: 'Inicio' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/moments', label: 'Momentos' },
    ],
    authenticatedLinks: [
      { href: '/profile', label: 'Mi Cuenta', userTypes: ['traveler', 'influencer', 'provider', 'admin'] }, // Visible para todos los usuarios autenticados
      { href: '/provider', label: 'Business', userTypes: ['provider'] }, // Solo visible para providers
    ],
    authLinks: {
      login: { href: '/auth', label: 'Iniciar Sesión' },
      signup: { href: '/auth?mode=signup', label: 'Comenzar' },
    }
  };

  // Filtrar links según tipo de usuario (usa effectiveUserType para SSR)
  const getFilteredLinks = (links: typeof navigationConfig.authenticatedLinks) => {
    if (!effectiveUserType) return links;
    return links.filter(link => link.userTypes.includes(effectiveUserType));
  };

  const NavLink = ({
    href,
    label,
    className = '',
    onClick
  }: {
    href: string;
    label: string;
    className?: string;
    onClick?: () => void;
  }) => {
    const isActive = pathname === href;
    const baseClasses = `relative text-sm font-medium transition-all duration-300`;

    return (
      <Link
        href={href}
        className={`${baseClasses} ${className}`}
        onClick={onClick}
      >
        {label}
        {isActive && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full" />
        )}
      </Link>
    );
  };

  const ActionButton = ({
    onClick,
    children,
    variant = 'primary',
    className = ''
  }: {
    onClick?: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    className?: string;
  }) => {
    const baseClasses = `text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg`;
    const variantClasses = variant === 'primary'
      ? `bg-gradient-to-r from-pink-500 to-pink-600 text-white`
      : isScrolled
        ? `text-gray-700 hover:bg-gray-100`
        : `text-white hover:bg-white/10`;

    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${variantClasses} ${className}`}
      >
        {children}
      </button>
    );
  };

  return (
    <>
      {/* Backdrop overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg'
            : 'bg-gradient-to-b from-black/20 to-transparent'
        }`}
        role="navigation"
        aria-label="Navegación principal"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              href="/"
              className="group transform transition-all duration-300 hover:scale-105"
              aria-label="YAAN - Ir al inicio"
            >
              <YaanLogo
                size="lg"
                responsive={true}
                variant={isScrolled ? 'black-diamond' : 'white-diamond'}
                className="transition-all duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationConfig.publicLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  className={`${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  } hover:opacity-80`}
                />
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {getFilteredLinks(navigationConfig.authenticatedLinks).map((link) => (
                    <NavLink
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      className={`px-4 py-2 rounded-full ${
                        isScrolled
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-white hover:bg-white/10'
                      }`}
                    />
                  ))}
                  <ActionButton onClick={handleSignOut} variant="primary">
                    Salir
                  </ActionButton>
                </>
              ) : (
                <>
                  <NavLink
                    href={navigationConfig.authLinks.login.href}
                    label={navigationConfig.authLinks.login.label}
                    className={`px-4 py-2 rounded-full ${
                      isScrolled
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-white hover:bg-white/10'
                    }`}
                  />
                  <Link
                    href={navigationConfig.authLinks.signup.href}
                    className="text-sm font-medium px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {navigationConfig.authLinks.signup.label}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              ref={hamburgerButtonRef}
              onClick={handleMobileMenuToggle}
              className={`md:hidden p-2 rounded-xl transition-all duration-300 z-50 relative ${
                isScrolled
                  ? 'text-gray-900 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            id="mobile-menu"
            ref={mobileMenuRef}
            className={`md:hidden transition-all duration-500 overflow-hidden ${
              isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            }`}
            aria-hidden={!isMobileMenuOpen}
          >
            <div className={`px-2 py-6 space-y-2 ${
              isScrolled ? 'bg-white' : 'bg-black/90 backdrop-blur-xl'
            } rounded-2xl mt-2 shadow-xl`}>

              {/* Public Navigation Links */}
              {navigationConfig.publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    pathname === link.href
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                      : isScrolled
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-white hover:bg-white/10'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-4" />

              {/* Auth Section */}
              {isAuthenticated ? (
                <>
                  {getFilteredLinks(navigationConfig.authenticatedLinks).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                        pathname === link.href
                          ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                          : isScrolled
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-white hover:bg-white/10'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-pink-500 to-pink-600 text-white"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={navigationConfig.authLinks.login.href}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                      isScrolled
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-white hover:bg-white/10'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {navigationConfig.authLinks.login.label}
                  </Link>
                  <Link
                    href={navigationConfig.authLinks.signup.href}
                    className="block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-pink-500 to-pink-600 text-white text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {navigationConfig.authLinks.signup.label}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
