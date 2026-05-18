# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Install build dependencies for better-sqlite3 (needed on ARM)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app

# Install production dependencies and build native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Cleanup build tools to keep image slim
RUN apt-get purge -y python3 make g++ && apt-get autoremove -y

EXPOSE 3001
CMD ["npm", "start"]
