# Novel-Studio-Web

一个面向长篇小说创作的 Web 写作工作台，采用 IDE 风格界面，并提供 AI 协作写作能力。

## 当前状态

仓库已从纯文档阶段进入 **Phase 1 可部署框架**：
- `app/`: Next.js (App Router) + TypeScript（Next.js 16）
- `server/`: Fastify + TypeScript
- `docker/docker-compose.yml`: PostgreSQL + Redis + app + server 一键编排
- `server/drizzle/`: Drizzle ORM 初始 schema

## 项目结构

```text
Novel-Studio-Web/
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

3. 启动服务（两个终端）

```bash
pnpm dev:server
pnpm dev:app
```

访问地址：
- 前端: http://localhost:3000
- 后端健康检查: http://localhost:3001/health
- 后端 API 健康检查: http://localhost:3001/api/v1/health

## Docker 部署

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml --env-file .env up --build -d
```

服务端口：
- app: `3000`
- server: `3001`
- postgres: `5432`
- redis: `6379`

## 重要文档

- `docs/设计文档.md`
- `docs/项目结构.md`
- `docs/部署文档.md`
- `docs/项目路线图.md`

## 许可证

[MIT License](LICENSE)
