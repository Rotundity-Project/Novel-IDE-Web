# Novel-IDE-Web

一个面向长篇小说创作的 Web 写作工作台，采用 IDE 风格界面，并提供 AI 协作写作能力。

## 当前状态

仓库已从纯文档阶段进入 **Phase 1 可部署框架**，并补齐了 Phase 1 MVP 的核心链路：
- `app/`: Next.js (App Router) + TypeScript（Next.js 16）
- `packages/server-core/`: 共享服务端核心库（env/db/auth/redis/统一错误响应）
- `server/`: NestJS + TypeScript（可选复杂能力服务骨架）
- `docker/docker-compose.yml`: PostgreSQL + Redis + app（默认）+ migrate（自动迁移）+ server（可选 profile）
- `server/drizzle/`: Drizzle ORM schema + 初始迁移
- Auth：注册/登录/刷新/登出（JWT Bearer）
- Works/Chapters：作品与章节最小 CRUD
- 前端：登录/注册、作品列表/详情、章节编辑（Lexical）

## 项目结构

```text
Novel-IDE-Web/
├── app/
├── server/
├── docker/
├── scripts/
└── docs/
```

## 本地开发

1. 安装依赖（建议 Node.js 20.9+ + pnpm）

```bash
pnpm install
```

2. 复制环境变量

```bash
cp .env.example .env
cp app/.env.example app/.env.local
cp server/.env.example server/.env
```

3. 启动服务

```bash
pnpm dev:app
```

访问地址：
- 前端: http://localhost:3000
- 同源 API 健康检查: http://localhost:3000/api/v1/health

可选（仅当需要复杂能力服务时启用 Nest 后端）：
```bash
pnpm dev:server
```
可选后端健康检查：
- http://localhost:3001/health
- http://localhost:3001/api/v1/health

数据库迁移（Drizzle，首次初始化或 schema 有变化时）：
```bash
pnpm --filter server db:generate
pnpm --filter server db:migrate
```

## Docker 部署

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml --env-file .env up --build -d
```

服务端口：
- app: `3000`
- server: `3001`（可选 profile）
- postgres: `5432`
- redis: `6379`

需要启用可选后端（复杂能力服务）：
```bash
docker compose -f docker/docker-compose.yml --profile complex --env-file .env up --build -d
```

## 重要文档

- `docs/设计文档.md`
- `docs/项目结构.md`
- `docs/部署文档.md`
- `docs/项目路线图.md`
- `docs/spec-kit/README.md`
- `docs/specs/README.md`
- `docs/API文档.md`

## 许可证

[MIT License](LICENSE)
