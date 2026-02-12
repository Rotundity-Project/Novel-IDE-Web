# Spec-Kit（本仓库规格驱动开发方法）

本仓库采用“Spec-Kit”作为默认研发方法：先定义可验收的规格（spec），再实现与验证，最后把用户/技术文档与代码保持可追溯一致。

## 核心原则

1. 单一事实来源（Single Source of Truth）
   - 实现事实以代码与可运行配置为准。
   - 产品/接口/运行约定以 `docs/specs/**` 中的规格为准。
2. 可追溯（Traceability）
   - 每个 spec 必须能追溯到：实现入口（文件/模块）、验证方式（smoke/test）、以及影响的文档页面。
3. 以验收为中心（Acceptance-First）
   - spec 必须包含“验收标准/失败案例/边界条件”，避免只描述“怎么做”。
4. 变更可解释（Change is Documented）
   - 任何跨模块/跨边界的决策必须写 ADR（Architecture Decision Record）。
5. 规划与已实现严格分离
   - 文档中必须明确标注状态：Implemented / In-Progress / Planned / Deprecated。

## 目录约定

- `docs/specs/`：功能规格（Feature Specs），每个文件对应一个可交付能力。
- `docs/spec-kit/templates/`：规格与 ADR 模板。
- `docs/`：用户手册、架构说明、运行/部署指南等“面向读者的说明”，其内容应能回链到 specs。

## 生命周期（状态标签）

- Draft：初稿，允许不完整，但必须说明风险与未知点。
- Reviewed：已完成评审，接口/边界基本稳定。
- Accepted：允许进入实现；后续变更必须更新 spec/ADR。
- Implemented：实现与验收均已完成，文档对齐。
- Deprecated：被替代或废弃，保留原因与迁移路径。

## 工作流（最小闭环）

1. 写 spec：在 `docs/specs/` 创建新文件（可从模板复制）。
2. 评审：确认边界、接口、错误码、迁移与回滚策略。
3. 实现：代码变更必须在 spec 中补上实现落点链接。
4. 验证：至少提供一种可重复的验证方式（smoke 或测试）。
5. 文档同步：更新 README/API/部署/用户手册等相关页面。

## 与测试文件 `*.spec.ts` 的区别

这里的 “spec” 指产品/接口规格文件（markdown）。测试文件的 `*.spec.ts` 仅表示测试用例命名，与本方法论无直接关系。

## 一致性检查（Docs Drift Guard）

- API 文档对齐检查：`pnpm docs:check-api`（校验 `docs/API文档.md` 的端点清单与 `app/app/api/v1/**/route.ts` 一致）
