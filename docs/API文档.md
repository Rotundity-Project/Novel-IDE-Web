# Novel-IDE-Web API 文档

## 1. API 概述

### 1.1 基础信息
- **Base URL**: `https://api.novel-ide-web.com/api/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 1.2 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### 错误响应
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

### 1.3 HTTP 状态码
| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 无内容（删除成功） |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 数据验证失败 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 1.4 通用请求头
```
Content-Type: application/json
Authorization: Bearer {token}
Accept-Language: zh-CN
```

### 1.5 错误码表
| 错误码 | 说明 |
|--------|------|
| `AUTH_001` | Token 无效或已过期 |
| `AUTH_002` | 用户名或密码错误 |
| `AUTH_003` | 邮箱已被注册 |
| `AUTH_004` | Token 刷新失败 |
| `USER_001` | 用户不存在 |
| `WORK_001` | 作品不存在 |
| `WORK_002` | 无权访问该作品 |
| `CHAPTER_001` | 章节不存在 |
| `CHAPTER_002` | 章节顺序冲突 |
| `AGENT_001` | 智能体不存在 |
| `AI_001` | AI 服务不可用 |
| `AI_002` | 上下文超长 |
| `RATE_LIMIT_001` | 请求过于频繁 |
| `VALIDATION_001` | 参数验证失败 |

---

## 2. 认证模块 (Auth)

### 2.1 用户注册
**POST** `/auth/register`

**请求体**
```json
{
  "email": "user@example.com",
  "username": "novelist",
  "password": "SecurePassword123!"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "novelist",
      "avatarUrl": null,
      "createdAt": "2026-02-11T00:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 7200
    }
  }
}
```

### 2.2 用户登录
**POST** `/auth/login`

**请求体**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**响应** 同注册响应

### 2.3 刷新令牌
**POST** `/auth/refresh`

**请求体**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 7200
  }
}
```

### 2.4 登出
**POST** `/auth/logout`

**请求头**: 需要认证

**响应**
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 2.5 第三方登录回调
**GET** `/auth/callback/:provider`

**Query 参数**
- `code`: OAuth 授权码
- `state`: 状态值

**响应**: 重定向到前端，携带 token

---

## 3. 用户模块 (Users)

### 3.1 获取当前用户信息
**GET** `/users/me`

**认证**: 必需

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "novelist",
    "avatarUrl": "https://cdn.example.com/avatar.jpg",
    "settings": {
      "theme": "dark",
      "editor": {
        "fontSize": 16,
        "lineHeight": 1.8,
        "fontFamily": "serif"
      }
    },
    "stats": {
      "worksCount": 5,
      "totalWords": 150000,
      "aiCalls": 320
    },
    "createdAt": "2026-02-11T00:00:00Z"
  }
}
```

### 3.2 更新用户信息
**PATCH** `/users/me`

**认证**: 必需

**请求体**
```json
{
  "username": "novelist_v2",
  "avatarUrl": "https://cdn.example.com/new-avatar.jpg"
}
```

### 3.3 更新用户设置
**PUT** `/users/me/settings`

**认证**: 必需

**请求体**
```json
{
  "theme": "dark",
  "editor": {
    "fontSize": 18,
    "lineHeight": 2.0,
    "fontFamily": "Georgia"
  }
}
```

### 3.4 修改密码
**POST** `/users/me/password`

**认证**: 必需

**请求体**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

---

## 4. 作品模块 (Works)

### 4.1 获取作品列表
**GET** `/works`

**认证**: 必需

**Query 参数**
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）
- `sortBy`: 排序字段（`createdAt`, `updatedAt`, `title`）
- `order`: 排序方向（`asc`, `desc`）

**响应**
```json
{
  "success": true,
  "data": {
    "works": [
      {
        "id": "uuid",
        "title": "我的第一部小说",
        "description": "这是一个关于...",
        "coverUrl": "https://cdn.example.com/cover.jpg",
        "chaptersCount": 15,
        "totalWords": 45000,
        "updatedAt": "2026-02-11T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 4.2 创建作品
**POST** `/works`

**认证**: 必需

**请求体**
```json
{
  "title": "我的第一部小说",
  "description": "这是一个关于...",
  "coverUrl": null
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "我的第一部小说",
    "description": "这是一个关于...",
    "coverUrl": null,
    "userId": "user-uuid",
    "createdAt": "2026-02-11T00:00:00Z",
    "updatedAt": "2026-02-11T00:00:00Z"
  }
}
```

### 4.3 获取作品详情
**GET** `/works/:id`

**认证**: 必需

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "我的第一部小说",
    "description": "这是一个关于...",
    "coverUrl": "https://cdn.example.com/cover.jpg",
    "settings": {
      "defaultAgentId": "agent-uuid"
    },
    "stats": {
      "chaptersCount": 15,
      "totalWords": 45000,
      "charactersCount": 8
    },
    "createdAt": "2026-02-11T00:00:00Z",
    "updatedAt": "2026-02-11T00:00:00Z"
  }
}
```

### 4.4 更新作品
**PATCH** `/works/:id`

**认证**: 必需

**请求体**
```json
{
  "title": "新标题",
  "description": "新描述"
}
```

### 4.5 删除作品
**DELETE** `/works/:id`

**认证**: 必需

**响应**
```json
{
  "success": true,
  "message": "作品已删除"
}
```

### 4.6 获取作品的章节列表
**GET** `/works/:id/chapters`

**认证**: 必需

**响应**
```json
{
  "success": true,
  "data": {
    "chapters": [
      {
        "id": "uuid",
        "title": "第一章 开始",
        "orderIndex": 1,
        "wordCount": 3000,
        "updatedAt": "2026-02-11T00:00:00Z"
      }
    ]
  }
}
```

---

## 5. 章节模块 (Chapters)

### 5.1 创建章节
**POST** `/works/:workId/chapters`

**认证**: 必需

**请求体**
```json
{
  "title": "第一章 开始",
  "orderIndex": 1
}
```

### 5.2 获取章节内容
**GET** `/chapters/:id`

**认证**: 必需

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workId": "work-uuid",
    "title": "第一章 开始",
    "content": "正文内容...",
    "orderIndex": 1,
    "wordCount": 3000,
    "tags": ["动作", "对话"],
    "createdAt": "2026-02-11T00:00:00Z",
    "updatedAt": "2026-02-11T00:00:00Z"
  }
}
```

### 5.3 更新章节
**PUT** `/chapters/:id`

**认证**: 必需

**请求体**
```json
{
  "title": "第一章 新标题",
  "content": "新的正文内容...",
  "tags": ["动作", "对话", "情感"]
}
```

### 5.4 删除章节
**DELETE** `/chapters/:id`

**认证**: 必需

### 5.5 批量调整章节顺序
**POST** `/works/:workId/chapters/reorder`

**认证**: 必需

**请求体**
```json
{
  "orders": [
    {
      "chapterId": "uuid1",
      "orderIndex": 1
    },
    {
      "chapterId": "uuid2",
      "orderIndex": 2
    }
  ]
}
```

### 5.6 获取章节版本历史
**GET** `/chapters/:id/history`

**认证**: 必需

**Query 参数**
- `page`: 页码
- `limit`: 每页数量

**响应**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "uuid",
        "wordCount": 3000,
        "createdAt": "2026-02-11T00:00:00Z"
      }
    ]
  }
}
```

### 5.7 恢复到历史版本
**POST** `/chapters/:id/restore/:versionId`

**认证**: 必需

### 5.8 自动保存章节
**PATCH** `/chapters/:id/autosave`

**认证**: 必需

**请求体**
```json
{
  "content": "保存的内容..."
}
```

---

## 6. 角色模块 (Characters)

### 6.1 获取角色列表
**GET** `/works/:workId/characters`

**认证**: 必需

**响应**
```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": "uuid",
        "name": "张三",
        "description": "主角，勇敢善良",
        "avatarUrl": "https://cdn.example.com/char.jpg",
        "attributes": {
          "age": 25,
          "gender": "男",
          "personality": "勇敢、善良"
        },
        "createdAt": "2026-02-11T00:00:00Z"
      }
    ]
  }
}
```

### 6.2 创建角色
**POST** `/works/:workId/characters`

**认证**: 必需

**请求体**
```json
{
  "name": "张三",
  "description": "主角，勇敢善良",
  "avatarUrl": null,
  "attributes": {
    "age": 25,
    "gender": "男",
    "personality": "勇敢、善良"
  }
}
```

### 6.3 更新角色
**PUT** `/characters/:id`

**认证**: 必需

### 6.4 删除角色
**DELETE** `/characters/:id`

**认证**: 必需

---

## 7. AI 模块 (AI)

### 7.1 AI 续写
**POST** `/ai/continue`

**认证**: 必需

**请求体**
```json
{
  "chapterId": "uuid",
  "content": "当前内容...",
  "cursorPosition": 1000,
  "agentId": "agent-uuid",
  "modelId": "gpt-4-turbo",
  "options": {
    "length": 500,
    "creativity": 0.7,
    "includeContext": true
  }
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "taskId": "task-uuid",
    "message": "AI 续写任务已创建"
  }
}
```

### 7.2 AI 改写
**POST** `/ai/rewrite`

**认证**: 必需

**请求体**
```json
{
  "chapterId": "uuid",
  "selectedText": "需要改写的文本...",
  "rewriteType": "polish", // polish, expand, contract, style, fix
  "agentId": "agent-uuid",
  "modelId": "gpt-4-turbo",
  "options": {
    "style": "literary",
    "targetLength": null
  }
}
```

**改写类型**
- `polish`: 润色
- `expand`: 扩写
- `contract`: 精简
- `style`: 风格转换
- `fix`: 修正错误

### 7.3 AI 指令生成
**POST** `/ai/generate`

**认证**: 必需

**请求体**
```json
{
  "chapterId": "uuid",
  "prompt": "写一段关于主角与敌人战斗的场景",
  "agentId": "agent-uuid",
  "modelId": "gpt-4-turbo",
  "context": {
    "includePrevious": true,
    "includeCharacters": true,
    "includeWorldview": false
  }
}
```

### 7.4 AI 对话模式
**POST** `/ai/chat`

**认证**: 必需

**请求体**
```json
{
  "chapterId": "uuid",
  "messages": [
    {
      "role": "user",
      "content": "请给我一些关于下一章的情节建议"
    },
    {
      "role": "assistant",
      "content": "根据当前情节..."
    }
  ],
  "agentId": "agent-uuid",
  "modelId": "gpt-4-turbo"
}
```

### 7.5 AI 内容分析
**POST** `/ai/analyze`

**认证**: 必需

**请求体**
```json
{
  "content": "需要分析的内容...",
  "analysisType": "consistency" // consistency, style, pacing, character
}
```

**分析类型**
- `consistency`: 逻辑一致性
- `style`: 文风分析
- `pacing`: 节奏分析
- `character`: 角色塑造

**响应**
```json
{
  "success": true,
  "data": {
    "summary": "分析总结",
    "issues": [
      {
        "type": "warning",
        "message": "前后文有矛盾",
        "location": "paragraph 3",
        "suggestion": "建议修改..."
      }
    ],
    "metrics": {
      "score": 85,
      "details": {}
    }
  }
}
```

### 7.6 AI 获取可用模型
**GET** `/ai/models`

**认证**: 必需

**响应**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "gpt-4-turbo",
        "name": "GPT-4 Turbo",
        "provider": "openai",
        "contextWindow": 128000,
        "pricing": {
          "input": 0.01,
          "output": 0.03
        }
      },
      {
        "id": "claude-3-opus",
        "name": "Claude 3 Opus",
        "provider": "anthropic",
        "contextWindow": 200000,
        "pricing": {
          "input": 0.015,
          "output": 0.075
        }
      }
    ]
  }
}
```

### 7.7 获取 AI 使用统计
**GET** `/ai/stats`

**认证**: 必需

**Query 参数**
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应**
```json
{
  "success": true,
  "data": {
    "totalCalls": 320,
    "totalTokens": {
      "input": 150000,
      "output": 80000
    },
    "totalCost": 12.5,
    "byModel": {
      "gpt-4-turbo": {
        "calls": 200,
        "tokens": 150000,
        "cost": 8.0
      }
    },
    "byDate": [
      {
        "date": "2026-02-10",
        "calls": 45,
        "tokens": 12000,
        "cost": 1.2
      }
    }
  }
}
```

---

## 8. 智能体模块 (Agents)

### 8.1 获取智能体列表
**GET** `/agents`

**认证**: 必需

**Query 参数**
- `type`: 类型（`all`, `builtin`, `custom`, `public`）
- `category`: 分类

**响应**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "uuid",
        "name": "科幻小说专家",
        "description": "专注于科幻小说创作",
        "category": "genre",
        "isBuiltin": true,
        "isPublic": true,
        "stats": {
          "usage": 1250,
          "rating": 4.8
        }
      }
    ]
  }
}
```

### 8.2 获取智能体详情
**GET** `/agents/:id`

**认证**: 必需

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "科幻小说专家",
    "description": "专注于科幻小说创作",
    "category": "genre",
    "systemPrompt": "你是一个专业的科幻小说写作助手...",
    "behavior": {
      "creativity": 0.8,
      "formality": 0.5,
      "detailLevel": 0.7
    },
    "knowledge": ["科学知识", "未来科技", "宇宙探索"],
    "examples": [
      "example 1...",
      "example 2..."
    ],
    "modelPreference": "gpt-4-turbo",
    "isBuiltin": true,
    "isPublic": true,
    "userId": null,
    "stats": {
      "usage": 1250,
      "rating": 4.8
    },
    "createdAt": "2026-02-11T00:00:00Z",
    "updatedAt": "2026-02-11T00:00:00Z"
  }
}
```

### 8.3 创建自定义智能体
**POST** `/agents`

**认证**: 必需

**请求体**
```json
{
  "name": "我的写作助手",
  "description": "专为我定制的写作助手",
  "category": "custom",
  "systemPrompt": "你是一个专业的写作助手...",
  "behavior": {
    "creativity": 0.7,
    "formality": 0.6,
    "detailLevel": 0.8
  },
  "knowledge": ["武侠", "古代"],
  "examples": [],
  "modelPreference": "gpt-4-turbo",
  "isPublic": false
}
```

### 8.4 更新智能体
**PUT** `/agents/:id`

**认证**: 必需

### 8.5 删除智能体
**DELETE** `/agents/:id`

**认证**: 必需

### 8.6 分享智能体
**POST** `/agents/:id/share`

**认证**: 必需

**响应**
```json
{
  "success": true,
  "data": {
    "shareUrl": "https://novel-ide-web.com/agents/uuid",
    "shareCode": "ABC123"
  }
}
```

### 8.7 导入智能体
**POST** `/agents/import`

**认证**: 必需

**请求体**
```json
{
  "shareCode": "ABC123"
}
```

---

## 9. 导出模块 (Export)

### 9.1 导出章节
**POST** `/export/chapter/:id`

**认证**: 必需

**请求体**
```json
{
  "format": "pdf", // md, txt, pdf, epub, docx
  "options": {
    "includeTitle": true,
    "includeMetadata": true
  }
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.example.com/exports/file.pdf",
    "expiresAt": "2026-02-11T01:00:00Z"
  }
}
```

### 9.2 导出作品
**POST** `/export/work/:id`

**认证**: 必需

**请求体**
```json
{
  "format": "epub",
  "options": {
    "includeCover": true,
    "includeMetadata": true,
    "chapters": ["uuid1", "uuid2"] // 空数组表示全部章节
  }
}
```

---

## 10. 搜索模块 (Search)

### 10.1 全文搜索
**GET** `/search`

**认证**: 必需

**Query 参数**
- `q`: 搜索关键词
- `type`: 类型（`all`, `works`, `chapters`, `characters`）
- `workId`: 限制在指定作品中

**响应**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "chapter",
        "id": "uuid",
        "title": "第一章",
        "snippet": "...关键词...",
        "workId": "work-uuid"
      }
    ]
  }
}
```

---

## 11. WebSocket API

### 11.1 连接
```
wss://api.novel-ide-web.com/ws
```

**连接参数**
- `token`: JWT token

### 11.2 事件列表

#### AI 流式输出
**客户端发送**
```json
{
  "event": "ai:generate",
  "data": {
    "taskId": "task-uuid"
  }
}
```

**服务端推送**
```json
{
  "event": "ai:chunk",
  "data": {
    "taskId": "task-uuid",
    "chunk": "生成的内容片段...",
    "isComplete": false
  }
}
```

```json
{
  "event": "ai:complete",
  "data": {
    "taskId": "task-uuid",
    "result": "完整结果...",
    "tokensUsed": {
      "input": 1000,
      "output": 500
    }
  }
}
```

```json
{
  "event": "ai:error",
  "data": {
    "taskId": "task-uuid",
    "error": "错误信息"
  }
}
```

#### 实时协作（未来）
```json
{
  "event": "collab:cursor",
  "data": {
    "userId": "user-uuid",
    "chapterId": "chapter-uuid",
    "position": 1500
  }
}
```

```json
{
  "event": "collab:edit",
  "data": {
    "userId": "user-uuid",
    "chapterId": "chapter-uuid",
    "operation": "insert",
    "text": "插入的内容",
    "position": 1500
  }
}
```

---

## 12. 文件上传

### 12.1 上传封面
**POST** `/upload/cover`

**认证**: 必需

**请求类型**: `multipart/form-data`

**响应**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/covers/xxx.jpg",
    "filename": "cover.jpg",
    "size": 102400
  }
}
```

---

## 13. 管理员 API (Admin)

### 13.1 系统统计
**GET** `/admin/stats`

**认证**: 管理员

**响应**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "active": 250,
      "newToday": 10
    },
    "works": {
      "total": 500,
      "published": 100
    },
    "ai": {
      "totalCalls": 50000,
      "totalTokens": 25000000,
      "totalCost": 2000
    }
  }
}
```

---

## 14. 限流规则

| API 路径 | 限制 | 时间窗口 |
|----------|------|----------|
| `/auth/*` | 5 次 | 1 分钟 |
| `/ai/*` | 20 次 | 1 分钟 |
| 其他 API | 100 次 | 1 分钟 |

---

## 15. Webhook（未来）

用于集成第三方服务：

```json
{
  "event": "work.published",
  "data": {
    "workId": "uuid",
    "userId": "uuid",
    "timestamp": "2026-02-11T00:00:00Z"
  }
}
```

---

**文档版本**: v1.0
**最后更新**: 2026-02-11
