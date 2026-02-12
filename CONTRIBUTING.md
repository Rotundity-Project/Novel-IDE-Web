# Novel-IDE-Web 贡献指南

感谢你对 Novel-IDE-Web 的关注！我们欢迎任何形式的贡献。

## 1. 如何贡献

### 1.1 报告 Bug

在提交 Issue 前，请先搜索现有 Issue，确认问题未被报告。

Bug 报告应包含：
- 清晰的标题和描述
- 重现步骤
- 预期行为
- 实际行为
- 环境信息（操作系统、浏览器版本等）
- 截图或错误日志（如适用）

**Bug 报告模板**：
```markdown
### 问题描述
简要描述问题

### 复现步骤
1. 打开 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

### 预期行为
描述你期望发生的情况

### 实际行为
描述实际发生的情况

### 环境信息
- 操作系统: [例如 Windows 11]
- 浏览器: [例如 Chrome 120]
- 版本: [例如 v1.0.0]

### 截图
如有必要，添加截图说明问题
```

### 1.2 提出功能建议

在提交功能建议前，请先讨论大功能改动，避免做重复工作。

功能建议应包含：
- 清晰的功能描述
- 使用场景
- 预期收益
- 实现思路（可选）

### 1.3 提交代码

#### 开发流程

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆你的 Fork**
   ```bash
   git clone https://github.com/your-username/Novel-IDE-Web.git
   cd Novel-IDE-Web
   ```

3. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/original-owner/Novel-IDE-Web.git
   ```

4. **创建新分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **先写规格（Spec-Kit）**
   - 在 `docs/specs/` 新增或更新对应 spec（可从 `docs/spec-kit/templates/feature-spec.md` 复制）
   - spec 至少包含：目标/约束/验收标准/验证方式

6. **进行开发**
   ```bash
   pnpm install

   # 默认：只启动 Next（同源 /api/v1）
   pnpm dev:app

   # 可选：仅当需要复杂能力服务时启动 Nest 后端
   pnpm dev:server
   ```

7. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

8. **推送到你的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **创建 Pull Request**
   - 在 GitHub 上创建 Pull Request
   - 填写 PR 模板
   - 必须在 PR 描述中链接对应 spec（`docs/specs/...`）
   - 等待代码审查

10. **同步上游更新**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   git push origin main
   ```

#### 代码规范

请遵循以下规范：
- [TypeScript](docs/开发规范.md#1-typescript-规范)
- [React](docs/开发规范.md#12-react-规范)
- [Git](docs/开发规范.md#2-git-规范)
- [样式](docs/开发规范.md#13-样式规范)

#### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：
- `feat`: 新功能
- `fix`: bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具

**示例**：
```
feat(editor): 添加 AI 续写功能

- 集成 OpenAI API
- 实现流式输出
- 添加停止生成按钮

Closes #123
```

### 1.4 改进文档

文档是项目的重要组成部分，欢迎改进：
- 修正错误
- 添加示例
- 翻译文档
- 补充缺失内容

## 2. 开发环境设置

### 2.1 前置要求

- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 15
- Redis >= 7

### 2.2 安装依赖

```bash
pnpm install
```

### 2.3 配置环境变量

```bash
# 复制环境变量模板
cp server/.env.example server/.env
cp app/.env.example app/.env.local

# 编辑配置
vim server/.env
vim app/.env.local
```

### 2.4 数据库初始化

```bash
pnpm --filter server db:migrate
```

### 2.5 启动开发服务器

```bash
# 默认：只启动 Next（同源 /api/v1）
pnpm dev:app
```

## 3. 运行测试

### 3.1 当前可用的验证命令（Implemented）

```bash
pnpm typecheck
pnpm smoke:next-api
pnpm build
```

### 3.2 测试规划（Planned）
- 单元测试/集成测试/e2e 将按 `docs/specs/**` 的验收标准逐步补齐。

## 4. 代码审查

### 4.1 审查要点

- 代码符合规范
- 没有引入新警告
- 测试覆盖充分
- 文档更新完整
- 没有安全漏洞

### 4.2 审查流程

1. 自动检查：CI 运行测试
2. 同行审查：至少一人审查
3. 修改反馈：根据反馈修改代码
4. 合并批准：审查通过后合并

## 5. 行为准则

### 5.1 我们的承诺

为了营造开放和友好的环境，我们承诺：

- 尊重不同观点和经验
- 接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 5.2 不可接受的行为

- 使用性化的语言或图像
- 人身攻击或侮辱
- 公开或私下骚扰
- 未经许可发布他人的隐私信息
- 其他不道德或不专业行为

### 5.3 举报违规

如果你遇到违规行为，请联系项目维护者。

## 6. 获取帮助

- 📖 [文档](docs/)
- 🐛 [Issue Tracker](https://github.com/your-username/Novel-IDE-Web/issues)
- 💬 [Discussions](https://github.com/your-username/Novel-IDE-Web/discussions)

## 7. 许可证

贡献的代码将采用与项目相同的许可证（MIT）。

---

再次感谢你的贡献！
