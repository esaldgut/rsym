// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@aws-sdk/client-bedrock-runtime',
    '@smithy/protocol-http',
    '@smithy/signature-v4',
    '@smithy/eventstream-codec',
    '@smithy/util-utf8',
    '@smithy/util-base64'
  ]
};
