# Use Node.js LTS version
FROM node:20-alpine AS base

# -----------------------------
# Install dependencies
# -----------------------------
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# -----------------------------
# Build stage
# -----------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# -----------------------------
# Runtime stage
# -----------------------------
FROM base AS runner
WORKDIR /app

#ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 appuser

# Copy only what’s needed for runtime
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

USER appuser

# Expose the app’s port
EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0

# Start the app
CMD ["node", "dist/index.js"]