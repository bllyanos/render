# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy configuration and source files
COPY vite.config.js ./
COPY src/ ./src/
COPY public/ ./public/
COPY views/ ./views/

# Run the build process (Vite + Tailwind v4)
RUN npm run build

# Stage 2: Production
FROM node:20-slim
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --production

# 1. Copy original public assets (static fonts, icons, etc)
COPY public/ ./public/

# 2. Copy built assets from builder (this overwrites public/dist with hashed versions)
COPY --from=builder /app/public/dist ./public/dist

# Copy application logic and required directories
COPY app.js ./
COPY views/ ./views/
COPY scripts/ ./scripts/
# We keep pages/ here as a fallback or for initial files, 
# though docker-compose usually overrides this with a volume
COPY pages/ ./pages/

# Expose the application port
EXPOSE 9901

# Command to run the application
CMD ["node", "app.js"]
