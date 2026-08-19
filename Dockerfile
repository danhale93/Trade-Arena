# Trade Arena Production Dockerfile
# Base image: Node 22 (Bookworm) providing Node.js 22.18+ runtime
FROM node:22.18-bookworm AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Production runtime stage
FROM node:22.18-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install full dependencies so runtime externalized modules (like vite) are present
RUN pnpm install --frozen-lockfile

# Copy built artifacts and necessary server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts

# Install official MetaMask Agent CLI globally so it's reliably in PATH
RUN npm install -g @metamask/agent-wallet@latest

ENV NODE_ENV=production
ENV PORT=3000
ENV MM_PATH=/usr/local/bin/mm
ENV DIRECT_EXECUTION_ENABLED=false

EXPOSE 3000

CMD ["node", "dist/index.js"]
