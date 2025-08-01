'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import YaanLogo from '../ui/YaanLogo';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Report to error tracking service if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as { gtag: (...args: unknown[]) => void }).gtag;
      gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <YaanLogo 
                  size="3xl" 
                  variant="gradient-purple" 
                  className="opacity-75" 
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Oops, algo salió mal
              </h2>
              <p className="text-gray-600">
                Hemos detectado un problema con la autenticación
              </p>
            </div>

            {/* Error Container */}
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error de autenticación
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        {this.state.error?.message || 'Error desconocido en el sistema de autenticación'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-4">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Intentar de nuevo
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300"
                >
                  Volver al inicio
                </button>
              </div>

              {/* Support information */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  ¿El problema persiste?
                </p>
                <div className="space-y-2">
                  <a
                    href="/help"
                    className="inline-flex items-center text-sm text-pink-600 hover:text-pink-500 font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Centro de ayuda
                  </a>
                  <span className="mx-2 text-gray-400">•</span>
                  <a
                    href="/contact"
                    className="inline-flex items-center text-sm text-pink-600 hover:text-pink-500 font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contactar soporte
                  </a>
                </div>
              </div>

              {/* Development info (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 rounded-xl p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Información técnica (desarrollo)
                  </summary>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="mt-1 bg-gray-200 p-2 rounded text-xs overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack trace:</strong>
                        <pre className="mt-1 bg-gray-200 p-2 rounded text-xs overflow-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component stack:</strong>
                        <pre className="mt-1 bg-gray-200 p-2 rounded text-xs overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
              <p>
                Si necesitas ayuda inmediata, contáctanos en{' '}
                <a 
                  href="mailto:soporte@yaan.com.mx" 
                  className="text-pink-600 hover:text-pink-500 font-medium"
                >
                  soporte@yaan.com.mx
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}