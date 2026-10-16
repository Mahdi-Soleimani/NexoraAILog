# ==============================================================================
# Stage 1: Build Application
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with cached layer
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build production artifacts
COPY . .
ENV VITE_BASE_PATH=/
RUN npm run build

# ==============================================================================
# Stage 2: Serve with Production Nginx
# ==============================================================================
FROM nginx:alpine AS runner

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback & security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
