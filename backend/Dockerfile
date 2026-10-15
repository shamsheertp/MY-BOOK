# ==========================================
# MY-BOOK Backend Production Dockerfile
# Multi-stage lightweight Node.js Alpine build
# ==========================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL required by Prisma engines on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
RUN npm ci

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma client and compile TypeScript to dist/
RUN npm run build

# Prune devDependencies to keep container minimal
RUN npm prune --production

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install runtime OpenSSL for Prisma
RUN apk add --no-cache openssl

# Pre-create /app/uploads and grant full ownership to non-root node user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Run container as non-root user for security
USER node

# Copy production node_modules, generated prisma client, and compiled js
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/package.json ./package.json

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["npm", "start"]
