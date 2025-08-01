'use client';

import { useState } from 'react';
import YaanLogo from './YaanLogo';

export function LogoShowcase() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState<'pulse' | 'shimmer' | 'draw' | 'morph' | 'spin' | 'bounce'>('pulse');

  const brandVariants = [
    { value: 'gradient-sunset', label: 'Gradient Sunset' },
    { value: 'gradient-ocean', label: 'Gradient Ocean' },
    { value: 'gradient-forest', label: 'Gradient Forest' },
    { value: 'gradient-purple', label: 'Gradient Purple' },
    { value: 'holographic', label: 'Holographic' },
    { value: 'neon', label: 'Neon' },
    { value: 'premium-gold', label: 'Premium Gold' },
    { value: 'premium-silver', label: 'Premium Silver' },
  ] as const;

  const animations = [
    { value: 'pulse', label: 'Pulse' },
    { value: 'shimmer', label: 'Shimmer' },
    { value: 'draw', label: 'Draw' },
    { value: 'morph', label: 'Morph' },
    { value: 'spin', label: 'Spin' },
    { value: 'bounce', label: 'Bounce' },
  ] as const;

  return (
    <div className="p-8 space-y-16 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">YAAN Logo Enhanced Showcase</h1>
        <p className="text-gray-600 mb-12">Brand variants and loading animations</p>

        {/* Brand Variants Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800">Brand Variants</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {brandVariants.map(({ value, label }) => (
              <div
                key={value}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="mb-4">
                  <YaanLogo size="xl" variant={value as any} />
                </div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Loading Animations Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800">Loading Animations</h2>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col items-center space-y-8">
              {/* Animation Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsLoading(!isLoading)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isLoading
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isLoading ? 'Stop Loading' : 'Start Loading'}
                </button>

                <select
                  value={selectedAnimation}
                  onChange={(e) => setSelectedAnimation(e.target.value as any)}
                  className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                >
                  {animations.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Logo Display */}
              <div className="h-32 flex items-center justify-center">
                <YaanLogo
                  size="3xl"
                  variant="primary"
                  loading={isLoading}
                  loadingAnimation={selectedAnimation}
                />
              </div>

              {/* Animation Description */}
              <div className="text-center max-w-md">
                <p className="text-sm text-gray-600">
                  {selectedAnimation === 'pulse' && 'Subtle breathing effect for gentle loading indication'}
                  {selectedAnimation === 'shimmer' && 'Light sweep across the logo for elegant loading'}
                  {selectedAnimation === 'draw' && 'SVG path drawing animation for dramatic effect'}
                  {selectedAnimation === 'morph' && 'Shape transformation for playful loading'}
                  {selectedAnimation === 'spin' && 'Classic rotation animation for continuous loading'}
                  {selectedAnimation === 'bounce' && 'Bouncing animation for energetic loading'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800">Real-World Examples</h2>
          
          <div className="space-y-8">
            {/* Hero Section Example */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-12 text-white">
              <div className="text-center">
                <YaanLogo size="4xl" variant="white" className="mb-6 mx-auto" />
                <h3 className="text-3xl font-bold mb-4">Welcome to YAAN</h3>
                <p className="text-xl opacity-90 max-w-2xl mx-auto">
                  Experience travel like never before with our curated marketplace
                </p>
              </div>
            </div>

            {/* Loading State Example */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <YaanLogo size="lg" loading={true} loadingAnimation="pulse" />
                  <div>
                    <p className="font-medium text-gray-900">Loading your experiences...</p>
                    <p className="text-sm text-gray-500">This won&apos;t take long</p>
                  </div>
                </div>
                <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-pink-500 to-purple-600 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Premium Feature Example */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <YaanLogo size="xl" variant="premium-gold" />
                  <div>
                    <h4 className="text-xl font-bold text-white">YAAN Premium</h4>
                    <p className="text-gray-400">Unlock exclusive travel experiences</p>
                  </div>
                </div>
                <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                  Upgrade Now
                </button>
              </div>
            </div>

            {/* Special Event Example */}
            <div className="bg-black rounded-2xl p-8 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20" />
              <div className="relative z-10 text-center">
                <YaanLogo size="2xl" variant="neon" className="mb-4 mx-auto" />
                <h4 className="text-2xl font-bold text-white mb-2">Summer Festival 2024</h4>
                <p className="text-pink-400">Exclusive deals on tropical destinations</p>
              </div>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section>
          <h2 className="text-2xl font-semibold mb-8 text-gray-800">Code Examples</h2>
          
          <div className="bg-gray-900 rounded-2xl p-6 overflow-x-auto">
            <pre className="text-sm text-gray-300">
              <code>{`// Basic gradient variant
<YaanLogo size="xl" variant="gradient-sunset" />

// Loading with animation
<YaanLogo 
  size="lg" 
  variant="primary" 
  loading={isLoading}
  loadingAnimation="shimmer"
/>

// Premium feature
<YaanLogo 
  size="2xl" 
  variant="premium-gold" 
  className="hover:scale-110 transition-transform"
/>

// Neon effect for special events
<YaanLogo 
  size="xl" 
  variant="neon" 
  className="animate-pulse"
/>`}</code>
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}