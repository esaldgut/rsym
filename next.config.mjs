// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración específica para Amplify v6 + Next.js 15.3.4
  experimental: {
    // Habilitar server actions para auth
    serverActions: true,
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
  }
};
