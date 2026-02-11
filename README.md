# Novel-IDE-Web

一个面向长篇小说创作的 Web 写作工作台，采用 IDE 风格界面，并提供 AI 协作写作能力。

## 当前技术栈（2026-02-11 更新）

### 前端
- **框架**: Next.js (App Router) + TypeScript
- **编辑器**: **Lexical** (`@lexical/react`) + 自定义小说写作插件
- **协同与本地优先**: Yjs + lexical-yjs + IndexedDB（离线草稿/自动恢复）
- **UI**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand（本地 UI/写作状态）+ TanStack Query（服务端状态）
- **实时通信**: SSE（AI 流式输出）+ WebSocket（协作/同步）

### 后端
- **运行时/框架**: Node.js + Fastify + TypeScript
- **数据库**: PostgreSQL
- **检索能力**: PostgreSQL FTS + `pgvector`（角色/设定语义检索）
- **缓存与任务**: Redis + BullMQ（长任务、导出、AI 后台任务）
- **认证**: Better Auth（替代 Clerk，便于自托管）
- **AI 抽象层**: Vercel AI SDK

### 为什么更适合小说写作
- **Lexical** 更容易做“章节/场景/角色引用”等领域插件
- **本地优先**降低断网和误操作导致的内容丢失风险
- **结构化内容模型**更适合版本历史、导出与 AI 精准改写
- **pgvector + FTS**让“按设定查上下文”与 AI 检索增强更可控

## 技术决策重点（规划阶段）
1. 编辑器核心确定为 Lexical（用于章节/场景/角色等结构化写作）。
2. 数据层采用 Yjs + IndexedDB 的本地优先设计。
3. 认证方案确定为 Better Auth（自托管优先）。
4. 数据库规划启用 pgvector 以支持语义检索。
5. AI 长任务与导出任务规划使用 BullMQ。
\n
## 文档索引
- `docs/设计文档.md`
- `docs/项目结构.md`
- `docs/项目路线图.md`

## 开发状态
当前仓库以架构与产品文档为主，代码实现正在按新技术栈推进。

## 许可证
[MIT License](LICENSE)


