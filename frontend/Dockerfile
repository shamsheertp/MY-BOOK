# ==========================================
# MY-BOOK Frontend Production Dockerfile
# Multi-stage Vite build + Nginx Alpine runner
# ==========================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build production bundle with code-splitting
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ==========================================
# Stage 2: Serve with Nginx
# ==========================================
FROM nginx:alpine AS runner

# Railway dynamically injects $PORT; default to 80 for local docker-compose
ENV PORT=80

COPY --from=builder /app/dist /usr/share/nginx/html

# Clean default conf and register template for dynamic PORT substitution
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Limit worker processes to 2 to prevent excessive process spawning on high-core cloud hosts
RUN sed -i 's/worker_processes  auto;/worker_processes  2;/' /etc/nginx/nginx.conf

EXPOSE 80

# Health check dynamically probes configured $PORT
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
