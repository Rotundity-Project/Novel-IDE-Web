FROM node:20-alpine AS deps
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY app/package.json ./app/package.json
RUN pnpm install --filter app...

FROM node:20-alpine AS builder
WORKDIR /workspace
RUN corepack enable
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/app/node_modules ./app/node_modules
COPY . .
RUN pnpm --filter app build

FROM node:20-alpine AS runner
WORKDIR /workspace/app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=builder /workspace/app/.next ./.next
COPY --from=builder /workspace/app/public ./public
COPY --from=builder /workspace/app/package.json ./package.json
COPY --from=builder /workspace/app/next.config.mjs ./next.config.mjs
COPY --from=deps /workspace/node_modules /workspace/node_modules
COPY --from=deps /workspace/app/node_modules ./node_modules
EXPOSE 3000
CMD ["pnpm", "start"]
