# Feature Spec: 本地开发与 Docker 一键启动

## Meta
- ID: 0003
- Status: Implemented
- Last Updated: 2026-02-13

## 背景与目标
- 背景：Phase 1 需要“新人开箱即用”的启动方式，避免常见 500（未迁移/连不上 DB）。
- 目标：提供一致的本地开发与 docker compose 启动链路；默认只依赖 Next（同源 API）+ Postgres (+ Redis)。
- 非目标：K8s 部署、生产级监控、自动扩缩容。

## 需求与约束
- 本地开发默认：`pnpm dev:app` 即可启动前端与 `/api/v1`。
- 复杂能力后端（Nest server）可选启动：`pnpm dev:server`。
- Docker：默认 `app + postgres + redis + migrate`；`server` 通过 `--profile complex` 按需启用。
- 数据库：迁移必须在 app 启动前完成。

## 验收标准
- `pnpm dev:app` 后 `/api/v1/health` 返回 `success: true`。
- docker compose 启动后，首次访问注册接口不应因“表不存在”失败。

## 验证方式
- 本地：`pnpm dev:app` + `pnpm smoke:next-api`。
- Docker：`docker compose -f docker/docker-compose.yml up --build -d`（默认不启用 server）。

## 实现落点
- 根脚本：见 [package.json](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/package.json)
- Compose：见 [docker-compose.yml](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/docker/docker-compose.yml)
- 冒烟脚本：见 [smoke-next-api.mjs](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/scripts/smoke-next-api.mjs)

## 已知限制
- 初始迁移使用 `gen_random_uuid()`，数据库需启用 `pgcrypto` 扩展（后续会在部署文档中明确）。
