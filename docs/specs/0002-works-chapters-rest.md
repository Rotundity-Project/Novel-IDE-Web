# Feature Spec: Works/Chapters REST（作品与章节 CRUD）

## Meta
- ID: 0002
- Status: Implemented
- Last Updated: 2026-02-13

## 背景与目标
- 背景：Phase 1 的核心数据模型是“作品（Work）-章节（Chapter）”。
- 目标：提供最小 CRUD 与顺序调整能力，并维护统计字段（chapters_count/total_words）。
- 非目标：标签系统、全文索引、协作编辑、回收站与版本历史。

## 业务规则（不变量）
- 作品归属：Work 的 `userId` 必须等于当前登录用户。
- 章节归属：Chapter 必须属于某个 Work；访问/修改需校验该 Work 的 `userId`。
- 统计一致性：
  - 创建章节：`works.chapters_count + 1`
  - 删除章节：`works.chapters_count - 1` 且 `total_words -= chapter.wordCount`
  - 更新章节内容：若 `content` 变更，重新计算 `wordCount`，并将差值增量回写 `works.total_words`
- `wordCount` 计算：去除空白字符后计数（以当前实现为准）。

## API（Implemented）

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/v1/works | Yes | 作品列表（分页/排序） |
| POST | /api/v1/works | Yes | 创建作品 |
| GET | /api/v1/works/:id | Yes | 获取作品详情（含统计） |
| PATCH | /api/v1/works/:id | Yes | 更新作品 |
| DELETE | /api/v1/works/:id | Yes | 删除作品 |
| GET | /api/v1/works/:id/chapters | Yes | 章节列表（按 orderIndex） |
| POST | /api/v1/works/:id/chapters | Yes | 创建章节（事务维护 chaptersCount） |
| POST | /api/v1/works/:id/chapters/reorder | Yes | 批量重排 orderIndex |
| GET | /api/v1/chapters/:id | Yes | 获取章节 |
| PUT | /api/v1/chapters/:id | Yes | 更新章节（事务维护 totalWords） |
| DELETE | /api/v1/chapters/:id | Yes | 删除章节（事务维护统计） |

## 错误码
- `WORK_001`：作品不存在
- `WORK_002`：无权访问该作品
- `CHAPTER_001`：章节不存在
- `VALIDATION_001`：参数验证失败

## 验收标准
- 所有端点必须校验 `Authorization: Bearer`。
- 非归属用户访问作品/章节返回 403 + `WORK_002`。
- 删除章节后，作品的 `chapters_count` 与 `total_words` 与实际一致。
- reorder 传入的章节 ID 不完整/不属于该作品时返回 404 + `CHAPTER_001`。

## 验证方式
- 手动：创建作品→创建章节→更新章节内容→检查作品 totalWords 变化→删除章节。
- 自动化：后续应补充基于 spec 的集成测试（现阶段仅提供 health 冒烟）。

## 实现落点
- Next Route Handlers：
  - [works](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/app/app/api/v1/works/route.ts)
  - [works/[id]](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/app/app/api/v1/works/%5Bid%5D/route.ts)
  - [works/[id]/chapters](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/app/app/api/v1/works/%5Bid%5D/chapters/route.ts)
  - [works/[id]/chapters/reorder](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/app/app/api/v1/works/%5Bid%5D/chapters/reorder/route.ts)
  - [chapters/[id]](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/app/app/api/v1/chapters/%5Bid%5D/route.ts)
- DB Schema（server-core）：[schema.ts](file:///d:/./.Programs/.Program.Project/Novel-IDE-Web/packages/server-core/src/db/schema.ts)
