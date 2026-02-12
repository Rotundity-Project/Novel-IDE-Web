# Feature Spec: Auth REST（注册/登录/刷新/登出）

## Meta
- ID: 0001
- Status: Implemented
- Last Updated: 2026-02-13

## 背景与目标
- 背景：Phase 1 需要最小可用的账号体系以保护用户数据与作品内容。
- 目标：提供 JWT Bearer 的注册/登录/刷新/登出闭环，并支持“撤销 refresh token”（全端登出）。
- 非目标：第三方 OAuth、邮箱验证、验证码、账户合并。

## 需求与约束
- 认证方式：`Authorization: Bearer <accessToken>`。
- Token 策略：access/refresh 两类 JWT；refresh token 额外绑定 `jti` 并写入 Redis，刷新时必须同时通过 JWT 校验与 Redis 校验。
- 响应格式：统一 `success/data/error`。

## API（Implemented）

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/v1/auth/register | No | 注册并返回 access+refresh |
| POST | /api/v1/auth/login | No | 登录并返回 access+refresh |
| POST | /api/v1/auth/refresh | No | 用 refresh 换取新的 access |
| POST | /api/v1/auth/logout | Yes | 撤销用户所有 refresh token |

## 错误码
- `AUTH_001`：Token 无效或已过期
- `AUTH_002`：用户名或密码错误
- `AUTH_003`：邮箱或用户名已被注册
- `AUTH_004`：Token 刷新失败
- `VALIDATION_001`：参数验证失败

## 安全与权限
- refresh token 撤销：
  - `refresh:<jti> -> userId`
  - `user_refresh_set:<userId> -> Set<jti>`
  - 登出时删除用户集合内所有 jti 对应的 refresh key。
- 开发环境：若 Redis 不可用，允许降级内存实现（refresh 撤销不持久化）。

## 验收标准
- 注册：重复邮箱/用户名返回 409 + `AUTH_003`。
- 登录：错误密码返回 401 + `AUTH_002`。
- 刷新：refresh JWT 有效但 Redis 中不存在/不匹配时返回 401 + `AUTH_004`。
- 登出：登出后所有旧 refresh 失效。

## 验证方式
- 手动：运行 `pnpm dev:app`，调用 `/api/v1/auth/*` 端点。
- 冒烟：`pnpm smoke:next-api`（健康检查）；Auth 建议后续补充 e2e/spec。

## 实现落点
- Next Route Handlers：
  - [register](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/app/app/api/v1/auth/register/route.ts)
  - [login](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/app/app/api/v1/auth/login/route.ts)
  - [refresh](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/app/app/api/v1/auth/refresh/route.ts)
  - [logout](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/app/app/api/v1/auth/logout/route.ts)
- 核心库（server-core）：
  - JWT：[@novel/server-core auth.jwt](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/packages/server-core/src/auth/jwt.ts)
  - refresh store：[@novel/server-core refresh-store](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/packages/server-core/src/auth/refresh-store.ts)
  - Redis 客户端：[@novel/server-core redis](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/packages/server-core/src/redis/index.ts)
