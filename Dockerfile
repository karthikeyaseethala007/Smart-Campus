# =========================================================================
# SMART CAMPUS SECURITY & AUTOMATION — PRODUCTION CONTAINER
# Multi-stage build for High-Performance Node & Edge Deployment
# =========================================================================

# Stage 1: Build Frontend & Server
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Install dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile || npm ci

# Copy full application source
COPY . .

# Build Vite frontend bundle
RUN npm run build

# Stage 2: Production Server Runner (Non-root Unprivileged Container - SEC-MED-03)
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Copy node_modules and built assets with unprivileged node ownership
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/server ./server
COPY --from=builder --chown=node:node /app/src/types ./src/types
COPY --from=builder --chown=node:node /app/src/services ./src/services

# Run application processes as unprivileged non-root user
USER node

EXPOSE 8080

# Health check against production endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "--loader", "ts-node/esm", "server/index.ts"]
