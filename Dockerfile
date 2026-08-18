# Trade Arena Production Dockerfile
# Base image: Node 22 (Bookworm) providing Node.js 22.18+ runtime
FROM node:22-bookworm AS builder

WORKDIR /app

# Enable corepack for pinned pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install all dependencies (including devDependencies for vite build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend and bundle server
RUN pnpm run build

# Production runtime stage
FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests and production dependencies
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts and necessary server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts

# Ensure MetaMask Agent CLI is globally available and executable in runtime
RUN npm install -g @metamask/agent-wallet@latest

ENV NODE_ENV=production
ENV PORT=3000
ENV MM_PATH=/usr/local/bin/mm

EXPOSE 3000

CMD ["node", "dist/index.js"]
