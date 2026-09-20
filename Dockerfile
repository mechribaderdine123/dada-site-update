# Build then run the TanStack Start app with its PostgreSQL-backed API.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime dependencies only (pg, bcryptjs, and the rest of the server deps).
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV UPLOAD_DIR=/data/uploads

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY package.json ./

# The upload folder holds the MP3s, avatars and covers. It is created here so
# the named volume inherits the right ownership on first start.
RUN mkdir -p /data/uploads && chown -R node:node /data

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
