// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración específica para Amplify v6 + Next.js 15.3.4
  experimental: {
    // Habilitar server actions para auth y uploads
    serverActions: {
      allowedOrigins: ['localhost:3000', 'yaan.com.mx'],
      // Aumentar límite para uploads de archivos (100MB)
      bodySizeLimit: '100mb'
    },
    // Habilitar PPR y cache
    ppr: 'incremental',
    dynamicIO: true,
    // Optimización para SSR
    serverComponentsExternalPackages: ['@aws-amplify/adapter-nextjs']
  },
  serverExternalPackages: [
    '@aws-sdk/client-bedrock-runtime',
    '@smithy/protocol-http',
    '@smithy/signature-v4',
    '@smithy/eventstream-codec',
    '@smithy/util-utf8',
    '@smithy/util-base64',
    // CRÍTICO: Paquetes de Amplify v6 para evitar errores de SSR
    '@aws-amplify/adapter-nextjs',
    'aws-amplify'
  ],
  // Configuración de headers para cookies HttpOnly
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Set-Cookie',
            value: 'SameSite=Strict; Secure; HttpOnly'
          }
        ]
      }
    ];
  },
  // Configuración para permitir imágenes de S3
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yaan-provider-documents.s3.us-west-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yaan-provider-documents.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // Para imágenes de ejemplo de Unsplash
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  }
};
