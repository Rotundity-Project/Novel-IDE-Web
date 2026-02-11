FROM node:20-alpine AS deps
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY server/package.json ./server/package.json
RUN pnpm install --filter server...

FROM node:20-alpine AS builder
WORKDIR /workspace
RUN corepack enable
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/server/node_modules ./server/node_modules
COPY . .
RUN pnpm --filter server build

FROM node:20-alpine AS runner
WORKDIR /workspace/server
ENV NODE_ENV=production
RUN corepack enable
COPY --from=builder /workspace/server/dist ./dist
COPY --from=builder /workspace/server/drizzle ./drizzle
COPY --from=builder /workspace/server/package.json ./package.json
COPY --from=deps /workspace/node_modules /workspace/node_modules
COPY --from=deps /workspace/server/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/server.js"]
