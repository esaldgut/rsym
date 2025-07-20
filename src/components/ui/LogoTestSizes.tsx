'use client';

import YaanLogo from './YaanLogo';

// Test component to verify logo responsiveness and sizing
export function LogoTestSizes() {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;
  const variants = ['default', 'primary', 'secondary', 'white', 'black'] as const;

  const sizeConfig = {
    xs: '16px - Extra small',
    sm: '20px - Small',
    md: '24px - Medium',
    lg: '32px - Large',
    xl: '40px - Extra large',
    '2xl': '48px - 2X Large',
    '3xl': '64px - 3X Large',
    '4xl': '80px - 4X Large'
  };

  return (
    <div className="p-8 space-y-12 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold mb-8 text-gray-900">YAAN Logo Test Suite</h1>
        
        {/* Size Testing */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Size Variations</h2>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-6">
              {sizes.map(size => (
                <div key={size} className="flex items-center space-x-6">
                  <span className="w-16 text-sm font-medium text-gray-600">{size}:</span>
                  <YaanLogo size={size} variant="primary" />
                  <span className="text-xs text-gray-500 ml-4">
                    {sizeConfig[size] || 'Custom'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Responsive Testing */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Responsive Behavior</h2>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-3">Responsive Large (scales from lg to xl across breakpoints):</p>
                <YaanLogo size="lg" responsive={true} variant="primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-3">Responsive Medium (scales from md to lg across breakpoints):</p>
                <YaanLogo size="md" responsive={true} variant="secondary" />
              </div>
            </div>
          </div>
        </section>

        {/* Theme Testing */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Theme Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light theme */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Light Theme</h3>
              <div className="space-y-4">
                {variants.map(variant => (
                  <div key={variant} className="flex items-center space-x-4">
                    <span className="w-20 text-sm text-gray-600">{variant}:</span>
                    <YaanLogo size="md" variant={variant} />
                  </div>
                ))}
              </div>
            </div>

            {/* Dark theme */}
            <div className="p-6 bg-gray-900 rounded-lg shadow-sm dark">
              <h3 className="text-lg font-medium mb-4 text-white">Dark Theme</h3>
              <div className="space-y-4">
                {variants.map(variant => (
                  <div key={variant} className="flex items-center space-x-4">
                    <span className="w-20 text-sm text-gray-300">{variant}:</span>
                    <YaanLogo size="md" variant={variant} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Testing */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Interactive States</h2>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-3">Hover effects (scale on hover):</p>
                <YaanLogo 
                  size="lg" 
                  variant="primary" 
                  className="hover:scale-110 transform transition-transform duration-300 cursor-pointer"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-3">Focus states (keyboard navigation):</p>
                <YaanLogo 
                  size="lg" 
                  variant="secondary" 
                  tabIndex={0}
                  className="focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 rounded"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Real-world Usage Examples</h2>
          <div className="space-y-6">
            
            {/* Navbar Example */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="text-sm font-medium text-gray-700">Navbar Usage</h4>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <YaanLogo size="lg" responsive={true} variant="primary" />
                  <div className="hidden md:flex space-x-6">
                    <span className="text-sm text-gray-600">Inicio</span>
                    <span className="text-sm text-gray-600">Servicios</span>
                    <span className="text-sm text-gray-600">Contacto</span>
                  </div>
                  <button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">
                    Comenzar
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Example */}
            <div className="bg-gray-900 text-white rounded-lg overflow-hidden">
              <div className="bg-gray-800 px-4 py-2">
                <h4 className="text-sm font-medium text-gray-300">Footer Usage</h4>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <YaanLogo size="xl" variant="white" className="mb-4" />
                    <p className="text-gray-400 text-sm">
                      Tu plataforma de confianza para experiencias únicas.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium mb-3">Enlaces</h5>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>Inicio</li>
                      <li>Servicios</li>
                      <li>Contacto</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-3">Legal</h5>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>Términos</li>
                      <li>Privacidad</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}