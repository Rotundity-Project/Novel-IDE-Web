# Novel-IDE-Web API 文档

> Status: Implemented（本文件仅描述当前已实现的 `/api/v1/**` 端点；规划能力单独标注 Planned）

## 1. 概述

### 1.1 Base URL
- 本地开发：`http://localhost:3000/api/v1`
- Docker（单机）：`http://localhost:3000/api/v1`

说明：
- `/api/v1/**` 由 Next.js Route Handlers 提供（同源），不依赖独立 REST 后端服务。
- 可选 `server/`（NestJS）定位为复杂能力服务（WebSocket/队列/worker 等），不承载本文件列出的 REST 端点。

### 1.2 认证方式
- Access Token：`Authorization: Bearer <accessToken>`
- Refresh Token：作为 body 字段 `refreshToken` 传入刷新接口

### 1.3 通用响应格式

成功响应：
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

错误响应：
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息描述",
    "details": {}
  }
}
```

### 1.4 HTTP 状态码
| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

### 1.5 错误码表（Implemented）

错误码以 `packages/server-core` 为单一事实来源：
- `AUTH_001` Token 无效或已过期
- `AUTH_002` 用户名或密码错误
- `AUTH_003` 邮箱或用户名已被注册
- `AUTH_004` Token 刷新失败
- `USER_001` 用户不存在
- `WORK_001` 作品不存在
- `WORK_002` 无权访问该作品
- `CHAPTER_001` 章节不存在
- `CHAPTER_002` 章节顺序冲突（预留）
- `VALIDATION_001` 参数验证失败
- `RATE_LIMIT_001` 请求过于频繁（预留）
- `INTERNAL_001` 服务器内部错误
- `NOT_FOUND_001` 资源不存在

关联 specs：
- [0001-auth-rest.md](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/docs/specs/0001-auth-rest.md)
- [0002-works-chapters-rest.md](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/docs/specs/0002-works-chapters-rest.md)

---

## 2. Health

### 2.1 健康检查
**GET** `/health`

响应：
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-02-13T00:00:00.000Z",
    "uptime": 123.45
  }
}
```

---

## 3. Auth

### 3.1 用户注册
**POST** `/auth/register`

请求体：
```json
{
  "email": "user@example.com",
  "username": "novelist",
  "password": "SecurePassword123!"
}
```

响应（201）：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "novelist",
      "avatarUrl": null,
      "createdAt": "2026-02-13T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 7200
    }
  }
}
```

### 3.2 用户登录
**POST** `/auth/login`

请求体：
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

响应（200）：同注册响应结构。

### 3.3 刷新 access token
**POST** `/auth/refresh`

请求体：
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

响应（200）：
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 7200
  }
}
```

### 3.4 登出（撤销 refresh tokens）
**POST** `/auth/logout`

请求头：需要认证
```
Authorization: Bearer <accessToken>
```

响应（200）：
```json
{
  "success": true,
  "data": {},
  "message": "登出成功"
}
```

---

## 4. Users

### 4.1 获取当前用户信息
**GET** `/users/me`

请求头：需要认证

响应（200）：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "novelist",
    "avatarUrl": null,
    "settings": {
      "theme": "dark",
      "editor": {
        "fontSize": 16,
        "lineHeight": 1.8,
        "fontFamily": "serif"
      }
    },
    "stats": {
      "worksCount": 0,
      "totalWords": 0,
      "aiCalls": 0
    },
    "createdAt": "2026-02-13T00:00:00.000Z"
  }
}
```

---

## 5. Works

### 5.1 作品列表
**GET** `/works`

Query 参数：
- `page` number（默认 1）
- `limit` number（默认 20，最大 100）
- `sortBy` enum：`createdAt | updatedAt | title`（默认 `updatedAt`）
- `order` enum：`asc | desc`（默认 `desc`）

响应（200）：
```json
{
  "success": true,
  "data": {
    "works": [
      {
        "id": "uuid",
        "title": "我的作品",
        "description": null,
        "coverUrl": null,
        "chaptersCount": 0,
        "totalWords": 0,
        "updatedAt": "2026-02-13T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 5.2 创建作品
**POST** `/works`

请求体：
```json
{
  "title": "我的作品",
  "description": "简介（可选）",
  "coverUrl": null
}
```

响应（201）：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "我的作品",
    "description": "简介（可选）",
    "coverUrl": null,
    "userId": "uuid",
    "createdAt": "2026-02-13T00:00:00.000Z",
    "updatedAt": "2026-02-13T00:00:00.000Z"
  }
}
```

### 5.3 获取作品详情
**GET** `/works/{id}`

响应（200）：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "我的作品",
    "description": null,
    "coverUrl": null,
    "settings": {
      "defaultAgentId": null
    },
    "stats": {
      "chaptersCount": 0,
      "totalWords": 0,
      "charactersCount": 0
    },
    "createdAt": "2026-02-13T00:00:00.000Z",
    "updatedAt": "2026-02-13T00:00:00.000Z"
  }
}
```

### 5.4 更新作品
**PATCH** `/works/{id}`

请求体（至少一个字段）：
```json
{
  "title": "新标题",
  "description": "新简介"
}
```

响应（200）：返回更新后的作品（结构同创建作品）。

### 5.5 删除作品
**DELETE** `/works/{id}`

响应（200）：
```json
{
  "success": true,
  "data": {},
  "message": "作品已删除"
}
```

---

## 6. Chapters

### 6.1 章节列表（按 orderIndex）
**GET** `/works/{id}/chapters`

响应（200）：
```json
{
  "success": true,
  "data": {
    "chapters": [
      {
        "id": "uuid",
        "title": "第一章",
        "orderIndex": 0,
        "wordCount": 0,
        "updatedAt": "2026-02-13T00:00:00.000Z"
      }
    ]
  }
}
```

### 6.2 创建章节
**POST** `/works/{id}/chapters`

请求体：
```json
{
  "title": "第一章",
  "orderIndex": 0
}
```

响应（201）：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workId": "uuid",
    "title": "第一章",
    "content": null,
    "orderIndex": 0,
    "wordCount": 0,
    "tags": [],
    "createdAt": "2026-02-13T00:00:00.000Z",
    "updatedAt": "2026-02-13T00:00:00.000Z"
  }
}
```

### 6.3 批量重排章节顺序
**POST** `/works/{id}/chapters/reorder`

请求体：
```json
{
  "orders": [
    { "chapterId": "uuid", "orderIndex": 0 }
  ]
}
```

响应（200）：
```json
{
  "success": true,
  "data": {}
}
```

### 6.4 获取章节
**GET** `/chapters/{id}`

响应（200）：返回章节详情（结构同创建章节响应）。

### 6.5 更新章节
**PUT** `/chapters/{id}`

请求体（至少一个字段）：
```json
{
  "title": "新标题",
  "content": "正文（可为空或 null）",
  "tags": []
}
```

响应（200）：返回更新后的章节（结构同创建章节响应）。

### 6.6 删除章节
**DELETE** `/chapters/{id}`

响应（200）：
```json
{
  "success": true,
  "data": {}
}
```

---

## 7. Planned（不应被客户端依赖）

以下内容为规划稿，当前仓库未实现：
- AI 任务化与 SSE 流式接口
- 协作编辑 WebSocket
- 后台任务队列/独立 worker
- 智能体管理与 LLM 适配层
