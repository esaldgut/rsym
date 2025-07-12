/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['aws-amplify']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  env: {
    AMPLIFY_SSR: process.env.NODE_ENV === 'production' ? 'true' : 'false'
  }
};

module.exports = nextConfig;
