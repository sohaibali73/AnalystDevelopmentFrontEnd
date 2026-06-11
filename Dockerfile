# syntax=docker/dockerfile:1

# ---------- deps ----------
# Install production-ready node_modules using the lockfile.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --legacy-peer-deps: React 19 / Next 16 have peer-dep ranges that trip npm's
# strict ERESOLVE; this lets the install resolve. --no-audit/--no-fund speed it up.
RUN npm install --no-audit --no-fund --legacy-peer-deps

# ---------- build ----------
# Build the Next.js standalone output. NEXT_PUBLIC_* values are inlined at
# build time, so the API URL must be present as an ENV before `npm run build`.
FROM node:20-alpine AS build
WORKDIR /app

# Public env vars baked into the client bundle at build time.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_AUTH_BYPASS
ENV NEXT_PUBLIC_AUTH_BYPASS=${NEXT_PUBLIC_AUTH_BYPASS}
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runner ----------
# Minimal runtime image containing only the standalone server + static assets.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# .next/standalone already contains a minimal node_modules and server.js.
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
