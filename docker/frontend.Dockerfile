# ============= BUILD STAGE =============
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies (including Tesseract.js for OCR)
# - tesseract.js: Required for Identity OCR verification
# - pdfjs-dist: Required for PDF support in OCR
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY frontend .

# Build the frontend with Vite
RUN npm run build

# ============= PRODUCTION STAGE =============
FROM nginx:1.25-alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx config for SPA routing
RUN echo 'server { \
  listen 80; \
  server_name _; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
  location /assets { \
    add_header Cache-Control "public, max-age=31536000, immutable"; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

