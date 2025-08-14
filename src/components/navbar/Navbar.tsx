'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAmplifyAuth } from '../../hooks/useAmplifyAuth';
import { useRouter, usePathname } from 'next/navigation';
import YaanLogo from '../ui/YaanLogo';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, signOut } = useAmplifyAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/moments', label: 'Momentos' },
    { href: '/circuits', label: 'Circuitos' },
    { href: '/packages', label: 'Paquetes' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg'
          : 'bg-gradient-to-b from-black/20 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="group transform transition-all duration-300 hover:scale-105"
          >
            <YaanLogo
              size="lg"
              responsive={true}
              variant={isScrolled ? 'default' : 'white'}
              className="transition-all duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium transition-all duration-300 ${
                  isScrolled ? 'text-gray-700' : 'text-white'
                } hover:opacity-80`}
              >
                {link.label}
                {pathname === link.href && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-all duration-300 px-6 py-2.5 rounded-full ${
                    isScrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={`text-sm font-medium transition-all duration-300 px-6 py-2.5 rounded-full ${
                    isScrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Mi cuenta
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-300 ${
                    isScrolled
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                      : 'bg-white text-gray-900 hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className={`text-sm font-medium transition-all duration-300 px-6 py-2.5 rounded-full ${
                    isScrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className={`text-sm font-medium px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5`}
                >
                  Comenzar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-xl transition-all duration-300 ${
              isScrolled 
                ? 'text-gray-900 hover:bg-gray-100' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
          className={`md:hidden transition-all duration-500 overflow-hidden ${
            isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className={`px-2 py-6 space-y-2 ${
            isScrolled ? 'bg-white' : 'bg-black/90 backdrop-blur-xl'
          } rounded-2xl mt-2 shadow-xl`}>
            {navLinks.map((link) => (
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
            
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    isScrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    isScrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Mi cuenta
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-pink-500 to-pink-600 text-white"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    isScrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-pink-500 to-pink-600 text-white text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Comenzar ahora
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};