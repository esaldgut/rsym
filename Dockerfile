# Dockerfile optimizado para Next.js 15.3.4
# Multi-stage build para reducir tamaño de imagen

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para build
ARG NEXT_PUBLIC_AWS_REGION
ARG NEXT_PUBLIC_USER_POOL_ID
ARG NEXT_PUBLIC_USER_POOL_CLIENT_ID
ARG NEXT_PUBLIC_IDENTITY_POOL_ID
ARG NEXT_PUBLIC_BUCKET_NAME

ENV NEXT_PUBLIC_AWS_REGION=$NEXT_PUBLIC_AWS_REGION
ENV NEXT_PUBLIC_USER_POOL_ID=$NEXT_PUBLIC_USER_POOL_ID
ENV NEXT_PUBLIC_USER_POOL_CLIENT_ID=$NEXT_PUBLIC_USER_POOL_CLIENT_ID
ENV NEXT_PUBLIC_IDENTITY_POOL_ID=$NEXT_PUBLIC_IDENTITY_POOL_ID
ENV NEXT_PUBLIC_BUCKET_NAME=$NEXT_PUBLIC_BUCKET_NAME

# Build de Next.js
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copiar archivos de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Iniciar aplicación
CMD ["node", "server.js"]