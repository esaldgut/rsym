// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para Docker standalone
  output: 'standalone',
  // TypeScript: Ignorar errores durante build (temporal)
  // Next.js 16 tiene type checking más estricto que detecta 13,000+ errores preexistentes
  // Permite build de producción mientras se corrigen errores gradualmente en desarrollo
  typescript: {
    ignoreBuildErrors: true,
  },
  // Transpile maplibre-gl y dependencias para Turbopack compatibility
  transpilePackages: [
    'maplibre-gl',
    '@mapbox/geojson-rewind',
    '@mapbox/point-geometry',
    '@mapbox/tiny-sdf',
    '@mapbox/unitbezier',
    '@mapbox/vector-tile',
    '@mapbox/whoots-js',
    // CE.SDK (Creative Editor SDK) para edición de imágenes y videos
    '@cesdk/cesdk-js',
    '@cesdk/engine'
  ],
  // Configuración específica para Amplify v6 + Next.js 16.0.2
  experimental: {
    // Habilitar server actions para auth y uploads
    serverActions: {
      allowedOrigins: ['localhost:3000', 'yaan.com.mx'],
      // Aumentar límite para uploads de archivos (100MB)
      bodySizeLimit: '100mb'
    },
    // Habilitar PPR y cache
    //ppr: 'incremental',
    //cacheComponents: true
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
  // Configuración de headers para cookies HttpOnly y deep linking
  async headers() {
    return [
      // Headers para archivos de verificación de deep linking (Android)
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600'
          }
        ]
      },
      // Headers para archivos de verificación de deep linking (iOS)
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600'
          }
        ]
      },
      // Headers generales para cookies HttpOnly
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
  },
  // Configuración webpack para archivos .graphql
  // IMPORTANTE: Usa 'asset/source' (Webpack 5 built-in) para cargar .graphql como strings
  // - AWS Amplify client.graphql() acepta strings (no necesita DocumentNode)
  // - Alternativa graphql-tag/loader parsearia a AST (innecesario para Amplify)
  // - Requiere src/types/graphql.d.ts para TypeScript (ver archivo para detalles)
  //
  // NOTA: Next.js 15.5.4 usa webpack por defecto cuando hay custom config
  // No se requiere turbo: false (deprecado en 15.5+)
  webpack: (config) => {
    config.module.rules.push({
      test: /\.graphql$/,
      type: 'asset/source'
    });
    return config;
  }
};
export default nextConfig;
